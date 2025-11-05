"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import Header from "@/app/components/Header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function PreviousInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchInterviews = async () => {
      if (!user) return;
      try {
        const response = await axios.get("/api/interview/history");
        setInterviews(response.data);
      } catch (error) {
        console.error("Failed to fetch interviews", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Past Interviews</h1>
          <Button asChild variant="outline">
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : interviews.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {interviews.map((interview: any) => (
              <Card key={interview._id}>
                <CardHeader>
                  <CardTitle>{interview.jobRole}</CardTitle>
                  <CardDescription>
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Skills: {interview.skills}
                  </p>
                  <Button asChild>
                    <Link href={`/dashboard/interview/${interview._id}/feedback`}>
                      View Feedback
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            You haven't completed any interviews yet.
          </p>
        )}
      </main>
    </div>
  );
}
