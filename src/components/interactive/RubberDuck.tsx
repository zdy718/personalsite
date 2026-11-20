import { useEffect, useRef, useState, type FormEvent } from 'react';

// Rubber-duck debugging: explain your bug, the duck listens. Mostly it quacks.
// Now and then it offers the kind of nudge a TA would.

const QUACKS = ['Quack?', 'Quack.', 'Quack quack!', '…quack?', 'QUACK.', 'Quaaack.'];
const NUDGES = [
  'Quack. (Have you read the whole error message, including the line number?)',
  'Quack? (Off by one? Check the loop bounds.)',
  'Quack. (Print the value right before it breaks.)',
  'Quack! (In GDB, try `bt` to see how you got here.)',
  'Quack… (What changed since it last worked?)',
  'Quack. (Is that variable what you think it is, or just what you hope it is?)',
  'Quack? (Try the smallest input that still fails.)',
];
const SOLVED = /\b(oh|wait|got it|found it|nevermind|never mind|fixed|aha)\b/i;

type Msg = { from: 'you' | 'duck'; text: string };

export default function RubberDuck() {
  const [log, setLog] = useState<Msg[]>([{ from: 'duck', text: 'Quack. Tell me about your bug. I’m listening.' }]);
  const [draft, setDraft] = useState('');
  const [wobble, setWobble] = useState(0);
  const count = useRef(0);
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    count.current += 1;
    let reply: string;
    if (SOLVED.test(text)) reply = 'QUACK! 🎉 (You solved it yourself. That’s how it works.)';
    else if (count.current % 3 === 0) reply = NUDGES[Math.floor(Math.random() * NUDGES.length)];
    else reply = QUACKS[Math.floor(Math.random() * QUACKS.length)];
    setLog((l) => [...l.slice(-20), { from: 'you', text }, { from: 'duck', text: reply }]);
    setDraft('');
    setWobble((w) => w + 1);
  };

  return (
    <div className="rd">
      <div className="rd-head">
        <span key={wobble} className="rd-duck" aria-hidden="true">🦆</span>
        <p>Explain your bug out loud, or type it. The duck has helped debug a lot of C.</p>
      </div>
      <ol className="rd-log" ref={logRef} aria-live="polite" aria-label="Conversation with the duck">
        {log.map((m, i) => (
          <li key={i} className={`rd-msg ${m.from}`}>
            <span className="visually-hidden">{m.from === 'you' ? 'You: ' : 'Duck: '}</span>
            {m.text}
          </li>
        ))}
      </ol>
      <form className="rd-form" onSubmit={send}>
        <label htmlFor="rd-input" className="visually-hidden">Describe your bug</label>
        <input
          id="rd-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="My loop runs one time too many…"
          autoComplete="off"
          maxLength={200}
        />
        <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
          Tell
        </button>
      </form>
    </div>
  );
}
