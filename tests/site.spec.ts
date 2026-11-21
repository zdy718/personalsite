import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/404'];

test.describe('pages', () => {
  for (const path of pages) {
    test(`${path} has one h1, metadata, and no serious a11y violations`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /^https?:\/\//);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
    });
  }

  test('homepage title and first-screen actions', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Zi-Dane Yan | Software Engineer');
    await expect(page.getByRole('link', { name: 'See my projects' })).toBeInViewport();
    await expect(page.getByRole('link', { name: /View resume/ })).toBeInViewport();
  });

  test('resume and social image are served', async ({ request }) => {
    for (const url of ['/resume.pdf', '/og.png', '/robots.txt', '/sitemap-index.xml']) {
      const res = await request.get(url);
      expect(res.status(), url).toBe(200);
    }
  });

  test('skip link moves focus to main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard only');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });
});

test.describe('project preview', () => {
  test('clicking the back window brings it forward without resizing the stack', async ({ page }) => {
    await page.goto('/');
    const stack = page.locator('.pv-stack');
    const front = page.getByRole('region', { name: 'Universe Map' });
    await expect(front).toBeVisible();
    await expect(page.getByRole('region', { name: 'Stunt Double' })).toHaveCount(0); // back window is inert
    const h1 = (await stack.boundingBox())!.height;
    await page.getByRole('button', { name: 'Switch to Stunt Double' }).click();
    await expect(page.getByRole('region', { name: 'Stunt Double' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try a quick jump' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Switch to Universe Map' })).toBeVisible();
    const h2 = (await stack.boundingBox())!.height;
    expect(Math.abs(h1 - h2)).toBeLessThan(2);
  });

  test('case study pages no longer exist', async ({ request }) => {
    expect((await request.get('/work/universe-map')).status()).toBe(404);
  });

  test('universe preview: selecting an object updates the details', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explore preview' }).click();
    await page.getByRole('button', { name: 'Andromeda Galaxy' }).click();
    await expect(page.locator('.um-card')).toContainText('2.5 million light-years');
    await expect(page.getByRole('link', { name: /Open full project/ }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Close preview' }).click();
    await expect(page.getByRole('button', { name: 'Explore preview' })).toBeFocused();
  });

  test('stunt preview: play, jump with keyboard without scrolling the page', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to Stunt Double' }).click();
    await page.getByRole('button', { name: 'Try a quick jump' }).click();
    await page.getByRole('button', { name: 'Play' }).click();
    const canvas = page.locator('.sd-canvas');
    await expect(canvas).toBeFocused();
    const before = await page.evaluate(() => window.scrollY);
    if (!isMobile) {
      await page.keyboard.down(' ');
      await page.waitForTimeout(120);
      await page.keyboard.up(' ');
      expect(await page.evaluate(() => window.scrollY)).toBe(before);
    }
    await expect(page.getByRole('button', { name: 'Jump' })).toBeEnabled();
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.getByRole('button', { name: 'Try a quick jump' })).toBeVisible();
  });

  test('without JavaScript the static preview and links still render', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('.pv-poster').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Education', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Have something in mind?' })).toBeVisible();
    await ctx.close();
  });
});

test.describe('hero desktop', () => {
  test('shortcut icons jump to each section', async ({ page }) => {
    await page.goto('/');
    const shortcuts = page.getByRole('navigation', { name: 'Shortcuts' });
    for (const [label, id] of [['about.txt', 'about'], ['projects', 'work'], ['education', 'education'], ['experience', 'experience'], ['contact.eml', 'contact']]) {
      await expect(shortcuts.getByRole('link', { name: label })).toHaveAttribute('href', `#${id}`);
    }
    await shortcuts.getByRole('link', { name: 'experience' }).click();
    await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeInViewport();
  });
});

