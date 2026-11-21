import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import './preview.css';

const UniverseDemo = lazy(() => import('./UniverseDemo'));
const StuntDemo = lazy(() => import('./StuntDemo'));

export type PreviewProject = {
  id: 'universe' | 'stunt';
  slug: string;
  title: string;
  blurb: string;
  poster: { src: string; srcset?: string; width: number; height: number; alt: string };
  icon: string;
  demoUrl: string;
  exploreLabel: string;
  bar?: 'teal' | 'rose';
};

type Props = { projects: PreviewProject[] };

/**
 * Project shortcuts down the right edge of the hero desktop. Clicking one opens
 * its preview window over the desktop; the close button or Escape puts it away.
 */
export default function ProjectPreview({ projects }: Props) {
  const [open, setOpen] = useState<PreviewProject['id'] | null>(null);
  const [live, setLive] = useState(false);
  const icons = useRef<Record<string, HTMLButtonElement | null>>({});
  const explore = useRef<HTMLButtonElement | null>(null);
  const win = useRef<HTMLElement | null>(null);
  const lastOpen = useRef<string | null>(null);
  const focusExplore = useRef(false);

  const current = projects.find((p) => p.id === open) ?? null;

  const show = (id: PreviewProject['id']) => {
    setLive(false);
    setOpen((o) => (o === id ? null : id));
  };

  const close = () => {
    setLive(false);
    setOpen(null);
  };

  const stop = () => {
    focusExplore.current = true;
    setLive(false);
  };

  // Focus the window when it opens; return focus to its icon when it closes.
  useEffect(() => {
    if (open) {
      lastOpen.current = open;
      win.current?.focus();
    } else if (lastOpen.current) {
      icons.current[lastOpen.current]?.focus();
      lastOpen.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!live && focusExplore.current) {
      explore.current?.focus();
      focusExplore.current = false;
    }
  }, [live]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <nav className="pv-icons" aria-label="Projects">
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="pv-icon"
                aria-expanded={open === p.id}
                aria-controls="pv-window"
                ref={(el) => {
                  icons.current[p.id] = el;
                }}
                onClick={() => show(p.id)}
              >
                <span className={`pv-icon-art ${p.bar ?? ''}`} aria-hidden="true">
                  <img src={p.icon} alt="" width="64" height="64" decoding="async" />
                </span>
                <span className="pv-icon-label">{p.slug}.exe</span>
                <span className="visually-hidden">: open {p.title} preview</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {current && (
        <section
          id="pv-window"
          className="pv window"
          aria-label={current.title}
          tabIndex={-1}
          ref={win}
          key={current.id}
        >
          <div className={`window-bar ${current.bar ?? ''}`}>
            <span className="dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span aria-hidden="true">{current.slug}.exe</span>
            <button type="button" className="pv-close" onClick={close}>
              <span aria-hidden="true">×</span>
              <span className="visually-hidden">Close {current.title}</span>
            </button>
          </div>

          <div className="pv-stage">
            {live ? (
              <Suspense fallback={<div className="pv-loading">Loading preview…</div>}>
                {current.id === 'universe' ? <UniverseDemo onExit={stop} /> : <StuntDemo onExit={stop} />}
              </Suspense>
            ) : (
              <>
                <img
                  className="pv-poster"
                  src={current.poster.src}
                  srcSet={current.poster.srcset}
                  sizes="(min-width: 900px) 720px, 92vw"
                  width={current.poster.width}
                  height={current.poster.height}
                  alt={current.poster.alt}
                  decoding="async"
                />
                <button type="button" className="pv-explore" ref={explore} onClick={() => setLive(true)}>
                  <svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16">
                    <path d="M6 4.5v11l9-5.5z" fill="currentColor" />
                  </svg>
                  {current.exploreLabel}
                </button>
              </>
            )}
          </div>

          <div className="pv-foot">
            <p className="pv-blurb">{current.blurb}</p>
            <div className="pv-links">
              <a href={current.demoUrl} target="_blank" rel="noopener">
                Open full project<span className="visually-hidden">: {current.title} (opens in a new tab)</span>
                <svg viewBox="0 0 16 16" aria-hidden="true" width="12" height="12">
                  <path d="M6 3h7v7M13 3 4 12" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
