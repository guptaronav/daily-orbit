// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CrewDockView({ v }: { v: any }) {
  return (
    <>
      <div ref={v.rootRef} role="toolbar" aria-label="Mission dock" style={S({ position: 'fixed', left: '50%', bottom: '18px', transform: 'translateX(-50%)', zIndex: '35', maxWidth: 'calc(100vw - 20px)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', color: 'var(--ink)', animation: 'chm-dock-in 420ms cubic-bezier(.22,1,.36,1) both' })}>
        {(v.popCrew) ? (
          <>
          <div role="dialog" aria-label={v.pop.aria} style={S({ position: 'absolute', bottom: 'calc(100% + 12px)', left: v.pop.left, transform: 'translateX(-50%)', width: '280px', background: 'var(--panel)', border: '1px solid var(--rule-strong)', borderRadius: '18px', boxShadow: '0 24px 50px -24px rgba(20,24,31,.45)', overflow: 'hidden', animation: 'chm-pop 200ms cubic-bezier(.22,1,.36,1) both' })}>
            <div style={S({ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 16px 14px' })}>
              <P.Avatar crew={v.pop.crew} gear={v.pop.gear} size={48} ring={v.pop.ring} />
              <div style={S({ minWidth: '0', flex: '1' })}>
                <p style={S({ margin: '0', fontSize: '16px', fontWeight: '600', letterSpacing: '-0.01em' })}>
                  {v.pop.name}
                </p>
                <p style={S({ margin: '2px 0 0', fontSize: '13px', color: 'var(--muted)' })}>
                  {v.pop.role}
                </p>
              </div>
              <span style={S({ padding: '4px 10px', borderRadius: '999px', background: v.pop.chipBg, color: v.pop.ink, fontSize: '12.5px', fontWeight: '600', whiteSpace: 'nowrap' })}>
                {v.pop.word}
              </span>
            </div>
            <div style={S({ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' })}>
              <div style={S({ padding: '12px 16px', borderRight: '1px solid var(--rule)' })}>
                <p style={S({ margin: '0', fontSize: '12.5px', color: 'var(--muted)' })}>
                  Streak
                </p>
                <p style={S({ margin: '4px 0 0', display: 'flex', alignItems: 'baseline', gap: '5px' })}>
                  <span style={S({ fontSize: '26px', fontWeight: '650', letterSpacing: '-0.03em' })}>
                    {v.pop.streak}
                  </span>
                  <span style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                    days
                  </span>
                </p>
              </div>
              <div style={S({ padding: '12px 16px' })}>
                <p style={S({ margin: '0', fontSize: '12.5px', color: 'var(--muted)' })}>
                  This week
                </p>
                <p style={S({ margin: '4px 0 0', display: 'flex', alignItems: 'baseline', gap: '5px' })}>
                  <span style={S({ fontSize: '26px', fontWeight: '650', letterSpacing: '-0.03em' })}>
                    {v.pop.week}
                  </span>
                  <span style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                    pts
                  </span>
                </p>
              </div>
            </div>
            <div style={S({ padding: '12px 16px 14px' })}>
              <p style={S({ margin: '0', fontSize: '12.5px', color: 'var(--muted)' })}>
                Last 14 days of check-ins
              </p>
              <div aria-hidden="true" style={S({ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '3px' })}>
                {(v.pop.days ?? []).map((d: any, d_i: number) => (
                    <Fragment key={d_i}>
                  <span style={S({ height: '18px', borderRadius: '4px', background: d })}>
                  </span>
                    </Fragment>
                  ))}
              </div>
              <p style={S({ margin: '12px 0 0', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--muted)' })}>
                <span>
                  {v.pop.hint}
                </span>
                <span style={S({ padding: '1px 6px', border: '1px solid var(--rule-strong)', borderRadius: '5px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '11.5px', color: 'var(--ink)' })}>
                  {v.pop.key}
                </span>
              </p>
            </div>
          </div>
          </>
        ) : null}
        {(v.popGoal) ? (
          <>
          <div role="dialog" aria-label="Crew weekly goal" style={S({ position: 'absolute', bottom: 'calc(100% + 12px)', right: '0', left: 'auto', width: '300px', background: 'var(--panel)', border: '1px solid var(--rule-strong)', borderRadius: '18px', boxShadow: '0 24px 50px -24px rgba(20,24,31,.45)', padding: '18px', animation: 'chm-dock-in 200ms cubic-bezier(.22,1,.36,1) both', transform: 'none' })}>
            <p style={S({ margin: '0', fontSize: '13px', color: 'var(--muted)' })}>
              Crew weekly goal · shared, nobody is ranked
            </p>
            <p style={S({ margin: '6px 0 0', display: 'flex', alignItems: 'baseline', gap: '6px' })}>
              <span style={S({ fontSize: '34px', fontWeight: '650', letterSpacing: '-0.035em' })}>
                {v.goalWeek}
              </span>
              <span style={S({ fontSize: '14px', color: 'var(--muted)' })}>
                of {v.goalTarget} points
              </span>
            </p>
            <div role="progressbar" aria-label="Crew weekly goal" aria-valuemin="0" aria-valuemax="100" aria-valuenow={v.goalPctNum} style={S({ marginTop: '10px', height: '8px', borderRadius: '999px', background: 'var(--paper-deep)', overflow: 'hidden' })}>
              <span style={S({ display: 'block', height: '100%', width: v.goalPct, borderRadius: '999px', background: 'var(--accent)' })}>
              </span>
            </div>
            <p style={S({ margin: '16px 0 8px', fontSize: '13px', color: 'var(--muted)' })}>
              Ship systems online
            </p>
            <ul style={S({ listStyle: 'none', margin: '0', padding: '0', display: 'flex', flexDirection: 'column', gap: '2px' })}>
              {(v.systems ?? []).map((s: any, s_i: number) => (
                  <Fragment key={s_i}>
                <li style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '7px 0', borderBottom: '1px solid var(--rule)', fontSize: '14px', color: s.color })}>
                  <span>
                    {s.name}
                  </span>
                  <span style={S({ fontSize: '12.5px', color: 'var(--muted)', whiteSpace: 'nowrap' })}>
                    {s.state}
                  </span>
                </li>
                  </Fragment>
                ))}
            </ul>
          </div>
          </>
        ) : null}
        {(v.collapsed) ? (
          <>
          <div style={S({ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: 'color-mix(in srgb, var(--panel) 90%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--rule-strong)', borderRadius: '999px', boxShadow: '0 16px 40px -20px rgba(20,24,31,.45)' })}>
            <P.Avatar crew={v.activeCrew} gear={v.activeGear} size={36} ring="var(--accent)" />
            <button type="button" onClick={v.checkIn} style={S({ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '40px', padding: '0 16px', borderRadius: '999px', background: 'var(--ink)', color: 'var(--paper)', border: '0', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' })}>
              {v.checkLabel}
            </button>
            <button type="button" onClick={v.toggleCollapse} aria-label="Expand mission dock" style={S({ display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: '999px', background: 'transparent', border: '0', color: 'var(--muted)', cursor: 'pointer' })} className="crewdockview-hover-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={v.maxIcon}>
                </path>
              </svg>
            </button>
          </div>
          </>
        ) : null}
        {(v.expanded) ? (
          <>
          <div onMouseLeave={v.leave} style={S({ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px', background: 'color-mix(in srgb, var(--panel) 90%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--rule-strong)', borderRadius: '24px', boxShadow: '0 20px 50px -24px rgba(20,24,31,.5)' })}>
            <div role="group" aria-label="Crew" style={S({ display: v.crewDisplay, alignItems: 'flex-end', gap: '2px', padding: '0 4px' })}>
              {(v.crew ?? []).map((c: any, c_i: number) => (
                  <Fragment key={c_i}>
                <button type="button" onClick={c.pick} onMouseEnter={c.enter} onFocus={c.enter} aria-pressed={c.active} aria-label={c.aria} style={S({ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', width: '58px', padding: '4px 0 2px', background: 'transparent', border: '0', borderRadius: '16px', color: 'var(--ink)', cursor: 'pointer' })} className="crewdockview-hover-2">
                  <span style={S({ position: 'relative', display: 'grid', placeItems: 'center', width: '48px', height: '48px', transform: c.scale, transformOrigin: 'bottom center', transition: 'transform 220ms cubic-bezier(.22,1,.36,1)' })}>
                    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" style={S({ position: 'absolute', inset: '0', transform: 'rotate(-90deg)' })}>
                      <circle cx="24" cy="24" r="22" fill="none" stroke="var(--rule)" strokeWidth="2.5">
                      </circle>
                      <circle cx="24" cy="24" r="22" fill="none" stroke={c.ringColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c.dash} style={S({ transition: 'stroke-dasharray 500ms cubic-bezier(.22,1,.36,1)' })}>
                      </circle>
                    </svg>
                    <P.Avatar crew={c.crew} gear={c.gear} size={38} ring={c.ring} />
                  </span>
                  <span style={S({ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '11.5px', fontWeight: '600', color: c.labelColor, whiteSpace: 'nowrap' })}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={v.flameIcon}>
                      </path>
                    </svg>
                    {c.streak}
                  </span>
                </button>
                  </Fragment>
                ))}
            </div>
            <span aria-hidden="true" style={S({ display: v.crewDisplay, alignSelf: 'stretch', width: '1px', margin: '6px 4px', background: 'var(--rule)' })}>
            </span>
            <button type="button" onClick={v.checkIn} onMouseEnter={v.leave} aria-label={v.checkAria} style={S({ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '56px', padding: '0 8px 0 8px', borderRadius: '18px', background: 'var(--ink)', color: 'var(--paper)', border: '0', boxShadow: '0 4px 0 #000', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', whiteSpace: 'nowrap', transition: 'transform 90ms ease, box-shadow 90ms ease' })} className="crewdockview-active-3">
              <span style={S({ position: 'relative', display: 'grid', placeItems: 'center', width: '40px', height: '40px' })}>
                <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" style={S({ position: 'absolute', inset: '0', transform: 'rotate(-90deg)' })}>
                  <circle cx="20" cy="20" r="17" fill="none" stroke="color-mix(in srgb, var(--paper) 22%, transparent)" strokeWidth="3">
                  </circle>
                  <circle cx="20" cy="20" r="17" fill="none" stroke="var(--paper)" strokeWidth="3" strokeLinecap="round" strokeDasharray={v.todayDash}>
                  </circle>
                </svg>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.scanIcon}>
                  </path>
                </svg>
              </span>
              <span style={S({ display: 'flex', flexDirection: 'column', lineHeight: '1.15', paddingRight: '6px' })}>
                <span style={S({ fontSize: '15px', fontWeight: '650' })}>
                  {v.checkLabel}
                </span>
                <span style={S({ fontSize: '12px', opacity: '.72' })}>
                  {v.todayText}
                </span>
              </span>
            </button>
            {(v.nextShow) ? (
              <button type="button" onClick={v.openSchedule} onMouseEnter={v.leave} aria-label={`Next on your schedule: ${v.nextTitle}, ${v.nextWhen}. Open the schedule.`} className="dock-next" style={S({ display: v.goalDisplay, flexDirection: 'column', justifyContent: 'center', gap: '2px', minHeight: '48px', maxWidth: '190px', padding: '0 12px', borderRadius: '14px', border: '0', background: 'transparent', color: 'var(--ink)', textAlign: 'left', cursor: 'pointer' })}>
                <span style={S({ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted)' })}>
                  {v.nextWhen}
                </span>
                <span style={S({ fontSize: '13.5px', fontWeight: '650', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '166px' })}>
                  {v.nextTitle}
                </span>
              </button>
            ) : null}
            <span aria-hidden="true" style={S({ display: v.goalDisplay, alignSelf: 'stretch', width: '1px', margin: '6px 4px', background: 'var(--rule)' })}>
            </span>
            <button type="button" onClick={v.toggleGoal} aria-expanded={v.goalOpenStr} style={S({ display: v.goalDisplay, flexDirection: 'column', justifyContent: 'center', gap: '6px', minHeight: '52px', minWidth: '128px', padding: '0 12px', background: v.goalBg, border: '0', borderRadius: '16px', color: 'var(--ink)', textAlign: 'left', cursor: 'pointer' })} className="crewdockview-hover-5">
              <span style={S({ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' })}>
                <span>
                  Crew goal
                </span>
                <span style={S({ color: 'var(--ink)', fontWeight: '600' })}>
                  {v.goalPct}
                </span>
              </span>
              <span aria-hidden="true" style={S({ display: 'block', height: '6px', borderRadius: '999px', background: 'var(--paper-deep)', overflow: 'hidden' })}>
                <span style={S({ display: 'block', height: '100%', width: v.goalPct, borderRadius: '999px', background: 'var(--accent)' })}>
                </span>
              </span>
            </button>
            <button type="button" className="dock-ask" onClick={() => window.dispatchEvent(new Event('orbit:toggle'))} aria-label="Ask Orbit: questions about symptoms and readings" style={S({ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px', padding: '0 14px', margin: '0 4px', borderRadius: '999px', border: '0', background: '#14181f', color: '#f3f1ea', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' })}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f6c445" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z M8 9h8 M8 13h5" />
              </svg>
              <span className="dock-ask-label">Ask Orbit</span>
            </button>
            <button type="button" onClick={v.toggleCollapse} aria-label="Minimize mission dock" style={S({ display: 'grid', placeItems: 'center', width: '40px', height: '48px', borderRadius: '14px', background: 'transparent', border: '0', color: 'var(--muted)', cursor: 'pointer' })} className="crewdockview-hover-6">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={v.minIcon}>
                </path>
              </svg>
            </button>
          </div>
          </>
        ) : null}
      </div>
    </>
  )
}
