import { useConnectionState, useDataChannel } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { useState } from "react";

export function CommandVisualizer() {
  const [state, setState] = useState<any>({});
  const [steps, setSteps] = useState<Record<string, { status: string, detail?: string, issues?: string[] }>>({});
  const [globalStatus, setGlobalStatus] = useState<"IDLE" | "PENDING" | "EXECUTED" | "ABORTED">("IDLE");
  const connectionState = useConnectionState();

  useDataChannel("agent-state", (msg) => {
    const payload = JSON.parse(new TextDecoder().decode(msg.payload));

    if (payload.type === "GATE_UPDATE") {
      if (payload.state === "PENDING") {
        setSteps({ VERIFICATION: { status: "WAITING" } });
        setState(payload);
        setGlobalStatus("PENDING");
      } else {
        const detail = payload.resolved || payload.hash || payload.error || payload.reason || payload.contract;

        setState((prev: any) => ({
          ...prev,
          action: payload.action ?? prev.action,
          amount: payload.amount ?? prev.amount,
          target: payload.target ?? prev.target,
        }));

        // Track Global Status based on Gate results
        if (payload.state === "FAILED") {
          setGlobalStatus("ABORTED");
        } else if (payload.state === "SUCCESS") {
          setGlobalStatus("EXECUTED");
        } else {
          setGlobalStatus((prev) => (prev === "IDLE" ? "PENDING" : prev));
        }

        setSteps(prev => ({ ...prev, [payload.step]: { status: payload.state, detail, issues: payload.issues } }));
      }
    }
  });

  const isIdle = globalStatus === "IDLE";
  const placeholderText =
    connectionState === ConnectionState.Connected
      ? "Session live. Say a command to begin."
      : "Connect to start session...";

  return (
    <div style={{
        ...styles.card,
        borderColor: globalStatus === "ABORTED" ? '#e74c3c' : globalStatus === "EXECUTED" ? '#2ecc71' : '#333',
        opacity: isIdle ? 0 : 1
    }}>
      {/* FR-094: Command Summary Panel */}
      <div style={styles.summaryPanel}>
        {isIdle ? (
          <>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#e5e7eb' }}>Awaiting command</h2>
            <div style={{ color: '#9aa0a6', fontSize: '0.9rem', marginTop: '6px' }}>{placeholderText}</div>
          </>
        ) : (
          <>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>
              {state.action?.toUpperCase()} <span style={{color: '#f1c40f'}}>{state.amount}</span>
            </h2>
            <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '5px' }}>{state.target}</div>
          </>
        )}

        {/* FR-093: Final Status Display */}
        <div style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {globalStatus === "EXECUTED" && <span style={{color: '#2ecc71'}}>EXECUTED ✓</span>}
            {globalStatus === "ABORTED" && <span style={{color: '#e74c3c'}}>ABORTED ✗</span>}
            {globalStatus === "PENDING" && <span style={{color: '#f1c40f'}}>PROCESSING...</span>}
        </div>
      </div>

      <div style={styles.pipeline}>
        {/* FR-095: Explicit Pending Verification Text is handled inside the Node logic below */}
        <Node label="Voice Verification" data={steps.VERIFICATION} isFirst />
        <Node label="ENS Resolution" data={steps.ENS} />
        <Node label="Address Validation" data={steps.VALIDATION} />
        <Node label="Contract Detection" data={steps.CONTRACT} />
        <Node label="Source Verification" data={steps.SOURCE} />
        <Node label="Kairo Security Scan" data={steps.KAIRO} />
        <Node label="Transaction Execution" data={steps.TX} isLast />
      </div>
    </div>
  );
}

