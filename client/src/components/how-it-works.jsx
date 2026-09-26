"use client"

import { motion } from "framer-motion"
import { ScanFace, Route, BrainCircuit } from "lucide-react"

const steps = [
  {
    step: 1,
    icon: ScanFace,
    title: "Provide Media",
    description:
      "Paste a YouTube link or upload a video/audio file to begin.",
    color: "#3b82f6",
  },
  {
    step: 2,
    icon: Route,
    title: "Choose Processing Mode",
    description:
      "Select whether to remove music, extract vocals, keep original audio, or separate stems.",
    color: "#6366f1",
  },
  {
    step: 3,
    icon: BrainCircuit,
    title: "Download Result",
    description:
      "Wait as our AI processes the media, then download your processed file with one click.",
    color: "#06b6d4",
  },
]

export function HowItWorks() {
  return (
    <section id="about" className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="mx-auto max-w-xl text-pretty text-muted-foreground">
            Just a few clicks to convert YouTube links or uploaded media into
            separated, music-free audio using AI.
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 hidden h-full w-px bg-border md:left-1/2 md:block" />

          <div className="flex flex-col gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isEven = i % 2 === 0

              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className={`relative flex flex-col gap-4 md:flex-row md:items-center ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${isEven ? "md:text-right md:pr-12" : "md:text-left md:pl-12"}`}>
                    <div className={`glass inline-block rounded-2xl p-6 ${isEven ? "md:ml-auto" : ""}`}>
                      <div className={`mb-3 flex items-center gap-3 ${isEven ? "md:justify-end" : ""}`}>
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ background: `${step.color}15` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: step.color }} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="absolute left-6 hidden h-3 w-3 -translate-x-1/2 rounded-full md:left-1/2 md:block" style={{ background: step.color, boxShadow: `0 0 12px ${step.color}60` }} />

                  {/* Spacer */}
                  <div className="hidden flex-1 md:block" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
