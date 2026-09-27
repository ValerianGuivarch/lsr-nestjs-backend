-- Mise à jour des descriptions joueurs des factions PF2
-- + création du Clan des Kobolds de Znu et du Culte des Attiseurs de Tempêtes
-- À exécuter avec : sqlite3 ~/services/lsr-nestjs-backend/pf2.sqlite < factions_descriptions_joueurs.sql

PRAGMA foreign_keys = ON;
BEGIN IMMEDIATE;

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Aigles d’Acier sont des agents et soldats andorans engagés dans la défense de la liberté. Ils interviennent contre l’esclavage, la tyrannie et les pouvoirs qui oppriment les populations, parfois loin des frontières de l’Andoran, en mêlant action militaire, soutien aux résistances et opérations plus discrètes.')
WHERE kind = 'faction'
  AND id = 'faction_aigles_d_acier';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Cette faction veille avant tout sur les membres de la Société des Éclaireurs. Elle recrute de nouveaux agents, soutient ceux qui rencontrent des difficultés et entretient les liens entre les nombreuses loges. Pour ses membres, une mission réussie ne consiste pas seulement à rapporter une découverte : il faut aussi ramener les Éclaireurs qui l’ont trouvée.')
WHERE kind = 'faction'
  AND id = 'faction_alliance_des_emissaires';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’Arcanamirium est l’une des grandes institutions d’enseignement de la magie à Absalom. Héritière de traditions venues notamment du Nex, l’académie accueille mages, chercheurs et étudiants désireux d’approfondir leur pratique des arts arcaniques, et occupe une place importante dans la vie savante et magique de la cité.')
WHERE kind = 'faction'
  AND id = 'faction_arcanamirium';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Archives Sombres étaient une ancienne faction de la Société chargée d’étudier les phénomènes occultes, les artefacts dangereux et les connaissances qu’il était parfois plus prudent de ne pas diffuser. Ses membres cherchaient autant à comprendre ces découvertes qu’à empêcher qu’elles ne tombent entre de mauvaises mains.')
WHERE kind = 'faction'
  AND id = 'faction_archives_sombres';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Bloody Barbers sont une importante organisation criminelle d’Absalom, active dans les affaires clandestines de la ville. Leur influence repose sur un réseau de malfaiteurs et d’intermédiaires, mais leur position ne les met pas à l’abri des violences et rivalités qui agitent le milieu criminel local.')
WHERE kind = 'faction'
  AND id = 'rose-street-revenge--bloody-barbers';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Bright Lions forment un réseau de résistance dans la cité de Mzali, au cœur de l’Étendue du Mwangi. Ils s’opposent au pouvoir autoritaire qui y règne et agissent souvent dans la clandestinité, en cherchant à protéger ceux qui subissent le régime et à préserver la possibilité d’un avenir différent.')
WHERE kind = 'faction'
  AND id = 'faction_bright_lions';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Bumblebrashers sont une communauté gobeline établie près de Brèchemur, en Isger. Loin de l’image de pillards souvent associée aux gobelins, ils forment un groupe organisé avec lequel les habitants et les aventuriers peuvent traiter, et dont le sort est étroitement lié aux événements qui entourent l’ancienne citadelle voisine.')
WHERE kind = 'faction'
  AND id = 'faction_bumblebrashers';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Chasseurs d’Horizons représentent le goût de l’exploration qui se trouve au cœur de la Société des Éclaireurs. Ils encouragent les expéditions vers des régions lointaines, l’ouverture de nouvelles routes et l’exploration de lieux inconnus. Leur ambition est de repousser les limites des cartes et de revenir avec des découvertes dignes des Chroniques.')
WHERE kind = 'faction'
  AND id = 'faction_chasseurs_d_horizons';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Chevaliers de Lastwall rassemblent des survivants, soldats et croisés déterminés à poursuivre le combat après la destruction de leur nation. Ils protègent les réfugiés, affrontent les morts-vivants et cherchent à contenir les forces du Tyran qui Murmure, avec l’espoir de reprendre un jour les terres perdues.')
WHERE kind = 'faction'
  AND id = 'faction_chevaliers_de_lastwall';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Le Conseil pirate rassemble les capitaines les plus puissants des Entraves et constitue l’une des principales autorités de cet archipel dominé par la piraterie. Ses membres défendent jalousement leur indépendance, règlent leurs rapports de force par la politique autant que par les armes et influencent une grande partie des affaires maritimes de la région.')
