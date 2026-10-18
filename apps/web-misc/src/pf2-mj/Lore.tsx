import { isValidElement, type ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { viewPaths } from './routing'
import './lore.css'

/**
 * Visualiseur en lecture seule de la bible de campagne.
 * Les vrais fichiers Markdown du dépôt sont intégrés au build par Vite :
 * - UNIVERS.md = point d'entrée de la bibliothèque narrative ;
 * - les fichiers Markdown des répertoires pf2/univers, pf2/pj et pf2/campagnes = chapitres détaillés.
 *
 * Il n'y a volontairement ni copie des textes, ni dépendance à GitHub au runtime.
 */
const markdownFiles = {
  ...import.meta.glob('../../../../UNIVERS.md', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('../../../../PJ.md', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('../../../../CAMPAGNES.md', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('../../../../pf2/univers/**/*.md', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('../../../../pf2/pj/**/*.md', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('../../../../pf2/campagnes/**/*.md', { query: '?raw', import: 'default', eager: true }),
} as Record<string, string>

type LoreDocument = { id: string; path: string; title: string; content: string }

function repositoryPath(key: string) {
  const normalized = key.replace(/\\/g, '/')
  const marker = '/pf2/'
  const index = normalized.lastIndexOf(marker)
  if (index >= 0) return `pf2/${normalized.slice(index + marker.length)}`
  return normalized.split('/').pop() ?? normalized
}

function documentTitle(path: string, content: string) {
  const markdownTitle = content.match(/^#\s+(.+)$/m)?.[1]
  if (!markdownTitle) return path
  return markdownTitle.replace(/^STORY\.md\s*[—–-]\s*/i, '')
}

const discoveredDocuments: LoreDocument[] = Object.entries(markdownFiles).map(([key, content]) => {
  const path = repositoryPath(key)
  return { id: path, path, title: documentTitle(path, content), content }
})

const discoveredByPath = new Map(discoveredDocuments.map((document) => [document.path, document]))
const discoveredIndex = discoveredByPath.get('UNIVERS.md')

/**
 * L'ordre de la navigation suit d'abord l'ordre déclaré dans UNIVERS.md.
 * Un nouveau fichier narratif oublié dans le sommaire reste quand même visible à la fin.
 */
const indexedChapterPaths = discoveredIndex
  ? [...discoveredIndex.content.matchAll(/\]\((pf2\/[^)#?]+\.md)(?:#[^)]*)?\)/g)].map((match) => match[1])
  : []
const uniqueIndexedChapterPaths = [...new Set(indexedChapterPaths)]
const indexedPathSet = new Set(uniqueIndexedChapterPaths)
const documents: LoreDocument[] = [
  ...(discoveredIndex ? [discoveredIndex] : []),
  ...uniqueIndexedChapterPaths.map((path) => discoveredByPath.get(path)).filter((document): document is LoreDocument => Boolean(document)),
  ...discoveredDocuments
    .filter((document) => document.path !== 'UNIVERS.md' && !indexedPathSet.has(document.path))
    .sort((left, right) => left.title.localeCompare(right.title, 'fr')),
]

const documentPaths = new Set(documents.map((document) => document.path))
const indexDocument = documents.find((document) => document.id === 'UNIVERS.md') ?? documents[0]

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')
}

function headingId(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function asText(value: ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(asText).join('')
  if (isValidElement<{ children?: ReactNode }>(value)) return asText(value.props.children)
  return ''
}

function hrefFor(path: string) {
  return `${viewPaths.lore}?page=${encodeURIComponent(path)}`
}

/**
 * Transforme un lien Markdown relatif en lien interne du visualiseur.
 * Exemple : depuis story/Absalom.md, Societe-des-Eclaireurs.md reste dans /pf2-mj/lore.
 */
function internalMarkdownLink(currentPath: string, href: string): string | null {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return null
  try {
    const url = new URL(href, `https://story.local/${currentPath}`)
    if (url.origin !== 'https://story.local') return null
    const path = decodeURIComponent(url.pathname.slice(1))
    if (!documentPaths.has(path)) return null
    return `${hrefFor(path)}${url.hash}`
  } catch {
    return null
  }
}

export default function LorePage() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const requested = new URLSearchParams(location.search).get('page') ?? 'UNIVERS.md'
  const current = documents.find((document) => document.id === requested) ?? indexDocument
  const currentIndex = documents.findIndex((document) => document.id === current?.id)
  const previous = documents[currentIndex - 1]
  const next = documents[currentIndex + 1]
  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return q ? documents.filter((document) => normalize(`${document.title} ${document.content}`).includes(q)) : documents
  }, [query])

  useEffect(() => {
    if (location.hash) {
      window.requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView())
    } else {
      document.querySelector('.pf2-mj .content')?.scrollIntoView({ block: 'start' })
    }
  }, [current?.id, location.hash])

  if (!current) return <p>Aucun fichier Markdown trouvé dans la bible de campagne.</p>

  return <div className="pf2-lore">
    <div className="pf2-lore-browser">
      <div className="pf2-lore-navigation">
        <div className="pf2-lore-navigation-header">
          <strong>Histoire de campagne</strong>
          <span>{documents.length} documents · lecture seule</span>
        </div>
        <label htmlFor="pf2-lore-search" className="pf2-lore-search-label">Chercher dans l’histoire</label>
        <input
          id="pf2-lore-search"
          type="search"
          placeholder="Nom, personnage, intrigue…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <nav aria-label="Chapitres de l’histoire" className="pf2-lore-chapters">
          {filtered.map((document) => <Link
            key={document.id}
            to={hrefFor(document.id)}
            className={current.id === document.id ? 'selected' : ''}
            aria-current={current.id === document.id ? 'page' : undefined}
          >
            <span>{document.path === 'UNIVERS.md' ? '⌂' : '§'}</span>
            <strong>{document.path === 'UNIVERS.md' ? 'Sommaire général' : document.title}</strong>
          </Link>)}
          {filtered.length === 0 && <p className="pf2-lore-no-results">Aucun chapitre ne correspond à cette recherche.</p>}
        </nav>
        <p className="pf2-lore-source">Source affichée directement : <code>UNIVERS.md</code> et <code>pf2/{univers,pj,campagnes}/**/*.md</code>. Les liens entre chapitres restent dans ce visualiseur.</p>
      </div>

      <div className="pf2-lore-reading">
        {requested !== current.id && <p className="pf2-lore-warning">Chapitre introuvable : affichage du sommaire général.</p>}
        <div className="pf2-lore-reading-toolbar">
          <span>{current.path === 'UNIVERS.md' ? 'INDEX DE LA BIBLE' : current.path}</span>
          <span>LECTURE SEULE</span>
        </div>
        <article className="pf2-lore-markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 id={headingId(asText(children))}>{children}</h1>,
              h2: ({ children }) => <h2 id={headingId(asText(children))}>{children}</h2>,
              h3: ({ children }) => <h3 id={headingId(asText(children))}>{children}</h3>,
              h4: ({ children }) => <h4 id={headingId(asText(children))}>{children}</h4>,
              a: ({ href, children }) => {
                if (!href) return <span>{children}</span>
                const inHistory = internalMarkdownLink(current.path, href)
                if (inHistory) return <Link to={inHistory}>{children}</Link>
                if (href.startsWith('#')) return <a href={href}>{children}</a>
                if (/^https?:\/\//i.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                // Les autres fichiers du dépôt (RECAP.md, etc.) ne font pas partie de la bible affichée.
                // On garde leur libellé sans envoyer le lecteur vers GitHub.
                return <span className="pf2-lore-unavailable-link" title="Document hors de la bible Histoire">{children}</span>
              },
              img: ({ src, alt }) => {
                if (!src || !/^https?:\/\//i.test(src)) return null
                return <img src={src} alt={alt ?? ''} loading="lazy" />
              },
            }}
          >{current.content}</ReactMarkdown>
        </article>
        <nav aria-label="Changer de chapitre" className="pf2-lore-pagination">
          {previous ? <Link to={hrefFor(previous.id)}>← {previous.path === 'UNIVERS.md' ? 'Sommaire' : previous.title}</Link> : <span />}
          {next ? <Link to={hrefFor(next.id)}>{next.title} →</Link> : <span />}
        </nav>
      </div>
    </div>
  </div>
}
