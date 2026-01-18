import '@livekit/components-styles';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useState } from 'react';
import { CommandVisualizer } from './components/CommandVisualizer';
import { TranscriptOverlay } from './components/TranscriptOverlay';

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
          {/* 1. THE BRAIN: Kairo Security Gates (Top Center) */}
          <div style={styles.brainLayer}>
            <CommandVisualizer />
          </div>

          {/* 2. THE VOICE: Audio Visualization (Center) */}
          <div style={styles.voiceLayer}>
            <GlowingVisualizer />
          </div>

          {/* 3. THE EARS: Transcripts (Bottom) */}
          <TranscriptOverlay />

          <RoomAudioRenderer />

          {/* Controls hidden or styled minimally at bottom */}
          <div style={{position: 'absolute', bottom: 20, opacity: 0.8}}>
             <ControlBar controls={{ microphone: true, speaker: true, camera: false, screenShare: false, leave: true }} />
          </div>
        </LiveKitRoom>
      )}
    </div>
  );
}

function GlowingVisualizer() {
  const tracks = useTracks([Track.Source.Microphone, Track.Source.Unknown]);

  return (
    <div style={styles.visualizerWrapper}>
      {/* We render a visualizer for the agent (usually the second track or specific source) */}
      <div style={styles.orbGlow} />
      {tracks.length > 0 && (
        <BarVisualizer
          state={tracks[0]}
          barCount={20}
          trackRef={tracks[0]}
          style={{ height: '150px', width: '300px' }}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    height: '100vh',
    width: '100vw',
    background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)',
    color: '#fff',
    fontFamily: '"Inter", system-ui, sans-serif',
    overflow: 'hidden'
  },
  connectScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  title: {
    fontSize: '4rem',
    margin: 0,
    letterSpacing: '-2px',
    background: 'linear-gradient(to right, #fff, #666)',
    WebkitBackgroundClip: 'text',
    color: 'transparent'
  },
  subtitle: { fontSize: '1.2rem', color: '#666', marginTop: '10px' },
  connectButton: {
    marginTop: '40px',
    padding: '15px 40px',
    fontSize: '1.2rem',
    borderRadius: '50px',
    border: 'none',
    background: '#fff',
    color: '#000',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(255,255,255,0.2)',
    transition: 'transform 0.2s'
  },
  roomContainer: {
    height: '100%',
    width: '100%',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  brainLayer: {
    position: 'absolute',
    top: '40px',
    zIndex: 10,
    // Ensure the visualizer floats elegantly
    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
  },
  voiceLayer: {
    zIndex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transform: 'scale(1.5)' // Make the visualizer bigger
  },
  visualizerWrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  orbGlow: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(52, 152, 219, 0.2) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%',
    zIndex: -1,
    animation: 'pulseGlow 3s infinite ease-in-out'
  }
};