WHERE kind = 'faction'
  AND id = 'faction_conseil_pirate';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Le Consortium Aspis est une vaste organisation commerciale dont les agents recherchent richesses, artefacts et influence à travers Golarion. Rival historique de la Société des Éclaireurs, il considère volontiers une découverte comme une ressource à exploiter ou à vendre, et n’hésite pas à employer espionnage, intimidation ou opérations clandestines pour devancer ses concurrents.')
WHERE kind = 'faction'
  AND id = 'faction_consortium_aspis';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Le Consortium du Bois est la puissance économique dominante de Nid-du-Faucon. Il contrôle une grande part de l’exploitation forestière locale et exerce une influence considérable sur la vie de la ville, au point que ses intérêts privés et ceux de ses dirigeants pèsent souvent aussi lourd que l’autorité officielle.')
WHERE kind = 'faction'
  AND id = 'crown-of-the-kobold-king--consortium-du-bois';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Cour Souveraine était une ancienne faction de la Société spécialisée dans la diplomatie, les relations avec la noblesse et les jeux d’influence. Ses membres considéraient qu’un contact bien placé, une faveur politique ou une alliance correctement négociée pouvaient parfois ouvrir davantage de portes qu’une expédition armée.')
WHERE kind = 'faction'
  AND id = 'faction_cour_souveraine';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Croisade d’Argent rassemblait les membres de la Société qui souhaitaient mettre leurs talents et ses ressources au service de causes ouvertement héroïques. Elle encourageait les Éclaireurs à protéger les innocents et à combattre les grandes menaces rencontrées au cours de leurs voyages. Le Serment Radieux en a repris une partie de l’héritage.')
WHERE kind = 'faction'
  AND id = 'faction_croisade_d_argent';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Le Culte de Dahak regroupe des fidèles et des agents dévoués au dieu-dragon de la destruction. Ses membres cherchent à servir ses desseins, à accroître son influence et à libérer ou renforcer les forces liées à son pouvoir. Là où ils apparaissent, incendies, violence draconique et anciens secrets sont rarement très loin.')
WHERE kind = 'faction'
  AND id = 'faction_culte_de_dahak';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Ce culte rassemble les fidèles de Droskar liés au Creuset, un ancien complexe nain marqué par le travail forcé, l’ambition et la dureté de leur dieu. Ses membres ont laissé derrière eux des ouvrages, des traditions et des artefacts dont l’influence peut encore se faire sentir longtemps après le déclin de leur communauté.')
WHERE kind = 'faction'
  AND id = 'crown-of-the-kobold-king--culte-de-droskar';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les cultes de Norgorber forment un ensemble de cellules secrètes consacrées au dieu des secrets, du meurtre, du poison et de l’avidité. Ils ne constituent pas toujours une organisation unique : leurs membres agissent souvent dans l’ombre, sous de fausses identités ou au sein d’autres groupes, en poursuivant les différents aspects de leur dieu.')
WHERE kind = 'faction'
  AND id = 'faction_culte_de_norgorber';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Le Décemvirat est l’autorité suprême de la Société des Éclaireurs. Ce conseil de dix membres fixe les grandes orientations de l’organisation, décide de ses priorités et supervise ses activités à travers le monde. Ses membres ont longtemps cultivé le secret autour de leur identité, au point de devenir eux-mêmes l’une des institutions les plus mystérieuses de la Société.')
WHERE kind = 'faction'
  AND id = 'faction_decemvirat';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Dragon Sharks sont une tribu kobolde des souterrains d’Absalom. Rivaux territoriaux des Sewer Dragons, ils cherchent à étendre leur influence dans les égouts et n’hésitent pas à contester les passages, ressources et refuges contrôlés par d’autres groupes kobolds.')
WHERE kind = 'faction'
  AND id = 'rose-street-revenge--dragon-sharks';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’Edgewatch est une unité de la garde d’Absalom créée pour sécuriser le Festival Radieux et le Quartier du Précipice. Ses agents enquêtent sur les crimes, maintiennent l’ordre dans une zone particulièrement animée de la ville et sont amenés à traiter aussi bien les incidents ordinaires que les menaces capables de perturber un événement d’ampleur internationale.')
