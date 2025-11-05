"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps {
  onSubmit: (code: string) => void;
}

export default function CodeEditor({ onSubmit }: CodeEditorProps) {
  const [code, setCode] = useState("");

  const handleSubmit = () => {
    onSubmit(code);
  };

  const handleContinue = () => {
    onSubmit(""); // Empty string indicates skipping the question
  };

  return (
    <div className="p-4 border-t border-cyan-400 bg-card rounded-xl shadow-neon flex flex-col gap-3">
      <h3 className="font-semibold mb-2 text-cyan-400 text-lg">Coding Challenge</h3>
      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="function reverseString(str) { ... }"
        className="bg-background font-mono text-foreground h-48 border border-purple-500 rounded-lg shadow-inner focus:ring-2 focus:ring-cyan-400"
      />
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-105 shadow-glow"
        >
          Submit Code
        </Button>
        <Button
          onClick={handleContinue}
          variant="outline"
          className="flex-1 border-cyan-400 text-cyan-400 hover:bg-cyan-400/20"
        >
          Continue without Submitting
        </Button>
      </div>
    </div>
  );
}
