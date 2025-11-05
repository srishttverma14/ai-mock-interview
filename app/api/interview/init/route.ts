import { NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Interview from "@/lib/models/interview.model";

export async function POST(req: Request) {
  try {
    await connectToDB();
    const { interviewId } = await req.json();

    if (!interviewId) {
      return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // If transcript exists, return it; otherwise, generate a default welcome
    let transcript = interview.transcript || [];

    // Fallback welcome + first question if empty
    if (transcript.length === 0) {
      transcript = [
        {
          speaker: "AI",
          text: `👋 Hello! Welcome to your mock interview for the position of ${interview.jobRole}.
Let's get started. Here's your first question:\n\n${interview.firstQuestion || "Can you introduce yourself briefly?"}`,
        },
      ];

      // Save it to the DB for consistency
      interview.transcript = transcript;
      await interview.save();
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("Error in /api/interview/init:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
