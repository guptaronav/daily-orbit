import { useState } from 'react'
import { area, areaDatasets, areaSources } from '../lib/sourceMap'
import { bridge } from './store'

/*
 * "Sources used here", above every section that rests on a source: what the sources back in this
 * section, the first few as links, the rest one tap away, and a link to the same group on the
 * Sources page. The groups come from lib/sourceMap.ts, so the strip and the Sources page agree.
 */

const ANCHOR = 'chm-sources-anchor'

/** Open the Sources page at one area's group. */
export function openSourcesAt(id: string) {
  try {
    sessionStorage.setItem(ANCHOR, id)
  } catch {
    // Without storage the page still opens, at the top.
  }
  bridge.go?.('sources' as never)
}

/** The Sources page calls this once it has drawn, to scroll to the group a strip asked for. */
export function takeSourcesAnchor(): string | null {
  try {
    const id = sessionStorage.getItem(ANCHOR)
    sessionStorage.removeItem(ANCHOR)
    return id
  } catch {
    return null
  }
}

const short = (t: string) => (t.length > 46 ? t.slice(0, 44).replace(/[\s,:(-]+\S*$/, '') + '…' : t)

export function SourcesUsed({ id, dark = false }: { id: string; dark?: boolean }) {
  const a = area(id)
  const [all, setAll] = useState(false)
  if (!a) return null
  const items = [...areaDatasets(a).map((d) => ({ id: d.id, title: d.title, url: d.url, data: true })), ...areaSources(a).map((s) => ({ id: s.id, title: s.title, url: s.url, data: false }))]
  const shown = all ? items : items.slice(0, 3)
  return (
    <aside aria-label={`Sources used in ${a.title}`} className={`src-used${dark ? ' src-used-dark' : ''}`}>
      <span className="src-used-k">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        Sources used here
      </span>
      <span className="src-used-what">{a.what}</span>
      <span className="src-used-chips">
        {shown.map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="noreferrer" title={s.title} className="src-chip">
            {s.data ? 'NASA data · ' : ''}
            {short(s.title)} ↗
          </a>
        ))}
        {items.length > 3 && (
          <button type="button" onClick={() => setAll((x) => !x)} className="src-chip src-more">
            {all ? 'Fewer' : `+${items.length - 3} more`}
          </button>
        )}
        <button type="button" onClick={() => openSourcesAt(a.id)} className="src-all">
          How each is used →
        </button>
      </span>
    </aside>
  )
}
