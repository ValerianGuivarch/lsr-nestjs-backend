import { Link, useLocation } from 'react-router-dom'

type JournalKey = 'semaine' | 'yeux'

const GRAVURE = '/assets/pf2/chasseurs-etoile-gravure.jpg'

function journalFromSearch(search: string): JournalKey {
  return new URLSearchParams(search).get('journal') === 'yeux' ? 'yeux' : 'semaine'
}

function OfficialPaper() {
  return <article className="absalom-paper semaine-paper">
    <header className="paper-masthead">
      <div className="paper-ornament">✦ ❖ ✦</div>
      <small>GAZETTE DE LA CITÉ AU CENTRE DU MONDE</small>
      <h2>La Semaine étoilée</h2>
      <p>Nouvelles, arts et affaires d’Absalom</p>
      <div className="paper-meta"><span>N° 188</span><span>Desnus 4720</span><span>3 pc</span></div>
    </header>
    <div className="paper-grid">
      <section className="paper-lead">
        <h1>Le Festival Radieux s’annonce sous le signe des héros</h1>
        <h3>Après la défaite du Tyran qui Murmure, Absalom prépare un été de célébrations. Les Chasseurs de l’Étoile seront parmi les invités d’honneur.</h3>
        <figure className="paper-engraving"><img src={GRAVURE} alt="Gravure des Chasseurs de l’Étoile" /><figcaption>Les Chasseurs de l’Étoile, attendus cet été à Absalom.</figcaption></figure>
        <p className="paper-main-copy"><span className="dropcap">L</span>es préparatifs du Festival Radieux entrent dans leur dernière ligne droite. Cet été, le Quartier du Précipice accueillera délégations, inventeurs, artistes et représentants de la Société des Éclaireurs pour une édition particulièrement symbolique : la cité fêtera aussi sa résistance victorieuse face au Tyran qui Murmure. Parmi les personnalités les plus attendues figurent les Chasseurs de l’Étoile, devenus au fil de leurs expéditions l’un des groupes les plus célèbres de la Société. Sheila Heidmarch et ses compagnons doivent participer à plusieurs cérémonies et rencontres publiques. Le Comité des festivals promet par ailleurs un programme exceptionnel, mêlant merveilles étrangères, spectacles et démonstrations magiques, afin de faire de cet été l’image d’une Absalom tournée vers l’avenir.</p>
      </section>
      <aside className="paper-sidebar">
        <section><h4>La Merveilleuse Ménagerie au rendez-vous</h4><p>La Merveilleuse ménagerie de Chevalier prendra part aux festivités avec plusieurs créatures rares présentées au public.</p></section>
        <section><h4>Le Ratisseur de tombes toujours introuvable</h4><p>L’excavateur magique destiné aux travaux du festival a disparu. Les enquêteurs ont relevé des traces magiques atypiques, sans avancer pour l’heure d’explication officielle.</p></section>
        <section><h4>Procès de Maître Torche</h4><p>Les autorités indiquent que la date du procès devrait être fixée avant la fin de l’année. Aucun calendrier définitif n’a encore été annoncé.</p></section>
        <section><h4>Quartier des Roses : l’enquête continue</h4><p>La Garde poursuit ses recherches concernant le tueur du Quartier des Roses et renouvelle son appel à témoins.</p></section>
      </aside>
    </div>
    <footer><span>La Semaine étoilée</span><span>Imprimé à Absalom</span><span>Une · édition courante</span></footer>
  </article>
}

function SensationPaper() {
  return <article className="absalom-paper yeux-paper">
    <header className="paper-masthead">
      <div className="paper-ornament">☞ ✦ ☜</div>
      <small>TOUT CE QU’ON VOUS CACHE FINIT ICI</small>
      <h2>Les Yeux d’Absalom</h2>
      <div className="paper-meta"><span>ÉDITION SPÉCIALE</span><span>Desnus 4720</span><span>2 pc</span></div>
    </header>
    <section className="sensation-hero">
      <span className="screamline">MYSTÈRE SOUS LE FESTIVAL !</span>
      <h1>Le Ratisseur de tombes emporté par une force… démoniaque ?</h1>
      <p className="sensation-deck">Traces magiques, disparition en plein jour et un témoin qui décrit un « bruit impossible » : faut-il vraiment croire qu’il ne s’est rien passé ?</p>
      <p>Le gigantesque excavateur magique du Festival Radieux s’est volatilisé sans laisser de piste évidente. Les enquêteurs reconnaissent eux-mêmes avoir découvert des traces magiques atypiques. Sur place, un témoin nous a parlé d’un son « étrange, profond, comme quelque chose qu’on n’aurait pas dû entendre ». Lorsque notre reporter lui a demandé s’il évoquait un grondement démoniaque, l’homme n’a pas souhaité démentir catégoriquement. Les autorités, elles, refusent toujours d’expliquer quelle puissance pourrait déplacer une machine de cette taille. Coïncidence ? Nous laisserons nos lecteurs juger.</p>
    </section>
    <div className="sensation-columns">
      <section className="sensation-card">
        <span>PRÉCIPICE · INQUIÉTUDE DANS LES RUES</span>
        <h3>Disparitions et silence de la Garde</h3>
        <p>Les signalements inquiétants se multiplient dans le Quartier du Précipice : habitants disparus, citoyens retrouvés sans vie et rumeurs de silhouettes rôdant après la tombée du jour. Plusieurs témoins parlent désormais d’un mort-vivant parmi les responsables — certains vont jusqu’à évoquer un serviteur du Tyran qui Murmure. La Garde assure enquêter, mais refuse de relier publiquement les différents cas. Combien faudra-t-il encore d’incidents avant qu’Absalom obtienne des réponses ?</p>
      </section>
      <section className="sensation-card crooked">
        <span>FESTIVAL RADIEUX · LES HÉROS QU’ON CHOISIT</span>
        <h3>Pourquoi les véritables sauveurs d’Absalom sont-ils absents ?</h3>
        <p>Les Chasseurs de l’Étoile seront accueillis comme des vedettes lors du Festival Radieux. Leur réputation n’est plus à faire — mais ce ne sont pas eux qui ont vaincu le Tyran qui Murmure aux portes de notre cité. Où sont donc ceux qui ont réellement sauvé Absalom ? Pourquoi leurs noms sont-ils si peu mis en avant ? Simple choix de programme… ou certains épisodes de leur histoire seraient-ils trop embarrassants pour les cérémonies officielles ?</p>
      </section>
    </div>
    <footer><span>Les Yeux d’Absalom</span><span>Les faits qu’on préfère taire</span><span>Édition spéciale</span></footer>
  </article>
}

export default function JournauxPage() {
  const location = useLocation()
  const journal = journalFromSearch(location.search)
  return <section className="journaux-page">
    <nav className="newspaper-tabs" aria-label="Choisir un journal">
      <Link className={journal === 'semaine' ? 'active' : ''} to="/pf2-mj/journaux?journal=semaine">La Semaine étoilée</Link>
      <Link className={journal === 'yeux' ? 'active' : ''} to="/pf2-mj/journaux?journal=yeux">Les Yeux d’Absalom</Link>
    </nav>
    {journal === 'semaine' ? <OfficialPaper /> : <SensationPaper />}
  </section>
}
