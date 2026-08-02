export default function Skeleton({ width = '100%', height = 20, borderRadius = 6, variant = 'text', count = 1, style = {} }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map(i => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            width: typeof width === 'function' ? width(i) : width,
            height,
            borderRadius,
            background: 'linear-gradient(90deg, #1f2937 25%, #2d3748 50%, #1f2937 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            marginBottom: i < count - 1 ? 12 : 0,
            ...style,
          }}
        />
      ))}

      <style>{`
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16,
        marginBottom: 16,
      }}>
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} height={14} width="80%" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16,
          padding: '12px 0', borderTop: '1px solid #1f2937',
        }}>
          {Array.from({ length: cols }, (_, j) => (
            <Skeleton key={j} height={14} width={j === 0 ? '60%' : '40%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(300px, 1fr))`, gap: 20 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Skeleton width={80} height={22} borderRadius={4} />
            <Skeleton width={40} height={22} borderRadius={4} />
          </div>
          <Skeleton width="75%" height={18} style={{ marginBottom: 10 }} />
          <Skeleton count={2} height={13} style={{ marginBottom: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Skeleton width={60} height={20} borderRadius={4} />
            <Skeleton width={80} height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: '#0A0A0F' }}>
      <div style={{ background: '#0D1117', borderBottom: '1px solid #1f2937', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'center' }}>
          <Skeleton width={100} height={100} borderRadius={50} />
          <div style={{ flex: 1 }}>
            <Skeleton width={200} height={28} style={{ marginBottom: 10 }} />
            <Skeleton width={300} height={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
