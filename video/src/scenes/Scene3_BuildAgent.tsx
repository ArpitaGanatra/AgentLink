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
import { PulsingDot } from "./Animations";

const features = [
  { label: "Trained on private data", angle: -120 },
  { label: "Specialized skills", angle: 0 },
  { label: "Any framework", angle: 120 },
];

export const Scene3_BuildAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 20, config: { damping: 10 } });

  // Center agent appears
  const agentOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const agentScale = spring({ frame: Math.max(0, frame - 20), fps, from: 0, to: 1, durationInFrames: 25, config: { damping: 8 } });

  // Agent continuous pulse
  const agentPulse = 1 + Math.sin(frame * 0.1) * 0.05;

  // Fade out
  const fadeOut = interpolate(frame, [130, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
        opacity: fadeOut,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 68,
            fontStyle: "italic",
            color: colors.foreground,
          }}
        >
          Build <span style={{ color: colors.accent }}>Your Agent</span>
        </div>
      </div>

      {/* Center agent */}
      <div
        style={{
          opacity: agentOpacity,
          transform: `scale(${agentScale * agentPulse})`,
          position: "relative",
          width: 200,
          height: 200,
          borderRadius: "50%",
          backgroundColor: colors.cardBg,
          border: `3px solid ${colors.accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 40px ${colors.accent}40`,
        }}
      >
        <BotIcon size={100} color={colors.accent} strokeWidth={1.5} />
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
          }}
        >
          <PulsingDot color={colors.secondary} size={16} />
        </div>
      </div>

      {/* Feature connections */}
      {features.map((feature, i) => {
        const delay = 45 + i * 15;
        const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
        const scale = spring({ frame: Math.max(0, frame - delay), fps, from: 0.5, to: 1, durationInFrames: 20, config: { damping: 10 } });

        // Calculate position on circle
        const radius = 350;
        const angleRad = (feature.angle * Math.PI) / 180;
        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;

        // Line animation
        const lineLength = interpolate(frame, [delay, delay + 20], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        return (
          <React.Fragment key={i}>
            {/* Connecting line */}
            <svg
              width="1920"
              height="1080"
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
              <line
                x1="960"
                y1="540"
                x2={960 + x}
                y2={540 + y}
                stroke={colors.accent}
                strokeWidth="2"
                strokeDasharray={`${lineLength} 100`}
                opacity={opacity * 0.4}
              />
            </svg>

            {/* Feature label */}
            <div
              style={{
                position: "absolute",
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity,
                padding: "16px 28px",
                backgroundColor: colors.cardBg,
                border: `2px solid ${colors.cardBorder}`,
                borderRadius: 2,
                boxShadow: `4px 4px 0 0 ${colors.accent}`,
                whiteSpace: "nowrap" as const,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 20,
                  fontWeight: 700,
                  color: colors.foreground,
                }}
              >
                {feature.label}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
