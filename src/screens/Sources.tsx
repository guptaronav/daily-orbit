import { useEffect } from 'react'
import { INDICATORS } from '../contract/types'
import { AREAS, areaDatasets, areaSources, usedIn } from '../lib/sourceMap'
import { takeSourcesAnchor } from '../proto/SourcesUsed'
import { getContent, isTodo } from '../lib/content'
import { COVERAGE } from '../lib/dataCoverage'
import { ENVIRONMENTS } from '../lib/environments'
import { CHANNEL_LABEL, DATASETS, NOT_USED, SOURCES, UNCOVERED_STANDARD_MEASURES, nasaSources, otherSources, sourcesForIndicator, type Source } from '../lib/sources'

const STANDARD_MEASURE_LABEL: Record<string, string> = {
  activityLight: 'Actigraphy (activity and light)',
  sleep: 'Sleep and pre-sleep questionnaires',
  cognition: 'Cognition',
  sensorimotor: 'Sensorimotor',
  strength: 'Strength',
  biosample: 'Biochemical markers',
  none: 'None',
}

const TEXT_FIELDS = ['canMeasureInSpace', 'whyCheck', 'hazardEffect', 'whenToEscalate', 'prevention', 'recommendedAction'] as const

const section = 'overflow-hidden rounded-[26px] border border-rule bg-panel'
const heading = 'border-b border-rule px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-muted'
const th = 'px-4 py-2 text-left align-bottom text-xs font-semibold uppercase tracking-[0.08em] text-muted'
const td = 'px-4 py-3 align-top text-sm'
const link = 'font-medium text-accent underline underline-offset-4 hover:text-ink'

