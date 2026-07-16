import React from "react";
import { Composition } from "remotion";
import { Walkthrough, manifestDurationInFrames } from "./Walkthrough";
import { ALL_MANIFESTS } from "./manifests";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {ALL_MANIFESTS.map((m) => (
        <Composition
          key={m.id}
          id={m.id}
          component={Walkthrough}
          durationInFrames={manifestDurationInFrames(m, FPS)}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{ manifest: m }}
        />
      ))}
    </>
  );
};
