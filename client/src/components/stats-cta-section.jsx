"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Zap, BarChart3 } from "lucide-react"
import { Link } from "react-router-dom"
import { ROUTES } from "../constants/routes"

const stats = [
  { label: "Downloads", value: "100k+", icon: Sparkles },
  { label: "Processed Files", value: "50k+", icon: Zap },
  { label: "AI Models", value: "6+", icon: BarChart3 },
]

export function StatsSection() {
  return (
    <section className="relative px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8"
        >
          <div className="grid gap-8 md:grid-cols-3">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="text-3xl font-bold text-gradient">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export function CTASection() {
  return (
    <section className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">AI Audio Processing</span>
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          </div>
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Ready to <span className="text-gradient">Process</span> Your Media?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-pretty text-muted-foreground">
            Start by entering a YouTube link or uploading a file, and let our AI
            do the rest.
          </p>
          <Link
            to={ROUTES.features}
            className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all glow-blue hover:opacity-90"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
