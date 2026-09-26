"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Waves } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { ROUTES } from "../constants/routes"

const navLinks = [
  { label: "Home", to: ROUTES.home, end: true },
  { label: "Audio", to: ROUTES.audio },
  { label: "Video", to: ROUTES.video },
  { label: "Features", to: ROUTES.features },
  { label: "About", to: ROUTES.about },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Waves className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              AI <span className="text-gradient">Media</span> Processor
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `text-sm transition-colors hover:text-foreground ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <Link
              to={ROUTES.features}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 glow-blue"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-foreground md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-strong overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-4 px-4 py-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `text-sm transition-colors hover:text-foreground ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <Link
                to={ROUTES.features}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
