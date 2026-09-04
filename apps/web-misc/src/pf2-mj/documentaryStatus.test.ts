import { describe, expect, it } from 'vitest'
import { documentaryStatusForTargets, type DocumentaryDocument } from './documentaryStatus'

const document = (partial: Partial<DocumentaryDocument>): DocumentaryDocument => ({ present: true, associated: true, information: false, officialFr: false, english: false, translation: false, ...partial })

describe('documentaryStatusForTargets', () => {
  it('marks an official French PDF as complete, FR and ready', () => {
    expect(documentaryStatusForTargets([[document({ officialFr: true })]])).toEqual({ coverage: 'complete', mode: 'fr', ready: true })
  })

  it('marks English plus any present translation as complete, EN + trad and ready', () => {
    expect(documentaryStatusForTargets([[document({ english: true }), document({ translation: true })]])).toEqual({ coverage: 'complete', mode: 'en_trad', ready: true })
  })

  it('does not mark English alone as ready', () => {
    expect(documentaryStatusForTargets([[document({ english: true })]])).toEqual({ coverage: 'complete', mode: 'en', ready: false })
  })

  it('accepts an information document as complete and ready', () => {
    expect(documentaryStatusForTargets([[document({ information: true })]])).toEqual({ coverage: 'complete', mode: 'info', ready: true })
  })

  it('distinguishes missing expected files from no usable document', () => {
    expect(documentaryStatusForTargets([[document({ english: true })], []]).coverage).toBe('partial')
    expect(documentaryStatusForTargets([[]])).toEqual({ coverage: 'absent', mode: 'none', ready: false })
  })

  it('treats a present partial translation exactly like any available translation', () => {
    // `translation` is deliberately independent from legacy completeness metadata.
    expect(documentaryStatusForTargets([[document({ english: true }), document({ translation: true })]])).toMatchObject({ coverage: 'complete', mode: 'en_trad', ready: true })
  })
})
