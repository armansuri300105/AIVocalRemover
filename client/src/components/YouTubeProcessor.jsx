"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { fetchMetaData, getJobStatus, ytProcess } from "../services/api"

export function YouTubeProcessor() {
  const [url, setUrl] = useState("")
  const [option, setOption] = useState("original_video")
  const [jobId, setJobId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)
  const [isShort, setIsShort] = useState(false)

  const [metadata, setMetadata] = useState(null)
  const [formatId, setFormatId] = useState("")

  const isVideoOption = option === "original_video" || option === "video_no_music";

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (option==="original_video"){
      console.log(formatId);
      const Url = metadata?.formats?.filter((f) => {
        if (f?.format_id === formatId) return f
      })[0]?.url
      setDownloadUrl(Url)
      setPreviewUrl(Url)
      return;
    }
    if (!url) return
    setError(null)
    setStatus("Starting")
    setDownloadUrl(null)
    setPreviewUrl(null)
    setIsShort(url.includes("/shorts/"))

    // include selected formatId if we have metadata
    const body = { url, option };
    if (formatId) body.format_id = formatId;

    try {
      const resp = await ytProcess(body)
      const data = resp?.data
      setJobId(data.jobId)
      setStatus("Queued")
    } catch (err) {
      setError(err.message)
      setStatus("")
    }
  }, [url, option, formatId])

  useEffect(() => {
    if (!jobId) return
    const interval = setInterval(async () => {
      try {
        const type = "youtube"
        const resp = await getJobStatus({jobId, type})
        const data = resp?.data
        setProgress(data.progress.percent || 0)
        setStatus(data.state || "")
        if (data.state === "completed") {
          setDownloadUrl(data.result.downloadUrl)
          setPreviewUrl(data.result.previewUrl)
          clearInterval(interval)
        }
        if (data.state === "failed") {
          setError(data.error || "Processing failed")
          clearInterval(interval)
        }
      } catch (err) {
        console.error(err)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [jobId])

  const selectedFormat = metadata?.formats?.find(
    (f) => f.format_id === formatId
  )
  
  const hasVideo = selectedFormat?.hasVideo
  const hasAudio = selectedFormat?.hasAudio

  useEffect(() => {
    if (option === "original_video" && !(hasVideo && hasAudio)) {
      setOption(hasVideo ? "video_no_music" : "audio_with_music")
    }

    if ((option === "audio_with_music" || option === "vocals_only") && !hasAudio) {
      setOption("video_no_music")
    }

  }, [formatId])

  return (
    <section id="youtube" className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Process YouTube <span className="text-gradient">Media</span>
          </h2>
          <p className="mx-auto max-w-xl text-pretty text-muted-foreground">
            Enter a YouTube link and choose how you want to download or separate the
            media. You can remove music with AI, keep the original audio, or extract
            vocals.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground">
              YouTube URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                // clear previous metadata when user edits url
                setMetadata(null)
                setFormatId("")
              }}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:ring-primary"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <button
              type="button"
              onClick={async () => {
                if (!url) return
                setError(null)
                try {
                  const resp = await fetchMetaData(url)
                  const data = resp?.data
                  setMetadata(data)
                  // pick first quality by default
                  if (data.formats && data.formats.length) {
                    setFormatId(data.formats[0].format_id)
                  }
                } catch (err) {
                  setError(err.message)
                }
              }}
              className="ml-2 mt-2 rounded-md bg-secondary px-3 py-1 text-sm"
            >
              Fetch Video Info
            </button>
          </div>

          {metadata && (
            <div className="mb-4">
              <img src={metadata?.thumbnail} className="rounded-lg w-full" alt="thumbnail" />
              <h3 className="mt-2 text-lg font-semibold text-foreground">{metadata?.title}</h3>
              <p className="text-sm text-muted-foreground">{Math.floor(metadata?.duration / 60)}:{String(metadata.duration % 60).padStart(2, '0')}</p>

              <div className="mt-2">
                <label className="block text-sm font-medium text-foreground">Quality</label>
                <select
                  value={formatId}
                  onChange={(e) => setFormatId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:ring-primary"
                >
                  {metadata?.formats?.map((f) => (
                    <option key={f?.format_id} value={f?.format_id}>
                      {f?.resolution} {f?.filesize ? `(${(f?.filesize/1024/1024).toFixed(1)} MB)` : ''} {!f?.hasAudio ? "No Audio" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              Options
            </legend>

            <div className="flex flex-col gap-2">

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="yt-option"
                  value="original_video"
                  checked={option === "original_video"}
                  onChange={() => setOption("original_video")}
                  disabled={!(hasVideo)}
                  className="h-4 w-4 text-primary"
                />
                <span className="ml-2">Download Original Video</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="yt-option"
                  value="video_no_music"
                  checked={option === "video_no_music"}
                  onChange={() => setOption("video_no_music")}
                  disabled={!(hasVideo && hasAudio)}
                  className="h-4 w-4 text-primary"
                />
                <span className="ml-2">Download Video Without Music (AI removed music)</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="yt-option"
                  value="audio_with_music"
                  checked={option === "audio_with_music"}
                  onChange={() => setOption("audio_with_music")}
                  disabled={!hasAudio}
                  className="h-4 w-4 text-primary"
                />
                <span className="ml-2">Extract Audio With Music</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="yt-option"
                  value="vocals_only"
                  checked={option === "vocals_only"}
                  onChange={() => setOption("vocals_only")}
                  disabled={!hasAudio}
                  className="h-4 w-4 text-primary"
                />
                <span className="ml-2">Extract Vocals Only (Music Removed by AI)</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="yt-option"
                  value="music_only"
                  checked={option === "music_only"}
                  onChange={() => setOption("music_only")}
                  disabled={!hasAudio}
                  className="h-4 w-4 text-primary"
                />
                <span className="ml-2">Extract Music Only (Vocals Removed by AI)</span>
              </label>

            </div>
          </fieldset>

          <button
            type="submit"
            disabled={!metadata}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            {option === "original_video" ? "Get Download link" : `Process YouTube Media`}
          </button>
        </form>

        {status && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">Status: {status}</p>
            <div className="mt-1 h-2 w-full bg-secondary rounded-full">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="mt-6 text-center">
            {isVideoOption ? (
              <video
                src={previewUrl}
                controls
                className="mx-auto max-w-full"
                style={{
                  aspectRatio: isShort ? "9/16" : "16/9",
                  maxWidth: isShort ? "240px" : "640px",
                }}
              />
            ) : (
              <audio
                src={previewUrl}
                controls
                className="mx-auto"
              />
            )}
          </div>
        )}

        {downloadUrl && (
          <div className="mt-6 text-center">
            <a
              href={downloadUrl}
              download
              onClick={() => setDownloadUrl(null)}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Download Result
            </a>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
      </div>
    </section>
  )
}
