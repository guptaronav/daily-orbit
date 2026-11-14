import { DISCLAIMER } from '../config/app'
import { useApp } from '../state/AppContext'

export function Footer() {
  const { currentCrew } = useApp()
  return (
    <footer className="mt-auto border-t border-rule px-4 py-3 text-xs text-muted sm:px-8">
      <span>{DISCLAIMER}</span>
      {currentCrew && (
        <span className="ml-3 border-l border-rule pl-3">
          {currentCrew.name}: {currentCrew.dataLabel}
        </span>
      )}
    </footer>
  )
}