WHERE kind = 'faction'
  AND id = 'faction_edgewatch';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Ekujae sont des communautés elfes de l’Étendue du Mwangi, profondément liées à leur territoire et à son histoire. Leur mémoire collective est notamment marquée par une longue résistance aux cultes et aux serviteurs de Dahak, ce qui en fait des gardiens vigilants face aux menaces draconiques et aux anciens dangers de la région.')
WHERE kind = 'faction'
  AND id = 'faction_ekujae';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La famille Blakros est l’une des grandes dynasties marchandes d’Absalom. Sa richesse, ses alliances et son célèbre musée lui donnent une influence qui dépasse largement le simple commerce. Au fil des générations, les Blakros ont également accumulé des accords, obligations et liens occultes qui rendent leur histoire aussi complexe que leurs collections.')
WHERE kind = 'faction'
  AND id = 'faction_famille_blakros';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La famille Deverin est l’une des familles les plus respectées de Pointesable et entretient depuis longtemps des liens étroits avec la mairie de la ville. Son influence est surtout civique : elle est associée à la stabilité de la communauté et à la gestion des affaires quotidiennes plutôt qu’aux grandes ambitions des puissances régionales.')
WHERE kind = 'faction'
  AND id = 'faction_famille_deverin';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La famille Kaijitsu est une lignée d’origine minkai établie depuis longtemps en Varisie. Connue à Pointesable par ses activités et ses membres, elle porte également un héritage beaucoup plus ancien qui la relie à l’histoire politique du Minkai et aux bouleversements qui ont touché l’empire de l’autre côté du monde.')
WHERE kind = 'faction'
  AND id = 'faction_famille_kaijitsu';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La famille Scarnetti compte parmi les lignées les plus riches et influentes de Pointesable. Ses intérêts économiques lui donnent un poids important dans les affaires locales, et elle défend avec énergie sa position, ses propriétés et ses profits. À Pointesable, son nom est aussi associé aux rivalités entre les familles notables de la ville.')
WHERE kind = 'faction'
  AND id = 'faction_famille_scarnetti';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Garde de Pointesable assure la sécurité quotidienne de cette petite ville varisienne. Ses effectifs sont modestes : elle règle les troubles ordinaires, surveille les environs et constitue la première réponse lorsque survient un danger. Face à une crise dépassant ses moyens, elle doit souvent compter sur l’aide des habitants et d’aventuriers de passage.')
WHERE kind = 'faction'
  AND id = 'faction_garde_de_pointesable';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Située à Absalom, la Grande Loge est le principal quartier général de la Société des Éclaireurs. Des agents du monde entier y viennent pour recevoir leurs missions, consulter les archives, suivre leur formation ou faire leur rapport après une expédition. C’est à la fois une base opérationnelle, un centre d’étude et le cœur administratif de l’organisation.')
WHERE kind = 'faction'
  AND id = 'faction_grande_loge';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Grandes Archives rassemblent les Éclaireurs qui considèrent qu’une découverte ne vaut que si elle est comprise et préservée. Leurs membres recherchent textes anciens, artefacts, témoignages et savoirs oubliés, puis les étudient et les consignent afin qu’ils puissent profiter à l’ensemble de la Société plutôt que disparaître à nouveau.')
WHERE kind = 'faction'
  AND id = 'faction_grandes_archives';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Guilde du Roc rouge est un syndicat criminel actif à Nid-du-Faucon. Elle contrôle une partie des activités clandestines de la ville et prospère grâce aux liens entre criminalité locale, argent et pouvoir. Ses membres constituent l’un des principaux relais des intérêts les moins avouables qui s’exercent sur la cité.')
WHERE kind = 'faction'
  AND id = 'crown-of-the-kobold-king--guilde-du-roc-rouge';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Hellknights sont des ordres militarisés voués à l’imposition de la loi et de l’ordre, qu’ils considèrent comme des principes supérieurs aux préférences individuelles ou à la compassion. Chaque ordre poursuit ses propres missions, mais tous partagent une discipline extrême, une hiérarchie rigide et une réputation qui inspire autant le respect que la crainte.')
