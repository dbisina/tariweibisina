"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./logo";

const MIN_DURATION_MS = 2200;

export function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [curtainUp, setCurtainUp] = useState(false);
  const [mounted, setMounted] = useState(true);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, Math.round((elapsed / MIN_DURATION_MS) * 100));
      setProgress(pct);
    }, 40);

    const doneTimer = window.setTimeout(() => {
      window.clearInterval(interval);
      setProgress(100);
      setCurtainUp(true);
      window.setTimeout(() => setMounted(false), 900);
    }, MIN_DURATION_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted) {
      const id = window.setTimeout(onDone, 50);
      return () => window.clearTimeout(id);
    }
  }, [mounted, onDone]);

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-bg"
          initial={{ opacity: 1 }}
          exit={{
            clipPath: "inset(0 0 100% 0)",
            transition: { duration: 0.9, ease: [0.7, 0, 0.2, 1] },
          }}
          style={{ clipPath: "inset(0 0 0% 0)" }}
        >
          <Logo
            variant="draw"
            drawDelay={0.15}
            className="w-[min(680px,74vw)] h-auto text-ink"
          />
          <div className="mt-11 w-[min(680px,74vw)]">
            <div className="h-px bg-ln overflow-hidden">
              <motion.div
                className="h-px bg-acc origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: curtainUp ? 1 : progress / 100 }}
                transition={
                  curtainUp
                    ? { duration: 0.2, ease: "easeOut" }
                    : { ease: "linear", duration: 0.05 }
                }
              />
            </div>
            <div className="mt-3.5 flex justify-between font-mono text-[11px] tracking-[0.16em] text-mut">
              <span>DANIEL TARIWEI BISINA — PORTFOLIO</span>
              <span className="text-ink">{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
