import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

// A self-contained jumping toy in the spirit of Stunt Double. It reuses the
// game's fixed 60 Hz step and jump feel (same arc shape, at half scale).
// No sound. Keys are only handled while the canvas has focus.

const W = 480;
const H = 240;
const GROUND = 192;
const STEP = 1 / 60;
const JUMP_SPEED = 410; // 820 px/s at half scale
const GRAVITY = 1200; // 2400 px/s² at half scale
const COYOTE = 0.08;
const BUFFER = 0.1;
const SPEED = 230;
const PX = 96;
const PW = 22;
const PH = 32;

type Crate = { x: number; w: number; h: number; scored: boolean };
type Phase = 'ready' | 'playing' | 'cut' | 'paused';

type Sim = {
  y: number;
  vy: number;
  grounded: boolean;
  sinceGround: number;
  sinceJumpPress: number;
  holding: boolean;
  crates: Crate[];
  nextGap: number;
  score: number;
  t: number;
  seed: number;
};

const fresh = (): Sim => ({
  y: GROUND,
  vy: 0,
  grounded: true,
  sinceGround: 0,
  sinceJumpPress: 99,
  holding: false,
  crates: [{ x: W + 60, w: 22, h: 22, scored: false }],
  nextGap: 300,
  score: 0,
  t: 0,
  seed: 7,
});

function rand(s: Sim) {
  s.seed = (s.seed * 16807) % 2147483647;
  return s.seed / 2147483647;
}

function step(s: Sim): boolean {
  s.t += STEP;
  s.sinceJumpPress += STEP;
  s.sinceGround = s.grounded ? 0 : s.sinceGround + STEP;

  // Buffered jump + coyote time.
  if (s.sinceJumpPress <= BUFFER && s.sinceGround <= COYOTE && s.vy >= 0) {
    s.vy = -JUMP_SPEED;
    s.grounded = false;
    s.sinceGround = COYOTE + 1;
    s.sinceJumpPress = 99;
  }
  // Variable height: releasing early cuts the rise.
  if (!s.holding && s.vy < -JUMP_SPEED * 0.45) s.vy = -JUMP_SPEED * 0.45;

  s.vy += GRAVITY * STEP;
  s.y += s.vy * STEP;
  if (s.y >= GROUND) {
    s.y = GROUND;
    s.vy = 0;
    s.grounded = true;
  }

  const speed = SPEED + Math.min(s.t * 3, 90);
  for (const c of s.crates) c.x -= speed * STEP;
  s.crates = s.crates.filter((c) => c.x + c.w > -10);
  const last = s.crates[s.crates.length - 1];
  if (!last || last.x < W - s.nextGap) {
    const tall = rand(s) < 0.3;
    s.crates.push({ x: W + 10, w: tall ? 18 : 22, h: tall ? 34 : 22, scored: false });
    s.nextGap = 210 + rand(s) * 170;
  }

  // Collision with trimmed hitboxes (80% of visual size, like the game).
  const px0 = PX - (PW * 0.8) / 2;
  const px1 = PX + (PW * 0.8) / 2;
  const py0 = s.y - PH * 0.9;
  for (const c of s.crates) {
    const cx0 = c.x + c.w * 0.1;
    const cx1 = c.x + c.w * 0.9;
    const cy0 = GROUND - c.h * 0.9;
    if (px1 > cx0 && px0 < cx1 && s.y > cy0 && py0 < GROUND) return false;
    if (!c.scored && c.x + c.w < px0) {
      c.scored = true;
      s.score += 1;
    }
  }
  return true;
}

function draw(ctx: CanvasRenderingContext2D, s: Sim, phase: Phase) {
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d1838');
  g.addColorStop(1, '#3b2b55');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Skyline drifts slowly behind the action.
  const drift = (s.t * 18) % 120;
  ctx.fillStyle = '#4a3f7a';
  for (let i = -1; i < 6; i++) {
    const bx = i * 120 - drift;
    const bh = 70 + ((i * 37) % 50 + 50) % 50;
    ctx.fillRect(bx, GROUND - bh, 70, bh);
    ctx.fillRect(bx + 78, GROUND - bh * 0.7, 34, bh * 0.7);
  }
  ctx.fillStyle = '#e9b44c';
  ctx.globalAlpha = 0.35;
  for (let i = -1; i < 6; i++) {
    const bx = i * 120 - drift;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) if ((i + r + c) % 3) ctx.fillRect(bx + 10 + c * 20, GROUND - 60 + r * 12, 6, 5);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#16131f';
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = '#5a5070';
  ctx.fillRect(0, GROUND, W, 2);

  // Crates
  for (const c of s.crates) {
    const y = GROUND - c.h;
    ctx.fillStyle = '#e04050';
    ctx.fillRect(c.x, y, c.w, c.h);
    ctx.strokeStyle = '#f6e9dc';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 3, y + 3, c.w - 6, c.h - 6);
    ctx.beginPath();
    ctx.moveTo(c.x + 3, y + 3);
    ctx.lineTo(c.x + c.w - 3, y + c.h - 3);
    ctx.moveTo(c.x + c.w - 3, y + 3);
    ctx.lineTo(c.x + 3, y + c.h - 3);
    ctx.stroke();
  }

  // Stunt performer
  const top = s.y - PH;
  const legs = s.grounded && phase === 'playing' ? Math.sin(s.t * 22) * 4 : 0;
  ctx.fillStyle = '#e8762c';
  ctx.fillRect(PX - 7, top + 11, 14, 14);
  ctx.fillRect(PX - 7 + legs * 0.5, top + 24, 5, 8);
  ctx.fillRect(PX + 2 - legs * 0.5, top + 24, 5, 8);
  ctx.fillStyle = '#e6e6ea';
  ctx.beginPath();
  ctx.arc(PX, top + 6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2a36';
  ctx.fillRect(PX + 1, top + 4, 6, 3);

  // HUD
  ctx.fillStyle = 'rgba(10, 8, 18, 0.7)';
  ctx.fillRect(12, 12, 104, 26);
  ctx.fillStyle = '#f6e9dc';
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  ctx.fillText(`Cleared ${s.score}`, 22, 30);

  if (phase === 'cut') {
    ctx.fillStyle = 'rgba(10, 8, 18, 0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f6e9dc';
    ctx.font = '700 38px Manrope, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CUT!', W / 2, H / 2 - 6);
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.fillText(`${s.score} crate${s.score === 1 ? '' : 's'} cleared — go again?`, W / 2, H / 2 + 20);
    ctx.textAlign = 'start';
  }
}

