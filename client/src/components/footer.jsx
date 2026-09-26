"use client"

import { motion } from "framer-motion"
import { Waves, Github, Twitter, Linkedin } from "lucide-react"
import { Link } from "react-router-dom"
import { ROUTES } from "../constants/routes"

const footerLinks = {
  Product: [
    { label: "Features", to: ROUTES.features },
    { label: "Audio", to: ROUTES.audio },
    { label: "Video", to: ROUTES.video },
  ],
  Company: [
    { label: "About", to: ROUTES.about },
    { label: "Home", to: ROUTES.home },
  ],
  Resources: ["Documentation", "API Reference", "Community", "Support"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
}

const socialIcons = [
  { icon: Github, label: "GitHub", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border px-4 py-16">
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(15,23,42,1) 0%, rgba(15,23,42,0.8) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Waves className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                AI <span className="text-gradient">Media</span> Processor
              </span>
            </motion.div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Download and process YouTube videos or upload your own media. Remove
              music, separate vocals, and extract instruments using AI.
            </p>
            <div className="flex gap-3">
              {socialIcons.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-glass-border bg-glass-bg text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).slice(0, 3).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{category}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={typeof link === "string" ? link : link.label}>
                    {typeof link === "string" ? (
                      <span className="text-sm text-muted-foreground">{link}</span>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {"2026 AI Media Processor. All rights reserved."}
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookies"].map((link) => (
              <a key={link} href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
