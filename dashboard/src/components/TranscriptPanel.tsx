import { useMemo } from 'react';
import { useRoomContext, useTranscriptions } from '@livekit/components-react';

export function TranscriptPanel() {
  const room = useRoomContext();
  const transcriptions = useTranscriptions();

  const items = useMemo(() => {
    const sorted = [...transcriptions].sort((a, b) => {
      const aTs = Number(a.streamInfo.timestamp ?? 0);
      const bTs = Number(b.streamInfo.timestamp ?? 0);
      return aTs - bTs;
    });
    return sorted.slice(-8);
  }, [transcriptions]);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>Transcript</div>
      <div style={styles.body}>
        {items.length === 0 ? (
          <div style={styles.empty}>Listening...</div>
        ) : (
          items.map((item) => {
            const isLocal = item.participantInfo.identity === room.localParticipant.identity;
            return (
              <div key={item.streamInfo.id} style={styles.line}>
                <span style={isLocal ? styles.userTag : styles.agentTag}>
                  {isLocal ? 'You' : 'Agent'}
                </span>
                <span style={styles.text}>{item.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 'min(92vw, 340px)',
    background: 'rgba(12, 12, 12, 0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '14px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.55)',
  },
  header: {
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontSize: '0.7rem',
    color: '#9fa2a7',
    marginBottom: '10px',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  empty: {
    color: '#6b6e72',
    fontSize: '0.85rem',
  },
  line: {
    display: 'flex',
    gap: '8px',
    alignItems: 'baseline',
  },
  userTag: {
    color: '#f1c40f',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    minWidth: '44px',
  },
  agentTag: {
    color: '#8bd0c2',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    minWidth: '44px',
  },
  text: {
    color: '#e8e8e8',
    fontSize: '0.85rem',
    lineHeight: 1.4,
  },
};
