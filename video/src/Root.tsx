import { Composition } from "remotion";
import { AgentLinkDemo } from "./AgentLinkDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AgentLinkDemo"
        component={AgentLinkDemo}
        durationInFrames={1350}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
