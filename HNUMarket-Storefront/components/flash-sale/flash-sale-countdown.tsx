"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

interface FlashSaleCountdownProps {
  variant?: "default" | "glass";
}

/**
 * Flash Sale Countdown Timer Component
 * Counts down to end of day (midnight) - flash sale resets daily
 */
export function FlashSaleCountdown({ variant = "default" }: FlashSaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  const isGlass = variant === "glass";

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = (): TimeLeft => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const difference = endOfDay.getTime() - now.getTime();

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-3">
        <Clock className={cn("w-5 h-5", isGlass ? "text-gray-500" : "text-white/80")} />
        <div className="flex gap-2">
          <TimeBox value="--" label="Giờ" variant={variant} />
          <span className={cn("text-2xl font-bold", isGlass ? "text-gray-400" : "text-white/60")}>:</span>
          <TimeBox value="--" label="Phút" variant={variant} />
          <span className={cn("text-2xl font-bold", isGlass ? "text-gray-400" : "text-white/60")}>:</span>
          <TimeBox value="--" label="Giây" variant={variant} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center lg:items-end gap-2">
      <div className={cn(
        "flex items-center gap-2 text-sm",
        isGlass ? "text-gray-600" : "text-white/80"
      )}>
        <Clock className="w-4 h-4" />
        <span>Kết thúc sau</span>
      </div>
      <div className="flex gap-2 items-center">
        <TimeBox value={timeLeft.hours} label="Giờ" variant={variant} />
        <span className={cn(
          "text-2xl font-bold animate-pulse",
          isGlass ? "text-primary" : "text-white/60"
        )}>:</span>
        <TimeBox value={timeLeft.minutes} label="Phút" variant={variant} />
        <span className={cn(
          "text-2xl font-bold animate-pulse",
          isGlass ? "text-primary" : "text-white/60"
        )}>:</span>
        <TimeBox value={timeLeft.seconds} label="Giây" variant={variant} />
      </div>
    </div>
  );
}

interface TimeBoxProps {
  value: number | string;
  label: string;
  variant?: "default" | "glass";
}

function TimeBox({ value, label, variant = "default" }: TimeBoxProps) {
  const displayValue = typeof value === "number" 
    ? value.toString().padStart(2, "0") 
    : value;

  const isGlass = variant === "glass";

  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "rounded-lg px-3 py-2 min-w-[56px] text-center",
        isGlass 
          ? "bg-primary/10 border border-primary/20 shadow-sm" 
          : "bg-white/20 backdrop-blur-sm"
      )}>
        <span className={cn(
          "text-2xl sm:text-3xl font-bold tabular-nums",
          isGlass ? "text-primary" : "text-white"
        )}>
          {displayValue}
        </span>
      </div>
      <span className={cn(
        "text-xs mt-1",
        isGlass ? "text-gray-500" : "text-white/70"
      )}>{label}</span>
    </div>
  );
}
