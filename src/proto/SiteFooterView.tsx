// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SiteFooterView({ v }: { v: any }) {
  return (
    <>
      <footer style={S({ marginTop: 'auto', borderTop: '1px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', position: 'relative', overflow: 'hidden' })}>
        <div style={S({ maxWidth: '1500px', margin: '0 auto', padding: '64px clamp(16px, 3vw, 24px) 48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' })}>
          <div style={S({ display: 'flex', flexDirection: 'column', gap: '14px' })}>
            <span style={S({ display: 'flex', alignItems: 'center', gap: '10px' })}>
              <span style={S({ display: 'block', fontSize: '22px', lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.02em', whiteSpace: 'nowrap' })}>
                Daily Orbit
              </span>
            </span>
            <p style={S({ margin: '0', fontSize: '14px', lineHeight: '1.6', color: 'var(--muted)', maxWidth: '30ch', textWrap: 'pretty' })}>
              NASA Space Apps Challenge 2026 · health monitoring software.
            </p>
          </div>
          <nav aria-label="Footer" style={S({ display: 'flex', flexDirection: 'column', gap: '4px' })}>
            <span style={S({ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px' })}>
              Screens
            </span>
            <a href="Body%20Map.dc.html" style={S({ display: 'flex', alignItems: 'center', minHeight: '36px', fontSize: '14px', color: 'var(--ink)', textDecoration: 'none' })} className="sitefooterview-hover-1">
              Body map
            </a>
            <a href="Manual%20Entry.dc.html" style={S({ display: 'flex', alignItems: 'center', minHeight: '36px', fontSize: '14px', color: 'var(--ink)', textDecoration: 'none' })} className="sitefooterview-hover-2">
              Manual entry
            </a>
            <a href="Escalation.dc.html" style={S({ display: 'flex', alignItems: 'center', minHeight: '36px', fontSize: '14px', color: 'var(--ink)', textDecoration: 'none' })} className="sitefooterview-hover-3">
              Escalation
            </a>
            <a href="Medical%20View.dc.html" style={S({ display: 'flex', alignItems: 'center', minHeight: '36px', fontSize: '14px', color: 'var(--ink)', textDecoration: 'none' })} className="sitefooterview-hover-4">
              Medical view
            </a>
            <a href="Metrics.dc.html" style={S({ display: 'flex', alignItems: 'center', minHeight: '36px', fontSize: '14px', color: 'var(--ink)', textDecoration: 'none' })} className="sitefooterview-hover-5">
              Metrics
            </a>
            <a href="Rewards.dc.html" style={S({ display: 'flex', alignItems: 'center', minHeight: '36px', fontSize: '14px', color: 'var(--ink)', textDecoration: 'none' })} className="sitefooterview-hover-6">
              Rewards and locker
            </a>
            <a href="Onboarding.dc.html" style={S({ display: 'flex', alignItems: 'center', minHeight: '36px', fontSize: '14px', color: 'var(--ink)', textDecoration: 'none' })} className="sitefooterview-hover-7">
              Set up
            </a>
          </nav>
          <div style={S({ display: 'flex', flexDirection: 'column', gap: '10px' })}>
            <span style={S({ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' })}>
              What this console keeps to
            </span>
            {(v.rules ?? []).map((r: any, r_i: number) => (
                <Fragment key={r_i}>
              <p style={S({ margin: '0', fontSize: '14px', lineHeight: '1.5', color: 'var(--ink-soft)', textWrap: 'pretty' })}>
                <span>
                  {r}
                </span>
              </p>
                </Fragment>
              ))}
          </div>
          <div style={S({ display: 'flex', flexDirection: 'column', gap: '4px' })}>
            <span style={S({ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px' })}>
              Team
            </span>
            <span style={S({ fontSize: '14px', minHeight: '30px', display: 'flex', alignItems: 'center' })}>
              Ronav Gupta
            </span>
            <span style={S({ fontSize: '14px', minHeight: '30px', display: 'flex', alignItems: 'center' })}>
              Arnav Jain
            </span>
            <span style={S({ fontSize: '14px', minHeight: '30px', display: 'flex', alignItems: 'center' })}>
              Evode Manirahari
            </span>
          </div>
        </div>
        <div style={S({ borderTop: '1px solid var(--rule)' })}>
          <div style={S({ maxWidth: '1500px', margin: '0 auto', padding: `18px clamp(16px, 3vw, 24px) ${v.bottomPad}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 24px' })}>
            <ul style={S({ listStyle: 'none', margin: '0', padding: '0', display: 'flex', flexWrap: 'wrap', gap: '4px 20px', alignItems: 'center' })}>
              <li style={S({ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' })}>
                Console online
              </li>
              {(v.rail ?? []).map((r: any, r_i: number) => (
                  <Fragment key={r_i}>
                <li style={S({ fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' })}>
                  {r}
                </li>
                  </Fragment>
                ))}
            </ul>
            <span style={S({ fontSize: '13px', fontWeight: '600', color: 'var(--watch-ink)', whiteSpace: 'nowrap' })}>
              Prototype. Not a medical device.
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
