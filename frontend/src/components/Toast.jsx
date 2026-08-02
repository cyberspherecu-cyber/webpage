import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  const COLORS = {
    success: { bg: '#39FF14', border: '#39FF1440', text: '#39FF14', icon: '✓' },
    error: { bg: '#FF2D55', border: '#FF2D5540', text: '#FF2D55', icon: '✗' },
    info: { bg: '#00F5FF', border: '#00F5FF40', text: '#00F5FF', icon: 'ℹ' },
  };

  return (
    <ToastContext.Provider value={{ addToast, success, error, info, removeToast }}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: 400, width: '100%', pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div
              key={t.id}
              style={{
                background: '#111827', border: `1px solid ${c.border}`,
                borderLeft: `4px solid ${c.bg}`,
                borderRadius: 10, padding: '14px 18px',
                boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 20px ${c.bg}15`,
                display: 'flex', alignItems: 'center', gap: 12,
                fontFamily: 'var(--font-mono)', fontSize: 13,
                color: '#E2E8F0', pointerEvents: 'auto',
                animation: 'toast-in 0.25s ease-out',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: `${c.bg}20`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: c.text, fontSize: 12, fontWeight: 700,
                flexShrink: 0,
              }}>{c.icon}</span>
              <span style={{ flex: 1, lineHeight: 1.5 }}>{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none', border: 'none', color: '#6B7280',
                  fontSize: 16, cursor: 'pointer', padding: '0 4px',
                  fontFamily: 'var(--font-mono)',
                }}
              >×</button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
