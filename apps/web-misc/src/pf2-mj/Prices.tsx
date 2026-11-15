import { useMemo, useState } from 'react'
import { filterPrices, formatPrice, priceEntries, type PriceOrigin } from './priceCatalogue'
import './Prices.css'

const categories = [...new Set(priceEntries.map(entry => entry.category))]
const quickSearches = ['Bière', 'Vin', 'Repas', 'Auberge', 'Navire', 'Cheval', 'Épée', 'Soins']

export default function PricesPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [origin, setOrigin] = useState<PriceOrigin | ''>('')
  const [quantityText, setQuantityText] = useState('1')
  const [sort, setSort] = useState('category')
  const quantity = Math.max(1, Math.min(10000, Math.floor(Number(quantityText) || 1)))
  const rows = useMemo(() => {
    const result = filterPrices(query, category, origin)
    if (sort === 'name') return result.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    if (sort === 'price') return result.sort((a, b) => a.min - b.min)
    return result
  }, [query, category, origin, sort])
  const officialCount = priceEntries.filter(entry => entry.origin === 'official').length
  const reset = () => { setQuery(''); setCategory(''); setOrigin(''); setQuantityText('1'); setSort('category') }

  return <section className="mj-prices">
    <div className="mj-prices-heading">
      <div><small>GOLARION · AIDE À L’IMPROVISATION</small><h1>Prix & services</h1>
        <p>Référentiel de prix du quotidien, pour répondre rapidement aux joueurs.</p></div>
      <div className="mj-prices-summary"><strong>{priceEntries.length}</strong> tarifs · {officialCount} issus des règles</div>
    </div>
    <div className="mj-prices-info"><b>1 po = 10 pa = 100 pc</b>
      <span>Les tarifs officiels sont ceux des règles PF2. Les estimations MJ sont des repères ajustables selon la ville, la qualité, la rareté et la situation. Les tarifs de transport s’entendent par passager, sans repas ni confort supplémentaire.</span></div>
    <div className="mj-prices-controls">
      <label className="mj-prices-search">Rechercher<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex. bière, épée, chambre, voyage en bateau…" /></label>
      <label>Catégorie<select value={category} onChange={e => setCategory(e.target.value)}><option value="">Toutes</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Origine<select value={origin} onChange={e => setOrigin(e.target.value as PriceOrigin | '')}><option value="">Tous les tarifs</option><option value="official">Officiels PF2</option><option value="estimate">Estimations MJ</option></select></label>
      <label>Trier par<select value={sort} onChange={e => setSort(e.target.value)}><option value="category">Catégories</option><option value="name">Nom A–Z</option><option value="price">Prix croissant</option></select></label>
      <label>Quantité / unités<input type="number" value={quantityText} min={1} max={10000} step={1} onChange={e => setQuantityText(e.target.value)} onBlur={() => setQuantityText(String(quantity))} /></label>
      <button type="button" onClick={reset}>Réinitialiser</button>
    </div>
    <div className="mj-prices-quick">{quickSearches.map(value => <button type="button" key={value} onClick={() => { setQuery(value); setCategory(''); setOrigin('') }}>{value}</button>)}</div>
    <p className="mj-prices-count" aria-live="polite">{rows.length} résultat{rows.length > 1 ? 's' : ''}{quantity > 1 && ' · quantité ' + quantity}</p>
    {rows.length ? <div className="mj-prices-table"><table><thead><tr><th>Objet / service</th><th>Prix unitaire</th><th>Unité</th>{quantity > 1 && <th>Total × {quantity}</th>}<th>Référence</th></tr></thead><tbody>
      {rows.map((entry, index) => <tr key={entry.category + ':' + entry.name + ':' + entry.unit}>
        <td>{(index === 0 || rows[index - 1].category !== entry.category || sort !== 'category') && <small className="mj-prices-category">{entry.category}</small>}<strong>{entry.name}</strong>{entry.note && <small className="mj-prices-note">{entry.note}</small>}</td>
        <td className="mj-prices-money">{formatPrice(entry)}</td><td>{entry.unit}</td>
        {quantity > 1 && <td className="mj-prices-money">{formatPrice(entry, quantity)}</td>}
        <td>{entry.source ? <a className="mj-prices-source official" href={entry.source} target="_blank" rel="noopener noreferrer">Officiel ↗</a> : <span className="mj-prices-source estimate">Estimation MJ</span>}</td>
      </tr>)}
    </tbody></table></div> : <div className="mj-prices-empty">Aucun résultat. Essaie un terme plus général ou retire un filtre.</div>}
  </section>
}
