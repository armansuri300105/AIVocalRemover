import { HeroSection } from "../components/hero-section"
import { StatsSection, CTASection } from "../components/stats-cta-section"
import { AnswerEngineSection } from "../components/answer-engine-section"
import { ROUTES } from "../constants/routes"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <CTASection />
      <AnswerEngineSection path={ROUTES.home} />
    </>
  )
}
