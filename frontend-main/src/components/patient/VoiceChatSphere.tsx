import { VoiceChatFlowCanvas } from "./VoiceChatFlowCanvas";
import "./PatientVoiceChat.css";

type SphereState = "" | "listening" | "speaking" | "thinking";

interface Props {
  state: SphereState;
}

/** Health chat visual — flowing lines (landing-page style), state-aware. */
export function VoiceChatSphere({ state }: Props) {
  return (
    <div className={`pvc-flow-visual ${state || "idle"}`}>
      <VoiceChatFlowCanvas state={state} className="pvc-flow-canvas" />
      <div className={`pvc-flow-glow ${state || "idle"}`} />
    </div>
  );
}
