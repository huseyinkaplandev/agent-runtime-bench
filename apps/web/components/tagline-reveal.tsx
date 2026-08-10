'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Each word crosses its own trigger line and lights up on its own, in reading
 * order. One observer per word, no scroll listener.
 */
export function TaglineReveal({ text }: { text: string }) {
  const words = text.split(' ');
  const [lit, setLit] = useState<number>(-1);
  const refs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    refs.current.forEach((node, index) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setLit((current) => (index > current ? index : current));
              observer.unobserve(entry.target);
            }
          }
        },
        { rootMargin: '0px 0px -45% 0px' },
      );
      observer.observe(node);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  return (
    <p className="mx-auto max-w-[680px] text-4xl font-semibold text-balance md:text-5xl">
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          ref={(node) => {
            refs.current[index] = node;
          }}
          style={{ transitionDelay: `${(index % 6) * 40}ms` }}
          className={
            index <= lit
              ? 'text-ink transition-colors duration-700 ease-fluid'
              : 'text-ink/30 transition-colors duration-700 ease-fluid'
          }
        >
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
