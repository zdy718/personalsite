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
  demoUrl: string;
  exploreLabel: string;
  bar?: 'teal' | 'rose';
};

type Props = { projects: PreviewProject[] };

/**
 * Both projects open as cascaded windows on the hero desktop. The front window
 * is live; the one behind shows its poster and comes forward when clicked.
 */
export default function ProjectPreview({ projects }: Props) {
  const [front, setFront] = useState(0);
  const [live, setLive] = useState<PreviewProject['id'] | null>(null);
  const explore = useRef<Record<string, HTMLButtonElement | null>>({});
  const focusAfter = useRef<string | null>(null);

  // Move focus to the right Explore button after stopping a demo or switching windows.
  useEffect(() => {
    if (live === null && focusAfter.current) {
      explore.current[focusAfter.current]?.focus();
      focusAfter.current = null;
    }
  }, [live, front]);

  const stop = (id: string) => {
    focusAfter.current = id;
    setLive(null);
  };

  const raise = (i: number) => {
    focusAfter.current = projects[i].id;
    setLive(null);
    setFront(i);
  };

  return (
    <div className="pv-stack">
      {projects.map((p, i) => {
        const isFront = i === front;
        return (
          // Clicking anywhere on the back window's visible edge also raises it (mouse
          // convenience); the "Switch to" pill is the real, focusable control.
          <div
            key={p.id}
            className={`pv-slot ${isFront ? 'is-front' : 'is-back'}`}
            onClick={isFront ? undefined : () => raise(i)}
          >
            <section
              className="pv window"
              aria-label={p.title}
              aria-hidden={isFront ? undefined : true}
              {...(isFront ? {} : { inert: true })}
            >
              <div className={`window-bar ${p.bar ?? ''}`}>
                <span className="dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span aria-hidden="true">{p.slug}.exe</span>
              </div>

              <div className="pv-stage">
                {isFront && live === p.id ? (
                  <Suspense fallback={<div className="pv-loading">Loading preview…</div>}>
                    {p.id === 'universe' ? (
                      <UniverseDemo onExit={() => stop(p.id)} />
                    ) : (
                      <StuntDemo onExit={() => stop(p.id)} />
                    )}
                  </Suspense>
                ) : (
                  <>
                    <img
                      className="pv-poster"
                      src={p.poster.src}
                      srcSet={p.poster.srcset}
                      sizes="(min-width: 900px) 640px, 90vw"
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
            </section>

            {!isFront && (
              <button
                type="button"
                className="pv-raise"
                onClick={(e) => {
                  e.stopPropagation();
                  raise(i);
                }}
              >
                Switch to {p.title}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
