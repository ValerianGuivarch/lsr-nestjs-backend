// Tarifs en pièces de cuivre (1 po = 100 pc). Les estimations ne sont pas du canon.
// Références : tables de prix du Player Core / livre de règles PF2, valeurs seules.
import { travelTariffs, defaultMilesPerDay, journeyExtras } from '../../../web-golarion-map/src/tools/travel-rates'

export type PriceOrigin = 'official' | 'estimate'
export type PriceEntry = {
  name: string; category: string; min: number; max: number; unit: string;
  origin: PriceOrigin; source?: string; keywords: string; note: string
}
type Row = [name: string, price: number | [number, number], unit: string, keywords?: string, note?: string]
const rules = 'https://roll20.net/compendium/pf2/'
function group(category: string, source: string | undefined, rows: Row[]): PriceEntry[] {
  return rows.map(([name, price, unit, keywords = '', note = '']) => ({
    name, category, min: typeof price === 'number' ? price : price[0],
    max: typeof price === 'number' ? price : price[1], unit, keywords, note,
    origin: source ? 'official' : 'estimate', source,
  }))
}
const services = rules + 'Services'
const gear = rules + 'Adventuring%20Gear'
const animals = rules + 'Animals'
const weapons = rules + 'Weapon%20Descriptions'
export const priceEntries: PriceEntry[] = [
  ...group('Boissons', services, [
    ['Bière ordinaire', 1, 'chope', 'ale cervoise pression taverne'],
    ['Tonnelet de bière', 20, 'tonnelet', 'fût barrique ale'],
    ['Café ou thé', 2, 'pot', 'tisane infusion'],
    ['Vin ordinaire', 10, 'bouteille', 'rouge blanc rosé'],
    ['Vin de qualité', 100, 'bouteille', 'grand cru bon vin'],
  ]),
  ...group('Boissons', undefined, [
    ['Bière de mauvaise qualité', 1, '2 petites chopes', 'bière bon marché piquette', 'Estimation : demi-prix par chope.'],
    ['Bonne bière artisanale', [2, 4], 'chope', 'bière ambrée brasserie'],
    ['Bière exceptionnelle / importée', [5, 10], 'chope', 'bière naine artisanale rare'],
    ['Vin de table', [2, 3], 'verre', 'vin ordinaire'],
    ['Vin médiocre', [3, 6], 'bouteille', 'piquette mauvais vin'],
    ['Vin de qualité', [15, 25], 'verre', 'bon vin'],
    ['Grand cru rare', [200, 1000], 'bouteille', 'vin luxe millésime'],
    ['Cidre', [1, 3], 'chope', 'alcool pomme'],
    ['Hydromel', [2, 5], 'chope', 'alcool miel'],
    ['Eau-de-vie / rhum', [3, 8], 'verre', 'alcool fort whisky'],
    ['Spiritueux', [30, 100], 'bouteille', 'whisky rhum eau-de-vie'],
    ['Jus de fruit / lait', [1, 2], 'verre'],
    ['Eau potable', [0, 1], 'gourde remplie', 'eau fontaine'],
  ]),
  ...group('Repas & provisions', services, [
    ['Repas pauvre', 1, 'repas', 'soupe bouillie taverne mauvais'],
    ['Repas copieux ordinaire', journeyExtras.mealsPerDay / 3, 'repas', 'restaurant déjeuner diner plat chaud auberge'],
    ['Repas gastronomique', 100, 'repas', 'restaurant luxe banquet fin'],
  ]),
  ...group('Repas & provisions', gear, [
    ['Rations de voyage', 40, 'semaine / personne', 'nourriture vivres provisions'],
  ]),
  ...group('Repas & provisions', undefined, [
    ['Pain', 1, 'miche', 'baguette boulangerie'],
    ['Galette / biscuit', 1, '2 pièces'],
    ['Bol de soupe', 1, 'bol', 'potage'],
    ['Fromage', [2, 5], 'portion'],
    ['Œufs', [1, 3], 'demi-douzaine', 'oeuf'],
    ['Fruits ou légumes de saison', [1, 3], 'panier'],
    ['Fruits secs / noix', [2, 4], 'sachet'],
    ['Poisson frais', [2, 5], 'pièce'],
    ['Viande fraîche', [3, 8], 'portion familiale'],
    ['Viande séchée', [2, 5], 'portion'],
    ['Miel / confiture', [3, 8], 'pot'],
    ['Farine / céréales', [2, 5], 'kg'],
    ['Sel', [1, 3], 'petit sachet'],
    ['Épices courantes', [5, 20], 'sachet'],
    ['Épices rares importées', [50, 300], 'sachet'],
    ['Petit-déjeuner', [1, 3], 'personne'],
    ['Repas de rue', [1, 3], 'personne', 'street food brochette sandwich'],
    ['Repas amélioré', [5, 15], 'personne', 'restaurant bon repas viande dessert'],
    ['Dessert / pâtisserie', [1, 5], 'portion'],
    ['Banquet de fête', [30, 100], 'personne', 'mariage festin'],
    ['Banquet aristocratique', [150, 500], 'personne'],
    ['Panier-repas à emporter', [3, 6], 'personne'],
  ]),
  ...group('Hébergement', services, [
    ['Place au sol dans une auberge', 3, 'nuit / personne', 'dortoir paille pauvre'],
    ['Lit individuel', journeyExtras.bedPerDay, 'nuit / personne', 'auberge hôtel chambre dortoir'],
    ['Chambre privée double', 80, 'nuit / chambre (2 personnes)', 'auberge hôtel'],
    ['Suite luxueuse', 1000, 'nuit / suite (6 personnes)', 'hôtel luxe chambre'],
    ['Écurie', 2, 'jour / monture', 'cheval étable pension'],
  ]),
  ...group('Niveau de vie', rules + 'Cost%20of%20Living', [
    ['Subsistance — modeste', 40, 'semaine / personne', 'coût de la vie'],
    ['Subsistance — modeste', 200, 'mois / personne', 'coût de la vie'],
    ['Subsistance — modeste', 2400, 'an / personne', 'coût de la vie'],
    ['Vie confortable', 100, 'semaine / personne', 'coût de la vie'],
    ['Vie confortable', 400, 'mois / personne', 'coût de la vie'],
    ['Vie confortable', 5200, 'an / personne', 'coût de la vie'],
    ['Vie aisée', 3000, 'semaine / personne', 'coût de la vie'],
    ['Vie aisée', 13000, 'mois / personne', 'coût de la vie'],
    ['Vie aisée', 160000, 'an / personne', 'coût de la vie'],
    ['Vie extravagante', 10000, 'semaine / personne', 'coût de la vie'],
    ['Vie extravagante', 43000, 'mois / personne', 'coût de la vie'],
    ['Vie extravagante', 520000, 'an / personne', 'coût de la vie'],
  ]),
  ...group('Hébergement', undefined, [
    ['Paillasse en dortoir', [4, 8], 'nuit / personne'],
    ['Chambre individuelle modeste', [15, 40], 'nuit'],
    ['Chambre confortable', [40, 80], 'nuit'],
    ['Chambre luxueuse', [150, 400], 'nuit'],
    ['Emplacement de camping', [1, 5], 'nuit / groupe'],
    ['Location chambre meublée', [100, 300], 'mois'],
    ['Location logement populaire', [300, 800], 'mois'],
    ['Location maison confortable', [1000, 3000], 'mois'],
    ['Location manoir', [5000, 20000], 'mois', 'domaine villa'],
    ['Entrepôt / remise', [100, 500], 'mois', 'stockage'],
    ['Petite maison rurale', [10000, 50000], 'achat', 'immobilier propriété'],
    ['Maison en ville', [50000, 200000], 'achat', 'immobilier propriété'],
  ]),
  ...group('Transport & voyage', services, [
    ['Caravane (passager)', travelTariffs.caravan, '5 miles (~8 km) / personne', 'transport convoi charrette'],
    ['Calèche (passager)', travelTariffs.carriage, '5 miles (~8 km) / personne', 'carrosse diligence'],
    ['Bac ou bateau fluvial (passager)', travelTariffs.riverboat, '5 miles (~8 km) / personne', 'rivière ferry péniche passage'],
    ['Navire à voiles (passager)', travelTariffs.ship, '5 miles (~8 km) / personne', 'bateau mer traversée voyage maritime'],
    ['Péage', 1, 'passage (minimum)', 'pont taxe route'],
  ]),
  ...group('Transport & voyage', undefined, [
    ['Caravane — journée type', travelTariffs.caravan * defaultMilesPerDay.caravan / 5, 'jour / personne', 'transport route convoi', 'Tarif officiel × 4 : hypothèse 20 miles (32 km) par jour.'],
    ['Calèche — journée type', travelTariffs.carriage * defaultMilesPerDay.carriage / 5, 'jour / personne', 'carrosse diligence', 'Tarif officiel × 4 : hypothèse 20 miles par jour.'],
    ['Bateau fluvial — journée type', travelTariffs.riverboat * 4, 'jour / personne', 'rivière péniche bac', 'Tarif officiel × 4 : hypothèse 20 miles par jour.'],
    ['Navire à voiles — journée type', travelTariffs.ship * defaultMilesPerDay.ship / 5, 'jour / personne', 'bateau mer traversée voyage maritime', 'Tarif officiel × 12 : hypothèse 60 miles (~97 km) par jour.'],
    ['Cabine privée en mer', [50, 200], 'supplément / jour / cabine', 'bateau navire chambre'],
    ['Barque avec batelier en ville', [2, 10], 'traversée / personne'],
    ['Fiacre en ville', [2, 10], 'course', 'taxi voiture'],
    ['Porteur de bagages', [1, 5], 'course'],
    ['Messager en ville', [2, 5], 'message'],
    ['Courrier interurbain', [5, 20], 'message + distance', 'poste lettre'],
    ['Fret caravanier', [2, 5], 'colis courant / 5 miles'],
    ['Fret maritime', [2, 8], 'colis courant / 5 miles'],
    ['Location d’une barque', [10, 30], 'jour', 'bateau rame'],
    ['Location charrette', [10, 30], 'jour, sans attelage'],
    ['Nourriture de monture', [1, 3], 'jour', 'cheval avoine foin'],
  ]),
  ...group('Montures & animaux', animals, [
    ['Cheval de selle', 800, 'achat', 'monture équitation'],
    ['Cheval de selle — location', travelTariffs.horsePerDay, 'jour', 'monture louer cheval'],
    ['Cheval de guerre', 3000, 'achat'],
    ['Cheval de guerre — location', 100, 'jour'],
    ['Poney', 700, 'achat'],
    ['Poney — location', 8, 'jour'],
    ['Poney de guerre', 2400, 'achat'],
    ['Poney de guerre — location', 80, 'jour'],
    ['Animal de bât', 200, 'achat', 'âne mule mulet'],
    ['Animal de bât — location', 2, 'jour', 'âne mule mulet'],
    ['Chien de garde', 20, 'achat'],
    ['Chien de garde — location', 1, 'jour'],
    ['Chien de service', 400, 'achat'],
    ['Chien de service — location', 6, 'jour'],
    ['Chien de selle', 400, 'achat'],
    ['Chien de selle — location', 6, 'jour'],
    ['Corbeau messager', 400, 'achat'],
    ['Corbeau messager — location', 8, 'jour'],
    ['Aigle de chasse', 800, 'achat'],
    ['Aigle de chasse — location', 80, 'jour'],
  ]),
  ...group('Montures & animaux', undefined, [
    ['Poule', [5, 20], 'achat'], ['Canard', [10, 30], 'achat'],
    ['Chèvre / mouton', [50, 150], 'achat'], ['Cochon', [100, 300], 'achat'],
    ['Vache / bœuf', [300, 800], 'achat'], ['Chat domestique', [0, 20], 'achat'],
    ['Ferrage', [5, 20], 'monture', 'maréchal ferrant'],
    ['Pansement / soin vétérinaire simple', [10, 50], 'intervention'],
  ]),
  ...group('Équipement courant', gear, [
    ['Sac d’aventurier complet', 150, 'ensemble', 'pack kit'],
    ['Sac à dos', 10, 'pièce'], ['Sac en toile', 1, 'lot de 5'],
    ['Couverture de couchage', 2, 'pièce', 'bedroll lit de camp'],
    ['Corde', 50, '15 m (~50 pieds)'], ['Gourde', 5, 'pièce'],
    ['Torche', 1, 'pièce'], ['Bougies', 1, 'lot de 10'],
    ['Silex et acier', 5, 'ensemble', 'briquet allume feu'],
    ['Huile de lampe', 1, '~0,5 L (pinte)'], ['Lanterne à capote', 70, 'pièce'],
    ['Lanterne directionnelle', 100, 'pièce'], ['Tente individuelle', 80, 'pièce'],
    ['Tente 4 personnes', 500, 'pièce'], ['Pavillon', 4000, 'pièce'],
    ['Boussole', 100, 'pièce'], ['Longue-vue', 2000, 'pièce'],
    ['Sablier', 300, 'pièce'], ['Miroir', 100, 'pièce'],
    ['Savon', 2, 'pièce'], ['Chope', 1, 'pièce'],
    ['Coffre', 60, 'pièce'], ['Chaîne', 400, '3 m (~10 pieds)'],
    ['Cadenas médiocre', 20, 'pièce', 'serrure verrou'], ['Cadenas simple', 200, 'pièce', 'serrure verrou'],
    ['Cadenas moyen', 1500, 'pièce', 'serrure verrou'], ['Cadenas de qualité', 20000, 'pièce', 'serrure verrou'],
    ['Menottes médiocres', 30, 'paire', 'fers chaînes'], ['Menottes simples', 300, 'paire', 'fers chaînes'],
    ['Menottes moyennes', 2000, 'paire'], ['Craies', 1, 'lot de 10'],
    ['Échelle', 3, '3 m (~10 pieds)'], ['Perche', 1, '3 m (~10 pieds)'],
    ['Grappin', 10, 'pièce'], ['Piton', 1, 'pièce'],
    ['Kit d’escalade', 50, 'ensemble'], ['Pied-de-biche', 50, 'pièce'],
    ['Marteau', 10, 'pièce'], ['Outil court', 40, 'pièce', 'scie tenaille pince'],
    ['Outil long', 100, 'pièce', 'pelle pioche houe'],
    ['Filet', 100, 'pièce'], ['Matériel de pêche', 80, 'ensemble', 'canne hameçon'],
    ['Ustensiles de cuisine', 100, 'ensemble', 'marmite casserole'],
    ['Balance de marchand', 20, 'pièce'], ['Sifflet', 8, 'pièce'],
    ['Sacoches de selle', 20, 'paire'], ['Harnachement', 400, 'ensemble', 'selle bride'],
    ['Instrument de musique portatif', 80, 'pièce', 'luth flûte tambour'],
    ['Instrument de musique volumineux', 200, 'pièce'],
    ['Matériel d’écriture', 100, 'ensemble', 'plume encre papier'],
    ['Recharge encre et papier', 10, 'lot'], ['Livre de sorts vierge', 100, 'pièce'],
    ['Symbole religieux en bois', 10, 'pièce'], ['Symbole religieux en argent', 200, 'pièce'],
    ['Texte religieux', 100, 'livre'],
    ['Kit d’artisan', 400, 'ensemble', 'forgeron menuisier outils'],
    ['Kit de réparation', 200, 'ensemble'], ['Kit de guérisseur', 500, 'ensemble', 'soins médecine'],
    ['Kit de voleur', 300, 'ensemble', 'crochetage outils voleur'],
    ['Crochets de remplacement', 30, 'lot'], ['Kit de déguisement', 200, 'ensemble', 'maquillage'],
    ['Kit d’alchimiste', 300, 'ensemble'], ['Laboratoire d’alchimiste', 500, 'ensemble'],
  ]),
  ...group('Vêtements & accessoires', gear, [
    ['Habits ordinaires', 10, 'tenue', 'vêtement vêtements chemise pantalon'],
    ['Habits d’explorateur', 10, 'tenue', 'vêtement vêtements'],
    ['Habits de qualité', 200, 'tenue', 'robe élégante noble vêtements'],
    ['Habits de haute couture', 5500, 'tenue', 'robe luxe noble'],
    ['Habits contre le froid', 40, 'tenue', 'manteau hiver vêtements'],
  ]),
  ...group('Vêtements & accessoires', undefined, [
    ['Chaussettes', [1, 4], 'paire'], ['Chemise simple', [3, 8], 'pièce'],
    ['Pantalon simple', [3, 8], 'pièce'], ['Bottes de marche', [10, 30], 'paire'],
    ['Sandales', [3, 8], 'paire'], ['Ceinture', [2, 10], 'pièce'],
    ['Cape commune', [5, 15], 'pièce'], ['Chapeau', [3, 15], 'pièce'],
    ['Gants', [3, 12], 'paire'], ['Manteau doublé de fourrure', [50, 200], 'pièce'],
    ['Bijou de fantaisie', [5, 25], 'pièce'], ['Bague en argent', [50, 200], 'pièce'],
    ['Bijou en or simple', [300, 1000], 'pièce'],
    ['Parfum courant', [10, 50], 'flacon'], ['Parfum de luxe', [100, 500], 'flacon'],
  ]),
  ...group('Armes ordinaires', weapons, [
    ['Gourdin', 0, 'pièce', 'massue club'], ['Bâton', 0, 'pièce'],
    ['Dague', 20, 'pièce', 'poignard couteau arme'], ['Épée longue', 100, 'pièce', 'épée de base longsword'],
    ['Épée courte', 90, 'pièce'], ['Épée à deux mains', 200, 'pièce', 'espadon grande épée'],
    ['Épée bâtarde', 400, 'pièce'], ['Rapière', 200, 'pièce'],
    ['Cimeterre', 100, 'pièce'], ['Hachette', 40, 'pièce'], ['Hache de bataille', 100, 'pièce'],
    ['Grande hache', 200, 'pièce'], ['Masse d’armes', 100, 'pièce'], ['Masse légère', 40, 'pièce'],
    ['Marteau léger', 30, 'pièce'], ['Fléau', 80, 'pièce'],
    ['Lance', 10, 'pièce'], ['Lance longue', 50, 'pièce'], ['Hallebarde', 200, 'pièce'],
    ['Javelot', 10, 'pièce'], ['Arc court', 300, 'pièce'], ['Arc long', 600, 'pièce'],
    ['Arbalète', 300, 'pièce'], ['Arbalète lourde', 400, 'pièce'],
    ['Arbalète de poing', 300, 'pièce'], ['Fronde', 0, 'pièce'],
    ['Flèches', 10, 'lot de 10', 'munitions arc'], ['Carreaux', 10, 'lot de 10', 'munitions arbalète'],
    ['Billes de fronde', 1, 'lot de 10'],
  ]),
  ...group('Protections', rules + 'Armor%20Descriptions', [
    ['Armure matelassée', 20, 'pièce', 'gambison'], ['Armure de cuir', 200, 'pièce'], ['Cuir clouté', 300, 'pièce'], ['Chemise de mailles', 500, 'pièce'],
    ['Armure de peau', 200, 'pièce'], ['Armure d’écailles', 400, 'pièce'], ['Cuirasse', 800, 'pièce'], ['Armure à lamelles', 1300, 'pièce'], ['Demi-plate', 1800, 'pièce'],
    ['Cotte de mailles', 600, 'pièce'], ['Armure de plates complète', 3000, 'pièce', 'armure lourde harnois'],
  ]),
  ...group('Maison & artisanat', undefined, [
    ['Assiette / bol en bois', [1, 3], 'pièce'], ['Couverts', [2, 5], 'ensemble'],
    ['Cruche en terre', [2, 5], 'pièce'], ['Bouteille vide', [1, 3], 'pièce'],
    ['Pot de cuisson', [5, 20], 'pièce'], ['Panier', [2, 8], 'pièce'],
    ['Seau', [3, 10], 'pièce'], ['Tonneau vide', [15, 50], 'pièce'],
    ['Balai', [2, 5], 'pièce'], ['Couverture en laine', [5, 20], 'pièce'],
    ['Draps', [10, 30], 'ensemble'], ['Lit simple', [50, 150], 'pièce'],
    ['Chaise / tabouret', [10, 40], 'pièce'], ['Table ordinaire', [30, 120], 'pièce'],
    ['Bois de chauffage', [2, 5], 'jour / foyer'], ['Charbon de bois', [3, 10], 'sac'],
    ['Bois de construction', [5, 20], 'planche'], ['Clous', [2, 8], 'petit lot'],
    ['Étoffe ordinaire', [5, 20], 'mètre'], ['Soie', [100, 500], 'mètre'],
    ['Cuir préparé', [20, 100], 'peau'], ['Fer brut', [10, 40], 'kg'],
    ['Cire', [5, 15], 'bloc'], ['Teinture', [5, 30], 'flacon'],
    ['Feuille de papier', [1, 3], 'pièce'], ['Parchemin vierge', [2, 5], 'feuille'],
    ['Livre courant non magique', [50, 200], 'exemplaire'], ['Carte locale', [10, 50], 'pièce'],
    ['Carte régionale détaillée', [50, 300], 'pièce'], ['Plan d’une ville', [15, 60], 'pièce'],
  ]),
  ...group('Services & main-d’œuvre', rules + 'Services%20%28Legacy%29', [
    ['Employé non qualifié', 10, 'jour', 'manœuvre domestique porteur salaire hireling'],
    ['Employé qualifié', 50, 'jour', 'artisan expert hireling salaire'],
  ]),
  ...group('Services & main-d’œuvre', undefined, [
    ['Pourboire ordinaire', [1, 3], 'service'], ['Donation à un temple', [1, 50], 'don'],
    ['Bain public', [2, 5], 'entrée', 'hygiène'], ['Bain privé chaud', [10, 30], 'bain'],
    ['Lessive', [2, 10], 'tenue'], ['Coiffeur / barbier', [2, 10], 'prestation'],
    ['Couturier — retouche', [3, 15], 'prestation'], ['Cordonnier — réparation', [5, 20], 'paire'],
    ['Forgeron — réparation courante', [10, 50], 'prestation', 'arme armure'],
    ['Affûtage d’une lame', [1, 5], 'pièce', 'épée dague'],
    ['Serrurier', [10, 50], 'intervention', 'clé serrure'],
    ['Scribe — rédiger une lettre', [3, 10], 'lettre'], ['Copiste', [5, 20], 'page'],
    ['Traducteur / interprète', [20, 100], 'jour'], ['Guide urbain', [10, 30], 'jour'],
    ['Guide de régions sauvages', [50, 200], 'jour'], ['Garde du corps', [50, 200], 'jour', 'mercenaire escorte sécurité'],
    ['Mercenaire vétéran', [100, 500], 'jour'], ['Musicien / artiste', [20, 100], 'soirée'],
    ['Entrée spectacle / théâtre', [2, 20], 'personne'], ['Place de prestige au théâtre', [30, 100], 'personne'],
    ['Médecin — consultation', [10, 50], 'visite', 'soigneur guérisseur soins'],
    ['Infirmier — soins prolongés', [20, 80], 'jour'],
    ['Notaire / rédacteur de contrat', [50, 200], 'acte'],
    ['Conseil juridique', [50, 300], 'consultation', 'avocat'],
    ['Enquêteur privé', [100, 500], 'jour', 'détective espion'],
    ['Accès bibliothèque payante', [5, 30], 'jour', 'archives recherche'],
    ['Cours particulier', [10, 50], 'heure', 'professeur instructeur'],
    ['Funérailles simples', [100, 500], 'cérémonie', 'enterrement cercueil'],
    ['Écurie avec entretien complet', [5, 15], 'jour / monture'],
  ]),
  ...group('Magie & soins', services, [
    ...[3, 7, 18, 40, 80, 160, 360, 720, 1800].map((gold, i): Row => [
      'Sort de rang ' + (i + 1) + ' — prestation', gold * 100, 'incantation',
      'magie prêtre service magique soin',
      'Composantes payantes en supplément ; disponibilité, rareté et durée peuvent majorer le tarif.'
    ]),
  ]),
  ...group('Magie & soins', undefined, [
    ['Identification d’un objet courant', [10, 100], 'objet', 'expert magie estimation'],
    ['Soin non magique mineur', [5, 20], 'visite', 'médecine pansement'],
    ['Bandages / compresses', [2, 10], 'lot'],
    ['Remède de plantes non magique', [2, 20], 'dose', 'tisane onguent'],
  ]),
]
export function normalizePriceSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()
}
export function filterPrices(query: string, category = '', origin: PriceOrigin | '' = '') {
  const words = normalizePriceSearch(query).split(' ').filter(word => word && !['un', 'une', 'le', 'la', 'les', 'de', 'du', 'des', 'en', 'a', 'au', 'aux', 'd', 'l'].includes(word))
  const categoryOrder = [...new Set(priceEntries.map(entry => entry.category))]
  return priceEntries.filter(entry => {
    const search = normalizePriceSearch([entry.name, entry.category, entry.keywords, entry.unit, entry.note].join(' '))
    return (!category || entry.category === category) && (!origin || entry.origin === origin) && words.every(word => search.includes(word) || (word.length > 3 && word.endsWith('s') && search.includes(word.slice(0, -1))))
  }).sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))
}
export function formatCoins(copper: number): string {
  const amount = Math.round(copper)
  if (amount === 0) return 'Gratuit'
  const parts = [[100, 'po'], [10, 'pa'], [1, 'pc']] as const
  return parts.map(([factor, symbol]) => {
    const count = factor === 100 ? Math.floor(amount / factor) : Math.floor(amount / factor) % 10
    return count ? count + ' ' + symbol : ''
  }).filter(Boolean).join(' ')
}
export function formatPrice(entry: PriceEntry, quantity = 1): string {
  const min = formatCoins(entry.min * quantity)
  return entry.min === entry.max ? min : min + ' – ' + formatCoins(entry.max * quantity)
}
