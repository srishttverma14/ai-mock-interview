"use client";
import { useState, useEffect, useRef } from "react";
import Header from "@/app/components/Header";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Move, Video, VideoOff } from "lucide-react";
import CodeEditor from "@/app/components/CodeEditor";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
export default function InterviewPage({ params }: { params: { interviewId: string } }) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [transcript, setTranscript] = useState<{ speaker: "AI" | "User"; text: string }[]>([]);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isCurrentCodingQuestion, setIsCurrentCodingQuestion] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<"AI" | "User" | null>(null);

  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const firstMessageSpokenRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const bottomRef = useRef<HTMLDivElement | null>(null); // 👈 for auto-scroll

  // 🔊 Speak AI response
  const speak = (text: string) => {
    setActiveSpeaker("AI");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => setActiveSpeaker(null);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // ⏱ Timer
  useEffect(() => {
    const timer = setInterval(() => setSecondsElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
      Math.floor((s % 3600) / 60)
    ).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // 🧾 Load first question
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/interview/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId: params.interviewId }),
        });
        const data = await res.json();
        if (data.transcript?.length) {
          setTranscript(data.transcript);
          const firstAI = data.transcript.find((t: any) => t.speaker === "AI");
          if (firstAI && !firstMessageSpokenRef.current) {
            speak(firstAI.text);
            firstMessageSpokenRef.current = true;
          }
        }
      } catch {
        toast.error("Could not load interview data");
      }
    })();
  }, [params.interviewId]);

  // 👇 Auto-scroll when transcript updates
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  // 🎤 Setup SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript.trim();
      if (text) {
        finalTranscriptRef.current += " " + text;
        setUserAnswer(finalTranscriptRef.current.trim());
        setActiveSpeaker("User");

        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = setTimeout(() => {
          recognition.stop();
        }, 2000);
      }
    };

    recognition.onerror = (e: any) => {
      console.error("SpeechRecognition error:", e.error);
      toast.error("Speech recognition error: " + e.error);
      setIsListening(false);
      setActiveSpeaker(null);
    };

    recognition.onend = async () => {
      if (isListening) setIsListening(false);
      clearTimeout(speechTimeoutRef.current);

      const finalAnswer = finalTranscriptRef.current.trim();
      if (finalAnswer) {
        await handleAnswerSubmit(finalAnswer);
        finalTranscriptRef.current = "";
        setUserAnswer("");
        setActiveSpeaker(null);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  // 📷 Camera logic
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        toast.error("Camera permission denied");
        setIsCameraOn(false);
      }
    };
    if (isCameraOn) startCamera();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [isCameraOn]);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // 🎙 Toggle Mic
  const toggleMic = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      toast.error("Speech recognition unavailable");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setActiveSpeaker(null);
    } else {
      finalTranscriptRef.current = "";
      setUserAnswer("");
      recognition.start();
      setIsListening(true);
      toast.info("Listening... start speaking!");
      setActiveSpeaker("User");
    }
  };

  // 📩 Submit answer
  const handleAnswerSubmit = async (answer: string) => {
    if (!answer.trim() || isProcessing) return;
    setIsProcessing(true);
    setTranscript((p) => [...p, { speaker: "User", text: answer }]);

    try {
      const res = await fetch("/api/interview/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: params.interviewId, lastAnswer: answer }),
      });
      const data = await res.json();
      const aiText = data.aiText;
      const isCoding = data.isCodingQuestion;

      setIsCurrentCodingQuestion(isCoding);
      setShowCodeEditor(isCoding);

      setTimeout(() => {
        setTranscript((p) => [...p, { speaker: "AI", text: aiText }]);
        speak(aiText);

        if (
          aiText.toLowerCase().includes("concludes our interview") ||
          aiText.toLowerCase().includes("end of the interview")
        ) {
          toast.success("Interview finished. Redirecting...");
          stopCamera();
          setTimeout(
            () => router.push(`/dashboard/interview/${params.interviewId}/feedback`),
            4000
          );
        }
        setIsProcessing(false);
      }, 1200);
    } catch {
      toast.error("Failed to get AI response");
      setIsProcessing(false);
    }
  };

  // 💻 Code answer handler
  const handleCodeSubmit = async (code: string) => {
    setTranscript((p) => [...p, { speaker: "User", text: `CODE:\n${code}` }]);
    setShowCodeEditor(false);
    try {
      const res = await fetch("/api/interview/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: params.interviewId, lastAnswer: code }),
      });
      const data = await res.json();
      setIsCurrentCodingQuestion(data.isCodingQuestion);
      setShowCodeEditor(data.isCodingQuestion);
      setTranscript((p) => [...p, { speaker: "AI", text: data.aiText }]);
      speak(data.aiText);
    } catch {
      toast.error("Failed to get AI response");
    }
  };

  // 🧭 Draggable camera
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cameraContainerRef.current) return;
    dragOffset.current = {
      x: e.clientX - cameraContainerRef.current.offsetLeft,
      y: e.clientY - cameraContainerRef.current.offsetTop,
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (cameraContainerRef.current) {
      cameraContainerRef.current.style.left = `${e.clientX - dragOffset.current.x}px`;
      cameraContainerRef.current.style.top = `${e.clientY - dragOffset.current.y}px`;
    }
  };
  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Timer + Camera Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="text-sm font-medium bg-black/60 text-white px-3 py-1 rounded">
          {formatTimer(secondsElapsed)}
        </div>
        <Button
          onClick={() => setIsCameraOn((p) => !p)}
          size="sm"
          variant={isCameraOn ? "destructive" : "secondary"}
        >
          {isCameraOn ? (
            <>
              <VideoOff className="w-4 h-4 mr-1" />Off
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-1" />On
            </>
          )}
        </Button>
      </div>

      {/* Transcript */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Interview Session</h1>
        <div className="space-y-4">
          {transcript.map((entry, i) => (
            <div
              key={i}
              className={`flex items-start ${
                entry.speaker === "AI" ? "justify-start" : "justify-end"
              }`}
            >
              {entry.speaker === "AI" && (
                <div
                  className={`w-6 h-6 relative mr-2 flex-shrink-0 transition-transform duration-300 ${
                    activeSpeaker === "AI" ? "animate-pulse" : ""
                  }`}
                >
                  <Image
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    alt="Interviewer"
                    fill
                    className="object-contain rounded-full"
                  />
                </div>
              )}

              <div
                className={`max-w-xl p-3 rounded-lg ${
                  entry.speaker === "AI"
                    ? "bg-secondary"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{entry.text}</p>
              </div>

              {entry.speaker === "User" && (
                <div
                  className={`w-6 h-6 relative ml-2 flex-shrink-0 transition-transform duration-300 ${
                    activeSpeaker === "User" ? "animate-pulse" : ""
                  }`}
                >
                  <Image
                    src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
                    alt="Candidate"
                    fill
                    className="object-contain rounded-full"
                  />
                </div>
              )}
            </div>
          ))}
          {/* 👇 This invisible div ensures smooth auto-scroll */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ✅ UI — CodeEditor OR Mic */}
      {showCodeEditor ? (
        <CodeEditor onSubmit={handleCodeSubmit} />
      ) : (
        <div className="absolute bottom-8 w-full flex justify-center">
          <Button
            onClick={toggleMic}
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            className="w-16 h-16 rounded-full shadow-lg"
            disabled={isProcessing}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </Button>
        </div>
      )}

      {/* Draggable Camera */}
      {isCameraOn && (
        <div
          ref={cameraContainerRef}
          onMouseDown={handleMouseDown}
          className="fixed bottom-6 right-6 w-36 h-36 bg-black rounded-full shadow-lg overflow-hidden cursor-move z-50"
        >
          <div className="absolute top-1 right-10 bg-black/40 text-white text-xs rounded-md px-1 flex items-center gap-1">
            <Move className="w-3 h-3" /> Move
          </div>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
