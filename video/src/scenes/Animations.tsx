import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { colors } from "../theme";

// --- Animated horizontal line that draws across ---
export const DrawLine: React.FC<{
  delay?: number;
  color?: string;
  height?: number;
  width?: string | number;
  originX?: "left" | "center" | "right";
  style?: React.CSSProperties;
}> = ({ delay = 0, color = colors.foreground, height = 2, width = "100%", originX = "left", style }) => {
  const frame = useCurrentFrame();
  const scaleX = interpolate(frame, [delay, delay + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: color,
        transform: `scaleX(${scaleX})`,
        transformOrigin: originX,
        ...style,
      }}
    />
  );
};

// --- Floating shapes that drift in the background ---
export const FloatingShapes: React.FC<{ count?: number; color?: string }> = ({
  count = 6,
  color = colors.accent,
}) => {
  const frame = useCurrentFrame();
  const shapes = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: (i * 317) % 100,
      y: (i * 523) % 100,
      size: 20 + ((i * 73) % 60),
      speed: 0.3 + (i % 3) * 0.2,
      type: i % 3, // 0=circle, 1=square, 2=line
      rotation: (i * 47) % 360,
    }));
  }, [count]);

  return (
    <>
      {shapes.map((s, i) => {
        const x = s.x + Math.sin((frame * s.speed * 0.02) + i) * 30;
        const y = s.y + Math.cos((frame * s.speed * 0.015) + i * 2) * 20;
        const rot = s.rotation + frame * s.speed * 0.5;
        const opacity = 0.06 + (i % 3) * 0.02;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: s.size,
              height: s.type === 2 ? 3 : s.size,
              borderRadius: s.type === 0 ? "50%" : 0,
              backgroundColor: "transparent",
              border: `2px solid ${color}`,
              opacity,
              transform: `rotate(${rot}deg)`,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};

// --- Kinetic text: words appear one at a time with spring ---
export const KineticText: React.FC<{
  text: string;
  delay?: number;
  staggerMs?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: string;
  color?: string;
  style?: React.CSSProperties;
}> = ({
  text,
  delay = 0,
  staggerMs = 4,
  fontSize = 72,
  fontFamily,
  fontWeight = 400,
  fontStyle = "normal",
  color = colors.foreground,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${fontSize * 0.3}px`, ...style }}>
      {words.map((word, i) => {
        const wordDelay = delay + i * staggerMs;
        const y = spring({
          frame: Math.max(0, frame - wordDelay),
          fps,
          from: 40,
          to: 0,
          durationInFrames: 15,
          config: { damping: 12, mass: 0.4 },
        });
        const opacity = interpolate(frame, [wordDelay, wordDelay + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${y}px)`,
              fontFamily,
              fontSize,
              fontWeight,
              fontStyle,
              color,
              lineHeight: 1.2,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// --- Wipe transition overlay ---
export const WipeTransition: React.FC<{
  direction?: "left" | "right";
  color?: string;
  startFrame: number;
  durationFrames?: number;
}> = ({ direction = "left", color = colors.foreground, startFrame, durationFrames = 15 }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames, startFrame + durationFrames + 5, startFrame + durationFrames * 2 + 5],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: color,
        transform: direction === "left" ? `translateX(${(progress - 1) * 100}%)` : `translateX(${(1 - progress) * 100}%)`,
        zIndex: 100,
        pointerEvents: "none",
      }}
    />
  );
};

// --- Pulsing dot ---
export const PulsingDot: React.FC<{
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ color = colors.accent, size = 12, style }) => {
  const frame = useCurrentFrame();
  const scale = 1 + Math.sin(frame * 0.15) * 0.3;
  const glowOpacity = 0.3 + Math.sin(frame * 0.15) * 0.2;

  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <div
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          backgroundColor: color,
          opacity: glowOpacity,
          transform: `scale(${scale})`,
        }}
      />
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
    </div>
  );
};

// --- Counter that counts up ---
export const CountUp: React.FC<{
  from: number;
  to: number;
  startFrame: number;
  durationFrames?: number;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({ from, to, startFrame, durationFrames = 30, suffix = "", style }) => {
  const frame = useCurrentFrame();
  const value = interpolate(frame, [startFrame, startFrame + durationFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <span style={style}>{Math.round(value)}{suffix}</span>;
};
