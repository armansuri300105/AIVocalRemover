"use client"

export function DecibelMeter() {
  return (
    <div className="flex items-end gap-1" role="img" aria-label="Decibel meter">
      {[10, 14, 18, 22, 18, 14, 12, 9].map((height, i) => (
        <div
          key={i}
          className="w-1 rounded-full"
          style={{
            height: `${height}px`,
            background: i < 5 ? "#3b82f6" : i < 7 ? "#6366f1" : "#ef4444",
          }}
        />
      ))}
    </div>
  )
}
