"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax: image moves up slower than scroll (creates depth)
  const rawY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const imageY = useSpring(rawY, { stiffness: 60, damping: 20, mass: 0.8 });

  // Overlay opacity darkens as user scrolls
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.65, 0.9]);

  // Hero content fades & slides up as user scrolls
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.45], ["0%", "-18%"]);

  // Scroll-down pulse arrow fades out quickly
  const arrowOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="hero-section relative w-full overflow-hidden"
      style={{ height: "100svh" }}
      aria-label="Terapi Bio Elektrik Deepublish Hero"
    >
      {/* ── Parallax Background Image ── */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: imageY }}
      >
        <Image
          src="/HS.png"
          alt="Terapi Bio Elektrik Deepublish"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
          draggable={false}
        />
      </motion.div>

      {/* ── Dynamic Gradient Overlay ── */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-[#071736]/78 via-[#0c3e78]/62 to-[#06132b]/88"
        style={{ opacity: overlayOpacity }}
      />

      {/* ── Subtle Grain / Noise Texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
          mixBlendMode: "overlay",
          opacity: 0.6,
        }}
      />

      {/* ── Decorative Glowing Orbs ── */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#3ab5ad]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#165cab]/25 blur-[100px] pointer-events-none" />

      {/* ── Hero Content ── */}
      <motion.div
        className="absolute inset-0 flex items-center justify-start px-4 sm:px-6 lg:px-8"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="w-full max-w-7xl">
          <div className="max-w-3xl">

        {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight text-left"
            >
              Terapi Bio Elektrik
              <br />
              <span className="bg-gradient-to-r from-[#7de9e1] to-[#4dd8d0] bg-clip-text text-transparent">
                Deepublish
              </span>
            </motion.h1>

        {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
              className="mt-6 mb-6 h-px w-24 bg-gradient-to-r from-transparent via-[#3ab5ad] to-transparent origin-left"
            />

        {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-white text-left max-w-2xl leading-relaxed drop-shadow-sm"
            >
              Sistem reservasi online untuk layanan terapi bio elektrik.
              <br className="hidden sm:block" />
              Pilih jadwal, isi data diri, dan bersiap untuk kembali sehat.
            </motion.p>

        {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.55 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 items-start"
            >
              <a
                href="#form-reservasi"
                className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-[#165cab] hover:bg-[#1a6fd4] text-white font-semibold text-base shadow-lg shadow-[#165cab]/40 hover:shadow-[#165cab]/60 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>Mulai Reservasi</span>
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </a>
              <a
                href="#form-reservasi"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm text-white/95 font-medium text-base hover:bg-white/20 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Pelajari Lebih Lanjut
              </a>
            </motion.div>

        {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
              className="mt-14 flex items-center gap-8 sm:gap-14"
            >
              {[
                { value: "100%", label: "Alami" },
                { value: "±60 Menit", label: "Durasi Sesi" },
                { value: "Terjadwal", label: "Terstruktur" },
              ].map((stat) => (
                <div key={stat.label} className="text-left">
                  <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-white/80 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Scroll-Down Arrow ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        style={{ opacity: arrowOpacity }}
      >
        <span className="text-white/50 text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-white/60" />
        </motion.div>
      </motion.div>

      {/* ── Bottom Fade to Background ── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
