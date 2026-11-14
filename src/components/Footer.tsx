import { DISCLAIMER } from '../config/app'
import { useApp } from '../state/AppContext'
import { CrewDock } from './kit/CrewDock'

/**
 * Site footer plus the crew dock.
 *
 * The dock lives here because this component is already rendered on every screen by the shell,
 * so it needs no change to App.tsx. It is hidden on the landing page, which has its own hero
 * version of the same controls.
 */
export function Footer() {
  const { currentCrew, environment, screen } = useApp()
  const showDock = screen !== 'landing'

  return (
    <>
      <footer
        className="mt-auto border-t border-rule px-4 py-5 sm:px-8"
        /* Clear the floating dock so the last line of the page is never trapped under it. */
        style={{ paddingBottom: showDock ? '7.5rem' : undefined }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-2 text-sm">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-muted">
            <li>{environment.label}</li>
            {currentCrew && (
              <li>
                {currentCrew.name} · {currentCrew.dataLabel}
              </li>
            )}
            <li>No data leaves this browser</li>
          </ul>
          <span className="font-semibold" style={{ color: 'var(--color-watch-ink)' }}>
            {DISCLAIMER}
          </span>
        </div>
      </footer>

      {showDock && <CrewDock />}
    </>
  )
}
