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

const serverUrl = import.meta.env.VITE_LIVEKIT_URL;
const token = import.meta.env.VITE_LIVEKIT_TOKEN;

export default function App() {
  const [connected, setConnected] = useState(false);

  if (!serverUrl || !token) {
    return <div>Missing VITE_LIVEKIT_URL or VITE_LIVEKIT_TOKEN in .env</div>;
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <h1>PYRA Dashboard</h1>

      {!connected ? (
        <button
          onClick={() => setConnected(true)}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            cursor: 'pointer',
            background: '#2ecc71',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          Connect to Guardian
        </button>
      ) : (
        <LiveKitRoom
          video={false}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          data-lk-theme="default"
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* FR-024: State Visualization */}
          <CommandVisualizer />

          {/* Visualizer for the Agent's Voice */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <AgentVisualizer />
          </div>

          <RoomAudioRenderer />
          <ControlBar />
        </LiveKitRoom>
      )}
    </div>
  );
}

function AgentVisualizer() {
  const tracks = useTracks([Track.Source.Microphone]);
  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {tracks.map((track) => (
        <BarVisualizer
          key={track.publication.trackSid}
          state={track}
          barCount={7}
          trackRef={track}
          style={{ height: '200px', width: '200px' }}
        />
      ))}
    </div>
  );
}
