import { useEffect, useRef, useState } from 'react';
import './fun.css';

// A small "milestone constellation". Clicking a star reveals a milestone,
// and the stars drift gently into a new arrangement.

const MILESTONES = [
  { date: 'Aug 2024', title: 'Started at UNL', text: 'Began a B.S. in Computer Science with a Mathematics minor.' },
  { date: 'Sept 2024', title: 'Joined the advisory board', text: 'Engineering Students Advisory Board, helping allocate the Dean’s budget across student organizations.' },
  { date: 'Jan 2025', title: 'Coding for Data', text: 'Python, SQL, and Tableau with the Global Career Accelerator.' },
  { date: 'Aug 2025', title: 'Became a TA', text: 'Leading weekly CSCE 231 labs on C, GDB, and code review for 40+ students.' },
  { date: 'Jan 2026', title: 'First client project', text: 'Built a parts ordering tool for Aulick Industries through Senior Design.' },
  { date: '2026', title: 'Shipped two side projects', text: 'Universe Map and Stunt Double went live on the web.' },
  { date: 'Aug 2026', title: 'Wearable prototype', text: 'SwiftUI and Apple Watch work for Mission Accomplished.' },
  { date: 'Dec 2026', title: 'Graduation', text: 'B.S. Computer Science, University of Nebraska–Lincoln.' },
];

// Base layout: a loose rising arc, in % of the panel.
const BASE = [
  { x: 8, y: 78 }, { x: 20, y: 56 }, { x: 33, y: 70 }, { x: 45, y: 44 },
  { x: 58, y: 58 }, { x: 69, y: 32 }, { x: 81, y: 46 }, { x: 92, y: 18 },
];

function jitter(seed: number) {
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return BASE.map((p) => ({
    x: Math.min(94, Math.max(6, p.x + (r() - 0.5) * 8)),
    y: Math.min(86, Math.max(12, p.y + (r() - 0.5) * 14)),
  }));
}

export default function Constellation() {
  const [active, setActive] = useState(MILESTONES.length - 1);
  const [seen, setSeen] = useState<Set<number>>(new Set([MILESTONES.length - 1]));
  const [pos, setPos] = useState(BASE);
  const clicks = useRef(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const pick = (i: number) => {
    setActive(i);
    setSeen((s) => new Set(s).add(i));
    clicks.current += 1;
    setPos(jitter(clicks.current));
  };

  const m = MILESTONES[active];

  return (
    <div className="cn">
      <div className="cn-sky">
        <svg className="cn-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            points={pos.map((p) => `${p.x},${p.y}`).join(' ')}
            className={animate ? 'cn-path anim' : 'cn-path'}
          />
        </svg>
        {MILESTONES.map((ms, i) => (
          <button
            key={ms.title}
            type="button"
            className={`cn-star${seen.has(i) ? ' seen' : ''}`}
            style={{
              left: `${pos[i].x}%`,
              top: `${pos[i].y}%`,
              transition: animate ? undefined : 'none',
            }}
            aria-pressed={active === i}
            aria-label={`${ms.date}: ${ms.title}`}
            onClick={() => pick(i)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.5l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L12 16.8l-5.9 3.7 1.7-6.7-5.3-4.4 6.9-.5z" />
            </svg>
          </button>
        ))}
      </div>
      <div className="cn-card" aria-live="polite">
        <p className="cn-date">{m.date} · {seen.size}/{MILESTONES.length} found</p>
        <p className="cn-title">{m.title}</p>
        <p className="cn-text">{m.text}</p>
      </div>
    </div>
  );
}
