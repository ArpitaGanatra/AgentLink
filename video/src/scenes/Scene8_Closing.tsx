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

export const Scene8_Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Icon zooms in from tiny with rotation
  const iconScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 25, config: { damping: 8, mass: 0.5 } });
  const iconOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const iconRotate = spring({ frame, fps, from: 180, to: 0, durationInFrames: 30, config: { damping: 12 } });

  // Title types in from left
  const titleOpacity = interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" });
  const titleX = spring({ frame: Math.max(0, frame - 15), fps, from: -60, to: 0, durationInFrames: 20, config: { damping: 12 } });

  // Tagline
  const taglineOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });

  // Continuous subtle float
  const floatY = Math.sin(frame * 0.04) * 4;

  // Pulsing accent brightness
  const brightness = 1 + Math.sin(frame * 0.08) * 0.08;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <FloatingShapes count={6} color={colors.accent} />

      <div style={{ transform: `translateY(${floatY}px)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Bot icon */}
        <div
          style={{
            opacity: iconOpacity,
            transform: `scale(${iconScale}) rotate(${iconRotate}deg)`,
            marginBottom: 28,
          }}
        >
          <BotIcon size={100} color={colors.foreground} />
        </div>

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
            fontFamily: fonts.serif,
            fontSize: 110,
            fontStyle: "italic",
            color: colors.foreground,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          Agent<span style={{ color: colors.accent, filter: `brightness(${brightness})` }}>Link</span>
        </div>

        {/* Animated divider */}
        <div style={{ marginTop: 28, marginBottom: 28, width: 400 }}>
          <DrawLine delay={30} color={colors.foreground} height={3} originX="center" />
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            fontFamily: fonts.sans,
            fontSize: 22,
            color: colors.foregroundMuted,
            marginTop: 24,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Identity, Payments & Jobs for Autonomous AI Agents on Solana
        </div>
      </div>
    </AbsoluteFill>
  );
};