function Node({ label, data, isFirst, isLast }: { label: string, data?: { status: string, detail?: string, issues?: string[] }, isFirst?: boolean, isLast?: boolean }) {
  let color = '#444';
  let icon = '○';
  let connectorColor = '#333';
  let connectorStyle = 'solid';
  let statusText = "";

  // FR-091: Yellow for In-Progress
  if (data?.status === "WAITING" || data?.status === "PENDING") {
      color = '#f1c40f';
      icon = '⚠️';
      connectorColor = '#f1c40f';
      // FR-095: Explicit Text
      if (label === "Voice Verification") statusText = "PENDING VERIFICATION";
  }
  if (data?.status === "RUNNING") {
      color = '#f1c40f'; // FR-091: Yellow
      icon = '⚡';
      connectorColor = '#f1c40f';
  }
  if (data?.status === "WARN") {
      color = '#f39c12';
      icon = '!';
      connectorColor = '#f39c12';
      statusText = "WARNING";
  }
  if (data?.status === "PASSED" || data?.status === "EXECUTED" || data?.status === "SUCCESS") {
      color = '#2ecc71';
      icon = '✓';
      connectorColor = '#2ecc71';
  }
  if (data?.status === "SKIPPED") {
      color = '#666';
      icon = '—';
      connectorColor = '#555';
      statusText = "SKIPPED";
  }

  // FR-092: Severed Connection styling
  if (data?.status === "FAILED") {
      color = '#e74c3c';
      icon = '✕';
      connectorColor = '#e74c3c';
      connectorStyle = 'dashed'; // Visual "Severed" look
  }

  // Handle OFFLINE status (Kairo unavailable)
  if (data?.status === "OFFLINE") {
      color = '#9b59b6'; // Purple for offline
      icon = '⊘';
      connectorColor = '#9b59b6';
      connectorStyle = 'dashed';
      statusText = "OFFLINE";
  }

  return (
    <div style={styles.nodeRow}>
      {/* FR-092: Connector Line */}
      {!isLast && (
        <div style={{
          ...styles.connector,
          borderColor: connectorColor,
          borderLeftStyle: connectorStyle as any,
          opacity: data ? 1 : 0.3
        }} />
      )}

      {/* Node Icon */}
      <div style={{
        ...styles.iconBubble,
        borderColor: color,
        color: data ? '#fff' : '#666',
        background: data ? color : '#111',
      }}>
        {icon}
      </div>

      {/* Content */}
      <div style={styles.nodeContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ fontWeight: 'bold', color: data ? '#fff' : '#666' }}>{label}</div>
            {statusText && <div style={{ color: '#f1c40f', fontSize: '0.8rem', fontWeight: 'bold' }}>{statusText}</div>}
        </div>

        {data?.detail && <div style={styles.detailText}>{data.detail}</div>}

        {data?.issues && data.issues.length > 0 && (
          <ul style={styles.issueList}>
            {data.issues.map((issue, i) => <li key={i}>{issue}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  placeholder: { color: '#666', marginTop: '20vh', fontSize: '1.2rem', letterSpacing: '1px' },
  card: {
    background: '#0a0a0a',
    padding: '30px',
    borderRadius: '16px',
    border: '2px solid #333',
    width: '400px',
    textAlign: 'left',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    position: 'relative',
    transition: 'border-color 0.5s ease, opacity 0.3s ease'
  },
  summaryPanel: {
      borderBottom: '1px solid #222',
      paddingBottom: '20px',
      marginBottom: '20px',
      background: '#111',
      padding: '15px',
      borderRadius: '8px'
  },
  pipeline: { position: 'relative', paddingLeft: '10px' },
  nodeRow: { display: 'flex', position: 'relative', paddingBottom: '30px', cursor: 'default', userSelect: 'none', pointerEvents: 'none' },
  connector: {
    position: 'absolute',
    left: '14px',
    top: '30px',
    bottom: '-5px',
    borderLeftWidth: '2px', // Use border instead of background for dashed style support
    transition: 'all 0.3s'
  },
  iconBubble: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    zIndex: 2,
    marginRight: '15px',
    transition: 'all 0.3s'
  },
  nodeContent: { flex: 1, paddingTop: '4px' },
  detailText: { fontSize: '0.75rem', color: '#aaa', marginTop: '4px', fontFamily: 'monospace', background: '#111', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' },
  issueList: { marginTop: '5px', paddingLeft: '20px', color: '#e74c3c', fontSize: '0.8em' }
};
