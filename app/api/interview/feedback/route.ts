import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Interview from "@/lib/models/interview.model";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { interviewId } = await req.json();

    await connectToDB();

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.feedback) {
      // Return existing feedback if it has already been generated
      return NextResponse.json({ feedback: interview.feedback });
    }

    const transcriptText = interview.transcript
      .map((entry: { speaker: string; text: string }) => `${entry.speaker}: ${entry.text}`)
      .join("\n");

    // --- UPDATED PROMPT ---
    // This prompt now asks for JSON that EXACTLY matches your FeedbackSchema
    const prompt = `
You are a senior technical interviewer. Analyze the following interview transcript for a ${interview.jobRole} position.

INTERVIEW TRANSCRIPT:
${transcriptText}

---
TASK:
Provide a detailed evaluation of the candidate's performance based *only* on their answers in the transcript.

1.  **Technical Score (0-10):** Rate their technical accuracy and depth.
2.  **Communication Score (0-10):** Rate their clarity and ability to explain concepts.
3.  **Problem-Solving Score (0-10):** Rate their analytical skills and approach to problems.
4.  **Strengths:** Provide a single-line string of key strengths, separated by commas (e.g., "Strong grasp of React hooks, clear explanations").
5.  **Areas for Improvement:** Provide a single-line string of weaknesses, separated by commas (e.g., "Needs more depth in database concepts, struggled with async logic").
6.  **Overall Feedback:** Write a concise 2-3 sentence summary of their performance.

Return **only valid JSON** in this exact format:
{
  "technicalScore": number,
  "communicationScore": number,
  "problemSolvingScore": number,
  "overallFeedback": "string",
  "strengths": "string",
  "areasForImprovement": "string"
}
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        // --- ADDED: This forces the model to return valid JSON ---
        response_format: { "type": "json_object" },
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      // Handle API errors (e.g., out of credits, model not available)
      const errorData = await response.json();
      console.error("OpenRouter API Error:", errorData);
      throw new Error("Failed to fetch from OpenRouter");
    }

    const data = await response.json();
    const aiText = data?.choices?.[0]?.message?.content;

    if (!aiText) {
      throw new Error("AI returned an empty response.");
    }

    // --- SIMPLIFIED PARSING ---
    // With response_format: "json_object", we can parse directly.
    let feedback;
    try {
      feedback = JSON.parse(aiText);
    } catch (err) {
      console.error("Failed to parse AI feedback JSON, even with JSON mode:", err);
      console.log("Raw AI Text:", aiText);
      throw new Error("AI returned invalid JSON.");
    }

    // Save the correctly formatted feedback
    interview.feedback = feedback;
    await interview.save();

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("Error in /api/interview/feedback:", err);
    // Send back the specific error message
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate AI feedback" },
      { status: 500 }
    );
  }
}