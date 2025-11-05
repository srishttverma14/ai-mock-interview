import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectToDB from "@/lib/db";
import Interview from "@/lib/models/interview.model";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const { jobRole, skills, experience, resumeText } = await request.json();

    const newInterview = new Interview({
      userId: user.id,
      jobRole,
      skills,
      experience,
      resumeText: resumeText, // <-- Save the parsed text
      transcript: [],
      feedback: null,
    });

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

    let resumeContext = "";
    if (resumeText) {
      resumeContext = `
---
CANDIDATE'S RESUME:
${resumeText} 
---
`; // <-- Removed .substring()
    }

    const prompt = `You are an AI interviewer for a ${jobRole} role.
The candidate has skills in ${skills} and ${experience} of experience.
${resumeContext}
Based on all this information (especially the resume if provided), start the interview by asking the first relevant technical question.
Ask ONE question only. Do not ask "Are you ready?" or "Tell me about yourself". Just ask the first technical question.`;

    let aiMessage = "Welcome! Let's begin.";

    try {
      const aiRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // or your preferred model
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await aiRes.json();
      aiMessage = data.choices?.[0]?.message?.content || aiMessage;
    } catch (err) {
      console.error("Error generating first AI question:", err);
    }

    newInterview.transcript.push({ speaker: "AI", text: aiMessage });
    await newInterview.save();

    return NextResponse.json(
      {
        message: "Interview created successfully",
        interviewId: newInterview._id,
        firstQuestion: aiMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}