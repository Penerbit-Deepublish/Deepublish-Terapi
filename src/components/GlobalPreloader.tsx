"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import LogoLight from "@/app/2.png";
import LogoDark from "@/app/3.png";

const PRELOADER_MIN_DURATION_MS = 1400;
const PRELOADER_EXIT_DURATION_MS = 500;

export function GlobalPreloader() {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const beginExit = window.setTimeout(() => {
      setIsExiting(true);
      document.body.style.overflow = originalOverflow;
    }, PRELOADER_MIN_DURATION_MS);

    const unmount = window.setTimeout(() => {
      setIsMounted(false);
    }, PRELOADER_MIN_DURATION_MS + PRELOADER_EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(beginExit);
      window.clearTimeout(unmount);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!isMounted) return null;

  return (
    <div
      aria-label="Memuat halaman"
      aria-live="polite"
      role="status"
      className={cn(
        "preloader-overlay fixed inset-0 z-[9999] flex items-center justify-center px-6 transition-opacity duration-500",
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <div className="preloader-grid absolute inset-0" />
      <div className="preloader-orb preloader-orb-one" />
      <div className="preloader-orb preloader-orb-two" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="preloader-logo-wrap">
          <span className="preloader-ring preloader-ring-one" />
          <span className="preloader-ring preloader-ring-two" />
          <span className="preloader-logo-glow" />
          <div className="preloader-logo-core">
            <Image
              src={LogoLight}
              alt="Logo Terapi Deepublish"
              width={70}
              height={70}
              priority
              className="block object-contain dark:hidden"
            />
            <Image
              src={LogoDark}
              alt="Logo Terapi Deepublish"
              width={70}
              height={70}
              priority
              className="hidden object-contain dark:block"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-base font-semibold tracking-[0.12em] text-[#0f4d96]">
            TERAPI DEEPUBLISH
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#2f8f95]">
            Menyiapkan Pengalaman Terbaik
          </p>
        </div>

        <div className="preloader-progress">
          <span className="preloader-progress-bar" />
        </div>
      </div>
    </div>
  );
}