WHERE kind = 'faction'
  AND id = 'faction_hellknights';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Bourse était une ancienne faction de la Société tournée vers le commerce, les contacts et les réseaux d’influence. Ses membres cherchaient à obtenir ressources, informations et relations utiles aux Éclaireurs, en utilisant les marchés et les échanges comme des outils capables de faciliter des expéditions ou d’ouvrir des portes autrement fermées.')
WHERE kind = 'faction'
  AND id = 'faction_la_bourse';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Liberté en Marche était une ancienne faction de la Société engagée contre l’esclavage, l’oppression et les pouvoirs qui privaient les populations de leurs libertés. Ses membres profitaient de leurs voyages et des ressources de la Société pour soutenir des mouvements d’émancipation et aider ceux qui cherchaient à échapper à leurs oppresseurs.')
WHERE kind = 'faction'
  AND id = 'faction_liberte_en_marche';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Ligue Technique fut longtemps l’une des puissances les plus redoutées de Numérie. Ses membres cherchaient à monopoliser les connaissances et les objets technologiques issus des étranges ruines de la région, en empêchant les autres d’y accéder. Bien qu’affaiblie, son nom reste associé au contrôle jaloux de technologies que peu de gens comprennent réellement.')
WHERE kind = 'faction'
  AND id = 'faction_ligue_technique';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Installée à Magnimar et dirigée par la famille Heidmarch, cette loge constitue l’une des principales bases de la Société des Éclaireurs en Varisie. Ses agents connaissent particulièrement bien les ruines, monuments et traces laissées par l’ancien Thassilon, ce qui en fait un point de départ naturel pour de nombreuses expéditions dans la région.')
WHERE kind = 'faction'
  AND id = 'faction_loge_heidmarch';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Magaambya est l’une des plus anciennes et prestigieuses académies de magie de Golarion. Fondée à Nantambu dans la tradition du Vieux-Mage Jatembe, elle enseigne une magie étroitement liée au savoir, à la responsabilité et au service des communautés. Ses étudiants apprennent autant à comprendre leur pouvoir qu’à l’utiliser avec discernement.')
WHERE kind = 'faction'
  AND id = 'faction_magaambya';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Main de cuivre est une guilde de voleurs active à Absalom, organisée autour de cambriolages, recel et opérations criminelles soigneusement préparées. Le groupe est notamment capable de monter des coups ambitieux et de dissimuler ensuite ses activités derrière un réseau de caches, d’intermédiaires et de transactions clandestines.')
WHERE kind = 'faction'
  AND id = 'agents-of-edgewatch-adventure-2--main-de-cuivre';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Maison Ahnkamen est une famille noble d’Absalom aux racines osiriennes. Elle fait partie des nombreuses grandes maisons dont les alliances, les rivalités et les intérêts contribuent à la vie politique de la cité, tout en conservant un héritage culturel qui la distingue parmi l’aristocratie locale.')
WHERE kind = 'faction'
  AND id = 'faction_maison_ahnkamen';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Maison Arnsen est une famille noble influente d’Absalom. Comme les autres grandes maisons de la cité, elle dispose de réseaux sociaux, de ressources et d’alliances qui lui permettent de peser sur les affaires locales, même lorsque son nom n’apparaît pas directement au premier plan.')
WHERE kind = 'faction'
  AND id = 'faction_maison_arnsen';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Maison Docur est une institution de Kintargo qui combine les apparences d’une maison respectable avec un réseau particulièrement bien informé. Ses membres excellent dans la collecte de renseignements, les relations discrètes et les opérations d’espionnage, ce qui en fait un acteur précieux — ou dangereux — dans les jeux d’influence de Ravounel.')
WHERE kind = 'faction'
  AND id = 'faction_maison_docur';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Maison Madinani est une famille influente d’Absalom, particulièrement présente dans les cercles magiques et politiques de la cité. Son prestige tient autant à ses relations qu’à la place occupée par certains de ses membres dans les grandes institutions arcaniques et dans les affaires publiques.')
WHERE kind = 'faction'
  AND id = 'faction_maison_madinani';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Maison Morilla est une famille noble d’Absalom réputée pour l’étendue de ses relations sociales et politiques. Elle cultive les alliances, les contacts et l’influence avec autant de soin que d’autres maisons entretiennent leurs domaines, ce qui lui permet d’agir efficacement dans les milieux où réputation et diplomatie comptent plus que la force.')
