"use client";

import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
const InterviewSetupDialog = dynamic(
  () => import("../components/InterviewSetupDialog"),
  {ssr : false}
);

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
        <div className="grid gap-8">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Start a New Interview</h2>
            <p className="text-muted-foreground mb-4">
              Click the button below to configure and start a new mock interview session with our AI.
            </p>
            <InterviewSetupDialog />
          </div>
        </div>
      </main>
    </div>
  );
}
