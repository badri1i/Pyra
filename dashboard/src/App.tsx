import '@livekit/components-styles';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  ControlBar,
  useTracks,
  useConnectionState,
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import { useState } from 'react';
import { CommandVisualizer } from './components/CommandVisualizer';

const serverUrl = import.meta.env.VITE_LIVEKIT_URL;
const token = import.meta.env.VITE_LIVEKIT_TOKEN;

export default function App() {
  const [connected, setConnected] = useState(false);

  if (!serverUrl || !token) {
    return <div style={{color:'red', padding: 20}}>Missing VITE_LIVEKIT_URL or TOKEN</div>;
  }

  return (
    <div style={styles.appContainer}>
      {!connected ? (
        <div style={styles.connectScreen}>
          <div style={styles.logoOrb} />
          <h1 style={styles.title}>PYRA</h1>
          <p style={styles.subtitle}>Fiduciary Voice Guardian</p>
          <button
            onClick={() => setConnected(true)}
            style={styles.connectButton}
          >
            Enter Secure Session
          </button>
        </div>
      ) : (
        <LiveKitRoom
          video={false}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          data-lk-theme="default"
          style={styles.roomContainer}
        >
          <RoomContent />
        </LiveKitRoom>
      )}
    </div>
  );
}

function RoomContent() {
  const connectionState = useConnectionState();
  const tracks = useTracks([Track.Source.Microphone]);

  if (connectionState === ConnectionState.Connecting) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <p>Connecting to PYRA...</p>
      </div>
    );
  }

  return (
    <>
      {/* Security Gates (Top) */}
      <div style={styles.brainLayer}>
        <CommandVisualizer />
      </div>

      {/* Voice Orb (Center) */}
      <div style={styles.voiceLayer}>
        <div style={styles.orbContainer}>
          <div style={styles.glowRing} />
          <div style={styles.innerOrb}>
            {tracks.length > 0 ? (
              <BarVisualizer
                barCount={5}
                trackRef={tracks[0]}
                style={{ height: '60px', width: '80px' }}
              />
            ) : (
              <span style={{ fontSize: '2rem', opacity: 0.5 }}>🎙️</span>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={styles.statusLayer}>
        <div style={styles.statusBadge}>
          <span style={styles.statusDot} />
          {connectionState === ConnectionState.Connected ? 'Connected' : connectionState}
        </div>
      </div>

      <RoomAudioRenderer />

      {/* Controls */}
      <div style={styles.controlsLayer}>
        <ControlBar
          controls={{
            microphone: true,
            camera: false,
            screenShare: false,
            leave: true
          }}
        />
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    height: '100vh',
    width: '100vw',
    background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    overflow: 'hidden',
  },
  connectScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  logoOrb: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(52, 152, 219, 0.2) 0%, transparent 70%)',
    animation: 'pulseGlow 3s infinite ease-in-out',
  },
  title: {
    fontSize: '4rem',
    margin: 0,
    letterSpacing: '-2px',
    fontWeight: 700,
    color: '#fff',
    zIndex: 1,
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666',
    marginTop: '10px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  connectButton: {
    marginTop: '40px',
    padding: '15px 40px',
    fontSize: '1rem',
    borderRadius: '50px',
    border: 'none',
    background: '#fff',
    color: '#000',
    fontWeight: 600,
    cursor: 'pointer',
    zIndex: 1,
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#888',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #333',
    borderTopColor: '#3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  roomContainer: {
    height: '100%',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainLayer: {
    position: 'absolute',
    top: '30px',
    zIndex: 10,
  },
  voiceLayer: {
    zIndex: 1,
    marginTop: '100px',
  },
  statusLayer: {
    position: 'absolute',
    bottom: '100px',
    zIndex: 10,
  },
  controlsLayer: {
    position: 'absolute',
    bottom: '30px',
    zIndex: 10,
  },
  orbContainer: {
    position: 'relative',
    width: '180px',
    height: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(52, 152, 219, 0.3) 0%, transparent 70%)',
    animation: 'pulseGlow 3s infinite ease-in-out',
  },
  innerOrb: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a15 100%)',
    border: '2px solid #3498db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 40px rgba(52, 152, 219, 0.3)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 20px',
    borderRadius: '30px',
    border: '1px solid #3498db',
    background: 'rgba(0,0,0,0.5)',
    color: '#3498db',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#2ecc71',
    boxShadow: '0 0 10px #2ecc71',
  },
};
