"use client";

/**
 * Singleton <audio> element for "Classical" mode, managed imperatively so
 * playback can start inside the same click handler that chose the mode —
 * browsers require a genuine user-gesture call stack for autoplay, and a
 * React-effect-mounted <audio autoPlay> loses that by a tick.
 */
import { trackOfTheDay } from "./classical-playlist";

let audioEl: HTMLAudioElement | null = null;

export function currentTrackTitle(): string | null {
  return trackOfTheDay()?.title ?? null;
}

export function startClassicalAudio() {
  const track = trackOfTheDay();
  if (!track) return; // empty playlist — behaves like silence
  if (!audioEl) {
    audioEl = new Audio(track.src);
    audioEl.loop = true;
    audioEl.volume = 0.55;
  } else if (!audioEl.src.endsWith(track.src)) {
    audioEl.src = track.src;
  }
  audioEl.play().catch(() => {
    /* autoplay blocked — the floating control still lets the visitor hit play */
  });
}

export function stopClassicalAudio() {
  audioEl?.pause();
}

export function toggleClassicalAudio(): boolean {
  if (!audioEl) {
    startClassicalAudio();
    return true;
  }
  if (audioEl.paused) {
    audioEl.play().catch(() => {});
    return true;
  }
  audioEl.pause();
  return false;
}

export function isClassicalPlaying(): boolean {
  return !!audioEl && !audioEl.paused;
}
