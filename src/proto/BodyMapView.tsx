// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import { HazardsPanel } from './HazardsPanel'
import { PatternsPanel } from './PatternsPanel'
import * as D from './data'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BodyMapView({ v }: { v: any }) {
  return (
    <>
      <div data-chm-root="1" style={S({ '--ink': '#14181f', '--ink-soft': '#2b323d', '--paper': '#f3f1ea', '--paper-deep': '#e8e4d8', '--panel': '#fbfaf6', '--panel-2': '#f6f4ec', '--rule': '#d9d4c4', '--rule-strong': '#a49c88', '--muted': '#5b6270', '--accent': '#0b3d91', '--accent-wash': '#e4e9f3', '--ok': '#2f7d4f', '--ok-ink': '#1b5b33', '--watch': '#b7791f', '--watch-ink': '#7a4f00', '--act': '#b3261e', '--act-ink': '#8c1d18', '--nodata': '#8a8f98', '--nodata-ink': '#5b6270', '--on-accent': '#ffffff', '--star-o': '0', '--glow': 'none', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', fontVariantNumeric: 'tabular-nums' })}>
        <P.TopBar current="Body map" />
        <main id="main" tabIndex={-1} style={S({ flex: '1', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 64px', boxSizing: 'border-box', outline: 'none', display: 'flex', flexDirection: 'column', gap: '20px' })}>
          <header style={S({ background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: '28px', overflow: 'hidden', animation: 'chm-rise 420ms cubic-bezier(.22,1,.36,1) both' })}>
            <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px', padding: 'clamp(22px, 3vw, 32px)' })}>
              <div style={S({ display: 'flex', alignItems: 'center', gap: '20px', minWidth: '0' })}>
                <a href="Rewards.dc.html" aria-label="Open rewards and locker" style={S({ display: 'block', borderRadius: '999px' })}>
                  <P.Avatar crew={v.crew} gear={v.gear} size={96} ring={v.worstSwatch} level={v.lvl} />
                </a>
                <div style={S({ minWidth: '0' })}>
                  <p style={S({ margin: '0', fontSize: '14px', color: 'var(--muted)' })}>
                    {v.crewRole} · {v.dataLabel}
                  </p>
                  <h1 style={S({ margin: '4px 0 0', fontSize: 'clamp(34px, 4.4vw, 56px)', lineHeight: '1', fontWeight: '650', letterSpacing: '-0.04em' })}>
                    {v.crewName}
                  </h1>
                  <p style={S({ margin: '12px 0 0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' })}>
                    <span style={S({ whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: '999px', background: v.worstChipBg, color: v.worstInk, fontSize: '13.5px', fontWeight: '600' })}>
                      {v.worstLabel}
                    </span>
                    <span style={S({ fontSize: '14px', color: 'var(--muted)' })}>
                      {v.headerLine}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </header>
          {(v.hasFlag) ? (
            <>
            <section data-reveal="1" aria-label="Needs attention" style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px 24px', padding: '20px 24px', borderRadius: '24px', background: 'color-mix(in srgb, var(--watch) 14%, var(--panel))', border: '1px solid color-mix(in srgb, var(--watch) 45%, transparent)' })}>
              <div style={S({ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: '1 1 420px' })}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--watch-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={S({ flexShrink: '0', marginTop: '3px' })}>
                  <path d={v.alertIcon}>
                  </path>
                </svg>
                <div>
                  <h2 style={S({ margin: '0', fontSize: '20px', fontWeight: '600', letterSpacing: '-0.015em' })}>
                    {v.flagTitle}
                  </h2>
                  <p style={S({ margin: '6px 0 0', maxWidth: '68ch', fontSize: '14.5px', lineHeight: '1.55', color: 'var(--ink-soft)' })}>
                    Open the region for the readings behind it, or take the escalation ladder to decide who to tell.
                  </p>
                </div>
              </div>
              <div style={S({ display: 'flex', flexWrap: 'wrap', gap: '10px' })}>
                <button type="button" onClick={v.openFlag} style={S({ whiteSpace: 'nowrap', minHeight: '46px', padding: '0 18px', borderRadius: '999px', background: 'var(--ink)', color: 'var(--paper)', border: '0', fontSize: '14.5px', fontWeight: '600', cursor: 'pointer' })}>
                  {v.openFlagLabel}
                </button>
                <a href="Escalation.dc.html" style={S({ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', minHeight: '46px', padding: '0 18px', borderRadius: '999px', border: '1px solid var(--watch-ink)', color: 'var(--watch-ink)', textDecoration: 'none', fontSize: '14.5px', fontWeight: '600' })}>
                  Escalation ladder
                </a>
              </div>
            </section>
            </>
          ) : null}
          <PatternsPanel />
          <HazardsPanel />
          <section data-reveal="1" aria-labelledby="tour-heading" style={S({ position: 'relative' })}>
            <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 24px', margin: '18px 0 20px' })}>
              <div>
                <p style={S({ margin: '0', fontSize: '14px', color: 'var(--muted)' })}>
                  Body tour · scroll, or tap a region
                </p>
                <h2 id="tour-heading" style={S({ margin: '6px 0 0', fontSize: 'clamp(32px, 4vw, 50px)', lineHeight: '1', fontWeight: '700', letterSpacing: '-0.04em' })}>
                  Inside {v.crewShortCap}
                </h2>
              </div>
              <p style={S({ margin: '0', maxWidth: '46ch', fontSize: '15px', lineHeight: '1.55', color: 'var(--muted)', textWrap: 'pretty' })}>
                Each stop zooms into one region, marks every reading on the anatomy, and says in plain words what moved.
              </p>
            </div>
            <div style={S({ display: 'flex', flexDirection: v.tourDir, gap: '28px', alignItems: 'flex-start' })}>
              <div style={S({ position: 'sticky', top: v.stickyTop, zIndex: '4', flex: v.viewerFlex, width: '100%', height: v.viewerH, display: 'flex', flexDirection: 'column', borderRadius: '30px', overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 0%, #18202d, #0b0f16 70%)', color: '#f3f1ea', boxShadow: '0 30px 60px -36px rgba(10,14,22,.8)' })}>
                <div role="tablist" aria-label="Body regions" style={S({ display: 'flex', gap: '6px', padding: '12px', overflowX: 'auto', scrollbarWidth: 'none' })} data-noscroll="1">
                  {(v.tourTabs ?? []).map((t: any, t_i: number) => (
                      <Fragment key={t_i}>
                    <button type="button" role="tab" aria-selected={t.on} onClick={t.go} style={S({ display: 'inline-flex', alignItems: 'center', gap: '7px', flexShrink: '0', minHeight: '40px', padding: '0 14px', borderRadius: '999px', background: t.bg, color: t.color, border: `1px solid ${t.border}`, fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 220ms ease, color 220ms ease' })}>
                      <span aria-hidden="true" style={S({ width: '8px', height: '8px', borderRadius: '3px', background: t.sw })}>
                      </span>
                      {t.label}
                    </button>
                      </Fragment>
                    ))}
                </div>
                <div style={S({ position: 'relative', flex: '1', minHeight: '0' })}>
                  <div ref={v.areaRef} style={S({ position: 'absolute', inset: '0', display: 'grid', placeItems: 'center' })}>
                    <div className={D.systemsOnline().medbay ? 'medbay-scan' : undefined} style={S({ position: 'relative', width: v.boxWpx, height: v.boxHpx })}>
                      <svg viewBox="0 0 560 520" role="img" aria-label={v.viewerAria} style={S({ position: 'absolute', inset: '0', width: '100%', height: '100%' })}>
                        <defs>
                          <radialGradient id="bm-heat" cx="50%" cy="40%" r="60%">
                            <stop offset="0%" stopColor={v.bodyColor} stopOpacity="0.45">
                            </stop>
                            <stop offset="100%" stopColor={v.bodyColor} stopOpacity="0">
                            </stop>
                          </radialGradient>
                          <radialGradient id="xr-soft" cx="50%" cy="38%" r="65%">
                            <stop offset="0%" stopColor="rgba(120,160,220,.22)">
                            </stop>
                            <stop offset="70%" stopColor="rgba(80,110,170,.10)">
                            </stop>
                            <stop offset="100%" stopColor="rgba(40,60,110,.04)">
                            </stop>
                          </radialGradient>
                          <radialGradient id="xr-bone" cx="40%" cy="35%" r="70%">
                            <stop offset="0%" stopColor="rgba(255,255,255,.75)">
                            </stop>
                            <stop offset="60%" stopColor="rgba(220,235,255,.38)">
                            </stop>
                            <stop offset="100%" stopColor="rgba(180,205,240,.15)">
                            </stop>
                          </radialGradient>
                          <radialGradient id="xr-brain" cx="50%" cy="45%" r="60%">
                            <stop offset="0%" stopColor="rgba(255,190,210,.45)">
                            </stop>
                            <stop offset="100%" stopColor="rgba(200,120,150,.15)">
                            </stop>
                          </radialGradient>
                          <radialGradient id="xr-heart" cx="45%" cy="40%" r="65%">
                            <stop offset="0%" stopColor="rgba(255,140,140,.7)">
                            </stop>
                            <stop offset="100%" stopColor="rgba(170,40,60,.35)">
                            </stop>
                          </radialGradient>
                          <filter id="xr-glow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="1.4" result="b">
                            </feGaussianBlur>
                            <feMerge>
                              <feMergeNode in="b">
                              </feMergeNode>
                              <feMergeNode in="SourceGraphic">
                              </feMergeNode>
                            </feMerge>
                          </filter>
                          <filter id="xr-blur" x="-10%" y="-10%" width="120%" height="120%">
                            <feGaussianBlur stdDeviation="2.2">
                            </feGaussianBlur>
                          </filter>
                          <pattern id="bm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M20 0H0V20" fill="none" stroke="rgba(243,241,234,.05)" strokeWidth="1">
                            </path>
                          </pattern>
                        </defs>
                        <rect width="560" height="520" fill="url(#bm-grid)">
                        </rect>
                        <g style={S({ transform: v.cam, transformOrigin: '0 0', transition: 'transform 1100ms cubic-bezier(.65,0,.35,1)' })}>
                          <path d={v.outline} fill="url(#xr-soft)" stroke="rgba(190,215,255,.35)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" filter="url(#xr-blur)">
                          </path>
                          <path d={v.outline} fill="none" stroke="rgba(200,225,255,.22)" strokeWidth="1" vectorEffect="non-scaling-stroke">
                          </path>
                          <g style={S({ opacity: v.L.lungs, transition: 'opacity 700ms ease' })} filter="url(#xr-glow)">
                            <path d="M96 108 C86 104 72 112 68 132 C64 152 66 176 72 190 C80 196 92 192 96 184 Z" fill="rgba(150,190,255,.10)" stroke="rgba(170,205,255,.35)" strokeWidth="1" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M104 108 C114 104 128 112 132 132 C136 152 134 176 128 190 C120 196 108 192 104 184 Z" fill="rgba(150,190,255,.10)" stroke="rgba(170,205,255,.35)" strokeWidth="1" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M100 96 V112 M100 112 C94 118 88 122 82 130 M100 112 C106 118 112 122 118 130 M88 124 L80 140 M112 124 L120 140" fill="none" stroke="rgba(180,210,255,.4)" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                          </g>
                          <g style={S({ opacity: v.L.skeleton, transition: 'opacity 700ms ease' })} filter="url(#xr-glow)">
                            <path d="M100 17 C115 17 125 29 125 44 C125 54 121 62 116 67 L114 74 C110 78 90 78 86 74 L84 67 C79 62 75 54 75 44 C75 29 85 17 100 17 Z" fill="url(#xr-bone)" stroke="rgba(235,244,255,.85)" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M80 44 C83 39 91 39 94 44 C91 49 83 49 80 44 Z M106 44 C109 39 117 39 120 44 C117 49 109 49 106 44 Z M97 52 L100 47 L103 52 Z" fill="rgba(8,12,20,.85)" stroke="rgba(220,235,255,.5)" strokeWidth=".8" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M88 66 C94 70 106 70 112 66 M89 70 H111" fill="none" stroke="rgba(235,244,255,.7)" strokeWidth="1" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d={v.teeth} fill="none" stroke="rgba(245,250,255,.85)" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d={v.vertebrae} fill="rgba(235,244,255,.55)" stroke="rgba(235,244,255,.8)" strokeWidth=".6" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d={v.ribs} fill="none" stroke="rgba(235,244,255,.62)" strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M100 100 V160" stroke="rgba(235,244,255,.7)" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M98 101 C88 97 76 99 64 104 M102 101 C112 97 124 99 136 104" fill="none" stroke="rgba(235,244,255,.8)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M80 234 C78 222 90 216 100 226 C110 216 122 222 120 234 C119 246 110 256 100 256 C90 256 81 246 80 234 Z" fill="url(#xr-bone)" stroke="rgba(235,244,255,.8)" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
                            </path>
                            <ellipse cx="91" cy="242" rx="5" ry="6" fill="rgba(8,12,20,.8)">
                            </ellipse>
                            <ellipse cx="109" cy="242" rx="5" ry="6" fill="rgba(8,12,20,.8)">
                            </ellipse>
                            <path d="M65 106 L52 176 M51 178 L46 250 M55 178 L50 250 M135 106 L148 176 M149 178 L154 250 M145 178 L150 250 M89 256 L84 338 M84 344 L82 426 M88 344 L86 426 M111 256 L116 338 M116 344 L118 426 M112 344 L114 426" fill="none" stroke="rgba(235,244,255,.72)" strokeWidth="3.4" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M65 106 L52 176 M135 106 L148 176 M89 256 L84 338 M111 256 L116 338" fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                            <circle cx="65" cy="106" r="5" fill="url(#xr-bone)">
                            </circle>
                            <circle cx="135" cy="106" r="5" fill="url(#xr-bone)">
                            </circle>
                            <circle cx="53" cy="177" r="3.2" fill="url(#xr-bone)">
                            </circle>
                            <circle cx="147" cy="177" r="3.2" fill="url(#xr-bone)">
                            </circle>
                            <circle cx="86" cy="341" r="4" fill="url(#xr-bone)">
                            </circle>
                            <circle cx="114" cy="341" r="4" fill="url(#xr-bone)">
                            </circle>
                          </g>
                          <g style={S({ opacity: v.L.body, transition: 'opacity 700ms ease' })}>
                            <ellipse cx="100" cy="160" rx="62" ry="120" fill="url(#bm-heat)">
                            </ellipse>
                            <path d={v.outline} fill="none" stroke={v.bodyColor} strokeWidth="2.5" strokeOpacity="0.85" vectorEffect="non-scaling-stroke" filter="url(#xr-glow)">
                            </path>
                            <circle cx="112" cy="190" r="10" fill="none" stroke="rgba(243,241,234,.5)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke">
                            </circle>
                            <circle cx="112" cy="190" r="20" fill="none" stroke="rgba(243,241,234,.3)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke">
                            </circle>
                            <circle cx="112" cy="190" r="30" fill="none" stroke="rgba(243,241,234,.16)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke">
                            </circle>
                          </g>
                          <g style={S({ opacity: v.L.head, transition: 'opacity 700ms ease' })} filter="url(#xr-glow)">
                            <path d="M78 37 C76 24 87 18 100 18 C113 18 124 24 122 37 C121 41 116 42 111 41 C106 43 94 43 89 41 C84 42 79 41 78 37 Z" fill="url(#xr-brain)" stroke="rgba(255,190,210,.7)" strokeWidth="1" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M100 19 C99 25 101 32 100 42 M81 33 C84 30 86 34 90 31 C93 28 96 31 97 28 M83 26 C86 22 90 26 94 22 M81 38 C84 36 88 39 92 36 C94 35 96 37 97 35 M119 33 C116 30 114 34 110 31 C107 28 104 31 103 28 M117 26 C114 22 110 26 106 22 M119 38 C116 36 112 39 108 36 C106 35 104 37 103 35" fill="none" stroke="rgba(255,220,230,.55)" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M96 42 C96 50 97 58 98 64 L102 64 C103 58 104 50 104 42" fill="rgba(255,180,200,.25)" stroke="rgba(255,200,215,.6)" strokeWidth=".8" vectorEffect="non-scaling-stroke">
                            </path>
                            <ellipse cx="100" cy="38" rx="3" ry="2" fill={v.headFill} fillOpacity=".9">
                            </ellipse>
                          </g>
                          <g style={S({ opacity: v.L.eyes, transition: 'opacity 700ms ease' })} strokeLinecap="round" filter="url(#xr-glow)">
                            <ellipse cx="87" cy="44" rx="7" ry="4.4" fill="rgba(235,244,255,.9)">
                            </ellipse>
                            <ellipse cx="113" cy="44" rx="7" ry="4.4" fill="rgba(235,244,255,.9)">
                            </ellipse>
                            <circle cx="87" cy="44" r="3" fill={v.eyeL}>
                            </circle>
                            <circle cx="113" cy="44" r="3" fill={v.eyeR}>
                            </circle>
                            <circle cx="87" cy="44" r="1.3" fill="#05070c">
                            </circle>
                            <circle cx="113" cy="44" r="1.3" fill="#05070c">
                            </circle>
                            <circle cx="88" cy="43" r=".6" fill="#ffffff">
                            </circle>
                            <circle cx="114" cy="43" r=".6" fill="#ffffff">
                            </circle>
                            <path d="M93 46 C96 49 98 51 100 53 M107 46 C104 49 102 51 100 53 M100 53 L100 60" fill="none" stroke="rgba(255,230,160,.75)" strokeWidth="1.3" vectorEffect="non-scaling-stroke">
                            </path>
                          </g>
                          <g style={S({ opacity: v.L.heart, transition: 'opacity 700ms ease' })} filter="url(#xr-glow)">
                            <g style={S({ transformOrigin: '105px 142px', animation: `bm-beat ${v.beat} ease-in-out infinite` })}>
                              <path d="M104 160 C90 151 88 138 92 131 C95 126 101 126 104 130 C107 126 114 125 118 129 C123 135 121 149 104 160 Z" fill="url(#xr-heart)" stroke="rgba(255,170,170,.85)" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
                              </path>
                              <path d="M106 129 C106 121 108 116 113 115 C118 114 121 118 120 123 M113 115 L112 111 M117 115 L118 111" fill="none" stroke="rgba(255,120,120,.9)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                              </path>
                              <path d="M98 129 V118 M101 129 C100 124 96 122 93 123" fill="none" stroke="rgba(130,170,255,.9)" strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                              </path>
                              <path d="M105 131 C104 140 105 150 104 158 M93 140 C99 143 110 143 119 138" fill="none" stroke="rgba(255,220,220,.55)" strokeWidth="1" vectorEffect="non-scaling-stroke">
                              </path>
                            </g>
                          </g>
                          <g style={S({ opacity: v.L.gut, transition: 'opacity 700ms ease' })} filter="url(#xr-glow)">
                            <path d="M76 176 C84 168 100 169 102 178 C98 188 85 191 77 187 Z" fill="rgba(200,120,110,.35)" stroke="rgba(240,170,160,.7)" strokeWidth="1" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M103 177 C113 171 124 178 121 190 C118 201 106 204 100 198 C97 194 99 184 103 177 Z" fill={v.gutFill} fillOpacity="0.35" stroke="rgba(255,220,190,.8)" strokeWidth="1" vectorEffect="non-scaling-stroke">
                            </path>
                            <ellipse cx="80" cy="198" rx="4" ry="7" fill="rgba(200,150,160,.35)" stroke="rgba(240,190,200,.6)" strokeWidth=".8" vectorEffect="non-scaling-stroke">
                            </ellipse>
                            <ellipse cx="120" cy="198" rx="4" ry="7" fill="rgba(200,150,160,.35)" stroke="rgba(240,190,200,.6)" strokeWidth=".8" vectorEffect="non-scaling-stroke">
                            </ellipse>
                            <path d="M84 230 V203 C84 198 87 196 92 196 H109 C114 196 117 198 117 203 V230" fill="none" stroke="rgba(255,210,170,.55)" strokeWidth="4.5" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                            <path d="M89 205 C95 201 105 201 111 205 C115 208 109 212 100 211 C91 210 85 213 89 217 C93 221 107 221 111 218 C115 215 116 223 110 225 C104 228 94 228 90 225" fill="none" stroke="rgba(255,225,200,.75)" strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                            </path>
                            <ellipse cx="100" cy="242" rx="6" ry="4.5" fill="rgba(200,190,140,.3)" stroke="rgba(240,230,180,.55)" strokeWidth=".8" vectorEffect="non-scaling-stroke">
                            </ellipse>
                          </g>
                          {(v.marks ?? []).map((m: any, m_i: number) => (
                              <Fragment key={m_i}>
                            <g style={S({ opacity: m.op, transition: 'opacity 600ms ease' })} pointerEvents="none">
                              {(m.ping) ? (
                                <>
                                <circle cx={m.x} cy={m.y} r={m.r2} fill="none" stroke={m.c} strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={S({ transformBox: 'fill-box', transformOrigin: 'center', animation: 'bm-ping 1.8s cubic-bezier(.22,1,.36,1) infinite' })}>
                                </circle>
                                </>
                              ) : null}
                              <circle cx={m.x} cy={m.y} r={m.r} fill={m.fill} stroke={m.c} strokeWidth="2" strokeDasharray={m.dash} vectorEffect="non-scaling-stroke">
                              </circle>
                            </g>
                              </Fragment>
                            ))}
                        </g>
                        {(v.labels ?? []).map((l: any, l_i: number) => (
                            <Fragment key={l_i}>
                          <g key={l.key} pointerEvents="none" style={S({ animation: `bm-fade 500ms ${l.delay} cubic-bezier(.22,1,.36,1) both` })}>
                            <path d={l.lead} fill="none" stroke={l.c} strokeWidth="1.2" strokeOpacity="0.8">
                            </path>
                          </g>
                            </Fragment>
                          ))}
                      </svg>
                      {(v.labels ?? []).map((l: any, l_i: number) => (
                          <Fragment key={l_i}>
                        <div key={l.key} style={S({ position: 'absolute', left: l.left, top: l.top, transform: l.tf, maxWidth: l.maxW, padding: l.pad, borderRadius: '12px', background: 'rgba(11,15,22,.88)', border: `${l.bw} solid ${l.c}`, color: '#f3f1ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none', animation: `bm-fade 500ms ${l.delay} cubic-bezier(.22,1,.36,1) both`, boxShadow: '0 6px 18px -8px rgba(0,0,0,.6)' })}>
                          <div style={S({ fontSize: l.fs1, fontWeight: '650', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis' })}>
                            {l.name}
                          </div>
                          <div style={S({ fontSize: l.fs2, fontWeight: '600', lineHeight: '1.3', color: l.c, overflow: 'hidden', textOverflow: 'ellipsis' })}>
                            {l.val}
                          </div>
                        </div>
                          </Fragment>
                        ))}
                    </div>
                  </div>
                </div>
                <div style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 18px', borderTop: '1px solid rgba(243,241,234,.08)', fontSize: '12.5px', color: 'rgba(243,241,234,.7)' })}>
                  <span style={S({ whiteSpace: 'nowrap' })}>
                    {v.zoomText}
                  </span>
                  <span style={S({ display: 'flex', gap: '12px', whiteSpace: 'nowrap' })}>
                    <span style={S({ color: '#2fd39b' })}>
                      Normal
                    </span>
                    <span style={S({ color: '#f2b134' })}>
                      Watch
                    </span>
                    <span style={S({ color: '#ff5f56' })}>
                      Act
                    </span>
                    <span style={S({ color: '#93a1b8' })}>
                      No data
                    </span>
                  </span>
                </div>
              </div>
              <div style={S({ flex: '1 1 0', minWidth: '0', width: '100%', display: 'flex', flexDirection: 'column' })}>
                {(v.chapters ?? []).map((ch: any, ch_i: number) => (
                    <Fragment key={ch_i}>
                  <article ref={ch.ref} aria-labelledby={ch.hid} style={S({ minHeight: v.chapterH, padding: '28px 4px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '18px', opacity: ch.op, transform: ch.tf, transition: 'opacity 600ms ease, transform 700ms cubic-bezier(.22,1,.36,1)' })}>
                    <div style={S({ display: 'flex', alignItems: 'center', gap: '12px' })}>
                      <span style={S({ fontSize: '14px', fontWeight: '600', color: 'var(--muted)', whiteSpace: 'nowrap' })}>
                        {ch.n} / 06
                      </span>
                      <span style={S({ whiteSpace: 'nowrap', padding: '4px 12px', borderRadius: '999px', background: ch.chipBg, color: ch.ink, fontSize: '13px', fontWeight: '650' })}>
                        {ch.word}
                      </span>
                    </div>
                    <h3 id={ch.hid} style={S({ margin: '0', fontSize: 'clamp(36px, 4.6vw, 60px)', lineHeight: '.95', fontWeight: '750', letterSpacing: '-0.045em' })}>
                      {ch.label}
                    </h3>
                    <p style={S({ margin: '0', maxWidth: '40ch', fontSize: 'clamp(18px, 1.7vw, 21px)', lineHeight: '1.45', fontWeight: '500', letterSpacing: '-0.01em', textWrap: 'pretty' })}>
                      {ch.story}
                    </p>
                    {ch.fn ? (
                      <div style={S({ maxWidth: '56ch', padding: '12px 14px', borderRadius: '16px', background: 'var(--panel-2)', border: '1px solid var(--rule)', display: 'grid', gap: '6px' })}>
                        <p style={S({ margin: '0', fontSize: '12px', fontWeight: '750', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' })}>What it does</p>
                        <p style={S({ margin: '0', fontSize: '14.5px', lineHeight: '1.5' })}>{ch.fn}</p>
                        {ch.fnSpace ? <p style={S({ margin: '0', fontSize: '14px', lineHeight: '1.5', color: 'var(--ink-soft)' })}><strong>In space: </strong>{ch.fnSpace}</p> : null}
                      </div>
                    ) : null}
                    <p style={S({ margin: '0', maxWidth: '56ch', fontSize: '14.5px', lineHeight: '1.55', color: 'var(--muted)' })}>
                      {ch.how}
                    </p>
                    <ul style={S({ listStyle: 'none', margin: '4px 0 0', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' })}>
                      {(ch.rows ?? []).map((r: any, r_i: number) => (
                          <Fragment key={r_i}>
                        <li onMouseEnter={r.enter} onMouseLeave={v.hoverOff} style={S({ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '4px 14px', alignItems: 'center', padding: '14px 16px', borderRadius: '18px', background: 'var(--panel)', border: `1px solid ${r.border}`, transition: 'border-color 160ms ease, transform 200ms cubic-bezier(.34,1.56,.64,1)', transform: r.tf })}>
                          <span style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 10px', minWidth: '0' })}>
                            <span style={S({ fontSize: '15.5px', fontWeight: '650' })}>
                              {r.label}
                            </span>
                            <span style={S({ padding: '2px 8px', borderRadius: '999px', background: 'var(--paper-deep)', fontSize: '12px', fontWeight: '500', color: 'var(--ink-soft)', whiteSpace: 'nowrap' })}>
                              {r.method}
                            </span>
                          </span>
                          <span style={S({ display: 'flex', alignItems: 'baseline', gap: '5px', whiteSpace: 'nowrap' })}>
                            <span style={S({ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.03em', color: r.valColor })}>
                              {r.value}
                            </span>
                            <span style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                              {r.unit}
                            </span>
                          </span>
                          <span style={S({ fontSize: '13.5px', fontWeight: '600', color: r.ink })}>
                            {r.note}
                          </span>
                          <svg width="96" height="26" viewBox="0 0 110 32" aria-hidden="true" style={S({ overflow: 'visible', justifySelf: 'end' })}>
                            <path d={r.spark} fill="none" stroke={r.sparkColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                            </path>
                          </svg>
                        </li>
                          </Fragment>
                        ))}
                    </ul>
                    <div style={S({ display: 'flex', flexWrap: 'wrap', gap: '6px' })}>
                      {(ch.risks ?? []).map((k: any, k_i: number) => (
                          <Fragment key={k_i}>
                        <span style={S({ lineHeight: '1.35', padding: '5px 11px', borderRadius: '12px', border: '1px solid var(--rule)', fontSize: '12.5px', color: 'var(--muted)' })}>
                          NASA HRP · {k}
                        </span>
                          </Fragment>
                        ))}
                    </div>
                    <div style={S({ display: 'flex', flexWrap: 'wrap', gap: '10px' })}>
                      <button type="button" onClick={ch.open} style={S({ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '48px', padding: '0 20px', borderRadius: '14px', background: 'var(--ink)', color: 'var(--paper)', border: '0', boxShadow: '0 4px 0 #000', fontSize: '14.5px', fontWeight: '650', cursor: 'pointer', whiteSpace: 'nowrap' })} className="bodymapview-active-4">
                        See the charts
                      </button>
                      <a href={ch.href2} style={S({ display: 'inline-flex', alignItems: 'center', minHeight: '48px', padding: '0 18px', borderRadius: '14px', border: '2px solid var(--rule-strong)', color: 'var(--ink)', textDecoration: 'none', fontSize: '14.5px', fontWeight: '650', whiteSpace: 'nowrap' })} className="bodymapview-hover-5">
                        {ch.cta2}
                      </a>
                    </div>
                  </article>
                    </Fragment>
                  ))}
              </div>
            </div>
          </section>
          <section data-reveal="1" aria-labelledby="region-heading" style={S({ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '18px' })}>
            <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' })}>
              <div>
                <p style={S({ margin: '0', fontSize: '14px', color: 'var(--muted)' })}>
                  {v.regionCount}
                </p>
                <h2 id="region-heading" style={S({ margin: '4px 0 0', fontSize: 'clamp(30px, 3.4vw, 42px)', fontWeight: '650', letterSpacing: '-0.035em' })}>
                  {v.regionLabel}
                </h2>
              </div>
              <div style={S({ display: 'flex', flexWrap: 'wrap', gap: '8px' })}>
                <div role="group" aria-label="Chart range" style={S({ display: 'flex', gap: '2px', padding: '4px', background: 'var(--paper-deep)', borderRadius: '999px' })}>
                  {(v.ranges ?? []).map((r: any, r_i: number) => (
                      <Fragment key={r_i}>
                    <button type="button" aria-pressed={r.on} onClick={r.pick} style={S({ minHeight: '40px', padding: '0 14px', borderRadius: '999px', background: r.bg, color: r.color, border: '0', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' })}>
                      {r.label}
                    </button>
                      </Fragment>
                    ))}
                </div>
                <div role="tablist" aria-label="Regions" style={S({ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px', background: 'var(--paper-deep)', borderRadius: '999px' })}>
                  {(v.tabs ?? []).map((t: any, t_i: number) => (
                      <Fragment key={t_i}>
                    <button type="button" role="tab" aria-selected={t.on} onClick={t.pick} style={S({ minHeight: '40px', padding: '0 14px', borderRadius: '999px', background: t.bg, color: t.color, border: '0', boxShadow: t.shadow, fontSize: '13.5px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 140ms ease' })}>
                      {t.label}
                    </button>
                      </Fragment>
                    ))}
                </div>
              </div>
            </div>
            <div style={S({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))', gap: '20px', alignItems: 'start' })}>
              {(v.cards ?? []).map((k: any, k_i: number) => (
                  <Fragment key={k_i}>
                <article aria-label={k.label} style={S({ background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: '24px', overflow: 'hidden', animation: 'chm-rise 380ms cubic-bezier(.22,1,.36,1) both' })}>
                  <header style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '18px 22px 0' })}>
                    <h3 style={S({ margin: '0', fontSize: '16px', fontWeight: '600' })}>
                      {k.label}
                    </h3>
                    <span style={S({ padding: '4px 11px', borderRadius: '999px', background: k.chipBg, color: k.ink, fontSize: '12.5px', fontWeight: '600', whiteSpace: 'nowrap' })}>
                      {k.statusLabel}
                    </span>
                  </header>
                  <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 24px', padding: '14px 22px 20px' })}>
                    <div>
                      <p style={S({ margin: '0', display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' })}>
                        <span style={S({ fontSize: 'clamp(48px, 6vw, 64px)', fontWeight: '650', lineHeight: '.9', letterSpacing: '-0.045em', color: k.valueColor })}>
                          {k.value}
                        </span>
                        <span style={S({ fontSize: '16px', color: 'var(--muted)' })}>
                          {k.unit}
                        </span>
                        <span style={S({ fontSize: '15px', fontWeight: '600', color: k.ink })}>
                          {k.sigma}
                        </span>
                      </p>
                      {(k.empty) ? (
                        <>
                        <p style={S({ margin: '10px 0 0', fontSize: '14px', color: 'var(--muted)' })}>
                          No reading has passed the quality check yet.
                        </p>
                        </>
                      ) : null}
                    </div>
                    <p style={S({ margin: '0', textAlign: 'right', fontSize: '13.5px', lineHeight: '1.5', color: 'var(--muted)' })}>
                      {k.baseline}
                      <br />
                      {k.baselineN}
                    </p>
                  </div>
                  {(k.has) ? (
                    <>
                    <dl style={S({ margin: '0 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)', borderRadius: '14px', overflow: 'hidden' })}>
                      {(k.meta ?? []).map((m: any, m_i: number) => (
                          <Fragment key={m_i}>
                        <div style={S({ padding: '10px 14px', background: 'var(--panel-2)' })}>
                          <dt style={S({ fontSize: '12px', color: 'var(--muted)' })}>
                            {m.k}
                          </dt>
                          <dd style={S({ margin: '3px 0 0', fontSize: '14px', fontWeight: '500' })}>
                            {m.v}
                          </dd>
                        </div>
                          </Fragment>
                        ))}
                    </dl>
                    </>
                  ) : null}
                  {(k.failedNote) ? (
                    <>
                    <p style={S({ margin: '12px 22px 0', fontSize: '13px', lineHeight: '1.5', color: 'var(--muted)' })}>
                      {k.failedNote}
                    </p>
                    </>
                  ) : null}
                  <div style={S({ padding: '18px 22px 6px' })}>
                    {(k.chart) ? (
                      <>
                      <p style={S({ margin: '0 0 12px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px' })}>
                        <span style={S({ fontSize: '17px', fontWeight: '650', letterSpacing: '-0.01em', color: k.sumInk })}>
                          {k.summary}
                        </span>
                        <span style={S({ fontSize: '13.5px', color: 'var(--muted)' })}>
                          {k.summary2}
                        </span>
                      </p>
                      <div style={S({ position: 'relative' })} onMouseLeave={k.leave}>
                        <svg viewBox="0 0 640 220" width="100%" role="img" aria-label={k.chartAria} style={S({ display: 'block', overflow: 'visible', fontFamily: 'ui-sans-serif, system-ui, sans-serif' })}>
                          {(k.showBand) ? (
                            <>
                            <rect x="44" width="586" y={k.zTop.y} height={k.zTop.h} fill="var(--watch)" fillOpacity="0.09">
                            </rect>
                            <rect x="44" width="586" y={k.zBot.y} height={k.zBot.h} fill="var(--watch)" fillOpacity="0.09">
                            </rect>
                            <rect x="44" width="586" y={k.chart.band.y} height={k.chart.band.h} fill="var(--ok)" fillOpacity="0.14">
                            </rect>
                            <text x="54" y={k.bandLabelY} fill="var(--ok-ink)" style={S({ fontSize: '12.5px', fontWeight: '600' })}>
                              Your normal
                            </text>
                            </>
                          ) : null}
                          <line x1="44" x2="630" y1="196" y2="196" stroke="var(--rule)">
                          </line>
                          <text x="630" y="215" textAnchor="end" fill="var(--ink)" style={S({ fontSize: '12px', fontWeight: '600' })}>
                            Today
                          </text>
                          <path d={k.chart.d} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
                          </path>
                          {(k.dots ?? []).map((p: any, p_i: number) => (
                              <Fragment key={p_i}>
                            <circle cx={p.x} cy={p.y} r="4" fill={p.c} stroke="var(--panel)" strokeWidth="2">
                            </circle>
                              </Fragment>
                            ))}
                          {(k.hoverOn) ? (
                            <>
                            <line x1={k.hx} x2={k.hx} y1="12" y2="196" stroke="var(--rule-strong)" strokeDasharray="2 3">
                            </line>
                            <circle cx={k.hx} cy={k.hy} r="6" fill="var(--ink)" stroke="var(--panel)" strokeWidth="3">
                            </circle>
                            </>
                          ) : null}
                          <circle cx={k.chart.lastX} cy={k.chart.lastY} r="12" fill={k.swatch} fillOpacity="0.18">
                          </circle>
                          <circle cx={k.chart.lastX} cy={k.chart.lastY} r="6.5" fill={k.swatch} stroke="var(--panel)" strokeWidth="3">
                          </circle>
                          {(k.hits ?? []).map((h: any, h_i: number) => (
                              <Fragment key={h_i}>
                            <rect x={h.x} y="0" width={h.w} height="200" fill="transparent" onMouseEnter={h.enter}>
                            </rect>
                              </Fragment>
                            ))}
                        </svg>
                        {(k.chart.ticks ?? []).map((t: any, t_i: number) => (
                            <Fragment key={t_i}>
                          <span aria-hidden="true" style={S({ position: 'absolute', right: 'calc(100% - 5.6%)', top: t.top, transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' })}>
                            {t.label}
                          </span>
                            </Fragment>
                          ))}
                        <span aria-hidden="true" style={S({ position: 'absolute', left: '6.9%', top: '97.7%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' })}>
                          {k.xStart}
                        </span>
                        {(k.hoverOn) ? (
                          <>
                          <div style={S({ position: 'absolute', top: '-6px', left: k.tipLeft, transform: 'translateX(-50%)', pointerEvents: 'none', padding: '7px 12px', borderRadius: '12px', background: '#14181f', color: '#f3f1ea', whiteSpace: 'nowrap' })}>
                            <div style={S({ fontSize: '12px', opacity: '.72' })}>
                              {k.tipDay}
                            </div>
                            <div style={S({ fontSize: '16px', fontWeight: '600' })}>
                              {k.tipVal}
                            </div>
                            <div style={S({ fontSize: '12px', opacity: '.8' })}>
                              {k.tipZone}
                            </div>
                          </div>
                          </>
                        ) : null}
                      </div>
                      <p style={S({ margin: '8px 0 0', display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: '13px', color: 'var(--muted)' })}>
                        <span>
                          {k.unitCaption}
                        </span>
                        {(k.showBand) ? (
                          <>
                          <span>
                            Green band: your normal (± 1 SD)
                          </span>
                          <span>
                            Amber: watch (1 to 2 SD)
                          </span>
                          <span>
                            Outside both: act
                          </span>
                          </>
                        ) : null}
                        {(k.gapsText) ? (
                          <>
                          <span>
                            {k.gapsText}
                          </span>
                          </>
                        ) : null}
                      </p>
                      </>
                    ) : null}
                    {(k.noChart) ? (
                      <>
                      <div style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', padding: '28px 16px', borderRadius: '18px', background: 'var(--panel-2)' })}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d={v.chartIcon}>
                          </path>
                        </svg>
                        <span style={S({ fontSize: '15px', fontWeight: '600' })}>
                          Not enough readings to chart yet
                        </span>
                        <span style={S({ maxWidth: '36ch', fontSize: '13.5px', lineHeight: '1.5', color: 'var(--muted)' })}>
                          A trend appears after two readings pass the quality check. A baseline needs five.
                        </span>
                      </div>
                      </>
                    ) : null}
                  </div>
                  <div style={S({ margin: '12px 22px 0', borderTop: '1px solid var(--rule)' })}>
                    {(k.faq ?? []).map((q: any, q_i: number) => (
                        <Fragment key={q_i}>
                      <div style={S({ borderBottom: '1px solid var(--rule)' })}>
                        <button type="button" aria-expanded={q.open} onClick={q.toggle} style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', width: '100%', minHeight: '48px', padding: '0', background: 'transparent', border: '0', color: 'var(--ink)', fontSize: '14.5px', fontWeight: '500', textAlign: 'left', cursor: 'pointer' })} className="bodymapview-hover-6">
                          {q.q}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={S({ flexShrink: '0', color: 'var(--muted)', transform: q.rot, transition: 'transform 220ms cubic-bezier(.22,1,.36,1)' })}>
                            <path d="M5 12h14 M12 5v14">
                            </path>
                          </svg>
                        </button>
                        {(q.isOpen) ? (
                          <>
                          <p style={S({ margin: '0', padding: '0 0 14px', fontSize: '14px', lineHeight: '1.6', color: 'var(--muted)', fontStyle: 'italic' })}>
                            {q.a}
                          </p>
                          </>
                        ) : null}
                      </div>
                        </Fragment>
                      ))}
                  </div>
                  <div style={S({ margin: '16px 22px', padding: '14px 16px', borderRadius: '16px', background: 'var(--accent-wash)' })}>
                    <p style={S({ margin: '0', fontSize: '13px', fontWeight: '600', color: 'var(--accent)' })}>
                      Recommended action
                    </p>
                    <p style={S({ margin: '4px 0 0', fontSize: '14px', fontStyle: 'italic', color: 'var(--muted)' })}>
                      {k.action}
                    </p>
                  </div>
                  <p style={S({ margin: '0', padding: '14px 22px', borderTop: '1px solid var(--rule)', fontSize: '12.5px', lineHeight: '1.5', color: 'var(--muted)' })}>
                    NASA standard measures: {k.measure} · HRP risk: {k.risk}
                  </p>
                </article>
                  </Fragment>
                ))}
            </div>
          </section>
        </main>
        <P.SiteFooter dock={true} />
        <P.CrewDock current="Body map" />
      </div>
    </>
  )
}
