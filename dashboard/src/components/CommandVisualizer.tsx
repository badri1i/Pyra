import { useDataChannel } from "@livekit/components-react";
import { useState } from "react";

/**
 * FR-024: Command State Visualizer
 *
 * Listens for agent state broadcasts via LiveKit Data Packets
 * and displays the current command in a visual state indicator.
 */
export function CommandVisualizer() {
  const [commandState, setCommandState] = useState<any>(null);

  // Listen for "agent-state" topic from the agent
  useDataChannel((msg) => {
    if (msg.topic === "agent-state") {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload));
      console.log('[Dashboard] Received agent state:', payload);
      setCommandState(payload);
    }
  });

  if (!commandState) {
    return <div style={styles.placeholder}>Waiting for command...</div>;
  }

  const isPending = commandState.state === "PENDING_VERIFICATION";
  const isExecuted = commandState.state === "EXECUTED";

  return (
    <div style={{
      ...styles.card,
      borderColor: isPending ? '#f1c40f' : isExecuted ? '#2ecc71' : '#fff'
    }}>
      <h2 style={{ margin: 0 }}>
        {isPending ? "⚠️ VERIFICATION REQUIRED" : "✅ COMMAND EXECUTED"}
      </h2>

      <div style={styles.details}>
        <div><strong>Action:</strong> {commandState.action}</div>
        {commandState.amount && <div><strong>Amount:</strong> {commandState.amount}</div>}
        {commandState.target && <div><strong>Target:</strong> {commandState.target}</div>}
        {commandState.txHash && <div><strong>TX Hash:</strong> {commandState.txHash}</div>}
      </div>

      {isPending && (
        <div style={styles.instruction}>
          PLEASE SAY "YES" TO CONFIRM
        </div>
      )}
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
    background: '#222',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #333',
    width: '300px',
    marginTop: '20px',
    textAlign: 'left'
  },
  details: {
    marginTop: '15px',
    lineHeight: '1.6',
    fontSize: '0.95em'
  },
  instruction: {
    marginTop: '15px',
    color: '#f1c40f',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: '0.9em'
  }
};
