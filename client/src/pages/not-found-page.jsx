import { Link } from "react-router-dom"
import { ROUTES } from "../constants/routes"

export default function NotFoundPage() {
  return (
    <section className="relative px-4 pt-28 pb-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you requested does not exist. Use the links below to continue.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to={ROUTES.home}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Go Home
          </Link>
          <Link
            to={ROUTES.features}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground"
          >
            View Features
          </Link>
        </div>
      </div>
    </section>
  )
}
