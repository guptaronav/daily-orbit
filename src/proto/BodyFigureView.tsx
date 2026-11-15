// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BodyFigureView({ v }: { v: any }) {
  return (
    <>
      <svg viewBox="0 0 200 446" role="group" aria-label="Human body map" focusable="false" style={S({ display: 'block', height: v.height, width: 'auto', maxWidth: '100%', overflow: 'visible' })}>
        <defs>
          <clipPath id={v.clipId}>
            <path d={v.outline}>
            </path>
          </clipPath>
          <linearGradient id={v.scanId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0">
            </stop>
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.55">
            </stop>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0">
            </stop>
          </linearGradient>
        </defs>
        <path d={v.outline} fill="var(--panel)" stroke="none">
        </path>
        <g clipPath={v.clipUrl}>
          {(v.zones ?? []).map((z: any, z_i: number) => (
              <Fragment key={z_i}>
            <path d={z.d} role={z.role} tabIndex={z.tab} aria-pressed={z.pressed} aria-label={z.label} onClick={z.click} onKeyDown={z.key} fill={z.fill} fillOpacity={z.op} style={S({ cursor: z.cursor, outline: 'none', animation: z.zanim, transition: 'fill-opacity 160ms ease' })} className="bodyfigureview-focus-1">
            </path>
              </Fragment>
            ))}
          <path d="M84 102 C92 106 96 107 100 107 C104 107 108 106 116 102 M100 112 V196 M76 206 C88 212 112 212 124 206" fill="none" stroke="var(--rule-strong)" strokeWidth="1" strokeLinecap="round" pointerEvents="none" opacity="0.7">
          </path>
          {(v.scan) ? (
            <>
            <rect x="0" y="0" width="200" height="40" fill={v.scanUrl} pointerEvents="none" aria-hidden="true" style={S({ animation: 'chm-sweep 5.5s cubic-bezier(0.4, 0, 0.6, 1) infinite', transformBox: 'view-box' })}>
            </rect>
            </>
          ) : null}
        </g>
        <path d={v.outline} fill="none" stroke="var(--ink)" strokeWidth="1.4" strokeLinejoin="round" pointerEvents="none">
        </path>
        {(v.organs ?? []).map((o: any, o_i: number) => (
            <Fragment key={o_i}>
          <g role={o.role} tabIndex={o.tab} aria-pressed={o.pressed} aria-label={o.label} onClick={o.click} onKeyDown={o.key} style={S({ cursor: o.cursor, outline: 'none' })} className="bodyfigureview-hover-2">
            <rect x={o.hx} y={o.hy} width={o.hw} height={o.hh} fill="transparent">
            </rect>
            <path d={o.d} fill={o.fill} stroke={o.stroke} strokeWidth={o.sw} strokeLinejoin="round" style={S({ transformBox: 'fill-box', transformOrigin: 'center', animation: o.beat, filter: o.glow })}>
            </path>
          </g>
            </Fragment>
          ))}
        {(v.pings ?? []).map((p: any, p_i: number) => (
            <Fragment key={p_i}>
          <circle cx={p.x} cy={p.y} r="14" fill="none" stroke={p.c} strokeWidth="1.5" aria-hidden="true" pointerEvents="none" style={S({ transformBox: 'fill-box', transformOrigin: 'center', animation: 'chm-ping 1.8s cubic-bezier(.22,1,.36,1) infinite' })}>
          </circle>
            </Fragment>
          ))}
      </svg>
    </>
  )
}
