/** Placeholder for a screen a teammate is building. Replace the screen file's body, keep its export name. */
export function ComingSoon({ title, task }: { title: string; task: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-8 sm:px-8">
      <div className="card p-10 text-center">
        <h1 className="display text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
          This screen is still being built. Its spec is task {task} in docs/TEAM_TASKS.md.
        </p>
      </div>
    </main>
  )
}
