import { AudioUploader } from "../components/audio-upload-section"
import { AnswerEngineSection } from "../components/answer-engine-section"
import { ROUTES } from "../constants/routes"

export default function AudioPage() {
  return (
    <section className="relative px-4 pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Audio <span className="text-gradient">Processing</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Upload your audio file and separate vocals or music with AI.
        </p>
      </div>
      <AudioUploader />
      <AnswerEngineSection path={ROUTES.audio} />
    </section>
  )
}
