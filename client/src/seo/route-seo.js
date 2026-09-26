import { ROUTES } from "../constants/routes"

const SITE_NAME = "AI Media Processor"
const SITE_DESCRIPTION =
  "AI-powered audio and video processing for vocal isolation, music removal, and stem extraction."
const SITE_KEYWORDS = [
  "ai vocal remover online free",
  "remove vocals from song online",
  "extract music from video ai",
  "separate audio tracks online",
  "youtube video downloader",
  "youtube audio downloader",
  "youtube to mp3",
  "vocal extractor",
  "vocals extracter",
  "ai vocal remover",
  "music remover from video",
  "remove background music",
  "instrumental extractor",
  "audio separation ai",
  "demucs audio separation",
  "video to audio extractor",
]

const DEFAULT_OG_IMAGE = "/vite.svg"

export const siteConfig = {
  siteName: SITE_NAME,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  defaultOgImage: DEFAULT_OG_IMAGE,
}

export const routeSeo = {
  [ROUTES.home]: {
    title: "AI Vocal Remover Online Free | AI Media Processor",
    description:
      "Use our AI vocal remover online free. Remove vocals from songs, extract music from video, and separate audio tracks in minutes.",
    keywords: [
      "ai vocal remover online free",
      "remove vocals from song online",
      "extract music from video ai",
      "separate audio tracks online",
      "youtube video downloader",
      "youtube audio downloader",
      "vocal extractor",
      "vocals extracter",
      "music remover from video",
      "ai media processor",
    ],
  },
  [ROUTES.audio]: {
    title: "Remove Vocals From Song Online | AI Audio Separator",
    description:
      "Remove vocals from song online with AI. Upload audio, isolate vocals or instrumentals, and export separated tracks fast.",
    keywords: [
      "remove vocals from song online",
      "separate audio tracks online",
      "audio vocal extractor",
      "vocals extracter",
      "remove vocals from song",
      "split vocals and music",
      "ai audio separator",
    ],
  },
  [ROUTES.video]: {
    title: "Extract Music From Video AI | Remove Background Music",
    description:
      "Extract music from video with AI or remove background music while keeping speech. Process videos online and download clean output.",
    keywords: [
      "extract music from video ai",
      "remove background music from video online",
      "youtube video downloader",
      "video vocal extractor",
      "remove music from video",
      "extract speech from video",
      "video audio separator",
    ],
  },
  [ROUTES.features]: {
    title: "Separate Audio Tracks Online | Features and Modes",
    description:
      "Explore feature modes for AI vocal removal, YouTube processing, and online audio track separation for songs and videos.",
    keywords: [
      "separate audio tracks online",
      "ai vocal remover online free",
      "youtube downloader features",
      "ai stem separation",
      "vocals extractor tool",
      "music remover ai",
      "demucs based separator",
    ],
  },
  [ROUTES.about]: {
    title: "How AI Vocal Removal Works | AI Media Processor",
    description:
      "Learn how our AI vocal remover separates vocals, music, and speech from audio and video uploads or YouTube sources.",
    keywords: [
      "how ai vocal remover works",
      "audio separation ai online",
      "how vocal extractor works",
      "audio separation workflow",
      "youtube media processing",
      "ai audio extraction",
    ],
  },
}
