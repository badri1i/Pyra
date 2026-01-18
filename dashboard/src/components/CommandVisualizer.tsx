import { useDataChannel } from "@livekit/components-react";
import { useState, useEffect } from "react";

/**
 * FR-024: Command State Visualizer
 * FR-032: ENS Gate Visualization
 *
 * Listens for agent state broadcasts via LiveKit Data Packets
 * and displays the current command with a step-by-step gate checklist.
 */
export function CommandVisualizer() {
  const [state, setState] = useState<any>({});
  const [steps, setSteps] = useState<Record<string, string>>({});

  // Listen for "agent-state" topic from the agent
  useDataChannel((msg) => {
    if (msg.topic === "agent-state") {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload));
      console.log('[Dashboard] Received agent state:', payload);

      // Reset if new command starts
      if (payload.state === "PENDING_VERIFICATION") {
        setSteps({ VERIFICATION: "WAITING" });
        setState(payload);
      } else {
        // Update specific step status (e.g. ENS -> RUNNING/PASSED/FAILED)
        setSteps(prev => ({ ...prev, [payload.step]: payload.state }));

        // Update global state for additional data
        setState(prev => ({ ...prev, ...payload }));
      }
    }
  });

  if (!state.action) {
    return <div style={styles.placeholder}>System Ready.</div>;
  }

  return (
    <div style={styles.card}>
      <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
        {state.action?.toUpperCase()} {state.amount}
      </h2>
      <div style={{ color: '#888', marginBottom: '15px' }}>{state.target}</div>

      <div style={styles.stepsContainer}>
        <StepRow label="Voice Verification" status={steps.VERIFICATION || "PENDING"} />
        {/* Only show ENS if we have moved past verification */}
        {steps.ENS && <StepRow label="ENS Resolution" status={steps.ENS} />}
        {steps.TX && <StepRow label="Transaction" status={steps.TX} />}
      </div>
    </div>
  );
}

function StepRow({ label, status }: { label: string, status: string }) {
  let color = '#666';
  let icon = '⚪';

  if (status === "WAITING" || status === "PENDING") { color = '#f1c40f'; icon = '⚠️'; }
  if (status === "RUNNING") { color = '#3498db'; icon = '⏳'; }
  if (status === "PASSED" || status === "EXECUTED") { color = '#2ecc71'; icon = '✅'; }
  if (status === "FAILED") { color = '#e74c3c'; icon = '❌'; }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #333'
    }}>
      <span>{label}</span>
      <span style={{ color, fontWeight: 'bold' }}>{icon} {status}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  placeholder: {
    color: '#666',
    marginTop: '20px',
    fontSize: '0.9em'
  },
  card: {
    background: '#1a1a1a',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #333',
    width: '320px',
    marginTop: '20px',
    textAlign: 'left'
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  }
};
