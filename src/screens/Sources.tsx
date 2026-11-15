import { INDICATORS } from '../contract/types'
import { getContent } from '../lib/content'
import { COVERAGE } from '../lib/dataCoverage'
import { ENVIRONMENTS } from '../lib/environments'
import { CHANNEL_LABEL, DATASETS, NOT_USED, SOURCES, UNCOVERED_STANDARD_MEASURES, getSourceByUrl, isNasaSource } from '../lib/sources'

const STANDARD_MEASURE_LABEL: Record<string, string> = {
  activityLight: 'Actigraphy (activity and light)',
  sleep: 'Sleep and pre-sleep questionnaires',
  cognition: 'Cognition',
  sensorimotor: 'Sensorimotor',
  strength: 'Strength',
  biosample: 'Biochemical markers',
  none: 'None',
}

const th = 'px-4 py-2 text-left align-bottom text-xs font-semibold uppercase tracking-[0.12em] text-muted'
const td = 'px-4 py-3 align-top text-sm'
const link = 'font-medium text-accent underline underline-offset-4 hover:text-ink'
const card = 'overflow-hidden rounded-[var(--r-panel)] border border-rule bg-panel'
const h2 = 'text-sm font-semibold uppercase tracking-[0.14em] text-muted'

const NASA_PAGES = SOURCES.filter(isNasaSource)
const OTHER_PAGES = SOURCES.filter((s) => !isNasaSource(s))

function SourceTable({ rows, caption, firstHeading }: { rows: readonly { id: string; title: string; url: string; usedFor: readonly string[] }[]; caption: string; firstHeading: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className={`${th} w-[42%]`}>
              {firstHeading}
            </th>
            <th scope="col" className={th}>
              What it drives in the app
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {rows.map((s) => (
            <tr key={s.id}>
              <th scope="row" className={`${td} text-left font-normal`}>
                <a href={s.url} target="_blank" rel="noreferrer" className={link}>
                  {s.title}
                </a>
                <span className="mt-1 block break-all font-mono text-xs text-muted">{s.url.replace(/^https:\/\//, '')}</span>
              </th>
              <td className={td}>
                <ul className="space-y-1">
                  {s.usedFor.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const asRows = (sources: typeof SOURCES) => sources.map((s) => ({ ...s, usedFor: [s.usedFor] }))

export function Sources() {
  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-8 px-4 py-8 sm:px-8">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sources</h1>
        <p className="mt-3 text-sm text-muted">
          Every dataset and page this app is built on, what each one drives, and what we could not use. Indicator text is written only from pages we opened. Mapping choices that
          are ours, not NASA's, are marked in the coverage table below.
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-4 border-y border-rule py-4">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">NASA datasets</dt>
            <dd className="mt-1 text-2xl font-semibold">{DATASETS.length}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">NASA pages</dt>
            <dd className="mt-1 text-2xl font-semibold">{NASA_PAGES.length}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">Indicators</dt>
            <dd className="mt-1 text-2xl font-semibold">{INDICATORS.length}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="datasets-heading" className="space-y-3">
        <h2 id="datasets-heading" className={h2}>
          NASA datasets in the app
        </h2>
        <div className={card}>
          <p className="px-4 pt-4 text-sm text-muted">
            Fetched when the app is built and bundled with it. The app makes no network calls while it runs. Links open the source and need a connection.
          </p>
          <SourceTable rows={DATASETS} caption="NASA datasets used by the app and what each one drives" firstHeading="Dataset" />
        </div>
      </section>

      <section aria-labelledby="coverage-heading" className="space-y-3">
        <h2 id="coverage-heading" className={h2}>
          Indicator coverage
        </h2>
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[760px] border-collapse">
            <caption className="sr-only">Every indicator, how it gets into the app, and the NASA practice it follows</caption>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {INDICATORS.map((i) => {
                const content = getContent(i)
                const coverage = COVERAGE[i]
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="pages-heading" className="space-y-3">
        <h2 id="pages-heading" className={h2}>
          NASA pages behind the text
        </h2>
        <div className={card}>
          <SourceTable rows={asRows(NASA_PAGES)} caption="NASA pages the indicator and environment text was written from" firstHeading="Page" />
        </div>
      </section>

      <section aria-labelledby="other-heading" className="space-y-3">
        <h2 id="other-heading" className={h2}>
          Other agencies and health references
        </h2>
        <div className={card}>
          <SourceTable rows={asRows(OTHER_PAGES)} caption="Non-NASA pages, such as MedlinePlus, NIH and the Canadian Space Agency, used for plain-language background" firstHeading="Page" />
        </div>
      </section>

      <section aria-labelledby="equipment-heading" className="space-y-3">
        <h2 id="equipment-heading" className={h2}>
          Equipment by environment
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ENVIRONMENTS.map((env) => (
            <section key={env.id} aria-labelledby={`env-${env.id}`} className={`${card} p-4`}>
              <h3 id={`env-${env.id}`} className="text-base font-semibold tracking-tight">
                {env.label}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {env.equipment.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">
                From:{' '}
                {env.sources.map((url, n) => (
                  <span key={url}>
                    {n > 0 && '; '}
                    <a href={url} target="_blank" rel="noreferrer" className={link}>
                      {getSourceByUrl(url)?.title ?? url.replace(/^https:\/\//, '')}
                    </a>
                  </span>
                ))}
              </p>
            </section>
          ))}
        </div>
      </section>

      <section aria-labelledby="notused-heading" className="space-y-3">
        <h2 id="notused-heading" className={h2}>
          What we could not use
        </h2>
        <div className={`${card} grid gap-8 p-4 lg:grid-cols-[1fr_1.6fr]`}>
          <section aria-labelledby="uncovered-heading">
            <h3 id="uncovered-heading" className="text-base font-semibold tracking-tight">
              NASA Standard Measures we do not cover
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {UNCOVERED_STANDARD_MEASURES.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="skipped-heading">
            <h3 id="skipped-heading" className="text-base font-semibold tracking-tight">
              Data we opened but did not use, and things that did not work
            </h3>
            <dl className="mt-2 divide-y divide-rule border-y border-rule">
              {NOT_USED.map((n) => (
                <div key={n.what} className="py-3">
                  <dt className="text-sm font-medium">{n.what}</dt>
                  <dd className="mt-1 text-sm text-muted">{n.why}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </section>

      <p className="text-xs text-muted">{SOURCES.length} pages listed in src/content/sources.json.</p>
    </main>
  )
}
