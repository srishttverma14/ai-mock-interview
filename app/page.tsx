"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Header from "./components/Header";
import Lottie from "lottie-react";

export default function Home() {
  const glowRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const [animationData, setAnimationData] = useState<any>(null);

  // Fetch waving man Lottie dynamically
  useEffect(() => {
    const fetchLottie = async () => {
      try {
        const res = await fetch(
          "https://lottie.host/ddd1b470-08c5-4dee-ae91-245e59234935/2AGLVwwvAN.json"
        );
        const data = await res.json();
        setAnimationData(data);
      } catch (err) {
        console.error("Failed to load Lottie animation:", err);
      }
    };
    fetchLottie();
  }, []);

  // Handle mouse movement for glow, parallax, and 3D image tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 50;
      const y = (e.clientY / innerHeight - 0.5) * 50;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
      }

      if (particlesRef.current) {
        const depthX = (e.clientX / innerWidth - 0.5) * 30;
        const depthY = (e.clientY / innerHeight - 0.5) * 30;
        particlesRef.current.style.transform = `translate(${depthX}px, ${depthY}px)`;
      }

      if (imgContainerRef.current) {
        const rotateX = (innerHeight / 2 - e.clientY) / 25;
        const rotateY = (e.clientX - innerWidth / 2) / 25;
        imgContainerRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
      }
    };

    const handleMouseLeave = () => {
      if (imgContainerRef.current) {
        imgContainerRef.current.style.transform =
          "rotateX(0deg) rotateY(0deg) scale(1)";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative flex flex-col min-h-[100dvh] overflow-hidden">
      {/* Layered Animated Background */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 animate-background-move bg-gradient-to-r from-[#0F0F1A] via-[#12121F] to-[#0F0F1A] opacity-80"></div>
        <div className="absolute inset-0 animate-background-move-slow bg-gradient-to-r from-[#1A1A2E] via-[#23233A] to-[#1A1A2E] opacity-50 mix-blend-overlay"></div>
        <div className="absolute inset-0 animate-background-move-fast bg-gradient-to-r from-[#0F0F1A] via-[#2B1F3A] to-[#0F0F1A] opacity-30 mix-blend-screen"></div>

        {/* Interactive ambient glow */}
        <div
          ref={glowRef}
          className="absolute inset-0 pointer-events-none transition-transform duration-500"
        >
          <div className="absolute inset-[-100px] blur-[160px] bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-cyan-400/20 animate-pulse-slow rounded-full" />
        </div>
      </div>

      {/* Floating Particles */}
      <div
        ref={particlesRef}
        className="absolute inset-0 -z-10 pointer-events-none overflow-hidden transition-transform duration-700 ease-out"
      >
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/40 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
              opacity: 0.2 + Math.random() * 0.5,
              transform: `scale(${0.5 + Math.random()})`,
            }}
          />
        ))}
      </div>

      {/* Transparent Header */}
      <Header transparent />

      {/* Main content */}
      <main className="flex-1 relative z-10">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 animate-gradient-x">
                    Revolutionize Your Interview Prep
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Experience the future of interview practice with our AI-powered platform. Get instant feedback, tackle real-world coding challenges, and land your dream job.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    asChild
                    className="group bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:scale-105 hover:brightness-110"
                  >
                    <Link href="/dashboard">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* 3D Circular Lottie Avatar */}
              <div
                ref={imgContainerRef}
                className="relative mx-auto w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 transition-transform duration-500 ease-out perspective-1000 rounded-full overflow-hidden shadow-[0_0_30px_rgba(150,126,255,0.6)] hover:shadow-[0_0_60px_rgba(255,215,0,0.6)]"
              >
                {animationData ? (
                  <Lottie
                    animationData={animationData}
                    loop
                    className="w-full h-full object-cover"
                    aria-label="Animated avatar of a man waving"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-white">Loading Avatar...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
