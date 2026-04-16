"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import LogoLight from "./2.png";
import LogoDark from "./3.png";
import { BookingForm } from "@/features/booking/BookingForm";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [prevY, setPrevY] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 60);
      // Hide navbar when scrolling down quickly past hero, show on scroll up
      if (currentY > 200) {
        setHidden(currentY > prevY + 5);
      } else {
        setHidden(false);
      }
      setPrevY(currentY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevY]);

  return (
    <motion.nav
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-4 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8"
    >
      <div
        className={`mx-auto w-[92%] md:w-[70%] rounded-full border border-white/50 backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? "bg-white/78 shadow-lg"
            : "bg-white/65 shadow-md"
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11">
              <Image
                src={LogoLight}
                alt="Logo Terapi Bio Elektrik Deepublish"
                width={44}
                height={44}
                priority
                className="block dark:hidden object-contain"
              />
              <Image
                src={LogoDark}
                alt="Logo Terapi Bio Elektrik Deepublish"
                width={44}
                height={44}
                priority
                className="hidden dark:block object-contain"
              />
            </div>
            <span className="font-bold text-xl md:text-2xl text-primary">
              Terapi Deepublish
            </span>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-2">
            <a
              href="#form-reservasi"
              className="px-5 py-2.5 rounded-xl text-base font-semibold text-primary hover:bg-primary/10 transition-all duration-200"
            >
              Reservasi
            </a>
            <a
              href="/admin/login"
              className="px-5 py-2.5 rounded-xl text-base font-semibold bg-secondary text-secondary-foreground hover:brightness-95 transition-all duration-200"
            >
              Admin Login
            </a>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen">
        {/* ── Hero Section with Parallax ── */}
        <HeroSection />

        {/* ── Booking Form Section ── */}
        <section
          id="form-reservasi"
          className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/20"
        >
          <div className="max-w-7xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-10 space-y-3">

              <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
                Daftarkan Sesi Terapi Anda
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Isi formulir di bawah ini untuk melakukan reservasi sesi terapi bio elektrik Anda.
              </p>
            </div>

            <BookingForm />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
