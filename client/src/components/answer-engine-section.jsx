import { Link } from "react-router-dom"
import { routeAeo } from "../seo/aeo-data"
import { ROUTES } from "../constants/routes"

const ctaMap = {
  [ROUTES.home]: { label: "Try Audio Tool", to: ROUTES.audio },
  [ROUTES.audio]: { label: "Process Audio", to: ROUTES.audio },
  [ROUTES.video]: { label: "Process Video", to: ROUTES.video },
  [ROUTES.features]: { label: "Explore Features", to: ROUTES.features },
  [ROUTES.about]: { label: "Start Processing", to: ROUTES.audio },
}

export function AnswerEngineSection({ path }) {
  const content = routeAeo[path]
  if (!content) return null

  const cta = ctaMap[path] || ctaMap[ROUTES.home]

  return (
    <section className="relative px-4 pb-20 pt-12 sm:pt-16" aria-labelledby="answer-engine-heading">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card/40 p-6 sm:p-8">
        <h2 id="answer-engine-heading" className="text-2xl font-bold text-foreground sm:text-3xl">
          Quick Answers: {content.primaryQuery}
        </h2>
        <p className="mt-3 text-muted-foreground">{content.answerSnippet}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {content.faq?.map((item) => (
            <article key={item.question} className="rounded-xl border border-border bg-background/60 p-4">
              <h3 className="text-base font-semibold text-foreground">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>

        {content.howToSteps?.length ? (
          <div className="mt-8 rounded-xl border border-border bg-background/60 p-4">
            <h3 className="text-base font-semibold text-foreground">How to do it</h3>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              {content.howToSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={cta.to}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {cta.label}
          </Link>
          <Link
            to={ROUTES.features}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground"
          >
            Compare Modes
          </Link>
        </div>
      </div>
    </section>
  )
}
