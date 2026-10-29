// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SessionPreparations from './SessionPreparations'

const API = '/apil7r/pf2-mj/session-preparations'
const sample = () => ({
  id: 'preparation-one', revision: 1, title: 'Séance à venir', campaignId: null, scenarioId: null, sessionId: null, updatedAt: 'now',
  body: { summary: '', stages: [{ id: 'scene-one', time: '19h30', title: 'Scène 1', notes: '', done: false, blocks: [
    { id: 'temp-npc', kind: 'personnage', title: '', name: 'Un garde', portraitUrl: '', text: '', done: false, showName: true, secret: false },
  ] }] },
})

describe('Portrait temporaire de préparation', () => {
  let root: Root
  let container: HTMLDivElement
  let stored: ReturnType<typeof sample>
  let saved: ReturnType<typeof sample>[]
  let uploads: RequestInit[]

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    stored = sample(); saved = []; uploads = []
    container = document.createElement('div'); document.body.append(container)
    root = createRoot(container)
    vi.stubGlobal('fetch', vi.fn(async (resource: RequestInfo | URL, init?: RequestInit) => {
      const url = String(resource)
      if (url === API && !init?.method) return new Response(JSON.stringify([stored]), { status: 200 })
      if (url === API + '/sessions') return new Response('[]', { status: 200 })
      if (url === '/apil7r/pf2-mj/pnj-directory') return new Response('{"items":[]}', { status: 200 })
      if (url === API + '/preparation-one' && init?.method === 'PATCH') {
        const body = JSON.parse(init.body as string) as ReturnType<typeof sample>
        saved.push(body); stored = { ...body, revision: stored.revision + 1 }
        return new Response(JSON.stringify(stored), { status: 200 })
      }
      if (url === '/apil7r/pf2-mj/pnj/portrait' && init?.method === 'POST') {
        uploads.push(init)
        return new Response('{"portrait":"assets/l7r/portraits/pnj/prep-temporary.webp"}', { status: 200 })
      }
      throw new Error('Unexpected fetch: ' + url)
    }))
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })
  async function mount() {
    await act(async () => root.render(<MemoryRouter><SessionPreparations campaigns={[]} scenarios={[]} /></MemoryRouter>))
    expect(container.querySelector('.session-prep-portrait.can-upload')).toBeTruthy()
  }
  function saveButton() {
    return [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Enregistrer le portrait'))!
  }

  it('focuses on click, pastes an image, saves its path and loads it after remounting', async () => {
    await mount()
    const portrait = container.querySelector<HTMLElement>('.session-prep-portrait.can-upload')!
    await act(async () => portrait.click())
    expect(document.activeElement).toBe(portrait)
    const file = new File(['test-image'], 'garde.png', { type: 'image/png' })
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(paste, 'clipboardData', { value: { items: [{ type: 'image/png', getAsFile: () => file }] } })
    await act(async () => portrait.dispatchEvent(paste))
    expect(uploads).toHaveLength(1)
    const form = uploads[0].body as FormData
    expect(form.get('file')).toBe(file)
    expect(form.get('pnjId')).toBe('prep-preparation-one-temp-npc')
    expect([...form.keys()]).toEqual(['pnjId', 'file'])
    await act(async () => saveButton().click())
    expect(saved[0].body.stages[0].blocks[0].portraitUrl).toBe('assets/l7r/portraits/pnj/prep-temporary.webp')
    await act(async () => root.unmount())
    root = createRoot(container)
    await mount()
    expect(container.querySelector('img[alt="Portrait"]')?.getAttribute('src')).toContain('prep-temporary.webp')
  })

  it('uses distinct upload identifiers for two temporary characters', async () => {
    stored.body.stages[0].blocks.push({ id: 'rinna', kind: 'personnage', title: '', name: 'Rinna', portraitUrl: '', text: '', done: false, showName: true, secret: false })
    await mount()
    const portraits = [...container.querySelectorAll<HTMLElement>('.session-prep-portrait.can-upload')]
    expect(portraits).toHaveLength(2)
    const file = new File(['test-image'], 'rinna.png', { type: 'image/png' })
    const input = [...container.querySelectorAll<HTMLInputElement>('input[type=file]')][1]
    await act(async () => {
      Object.defineProperty(input, 'files', { configurable: true, value: [file] })
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(uploads).toHaveLength(1)
    expect([...(uploads[0].body as FormData).keys()]).toEqual(['pnjId', 'file'])
    expect((uploads[0].body as FormData).get('pnjId')).toBe('prep-preparation-one-rinna')
  })

  it('saves an image URL beside its field, including after a page remount', async () => {
    await mount()
    const field = [...container.querySelectorAll('input')].find(el => el.closest('label')?.textContent?.includes('Ou URL du portrait'))!
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(field, 'https://example.org/portrait.png')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => saveButton().click())
    expect(saved[0].body.stages[0].blocks[0].portraitUrl).toBe('https://example.org/portrait.png')
    await act(async () => root.unmount())
    root = createRoot(container)
    await mount()
    expect(container.querySelector('img[alt="Portrait"]')?.getAttribute('src')).toBe('https://example.org/portrait.png')
  })
})
