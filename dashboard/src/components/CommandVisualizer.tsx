import { useDataChannel } from "@livekit/components-react";
import { useState } from "react";

export function CommandVisualizer() {
  const [state, setState] = useState<any>({});
  const [steps, setSteps] = useState<Record<string, { status: string, detail?: string, issues?: string[] }>>({});
  const [isSevered, setIsSevered] = useState(false);

  useDataChannel((msg) => {
    if (msg.topic === "agent-state") {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload));

      // Handle Standard Gate Updates
      if (payload.type === "GATE_UPDATE") {
        if (payload.state === "PENDING") {
          setSteps({ VERIFICATION: { status: "WAITING" } });
          setState(payload);
          setIsSevered(false);
        } else {
          const detail = payload.resolved || payload.hash || payload.error || payload.reason || payload.contract || payload.warning;
          if (payload.state === "FAILED") setIsSevered(true);
          setSteps(prev => ({
            ...prev,
            [payload.step]: {
              status: payload.state,
              detail,
              issues: payload.issues
            }
          }));
        }
      }

      // FR-062: Handle KAIRO_RESULT specific packet
      if (payload.type === "KAIRO_RESULT") {
        console.log("Kairo Result Received:", payload);
        // Could render a specific Kairo modal/panel here if needed
      }
    }
  });

  if (!state.action) return <div style={styles.placeholder}>System Ready.</div>;

  return (
    <div style={{...styles.card, borderColor: isSevered ? '#e74c3c' : '#333'}}>
      <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
        {state.action.toUpperCase()} {state.amount}
      </h2>
      <div style={{ color: '#888', marginBottom: '15px' }}>{state.target}</div>

      <div style={styles.stepsContainer}>
        <StepRow label="Voice Verification" data={steps.VERIFICATION} />
        {steps.ENS && <StepRow label="ENS Resolution" data={steps.ENS} />}
        {steps.VALIDATION && <StepRow label="Address Validation" data={steps.VALIDATION} />}
        {steps.SOURCE && <StepRow label="Verified Source" data={steps.SOURCE} />}
        {steps.KAIRO && <StepRow label="Kairo Security" data={steps.KAIRO} isAnimated={true} />}
        {steps.TX && <StepRow label="Transaction" data={steps.TX} />}
      </div>

      {isSevered && <div style={styles.severed}>❌ CONNECTION SEVERED: UNSAFE</div>}
    </div>
  );
}

function StepRow({ label, data, isAnimated }: { label: string, data?: { status: string, detail?: string, issues?: string[] }, isAnimated?: boolean }) {
  if (!data) return null;

  let color = '#666';
  let icon = '⚪';
  let animationStyle: React.CSSProperties = {};

  if (data.status === "WAITING" || data.status === "PENDING") {
    color = '#f1c40f';
    icon = '⚠️';
  }

  if (data.status === "RUNNING") {
    color = '#3498db';
    icon = '⏳';
    // FR-063: Animation for Running state
    if (isAnimated) {
      animationStyle = { animation: 'pulse 1s infinite' };
    }
  }

  if (data.status === "PASSED" || data.status === "EXECUTED" || data.status === "SUCCESS") {
    color = '#2ecc71';
    icon = '✅';
  }

  if (data.status === "FAILED") {
    color = '#e74c3c';
    icon = '🛑';
  }

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #333', ...animationStyle }}>
      {/* FR-063: Pulse animation for Kairo when running */}
      <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 'bold' }}>{icon} {data.status}</span>
      </div>

      {data.detail && (
        <div style={{ fontSize: '0.7em', color: '#888', marginTop: '4px' }}>
          {data.detail}
        </div>
      )}

      {/* FR-064: Display Vulnerability List */}
      {data.issues && data.issues.length > 0 && (
        <ul style={{ marginTop: '5px', paddingLeft: '20px', color: '#e74c3c', fontSize: '0.7em' }}>
          {data.issues.map((issue, i) => <li key={i}>{issue}</li>)}
        </ul>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  placeholder: { color: '#666', marginTop: '20px' },
  card: {
    background: '#1a1a1a',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #333',
    width: '320px',
    marginTop: '20px',
    textAlign: 'left',
    transition: 'border-color 0.3s'
  },
  stepsContainer: { display: 'flex', flexDirection: 'column', gap: '5px' },
  severed: {
    marginTop: '15px',
    color: '#e74c3c',
    fontWeight: 'bold',
    textAlign: 'center',
    borderTop: '1px solid #e74c3c',
    paddingTop: '10px',
    animation: 'blink 1s infinite'
  }
};
