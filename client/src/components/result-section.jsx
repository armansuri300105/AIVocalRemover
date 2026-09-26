"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Volume2,
  VolumeX,
  Users,
  Mic,
  Activity,
  Download,
  RotateCcw,
  UploadCloud,
  Play,
  Pause,
  Check,
} from "lucide-react"

const speakers = [
  {
    id: 1,
    name: "Speaker A",
    color: "#3b82f6",
    clarity: 94,
    noiseReduction: 87,
    active: true,
  },
  {
    id: 2,
    name: "Speaker B",
    color: "#6366f1",
    clarity: 91,
    noiseReduction: 82,
    active: true,
  },
  {
    id: 3,
    name: "Speaker C",
    color: "#06b6d4",
    clarity: 88,
    noiseReduction: 79,
    active: false,
  },
]

export function ResultSection({ onNewUpload, onReprocess }) {
  const [selectedSpeaker, setSelectedSpeaker] = useState(speakers[0])
  const [isOriginalAudio, setIsOriginalAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleSpeakerClick = useCallback((s) => {
    setSelectedSpeaker(s)
  }, [])

  return (
    <section id="results" className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass-bg px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <Check className="h-4 w-4 text-emerald-400" />
            Processing Complete
          </div>
          <h2 className="mb-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Your <span className="text-gradient">Results</span>
          </h2>
          <p className="mx-auto max-w-lg text-pretty text-muted-foreground">
            Click on a speaker to isolate their voice. Toggle between original
            and isolated audio.
          </p>
        </motion.div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ========= LEFT: VIDEO PLAYER ========= */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex-1"
          >
            <div className="glass rounded-2xl p-3">
              {/* Video area */}
              <div
                className="relative aspect-video w-full cursor-crosshair overflow-hidden rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)",
                }}
              >
                {/* Simulated content with speaker silhouettes */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-8 sm:gap-14">
                    {speakers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSpeakerClick(s)}
                        className="group relative flex flex-col items-center gap-2"
                        aria-label={`Select ${s.name}`}
                      >
                        <div
                          className="relative h-16 w-16 rounded-full transition-all sm:h-24 sm:w-24"
                          style={{
                            background: `linear-gradient(135deg, ${s.color}40, ${s.color}15)`,
                            border:
                              selectedSpeaker.id === s.id
                                ? `2px solid ${s.color}`
                                : `2px solid ${s.color}30`,
                            boxShadow:
                              selectedSpeaker.id === s.id
                                ? `0 0 24px ${s.color}30`
                                : "none",
                          }}
                        >
                          <AnimatePresence>
                            {selectedSpeaker.id === s.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium text-foreground"
                                style={{
                                  background: `${s.color}25`,
                                  border: `1px solid ${s.color}40`,
                                }}
                              >
                                {s.name}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div
                          className="h-1.5 w-8 rounded-full opacity-40 transition-opacity group-hover:opacity-70"
                          style={{ background: s.color }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bounding box overlay on selected speaker */}
                <AnimatePresence>
                  {selectedSpeaker && (
                    <motion.div
                      key={selectedSpeaker.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute rounded-xl"
                      style={{
                        left:
                          selectedSpeaker.id === 1
                            ? "10%"
                            : selectedSpeaker.id === 2
                            ? "37%"
                            : "64%",
                        top: "15%",
                        width: "26%",
                        height: "70%",
                        border: `2px solid ${selectedSpeaker.color}60`,
                        background: `${selectedSpeaker.color}08`,
                        boxShadow: `inset 0 0 30px ${selectedSpeaker.color}10`,
                      }}
                    >
                      {/* Corner markers */}
                      <div
                        className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 rounded-tl-md"
                        style={{ borderColor: selectedSpeaker.color }}
                      />
                      <div
                        className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 rounded-tr-md"
                        style={{ borderColor: selectedSpeaker.color }}
                      />
                      <div
                        className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 rounded-bl-md"
                        style={{ borderColor: selectedSpeaker.color }}
                      />
                      <div
                        className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 rounded-br-md"
                        style={{ borderColor: selectedSpeaker.color }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating clarity card */}
                <AnimatePresence>
                  {selectedSpeaker && (
                    <motion.div
                      key={`card-${selectedSpeaker.id}`}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute right-3 bottom-14 rounded-xl p-3 sm:right-4 sm:bottom-16 sm:p-4"
                      style={{
                        background: "rgba(15,23,42,0.88)",
                        backdropFilter: "blur(16px)",
                        border: `1px solid ${selectedSpeaker.color}30`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ background: `${selectedSpeaker.color}20` }}
                        >
                          <Mic
                            className="h-4 w-4"
                            style={{ color: selectedSpeaker.color }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {selectedSpeaker.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                              style={{
                                background: selectedSpeaker.active
                                  ? "#22c55e"
                                  : "#ef4444",
                              }}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {selectedSpeaker.active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        <ClarityBar
                          label="Voice Clarity"
                          value={selectedSpeaker.clarity}
                          color={selectedSpeaker.color}
                        />
                        <ClarityBar
                          label="Noise Reduction"
                          value={selectedSpeaker.noiseReduction}
                          color={selectedSpeaker.color}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Play button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/80 text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Audio toggle bar */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsOriginalAudio(false)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      !isOriginalAudio
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    Isolated Audio
                  </button>
                  <button
                    onClick={() => setIsOriginalAudio(true)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isOriginalAudio
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isOriginalAudio ? (
                      <Volume2 className="h-3.5 w-3.5" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5" />
                    )}
                    Original Audio
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <ActionButton
                    icon={<Download className="h-3.5 w-3.5" />}
                    label="Download"
                  />
                  <ActionButton
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                    label="Reprocess"
                    onClick={onReprocess}
                  />
                  <ActionButton
                    icon={<UploadCloud className="h-3.5 w-3.5" />}
                    label="New Upload"
                    onClick={onNewUpload}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========= RIGHT: SPEAKER CONTROLS ========= */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full lg:w-80"
          >
            <div className="glass rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Detected Speakers
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                {speakers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSpeakerClick(s)}
                    className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      selectedSpeaker.id === s.id
                        ? "border"
                        : "border border-transparent hover:bg-secondary/50"
                    }`}
                    style={
                      selectedSpeaker.id === s.id
                        ? {
                            background: `${s.color}10`,
                            borderColor: `${s.color}30`,
                          }
                        : {}
                    }
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${s.color}20` }}
                    >
                      <Volume2
                        className="h-4 w-4"
                        style={{ color: s.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {s.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedSpeaker.id === s.id
                          ? `Clarity ${s.clarity}%`
                          : "Tap to focus"}
                      </p>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        selectedSpeaker.id === s.id
                          ? "animate-pulse"
                          : "opacity-30"
                      }`}
                      style={{ background: s.color }}
                    />
                  </button>
                ))}
              </div>

              {/* Live waveform */}
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-neon-cyan" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Voice Meter
                  </h3>
                </div>
                <div className="flex h-20 items-end justify-center gap-[2px] rounded-xl bg-secondary/30 px-3 py-3">
                  {[28, 46, 35, 52, 31, 48, 38, 56, 40, 50, 36, 44].map((height, i) => {
                    const color = selectedSpeaker?.color || "#3b82f6"
                    return (
                      <div
                        key={i}
                        className="w-[4px] rounded-full"
                        style={{ background: color, height: `${height}%`, opacity: 0.75 }}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Audio mode indicator */}
              <div className="mt-5 rounded-xl bg-secondary/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Audio Mode
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {isOriginalAudio ? "Original" : "Isolated"}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: isOriginalAudio
                        ? "#94a3b8"
                        : selectedSpeaker.color,
                      width: isOriginalAudio ? "100%" : `${selectedSpeaker.clarity}%`,
                    }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ---- Small helpers ---- */

function ClarityBar({ label, value, color }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-medium" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-glass-border bg-glass-bg px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:text-foreground"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
