"use client";
import { useEffect, useState } from "react";
import Header from "@/app/components/Header"; // Reverted to original import path
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Brain, Mic, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// --- UPDATED: Interface to match the component's state ---
// We will transform the API response into this structure
interface DisplayFeedback {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallFeedback: string;
  strengths: string[]; // We will convert the comma-separated string to an array
  areasForImprovement: string[]; // We will convert the comma-separated string to an array
}

export default function FeedbackPage({
  params,
}: {
  params: { interviewId: string };
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<DisplayFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch("/api/interview/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId: params.interviewId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch feedback");

        if (data.feedback) {
          // --- UPDATED: Transform API data to fit our interface ---
          const apiFeedback = data.feedback;
          setFeedback({
            technicalScore: apiFeedback.technicalScore,
            communicationScore: apiFeedback.communicationScore,
            problemSolvingScore: apiFeedback.problemSolvingScore,
            overallFeedback: apiFeedback.overallFeedback,
            // Split comma-separated strings into arrays
            // .filter(Boolean) removes any empty strings if there are trailing commas
            strengths: apiFeedback.strengths.split(',').map((s: string) => s.trim()).filter(Boolean),
            areasForImprovement: apiFeedback.areasForImprovement.split(',').map((s: string) => s.trim()).filter(Boolean),
          });
          // --------------------------------------------------------
        } else {
          setError("No feedback available yet.");
        }
      } catch (err: any) {
        setError(err.message || "Error loading feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [params.interviewId]);

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Header transparent/>
         <div className="flex flex-col items-center justify-center p-8">
           {/* Improved Loading Spinner */}
           <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
           <p className="text-lg">Analyzing your answers and generating feedback...</p>
           <style jsx>{`
            .loader {
              border-top-color: #3498db;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
           `}</style>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <p className="p-8 text-red-500">⚠️ {error}</p>
      </div>
    );

  if (!feedback)
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <p className="p-8">No feedback found for this interview.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Header with title and back button */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Interview Feedback</h1>
          <Button onClick={() => router.push("/dashboard")}>← Back to Dashboard</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Performance Report</CardTitle>
            <CardDescription>
              Based on your answers — Interview ID: {params.interviewId}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            
            {/* --- NEW: Detailed Score Section --- */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex flex-col items-center p-4">
                  <Wrench className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-sm font-medium">TECHNICAL</CardTitle>
                  <p className="text-3xl font-bold">{feedback.technicalScore}/10</p>
                </Card>
                <Card className="flex flex-col items-center p-4">
                  <Mic className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-sm font-medium">COMMUNICATION</CardTitle>
                  <p className="text-3xl font-bold">{feedback.communicationScore}/10</p>
                </Card>
                <Card className="flex flex-col items-center p-4">
                  <Brain className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-sm font-medium">PROBLEM-SOLVING</CardTitle>
                  <p className="text-3xl font-bold">{feedback.problemSolvingScore}/10</p>
                </Card>
              </div>
            </div>

            {/* --- UPDATED: Summary Section --- */}
            {feedback.overallFeedback && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Feedback</h3>
                <p className="text-muted-foreground">{feedback.overallFeedback}</p>
              </div>
            )}

            {/* Strengths (This code is now correct) */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Strengths</h3>
              <ul className="space-y-2">
                {feedback.strengths.length > 0 ? (
                  feedback.strengths.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-muted-foreground">No specific strengths identified.</p>
                )}
              </ul>
            </div>

            {/* Areas for Improvement (This code is now correct) */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Areas for Improvement</h3>
              <ul className="space-y-2">
                {feedback.areasForImprovement.length > 0 ? (
                  feedback.areasForImprovement.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <XCircle className="h-5 w-5 text-red-500 mr-2 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-muted-foreground">No specific improvement areas detected.</p>
                )}
              </ul>
            </div>

            {/* --- REMOVED: Detailed Feedback and Overall Score sections --- */}

          </CardContent>
        </Card>
      </main>
    </div>
  );
}

