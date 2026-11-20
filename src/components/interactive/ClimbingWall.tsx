import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

// A tiny bouldering puzzle. Tap holds to set a route from the start hold to
// the top, then press Climb. Moves longer than the climber's reach end in a
// (soft, padded) fall. Moving the pointer over the wall leaves chalk puffs.

type Hold = { id: number; x: number; y: number; color: string; kind: string };

// Positions are % of the wall (3:4). Distances use a 300 × 400 unit space.
const START = 0;
const TOP = 11;
const REACH = 120;
const COLORS = ['#e8b23a', '#d9643a', '#a9cfd0', '#f1c3a8'];
const KINDS = ['jug', 'crimp', 'sloper', 'pinch', 'pocket'];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const units = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot((a.x - b.x) * 3, (a.y - b.y) * 4);

// Builds a random wall that is always climbable: first a guaranteed chain of
// holds within reach from start to top, then decoy holds scattered around it.
function makeWall(): Hold[] {
  const start = { x: 50, y: 91 };
  const steps = 5;
  const chain: { x: number; y: number }[] = [];
  let prev = start;
  for (let i = 1; i <= steps; i++) {
    const y = 91 - (84 * i) / (steps + 1) + rand(-2, 2);
    let x = 50;
    for (let t = 0; t < 30; t++) {
      x = Math.min(86, Math.max(14, prev.x + rand(-28, 28)));
      if (units(prev, { x, y }) <= REACH * 0.92) break;
    }
    prev = { x, y };
    chain.push(prev);
  }
  let top = { x: 50, y: 7 };
  for (let t = 0; t < 30; t++) {
    top = { x: Math.min(80, Math.max(20, prev.x + rand(-25, 25))), y: 7 };
    if (units(prev, top) <= REACH * 0.92) break;
  }

  const placed = [start, top, ...chain];
  const decoys: { x: number; y: number }[] = [];
  for (let t = 0; t < 400 && decoys.length < TOP - 1 - steps; t++) {
    const c = { x: rand(10, 90), y: rand(16, 82) };
    if ([...placed, ...decoys].every((p) => units(p, c) > 52)) decoys.push(c);
  }

  // Middle holds are ordered bottom to top so keyboard order follows the climb.
  const middle = [...chain, ...decoys].sort((a, b) => b.y - a.y);
  return [
    { id: START, ...start, color: '#1f6b5c', kind: 'start jug' },
    ...middle.map((p, i) => ({ id: i + 1, ...p, color: pick(COLORS), kind: pick(KINDS) })),
    { id: middle.length + 1, ...top, color: '#1f6b5c', kind: 'top jug' },
  ];
}

const dist = (a: Hold, b: Hold) => units(a, b);

const NAMES = ['Off-by-One', 'Segfault Slab', 'Merge Conflict', 'Null Pointer Arete', 'Stack Overflow', 'Hotfix Traverse', 'Rubber Duck Roof', 'Semicolon Crack'];
const GRADES = ['V0', 'V1', 'V2', 'V3', 'V4'];

type Phase = 'setting' | 'climbing' | 'sent' | 'fell';