test.describe('side quests', () => {
  test.use({ reducedMotion: 'reduce' });

  test('climbing wall: a good route sends, a huge reach falls, Escape closes', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Set a route' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Set a route' });
    await expect(dialog).toBeVisible();
    const holds = dialog.locator('.cw-hold');
    await holds.last().waitFor();
    // Solve whatever random wall we got (BFS with the same reach rule as the game).
    const path = await holds.evaluateAll((els) => {
      const pts = els.map((e) => ({ x: parseFloat((e as HTMLElement).style.left), y: parseFloat((e as HTMLElement).style.top) }));
      const d = (a: number, b: number) => Math.hypot((pts[a].x - pts[b].x) * 3, (pts[a].y - pts[b].y) * 4);
      const prev = new Map<number, number>([[0, -1]]);
      const q = [0];
      while (q.length) {
        const c = q.shift()!;
        for (let n = 0; n < pts.length; n++) if (!prev.has(n) && d(c, n) <= 120) { prev.set(n, c); q.push(n); }
      }
      const out: number[] = [];
      for (let c = pts.length - 1; c > 0; c = prev.get(c)!) out.unshift(c);
      return out;
    });
    expect(path.length).toBeGreaterThan(0);
    for (const i of path) await holds.nth(i).click();
    await dialog.getByRole('button', { name: 'Climb', exact: true }).click();
    await expect(dialog.getByRole('status')).toContainText('Sent it', { timeout: 3000 });
    await expect(dialog.getByText('Sends: 1')).toBeVisible();

    await dialog.getByRole('button', { name: 'New wall' }).click();
    await holds.last().click();
    await dialog.getByRole('button', { name: 'Climb', exact: true }).click();
    await expect(dialog.getByRole('status')).toContainText('Popped off', { timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('desk drawer combines two items', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open desk drawer' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Laptop' }).click();
    await dialog.getByRole('button', { name: 'Coffee' }).click();
    await expect(dialog).toContainText('2 a.m. commit');
  });

  test('constellation reveals a milestone', async ({ page }) => {
    await page.goto('/');
    await page.locator('astro-island:has(.cn):not([ssr])').waitFor({ state: 'attached' });
    await page.getByRole('button', { name: /Aug 2025: Became a TA/ }).click();
    await expect(page.locator('.cn-card')).toContainText('Leading weekly CSCE 231 labs');
  });

  test('walls are randomized', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Set a route' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('.cw-hold').last().waitFor();
    const layout = () => dialog.locator('.cw-hold').evaluateAll((els) => els.map((e) => (e as HTMLElement).style.left).join());
    const a = await layout();
    await dialog.getByRole('button', { name: 'New wall' }).click();
    expect(await layout()).not.toBe(a);
  });

  test('each sticker opens only its own game', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Set a route' }).click();
    const dialog = page.getByRole('dialog', { name: 'Set a route' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /duck|drawer/i })).toHaveCount(0);
  });

  test('rubber duck replies', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ask the duck' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Describe your bug').fill('my loop runs forever');
    await dialog.getByRole('button', { name: 'Tell' }).click();
    await expect(dialog.locator('.rd-msg.duck').last()).toContainText(/qua+ck/i);
    await dialog.getByLabel('Describe your bug').fill('oh wait, found it');
    await dialog.getByRole('button', { name: 'Tell' }).click();
    await expect(dialog.locator('.rd-msg.duck').last()).toContainText('You solved it yourself');
  });

  test('scrolling to the bottom unlocks the secret drawer item', async ({ page }) => {
    await page.goto('/');
    await page.locator('html.quests-ready').waitFor({ state: 'attached' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator('.pg-toast')).toContainText('secret item');
    await page.getByRole('button', { name: 'Open desk drawer' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Diploma' }).click();
    await dialog.getByRole('button', { name: 'Laptop' }).click();
    await expect(dialog).toContainText('Software Engineer, unlocked');
  });

  test('stickers stay hidden without JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('[data-quest]').first()).toBeHidden();
    await ctx.close();
  });

  test('clapperboard counts takes', async ({ page }) => {
    await page.goto('/');
    const clap = page.getByRole('button', { name: /clapperboard/i });
    await clap.click();
    await clap.click();
    await expect(page.locator('[data-take]')).toHaveText('TAKE 02');
  });
});
