import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { routeSeo, siteConfig } from "../seo/route-seo"
import { routeAeo } from "../seo/aeo-data"
import { ROUTES } from "../constants/routes"

function normalizeUrl(baseUrl) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
}

function resolveSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured && configured.trim()) {
    return normalizeUrl(configured.trim())
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin
  }
  return "https://aimediaprocessor.netlify.app"
}

function upsertMeta(selector, key, value) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement("meta")
    const [attr, attrValue] = key
    element.setAttribute(attr, attrValue)
    document.head.appendChild(element)
  }
  element.setAttribute("content", value)
}

function upsertCanonical(href) {
  let canonical = document.head.querySelector("link[rel='canonical']")
  if (!canonical) {
    canonical = document.createElement("link")
    canonical.setAttribute("rel", "canonical")
    document.head.appendChild(canonical)
  }
  canonical.setAttribute("href", href)
}

function upsertStructuredData(json) {
  const scriptId = "structured-data-site"
  let script = document.getElementById(scriptId)
  if (!script) {
    script = document.createElement("script")
    script.id = scriptId
    script.type = "application/ld+json"
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(json)
}

function buildBreadcrumbList(siteUrl, pathname) {
  const segments = pathname.split("/").filter(Boolean)
  const items = [{ name: "Home", path: "/" }]

  let currentPath = ""
  for (const segment of segments) {
    currentPath += `/${segment}`
    const label = segment.charAt(0).toUpperCase() + segment.slice(1)
    items.push({ name: label, path: currentPath })
  }

  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  }
}

export function SeoManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    const siteUrl = resolveSiteUrl()
    const routeMeta = routeSeo[pathname]
    const routeAeoData = routeAeo[pathname]
    const isKnownRoute = Boolean(routeMeta)

    const title = routeMeta?.title || `Page Not Found | ${siteConfig.siteName}`
    const description =
      routeMeta?.description ||
      "The requested page does not exist. Return to AI Media Processor to process audio and video."
    const canonical = `${siteUrl}${pathname}`
    const robots = isKnownRoute ? "index,follow,max-image-preview:large" : "noindex,nofollow"
    const googlebot = isKnownRoute ? "index,follow,max-snippet:-1,max-image-preview:large" : "noindex,nofollow"
    const ogImage = `${siteUrl}${siteConfig.defaultOgImage}`
    const keywordsList = routeMeta?.keywords?.length
      ? routeMeta.keywords
      : siteConfig.keywords
    const keywords = keywordsList.join(", ")

    document.title = title

    upsertMeta("meta[name='description']", ["name", "description"], description)
    upsertMeta("meta[name='keywords']", ["name", "keywords"], keywords)
    upsertMeta("meta[name='robots']", ["name", "robots"], robots)
    upsertMeta("meta[name='googlebot']", ["name", "googlebot"], googlebot)
    upsertMeta("meta[name='application-name']", ["name", "application-name"], siteConfig.siteName)
    upsertMeta("meta[name='author']", ["name", "author"], siteConfig.siteName)

    upsertMeta("meta[property='og:type']", ["property", "og:type"], "website")
    upsertMeta("meta[property='og:site_name']", ["property", "og:site_name"], siteConfig.siteName)
    upsertMeta("meta[property='og:locale']", ["property", "og:locale"], "en_US")
    upsertMeta("meta[property='og:title']", ["property", "og:title"], title)
    upsertMeta("meta[property='og:description']", ["property", "og:description"], description)
    upsertMeta("meta[property='og:url']", ["property", "og:url"], canonical)
    upsertMeta("meta[property='og:image']", ["property", "og:image"], ogImage)

    upsertMeta("meta[name='twitter:card']", ["name", "twitter:card"], "summary_large_image")
    upsertMeta("meta[name='twitter:title']", ["name", "twitter:title"], title)
    upsertMeta("meta[name='twitter:description']", ["name", "twitter:description"], description)
    upsertMeta("meta[name='twitter:image']", ["name", "twitter:image"], ogImage)
    upsertMeta("meta[name='twitter:site']", ["name", "twitter:site"], "@aimediaprocessor")

    const breadcrumbList = buildBreadcrumbList(siteUrl, pathname)
    const graph = [
      {
        "@type": "WebSite",
        name: siteConfig.siteName,
        url: siteUrl,
        description: siteConfig.description,
        keywords: siteConfig.keywords,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}${ROUTES.features}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: siteConfig.siteName,
        url: siteUrl,
        logo: ogImage,
      },
      {
        "@type": "SoftwareApplication",
        name: siteConfig.siteName,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        url: siteUrl,
      },
      {
        "@type": "WebPage",
        name: title,
        description,
        keywords: keywordsList,
        url: canonical,
      },
      breadcrumbList,
    ]

    if (routeAeoData?.faq?.length) {
      graph.push({
        "@type": "FAQPage",
        mainEntity: routeAeoData.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      })
    }

    if (routeAeoData?.howToSteps?.length) {
      graph.push({
        "@type": "HowTo",
        name: `How to use ${siteConfig.siteName}`,
        description: routeAeoData.answerSnippet || description,
        step: routeAeoData.howToSteps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          text: step,
        })),
      })
    }

    upsertCanonical(canonical)
    upsertStructuredData({
      "@context": "https://schema.org",
      "@graph": graph,
    })
  }, [pathname])

  return null
}
