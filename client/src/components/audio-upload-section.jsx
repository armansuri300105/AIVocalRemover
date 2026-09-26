import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, Music, Cpu, Clock } from "lucide-react"
import axios from "axios"
import { getJobStatus } from "../services/api"

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AudioUploader({ onProcessingComplete }) {
  const [state, setState] = useState("idle")
  const [file, setFile] = useState(null)
  const [processedFile, setProcessedFile] = useState(null)
  const [previewProcessed, setPreviewProcessed] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("Initializing AI separation...")
  const [error, setError] = useState(null)
  const [jobId, setJobId] = useState("")

  const inputRef = useRef(null)
  const fileRef = useRef(null)

  const handleFile = useCallback((f) => {
    const validTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/mp4",
      "audio/aac",
      "audio/webm",
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

  const onBrowse = () => inputRef.current?.click()

  const reset = () => {
    setState("idle")
    setFile(null)
    setProcessedFile(null)
    setPreviewProcessed(null)
    setUploadProgress(0)
    setProcessingProgress(0)
    setProcessingStatus("Initializing AI separation...")
    setError(null)
    setJobId("")
    if (inputRef.current) inputRef.current.value = ""
  }

  useEffect(() => {
    if (!jobId) return
    let isSubscribed = true

    const interval = setInterval(async () => {
      try {
        const type = "audio"
        const res = await getJobStatus({ jobId, type })
        if (!isSubscribed) return

        // Read real-time progress from BullMQ job
        if (res?.data?.progress !== undefined && res?.data?.progress !== null) {
          const prog = res.data.progress
          if (typeof prog === "number") {
            setProcessingProgress(prog)
          } else if (typeof prog === "object") {
            if (typeof prog.percent === "number") {
              setProcessingProgress(prog.percent)
            }
            if (prog.status) {
              setProcessingStatus(prog.status)
            }
          }
        }

        if (res?.data?.state === "completed") {
          const Dvocals = res?.data?.result?.downloadVocal
          const Dno_vocals = res?.data?.result?.downloadNoVocal
          const Pvocals = res?.data?.result?.previewVocal
          const Pno_vocals = res?.data?.result?.previewNoVocal

          setProcessedFile({
            vocals: {
              url: Dvocals,
              name: `vocals_${file?.name || "audio.mp3"}`,
            },
            no_vocals: {
              url: Dno_vocals,
              name: `no_vocals_${file?.name || "audio.mp3"}`,
            },
          })

          setPreviewProcessed({
            vocals: {
              url: Pvocals,
              name: `vocals_${file?.name || "audio.mp3"}`,
            },
            no_vocals: {
              url: Pno_vocals,
              name: `no_vocals_${file?.name || "audio.mp3"}`,
            },
          })

          setProcessingProgress(100)
          setProcessingStatus("Separation complete!")
          setState("completed")
          onProcessingComplete?.()
          clearInterval(interval)
        } else if (res?.data?.state === "failed") {
          setError(res?.data?.reason || res?.data?.error || "Processing failed")
          setState("selected")
          clearInterval(interval)
        }
      } catch (err) {
        console.error("Job status polling error:", err)
      }
    }, 1000)

    return () => {
      isSubscribed = false
      clearInterval(interval)
    }
  }, [jobId, file, onProcessingComplete])

  const sendAudioToBackend = useCallback(async () => {
    if (!fileRef.current) return

    try {
      setError(null)
      setState("uploading")
      setUploadProgress(0)
      setProcessingProgress(0)
      setProcessingStatus("Uploading audio file to server...")

      const formData = new FormData()
      formData.append("audio", fileRef.current)

      const response = await axios.post(
        `${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "")}/api/audio/remove-music-from-audio`,
        formData,
        {
          onUploadProgress: (e) => {
            if (e.total) {
              const progress = (e.loaded / e.total) * 100
              setUploadProgress(Math.round(progress))
            }
          },
        }
      )

      setState("processing")
      setProcessingProgress(5)
      setProcessingStatus("Preparing CPU separation engine...")
      setJobId(response?.data?.jobId)

    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to process audio")
      setState("selected")
    }
  }, [file])

  const startProcess = () => {
    if (state === "selected") {
      sendAudioToBackend()
    }
  }

  return (
    <section id="upload-audio" className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">

        <h2 className="mb-6 text-center text-3xl font-bold">
          Upload Audio File
        </h2>

        <AnimatePresence mode="wait">

          {/* IDLE */}
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-10 text-center"
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="mx-auto mb-4 h-10 w-10 text-primary" />
              <p>Drag & drop audio file</p>
              <button
                onClick={onBrowse}
                className="mt-4 rounded-xl bg-primary px-6 py-2 text-primary-foreground"
              >
                Browse File
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </motion.div>
          )}

          {/* SELECTED */}
          {state === "selected" && file && (
            <motion.div
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{file.size}</p>
                </div>
                <button onClick={reset}>
                  <X />
                </button>
              </div>

              <audio src={file.url} controls className="mt-4 w-full" />

              <button
                onClick={startProcess}
                className="mt-6 w-full rounded-xl bg-primary py-2 text-primary-foreground"
              >
                Process Audio
              </button>
            </motion.div>
          )}

          {/* UPLOADING */}
          {state === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <Upload className="mx-auto mb-3 h-8 w-8 animate-bounce text-primary" />
              <p className="font-medium text-foreground">Uploading audio file...</p>
              <p className="mt-1 text-sm text-muted-foreground">{uploadProgress}% uploaded</p>
              <div className="mx-auto mt-4 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </motion.div>
          )}

          {/* PROCESSING WITH LIVE PROGRESS BAR */}
          {state === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass relative overflow-hidden rounded-2xl p-8 sm:p-10 text-center"
            >
              {/* Subtle background glow */}
              <div className="pointer-events-none absolute inset-0 bg-primary/5 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center">
                {/* Animated pulsating icon ring */}
                <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-primary/40"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/20 backdrop-blur-sm"
                  >
                    <Music className="h-7 w-7 text-primary" />
                  </motion.div>
                </div>

                {/* Status headings */}
                <h3 className="text-xl font-bold text-foreground">
                  Separating Vocals & Music
                </h3>
                <p className="mt-1.5 min-h-[1.25rem] max-w-md text-sm text-muted-foreground">
                  {processingStatus}
                </p>

                {/* Progress Bar Container */}
                <div className="mt-6 w-full max-w-md">
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary/80 p-0.5 shadow-inner">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/30"
                      initial={{ width: "5%" }}
                      animate={{ width: `${Math.max(5, Math.min(Math.round(processingProgress), 100))}%` }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    />
                  </div>

                  {/* Badges / percentage row */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-primary">
                      <Cpu className="h-3.5 w-3.5 animate-pulse" />
                      CPU-Optimized (ONNX)
                    </span>
                    <span className="font-semibold text-foreground">
                      {Math.round(processingProgress)}%
                    </span>
                  </div>
                </div>

                <p className="mt-6 text-xs text-muted-foreground/75">
                  High-speed multi-threaded inference on CPU without needing GPU.
                </p>
              </div>
            </motion.div>
          )}

          {/* COMPLETED */}
          {state === "completed" && processedFile && (
            <motion.div
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="mb-4 font-semibold">Processing Complete</h3>

              <p className="text-white text-center">Audio With vocals only</p>
              <audio
                key={previewProcessed?.vocals?.url}
                src={previewProcessed?.vocals?.url}
                controls
                className="w-full"
              />

              <p className="text-white text-center">Audio With music only</p>
              <audio
                key={previewProcessed?.no_vocals?.url}
                src={previewProcessed?.no_vocals?.url}
                controls
                className="w-full"
              />

              <div className="mt-4 flex gap-3">
                <a
                  href={processedFile?.vocals?.url}
                  download={processedFile?.vocals?.name}
                  className="flex-1 rounded-xl bg-primary px-4 py-2 text-center text-primary-foreground"
                >
                  Download Vocals
                </a>
                <a
                  href={processedFile?.no_vocals?.url}
                  download={processedFile?.no_vocals?.name}
                  className="flex-1 rounded-xl bg-primary px-4 py-2 text-center text-primary-foreground"
                >
                  Download Music
                </a>
                <button
                  onClick={reset}
                  className="flex-1 rounded-xl border border-primary/20 px-4 py-2"
                >
                  Upload Another
                </button>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80">
                <Clock className="h-3.5 w-3.5 text-primary/70" />
                For privacy and storage efficiency, files are automatically deleted after 30 minutes.
              </p>
            </motion.div>
          )}

          {/* ERROR */}
          {error && (
            <div className="glass rounded-2xl p-6 text-center text-destructive">
              {error}
            </div>
          )}

        </AnimatePresence>
      </div>
    </section>
  )
}
