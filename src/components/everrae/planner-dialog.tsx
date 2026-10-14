"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Local planner dialog: focus containment, Escape, backdrop and return focus. */
export function PlannerDialog({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const elements = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, a[href], [tabindex="0"]') || []);
    (elements()[0] || ref.current)?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key === "Tab") {
        const items = elements();
        const first = items[0]; const last = items[items.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = bodyOverflow; previous?.focus(); };
  }, []);
  return createPortal(<div className="planner-backdrop" style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(15,23,18,.65)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} style={{background:'#fff',color:'#27382f',borderRadius:20,border:'1px solid #d6ddd5',maxHeight:'85dvh',overflowY:'auto',width:'100%',maxWidth:560,boxShadow:'0 24px 80px #0006'}}>{children}</div></div>,document.body);
}
