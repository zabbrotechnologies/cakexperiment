import { useEffect, useRef } from 'react';

/**
 * Lightweight, zero-dependency IntersectionObserver hook for viewport animations.
 * Observes the referenced element or all child elements matching selector.
 * Adds 'is-revealed' class once when entering viewport and stays visible.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  selector?: string;
}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (ref.current) {
        ref.current.classList.add('is-revealed');
        const elements = ref.current.querySelectorAll('.reveal-on-scroll, .reveal-clip');
        elements.forEach(el => el.classList.add('is-revealed'));
      }
      return;
    }

    const target = ref.current;
    if (!target) return;

    const threshold = options?.threshold ?? 0.12;
    const rootMargin = options?.rootMargin ?? '0px 0px -40px 0px';
    const selector = options?.selector ?? '.reveal-on-scroll, .reveal-clip';

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    // If target itself has reveal-on-scroll, observe it
    if (target.classList.contains('reveal-on-scroll')) {
      observer.observe(target);
    }

    // Also observe all matching descendants
    const items = target.querySelectorAll(selector);
    items.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
    };
  }, [options?.threshold, options?.rootMargin, options?.selector]);

  return ref;
}
