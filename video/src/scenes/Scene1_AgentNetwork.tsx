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

// Random agent positions - 14 agents for dense network
const agents = [
  { x: 25, y: 18, size: 66 },
  { x: 72, y: 15, size: 62 },
  { x: 85, y: 38, size: 68 },
  { x: 90, y: 62, size: 64 },
  { x: 78, y: 82, size: 66 },
  { x: 48, y: 90, size: 62 },
  { x: 18, y: 78, size: 64 },
  { x: 8, y: 52, size: 66 },
  { x: 12, y: 28, size: 68 },
  { x: 52, y: 25, size: 64 },
  { x: 65, y: 48, size: 70 },
  { x: 45, y: 60, size: 66 },
  { x: 30, y: 45, size: 64 },
  { x: 58, y: 70, size: 62 },
];

// Dense mesh connections
const connections = [
  // Outer perimeter
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0],
  // Inner connections
  [9, 1], [9, 2], [9, 10],
  [10, 2], [10, 3], [10, 13],
  [11, 5], [11, 6], [11, 13],
  [12, 0], [12, 8], [12, 7],
  // Cross network
  [0, 10], [2, 11], [4, 12], [6, 9],
];

// Background particles
const particles = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 73) % 100,
  y: (i * 127) % 100,
  size: 2 + (i % 3),
  speed: 0.1 + (i % 5) * 0.05,
}));

