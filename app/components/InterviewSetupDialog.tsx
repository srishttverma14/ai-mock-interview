"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// --- UPDATED LINE ---
// Point to the local file in your /public directory instead of the CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
// --------------------

export default function InterviewSetupDialog() {
  const [open, setOpen] = useState(false);
  const [jobRole, setJobRole] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let allText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      allText += pageText + "\n";
    }
    return allText;
  };

  const handleStartInterview = async () => {
    if (!jobRole || !skills || !experience) {
      toast.error("Please fill out all the required information.");
      return;
    }

    setLoading(true);
    let resumeText: string | null = null; 

    try {
      if (resumeFile) {
        toast.info("Parsing your resume...");
        try {
          resumeText = await getPdfText(resumeFile);
          toast.success("Resume parsed successfully!");
        } catch (parseError) {
          console.error("Failed to parse PDF", parseError);
          toast.error(
            "Could not read your resume PDF. Please check the file."
          );
          setLoading(false);
          return; 
        }
      }

      toast.info("Creating interview session...");
      const response = await axios.post("/api/interview/start", {
        jobRole,
        skills,
        experience,
        resumeText: resumeText, 
      });

      toast.success("Your interview session is being created!");
      setOpen(false);
      router.push(`/dashboard/interview/${response.data.interviewId}`);
    } catch (error) {
      console.error("Failed to start interview", error);
      toast.error("Could not create an interview session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Interview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Setup Your Interview</DialogTitle>
          <DialogDescription>
            Provide details about the role you're practicing for.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="job-role" className="text-right">
              Job Role
            </Label>
            <Input
              id="job-role"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Frontend Developer"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="skills" className="text-right">
              Skills
            </Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="col-span-3"
              placeholder="e.g., React, TypeScript, Node.js"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="experience" className="text-right">
              Experience
            </Label>
            <Input
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 5 years"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="resume" className="text-right">
              Resume (PDF)
            </Label>
            <Input
              id="resume"
              type="file"
              onChange={(e) =>
                setResumeFile(e.target.files ? e.target.files[0] : null)
              }
              className="col-span-3"
              accept=".pdf" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleStartInterview} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}