export default function StuntDemo({ onExit }: { onExit?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sim = useRef<Sim>(fresh());
  const phaseRef = useRef<Phase>('ready');
  const [phase, setPhaseState] = useState<Phase>('ready');
  const [announce, setAnnounce] = useState('');
  const playBtn = useRef<HTMLButtonElement>(null);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  // Render + fixed-step loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      acc += Math.min((now - last) / 1000, 0.25);
      last = now;
      if (phaseRef.current === 'playing') {
        let n = 0;
        while (acc >= STEP && n < 8) {
          acc -= STEP;
          n++;
          if (!step(sim.current)) {
            setPhase('cut');
            setAnnounce(`Cut. You cleared ${sim.current.score} crates. Press Restart to try again.`);
            break;
          }
        }
      } else acc = 0;
      draw(ctx, sim.current, phaseRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [setPhase]);

  // Pause when the preview leaves the viewport or the tab is hidden.
  useEffect(() => {
    const pause = () => {
      if (phaseRef.current === 'playing') {
        setPhase('paused');
        setAnnounce('Paused.');
      }
    };
    const io = new IntersectionObserver(([e]) => !e.isIntersecting && pause(), { threshold: 0.25 });
    if (wrapRef.current) io.observe(wrapRef.current);
    const vis = () => document.hidden && pause();
    document.addEventListener('visibilitychange', vis);
    playBtn.current?.focus({ preventScroll: true });
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, [setPhase]);

  const start = (reset: boolean) => {
    if (reset) sim.current = fresh();
    setPhase('playing');
    setAnnounce(reset ? 'Rolling. Jump over the crates.' : 'Resumed.');
    canvasRef.current?.focus({ preventScroll: true });
  };

  const press = () => {
    if (phaseRef.current !== 'playing') return;
    sim.current.sinceJumpPress = 0;
    sim.current.holding = true;
  };
  const release = () => {
    sim.current.holding = false;
  };

  const isJumpKey = (k: string) => k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W';
  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>) => {
    if (isJumpKey(e.key)) {
      e.preventDefault();
      if (phaseRef.current === 'playing') {
        if (!e.repeat) press();
      } else start(phaseRef.current !== 'paused');
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      start(true);
    } else if (e.key === 'Escape') {
      if (phaseRef.current === 'playing') {
        setPhase('paused');
        setAnnounce('Paused.');
      }
    }
  };
  const onKeyUp = (e: KeyboardEvent<HTMLCanvasElement>) => {
    if (isJumpKey(e.key)) release();
  };

  return (
    <div className="sd" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="sd-canvas"
        tabIndex={0}
        role="img"
        aria-label="Stunt Double mini-game. While focused, press Space, Up, or W to jump; hold for a higher jump. Press R to restart, Escape to pause."
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={release}
        onPointerDown={(e) => {
          if (phaseRef.current === 'playing') {
            e.preventDefault();
            canvasRef.current?.focus({ preventScroll: true });
            press();
          }
        }}
        onPointerUp={release}
        onPointerCancel={release}
      />

      {phase !== 'playing' && (
        <div className="sd-overlay">
          {phase === 'ready' && (
            <button ref={playBtn} type="button" className="btn btn-primary" onClick={() => start(true)}>
              Play
            </button>
          )}
          {phase === 'cut' && (
            <button type="button" className="btn btn-primary" onClick={() => start(true)}>
              Go again
            </button>
          )}
          {phase === 'paused' && (
            <button type="button" className="btn btn-primary" onClick={() => start(false)}>
              Resume
            </button>
          )}
        </div>
      )}

      <div className="sd-controls">
        <button
          type="button"
          className="sd-jump"
          disabled={phase !== 'playing'}
          onPointerDown={(e) => {
            e.preventDefault();
            press();
          }}
          onPointerUp={release}
          onPointerLeave={release}
          onKeyDown={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              e.preventDefault();
              press();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') release();
          }}
        >
          Jump
        </button>
        <button type="button" className="sd-small" onClick={() => start(true)} disabled={phase === 'ready'}>
          Restart
        </button>
        {onExit && (
          <button type="button" className="sd-small" onClick={onExit}>
            Stop
          </button>
        )}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