export const Scene1_AgentNetwork: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera zoom effect
  const sceneScale = interpolate(frame, [0, 60], [0.92, 1], { extrapolateRight: "clamp" });

  // Globe rotation
  const globeRotation = frame * 0.25;

  // Agent nodes appear first with stagger
  const agentsOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });

  // Connections draw after agents are visible
  const connectionProgress = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: "clamp" });

  // Global pulse effect
  const globalPulse = 1 + Math.sin(frame * 0.1) * 0.03;

  // Keep network visible - no early fadeout
  const agentsFadeOut = 1;

  // Text phases
  const phase1Start = 85;
  const phase2Start = 150;
  const phase3Start = 215;

  const text1Opacity = interpolate(frame, [phase1Start, phase1Start + 15], [0, 1], { extrapolateRight: "clamp" });
  const text1FadeOut = interpolate(frame, [phase2Start - 10, phase2Start], [1, 0], { extrapolateLeft: "clamp" });
  const text1Scale = spring({ frame: Math.max(0, frame - phase1Start), fps, from: 0.95, to: 1, durationInFrames: 20 });

  const text2Opacity = interpolate(frame, [phase2Start, phase2Start + 15], [0, 1], { extrapolateRight: "clamp" });
  const text2FadeOut = interpolate(frame, [phase3Start - 10, phase3Start], [1, 0], { extrapolateLeft: "clamp" });
  const text2Scale = spring({ frame: Math.max(0, frame - phase2Start), fps, from: 0.95, to: 1, durationInFrames: 20 });

  const text3Opacity = interpolate(frame, [phase3Start, phase3Start + 15], [0, 1], { extrapolateRight: "clamp" });
  const text3Scale = spring({ frame: Math.max(0, frame - phase3Start), fps, from: 0.9, to: 1, durationInFrames: 25, config: { damping: 8 } });

  // Fade network behind text, then fade more for Scene 2
  const networkFade = interpolate(frame, [75, 90], [1, 0.25], { extrapolateRight: "clamp" });
  const networkBlur = interpolate(frame, [75, 90], [0, 8], { extrapolateRight: "clamp" });

  const finalFadeOut = interpolate(frame, [280, 300], [1, 0.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blurAmount = Math.max(networkBlur, interpolate(frame, [280, 300], [0, 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        opacity: finalFadeOut,
      }}
    >
      {/* Background particles */}
      <div style={{ opacity: agentsOpacity * agentsFadeOut * 0.6, position: "absolute", inset: 0 }}>
        {particles.map((p, i) => {
          const y = p.y + (Math.sin(frame * p.speed * 0.02 + i) * 3);
          const twinkle = 0.3 + Math.sin(frame * 0.1 + i) * 0.3;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${y}%`,
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                backgroundColor: colors.accent,
                opacity: twinkle,
                filter: "blur(1px)",
              }}
            />
          );
        })}
      </div>

      {/* Scene container with zoom */}
      <div style={{ transform: `scale(${sceneScale})`, width: "100%", height: "100%", position: "relative", filter: `blur(${blurAmount}px)` }}>
        {/* Enhanced 3D Globe */}
        <div
          style={{
            opacity: agentsOpacity * agentsFadeOut * 0.35,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%)`,
            width: 1100,
            height: 1100,
          }}
        >
          <svg width="1100" height="1100" viewBox="0 0 1100 1100">
            <defs>
              <radialGradient id="globeGlow">
                <stop offset="0%" stopColor={colors.accent} stopOpacity="0.08" />
                <stop offset="40%" stopColor={colors.foreground} stopOpacity="0.12" />
                <stop offset="70%" stopColor={colors.foreground} stopOpacity="0.06" />
                <stop offset="100%" stopColor={colors.background} stopOpacity="0" />
              </radialGradient>

              <radialGradient id="globeSurface">
                <stop offset="30%" stopColor={colors.foreground} stopOpacity="0.15" />
                <stop offset="65%" stopColor={colors.foreground} stopOpacity="0.08" />
                <stop offset="100%" stopColor={colors.foreground} stopOpacity="0.02" />
              </radialGradient>
            </defs>

            {/* Outer glow */}
            <circle cx="550" cy="550" r="520" fill="url(#globeGlow)" />

            {/* Globe surface */}
            <circle cx="550" cy="550" r="480" fill="url(#globeSurface)" />
            <circle cx="550" cy="550" r="480" fill="none" stroke={colors.foreground} strokeWidth="2" opacity="0.35" />

            {/* Rotating grid */}
            <g transform={`rotate(${globeRotation} 550 550)`}>
              {/* Meridians */}
              {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((angle) => (
                <ellipse
                  key={`meridian-${angle}`}
                  cx="550"
                  cy="550"
                  rx={480 * Math.abs(Math.cos((angle * Math.PI) / 180))}
                  ry="480"
                  fill="none"
                  stroke={colors.foreground}
                  strokeWidth="1.2"
                  opacity="0.25"
                />
              ))}
            </g>

            {/* Parallels */}
            {[0.18, 0.35, 0.5, 0.65, 0.82].map((ratio) => (
              <ellipse
                key={`parallel-${ratio}`}
                cx="550"
                cy="550"
                rx="480"
                ry={480 * Math.sin(ratio * Math.PI)}
                fill="none"
                stroke={colors.foreground}
                strokeWidth="1.2"
                opacity="0.25"
              />
            ))}

            {/* Equator highlighted */}
            <ellipse
              cx="550"
              cy="550"
              rx="480"
              ry="480"
              fill="none"
              stroke={colors.accent}
              strokeWidth="2"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Network visualization */}
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {/* Connections - separate opacity control */}
          <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, opacity: connectionProgress * agentsFadeOut * networkFade }}>
            {/* Connections */}
            {connections.map(([i, j], idx) => {
              const a = agents[i];
              const b = agents[j];
              const delay = idx * 1;
              const lineOpacity = interpolate(frame, [30 + delay, 42 + delay], [0, 0.85], { extrapolateRight: "clamp" });

              // Data packet animation
              const x1 = (a.x / 100) * 1920;
              const y1 = (a.y / 100) * 1080;
              const x2 = (b.x / 100) * 1920;
              const y2 = (b.y / 100) * 1080;
              const packetProgress = ((frame * 1.5 + idx * 8) % 50) / 50;
              const packetX = x1 + (x2 - x1) * packetProgress;
              const packetY = y1 + (y2 - y1) * packetProgress;

              // Pulse wave
              const pulsePhase = ((frame * 0.5 + idx * 5) % 60) / 60;
              const pulseOpacity = Math.sin(pulsePhase * Math.PI) * 0.5;

              return (
                <React.Fragment key={idx}>
                  {/* Glow layer */}
                  <line
                    x1={`${a.x}%`}
                    y1={`${a.y}%`}
                    x2={`${b.x}%`}
                    y2={`${b.y}%`}
                    stroke={colors.accent}
                    strokeWidth="10"
                    opacity={lineOpacity * connectionProgress * 0.12}
                    filter="blur(8px)"
                  />

                  {/* Pulse glow */}
                  <line
                    x1={`${a.x}%`}
                    y1={`${a.y}%`}
                    x2={`${b.x}%`}
                    y2={`${b.y}%`}
                    stroke={colors.accent}
                    strokeWidth="4"
                    opacity={pulseOpacity * connectionProgress}
                    filter="blur(3px)"
                  />

                  {/* Main line */}
                  <line
                    x1={`${a.x}%`}
                    y1={`${a.y}%`}
                    x2={`${b.x}%`}
                    y2={`${b.y}%`}
                    stroke={colors.accent}
                    strokeWidth="2"
                    opacity={lineOpacity * connectionProgress}
                  />

                  {/* Traveling data packets */}
                  {connectionProgress > 0.6 && (
                    <>
                      <circle cx={packetX} cy={packetY} r="8" fill={colors.accent} opacity={0.3} filter="blur(4px)" />
                      <circle cx={packetX} cy={packetY} r="4" fill={colors.accent} opacity={0.9} />
                      <circle cx={packetX} cy={packetY} r="2" fill="white" opacity={0.8} />
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </svg>

          {/* Agent nodes - separate opacity control */}
          <div style={{ position: "absolute", inset: 0, opacity: agentsOpacity * agentsFadeOut * networkFade }}>
          {agents.map((agent, i) => {
            const delay = i * 2; // Faster stagger
            const nodeOpacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
            const scale = spring({
              frame: Math.max(0, frame - delay),
              fps,
              from: 0,
              to: 1,
              durationInFrames: 18,
              config: { damping: 10, mass: 0.5 }
            });

            const pulse = i % 2 === 0 ? globalPulse : 1;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${agent.x}%`,
                  top: `${agent.y}%`,
                  transform: `translate(-50%, -50%) scale(${scale * pulse})`,
                  opacity: nodeOpacity,
                }}
              >
                {/* Triple glow layers */}
                <div style={{ position: "absolute", inset: -25, borderRadius: "50%", backgroundColor: colors.accent, opacity: 0.08, filter: "blur(20px)" }} />
                <div style={{ position: "absolute", inset: -15, borderRadius: "50%", backgroundColor: colors.accent, opacity: 0.15, filter: "blur(12px)" }} />
                <div style={{ position: "absolute", inset: -8, borderRadius: "50%", backgroundColor: colors.accent, opacity: 0.2, filter: "blur(6px)" }} />

                {/* Agent icon */}
                <BotIcon size={agent.size} color={colors.foreground} strokeWidth={2} />
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Text phases with dramatic animations */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {frame >= phase1Start && frame < phase2Start && (
          <div style={{ opacity: text1Opacity * text1FadeOut, transform: `scale(${text1Scale})` }}>
            <div style={{ fontFamily: fonts.sans, fontSize: 72, fontWeight: 500, color: colors.foreground, textAlign: "center" }}>
              agents can <span style={{ color: colors.accent, fontFamily: fonts.serif, fontStyle: "italic", fontSize: 80 }}>think</span>
            </div>
          </div>
        )}

        {frame >= phase2Start && frame < phase3Start && (
          <div style={{ opacity: text2Opacity * text2FadeOut, transform: `scale(${text2Scale})` }}>
            <div style={{ fontFamily: fonts.sans, fontSize: 72, fontWeight: 500, color: colors.foreground, textAlign: "center" }}>
              agents can <span style={{ color: colors.accent, fontFamily: fonts.serif, fontStyle: "italic", fontSize: 80 }}>code</span>
            </div>
          </div>
        )}

        {frame >= phase3Start && (
          <div style={{ opacity: text3Opacity, transform: `scale(${text3Scale})` }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 88, fontStyle: "italic", color: colors.accent, textAlign: "center" }}>
              but can't be hired
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
