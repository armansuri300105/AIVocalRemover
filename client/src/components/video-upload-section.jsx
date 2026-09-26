"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileVideo,
  X,
  Film,
  HardDrive,
} from "lucide-react"

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VideoUploader({ onProcessingComplete }) {
  const [state, setState] = useState("idle")
  const [file, setFile] = useState(null)
  const [processedFile, setProcessedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const fileRef = useRef(null)

  const handleFile = useCallback((f) => {
    const validTypes = [
      "video/mp4",
      "video/quicktime",
      "video/webm",
      "video/x-msvideo",
    ]
    if (!validTypes.includes(f.type)) return
    fileRef.current = f
    setFile({
      name: f.name,
      size: formatFileSize(f.size),
      type: f.type,
      url: URL.createObjectURL(f),
    })
    setState("selected")
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDragOver(false), [])

  const onBrowse = useCallback(() => inputRef.current?.click(), [])

  const onFileChange = useCallback(
    (e) => {
      const f = e.target.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const reset = useCallback(() => {
    setState("idle")
    setFile(null)
    setProcessedFile(null)
    setUploadProgress(0)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  // Handle actual API call to backend
  const sendVideoToBackend = useCallback(async () => {
    if (!fileRef.current) return

    try {
      setError(null)
      const formData = new FormData()
      formData.append("video", fileRef.current)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setUploadProgress(progress)
        }
      })

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const blob = xhr.response
            const processedUrl = URL.createObjectURL(blob)
            setProcessedFile({
              url: processedUrl,
              name: `processed_${file.name}`,
              blob: blob,
            })
            setState("completed")
            onProcessingComplete()
            resolve()
          } else {
            reject(new Error(`Server error: ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error("Network error"))
        xhr.responseType = "blob"
        xhr.open("POST", `${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "")}/api/remove-music-from-video`)
        xhr.send(formData)
      })
    } catch (err) {
      setError(err.message || "Failed to process video")
      setState("selected")
    }
  }, [file, onProcessingComplete])

  const startProcess = useCallback(() => {
    if (state === "selected") {
      setState("uploading")
      setTimeout(async () => {
        setState("processing")
        await sendVideoToBackend()
      }, 500)
    }
  }, [state, sendVideoToBackend])


  return (
    <section id="upload-video" className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Upload <span className="text-gradient">Video File</span>
          </h2>
          <p className="mx-auto max-w-xl text-pretty text-muted-foreground">
            Choose how to process the audio track of your video using AI.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* =========== IDLE STATE =========== */}
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
            >
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`glass relative flex flex-col items-center justify-center gap-5 rounded-2xl px-6 py-20 text-center transition-all ${
                  isDragOver
                    ? "border-primary/50 bg-primary/5"
                    : "border-glass-border"
                }`}
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: isDragOver
                    ? "var(--primary)"
                    : "var(--glass-border)",
                }}
              >
                <motion.div
                  animate={isDragOver ? { scale: 1.12, y: -4 } : { scale: 1, y: 0 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
                >
                  <Upload className="h-7 w-7 text-primary" />
                </motion.div>
                <div>
                  <p className="text-base font-medium text-foreground">
                    Drag & drop your video here
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Supports MP4, MOV, WEBM
                  </p>
                </div>
                <button
                  onClick={onBrowse}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 glow-blue"
                >
                  Browse File
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            </motion.div>
          )}

          {/* =========== SELECTED STATE =========== */}
          {state === "selected" && file && (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex flex-col gap-4">
                {/* Thumbnail */}
                <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  <video
                    src={file.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget
                      v.currentTime = 1
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px]">
                    <Film className="h-6 w-6 text-foreground/70" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileVideo className="h-3.5 w-3.5" />
                          {file.type.split("/")[1].toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3.5 w-3.5" />
                          {file.size}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={reset}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={startProcess}
                    className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 glow-blue"
                  >
                    Process Video
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========== UPLOADING STATE =========== */}
          {state === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
              className="glass rounded-2xl p-8"
            >
              <div className="flex flex-col items-center gap-6 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
                >
                  <Upload className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <p className="text-base font-medium text-foreground">
                    Uploading video to AI engine...
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {Math.min(Math.round(uploadProgress), 100)}% uploaded
                  </p>
                </div>
                {/* Progress bar */}
                <div className="h-2.5 w-full max-w-md overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* =========== PROCESSING STATE =========== */}
          {state === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
              className="glass relative overflow-hidden rounded-2xl p-10"
            >
              {/* Dim background */}
              <div className="pointer-events-none absolute inset-0 bg-background/40" />
              <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                {/* Circular glow loader */}
                <div className="relative flex h-28 w-28 items-center justify-center">
                  {/* Outer ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: "3px solid transparent",
                      borderTopColor: "#3b82f6",
                      borderRightColor: "#6366f1",
                    }}
                  />
                  {/* Inner ring */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-3 rounded-full"
                    style={{
                      border: "2px solid transparent",
                      borderBottomColor: "#06b6d4",
                      borderLeftColor: "#3b82f6",
                    }}
                  />
                  {/* Glow effect */}
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow:
                        "0 0 40px rgba(59,130,246,0.3), 0 0 80px rgba(99,102,241,0.15)",
                    }}
                  />
                  {/* Icon */}
                  <Upload className="relative z-10 h-8 w-8 text-primary" />
                </div>

                {/* Processing message */}
                <p className="text-base font-medium text-foreground">
                  Processing video, please wait...
                </p>
              </div>
            </motion.div>
          )}

          {/* =========== COMPLETED STATE =========== */}
          {state === "completed" && processedFile && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
              className="glass rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Processing Complete!
                </h3>
              </div>
              <div className="flex flex-col gap-4">
                {/* Processed video preview */}
                <div className="relative h-48 w-full overflow-hidden rounded-xl bg-secondary">
                  <video
                    key={processedFile?.url}
                    src={processedFile?.url}
                    className="h-full w-full object-cover"
                    controls
                    preload="metadata"
                  />
                </div>
                {/* Action buttons */}
                <div className="flex gap-3">
                  <a
                    href={processedFile?.url}
                    download={processedFile?.name}
                    className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-all hover:opacity-90 glow-blue"
                  >
                    Download Processed Video
                  </a>
                  <button
                    onClick={reset}
                    className="flex-1 rounded-xl border border-primary/20 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/5"
                  >
                    Process Another
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========== ERROR STATE =========== */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
              className="glass rounded-2xl border border-destructive/20 bg-destructive/5 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-destructive">Error Processing Video</p>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  <button
                    onClick={reset}
                    className="mt-3 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-all hover:opacity-90"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

