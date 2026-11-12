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
    { id: 'temp-npc', kind: 'personnage', title: '', name: 'Un garde', ascendance: 'Humain', portraitUrl: '', text: '', done: false, showName: true, secret: false },
  ] }] },
})

describe('Portrait temporaire de préparation', () => {
  let root: Root
  let container: HTMLDivElement
  let stored: ReturnType<typeof sample>
  let saved: ReturnType<typeof sample>[]
  let uploads: RequestInit[]
  let npcItems: Array<{ id: string; nom: string; portrait?: string; ascendance?: string }>

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    stored = sample(); saved = []; uploads = []; npcItems = []
    container = document.createElement('div'); document.body.append(container)
    root = createRoot(container)
    vi.stubGlobal('fetch', vi.fn(async (resource: RequestInfo | URL, init?: RequestInit) => {
      const url = String(resource)
      if (url === API && !init?.method) return new Response(JSON.stringify([stored]), { status: 200 })
      if (url === API + '/sessions') return new Response('[]', { status: 200 })
      if (url === '/apil7r/pf2-mj/pnj-directory') return new Response(JSON.stringify({items:npcItems}), { status: 200 })
      if (url === API + '/preparation-one' && init?.method === 'PATCH') {
        const body = JSON.parse(init.body as string) as ReturnType<typeof sample>
        saved.push(body); stored = { ...body, revision: stored.revision + 1 }
        return new Response(JSON.stringify(stored), { status: 200 })
      }
      if (url === API + '/preparation-one/promote/temp-npc' && init?.method === 'POST') {
        const body = JSON.parse(init.body as string) as { revision: number }
        if (body.revision !== stored.revision) return new Response(JSON.stringify({ message: 'Revision incorrecte' }), { status: 409 })
        const npc = { id: 'npc_un_garde_test', nom: 'Un garde', ascendance: stored.body.stages[0].blocks[0].ascendance, portrait: stored.body.stages[0].blocks[0].portraitUrl }
        npcItems.push(npc)
        stored = { ...stored, revision: stored.revision + 1, body: { ...stored.body, stages: stored.body.stages.map(stage => ({
          ...stage, blocks: stage.blocks.map(block => block.id === 'temp-npc' ? { ...block, npcId: npc.id } : block)
        })) } }
        return new Response(JSON.stringify({ npcId: npc.id, created: true, preparation: stored }), { status: 200 })
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
    stored.body.stages[0].blocks.push({ id: 'rinna', kind: 'personnage', title: '', name: 'Rinna', ascendance: '', portraitUrl: '', text: '', done: false, showName: true, secret: false })
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
  })  it('shows ancestry and promotes a temporary character into the MJ database without sharing it', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    await mount()
    expect(container.textContent).toContain('Ascendance (pour le portrait)')
    const ascend = [...container.querySelectorAll('input')].find(input => input.closest('label')?.textContent?.includes('Ascendance')) as HTMLInputElement
    expect(ascend.value).toBe('Humain')
    const button = [...container.querySelectorAll('button')].find(item => item.textContent?.includes('Enregistrer comme PNJ permanent'))!
    await act(async () => button.click())
    expect(npcItems).toEqual([expect.objectContaining({ nom: 'Un garde', ascendance: 'Humain' })])
    expect(stored.body.stages[0].blocks[0]).toEqual(expect.objectContaining({ npcId: 'npc_un_garde_test' }))
    expect(container.querySelector('a[href="/pf2-mj/npcs/npc_un_garde_test"]')).toBeTruthy()
    expect(container.textContent).toContain('Aucune publication aux joueurs')
    expect(container.textContent).toContain('Ascendance : Humain')
    expect([...container.querySelectorAll('button')].some(item => item.textContent?.includes('Enregistrer comme PNJ permanent'))).toBe(false)
  })


})