WHERE kind = 'faction'
  AND id = 'faction_maison_morilla';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Maison Nexus est l’ancienne loge de la Société des Éclaireurs située à Quantium, capitale du Nex. Elle sert de base aux agents opérant dans une région célèbre pour ses traditions magiques extrêmement développées et permet à la Société de maintenir une présence permanente dans cette partie de Garund.')
WHERE kind = 'faction'
  AND id = 'faction_maison_nexus';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Maison Stavian est la dynastie impériale du Taldor, l’un des plus anciens royaumes de l’Avistan. Son histoire est indissociable du trône taldien, de la noblesse et des luttes de succession qui façonnent la politique du pays. Même lorsque le pouvoir change de mains, le nom Stavian reste chargé de prestige et d’héritage impérial.')
WHERE kind = 'faction'
  AND id = 'faction_maison_stavian';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Maison Thrune est la dynastie qui gouverne le Chéliax. Son pouvoir repose sur un État autoritaire, une administration redoutablement organisée et des alliances infernales qui marquent profondément la vie politique et religieuse du pays. À l’étranger comme au Chéliax, son nom est synonyme de pouvoir, de contrôle et d’influence diabolique.')
WHERE kind = 'faction'
  AND id = 'faction_maison_thrune';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Mantes rouges sont un ordre d’assassins sacrés voués à Achaekek et établis sur l’île de Mediogalti. Ils exécutent des contrats selon leurs propres règles et traditions, avec une discipline religieuse qui les distingue de simples tueurs à gages. Leur réputation est telle que leur présence suffit souvent à provoquer la peur.')
WHERE kind = 'faction'
  AND id = 'faction_mantes_rouges';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Le Musée Blakros est une grande institution privée d’Absalom appartenant à la famille du même nom. Ses collections rassemblent des objets rares, œuvres et artefacts venus de nombreuses régions de Golarion. Cette richesse en fait un lieu prestigieux pour les érudits et visiteurs, mais certaines pièces ont une histoire autrement plus dangereuse qu’une simple exposition.')
WHERE kind = 'faction'
  AND id = 'faction_musee_blakros';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’Onyx Alliance est une puissance politique et criminelle liée à Absalom de l’Ombre, reflet planaire inquiétant de la cité. Ses agents et alliés utilisent intrigues, réseaux et manœuvres clandestines pour étendre leur influence, notamment lorsque les affaires du Plan de l’Ombre commencent à empiéter sur celles d’Absalom.')
WHERE kind = 'faction'
  AND id = 'faction_onyx_alliance';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’Ordre du Nail est un ordre hellknight historiquement tourné vers les frontières et les territoires qu’il considère comme insuffisamment soumis à la loi. Ses membres privilégient la discipline, la conquête de l’instabilité et l’imposition d’un ordre strict, même lorsque les populations locales ne partagent ni leurs méthodes ni leur vision de la civilisation.')
WHERE kind = 'faction'
  AND id = 'faction_ordre_du_nail';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’Ordre du Scourge est un ordre hellknight spécialisé dans la lutte contre la corruption, le crime organisé et les abus de pouvoir. Ses membres traquent réseaux criminels, fonctionnaires corrompus et conspirateurs avec les méthodes rigoureuses propres aux Hellknights, convaincus qu’une société ne peut être stable lorsque la loi elle-même est détournée.')
WHERE kind = 'faction'
  AND id = 'faction_ordre_du_scourge';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Première Garde est une force militaire d’élite chargée de défendre Absalom contre les menaces extérieures majeures. Elle intervient lorsque la cité fait face à une attaque, une invasion ou un danger dépassant les capacités de la garde ordinaire, et représente l’un des principaux instruments de défense de la Ville au Centre du Monde.')
WHERE kind = 'faction'
  AND id = 'faction_premiere_garde';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Roue Verdoyante s’intéresse au monde vivant autant qu’aux ruines et aux civilisations disparues. Ses membres étudient les écosystèmes, les créatures et les phénomènes naturels rencontrés par les Éclaireurs, tout en cherchant à éviter que les expéditions de la Société ne détruisent précisément ce qu’elles étaient venues découvrir.')
WHERE kind = 'faction'
  AND id = 'faction_roue_verdoyante';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Le Réseau Bellflower est une organisation clandestine, principalement halfling, qui aide les esclaves à fuir le Chéliax et les territoires où l’esclavage subsiste. Ses membres organisent refuges, itinéraires secrets et soutiens locaux afin de faire passer les fugitifs hors de portée de leurs maîtres et de ceux qui les traquent.')
