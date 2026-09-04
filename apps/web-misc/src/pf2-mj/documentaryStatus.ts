export type DocumentCoverage = 'complete' | 'partial' | 'absent'
export type DocumentaryMode = 'fr' | 'en_trad' | 'en' | 'info' | 'none'

export type DocumentaryDocument = { present: boolean; associated: boolean; information: boolean; officialFr: boolean; english: boolean; translation: boolean }
export type DocumentaryStatus = { coverage: DocumentCoverage; mode: DocumentaryMode; ready: boolean }

/** Coarse player-facing status; detailed document metadata remains independent. */
export function documentaryStatusForTargets(targets: DocumentaryDocument[][]): DocumentaryStatus {
  const summary = targets.map((documents) => {
    const usable = documents.filter((document) => document.present && document.associated)
    const pdfs = usable.filter((document) => !document.information)
    return {
      usable: usable.length > 0,
      officialFr: pdfs.some((document) => document.officialFr),
      english: pdfs.some((document) => document.english),
      translation: pdfs.some((document) => document.translation),
      information: pdfs.length === 0 && usable.some((document) => document.information),
    }
  })
  const usable = summary.filter((target) => target.usable).length
  const coverage: DocumentCoverage = usable === summary.length && summary.length > 0 ? 'complete' : usable > 0 ? 'partial' : 'absent'
  const every = (predicate: (target: typeof summary[number]) => boolean) => summary.length > 0 && summary.every(predicate)
  const mode: DocumentaryMode = every((target) => target.officialFr) ? 'fr'
    : every((target) => target.english && target.translation) ? 'en_trad'
      : every((target) => target.english) ? 'en'
        : every((target) => target.information) ? 'info'
          : 'none'
  return { coverage, mode, ready: coverage === 'complete' && ['fr', 'en_trad', 'info'].includes(mode) }
}
