"use client"

import { motion } from "framer-motion"
import { Upload, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { ROUTES } from "../constants/routes"

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16"
    >
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }}
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -30, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-32 top-1/3 h-96 w-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />
        <motion.div
          animate={{
            x: [0, 20, -15, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.05, 0.9, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass-bg px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-neon-cyan animate-pulse" />
          AI Media Processing & Music Separation
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-7xl"
        >
          Process & Separate Audio with AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mb-10 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Download YouTube videos or upload your media and use AI to remove music,
          separate vocals, or extract instruments. Fast, easy, and powerful.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            to={ROUTES.video}
            className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all glow-blue hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            Upload Video
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to={ROUTES.features}
            className="inline-flex items-center gap-2 rounded-2xl border border-glass-border bg-glass-bg px-8 py-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:border-primary/30"
          >
            Learn More
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
