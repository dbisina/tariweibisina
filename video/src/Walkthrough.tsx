import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Rubik";
import type { PageScene, SiteManifest } from "./types";
import { BrowserFrame } from "./components/BrowserFrame";
import { Cursor } from "./components/Cursor";
import { Caption, IntroCard, OutroCard } from "./components/Cards";

loadFont();

// render-size constants: 1920x1080 video, browser frame centered
const FRAME_W = 1680;
const FRAME_H = 920;
const FADE_SEC = 0.4;

const PageSceneView: React.FC<{ scene: PageScene; url: string; accent: string; durationInFrames: number }> = ({
  scene,
  url,
  accent,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // captured page CSS px → rendered px inside the frame viewport
  const scale = FRAME_W / scene.capturedWidth;
  const scrollFrom = (scene.scroll?.from ?? 0) * scale;
  const scrollTo = (scene.scroll?.to ?? scene.scroll?.from ?? 0) * scale;
  // hold briefly, then glide — reads as a person scrolling, not a conveyor
  const y = interpolate(
    frame,
    [0.6 * fps, Math.max(0.6 * fps + 1, durationInFrames - 0.5 * fps)],
    [-scrollFrom, -scrollTo],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 0, 0.2, 1) }
  );

  const zoom = scene.zoom
    ? interpolate(frame, [0, durationInFrames], [scene.zoom.from, scene.zoom.to], {
        extrapolateRight: "clamp",
      })
    : 1;

  const fade = interpolate(
    frame,
    [0, FADE_SEC * fps, durationInFrames - FADE_SEC * fps, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(1400px 900px at 50% 0%, #17171b, #0b0b0c)",
        alignItems: "center",
        justifyContent: "center",
        opacity: fade,
      }}
    >
      <div style={{ transform: `scale(${zoom})` }}>
        <BrowserFrame url={url} width={FRAME_W} height={FRAME_H} accent={accent}>
          <Img
            src={staticFile(scene.image)}
            style={{
              width: FRAME_W,
              display: "block",
              transform: `translateY(${y}px)`,
            }}
          />
          {scene.cursor && <Cursor waypoints={scene.cursor} width={FRAME_W} height={FRAME_H} />}
        </BrowserFrame>
      </div>
      {scene.caption && <Caption text={scene.caption} accent={accent} />}
    </AbsoluteFill>
  );
};

export const Walkthrough: React.FC<{ manifest: SiteManifest }> = ({ manifest }) => {
  const { fps } = useVideoConfig();
  let cursor = 0;

  return (
    <AbsoluteFill style={{ background: "#0b0b0c" }}>
      {manifest.scenes.map((scene, i) => {
        const durationInFrames = Math.round(scene.durationSec * fps);
        const from = cursor;
        cursor += durationInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames}>
            {scene.kind === "intro" ? (
              <IntroCard title={scene.title} subtitle={scene.subtitle} accent={scene.accent} />
            ) : scene.kind === "outro" ? (
              <OutroCard url={scene.url} line={scene.line} accent={scene.accent} />
            ) : (
              <PageSceneView
                scene={scene}
                url={sceneUrl(manifest, scene)}
                accent={manifest.accent}
                durationInFrames={durationInFrames}
              />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** URL pill text: derive from the outro url + image name so manifests stay terse. */
function sceneUrl(manifest: SiteManifest, scene: PageScene): string {
  const outro = manifest.scenes.find((s) => s.kind === "outro");
  const base = outro && outro.kind === "outro" ? outro.url : manifest.name;
  const page = scene.image.split("/").pop()?.replace(".png", "") ?? "";
  return page === "home" ? base : `${base}/${page}`;
}

export function manifestDurationInFrames(manifest: SiteManifest, fps: number): number {
  return manifest.scenes.reduce((sum, s) => sum + Math.round(s.durationSec * fps), 0);
}
