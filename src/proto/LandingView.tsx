// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LandingView({ v }: { v: any }) {
  return (
    <>
      <div data-chm-root="1" style={S({ '--ink': '#14181f', '--ink-soft': '#2b323d', '--paper': '#f3f1ea', '--paper-deep': '#e8e4d8', '--panel': '#fbfaf6', '--panel-2': '#f6f4ec', '--rule': '#d9d4c4', '--rule-strong': '#a49c88', '--muted': '#5b6270', '--accent': '#0b3d91', '--accent-wash': '#e4e9f3', '--ok': '#2f7d4f', '--ok-ink': '#1b5b33', '--watch': '#b7791f', '--watch-ink': '#7a4f00', '--act': '#b3261e', '--act-ink': '#8c1d18', '--nodata': '#8a8f98', '--nodata-ink': '#5b6270', '--on-accent': '#ffffff', '--star-o': '0', '--glow': 'none', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', fontVariantNumeric: 'tabular-nums' })}>
        <P.TopBar current="Home" />
        <main id="main" style={S({ flex: '1', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 80px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '28px' })}>
          <section aria-labelledby="hero-heading" style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '24px' })}>
            <div style={S({ flex: '1.35 1 520px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '22px', padding: 'clamp(8px, 3vw, 32px) 0' })}>
              <p style={S({ margin: '0', display: 'flex', flexWrap: 'wrap', gap: '8px', animation: 'ld-rise 600ms cubic-bezier(.22,1,.36,1) both' })}>
                <span style={S({ padding: '6px 12px', borderRadius: '999px', background: 'var(--panel)', border: '1px solid var(--rule)', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' })}>
                  NASA Space Apps Challenge 2026
                </span>
                <span style={S({ padding: '6px 12px', borderRadius: '999px', background: 'var(--panel)', border: '1px solid var(--rule)', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' })}>
                  Runs offline · No upload
                </span>
              </p>
              <h1 id="hero-heading" style={S({ margin: '0', fontSize: 'clamp(48px, 7.4vw, 104px)', lineHeight: '.88', fontWeight: '800', letterSpacing: '-0.06em', animation: 'ld-rise 700ms 80ms cubic-bezier(.22,1,.36,1) both' })}>
                Thirty seconds
                <br />
                a day keeps
                <br />
                the crew flying.
              </h1>
              <p style={S({ margin: '0', maxWidth: '54ch', fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: '1.55', color: 'var(--ink-soft)', textWrap: 'pretty', animation: 'ld-rise 700ms 160ms cubic-bezier(.22,1,.36,1) both' })}>
                On a long mission there is no clinic down the hall. This app reads what it can from your webcam, compares it with your own baseline, and tells you when to escalate — and when it cannot get a clean reading, it says so instead of guessing.
              </p>
              <div style={S({ display: 'flex', flexWrap: 'wrap', gap: '12px', animation: 'ld-rise 700ms 240ms cubic-bezier(.22,1,.36,1) both' })}>
                <a href="Onboarding.dc.html" style={S({ display: 'inline-flex', alignItems: 'center', gap: '10px', minHeight: '58px', padding: '0 26px', borderRadius: '18px', background: '#14181f', color: '#f3f1ea', textDecoration: 'none', fontSize: '16px', fontWeight: '750', boxShadow: '0 6px 0 #000', transition: 'transform 90ms ease, box-shadow 90ms ease' })} className="landingview-hover-1 landingview-active-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.scanIcon}>
                    </path>
                  </svg>
                  Take the mirror check
                </a>
                <a href="Body%20Map.dc.html" style={S({ display: 'inline-flex', alignItems: 'center', gap: '10px', minHeight: '58px', padding: '0 24px', borderRadius: '18px', background: 'var(--panel)', color: 'var(--ink)', textDecoration: 'none', fontSize: '16px', fontWeight: '700', border: '2px solid var(--rule-strong)', boxShadow: '0 6px 0 var(--rule-strong)', transition: 'transform 90ms ease, box-shadow 90ms ease' })} className="landingview-hover-3 landingview-active-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.bodyIcon}>
                    </path>
                  </svg>
                  Explore the crew dashboard
                </a>
              </div>
              <dl style={S({ margin: '6px 0 0', display: 'flex', flexWrap: 'wrap', gap: '10px 28px', animation: 'ld-rise 700ms 320ms cubic-bezier(.22,1,.36,1) both' })}>
                {(v.heroStats ?? []).map((h: any, h_i: number) => (
                    <Fragment key={h_i}>
                  <div>
                    <dt style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                      {h.k}
                    </dt>
                    <dd style={S({ margin: '2px 0 0', fontSize: '30px', fontWeight: '800', letterSpacing: '-0.04em' })}>
                      {h.v}
                    </dd>
                  </div>
                    </Fragment>
                  ))}
              </dl>
            </div>
            <div style={S({ flex: '1 1 380px', position: 'relative', minHeight: '520px', borderRadius: '36px', overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 0%, #1f2530, #0b0d11 70%)', color: '#f3f1ea', animation: 'ld-rise 800ms 120ms cubic-bezier(.22,1,.36,1) both' })}>
              <span aria-hidden="true" style={S({ position: 'absolute', inset: '0', background: 'radial-gradient(1px 1px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 72% 12%, #fff, transparent), radial-gradient(1.5px 1.5px at 86% 56%, #fff, transparent), radial-gradient(1px 1px at 24% 74%, #fff, transparent), radial-gradient(1px 1px at 48% 40%, rgba(255,255,255,.6), transparent), radial-gradient(1px 1px at 92% 86%, #fff, transparent)', opacity: '.8' })}>
              </span>
              <div aria-hidden="true" style={S({ position: 'absolute', left: '50%', top: '46%', width: '340px', height: '340px', margin: '-170px 0 0 -170px', borderRadius: '999px', border: '1px dashed rgba(243,241,234,.18)', animation: 'ld-orbit 40s linear infinite' })}>
                {(v.orbit ?? []).map((o: any, o_i: number) => (
                    <Fragment key={o_i}>
                  <span style={S({ position: 'absolute', left: o.x, top: o.y, transform: 'translate(-50%, -50%)' })}>
                    <span style={S({ display: 'block', animation: 'ld-counter 40s linear infinite' })}>
                      <P.Avatar crew={o.crew} gear={o.gear} size={52} ring="rgba(243,241,234,.3)" />
                    </span>
                  </span>
                    </Fragment>
                  ))}
              </div>
              <div style={S({ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%, -50%)' })}>
                <div style={S({ animation: 'ld-float 5s ease-in-out infinite' })}>
                  <P.Avatar crew={v.me} gear={v.myGear} size={150} ring="#f3f1ea" level={v.myLvl} />
                </div>
              </div>
              <div style={S({ position: 'absolute', left: '16px', right: '16px', bottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' })}>
                {(v.heroChips ?? []).map((c: any, c_i: number) => (
                    <Fragment key={c_i}>
                  <span style={S({ flex: '1 1 100px', display: 'flex', flexDirection: 'column', gap: '2px', padding: '12px 14px', borderRadius: '18px', background: 'rgba(243,241,234,.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(243,241,234,.12)', animation: `ld-pop 500ms ${c.delay} cubic-bezier(.34,1.56,.64,1) both` })}>
                    <span style={S({ fontSize: '12.5px', opacity: '.7', whiteSpace: 'nowrap' })}>
                      {c.k}
                    </span>
                    <span style={S({ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em', color: c.color, whiteSpace: 'nowrap' })}>
                      {c.v}
                    </span>
                  </span>
                    </Fragment>
                  ))}
              </div>
            </div>
          </section>
          <section data-reveal="1" aria-labelledby="loop-heading" style={S({ padding: 'clamp(24px, 4vw, 44px)', borderRadius: '32px', background: 'var(--panel)', border: '1px solid var(--rule)' })}>
            <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 32px' })}>
              <h2 id="loop-heading" style={S({ margin: '0', maxWidth: '18ch', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: '.98', fontWeight: '800', letterSpacing: '-0.05em', textWrap: 'balance' })}>
                Check in. See what moved. Earn the gear.
              </h2>
              <p style={S({ margin: '0', maxWidth: '42ch', fontSize: '15.5px', lineHeight: '1.55', color: 'var(--muted)' })}>
                Coins reward showing up and being honest. A bad day logged pays the same as a good one, so nobody has a reason to hide it.
              </p>
            </div>
            <ol style={S({ listStyle: 'none', margin: '32px 0 0', padding: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '14px' })}>
              {(v.steps ?? []).map((s: any, s_i: number) => (
                  <Fragment key={s_i}>
                <li>
                  <a href={s.href} onMouseEnter={s.enter} onMouseLeave={v.leave} style={S({ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', boxSizing: 'border-box', padding: '22px', borderRadius: '26px', background: s.bg, color: s.ink, textDecoration: 'none', transform: s.lift, transition: 'transform 320ms cubic-bezier(.34,1.56,.64,1), background-color 240ms ease' })}>
                    <span style={S({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                      <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '52px', height: '52px', borderRadius: '16px', background: s.tile, color: s.tileInk, transform: 'rotate(-5deg)' })}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d={s.icon}>
                          </path>
                        </svg>
                      </span>
                      <span style={S({ fontSize: '13px', fontWeight: '700', opacity: '.6' })}>
                        {s.n}
                      </span>
                    </span>
                    <span style={S({ fontSize: '22px', fontWeight: '750', letterSpacing: '-0.025em' })}>
                      {s.title}
                    </span>
                    <span style={S({ fontSize: '14.5px', lineHeight: '1.5', opacity: '.78' })}>
                      {s.body}
                    </span>
                    <span style={S({ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700' })}>
                      {s.cta}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={S({ transform: s.arrow, transition: 'transform 260ms cubic-bezier(.34,1.56,.64,1)' })}>
                        <path d="M5 12h14 M12 5l7 7-7 7">
                        </path>
                      </svg>
                    </span>
                  </a>
                </li>
                  </Fragment>
                ))}
            </ol>
          </section>
          <section data-reveal="1" aria-labelledby="locker-heading" style={S({ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'stretch' })}>
            <div style={S({ flex: '1 1 360px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', padding: 'clamp(24px, 4vw, 40px)', borderRadius: '32px', background: '#14181f', color: '#f3f1ea' })}>
              <p style={S({ margin: '0', fontSize: '14px', opacity: '.7' })}>
                Rewards
              </p>
              <h2 id="locker-heading" style={S({ margin: '0', fontSize: 'clamp(30px, 3.6vw, 46px)', lineHeight: '1', fontWeight: '800', letterSpacing: '-0.045em' })}>
                Streaks, crates and a locker full of gear.
              </h2>
              <ul style={S({ listStyle: 'none', margin: '6px 0 0', padding: '0', display: 'flex', flexDirection: 'column', gap: '10px' })}>
                {(v.perks ?? []).map((p: any, p_i: number) => (
                    <Fragment key={p_i}>
                  <li style={S({ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' })}>
                    <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '34px', height: '34px', borderRadius: '11px', background: 'rgba(246,196,69,.16)', color: '#f6c445', flexShrink: '0' })}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d={p.icon}>
                        </path>
                      </svg>
                    </span>
                    {p.t}
                  </li>
                    </Fragment>
                  ))}
              </ul>
              <a href="Rewards.dc.html" style={S({ alignSelf: 'flex-start', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '52px', padding: '0 22px', borderRadius: '16px', background: '#f6c445', color: '#3b2a00', textDecoration: 'none', fontSize: '15px', fontWeight: '800', boxShadow: '0 5px 0 #a8740a' })} className="landingview-hover-5 landingview-active-6">
                Open the locker
              </a>
            </div>
            <ul style={S({ flex: '1.3 1 460px', listStyle: 'none', margin: '0', padding: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' })}>
              {(v.showcase ?? []).map((it: any, it_i: number) => (
                  <Fragment key={it_i}>
                <li style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '18px 12px 14px', borderRadius: '24px', background: 'var(--panel)', border: '1px solid var(--rule)', transition: 'transform 300ms cubic-bezier(.34,1.56,.64,1)' })} className="landingview-hover-7">
                  <span style={S({ display: 'grid', placeItems: 'center', width: '100%', height: '96px', borderRadius: '18px', background: it.stage })}>
                    <P.Avatar crew={v.me} gear={it.gear} size={72} ring="var(--panel)" />
                  </span>
                  <span style={S({ fontSize: '14px', fontWeight: '700', textAlign: 'center' })}>
                    {it.name}
                  </span>
                  <span style={S({ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '750', color: 'var(--watch-ink)' })}>
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="#f6c445">
                      </circle>
                      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                      </circle>
                    </svg>
                    {it.price}
                  </span>
                </li>
                  </Fragment>
                ))}
            </ul>
          </section>
          <section data-reveal="1" aria-labelledby="faq-heading" style={S({ display: 'flex', flexWrap: 'wrap', gap: '24px 48px', padding: 'clamp(24px, 4vw, 44px)', borderRadius: '32px', background: 'var(--panel)', border: '1px solid var(--rule)' })}>
            <div style={S({ flex: '1 1 280px' })}>
              <h2 id="faq-heading" style={S({ margin: '0', fontSize: 'clamp(30px, 3.6vw, 46px)', lineHeight: '1', fontWeight: '800', letterSpacing: '-0.045em' })}>
                What it does, and what it won’t.
              </h2>
            </div>
            <div style={S({ flex: '2 1 480px' })}>
              {(v.faq ?? []).map((q: any, q_i: number) => (
                  <Fragment key={q_i}>
                <div style={S({ borderBottom: '1px solid var(--rule)' })}>
                  <button type="button" aria-expanded={q.open} onClick={q.toggle} style={S({ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 36px', alignItems: 'center', gap: '16px', width: '100%', minHeight: '68px', padding: '14px 0', background: 'transparent', border: '0', color: 'var(--ink)', textAlign: 'left', cursor: 'pointer', fontSize: '18px', fontWeight: '650', letterSpacing: '-0.01em' })} className="landingview-hover-8">
                    {q.q}
                    <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '36px', height: '36px', borderRadius: '999px', background: q.bg, color: q.ink, transform: q.rot, transition: 'transform 300ms cubic-bezier(.34,1.56,.64,1), background-color 200ms ease' })}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14">
                        </path>
                      </svg>
                    </span>
                  </button>
                  {(q.isOpen) ? (
                    <>
                    <p style={S({ margin: '0', padding: '0 52px 22px 0', maxWidth: '64ch', fontSize: '16px', lineHeight: '1.6', color: 'var(--ink-soft)', animation: 'ld-rise 320ms cubic-bezier(.22,1,.36,1) both' })}>
                      {q.a}
                    </p>
                    </>
                  ) : null}
                </div>
                  </Fragment>
                ))}
            </div>
          </section>
          <section data-reveal="1" aria-labelledby="cta-heading" style={S({ position: 'relative', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px', padding: 'clamp(28px, 5vw, 56px) clamp(28px, 5vw, 56px) 84px', borderRadius: '36px', background: '#14181f', color: '#f3f1ea' })}>
            <svg aria-hidden="true" viewBox="0 0 1200 80" preserveAspectRatio="none" style={S({ position: 'absolute', left: '0', right: '0', bottom: '14px', width: '100%', height: '44px', opacity: '.35' })}>
              <path d={v.ecg} pathLength="1000" fill="none" stroke="#f6c445" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={S({ strokeDasharray: '1000', strokeDashoffset: '1000', animation: 'ld-trace 2.4s cubic-bezier(.22,1,.36,1) forwards' })}>
              </path>
            </svg>
            <h2 id="cta-heading" style={S({ position: 'relative', margin: '0', maxWidth: '16ch', fontSize: 'clamp(36px, 5vw, 68px)', lineHeight: '.95', fontWeight: '800', letterSpacing: '-0.055em' })}>
              Your first 50 coins are a minute away.
            </h2>
            <a href="Onboarding.dc.html" style={S({ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '10px', minHeight: '60px', padding: '0 28px', borderRadius: '18px', background: '#f6c445', color: '#3b2a00', textDecoration: 'none', fontSize: '17px', fontWeight: '800', boxShadow: '0 6px 0 #a8740a', whiteSpace: 'nowrap' })} className="landingview-hover-9 landingview-active-10">
              Start setup
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14 M12 5l7 7-7 7">
                </path>
              </svg>
            </a>
          </section>
        </main>
        <P.SiteFooter dock={false} />
      </div>
    </>
  )
}
