import { Suspense, lazy, useEffect } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { Navbar } from "./components/navbar"
import { Footer } from "./components/footer"
import { SeoManager } from "./components/seo-manager"
import { LEGACY_ROUTES, ROUTES } from "./constants/routes"

const HomePage = lazy(() => import("./pages/home-page"))
const AudioPage = lazy(() => import("./pages/audio-page"))
const VideoPage = lazy(() => import("./pages/video-page"))
const FeaturesPage = lazy(() => import("./pages/features-page"))
const AboutPage = lazy(() => import("./pages/about-page"))
const NotFoundPage = lazy(() => import("./pages/not-found-page"))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [pathname])

  return null
}

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="glass rounded-2xl px-6 py-4 text-sm text-muted-foreground">
        Loading page...
      </div>
    </div>
  )
}

export default function App() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <ScrollToTop />
      <SeoManager />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.audio} element={<AudioPage />} />
          <Route path={ROUTES.video} element={<VideoPage />} />
          <Route path={ROUTES.features} element={<FeaturesPage />} />
          <Route path={ROUTES.about} element={<AboutPage />} />
          {Object.entries(LEGACY_ROUTES).map(([oldPath, newPath]) => (
            <Route key={oldPath} path={oldPath} element={<Navigate to={newPath} replace />} />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </main>
  )
}
