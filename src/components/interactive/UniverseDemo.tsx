import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';

// A deliberately tiny stand-in for Universe Map: ~240 decorative points plus
// three selectable objects. Positions are schematic, not to scale.

type Obj = {
  id: string;
  name: string;
  kind: string;
  x: number; // % of stage width
  y: number; // % of stage height
  color: string;
  detail: string;
};

const OBJECTS: Obj[] = [
  {
    id: 'sirius',
    name: 'Sirius',
    kind: 'Star · Canis Major',
    x: 16,
    y: 42,
    color: '#cfe3ff',
    detail: 'The brightest star in the night sky, about 8.6 light-years away.',
  },
  {
    id: 'betelgeuse',
    name: 'Betelgeuse',
    kind: 'Red supergiant · Orion',
    x: 44,
    y: 24,
    color: '#ffb48a',
    detail: 'About 500 light-years away in the HYG catalog. Its brightness varies noticeably over months.',
  },
  {
    id: 'm31',
    name: 'Andromeda Galaxy',
    kind: 'Spiral galaxy · M31',
    x: 80,
    y: 46,
    color: '#d9c8ff',
    detail: 'The nearest large spiral galaxy, roughly 2.5 million light-years away.',
  },
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TINTS = ['#ffffff', '#fff4e0', '#dfe9ff', '#ffe2c4', '#e9e2ff'];

export default function UniverseDemo({ onExit }: { onExit?: () => void }) {
  const [selected, setSelected] = useState<Obj>(OBJECTS[1]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reduce = useRef(false);
  const firstBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    firstBtn.current?.focus({ preventScroll: true });
  }, []);

  const stars = useMemo(() => {
    const r = mulberry32(718);
    return Array.from({ length: 240 }, (_, i) => {
      // Bias some stars toward a diagonal band, like a faint Milky Way.
      const band = i % 3 === 0;
      const t = r();
      const x = band ? t * 100 : r() * 100;
      const y = band ? 100 - t * 90 + (r() - 0.5) * 22 : r() * 100;
      return {
        x,
        y,
        r: 0.25 + Math.pow(r(), 3) * 1.1,
        o: 0.35 + r() * 0.6,
        c: TINTS[Math.floor(r() * TINTS.length)],
        layer: i % 2,
      };
    });
  }, []);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce.current || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    setOffset({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * -6,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * -6,
    });
  };

  return (
    <div className="um" onPointerMove={onMove} onPointerLeave={() => setOffset({ x: 0, y: 0 })}>
      <svg className="um-sky" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="um-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#3a3f7a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#0b0e1a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="160" height="100" fill="#0b0e1a" />
        <ellipse cx="80" cy="50" rx="95" ry="22" transform="rotate(-28 80 50)" fill="url(#um-glow)" />
        {[0, 1].map((layer) => (
          <g
            key={layer}
            style={{
              transform: `translate(${offset.x * (layer + 1) * 0.12}px, ${offset.y * (layer + 1) * 0.12}px)`,
              transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {stars
              .filter((s) => s.layer === layer)
              .map((s, i) => (
                <circle key={i} cx={s.x * 1.6} cy={s.y} r={s.r} fill={s.c} opacity={s.o} />
              ))}
          </g>
        ))}
      </svg>

      {OBJECTS.map((o, i) => (
        <button
          key={o.id}
          ref={i === 0 ? firstBtn : undefined}
          type="button"
          className={`um-obj${o.x > 60 ? ' um-obj--left' : ''}`}
          style={{ left: `${o.x}%`, top: `${o.y}%`, ['--c' as string]: o.color, ['--y' as string]: `${o.y}%` }}
          aria-pressed={selected.id === o.id}
          onClick={() => setSelected(o)}
        >
          <span className="um-dot" aria-hidden="true" />
          <span className="um-label">{o.name}</span>
        </button>
      ))}

      <div className="um-card" aria-live="polite">
        <p className="um-kind">{selected.kind}</p>
        <p className="um-name">{selected.name}</p>
        <p className="um-detail">{selected.detail}</p>
      </div>
      <p className="um-note">Simplified preview, not to scale. The full map has 169,000+ objects.</p>
      {onExit && (
        <button type="button" className="um-close" onClick={onExit}>
          Close preview
        </button>
      )}
    </div>
  );
}
