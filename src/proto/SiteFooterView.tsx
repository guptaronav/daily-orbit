// @ts-nocheck
/* eslint-disable */
// The site footer. Rebuilt from the prototype's (which was one long column of links): a brand
// block, three short link groups named exactly as in the top bar, the team, and a status rail
// that clears the mission dock.
import { LogoMark } from './Logo'

const GROUPS = [
  {
    title: 'Daily',
    links: [
      ['Today.dc.html', 'Today'],
      ['Body%20Map.dc.html', 'Body'],
      ['Schedule.dc.html', 'Schedule'],
      ['Manual%20Entry.dc.html', 'Log'],
      ['Mirror.dc.html', 'Mirror check'],
    ],
  },
  {
    title: 'Crew and mission',
    links: [
      ['Escalation.dc.html', 'Escalate'],
      ['Medical%20View.dc.html', 'Crew'],
      ['Rewards.dc.html', 'Rewards'],
      ['Radiation.dc.html', 'Radiation'],
      ['Onboarding.dc.html', 'Set up again'],
    ],
  },
  {
    title: 'Data and proof',
    links: [
      ['Metrics.dc.html', 'Metrics and real-data test'],
      ['Sources.dc.html', 'Sources'],
      ['https://www.nasa.gov/hrp/risks', 'NASA Human Research Program risks', true],
      ['https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/', 'The challenge', true],
    ],
  },
]

const TEAM = [
  ['Ronav Gupta', 'Lead, camera and signal'],
  ['Arnav Jain', 'Design, screens and game'],
  ['Evode Manirahari', 'NASA data and research'],
]

const PROMISES = ['Works offline', 'Nothing leaves this device', 'Not a medical device']

const head = { margin: '0 0 10px', fontSize: '12px', fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }
const link = { display: 'inline-block', padding: '5px 0', fontSize: '14.5px', color: 'var(--ink)', textDecoration: 'none' }

export function SiteFooterView({ v }: { v: any }) {
  return (
    <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)' }}>
      <div className="footer-grid" style={{ maxWidth: 1440, margin: '0 auto', padding: '40px clamp(16px, 3vw, 32px) 28px', display: 'grid', gap: '28px 32px' }}>
        <div style={{ minWidth: 0, display: 'grid', gap: 12, alignContent: 'start' }} className="footer-brand">
          <a href="Landing.dc.html" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)' }}>
            <LogoMark height={30} />
            <strong style={{ fontSize: 20, letterSpacing: '-0.02em' }}>Daily Orbit</strong>
          </a>
          <p style={{ margin: 0, maxWidth: 380, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-soft)' }}>
            A minute a day keeps the crew flying. Built for the 2026 NASA Space Apps Challenge, health monitoring for astronauts on long missions.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PROMISES.map((p) => (
              <span key={p} style={{ padding: '4px 10px', borderRadius: 99, background: 'var(--panel-2)', border: '1px solid var(--rule)', fontSize: 12.5, fontWeight: 600 }}>
                {p}
              </span>
            ))}
          </div>
        </div>
        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p style={head}>{g.title}</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {g.links.map(([href, label, ext]) => (
                <li key={label}>
                  <a href={href} className="footer-link" style={link} {...(ext ? { target: '_blank', rel: 'noreferrer' } : {})}>
                    {label}
                    {ext ? ' ↗' : ''}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <p style={head}>Team</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {TEAM.map(([name, role]) => (
              <li key={name} style={{ display: 'grid' }}>
                <span style={{ fontSize: 14.5, fontWeight: 650 }}>{name}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: `14px clamp(16px, 3vw, 32px) ${v.bottomPad}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 20px', fontSize: 13, color: 'var(--muted)' }}>
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--ok)' }} />
              Console online
            </span>
            {(v.rail ?? []).map((r) => (
              <span key={r}>{r}</span>
            ))}
          </span>
          <span style={{ fontWeight: 700, color: 'var(--act-ink)' }}>Prototype. Not a medical device.</span>
        </div>
      </div>
    </footer>
  )
}
