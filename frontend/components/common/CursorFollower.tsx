'use client';

import { useEffect, useState, useRef } from 'react';

export default function CursorFollower() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const rafId = useRef<number | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only show on desktop
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia('(min-width: 1024px)').matches && window.matchMedia('(pointer: fine)').matches);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    if (!isDesktop) return;

    // Use requestAnimationFrame for smooth updates
    const updatePosition = () => {
      setPosition({ x: mousePos.current.x, y: mousePos.current.y });
      rafId.current = requestAnimationFrame(updatePosition);
    };

    const updateCursor = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(updatePosition);
      }
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    // Track interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea, select');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    window.addEventListener('mousemove', updateCursor, { passive: true });
    
    // Start animation loop
    rafId.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('resize', checkDesktop);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <>
      {/* Main cursor - no transition for instant response */}
      <div
        className="fixed top-0 left-0 w-6 h-6 rounded-full bg-primary/30 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          transform: `translate(${position.x - 12}px, ${position.y - 12}px)`,
          transition: 'none',
        }}
      />
      
      {/* Outer ring - minimal transition */}
      <div
        className={`fixed top-0 left-0 w-12 h-12 rounded-full border-2 border-primary/50 pointer-events-none z-[9998] transition-all duration-150 ease-out ${
          isHovering ? 'scale-150 border-primary bg-primary/10' : ''
        }`}
        style={{
          transform: `translate(${position.x - 24}px, ${position.y - 24}px)`,
        }}
      />
      
      {/* Trailing dots - faster transitions */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="fixed top-0 left-0 w-2 h-2 rounded-full bg-primary/40 pointer-events-none z-[9997]"
          style={{
            transform: `translate(${position.x - 4 - i * 6}px, ${position.y - 4 - i * 6}px)`,
            transition: `transform ${0.05 + i * 0.02}s linear`,
            opacity: 0.7 - i * 0.2,
          }}
        />
      ))}
    </>
  );
}

