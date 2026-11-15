// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AvatarView({ v }: { v: any }) {
  return (
    <>
      <span style={S({ position: 'relative', display: 'inline-block', flexShrink: '0', width: v.px, height: v.px })}>
        <span aria-hidden="true" style={S({ position: 'absolute', inset: '0', borderRadius: '9999px', background: v.frameBg, animation: v.frameAnim })}>
        </span>
        <span style={S({ position: 'absolute', inset: v.inset, display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: '9999px', border: `${v.ringW} solid ${v.ring}`, background: 'var(--panel-2)', boxSizing: 'border-box' })}>
          <svg viewBox="0 0 48 48" width="100%" height="100%" role="img" aria-label={v.alt}>
            <defs>
              <linearGradient id={v.gid} x1="0" y1="0" x2="0.55" y2="1">
                <stop offset="0%" stopColor={v.v1}>
                </stop>
                <stop offset="100%" stopColor={v.v2}>
                </stop>
              </linearGradient>
              <clipPath id={v.cid}>
                <circle cx="24" cy="24" r="24">
                </circle>
              </clipPath>
            </defs>
            <g clipPath={v.clipUrl} stroke="#14181f" strokeWidth="1.6" fill="none" strokeLinejoin="round">
              <path d="M3 52 C3 39.5 12.5 33 24 33 C35.5 33 45 39.5 45 52 Z" fill={v.suit}>
              </path>
              {(v.stripes ?? []).map((s: any, s_i: number) => (
                  <Fragment key={s_i}>
                <path d={s} strokeWidth="1.4" opacity="0.6">
                </path>
                  </Fragment>
                ))}
              <g transform={v.tilt}>
                {(v.antenna) ? (
                  <>
                  <path d="M24 5.5 L24 1.5" strokeWidth="1.5">
                  </path>
                  <circle cx="24" cy="1" r="1.8" fill={v.v1} stroke="none">
                  </circle>
                  </>
                ) : null}
                <circle cx="24" cy="20" r="14.5" fill="#f6f4ec">
                </circle>
                {(v.vs0) ? (
                  <>
                  <rect x="12.5" y="14.5" width="23" height="11.5" rx="5.75" fill={v.visorUrl}>
                  </rect>
                  </>
                ) : null}
                {(v.vs1) ? (
                  <>
                  <path d="M11.5 20.5 A12.5 12.5 0 0 1 36.5 20.5 L36.5 23 A12.5 9.5 0 0 1 11.5 23 Z" fill={v.visorUrl}>
                  </path>
                  </>
                ) : null}
                {(v.vs2) ? (
                  <>
                  <ellipse cx="24" cy="20.5" rx="11.5" ry="7.5" fill={v.visorUrl}>
                  </ellipse>
                  </>
                ) : null}
                <path d="M16.5 17.5 L21 17.5" strokeWidth="1.6" opacity="0.85" stroke="#ffffff">
                </path>
              </g>
              {(v.halo) ? (
                <>
                <ellipse cx="24" cy="5.5" rx="10" ry="2.6" stroke="#c9962b" strokeWidth="1.8">
                </ellipse>
                </>
              ) : null}
              {(v.star) ? (
                <>
                <path d="M37 3.5 38.4 7.1 42 8.5 38.4 9.9 37 13.5 35.6 9.9 32 8.5 35.6 7.1Z" fill="#f6d77a" stroke="#8a6100" strokeWidth="1">
                </path>
                </>
              ) : null}
            </g>
          </svg>
        </span>
        {(v.hasPatch) ? (
          <>
          <span aria-hidden="true" style={S({ position: 'absolute', left: '-2px', bottom: '-2px', display: 'grid', placeItems: 'center', width: v.ppx, height: v.ppx, borderRadius: '9999px', background: v.patchBg, color: v.patchFg, border: '2px solid var(--panel)', boxSizing: 'border-box' })}>
            <svg width="62%" height="62%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.patchGlyph}>
              </path>
            </svg>
          </span>
          </>
        ) : null}
        {(v.level) ? (
          <>
          <span aria-hidden="true" style={S({ position: 'absolute', right: '-4px', bottom: '-4px', display: 'grid', placeItems: 'center', minWidth: v.bpx, height: v.bpx, padding: '0 5px', boxSizing: 'border-box', borderRadius: '9999px', background: 'var(--ink)', color: 'var(--paper)', border: '2px solid var(--panel)', fontSize: v.bfs, fontWeight: '700' })}>
            {v.level}
          </span>
          </>
        ) : null}
        {(v.badge) ? (
          <>
          <span aria-hidden="true" style={S({ position: 'absolute', right: '-4px', bottom: '-4px', display: 'grid', placeItems: 'center', boxSizing: 'border-box', borderRadius: '9999px', fontWeight: '600', background: 'var(--paper)', color: 'var(--ink)', minWidth: v.bpx, height: v.bpx, padding: '0 4px', fontSize: v.bfs, border: `1px solid ${v.ring}` })}>
            {v.code}
          </span>
          </>
        ) : null}
      </span>
    </>
  )
}
