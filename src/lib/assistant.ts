/*
 * "Ask Orbit": an offline question answerer. It does not generate medical text. It finds the most
 * relevant passages in the app's own NASA-sourced content (BM25 ranking, the classic search-engine
 * scoring) and shows them with their sources, next to the person's own readings. Questions that
 * mention a red-flag symptom skip the search entirely and go straight to escalation.
 *
 * Everything runs in the browser with no network, so it works with no link to Earth.
 */

export type Passage = { id: string; title: string; text: string; url?: string; topic?: string }

const STOP = new Set(
  'a an and are as at be but by can could do does for from had has have how i if in into is it its me my of on or our should so than that the their them then there these they this to too was we were what when where which who why will with would you your about am im ive dont cant get got feel feeling'.split(' '),
)

/** Plain words a person might type, mapped to words the sourced content uses. */
export const SYNONYMS: Record<string, string[]> = {
  tired: ['fatigue', 'sleep', 'alertness', 'reaction'],
  exhausted: ['fatigue', 'sleep'],
  sleepy: ['fatigue', 'sleep'],
  insomnia: ['sleep'],
  awake: ['sleep'],
  headache: ['headache', 'head', 'carbon', 'co2', 'fluid'],
  head: ['headache', 'brain'],
  dizzy: ['dizziness', 'blood', 'pressure', 'heart', 'gravity'],
  lightheaded: ['dizziness', 'blood', 'pressure'],
  faint: ['blood', 'pressure', 'heart'],
  nausea: ['nausea', 'sickness', 'adaptation', 'gut', 'appetite'],
  nauseous: ['nausea', 'sickness', 'adaptation'],
  sick: ['sickness', 'nausea', 'infection', 'immune'],
  vomit: ['vomiting', 'fluid', 'sickness'],
  blurry: ['vision', 'acuity', 'sans', 'eye'],
  blur: ['vision', 'acuity', 'sans'],
  eyes: ['eye', 'vision', 'sans', 'retina'],
  see: ['vision', 'eye'],
  fever: ['temperature', 'infection', 'immune'],
  hot: ['temperature'],
  chills: ['temperature', 'infection'],
  sad: ['mood', 'depression', 'behavioral'],
  down: ['mood', 'depression'],
  lonely: ['isolation', 'mood', 'confinement'],
  anxious: ['stress', 'anxiety', 'behavioral'],
  stressed: ['stress'],
  heart: ['heart', 'cardiovascular'],
  pulse: ['heart', 'rate'],
  bp: ['blood', 'pressure'],
  thirsty: ['water', 'fluid', 'drink'],
  drink: ['water', 'fluid'],
  hungry: ['appetite', 'food', 'nutrition'],
  eat: ['food', 'meals', 'nutrition', 'appetite'],
  weight: ['body', 'mass', 'nutrition'],
  stomach: ['gut', 'digestive', 'digestion'],
  constipated: ['bowel', 'gut', 'digestive'],
  diarrhea: ['bowel', 'gut', 'fluid'],
  bones: ['bone', 'skeleton', 'exercise'],
  muscle: ['muscle', 'exercise', 'skeleton'],
  sore: ['pain', 'muscle'],
  back: ['back', 'pain', 'spine'],
  radiation: ['radiation', 'dose', 'solar'],
  storm: ['solar', 'particle', 'radiation'],
  air: ['carbon', 'co2', 'cabin'],
  co2: ['carbon', 'dioxide', 'cabin', 'headache'],
  sugar: ['blood', 'sugar', 'glucose'],
  glucose: ['blood', 'sugar'],
}

const stem = (w: string) => w.replace(/(ing|ed|ies|es|s)$/, (m) => (m === 'ies' ? 'y' : '')).replace(/[^a-z0-9]/g, '')

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem)
    .filter(Boolean)
}

export function expand(query: string): string[] {
  const raw = query.toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/).filter(Boolean)
  const out = [...tokens(query)]
  for (const w of raw) for (const s of SYNONYMS[w] ?? []) out.push(...tokens(s))
  return out
}

export type Index = { docs: { p: Passage; tf: Map<string, number>; len: number }[]; df: Map<string, number>; avg: number }

export function buildIndex(passages: readonly Passage[]): Index {
  const docs = passages.map((p) => {
    const ts = tokens(`${p.title} ${p.title} ${p.text}`)
    const tf = new Map<string, number>()
    for (const t of ts) tf.set(t, (tf.get(t) ?? 0) + 1)
    return { p, tf, len: ts.length }
  })
  const df = new Map<string, number>()
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1)
  const avg = docs.reduce((a, d) => a + d.len, 0) / Math.max(1, docs.length)
  return { docs, df, avg }
}

/** BM25 search: the most relevant passages for a question, best first. */
export function search(index: Index, query: string, k = 3): { p: Passage; score: number }[] {
  const q = expand(query)
  if (!q.length) return []
  const N = index.docs.length
  const K1 = 1.4
  const B = 0.75
  const scored = index.docs.map((d) => {
    let score = 0
    for (const t of new Set(q)) {
      const f = d.tf.get(t)
      if (!f) continue
      const n = index.df.get(t) ?? 0
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
      score += (idf * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * d.len) / index.avg))
    }
    return { p: d.p, score }
  })
  return scored
    .filter((s) => s.score > 0.8)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

/**
 * Warning signs that should never wait for a search result. Matching one sends the person
 * straight to their crew medical officer and the escalation ladder. This is the app's routing
 * rule, not a diagnosis.
 */
export const RED_FLAGS: { id: string; re: RegExp; say: string }[] = [
  { id: 'chest', re: /chest (pain|tight|pressure|hurt)|pain in (my )?chest/i, say: 'chest pain or pressure' },
  { id: 'breath', re: /can'?t breathe|cannot breathe|trouble breathing|short(ness)? of breath|hard to breathe|breathless/i, say: 'trouble breathing' },
  { id: 'faint', re: /faint(ed)?|passed out|black(ed)? out|unconscious|collaps/i, say: 'fainting or passing out' },
  { id: 'vision', re: /(sudden|suddenly).{0,20}(vision|see|blind)|can'?t see|lost (my )?vision|blind/i, say: 'sudden vision loss' },
  { id: 'head', re: /worst headache|severe headache|headache.{0,20}(worst|severe|sudden)|thunderclap/i, say: 'a sudden, severe headache' },
  { id: 'neuro', re: /confus|slurr|numb(ness)? (in|on) (my )?(face|arm|leg)|can'?t move|seizure/i, say: 'confusion, numbness or a seizure' },
  { id: 'bleed', re: /bleeding (a lot|heavily|won'?t stop)|coughing (up )?blood|vomiting blood/i, say: 'heavy bleeding' },
  { id: 'harm', re: /suicid|kill myself|hurt(ing)? myself|self[- ]?harm|end (it|my life)/i, say: 'thoughts of harming yourself' },
]

export function redFlag(question: string) {
  return RED_FLAGS.find((f) => f.re.test(question)) ?? null
}
