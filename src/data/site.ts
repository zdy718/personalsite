// Single source for personal details. Verify before publishing changes —
// nothing here should be assumed (see the design brief's definition of done).

export const profile = {
  name: 'Zi-Dane Yan',
  role: 'Software Engineer',
  email: 'yanzidane7@gmail.com',
  github: 'https://github.com/zdy718',
  linkedin: 'https://www.linkedin.com/in/zi-dane-yan-9a2692229/',
  resume: '/resume.pdf',
};

export type Engagement = {
  role: string;
  org: string;
  context?: string;
  dates: string;
  bullets: string[];
  label?: string;
  link?: { href: string; text: string };
  quest?: 'duck';
};

export const experience: Engagement[] = [
  {
    role: 'Teaching Assistant',
    org: 'University of Nebraska–Lincoln',
    context: 'CSCE 231, Computer Systems Engineering',
    dates: 'Aug 2025 – Present',
    quest: 'duck',
    bullets: [
      'Lead weekly labs for 40+ students covering C programming, GDB debugging, and code review.',
      'Give line-by-line assignment feedback on correctness, readability, and efficiency.',
    ],
  },
  {
    role: 'Full-Stack Developer',
    org: 'Mission Accomplished',
    context: 'Client project through UNL Senior Design',
    dates: 'Aug 2026 – Dec 2026',
    label: 'Client work',
    bullets: [
      'Developed SwiftUI interfaces and iPhone–Apple Watch synchronization for a health prototype supporting self-regulation in neurodivergent children.',
      'Built FastAPI, PostgreSQL, and SQLAlchemy REST APIs for accounts, secure sessions, and simulated biometric reporting with threshold-based support prompts.',
    ],
  },
  {
    role: 'Full-Stack Developer',
    org: 'Aulick Industries',
    context: 'Client project through UNL Senior Design',
    dates: 'Jan 2026 – Jun 2026',
    label: 'Client work',
    bullets: [
      'Built an internal fabrication parts ordering tool: employees browse a catalog, manage a cart, and submit orders.',
      'Implemented role-based access control, AWS S3 file uploads, automated email notifications, and Excel bulk updates.',
    ],
  },
];

export const clientWork = [
  {
    name: 'Mission Accomplished',
    summary: 'A wearable health prototype that helps neurodivergent children with self-regulation, pairing an iPhone app with Apple Watch.',
    stack: 'SwiftUI · watchOS · FastAPI · PostgreSQL',
    dates: 'Aug – Dec 2026',
  },
  {
    name: 'Aulick Industries',
    summary: 'An internal ordering tool for fabrication parts with a catalog, cart, roles, file uploads, and email notifications.',
    stack: 'Full stack · AWS S3 · Excel import',
    dates: 'Jan – Jun 2026',
  },
];

export const capabilities = [
  { group: 'Interfaces', items: ['React', 'TypeScript', 'SwiftUI', 'Three.js / react-three-fiber', 'Canvas 2D', 'Tailwind CSS'] },
  { group: 'Backend and data', items: ['Python', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'SQL', 'AWS S3', 'REST APIs'] },
  { group: 'Tooling', items: ['Vite', 'Vitest', 'Git', 'C and GDB', 'Tableau'] },
];

export const education = {
  school: 'University of Nebraska–Lincoln',
  location: 'Lincoln, Nebraska',
  degree: 'Bachelor of Science in Computer Science',
  minor: 'Mathematics minor',
  dates: 'Aug 2024 – Dec 2026',
  graduation: 'December 2026',
  highlights: [
    {
      title: 'Teaching Assistant, CSCE 231 Computer Systems Engineering',
      detail: 'Leading weekly labs for 40+ students on C programming, GDB debugging, and code review since Aug 2025.',
    },
    {
      title: 'UNL Senior Design',
      detail: 'Two client engagements as a full-stack developer: Aulick Industries (Jan – Jun 2026) and Mission Accomplished (Aug – Dec 2026).',
    },
    {
      title: 'Engineering Students Advisory Board, UNL College of Engineering',
      detail: 'Member since Sept 2024, helping manage the Dean’s $100,000–$250,000 annual budget across engineering clubs and organizations.',
    },
    {
      title: 'Coding for Data, The Global Career Accelerator',
      detail: 'Jan – May 2025. Training in Python, SQL, and Tableau, building data pipelines and interactive dashboards.',
    },
  ],
};

export type Project = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  stack: string[];
  demoUrl: string;
  sourceUrl: string;
  imageAlt: string;
};

export const projects: Project[] = [
  {
    id: 'universe-map',
    title: 'Universe Map',
    tagline: 'A searchable 3D map of the catalogued universe.',
    description:
      'Explore 169,000+ stars, exoplanets, galaxies, clusters, and nebulae from Earth’s point of view, search by name or catalog designation, and open a sourced fact card for any object. A Python pipeline merges public astronomy catalogs into compact binary files, and custom shaders with progressive loading keep it responsive at every scale.',
    stack: ['React', 'TypeScript', 'Three.js', 'GLSL', 'Python'],
    demoUrl: 'https://www.universemap.org',
    sourceUrl: 'https://github.com/zdy718/universemap',
    imageAlt:
      'Universe Map with Betelgeuse selected: a filter panel on the left and an information card showing its constellation, distance, and spectral class.',
  },
  {
    id: 'stunt-double',
    title: 'Stunt Double',
    tagline: 'A browser game set on five action-movie shoots.',
    description:
      'Jump, slide, and swing through five movie-inspired levels with keyboard or touch controls. I wrote the physics, collision detection, synthesized sound, scoring, and saved progress from scratch, plus automated tests and a solver that plays every scene to prove it can be completed.',
    stack: ['TypeScript', 'Canvas 2D', 'Web Audio', 'Vitest'],
    demoUrl: 'https://stuntdouble-kappa.vercel.app/',
    sourceUrl: 'https://github.com/zdy718/stuntdouble',
    imageAlt:
      'Stunt Double gameplay: an orange-suited stunt performer runs along a night-time city street toward a red crate, with a take counter and score on screen.',
  },
];
