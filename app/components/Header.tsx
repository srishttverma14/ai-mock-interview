"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: HeaderProps) {
  const { isSignedIn } = useUser();

  return (
    <header
      className={`px-4 lg:px-6 h-14 flex items-center border-b border-cyan-400 shadow-glow transition-colors duration-300 ${
        transparent
          ? "bg-transparent border-transparent backdrop-blur-none absolute top-0 left-0 w-full z-50"
          : "bg-card/80 backdrop-blur-md"
      }`}
    >
      <Link href="/" className="flex items-center justify-center gap-2">
        {/* Logo with hover animation */}
        <div className="w-8 h-8 relative rounded-full overflow-hidden hover:scale-110 transition-transform duration-300 shadow-md shadow-cyan-400/50">
          <Image
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
        <span
          className={`text-lg font-bold tracking-wider ${
            transparent ? "text-white" : "text-cyan-400"
          }`}
        >
          InterviewSimplify
        </span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        {isSignedIn && (
          <Link
            href="/dashboard/previous-interviews"
            className={`text-sm font-medium hover:underline underline-offset-4 transition-colors ${
              transparent ? "text-white hover:text-purple-300" : "hover:text-purple-500"
            }`}
          >
            Past Interviews
          </Link>
        )}
        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <Button
            asChild
            className={`${
              transparent
                ? "bg-white/80 text-black hover:brightness-125"
                : "bg-cyan-400 text-black hover:brightness-125"
            }`}
          >
            <Link href="/dashboard">Sign In</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
