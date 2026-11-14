import { DISCLAIMER } from '../config/app'
import { useApp } from '../state/AppContext'

export function Footer() {
  const { currentCrew } = useApp()
  return (
    <footer className="mt-auto border-t border-rule px-4 py-4 text-xs text-muted sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium text-ink">{DISCLAIMER}</span>
        {currentCrew && (
          <span className="border-l border-rule pl-3">
            {currentCrew.name}: {currentCrew.dataLabel}
          </span>
        )}
      </div>
    </footer>
  )
}
