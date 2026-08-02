import { useState, useEffect } from 'react';

export default function GhostProtocol() {
  const [output, setOutput] = useState([]);
  const [phase, setPhase] = useState(0);

  const lines = [
    { text: '[BOOT] Initializing Ghost Protocol v3.1.7...', delay: 500 },
    { text: '[BOOT] Establishing encrypted通道...', delay: 800 },
    { text: '[BOOT] Connection lost. Retrying...', delay: 600 },
    { text: '[SEC]  WARNING: Unauthorized access detected.', delay: 700 },
    { text: '[SEC]  Tracing origin IP... 103.95.xxx.xxx', delay: 900 },
    { text: '[SEC]  ⚠  Countermeasures engaged.', delay: 500 },
    { text: '', delay: 300 },
    { text: '> ACCESS DENIED. Authentication required.', delay: 600 },
    { text: '> This terminal is for authorized personnel only.', delay: 500 },
    { text: '> Hint: Check the page source for credentials.', delay: 800, blink: true },
  ];

  useEffect(() => {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < lines.length) {
        setOutput(prev => [...prev, { id: Date.now() + idx, ...lines[idx] }]);
        idx++;
      } else {
        clearInterval(timer);
      }
    }, 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: 800,
        width: '100%',
        background: '#000',
        border: '2px solid #00F5FF20',
        borderRadius: 8,
        padding: '2rem',
        boxShadow: '0 0 30px rgba(0,245,255,0.05), inset 0 0 30px rgba(0,245,255,0.02)',
      }}>
        {/* CRT scan line effect */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 2px)',
        }} />

        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#FF5F56', '#FFBD2E', '#27C93F'].map(c => (
              <div key={c} style={{ width: 14, height: 14, borderRadius: '50%', background: c, opacity: 0.6 }} />
            ))}
          </div>
          <span style={{ color: '#6B7280', fontSize: 12, letterSpacing: 1 }}>ghost_protocol — -bash — 80×24</span>
        </div>

        <div style={{ minHeight: 400 }}>
          {output.map(line => (
            <div key={line.id} style={{
              color: line.text.startsWith('[SEC]') ? '#FF2D55' :
                     line.text.startsWith('[BOOT]') ? '#00F5FF' :
                     line.text.startsWith('>') ? '#39FF14' : '#6B7280',
              fontSize: 14,
              lineHeight: 1.8,
              fontFamily: "'Courier New', monospace",
              opacity: 0.9,
              animation: line.blink ? 'none' : 'none',
            }}>
              {line.text}
              {line.blink && <span style={{ animation: 'blink 1s infinite', color: '#39FF14' }}>█</span>}
            </div>
          ))}
          {output.length < lines.length && (
            <span style={{ color: '#00F5FF', fontSize: 14, animation: 'blink 1s infinite' }}>█</span>
          )}
        </div>

        {/* Hidden clues in HTML comments */}
        {/* ████████████████████████████████████████████████████████████████ */}
        {/* [CLUE 1/2] The protocol handshake requires an authentication token. */}
        {/*             Send it as: X-Ghost-Protocol                    */}
        {/* ████████████████████████████████████████████████████████████████ */}
        {/* [CLUE 2/2] The token is base64 encoded below:               */}
        {/*             Q1NQSEVSRXtnaDBzdF8xbl90aDNfc2gzbGx9             */}
        {/*             Decode it to reveal the handshake password.      */}
        {/* ████████████████████████████████████████████████████████████████ */}

        <div style={{ marginTop: 32, borderTop: '1px solid #1f2937', paddingTop: 16 }}>
          <div style={{ color: '#374151', fontSize: 11, fontFamily: "'Courier New', monospace" }}>
            [SESSION] ghost_protocol :: disconnected :: {new Date().toISOString().split('T')[0]}
          </div>
          <div style={{ color: '#1f2937', fontSize: 10, marginTop: 4 }}>
            ⚠ All connections are logged and monitored.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Matrix-style background characters */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1,
        color: '#00F5FF08', fontSize: 10, fontFamily: "'Courier New', monospace",
        overflow: 'hidden', lineHeight: 1.2,
      }}>
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: 0.3 + Math.random() * 0.3 }}>
            {String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))}
          </div>
        ))}
      </div>
    </div>
  );
}