const host = (url: string) => url.replace(/^https:\/\//, '').split('/')[0]

function SourceTable({ sources, caption }: { sources: Source[]; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className={`${th} w-[45%]`}>
              Page
            </th>
            <th scope="col" className={th}>
              What it is used for
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {sources.map((s) => (
            <tr key={s.id}>
              <th scope="row" className={`${td} text-left font-normal`}>
                <a href={s.url} target="_blank" rel="noreferrer" className={link}>
                  {s.title}
                </a>
                <span className="mt-1 block text-xs text-muted">{host(s.url)}</span>
              </th>
              <td className={td}>
                {s.usedFor}
                <span className="mt-1 block text-xs text-muted">
                  Used on: {usedIn(s.id).map((a) => `${a.page} › ${a.title}`).join(' · ')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Sources() {
  const nasa = nasaSources()
  const other = otherSources()
  const placeholders = INDICATORS.flatMap((i) => {
    const content = getContent(i)
    const count = TEXT_FIELDS.filter((f) => isTodo(content[f])).length
    return count > 0 ? [`${content.label} (${count})`] : []
  })
  const equipmentGaps = ENVIRONMENTS.filter((e) => e.equipment.some(isTodo)).map((e) => e.label)
  // Arrived from a "Sources used here" strip: open at that page's group.
  useEffect(() => {
    const id = takeSourcesAnchor()
    if (!id) return
    // The tables below the groups grow as they lay out, so aim twice: once smoothly, once to correct.
    const go = (behavior: ScrollBehavior) => document.getElementById(`src-${id}`)?.scrollIntoView({ behavior, block: 'start' })
    setTimeout(() => go('smooth'), 400)
    setTimeout(() => go('auto'), 1300)
  }, [])

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-32 pt-8 sm:px-8">
      <header>
        <p className="m-0 text-sm text-muted">Sources · proof</p>
        <h1 className="mt-2 text-[clamp(36px,5vw,60px)] font-bold leading-none tracking-[-0.05em]">Where every claim comes from.</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-soft">
          Grouped the way the site is: each page and section, the sources behind it, and what each one backs there. Every section of the app that rests on a source says so above it, with a link back here. Anything we could not source shows a placeholder instead of a guess.
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-rule py-4 sm:grid-cols-4">
          <Count label="NASA datasets" value={DATASETS.length} />
          <Count label="NASA pages" value={nasa.length} />
          <Count label="Other references" value={other.length} />
          <Count label="Indicators" value={INDICATORS.length} />
        </dl>
      </header>

      <nav aria-label="Jump to a page" className="flex flex-wrap gap-2">
        {AREAS.map((a) => (
          <a key={a.id} href={`#src-${a.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`src-${a.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className="rounded-full border border-rule bg-panel px-3 py-1 text-xs font-semibold text-ink no-underline hover:border-accent">
            {a.page} › {a.title}
          </a>
        ))}
      </nav>

      <section aria-labelledby="bypage-heading" className="space-y-4">
        <h2 id="bypage-heading" className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Where each source is used on the site</h2>
        {AREAS.map((a) => (
          <article key={a.id} id={`src-${a.id}`} className={`${section} scroll-mt-40`}>
            <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-5 py-3">
              <h3 className="m-0 text-lg font-bold tracking-tight">
                <span className="text-muted">{a.page} › </span>
                {a.title}
              </h3>
              <span className="text-xs font-semibold text-muted">
                {a.sources.length} source{a.sources.length === 1 ? '' : 's'}
                {a.datasets?.length ? ` · ${a.datasets.length} NASA dataset${a.datasets.length === 1 ? '' : 's'}` : ''}
              </span>
            </header>
            <p className="px-5 pt-3 text-sm text-ink-soft">{a.what}</p>
            <ul className="divide-y divide-rule px-5 pb-2">
              {areaDatasets(a).map((d) => (
                <li key={d.id} className="py-3 text-sm">
                  <span className="mr-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-paper">NASA data</span>
                  <a href={d.url} target="_blank" rel="noreferrer" className={link}>{d.title}</a>
                  <span className="mt-1 block text-muted">{d.usedFor.join(' ')}</span>
                </li>
              ))}
              {areaSources(a).map((src) => (
                <li key={src.id} className="py-3 text-sm">
                  {/nasa\.gov\//.test(src.url) && <span className="mr-2 rounded-full border border-rule px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent">NASA</span>}
                  <a href={src.url} target="_blank" rel="noreferrer" className={link}>{src.title}</a>
                  <span className="ml-2 text-xs text-muted">{host(src.url)}</span>
                  <span className="mt-1 block text-muted">{src.usedFor}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <h2 className="pt-4 text-xs font-bold uppercase tracking-[0.08em] text-muted">The full lists</h2>

      <section aria-labelledby="datasets-heading" className={section}>
        <h2 id="datasets-heading" className={heading}>
          NASA datasets in the app
        </h2>
        <p className="px-4 pt-4 text-sm text-muted">
          Fetched when the app is built and bundled with it. The app makes no network calls while it runs. The links open the NASA source and need a connection.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <caption className="sr-only">NASA datasets bundled with the app and what each one drives</caption>
            <thead>
              <tr className="border-b border-rule">
                <th scope="col" className={`${th} w-[45%]`}>
                  Dataset
                </th>
                <th scope="col" className={th}>
                  What it drives in the app
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {DATASETS.map((d) => (
                <tr key={d.id}>
                  <th scope="row" className={`${td} text-left font-normal`}>
                    <a href={d.url} target="_blank" rel="noreferrer" className={link}>
                      {d.title}
                    </a>
                    <span className="mt-1 block text-xs text-muted">{host(d.url)}</span>
                  </th>
                  <td className={td}>
                    <ul className="space-y-1">
                      {d.usedFor.map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="coverage-heading" className={section}>
        <h2 id="coverage-heading" className={heading}>
          Indicator coverage
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <caption className="sr-only">Every indicator, how it gets into the app, the NASA practice it follows and the sources behind its text</caption>
            <thead>
              <tr className="border-b border-rule">
                <th scope="col" className={th}>
                  Indicator
                </th>
                <th scope="col" className={th}>
                  How it gets in
                </th>
                <th scope="col" className={th}>
                  NASA basis
                </th>
                <th scope="col" className={th}>
                  Standard Measures category
                </th>
                <th scope="col" className={th}>
                  Sources
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {INDICATORS.map((i) => {
                const content = getContent(i)
                const coverage = COVERAGE[i]
                const cited = sourcesForIndicator(i)
                return (
                  <tr key={i}>
                    <th scope="row" className={`${td} text-left font-medium`}>
                      {content.label}
                    </th>
                    <td className={td}>
                      {coverage.live.map((c) => CHANNEL_LABEL[c]).join('; ') || 'Not collected yet'}
                      {coverage.planned.length > 0 && <span className="block text-muted">Planned: {coverage.planned.map((c) => CHANNEL_LABEL[c]).join('; ')}</span>}
                    </td>
                    <td className={td}>{coverage.nasaBasis}</td>
                    <td className={td}>{STANDARD_MEASURE_LABEL[content.standardMeasure] ?? content.standardMeasure}</td>
                    <td className={td}>
                      {cited.length === 0 ? (
                        <span className="text-muted">{i === 'radiationDose' ? 'The datasets above' : 'None listed'}</span>
                      ) : (
                        <details>
                          <summary className="cursor-pointer text-accent underline underline-offset-4">
                            {cited.length} {cited.length === 1 ? 'source' : 'sources'}
                          </summary>
                          <ul className="mt-2 space-y-1">
                            {cited.map((s) => (
                              <li key={s.id}>
                                <a href={s.url} target="_blank" rel="noreferrer" className={link}>
                                  {s.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="nasa-heading" className={section}>
        <h2 id="nasa-heading" className={heading}>
          NASA pages and standards ({nasa.length})
        </h2>
        <SourceTable sources={nasa} caption="NASA pages and standards the app's text is written from" />
      </section>

      <section aria-labelledby="other-heading" className={section}>
        <h2 id="other-heading" className={heading}>
          Other references ({other.length})
        </h2>
        <p className="px-4 pt-4 text-sm text-muted">Not NASA pages: other space agencies, U.S. National Institutes of Health pages and published papers, used where a NASA page did not cover a point.</p>
        <SourceTable sources={other} caption="References that are not NASA pages" />
      </section>

      <section aria-labelledby="equipment-heading" className={section}>
        <h2 id="equipment-heading" className={heading}>
          Equipment by environment
        </h2>
        <div className="grid gap-6 p-4 sm:grid-cols-2">
          {ENVIRONMENTS.map((env) => (
            <div key={env.id}>
              <h3 className="text-base font-semibold tracking-tight">{env.label}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {env.equipment.map((item) => (
                  <li key={item} className={isTodo(item) ? 'list-none italic text-muted' : ''}>
                    {isTodo(item) ? 'Not sourced yet' : item}
                  </li>
                ))}
              </ul>
              {(env.sources ?? []).length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-accent underline underline-offset-4">{(env.sources ?? []).length} pages behind this environment</summary>
                  <ul className="mt-2 space-y-1">
                    {(env.sources ?? []).map((url) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noreferrer" className={`${link} break-all`}>
                          {url.replace(/^https:\/\//, '')}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="notused-heading" className={section}>
        <h2 id="notused-heading" className={heading}>
          What we could not use
        </h2>
        <div className="grid gap-8 p-4 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h3 className="text-base font-semibold tracking-tight">NASA Standard Measures we do not cover</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {UNCOVERED_STANDARD_MEASURES.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <h3 className="mt-6 text-base font-semibold tracking-tight">Text still marked as a placeholder</h3>
            <p className="mt-2 text-sm">
              {placeholders.length === 0 ? 'No indicator answers.' : `Indicator answers: ${placeholders.join(', ')}.`}{' '}
              {equipmentGaps.length === 0 ? 'No equipment lists.' : `Equipment list: ${equipmentGaps.join(', ')}.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight">Data we opened but did not use, and things that did not work</h3>
            <dl className="mt-2 divide-y divide-rule border-y border-rule">
              {NOT_USED.map((n) => (
                <div key={n.what} className="py-3">
                  <dt className="text-sm font-medium">{n.what}</dt>
                  <dd className="mt-1 text-sm text-muted">{n.why}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <p className="text-xs text-muted">
        {SOURCES.length} references in src/content/sources.json and {DATASETS.length} bundled datasets. Mapping choices that are ours, not NASA's, are marked in the NASA basis column.
      </p>
    </main>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold tracking-tight">{value}</dd>
    </div>
  )
}
