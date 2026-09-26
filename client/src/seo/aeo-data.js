import { ROUTES } from "../constants/routes"

export const routeAeo = {
  [ROUTES.home]: {
    primaryQuery: "ai vocal remover online free",
    answerSnippet:
      "AI Media Processor lets you upload audio or video, choose vocal or music extraction, and download processed tracks in a few clicks.",
    faq: [
      {
        question: "What is the best AI vocal remover online free?",
        answer:
          "AI Media Processor is built for fast browser-based vocal and music separation, supporting uploads and YouTube-based processing workflows.",
      },
      {
        question: "Can I remove vocals from a song online without installing software?",
        answer:
          "Yes. Upload your audio file, select vocals-only or music-only mode, and download separated output directly in your browser.",
      },
      {
        question: "Can I extract music from video using AI?",
        answer:
          "Yes. Upload a video and choose the music-only or no-music processing option to isolate the track you need.",
      },
      {
        question: "How do I separate audio tracks online?",
        answer:
          "Use the audio or video upload page, choose a separation mode, wait for processing, and download the resulting stem.",
      },
    ],
    howToSteps: [
      "Upload an audio or video file, or provide a supported video link.",
      "Choose the output mode: vocals, music, or cleaned media.",
      "Start processing and wait for AI separation to finish.",
      "Preview and download your processed track.",
    ],
  },
  [ROUTES.audio]: {
    primaryQuery: "remove vocals from song online",
    answerSnippet:
      "On the audio page, upload a song, choose vocals-only or music-only output, and download the separated track.",
    faq: [
      {
        question: "How can I remove vocals from a song online?",
        answer:
          "Upload your song on the audio page, select music-only extraction, and download the instrumental output after processing.",
      },
      {
        question: "Can I isolate only vocals from an MP3 file?",
        answer:
          "Yes. Select the vocals-only option to export voice-focused audio from your uploaded track.",
      },
      {
        question: "Is this audio separation tool beginner friendly?",
        answer:
          "Yes. The workflow is upload, choose mode, process, and download, with no manual setup required.",
      },
    ],
    howToSteps: [
      "Open the Audio Processing page.",
      "Upload your source song.",
      "Choose vocals-only or music-only mode.",
      "Process and download the output file.",
    ],
  },
  [ROUTES.video]: {
    primaryQuery: "extract music from video ai",
    answerSnippet:
      "On the video page, upload a video and extract music or vocals using AI separation modes.",
    faq: [
      {
        question: "How do I extract music from video using AI?",
        answer:
          "Upload your video, choose music extraction mode, and download the processed audio result when the job is complete.",
      },
      {
        question: "Can I remove background music from video online?",
        answer:
          "Yes. Choose the no-music mode to keep speech and vocals while reducing or removing background music.",
      },
      {
        question: "Does this work for interviews and podcast clips?",
        answer:
          "Yes. Video cleanup mode is useful for spoken-word content where vocal clarity matters.",
      },
    ],
    howToSteps: [
      "Open the Video Processing page.",
      "Upload your video file.",
      "Choose no-music, vocals-only, or music-only output.",
      "Download the processed media.",
    ],
  },
  [ROUTES.features]: {
    primaryQuery: "separate audio tracks online",
    answerSnippet:
      "The features page combines YouTube media workflows and AI-based stem separation for practical online audio processing.",
    faq: [
      {
        question: "Can I separate audio tracks online from YouTube content?",
        answer:
          "Yes. Paste a link in the YouTube processor, choose your output mode, and process the media directly online.",
      },
      {
        question: "What outputs are available in the tool?",
        answer:
          "You can download original media, vocals-only tracks, music-only tracks, and cleaned outputs depending on selected mode.",
      },
      {
        question: "Is this suitable for karaoke, remix, or podcast editing?",
        answer:
          "Yes. Stem separation makes it easier to build instrumentals, clean dialogue, and create editable tracks.",
      },
    ],
    howToSteps: [
      "Choose a supported media source (upload or link).",
      "Select extraction mode based on your use case.",
      "Run AI processing.",
      "Preview and download final output.",
    ],
  },
  [ROUTES.about]: {
    primaryQuery: "how does ai vocal remover work",
    answerSnippet:
      "The platform analyzes mixed audio and separates source components such as vocals and instrumentals using AI models.",
    faq: [
      {
        question: "How does AI vocal removal work?",
        answer:
          "The model estimates different sound sources in a mixed track, then exports individual stems like vocals and accompaniment.",
      },
      {
        question: "Why is online audio separation useful?",
        answer:
          "It saves setup time and makes vocal extraction available from any browser-enabled device.",
      },
      {
        question: "What is the typical workflow?",
        answer:
          "Upload or link media, select a mode, process with AI, and download the separated output.",
      },
    ],
  },
}
