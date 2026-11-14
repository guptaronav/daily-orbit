import { DISCLAIMER } from '../config/app'
import { useApp } from '../state/AppContext'
import { StatusRail } from './kit/Chrome'

export function Footer() {
  const { currentCrew, environment } = useApp()
  return (
    <footer className="mt-auto border-t border-rule bg-panel px-4 py-3 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <StatusRail
          items={[
            'Console online',
            environment.label,
            currentCrew ? `${currentCrew.name} · ${currentCrew.dataLabel}` : null,
            'No data leaves this browser',
          ]}
        />
        <span className="ticker" style={{ color: 'var(--color-watch-ink)' }}>
          {DISCLAIMER}
        </span>
      </div>
    </footer>
  )
}
