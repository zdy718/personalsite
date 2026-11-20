import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import './fun.css';

const ClimbingWall = lazy(() => import('./ClimbingWall'));
const DeskDrawer = lazy(() => import('./DeskDrawer'));
const RubberDuck = lazy(() => import('./RubberDuck'));

type Tab = 'wall' | 'drawer' | 'duck';
const TITLES: Record<Tab, string> = { wall: 'Set a route', drawer: 'Desk drawer', duck: 'Rubber duck debugger' };
const SECRET_KEY = 'zy.secretDiploma';

function readSecret() {
  try {
    return localStorage.getItem(SECRET_KEY) === '1';
  } catch {
    return false;
  }
}

// Small footer buttons that open a compact, modal "side quest" dialog.
// Native <dialog> gives focus trapping, Escape to close, and focus return.
export default function Playground() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>('wall');
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState(false);
  const [toast, setToast] = useState('');

  // Hidden item: scrolling all the way to the bottom puts a diploma in the drawer.
  useEffect(() => {
    if (readSecret()) {
      setSecret(true);
      return;
    }
    const check = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight > 200;
      if (scrollable && window.scrollY + window.innerHeight >= doc.scrollHeight - 8) {
        setSecret(true);
        setToast('🎓 You read to the very end. A secret item appeared in the desk drawer.');
        try {
          localStorage.setItem(SECRET_KEY, '1');
        } catch {
          /* private mode: the unlock lasts for this visit */
        }
        window.removeEventListener('scroll', check);
      }
    };
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const show = (t: Tab) => {
    setTab(t);
    setOpen(true);
    setToast('');
    if (!dialog.current?.open) dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  // Any [data-quest] sticker on the page opens its quest. Stickers stay hidden
  // until this runs (html.quests-ready), so they're never dead buttons.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-quest]');
      const q = el?.dataset.quest as Tab | undefined;
      if (q && q in TITLES) show(q);
    };
    document.addEventListener('click', onClick);
    document.documentElement.classList.add('quests-ready');
    return () => {
      document.removeEventListener('click', onClick);
      document.documentElement.classList.remove('quests-ready');
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('quest-secret', secret);
  }, [secret]);

  return (
    <>
      <p className={`pg-toast${toast ? ' show' : ''}`} role="status">
        {toast}
      </p>

      <dialog
        ref={dialog}
        className="pg-dialog"
        aria-labelledby="pg-title"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog.current) close(); // click on backdrop
        }}
      >
        <div className="window pg-window">
          <div className="window-bar">
            <span className="dots" aria-hidden="true"><i /><i /><i /></span>
            <span id="pg-title">{TITLES[tab]}</span>
            <button type="button" className="pg-close" onClick={close} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="pg-body">
            {open && (
              <Suspense fallback={<p className="pg-loading">Loading…</p>}>
                {tab === 'wall' && <ClimbingWall />}
                {tab === 'drawer' && <DeskDrawer secret={secret} />}
                {tab === 'duck' && <RubberDuck />}
              </Suspense>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
