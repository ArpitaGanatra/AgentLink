import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors } from "../theme";
import { fonts } from "../fonts";
import { BotIcon } from "./BotIcon";
import { FloatingShapes, DrawLine } from "./Animations";

export const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Icon drops in with bounce
  const iconScale = spring({ frame, fps, from: 3, to: 1, durationInFrames: 25, config: { damping: 8, mass: 0.6 } });
  const iconOpacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: "clamp" });
  const iconRotate = spring({ frame, fps, from: -15, to: 0, durationInFrames: 25, config: { damping: 10 } });

  // Title slides up from below
  const titleY = spring({ frame: Math.max(0, frame - 12), fps, from: 80, to: 0, durationInFrames: 20, config: { damping: 12 } });
  const titleOpacity = interpolate(frame, [12, 22], [0, 1], { extrapolateRight: "clamp" });

  // "Link" color pulses
  const accentBrightness = 1 + Math.sin(frame * 0.1) * 0.1;

  // Subtle zoom on entire scene
  const sceneScale = interpolate(frame, [0, 90], [1.05, 1], { extrapolateRight: "clamp" });

  // Fade out
  const fadeOut = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
        transform: `scale(${sceneScale})`,
      }}
    >
      <FloatingShapes count={8} color={colors.accent} />

      {/* Bot icon with bounce */}
      <div
        style={{
          opacity: iconOpacity,
          transform: `scale(${iconScale}) rotate(${iconRotate}deg)`,
          marginBottom: 28,
        }}
      >
        <BotIcon size={110} color={colors.foreground} strokeWidth={1.3} />
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontFamily: fonts.serif,
          fontSize: 120,
          fontStyle: "italic",
          color: colors.foreground,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        Agent<span style={{ color: colors.accent, filter: `brightness(${accentBrightness})` }}>Link</span>
      </div>

      {/* Animated line */}
      <div style={{ marginTop: 24, width: 500 }}>
        <DrawLine delay={25} color={colors.foreground} height={3} />
      </div>
    </AbsoluteFill>
  );
};