WHERE kind = 'faction'
  AND id = 'faction_reseau_bellflower';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Sages du Scarabée formaient une faction savante de la Société particulièrement tournée vers l’histoire et les mystères de l’Osirion. Ses membres recherchaient des connaissances anciennes, des secrets oubliés et des vestiges liés aux grandes civilisations du passé, avec une attention particulière pour les énigmes les plus anciennes de Garund.')
WHERE kind = 'faction'
  AND id = 'faction_sages_du_scarabee';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Le Sceau Vigilant s’occupe des découvertes que la Société ne peut pas simplement exposer dans une bibliothèque ou un musée. Ses agents identifient les artefacts, créatures et connaissances susceptibles de représenter une menace, puis cherchent à les sécuriser, les contenir ou, lorsqu’aucune autre solution n’est raisonnable, les détruire.')
WHERE kind = 'faction'
  AND id = 'faction_sceau_vigilant';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Sczarni sont des réseaux criminels d’origine varisienne présents dans plusieurs régions de Golarion. Ils ne forment pas une organisation mondiale unifiée : chaque groupe possède ses propres chefs et activités, qui peuvent aller de la contrebande et du racket aux jeux clandestins, au recel ou à d’autres affaires illégales.')
WHERE kind = 'faction'
  AND id = 'faction_sczarni';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Secte de l’Écorcheur est un culte meurtrier opérant dans les profondeurs d’Absalom. Ses membres mêlent dévotion religieuse, assassinats rituels et activités clandestines, et se dissimulent suffisamment bien pour utiliser d’autres criminels comme intermédiaires avant que leurs véritables objectifs ne soient découverts.')
WHERE kind = 'faction'
  AND id = 'agents-of-edgewatch-adventure-2--secte-de-lecorcheur';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Le Serment Radieux défend l’idée que les Éclaireurs doivent laisser derrière eux davantage que des cartes et des chroniques. Ses membres utilisent les moyens de la Société pour protéger les innocents, venir en aide aux populations rencontrées pendant leurs missions et combattre les menaces qui frappent ceux qui ne peuvent pas se défendre seuls.')
WHERE kind = 'faction'
  AND id = 'faction_serment_radieux';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Sewer Dragons sont une tribu kobolde installée dans une partie des égouts d’Absalom. Ils ont noué des relations avec la Société des Éclaireurs et connaissent particulièrement bien les souterrains qu’ils occupent. Leur contrôle de certains passages en fait à la fois une communauté locale et un allié potentiel pour ceux qui doivent s’aventurer sous la ville.')
WHERE kind = 'faction'
  AND id = 'rose-street-revenge--sewer-dragons';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Société des Éclaireurs est une organisation internationale d’explorateurs, d’érudits et d’aventuriers dont le quartier général se trouve à Absalom. Ses agents parcourent Golarion pour explorer des régions inconnues, étudier des ruines, récupérer des connaissances et rapporter leurs découvertes afin qu’elles soient consignées dans les Chroniques. Sa devise : « Explorer, rapporter, coopérer. »')
WHERE kind = 'faction'
  AND id = 'faction_societe_des_eclaireurs';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Starwatch est une branche d’élite de la garde d’Absalom, chargée des affaires les plus sensibles et des menaces qui dépassent la criminalité ordinaire. Ses agents enquêtent sur conspirations, crises majeures et dangers touchant directement la sécurité de la cité, avec une autorité et des moyens supérieurs à ceux d’une patrouille classique.')
WHERE kind = 'faction'
  AND id = 'faction_starwatch';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Triade Écarlate est un réseau international mêlant commerce, mercenariat et activités criminelles. Ses agents se déplacent entre plusieurs régions de Golarion et recherchent profit, influence, artefacts et contrôle de réseaux lucratifs. Derrière une façade d’affaires peuvent se cacher des méthodes particulièrement brutales, notamment le trafic d’êtres humains.')
WHERE kind = 'faction'
  AND id = 'faction_triade_ecarlate';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Twilight Four sont un cercle clandestin de conspirateurs opérant à Absalom par l’intermédiaire de réseaux criminels, de cultes et d’agents difficiles à relier entre eux. Leur structure compartimentée leur permet de poursuivre des projets de grande ampleur tout en dissimulant l’identité de ceux qui se trouvent réellement au sommet.')
