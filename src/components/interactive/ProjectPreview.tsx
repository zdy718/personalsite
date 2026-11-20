import { lazy, Suspense, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import './preview.css';

const UniverseDemo = lazy(() => import('./UniverseDemo'));
const StuntDemo = lazy(() => import('./StuntDemo'));

export type PreviewProject = {
  id: 'universe' | 'stunt';
  title: string;
  blurb: string;
  poster: { src: string; srcset?: string; width: number; height: number; alt: string };
  demoUrl: string;
  exploreLabel: string;
};

type Props = { projects: PreviewProject[] };

export default function ProjectPreview({ projects }: Props) {
  const [active, setActive] = useState(0);
  const [live, setLive] = useState<PreviewProject['id'] | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const explore = useRef<Record<string, HTMLButtonElement | null>>({});
  const returnFocus = useRef<string | null>(null);
  const uid = useId();

  // After stopping a demo, put focus back on the button that started it.
  useEffect(() => {
    if (live === null && returnFocus.current) {
      explore.current[returnFocus.current]?.focus();
      returnFocus.current = null;
    }
  }, [live]);

  const stop = (id: string) => {
    returnFocus.current = id;
    setLive(null);
  };

  const select = (i: number, focus = false) => {
    setActive(i);
    setLive(null);
    if (focus) tabs.current[i]?.focus();
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const n = projects.length;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (active + 1) % n;
    else if (e.key === 'ArrowLeft') next = (active - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next !== null) {
      e.preventDefault();
      select(next, true);
    }
  };

  return (
    <div className="pv window">
      <div className="window-bar" aria-hidden="true">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <span>project_viewer</span>
      </div>
      <div className="pv-tabs" role="tablist" aria-label="Project previews">
        {projects.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${uid}-tab-${p.id}`}
            aria-selected={i === active}
            aria-controls={`${uid}-panel-${p.id}`}
            tabIndex={i === active ? 0 : -1}
            className="pv-tab"
            onClick={() => select(i)}
            onKeyDown={onTabKey}
          >
            {p.title}
          </button>
        ))}
      </div>

      {projects.map((p, i) => (
        <div
          key={p.id}
          role="tabpanel"
          id={`${uid}-panel-${p.id}`}
          aria-labelledby={`${uid}-tab-${p.id}`}
          hidden={i !== active}
          className="pv-panel"
        >
          <div className="pv-stage">
            {live === p.id ? (
              <Suspense fallback={<div className="pv-loading">Loading preview…</div>}>
                {p.id === 'universe' ? <UniverseDemo onExit={() => stop(p.id)} /> : <StuntDemo onExit={() => stop(p.id)} />}
              </Suspense>
            ) : (
              <>
                <img
                  className="pv-poster"
                  src={p.poster.src}
                  srcSet={p.poster.srcset}
                  sizes="(min-width: 1120px) 460px, (min-width: 768px) 40vw, 100vw"
                  width={p.poster.width}
                  height={p.poster.height}
                  alt={p.poster.alt}
                  decoding="async"
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
                <button
                  type="button"
                  className="pv-explore"
                  ref={(el) => {
                    explore.current[p.id] = el;
                  }}
                  onClick={() => setLive(p.id)}
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16">
                    <path d="M6 4.5v11l9-5.5z" fill="currentColor" />
                  </svg>
                  {p.exploreLabel}
                </button>
              </>
            )}
          </div>

          <div className="pv-foot">
            <p className="pv-blurb">{p.blurb}</p>
            <div className="pv-links">
              <a href={p.demoUrl} target="_blank" rel="noopener">
                Open full project<span className="visually-hidden">: {p.title} (opens in a new tab)</span>
                <svg viewBox="0 0 16 16" aria-hidden="true" width="12" height="12">
                  <path d="M6 3h7v7M13 3 4 12" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
