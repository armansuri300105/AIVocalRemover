import { VideoUploader } from "../components/video-upload-section"
import { AnswerEngineSection } from "../components/answer-engine-section"
import { ROUTES } from "../constants/routes"

export default function VideoPage() {
  return (
    <section className="relative px-4 pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Video <span className="text-gradient">Processing</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Upload a video and remove background music while keeping spoken vocals.
        </p>
      </div>
      <VideoUploader />
      <AnswerEngineSection path={ROUTES.video} />
    </section>
  )
}