WHERE kind = 'faction'
  AND id = 'faction_twilight_four';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'La Whispering Way est un réseau de nécromanciens, cultistes et adeptes de la non-vie associé au Tyran qui Murmure. Ses membres considèrent la mort comme une faiblesse à dépasser et cherchent à étendre l’influence des morts-vivants, en agissant par cellules secrètes, recherches interdites et alliances avec des puissances nécromantiques.')
WHERE kind = 'faction'
  AND id = 'faction_whispering_way';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'Les Écailles véritables sont une tribu kobolde dirigée par Merlokrep et installée autour du Creuset de Droskar. Guerriers nombreux et organisés, ils constituent l’une des principales forces du Roi Kobold et revendiquent le complexe comme leur territoire, ce qui les place au cœur des conflits qui agitent les environs de Nid-du-Faucon.')
WHERE kind = 'faction'
  AND id = 'crown-of-the-kobold-king--ecailles-veritables';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’École des Parchemins forme les Éclaireurs dont les meilleures armes sont la connaissance, l’observation et la compréhension du passé. Ses étudiants apprennent à étudier les civilisations anciennes, interpréter des textes oubliés, identifier des découvertes et comprendre ce qu’ils trouvent avant de le rapporter à la Société.')
WHERE kind = 'faction'
  AND id = 'faction_ecole_des_parchemins';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’École des Sorts prépare les Éclaireurs à affronter la magie sous toutes ses formes. Ses membres étudient les traditions magiques, les phénomènes surnaturels et les dangers occultes afin de pouvoir identifier un enchantement inconnu, comprendre un artefact ou survivre à une expédition lorsque les problèmes ne peuvent pas être résolus par une simple épée.')
WHERE kind = 'faction'
  AND id = 'faction_ecole_des_sorts';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’École des Épées assure la formation martiale des Éclaireurs. Elle prépare les agents aux combats, aux dangers physiques et aux situations où une expédition tourne mal, en leur enseignant aussi bien les techniques de combat que la discipline et les réflexes nécessaires pour protéger leurs compagnons sur le terrain.')
WHERE kind = 'faction'
  AND id = 'faction_ecole_des_epees';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’Église d’Iomédae rassemble les fidèles de la déesse de la justice, de l’honneur et du courage, particulièrement présente parmi les chevaliers et les croisés. Ses prêtres et champions défendent les innocents, combattent les grandes forces du mal et accordent une importance centrale au devoir, à la droiture et à l’exemple personnel.')
WHERE kind = 'faction'
  AND id = 'faction_eglise_d_iomedae';

UPDATE pf2_record
SET payload = json_set(payload, '$.description_joueurs', 'L’Église de Razmir est à la fois une institution religieuse et un pilier du pouvoir politique du Razmiran. Elle proclame Razmir dieu vivant et organise son culte à travers une hiérarchie de prêtres masqués. Dans les territoires qu’elle contrôle, foi, autorité de l’État et obéissance au souverain sont étroitement liées.')
WHERE kind = 'faction'
  AND id = 'faction_eglise_de_razmir';

-- Création : Clan des Kobolds de Znu
INSERT INTO pf2_record (id, kind, payload)
SELECT 'faction_clan_des_kobolds_de_znu', 'faction', json('{"id":"faction_clan_des_kobolds_de_znu","nom":"Clan des Kobolds de Znu","description":"Communauté kobolde établie entre Absalom et Otari. Après avoir subi un coup d’État fomenté par un agent du Roi Kobold, le clan a été libéré et est désormais dirigé par Znu, une érudite.","description_joueurs":"Le Clan des Kobolds de Znu est une communauté kobolde établie entre Absalom et Otari, aujourd’hui dirigée par Znu, une érudite. Le clan a récemment retrouvé son indépendance après avoir renversé un pouvoir imposé par un agent du Roi Kobold et cherche désormais à reconstruire sa communauté sous une autorité plus savante que guerrière.","type":"Clan kobold","parent_id":null,"sous_factions":[],"dirigeants":[],"membres_cles":[],"lieux":[],"regions_influence":["region_kortos"],"objectifs":["Préserver l’indépendance du clan","Reconstruire et protéger la communauté"],"histoire":"Le clan a subi un coup d’État organisé par un agent du Roi Kobold avant d’être libéré. Il est désormais dirigé par Znu, une érudite.","relations":[],"tags":["Kobolds","Kortos"],"image":"","aliases":["Kobolds de Znu"],"statut":"Active","notes":"Faction de campagne.","source":"","evenements":[],"reputation_groupe":{"initiale":0,"actuelle":0},"scope":"global"}')
WHERE NOT EXISTS (
  SELECT 1 FROM pf2_record
  WHERE kind = 'faction'
    AND id = 'faction_clan_des_kobolds_de_znu'
);

