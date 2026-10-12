"use client";

import { useEffect } from "react";

/** Progressively enhances the landing only; content stays visible without JS. */
export function ScrollMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".everrae");
    if (!root || !window.IntersectionObserver) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const reset = () => {
      observer?.disconnect();
      root.querySelectorAll<HTMLElement>(".er-scroll-reveal").forEach(el => {
        el.classList.remove("er-scroll-reveal", "er-scroll-visible");
        el.style.removeProperty("--er-reveal-delay");
      });
    };
    const start = () => {
      reset();
      if (preference.matches) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("er-scroll-visible");
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
      root.querySelectorAll<HTMLElement>("section").forEach(section => {
        // Leave the hero and initially visible content alone.
        if (section.getBoundingClientRect().top < window.innerHeight) return;
        const targets = Array.from(section.children).filter(el => el.tagName !== "STYLE");
        (targets.length ? targets : [section]).forEach((el, index) => {
          const target = el as HTMLElement;
          target.classList.add("er-scroll-reveal");
          target.style.setProperty("--er-reveal-delay", `${Math.min(index, 3) * 90}ms`);
          observer?.observe(target);
        });
      });
    };
    start();
    preference.addEventListener("change", start);
    return () => { reset(); preference.removeEventListener("change", start); };
  }, []);
  return null;
}
