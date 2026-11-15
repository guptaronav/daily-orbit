import { Panel } from '../components/kit/Panel'
import { INDICATORS } from '../contract/types'
import { getContent, isTodo } from '../lib/content'
import { COVERAGE } from '../lib/dataCoverage'
import { ENVIRONMENTS } from '../lib/environments'
import { CHANNEL_LABEL, NOT_USED, SOURCES, UNCOVERED_STANDARD_MEASURES, getSource, sourcesOfKind, type Source } from '../lib/sources'

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

const th = 'label px-4 py-2 text-left align-bottom font-medium'
const td = 'px-4 py-3 align-top text-sm'

function SourceLink({ source }: { source: Source }) {
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-accent underline underline-offset-4 hover:text-ink">
      {source.title}
    </a>
  )
}

function SourceTable({ sources, caption, firstHeading }: { sources: Source[]; caption: string; firstHeading: string }) {
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
          {sources.map((s) => (
            <tr key={s.id}>
              <th scope="row" className={`${td} text-left font-normal`}>
                <SourceLink source={s} />
                <span className="mono mt-1 block break-all text-xs text-muted">{s.url.replace(/^https:\/\//, '')}</span>
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

export function Sources() {
  const datasets = sourcesOfKind('dataset')
  const pages = [...sourcesOfKind('standard'), ...sourcesOfKind('page')]
  const placeholders = INDICATORS.flatMap((i) => {
    const c = getContent(i)
    const n = TEXT_FIELDS.filter((f) => isTodo(c[f])).length
    return n > 0 ? [`${c.label} (${n})`] : []
  })

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sources</h1>
        <p className="mt-3 text-sm text-muted">
          Every NASA dataset and page this app is built on, what each one drives, and what we could not use. Indicator text is written only from pages we opened. Anything we could
          not source shows a placeholder instead of a guess.
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-4 border-y border-rule py-4">
          <div>
            <dt className="label">NASA datasets</dt>
            <dd className="value mt-1">{datasets.length}</dd>
          </div>
          <div>
            <dt className="label">NASA pages and standards</dt>
            <dd className="value mt-1">{pages.length}</dd>
          </div>
          <div>
            <dt className="label">Indicators</dt>
            <dd className="value mt-1">{INDICATORS.length}</dd>
          </div>
        </dl>
      </header>

      <Panel label="NASA datasets in the app" ariaLabelledby="datasets-heading">
        <h2 id="datasets-heading" className="sr-only">
          NASA datasets in the app
        </h2>
        <p className="px-4 pt-4 text-sm text-muted">
          Fetched when the app is built and bundled with it. The app makes no network calls while it runs. Links below open the NASA source and need a connection.
        </p>
        <SourceTable sources={datasets} caption="NASA datasets used by the app and what each one drives" firstHeading="Dataset" />
      </Panel>

      <Panel label="Indicator coverage" ariaLabelledby="coverage-heading">
        <h2 id="coverage-heading" className="sr-only">
          Indicator coverage
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <caption className="sr-only">Every indicator, how it gets into the app, the NASA practice it follows and the pages its text cites</caption>
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
                  Text cites
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {INDICATORS.map((i) => {
                const content = getContent(i)
                const coverage = COVERAGE[i]
                const cited = (content.sources ?? []).flatMap((id) => getSource(id) ?? [])
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
                        <span className="text-muted">No source yet</span>
                      ) : (
                        <details>
                          <summary className="cursor-pointer text-accent underline underline-offset-4">
                            {cited.length} {cited.length === 1 ? 'page' : 'pages'}
                          </summary>
                          <ul className="mt-2 space-y-1">
                            {cited.map((s) => (
                              <li key={s.id}>
                                <SourceLink source={s} />
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
      </Panel>

      <Panel label="NASA pages and standards behind the text" ariaLabelledby="pages-heading">
        <h2 id="pages-heading" className="sr-only">
          NASA pages and standards behind the text
        </h2>
        <SourceTable sources={pages} caption="NASA pages and standards the indicator text was written from" firstHeading="Page" />
      </Panel>

      <Panel label="Equipment by environment" ariaLabelledby="equipment-heading">
        <h2 id="equipment-heading" className="sr-only">
          Equipment by environment
        </h2>
        <div className="grid gap-6 p-4 md:grid-cols-3">
          {ENVIRONMENTS.map((env) => (
            <section key={env.id} aria-labelledby={`env-${env.id}`}>
              <h3 id={`env-${env.id}`} className="text-base font-semibold tracking-tight">
                {env.label}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {env.equipment.map((item) => (
                  <li key={item} className={isTodo(item) ? 'italic text-muted' : ''}>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">
                From:{' '}
                {(env.equipmentSources ?? [])
                  .flatMap((id) => getSource(id) ?? [])
                  .map((s, n) => (
                    <span key={s.id}>
                      {n > 0 && '; '}
                      <SourceLink source={s} />
                    </span>
                  ))}
              </p>
            </section>
          ))}
        </div>
      </Panel>

      <Panel label="What we could not use" ariaLabelledby="notused-heading">
        <h2 id="notused-heading" className="sr-only">
          What we could not use
        </h2>
        <div className="grid gap-8 p-4 lg:grid-cols-[1fr_1.6fr]">
          <section aria-labelledby="uncovered-heading">
            <h3 id="uncovered-heading" className="text-base font-semibold tracking-tight">
              NASA Standard Measures we do not cover
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {UNCOVERED_STANDARD_MEASURES.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <h3 className="mt-6 text-base font-semibold tracking-tight">Text still marked as a placeholder</h3>
            <p className="mt-2 text-sm">
              {placeholders.length === 0 ? 'None.' : `${placeholders.join(', ')}. The number is how many of the six answers on that card are not sourced yet.`}
            </p>
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
      </Panel>

      <p className="text-xs text-muted">
        {SOURCES.length} sources in src/content/sources.json. Pages were opened on 14 November 2026. Mapping choices that are ours, not NASA's, are marked in the NASA basis column
        and listed in NOTES.md.
      </p>
    </main>
  )
}
