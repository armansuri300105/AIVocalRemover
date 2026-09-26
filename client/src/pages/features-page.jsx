import { YouTubeProcessor } from "../components/YouTubeProcessor"
import { TechnologySection } from "../components/technology-section"
import { AnswerEngineSection } from "../components/answer-engine-section"
import { ROUTES } from "../constants/routes"

export default function FeaturesPage() {
  return (
    <section className="relative pt-16">
      <div className="mx-auto max-w-4xl px-4 pt-14 text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Platform <span className="text-gradient">Features</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Use AI workflows for YouTube downloads, vocal isolation, and music removal.
        </p>
      </div>
      <YouTubeProcessor />
      <TechnologySection />
      <AnswerEngineSection path={ROUTES.features} />
    </section>
  )
}
