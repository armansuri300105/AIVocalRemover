"use client"

import { motion } from "framer-motion"
import { Eye, Mic2, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: Eye,
    title: "YouTube Download",
    description:
      "Pull audio or video directly from any public YouTube link with a single click.",
    gradient: "from-neon-blue to-neon-cyan",
    iconColor: "#3b82f6",
  },
  {
    icon: Mic2,
    title: "AI Music Separation",
    description:
      "Leverage Demucs-powered models to remove music, isolate vocals, or split tracks.",
    gradient: "from-neon-indigo to-neon-blue",
    iconColor: "#6366f1",
  },
  {
    icon: ShieldCheck,
    title: "Flexible Media Support",
    description:
      "Process uploaded audio or video files in multiple modes - keep original, remove music, or extract stems.",
    gradient: "from-neon-cyan to-neon-indigo",
    iconColor: "#06b6d4",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

export function TechnologySection() {
  return (
    <section id="technology" className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Powered by Cutting-Edge{" "}
            <span className="text-gradient">Technology</span>
          </h2>
          <p className="mx-auto max-w-xl text-pretty text-muted-foreground">
            Three breakthrough AI systems work together to deliver unprecedented
            audio separation quality.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="group glass rounded-2xl p-6 transition-all hover:border-primary/20"
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `${feature.iconColor}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: feature.iconColor }} />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}


