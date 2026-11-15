import * as D from './data'

/*
 * "Proof of consistency" as a downloadable image: the avatar's colors, name and level, the last
 * 30 days as a grid, and the best and current streak. Drawn on a canvas in the browser, so
 * nothing is uploaded anywhere. Effort only: no health values ever appear on it.
 */

function draw(): string {
  const id = D.getState().crew.id
  const crew = D.getState().crew as { name: string; role: string }
  const g = D.game(id) as { month: number[]; best: number; streak: number }
  const lv = D.level((D.wallet(id) as { xp: number }).xp) as { n: number; rank: string }
  const gear = D.gear(id) as Record<string, { c1?: string; c2?: string; fill?: string } | undefined>
  const title = D.levelPerks(id).title as string
  const W = 1200
  const H = 630
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')!
  const bg = x.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1220')
  bg.addColorStop(1, '#1d2b53')
  x.fillStyle = bg
  x.fillRect(0, 0, W, H)
  // a few stars
  x.fillStyle = 'rgba(255,255,255,.6)'
  for (let i = 0; i < 70; i++) x.fillRect((i * 197) % W, (i * 83) % H, (i % 3) + 1, (i % 3) + 1)

  // avatar: suit, helmet and visor in this person's own gear colors
  const ax = 170
  const ay = 250
  x.fillStyle = gear.suit?.fill || '#e9e6dc'
  x.beginPath()
  x.ellipse(ax, ay + 150, 110, 70, 0, Math.PI, 0)
  x.fill()
  x.beginPath()
  x.arc(ax, ay, 100, 0, Math.PI * 2)
  x.fill()
  x.lineWidth = 6
  x.strokeStyle = '#f6c445'
  x.stroke()
  const vg = x.createLinearGradient(ax - 60, ay - 40, ax + 60, ay + 40)
  vg.addColorStop(0, gear.visor?.c1 || '#4cc9f0')
  vg.addColorStop(1, gear.visor?.c2 || '#0b3d91')
  x.fillStyle = vg
  x.beginPath()
  x.ellipse(ax + 8, ay, 64, 46, 0, 0, Math.PI * 2)
  x.fill()
  x.fillStyle = 'rgba(255,255,255,.7)'
  x.beginPath()
  x.ellipse(ax - 18, ay - 18, 18, 8, 0, 0, Math.PI * 2)
  x.fill()

  x.fillStyle = '#f6c445'
  x.font = '700 24px system-ui, sans-serif'
  x.fillText('PROOF OF CONSISTENCY', 330, 120)
  x.fillStyle = '#f3f1ea'
  x.font = '800 64px system-ui, sans-serif'
  x.fillText(crew.name, 330, 190)
  x.font = '500 26px system-ui, sans-serif'
  x.fillStyle = 'rgba(243,241,234,.8)'
  x.fillText(`Level ${lv.n} · ${lv.rank}${title ? ` · ${title}` : ''}${crew.role ? ` · ${crew.role}` : ''}`, 330, 232)

  // 30-day grid
  const size = 40
  const gap = 8
  g.month.forEach((v, i) => {
    const col = i % 15
    const row = Math.floor(i / 15)
    x.fillStyle = v === 2 ? '#e8742c' : v === 1 ? '#f6c445' : 'rgba(243,241,234,.14)'
    x.beginPath()
    x.roundRect(330 + col * (size + gap), 280 + row * (size + gap), size, size, 8)
    x.fill()
  })
  x.font = '500 20px system-ui, sans-serif'
  x.fillStyle = 'rgba(243,241,234,.7)'
  x.fillText('Last 30 days · gold: checked in · orange: checked in and exercised', 330, 410)

  const stats: [string, string][] = [
    [`${g.month.filter((v) => v > 0).length}/30`, 'days checked in'],
    [`${g.best || g.streak}`, 'best streak (days)'],
    [`${g.streak}`, 'current streak'],
  ]
  stats.forEach(([v, k], i) => {
    x.fillStyle = '#f3f1ea'
    x.font = '800 52px system-ui, sans-serif'
    x.fillText(v, 330 + i * 260, 500)
    x.fillStyle = 'rgba(243,241,234,.7)'
    x.font = '500 20px system-ui, sans-serif'
    x.fillText(k, 330 + i * 260, 530)
  })
  x.fillStyle = 'rgba(243,241,234,.55)'
  x.font = '500 18px system-ui, sans-serif'
  x.fillText('Daily Orbit · coins and streaks reward showing up, never health values', 330, 590)
  return c.toDataURL('image/png')
}

export function ProofCardButton() {
  const download = () => {
    const a = document.createElement('a')
    a.href = draw()
    const name = String(D.getState().crew.name || 'crew').replace(/\W+/g, '-').toLowerCase()
    a.download = `daily-orbit-proof-${name}.png`
    a.click()
  }
  return (
    <button type="button" onClick={download} style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer', fontSize: 13.5 }}>
      Download proof card
    </button>
  )
}

export const drawProofCard = draw
