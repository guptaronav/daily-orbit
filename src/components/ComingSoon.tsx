/** Placeholder for a screen a teammate is building. Replace the screen file's body, keep its export name. */
export function ComingSoon({ title, task }: { title: string; task: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted">Not built yet. Spec: docs/TEAM_TASKS.md, task {task}.</p>
    </main>
  )
}