UPDATE pf2_record
SET payload = json_set(
  payload,
  '$.nom', 'Clan des Kobolds de Znu',
  '$.description', 'Communauté kobolde établie entre Absalom et Otari. Après avoir subi un coup d’État fomenté par un agent du Roi Kobold, le clan a été libéré et est désormais dirigé par Znu, une érudite.',
  '$.description_joueurs', 'Le Clan des Kobolds de Znu est une communauté kobolde établie entre Absalom et Otari, aujourd’hui dirigée par Znu, une érudite. Le clan a récemment retrouvé son indépendance après avoir renversé un pouvoir imposé par un agent du Roi Kobold et cherche désormais à reconstruire sa communauté sous une autorité plus savante que guerrière.'
)
WHERE kind = 'faction'
  AND id = 'faction_clan_des_kobolds_de_znu';

-- Création : Culte des Attiseurs de Tempêtes
INSERT INTO pf2_record (id, kind, payload)
SELECT 'faction_culte_des_attiseurs_de_tempetes', 'faction', json('{"id":"faction_culte_des_attiseurs_de_tempetes","nom":"Culte des Attiseurs de Tempêtes","description":"Culte lié à l’Œil d’Abendego et à une tradition de fidèles de Gozreh cherchant à comprendre et maîtriser la puissance des tempêtes.","description_joueurs":"Le Culte des Attiseurs de Tempêtes rassemble des adeptes fascinés par l’Œil d’Abendego et par la puissance brute des tempêtes. Héritiers d’une ancienne tradition liée à Gozreh, ses membres cherchent à comprendre, provoquer et parfois incarner vents, foudre et cyclones, certains considérant l’immense ouragan comme une manifestation divine.","type":"Culte","parent_id":null,"sous_factions":[],"dirigeants":[],"membres_cles":[],"lieux":[],"regions_influence":[],"objectifs":["Étudier et maîtriser les tempêtes","Perpétuer les secrets des anciens Attiseurs de Tempêtes"],"histoire":"","relations":[],"tags":["Gozreh","Œil d’Abendego"],"image":"","aliases":["Storm Kindlers"],"statut":"Active","notes":"","source":"Pathfinder Society Scenario #9-22: Grotto of the Deluged God; Pathfinder RPG","evenements":[],"reputation_groupe":{"initiale":0,"actuelle":0},"scope":"global"}')
WHERE NOT EXISTS (
  SELECT 1 FROM pf2_record
  WHERE kind = 'faction'
    AND id = 'faction_culte_des_attiseurs_de_tempetes'
);

UPDATE pf2_record
SET payload = json_set(
  payload,
  '$.nom', 'Culte des Attiseurs de Tempêtes',
  '$.description', 'Culte lié à l’Œil d’Abendego et à une tradition de fidèles de Gozreh cherchant à comprendre et maîtriser la puissance des tempêtes.',
  '$.description_joueurs', 'Le Culte des Attiseurs de Tempêtes rassemble des adeptes fascinés par l’Œil d’Abendego et par la puissance brute des tempêtes. Héritiers d’une ancienne tradition liée à Gozreh, ses membres cherchent à comprendre, provoquer et parfois incarner vents, foudre et cyclones, certains considérant l’immense ouragan comme une manifestation divine.'
)
WHERE kind = 'faction'
  AND id = 'faction_culte_des_attiseurs_de_tempetes';

COMMIT;

-- Vérification rapide
SELECT id,
       json_extract(payload, '$.nom') AS nom,
       json_extract(payload, '$.description_joueurs') AS description_joueurs
FROM pf2_record
WHERE kind = 'faction'
ORDER BY json_extract(payload, '$.nom');
