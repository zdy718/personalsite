import { useState } from 'react';

// Pick two things from the drawer and see what happens.

const ITEMS = [
  { id: 'laptop', icon: '💻', name: 'Laptop' },
  { id: 'coffee', icon: '☕', name: 'Coffee' },
  { id: 'pen', icon: '🖍️', name: 'Red pen' },
  { id: 'telescope', icon: '🔭', name: 'Telescope' },
  { id: 'controller', icon: '🎮', name: 'Controller' },
  { id: 'chalk', icon: '🧂', name: 'Chalk bag' },
  { id: 'watch', icon: '⌚', name: 'Smartwatch' },
  { id: 'duck', icon: '🦆', name: 'Rubber duck' },
] as const;

// Unlocked by scrolling all the way to the bottom of the site.
const SECRET = { id: 'diploma', icon: '🎓', name: 'Diploma' } as const;

type Id = (typeof ITEMS)[number]['id'] | typeof SECRET.id;

const SECRET_RECIPES: Record<string, { icon: string; title: string; text: string }> = {
  'diploma+laptop': { icon: '🚀', title: 'Software Engineer, unlocked', text: 'Graduating December 2026 and ready to ship. The email is in the footer, just saying.' },
  'coffee+diploma': { icon: '🏁', title: 'Victory lap', text: 'All those semesters of lab coffee, finally worth it.' },
  'diploma+duck': { icon: '🎓', title: 'Duck, B.S.', text: 'An honorary degree in listening without judgment.' },
};

const RECIPES: Record<string, { icon: string; title: string; text: string }> = {
  'coffee+laptop': { icon: '🌙', title: '2 a.m. commit', text: '“fix: actually fix the fix.” Pushed straight to main.' },
  'laptop+telescope': { icon: '🌌', title: 'Universe Map, v2', text: 'Now with 169,001 objects. The extra one is a smudge on the lens.' },
  'controller+laptop': { icon: '🎬', title: 'Take 47', text: 'The stunt double nails the jump. The director yells “one more.”' },
  'coffee+pen': { icon: '📝', title: '40 graded labs', text: 'Line-by-line feedback, mostly about missing semicolons.' },
  'laptop+watch': { icon: '🔄', title: 'Synced!', text: 'The watch now reminds the phone to remind you to take a break.' },
  'duck+laptop': { icon: '🐛', title: 'Bug found', text: 'You explained it to the duck and saw the bug halfway through the sentence.' },
  'chalk+controller': { icon: '🧗', title: 'Grip upgrade', text: 'Sweaty-thumb deaths in level 5 are down 30%. Unverified.' },
  'chalk+coffee': { icon: '🥴', title: 'Chalky latte', text: 'Bold. Gritty. Do not recommend.' },
  'coffee+telescope': { icon: '🔭', title: 'Night shift', text: 'Up late enough to see Betelgeuse rise. Still waiting for it to go supernova.' },
  'duck+pen': { icon: '🦆', title: 'Code reviewer', text: 'The duck leaves one comment: “quack?” It’s a fair point.' },
  'chalk+watch': { icon: '📈', title: 'Climb tracker', text: 'Heart rate: high. Grade: V-something. Fun: very.' },
  'controller+duck': { icon: '🏆', title: 'Player two', text: 'The duck wins every round. Nobody knows how.' },
};

const key = (a: Id, b: Id) => [a, b].sort().join('+');

export default function DeskDrawer({ secret = false }: { secret?: boolean }) {
  const items = secret ? [...ITEMS, SECRET] : ITEMS;
  const recipes = secret ? { ...RECIPES, ...SECRET_RECIPES } : RECIPES;
  const [picked, setPicked] = useState<Id[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());

  const toggle = (id: Id) => {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      const next = p.length >= 2 ? [id] : [...p, id];
      if (next.length === 2) {
        const k = key(next[0], next[1]);
        if (recipes[k]) setFound((f) => new Set(f).add(k));
      }
      return next;
    });
  };

  const result =
    picked.length === 2
      ? recipes[key(picked[0], picked[1])] ?? {
          icon: '🤷',
          title: 'Nothing happens',
          text: 'These two don’t combine. Yet. It’s still in beta.',
        }
      : null;

  return (
    <div className="dd">
      <p className="dd-hint">Pick two items to combine. Found {found.size} of {Object.keys(recipes).length} combos.
        {secret ? ' A secret item is in the drawer.' : ''}</p>
      <ul className="dd-items">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              className={`dd-item${it.id === SECRET.id ? ' secret' : ''}`}
              aria-pressed={picked.includes(it.id)} onClick={() => toggle(it.id)}>
              <span className="dd-icon" aria-hidden="true">{it.icon}</span>
              {it.name}
            </button>
          </li>
        ))}
      </ul>
      <div className="dd-result" aria-live="polite">
        {result ? (
          <>
            <span className="dd-big" aria-hidden="true">{result.icon}</span>
            <div>
              <p className="dd-title">{result.title}</p>
              <p className="dd-text">{result.text}</p>
            </div>
          </>
        ) : (
          <p className="dd-empty">
            {picked.length === 1 ? `${items.find((i) => i.id === picked[0])!.name} + …?` : 'The drawer is waiting.'}
          </p>
        )}
      </div>
    </div>
  );
}
