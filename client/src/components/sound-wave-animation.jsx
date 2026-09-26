"use client"

export function SoundWaveAnimation() {
  const barCount = 40

  return (
    <div className="flex h-16 items-end justify-center gap-[3px]" role="img" aria-label="Sound wave visualization">
      {Array.from({ length: barCount }).map((_, i) => {
        const maxHeight = Math.sin((i / barCount) * Math.PI) * 100

        return (
          <div
            key={i}
            className="w-[3px] rounded-full"
            style={{
              background: `linear-gradient(to top, #3b82f6, #6366f1)`,
              height: `${Math.max(maxHeight * 0.6, 8)}%`,
              opacity: 0.8,
            }}
          />
        )
      })}
    </div>
  )
}
