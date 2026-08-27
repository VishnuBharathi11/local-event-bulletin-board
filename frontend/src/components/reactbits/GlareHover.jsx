import './GlareHover.css'

export default function GlareHover({
  children,
  className = '',
  style = {},
  glareColor = '#ffffff',
  glareOpacity = 0.28,
  transitionDuration = 650,
}) {
  const hex = glareColor.replace('#', '')
  let rgba = glareColor
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`
  }

  return (
    <div
      className={`reactbits-glare-hover ${className}`}
      style={{ '--rb-glare-rgba': rgba, '--rb-glare-duration': `${transitionDuration}ms`, ...style }}
    >
      {children}
    </div>
  )
}
