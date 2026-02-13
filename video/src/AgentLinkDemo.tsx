import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { colors } from "./theme";
import { Scene1_AgentNetwork } from "./scenes/Scene1_AgentNetwork";
import { Scene2_Introducing } from "./scenes/Scene2_Introducing";
import { Scene3_BuildAgent } from "./scenes/Scene3_BuildAgent";
import { Scene4_RegisterFlow } from "./scenes/Scene4_RegisterFlow";
import { Scene7_UIShowcase } from "./scenes/Scene7_UIShowcase";
import { Scene8_Closing } from "./scenes/Scene8_Closing";

// Timeline (30fps, ~45s total):
// Scene 1: Agent Network       0-430    (0-14.3s) - fades at 280, stays as background for Scene 2
// Scene 2: Introducing          300-430  (10-14.3s)
// Scene 3: Build Agent          430-580  (14.3-19.3s)
// Scene 4: Register Flow        580-810  (19.3-27s)
// Scene 7: UI Showcase          810-1110 (27-37s)
// Scene 8: Closing              1110-1350 (37-45s)

export const AgentLinkDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Background music */}
      <Audio src={staticFile("music.mp3")} volume={0.3} />

      <Sequence from={0} durationInFrames={430}>
        <Scene1_AgentNetwork />
      </Sequence>

      <Sequence from={300} durationInFrames={130}>
        <Scene2_Introducing />
      </Sequence>

      <Sequence from={430} durationInFrames={150}>
        <Scene3_BuildAgent />
      </Sequence>

      <Sequence from={580} durationInFrames={230}>
        <Scene4_RegisterFlow />
      </Sequence>

      <Sequence from={810} durationInFrames={300}>
        <Scene7_UIShowcase />
      </Sequence>

      <Sequence from={1110} durationInFrames={240}>
        <Scene8_Closing />
      </Sequence>
    </AbsoluteFill>
  );
};
