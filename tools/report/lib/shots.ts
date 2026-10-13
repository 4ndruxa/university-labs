// Скриншоти «вікон» сайту: свіжа збірка → vite preview → headless Chromium 1366×768, світла тема
import { spawn, execSync, type ChildProcess } from 'node:child_process'
import { chromium, type Page } from 'playwright-core'

const PORT = 4317
const BASE = `http://localhost:${PORT}/`

async function waitForServer(url: string, timeoutMs = 20000): Promise<void> {
  const until = Date.now() + timeoutMs
  while (Date.now() < until) {
    try {
      if ((await fetch(url)).ok) return
    } catch { /* ще не піднявся */ }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`Сервер ${url} не відповідає`)
}

export type ShotScript = (page: Page, shot: (locator?: string) => Promise<Buffer>) => Promise<Buffer[]>

/** Збирає сайт, відкриває route і віддає page сценарію; shot() знімає видиме «вікно» (.window) */
export async function withSite(route: string, script: ShotScript): Promise<Buffer[]> {
  execSync('npx vite build --logLevel error', { stdio: 'inherit' })
  const server: ChildProcess = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true })
  try {
    await waitForServer(BASE)
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'reduce' })
      await page.goto(`${BASE}#/${route}`)
      await page.waitForSelector('.window')
      // липка навігація не повинна накривати вікно на знімку
      await page.addStyleTag({ content: '.navbar, .sticky-top { position: static !important; }' })
      const shot = async (locator = '.tab-pane.active .window, .window:visible'): Promise<Buffer> => {
        const el = page.locator(locator).first()
        await el.scrollIntoViewIfNeeded()
        return el.screenshot({ animations: 'disabled' })
      }
      return await script(page, shot)
    } finally {
      await browser.close()
    }
  } finally {
    if (server.pid) process.kill(-server.pid)
  }
}
