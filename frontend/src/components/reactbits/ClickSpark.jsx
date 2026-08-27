import { useCallback, useEffect, useRef } from 'react'

/**
 * Adapted from the React Bits ClickSpark JS/CSS component.
 * Source: https://reactbits.dev/
 * Kept local so the project has no additional runtime dependency.
 */
export default function ClickSpark({
  sparkColor = '#ffffff',
  sparkSize = 8,
  sparkRadius = 14,
  sparkCount = 7,
  duration = 360,
  children,
}) {
  const canvasRef = useRef(null)
  const sparksRef = useRef([])
  const frameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return undefined

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(parent)

    const draw = (timestamp) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const rect = parent.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      sparksRef.current = sparksRef.current.filter((spark) => {
        const progress = (timestamp - spark.startTime) / duration
        if (progress >= 1) return false
        const eased = progress * (2 - progress)
        const distance = eased * sparkRadius
        const length = sparkSize * (1 - eased)
        const x1 = spark.x + distance * Math.cos(spark.angle)
        const y1 = spark.y + distance * Math.sin(spark.angle)
        const x2 = spark.x + (distance + length) * Math.cos(spark.angle)
        const y2 = spark.y + (distance + length) * Math.sin(spark.angle)
        ctx.strokeStyle = sparkColor
        ctx.globalAlpha = 1 - progress
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        ctx.globalAlpha = 1
        return true
      })

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => {
      observer.disconnect()
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [duration, sparkColor, sparkRadius, sparkSize])

  const handleClick = useCallback((event) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const startTime = performance.now()
    for (let i = 0; i < sparkCount; i += 1) {
      sparksRef.current.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        angle: (Math.PI * 2 * i) / sparkCount,
        startTime,
      })
    }
  }, [sparkCount])

  return (
    <div className="reactbits-click-spark" onClick={handleClick}>
      <canvas ref={canvasRef} aria-hidden="true" />
      {children}
    </div>
  )
}
