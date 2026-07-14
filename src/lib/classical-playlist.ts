/**
 * Classical playlist for the "Classical" audio mode. Drop real audio files
 * into public/music/classical/ and list them here — one track plays per day
 * (deterministic, same track all day for every visitor, rotates at
 * midnight), looping for the whole session. Once the rotation reaches the
 * end of the list it wraps back to the first track.
 *
 * Empty by default: with no tracks, "Classical" silently behaves like
 * "Silence" rather than erroring.
 */
export interface Track {
  title: string;
  src: string; // e.g. "/music/classical/chopin-nocturne-op9-no2.mp3"
}

export const CLASSICAL_PLAYLIST: Track[] = [
  // { title: "Chopin — Nocturne Op. 9 No. 2", src: "/music/classical/01.mp3" },
];

/** Deterministic day-of-year index — every visitor gets the same track on
 * the same calendar day, and the pick rotates forward one each midnight. */
export function trackOfTheDay(playlist: Track[] = CLASSICAL_PLAYLIST): Track | null {
  if (playlist.length === 0) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return playlist[dayOfYear % playlist.length];
}
