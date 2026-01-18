import { useDataChannel } from "@livekit/components-react";
import { useState } from "react";

export function CommandVisualizer() {
  const [state, setState] = useState<any>({});
  const [steps, setSteps] = useState<Record<string, { status: string, detail?: string }>>({});
  const [isSevered, setIsSevered] = useState(false);

  useDataChannel((msg) => {
    if (msg.topic === "agent-state") {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload));

      // FR-032: Handle initial PENDING_VERIFICATION state to initialize card
      if (payload.state === "PENDING_VERIFICATION") {
        setSteps({ VERIFICATION: { status: "WAITING" } });
        setState(payload);
        setIsSevered(false);
      } else {
        // Capture specific details (like resolved address, contract name, etc.) if present
        const detail = payload.resolved || payload.hash || payload.error || payload.contract;

        // FR-053: Detect Failure and trigger severed state
        if (payload.state === "FAILED") {
          setIsSevered(true);
        }

        setSteps(prev => ({
          ...prev,
          [payload.step]: {
            status: payload.state,
            detail: detail
          }
        }));
      }
    }
  });

  if (!state.action) return <div style={styles.placeholder}>System Ready.</div>;

  return (
    <div style={{...styles.card, borderColor: isSevered ? '#e74c3c' : '#333', borderWidth: isSevered ? '2px' : '1px'}}>
      <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
        {state.action.toUpperCase()} {state.amount}
      </h2>
      <div style={{ color: '#888', marginBottom: '15px' }}>{state.target}</div>

      <div style={styles.stepsContainer}>
        <StepRow label="Voice Verification" data={steps.VERIFICATION || { status: "PENDING" }} />
        {steps.ENS && <StepRow label="ENS Resolution" data={steps.ENS} />}
        {steps.VALIDATION && <StepRow label="Validating Address" data={steps.VALIDATION} />}
        {steps.SOURCE && <StepRow label="Verified Source" data={steps.SOURCE} />}
        {steps.TX && <StepRow label="Transaction" data={steps.TX} />}
      </div>

      {/* FR-053: Severed Connection Effect */}
      {isSevered && (
        <div style={styles.severed}>
          ❌ CONNECTION SEVERED: UNSAFE
        </div>
      )}
    </div>
  );
}

function StepRow({ label, data }: { label: string, data: { status: string, detail?: string } }) {
  let color = '#666';
  let icon = '⚪';

  if (data.status === "WAITING" || data.status === "PENDING") { color = '#f1c40f'; icon = '⚠️'; }
  if (data.status === "RUNNING") { color = '#3498db'; icon = '⏳'; }
  if (data.status === "PASSED" || data.status === "EXECUTED") { color = '#2ecc71'; icon = '✅'; }

  // FR-053: Red Node for failures
  if (data.status === "FAILED" || data.status === "ABORTED") { color = '#e74c3c'; icon = '🛑'; }

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 'bold' }}>{icon} {data.status}</span>
      </div>
      {/* FR-035: Display the resolved details (e.g. 0x123...) */}
      {data.detail && (
        <div style={{ fontSize: '0.8em', color: '#888', marginTop: '4px', fontFamily: 'monospace' }}>
          {data.detail}
        </div>
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
    border: '1px solid #333',
    width: '320px',
    marginTop: '20px',
    textAlign: 'left',
    transition: 'border-color 0.3s, border-width 0.3s'
  },
  stepsContainer: { display: 'flex', flexDirection: 'column', gap: '5px' },
  severed: {
    marginTop: '15px',
    color: '#e74c3c',
    fontWeight: 'bold',
    textAlign: 'center',
    borderTop: '2px solid #e74c3c',
    paddingTop: '10px',
    fontSize: '0.9rem',
    letterSpacing: '1px'
  }
};
