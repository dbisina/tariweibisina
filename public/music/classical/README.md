# Classical playlist

Drop your audio files (mp3/m4a) in this folder, then list them in
`src/lib/classical-playlist.ts`:

```ts
export const CLASSICAL_PLAYLIST: Track[] = [
  { title: "Chopin — Nocturne Op. 9 No. 2", src: "/music/classical/01.mp3" },
  { title: "Debussy — Clair de Lune", src: "/music/classical/02.mp3" },
];
```

One track plays per calendar day (same track for everyone that day, rotates
at midnight, loops through the whole session), then wraps back to the start
of the list once it reaches the end.
