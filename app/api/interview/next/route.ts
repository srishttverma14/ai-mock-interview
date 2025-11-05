import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectToDB from "@/lib/db";
import Interview, { IInterview } from "@/lib/models/interview.model";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDB();
    const { interviewId, lastAnswer, concludeInterview } = await request.json();
    if (!interviewId)
      return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });

    const interview: IInterview | null = await Interview.findById(interviewId);
    if (!interview)
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });

    if (lastAnswer && lastAnswer.trim()) {
      interview.transcript.push({ speaker: "User", text: lastAnswer });
    }

    const aiQuestionsCount = interview.transcript.filter(
      (t: any) =>
        t.speaker === "AI" && !t.text.includes("This concludes our interview")
    ).length;

    const isPlanMissing =
      (!interview.codingQuestionPlan || interview.codingQuestionPlan.length === 0) &&
      (!interview.projectQuestionPlan || interview.projectQuestionPlan.length === 0);

    if (isPlanMissing) {
      const totalQuestions = 10;
      // --- UPDATED: Set fixed counts ---
      const codingCount = 2; // 2 coding questions
      const resumeQuestionCount = interview.resumeText ? 4 : 0; // 4 resume questions
      // The remaining 4 will be general technical questions
      // ---------------------------------

      const plannedPositions = new Set<number>();
      const codingPositions = new Set<number>();
      const resumePositions = new Set<number>(); // Using the 'projectQuestionPlan' field

      // Generate coding question positions (Qs 2-9)
      while (codingPositions.size < codingCount) {
        const pos = Math.floor(Math.random() * (totalQuestions - 2)) + 2; // Qs 2-9
        if (!plannedPositions.has(pos)) {
          plannedPositions.add(pos);
          codingPositions.add(pos);
        }
      }

      // Generate resume question positions (Qs 2-9, no overlap)
      while (resumePositions.size < resumeQuestionCount) {
        const pos = Math.floor(Math.random() * (totalQuestions - 2)) + 2; // Qs 2-9
        if (!plannedPositions.has(pos)) {
          plannedPositions.add(pos);
          resumePositions.add(pos);
        }
      }

      interview.codingQuestionPlan = Array.from(codingPositions).sort((a, b) => a - b);
      interview.projectQuestionPlan = Array.from(resumePositions).sort((a, b) => a - b);
      
      await interview.save(); 
    }

    if (concludeInterview || aiQuestionsCount >= 10) {
      const endText =
        "Thank you. This concludes our interview. I will now provide feedback.";
      interview.transcript.push({ speaker: "AI", text: endText });
      await interview.save();
      return NextResponse.json({
        aiText: endText,
        isCodingQuestion: false,
        isEnd: true,
      });
    }
    
    const recentTranscript = interview.transcript
      .slice(-10)
      .map((t: any) => `${t.speaker}: ${t.text}`)
      .join("\n");

    const nextQuestionIndex = aiQuestionsCount + 1;
    const isCodingQuestion = interview.codingQuestionPlan.includes(nextQuestionIndex);
    const isResumeQuestion = interview.projectQuestionPlan.includes(nextQuestionIndex);

    let resumeContext = "";
    if (interview.resumeText) {
      resumeContext = `
---
CANDIDATE'S RESUME (for context):
${interview.resumeText}
---
`;
    }

    let prompt = "";
    // --- UPDATED: General Resume Question Prompt ---
    if (isResumeQuestion && interview.resumeText) {
      prompt = `
You are an AI technical interviewer. Your SOLE task is to ask ONE question based on the candidate's resume provided below.
The question can be about a specific project, a skill listed, or a past work experience.

CANDIDATE'S RESUME:
${interview.resumeText} 

Recent conversation:
${recentTranscript}

Instructions:
1. Pick ONE relevant item from the resume (project, skill, or experience).
2. Ask a specific, open-ended question about it. 
   - Example (Project): "On your resume, you listed the 'E-commerce Platform' project. Can you walk me through the technical challenges you faced?"
   - Example (Skill): "I see you listed 'Python' on your resume. Can you describe a complex task you automated using it?"
   - Example (Experience): "In your role at [Company], you mentioned 'optimizing APIs'. What was your process for that?"
3. DO NOT ask a generic technical or coding question. The question MUST be about the resume.
4. **CRITICAL:** The "Recent conversation" is provided. DO NOT ask about a topic, project, or skill that is already mentioned in that conversation. Pick a NEW topic from the resume.
5. Keep the question direct and concise.
`;
    } else {
      // This is the logic for general technical or coding questions
      const role = interview.jobRole?.toLowerCase() || "";
      let focus = "";

      if (isCodingQuestion) {
        // Coding Question
        if (role.includes("frontend")) focus = "JavaScript or React coding tasks involving arrays, event handling, or component logic";
        else if (role.includes("backend")) focus = "coding problems on data structures, asynchronous programming, or API logic using Node.js or JavaScript";
        else focus = "general coding problems involving loops, arrays, or string algorithms";
      } else {
        // General Technical Question (the default)
        if (role.includes("frontend")) focus = "HTML, CSS, JavaScript, React.js, rendering lifecycle, optimization, and UI logic";
        else if (role.includes("backend")) focus = "Node.js, Express, databases (SQL/NoSQL), authentication, APIs, and scalability";
        else focus = "core CS topics like OS, DBMS, CN, and OOPs principles";
      }

      prompt = `
You are an AI technical interviewer for the role of ${interview.jobRole}.
You must ensure the tone is professional, concise, and context-aware.
${resumeContext} 

Recent conversation:
${recentTranscript}

Instructions:
1. Briefly acknowledge the candidate’s previous answer (1-2 lines).
2. Ask the next ${isCodingQuestion ? "CODING" : "GENERAL TECHNICAL"} question.
3. Question Focus: ${focus}.
4. **CRITICAL:** This is a technical or coding question. DO NOT ask a question about the candidate's resume (projects, past experience, etc.).
5. Keep it a clear, single, direct question. Avoid HR-style questions.
`;
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    let aiMessage = "Could not generate AI response.";

    try {
      const aiRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 350,
        }),
      });

      const data = await aiRes.json();
      aiMessage = data.choices?.[0]?.message?.content?.trim() || aiMessage;
    } catch (err) {
      console.error("Error generating AI response:", err);
    }
    
    aiMessage = aiMessage.replace(/^AI\s*:\s*/i, "").replace(/^Assistant\s*:\s*/i, "").replace(/^[\s"'“”‘’`*]+|[\s"'“”‘’`*]+$/g, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]*)`/g, "$1").replace(/\s+/g, " ").trim();
    
    interview.transcript.push({ speaker: "AI", text: aiMessage });
    await interview.save();

    return NextResponse.json({ aiText: aiMessage, isCodingQuestion });
  } catch (error) {
    console.error("Error continuing interview:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

