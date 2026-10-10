import { isValidElement, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { viewPaths } from './routing'
import './lore.css'

/**
 * Les sources sont les vrais fichiers Markdown du dépôt.
 * Vite les intègre à la compilation : aucune copie ni API GitHub nécessaire.
 */
const markdownFiles = {
  ...import.meta.glob('../../../../story.md', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('../../../../lore/*.md', { query: '?raw', import: 'default', eager: true }),
} as Record<string, string>

type LoreDocument = { id: string; path: string; title: string; content: string }

const documents: LoreDocument[] = Object.entries(markdownFiles)
  .map(([key, content]) => {
    const path = key.replace(/^.*?(?=lore\/|story\.md$)/, '')
    const title = content.match(/^#\s+(.+)$/m)?.[1]?.replace(/^STORY\.md\s*[—–-]\s*/, '') ?? path
    return { id: path, path, title, content }
  })
  .sort((a, b) => a.path === 'story.md' ? -1 : b.path === 'story.md' ? 1 : a.path.localeCompare(b.path, 'fr'))

const documentPaths = new Set(documents.map((doc) => doc.path))
const indexDocument = documents.find((doc) => doc.id === 'story.md') ?? documents[0]

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

function markdownLink(currentPath: string, href: string): string | null {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return null
  try {
    const url = new URL(href, `https://lore.local/${currentPath}`)
    if (url.origin !== 'https://lore.local') return null
    const path = decodeURIComponent(url.pathname.slice(1))
    return documentPaths.has(path) ? `${hrefFor(path)}${url.hash}` : null
  } catch {
    return null
  }
}

/** Liens vers d'autres Markdown du dépôt, hors sommaire de la bible (ex. RECAP.md). */
function githubMarkdownLink(currentPath: string, href: string): string | null {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return null
  try {
    const url = new URL(href, `https://lore.local/${currentPath}`)
    const path = decodeURIComponent(url.pathname.slice(1))
    if (url.origin !== 'https://lore.local' || !/^[\w.-]+(?:\/[\w.-]+)*\.md$/.test(path) || path.includes('..')) return null
    return `https://github.com/ValerianGuivarch/lsr-nestjs-backend/blob/main/${path}${url.hash}`
  } catch {
    return null
  }
}

export default function LorePage() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const requested = new URLSearchParams(location.search).get('page') ?? 'story.md'
  const current = documents.find((doc) => doc.id === requested) ?? indexDocument
  const currentIndex = documents.findIndex((doc) => doc.id === current?.id)
  const previous = documents[currentIndex - 1]
  const next = documents[currentIndex + 1]
  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return q ? documents.filter((doc) => normalize(doc.title + ' ' + doc.content).includes(q)) : documents
  }, [query])

  useEffect(() => {
    // En changeant de chapitre, le lecteur commence en haut du nouveau texte.
    if (location.hash) {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView()
    } else {
      document.querySelector('.pf2-mj .content')?.scrollIntoView({ block: 'start' })
    }
  }, [current?.id, location.hash])

  if (!current) return <p>Aucun fichier Markdown trouvé dans la bible de campagne.</p>

  return <div className="pf2-lore">
    <div className="pf2-lore-browser">
      <div className="pf2-lore-navigation">
        <div className="pf2-lore-navigation-header">
          <strong>Bibliothèque de campagne</strong>
          <span>{documents.length} documents · lecture seule</span>
        </div>
        <label htmlFor="pf2-lore-search" className="pf2-lore-search-label">Chercher dans le lore</label>
        <input
          id="pf2-lore-search"
          type="search"
          placeholder="Nom, personnage, intrigue…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <nav aria-label="Chapitres du lore" className="pf2-lore-chapters">
          {filtered.map((doc) => <Link
            key={doc.id}
            to={hrefFor(doc.id)}
            className={current.id === doc.id ? 'selected' : ''}
            aria-current={current.id === doc.id ? 'page' : undefined}
          >
            <span>{doc.path === 'story.md' ? '⌂' : doc.path.split('/').pop()?.slice(0, 2)}</span>
            <strong>{doc.path === 'story.md' ? 'Sommaire général' : doc.title}</strong>
          </Link>)}
          {filtered.length === 0 && <p className="pf2-lore-no-results">Aucun chapitre ne correspond à cette recherche.</p>}
        </nav>
        <p className="pf2-lore-source">Sources : <code>story.md</code> et <code>lore/*.md</code> du dépôt GitHub. Les changements sont visibles après une nouvelle compilation de l’application.</p>
      </div>

      <div className="pf2-lore-reading">
        {requested !== current.id && <p className="pf2-lore-warning">Chapitre introuvable : affichage du sommaire général.</p>}
        <div className="pf2-lore-reading-toolbar">
          <span>DOC MJ · {currentIndex === 0 ? 'INDEX' : `CHAPITRE ${currentIndex}`}</span>
          <a href={`https://github.com/ValerianGuivarch/lsr-nestjs-backend/blob/main/${current.path}`} target="_blank" rel="noopener noreferrer">Voir le Markdown sur GitHub ↗</a>
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
                const inLore = markdownLink(current.path, href)
                if (inLore) return <Link to={inLore}>{children}</Link>
                if (href.startsWith('#')) return <a href={href}>{children}</a>
                if (/^https?:\/\//i.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                const inGithub = githubMarkdownLink(current.path, href)
                if (inGithub) return <a href={inGithub} target="_blank" rel="noopener noreferrer">{children}</a>
                return <span>{children}</span>
              },
              img: ({ src, alt }) => {
                if (!src || !/^https?:\/\//i.test(src)) return null
                return <img src={src} alt={alt ?? ''} loading="lazy" />
              },
            }}
          >{current.content}</ReactMarkdown>
        </article>
        <nav aria-label="Changer de chapitre" className="pf2-lore-pagination">
          {previous ? <Link to={hrefFor(previous.id)}>← {previous.path === 'story.md' ? 'Sommaire' : previous.title}</Link> : <span />}
          {next ? <Link to={hrefFor(next.id)}>{next.title} →</Link> : <span />}
        </nav>
      </div>
    </div>
  </div>
}
