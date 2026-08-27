import { useState, useEffect, useRef } from 'react';

export default function Magnet({ children, range = 60, strength = 0.2, style = {} }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (distance < range) {
        setPosition({
          x: distanceX * strength,
          y: distanceY * strength
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    const element = ref.current;
    if (element) {
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (element) {
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [range, strength]);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transformStyle = prefersReducedMotion ? 'none' : `translate(${position.x}px, ${position.y}px)`;

  return (
    <div
      ref={ref}
      style={{
        transform: transformStyle,
        transition: position.x === 0 && position.y === 0 ? 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' : 'transform 0.1s ease-out',
        display: 'inline-block',
        width: '100%',
        ...style
      }}
    >
      {children}
    </div>
  );
}
