import { HowItWorks } from "../components/how-it-works"
import { CTASection } from "../components/stats-cta-section"
import { AnswerEngineSection } from "../components/answer-engine-section"
import { ROUTES } from "../constants/routes"

export default function AboutPage() {
  return (
    <section className="relative pt-16">
      <div className="mx-auto max-w-4xl px-4 pt-14 text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          About <span className="text-gradient">AI Media Processor</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Understand the workflow used to process links and uploaded media with AI.
        </p>
      </div>
      <HowItWorks />
      <CTASection />
      <AnswerEngineSection path={ROUTES.about} />
    </section>
  )
}
