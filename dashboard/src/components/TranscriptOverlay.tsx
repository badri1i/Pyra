import { useChat } from "@livekit/components-react";
import { useEffect, useState } from "react";

export function TranscriptOverlay() {
  const { chatMessages } = useChat();
  const [lastMessage, setLastMessage] = useState<{from: string, text: string} | null>(null);

  useEffect(() => {
    if (chatMessages.length > 0) {
      const msg = chatMessages[chatMessages.length - 1];
      // Filter out internal messages if any
      if (msg.message) {
        setLastMessage({
            from: msg.from?.identity === "pyra" ? "PYRA" : "YOU",
            text: msg.message
        });
      }
    }
  }, [chatMessages]);

  if (!lastMessage) return null;

  return (
    <div style={styles.container}>
      <span style={styles.label}>{lastMessage.from}</span>
      <div style={styles.text}>"{lastMessage.text}"</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    width: '80%',
    maxWidth: '600px',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(10px)',
    padding: '15px 25px',
    borderRadius: '30px',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    zIndex: 10
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#888',
    marginBottom: '4px',
    letterSpacing: '1px'
  },
  text: {
    color: '#fff',
    fontSize: '1.1rem',
    lineHeight: '1.4',
    fontFamily: 'system-ui, sans-serif'
  }
};
