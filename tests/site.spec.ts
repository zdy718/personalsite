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
    await expect(page.getByText('graduating in December 2026')).toBeVisible();
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
  test('tabs work with arrow keys and keep the panel height', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard only');
    await page.goto('/');
    const tab1 = page.getByRole('tab', { name: 'Universe Map' });
    const tab2 = page.getByRole('tab', { name: 'Stunt Double' });
    const stage = page.locator('.pv');
    const h1 = (await stage.boundingBox())!.height;
    await tab1.focus();
    await page.keyboard.press('ArrowRight');
    await expect(tab2).toBeFocused();
    await expect(tab2).toHaveAttribute('aria-selected', 'true');
    const h2 = (await stage.boundingBox())!.height;
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
    await page.getByRole('tab', { name: 'Stunt Double' }).click();
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

test.describe('mobile navigation', () => {
  test('menu opens, closes with Escape, and returns focus', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone only');
    await page.goto('/');
    const btn = page.getByRole('button', { name: 'Menu' });
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Work' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toBeFocused();
  });
});
