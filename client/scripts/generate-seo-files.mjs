import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const siteUrlRaw = process.env.VITE_SITE_URL || "https://aimediaprocessor.netlify.app"
const siteUrl = siteUrlRaw.endsWith("/") ? siteUrlRaw.slice(0, -1) : siteUrlRaw

const routes = [
  "/",
  "/ai-vocal-remover-online-free",
  "/extract-music-from-video-ai",
  "/separate-audio-tracks-online",
  "/how-ai-vocal-remover-works",
]
const lastmod = new Date().toISOString().split("T")[0]

const publicDir = path.resolve(process.cwd(), "public")
const sitemapPath = path.join(publicDir, "sitemap.xml")
const robotsPath = path.join(publicDir, "robots.txt")
const manifestPath = path.join(publicDir, "manifest.webmanifest")
const redirectsPath = path.join(publicDir, "_redirects")
const llmsPath = path.join(publicDir, "llms.txt")

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`

const manifest = JSON.stringify(
  {
    name: "AI Media Processor",
    short_name: "AI Media",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/vite.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  },
  null,
  2,
)

const redirects = "/* /index.html 200\n"
const llms = `# AI Media Processor

> AI audio and video processing web app for vocal removal, music extraction, and source separation.

## Primary intents
- ai vocal remover online free
- remove vocals from song online
- extract music from video ai
- separate audio tracks online

## Main pages
- ${siteUrl}/
- ${siteUrl}/ai-vocal-remover-online-free
- ${siteUrl}/extract-music-from-video-ai
- ${siteUrl}/separate-audio-tracks-online
- ${siteUrl}/how-ai-vocal-remover-works

## Core capabilities
- Upload audio and extract vocals or instrumentals
- Upload video and remove or isolate background music
- Process supported video links and choose output formats
- Download processed files for editing, karaoke, remix, or cleanup workflows
`

await mkdir(publicDir, { recursive: true })
await Promise.all([
  writeFile(sitemapPath, sitemap, "utf8"),
  writeFile(robotsPath, robots, "utf8"),
  writeFile(manifestPath, `${manifest}\n`, "utf8"),
  writeFile(redirectsPath, redirects, "utf8"),
  writeFile(llmsPath, llms, "utf8"),
])

console.log(`Generated SEO assets for ${siteUrl}`)