export default function ClimbingWall() {
  const [holds, setHolds] = useState<Hold[]>(makeWall);
  const top = holds.length - 1;
  const [route, setRoute] = useState<number[]>([START]);
  const [phase, setPhase] = useState<Phase>('setting');
  const [climber, setClimber] = useState<{ x: number; y: number }>({ x: 50, y: 91 });
  const [message, setMessage] = useState('Tap holds to set a route to the top hold, then press Climb.');
  const [sends, setSends] = useState(0);
  const timers = useRef<number[]>([]);
  const reduce = useRef(false);

  // chalk
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts = useRef<{ x: number; y: number; vx: number; vy: number; r: number; life: number }[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return () => {
      timers.current.forEach(clearTimeout);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const reset = useCallback((msg?: string, freshWall = false) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (freshWall) setHolds(makeWall());
    setRoute([START]);
    setClimber({ x: 50, y: 91 });
    setPhase('setting');
    setMessage(msg ?? 'Fresh wall. Set a new route.');
  }, []);

  const toggle = (id: number) => {
    if (phase !== 'setting' || id === START) return;
    const last = route[route.length - 1];
    if (id === last) {
      setRoute(route.slice(0, -1));
      return;
    }
    if (route.includes(id)) return;
    setRoute([...route, id]);
    const d = dist(holds[last], holds[id]);
    setMessage(
      id === top
        ? d > REACH
          ? 'Route reaches the top, but that last move is a big reach…'
          : 'Route reaches the top. Press Climb!'
        : d > REACH
          ? `That ${holds[id].kind} looks like a big reach…`
          : `Added a ${holds[id].kind}. ${route.length} move${route.length === 1 ? '' : 's'} so far.`,
    );
  };

  const climb = () => {
    if (route.length < 2) return;
    setPhase('climbing');
    setMessage('Climbing…');
    const step = reduce.current ? 60 : 420;
    let t = 0;
    for (let i = 1; i < route.length; i++) {
      const from = holds[route[i - 1]];
      const to = holds[route[i]];
      t += step;
      if (dist(from, to) > REACH) {
        later(() => {
          setClimber({ x: from.x, y: 97 });
          setPhase('fell');
          setMessage(`Popped off reaching for the ${to.kind}! Too far. Resetting…`);
        }, t);
        later(() => reset('Same wall, fresh try. Pick holds that are closer together.'), t + 1800);
        return;
      }
      later(() => setClimber({ x: to.x, y: to.y }), t);
    }
    const end = route[route.length - 1];
    later(() => {
      if (end === top) {
        const n = NAMES[Math.floor(Math.random() * NAMES.length)];
        const g = GRADES[Math.min(GRADES.length - 1, Math.max(0, 7 - route.length))];
        setSends((s) => s + 1);
        setPhase('sent');
        setMessage(`Sent it in ${route.length - 1} moves! Route name: “${n}” (${g}).`);
        later(() => reset('A new wall just went up. Set another route?', true), 3200);
      } else {
        setPhase('fell');
        setMessage('Ran out of route before the top. Resetting…');
        later(() => reset('Same wall, fresh try. End your route on the top hold.'), 1800);
      }
    }, t + step);
  };

  // --- chalk puff ---
  const tick = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    parts.current = parts.current.filter((p) => p.life > 0);
    for (const p of parts.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.01;
      p.life -= 0.02;
      ctx.globalAlpha = Math.max(0, p.life) * 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1.6 - p.life * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    raf.current = parts.current.length ? requestAnimationFrame(tick) : 0;
  }, []);

  const chalk = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    if (c.width !== Math.round(rect.width)) {
      c.width = Math.round(rect.width);
      c.height = Math.round(rect.height);
    }
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = 0; i < 2; i++) {
      parts.current.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: 1.5 + Math.random() * 2.5,
        life: 1,
      });
    }
    if (parts.current.length > 160) parts.current.splice(0, parts.current.length - 160);
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  };

  const last = holds[route[route.length - 1]];

  return (
    <div className="cw">
      <div className="cw-wall" onPointerMove={chalk}>
        <svg className="cw-lines" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true">
          {phase === 'setting' && (
            <ellipse
              cx={last.x * 3}
              cy={last.y * 4}
              rx={REACH}
              ry={REACH}
              className="cw-reach"
            />
          )}
          {route.slice(1).map((id, i) => {
            const a = holds[route[i]];
            const b = holds[id];
            return (
              <line
                key={id}
                x1={a.x * 3}
                y1={a.y * 4}
                x2={b.x * 3}
                y2={b.y * 4}
                className={dist(a, b) > REACH ? 'cw-line far' : 'cw-line'}
              />
            );
          })}
        </svg>
        <canvas ref={canvasRef} className="cw-chalk" aria-hidden="true" />

        {holds.map((h) => {
          const order = route.indexOf(h.id);
          const label =
            h.id === START
              ? 'Start hold'
              : `${h.id === top ? 'Top hold' : `Hold, ${h.kind}`}${order > 0 ? `, move ${order} in route` : ''}`;
          return (
            <button
              key={h.id}
              type="button"
              className={`cw-hold${h.id === top ? ' top' : ''}${h.id === START ? ' start' : ''}`}
              style={{ left: `${h.x}%`, top: `${h.y}%`, ['--hc' as string]: h.color, ['--r' as string]: `${(h.id * 47) % 360}deg` }}
              aria-pressed={order >= 0}
              aria-label={label}
              disabled={phase !== 'setting' || h.id === START}
              onClick={() => toggle(h.id)}
            >
              <span className="cw-blob" aria-hidden="true" />
              {order > 0 && <span className="cw-num" aria-hidden="true">{order}</span>}
              {h.id === top && <span className="cw-tag" aria-hidden="true">TOP</span>}
            </button>
          );
        })}

        <span
          className={`cw-climber${phase === 'fell' ? ' fell' : ''}${phase === 'sent' ? ' sent' : ''}`}
          style={{ left: `${climber.x}%`, top: `${climber.y}%` }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 28" width="20" height="28">
            <circle cx="10" cy="5" r="4" fill="#fff8e9" stroke="#2a211b" strokeWidth="1.5" />
            <path d="M10 9v9M10 12l-6-5M10 12l6-5M10 18l-5 7M10 18l5 7" stroke="#d9643a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </span>
      </div>

      <p className="cw-msg" role="status" aria-live="polite">{message}</p>
      <div className="cw-actions">
        <button type="button" className="btn btn-primary" onClick={climb} disabled={phase !== 'setting' || route.length < 2}>
          Climb
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => reset('Route cleared.')} disabled={phase === 'climbing'}>
          Reset
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => reset('A new wall just went up.', true)} disabled={phase === 'climbing'}>
          New wall
        </button>
        <span className="cw-sends" aria-label={`${sends} successful sends`}>Sends: {sends}</span>
      </div>
    </div>
  );
}
