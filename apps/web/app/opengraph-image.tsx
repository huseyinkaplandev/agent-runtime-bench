import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Agent Runtime Bench: native loop versus LangGraph, measured';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#000000',
          padding: 80,
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, color: '#9b9b9b' }}>
          agent-runtime-bench
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 600, lineHeight: 1.05 }}>
            The same agent,
          </div>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 600, color: '#9b9b9b' }}>
            written twice
          </div>
        </div>

        <div style={{ display: 'flex', gap: 48, fontSize: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#9b9b9b', fontSize: 24 }}>native loop</span>
            <span>50 lines</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#9b9b9b', fontSize: 24 }}>LangGraph</span>
            <span>97 lines</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#9b9b9b', fontSize: 24 }}>behaviour</span>
            <span>identical</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
