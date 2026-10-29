#!/usr/bin/env python3
"""Import idempotent d'une préparation de séance depuis la fiche MJ de 4 pages fournie par le MJ.
Source : Age_des_Cendres_Seance_1_Fiche_MJ.pdf (octobre 2026).
Exécution : sur le mini-PC, API locale + clé serveur. N'écrase aucune préparation existante.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

TITLE = "L’Âge des Cendres — Séance 1 · Brèchemur / Altaerein"
CAMPAIGN = "age-of-ashes"
stages = []

def block(i, kind, title, text="", **options):
    return dict(id=i, kind=kind, title=title, text=text, done=False, **options)

def stage(i, time, title, notes, *blocks):
    stages.append(dict(id=f"age-cendres-s1-{i}", time=time, title=title, notes=notes,
                       done=False, blocks=list(blocks)))

stage("01", "19h30–20h00", "Brèchemur — Arrivée et Appel aux héros",
      "Warbal signale la disparition des gobelins réfugiés à Altaerein. Quelques pétitions annexes peuvent être évoquées en toile de fond ; ne pas s'attarder.",
      block("s01-warbal", "personnage", "Warbal Bumblebrasher",
            "Ambassadrice gobeline à Brèchemur. Les Bumblebrashers ne répondent plus ; elle a observé leurs signaux rouges de détresse à Altaerein.",
            npcId="npc_warbal_bumblebrasher", name="Warbal Bumblebrasher", showName=True),
      block("s01-greta", "personnage", "Greta Gardania",
            "Présidente du conseil municipal. Cadre l'Appel aux héros et confiera officiellement la mission après l'incendie.",
            name="Greta Gardania", portraitUrl="", showName=True),
      block("s01-conseil", "texte", "Conseil municipal",
            "Autres conseillers présents : Jorsk Hinterclaw, Melma Ann Sendari, Trini Sprizzlegig et Quentino Posandi. Rester bref : ce sont des figurants de la scène."),
      block("s01-signaux", "lore", "Signaux de détresse des gobelins",
            "Warbal est inquiète : les Bumblebrashers ne répondent plus depuis la citadelle et ont envoyé des signaux de détresse.", secret=False),
      block("s01-rythme", "checklist", "Maintenir le rythme",
            "Les pétitions secondaires restent en toile de fond ; amener rapidement l'incendie.")
)

stage("02", "vers 20h00", "Incendie de l'hôtel de ville",
      "Urgence en trois fronts : évacuer les habitants, éteindre les flammes et gérer le méphite. Montrer le chaos sans prolonger la scène une heure.",
      block("s02-incendie", "rencontre", "Incendie : trois fronts",
            "Les PJ font des choix entre évacuation, lutte contre l'incendie et affrontement. Il ne s'agit pas seulement d'un combat.",
            reference="Brèchemur — hôtel de ville"),
      block("s02-mephite", "rencontre", "Méphite de feu invoqué",
            "Un méphite de feu a été invoqué pendant l'incendie ; faire sentir sa présence pendant le sauvetage et l'extinction.",
            reference="Méphite de feu"),
      block("s02-calmont", "personnage", "Calmont",
            "Apprenti halfelin de Voz Lirayne. Il a provoqué l'incendie puis fuit vers Hellknight Hill / Altaerein ; il doit être capturé vivant si possible.",
            name="Calmont", portraitUrl="", showName=True),
      block("s02-parchemin", "loot", "Parchemin de Convocation d'élémentaire (rang 2)",
            "Déjà dans l'inventaire de Calmont dans Foundry, cohérent avec l'incendie. Objet porté : ne pas le déplacer comme loot de salle.",
            quantity="1"),
      block("s02-mission", "checklist", "Laisser des indices de l'origine criminelle",
            "La scène d'après-incendie doit permettre aux témoins de relier Calmont à l'incendie et à sa fuite.")
)

stage("03", "20h30–21h00", "Après-incendie — Piste Calmont",
      "Interroger les témoins. Mission fusionnée : retrouver les gobelins disparus ET ramener Calmont vivant. Préparer le départ vers Altaerein.",
      block("s03-temoins", "lore", "Témoignages sur Calmont",
            "Des témoins identifient Calmont comme responsable de l'incendie et le situent en fuite vers la Citadelle Altaerein.", secret=False),
      block("s03-mandat", "personnage", "Greta Gardania — Mandat",
            "Après l'incendie, la présidente du conseil mandate les héros pour sauver les gobelins et ramener Calmont vivant.",
            name="Greta Gardania", portraitUrl="", showName=True),
      block("s03-voz", "personnage", "Voz Lirayne (absente)",
            "Libraire de Brèchemur et maîtresse de Calmont ; elle n'intervient pas directement dans cette séance. Ne pas révéler ici ses liens nécromantiques.",
            npcId="npc_voz_lirayne", name="Voz Lirayne", showName=True),
      block("s03-depart", "checklist", "Donner l'objectif clair",
            "Les joueurs doivent comprendre les deux enjeux : gobelins à sauver et fugitif à capturer.")
)

stage("04", "vers 21h00", "Citadelle Altaerein — Première impression",
      "Ancienne forteresse Hellknight abandonnée. Le lore principal de la soirée est celui des Chevaliers de l'Enfer et d'Isger, PAS l'Anneau d'Alseta.",
      block("s04-a1", "texte", "A1 — Entrée / foyer (garder, ~5 min)",
            "Symboles de l'Ordre du Clou : première lecture de l'ancienne forteresse."),
      block("s04-hellknights", "lore", "Chevaliers de l'Enfer",
            "Ordres militaires issus de la tradition chélaxienne. Ils privilégient l'ordre, la loi et la discipline, parfois par des méthodes dures. Chaque ordre définit ses menaces prioritaires. Vecteurs : A1, A6, A8, surtout Alak.", secret=False),
      block("s04-ordreclou", "lore", "Ordre du Clou",
            "L'ordre qui occupait Altaerein combat ce qu'il considère comme la sauvagerie et cherche à imposer la civilisation, la discipline et la loi. Vecteurs : insignes, symboles du Clou, Alak.", secret=False),
      block("s04-isger", "lore", "Isger",
            "Petit royaume encore vassal de Cheliax à l'époque de la campagne ; territoire frontalier marqué par les guerres gobelines et l'influence chélaxienne. À introduire via archives ou contexte historique.", secret=False),
      block("s04-ravounel", "lore", "Ravounel — Si la politique arrive en discussion",
            "Ravounel s'est séparé de Cheliax alors que ce dernier affrontait notamment la Glorieuse Réclamation et la rébellion de Kintargo. Facultatif ce soir.", secret=False)
)

stage("05", "21h10–21h35", "A10 — Alak Stagram et les diablotins",
      "Mini-combat bref puis dialogue. Moment clef de Sashka : l'armure d'Alak appartient à la même tradition que celle portée par Vidoc.",
      block("s05-alak", "personnage", "Alak Stagram",
            "Armiger de l'Ordre du Clou. Il vient récupérer la chevalière familiale de ses parents. Excellent vecteur pour expliquer les Hellknights ; encore aspirant, pas chef.",
            npcId="npc_alak_stagram", name="Alak Stagram", showName=True),
      block("s05-diablotins", "rencontre", "Deux diablotins à affronter",
            "Alak vient d'en tuer un ; deux autres attaquent. Petits fiends ailés, venimeux, rusés, capables d'invisibilité. Combat court.",
            reference="A10 — salle d'épreuve"),
      block("s05-armiger", "lore", "Armiger",
            "Aspirant Hellknight encore en formation : Alak est un jeune membre, pas un dirigeant. Vecteurs : A8 / A10 et la discussion.", secret=False),
      block("s05-test", "lore", "Test Hellknight",
            "Un aspirant doit notamment faire ses preuves contre des fiends. Les diablotins de la salle d'épreuve illustrent directement cette culture. Vecteurs : A9 / A10.", secret=False),
      block("s05-sashka", "lore", "SECRET MJ — Sashka, Vidoc, même tradition d'armure",
            "Laisser Sashka reconnaître la tradition d'armure de l'homme rencontré autrefois. Alak lui révèle seulement le mot « Hellknight ». Ne révéler ni l'ordre ni le rang de Toulon Vidoc. Plus tard : Vidoc est Lictor de l'Ordre du Fléau.", secret=True),
      block("s05-loot", "loot", "A10 — Trésor",
            "5 pa, 40 pc, parchemin d'Alarme, parchemin de Terreur. Vérifier le loot déjà placé dans Foundry ; ne pas inventer d'attribution aux PJ.",
            quantity="5 pa · 40 pc · 2 parchemins"),
      block("s05-sashka-check", "checklist", "Payoff Sashka : le mot « Hellknight »",
            "La reconnaissance de l'armure fonctionne sans spoiler le rang et l'ordre de Vidoc.")
)

stage("06", "21h35–22h15", "Exploration ciblée — Histoire des Hellknights",
      "Deux ou trois lieux maximum. Éviter le nettoyage salle par salle. À 22h15–22h30 au plus tard, les PJ doivent progresser vers la cour du grauladon puis les remparts ; résumer le reste en narration.",
      block("s06-a6", "texte", "A6 — Auditorium",
            "Insignes d'armiger et indication vers le conflit. GARDER seulement si sur le chemin ; lore rapide."),
      block("s06-a8", "texte", "A8 — Entraînement",
            "Montrer la formation des armigers ; 5 minutes maximum. Bon prétexte pour expliquer les aspirants Hellknights."),
      block("s06-a9", "texte", "A9 — Matériel de l'épreuve",
            "Matériel rituel du test Hellknight. Garder si passage vers A10."),
      block("s06-a13", "texte", "A13 — Cour du Clou (facultatif)",
            "Ancien lieu de justice. Excellent vecteur pour expliquer le rôle concret des Hellknights en Isger."),
      block("s06-a16", "texte", "A16 — Bureau du Lictor (plutôt plus tard)",
            "Ancien bureau du chef local ; lien possible avec Alak. Ne pas forcer sauf exploration spontanée."),
      block("s06-a18a20", "texte", "A18 / A20 — Archives et droit",
            "Ne prendre qu'UNE seule des deux pièces et condenser l'histoire du Clou et d'Altaerein en 5–10 minutes."),
      block("s06-a21", "texte", "A21 — Cellules / casiers",
            "Justice Hellknight et gros loot. Bon si les PJ passent ; ne pas forcer le détour."),
      block("s06-origine", "lore", "Altaerein — Ancien quartier général",
            "La citadelle fut le premier quartier général de l'Ordre du Clou. Elle a ensuite été déclassée lorsque l'ordre a grandi et installé un centre plus important en Varisie : Citadelle Vraid. Une présence résiduelle a subsisté puis Altaerein fut abandonnée. Vecteurs : A18/A20, Alak, architecture.", secret=False),
      block("s06-depart", "lore", "Pourquoi les Hellknights ont quitté Altaerein",
            "Ils n'ont pas été chassés : l'ordre a grandi et trouvé un meilleur centre d'opérations. Expliquer via documents ou Alak.", secret=False),
      block("s06-jeunes-wargs", "rencontre", "Jeunes wargs — Dilemme facultatif",
            "Loups intelligents, notoirement malveillants, capables de parler. L'adulte a été tué par le grauladon. Les jeunes constituent un choix moral, pas une rencontre obligatoire.",
            reference="Citadelle — zone des wargs"),
      block("s06-loot-a6", "loot", "A6 — Insignes d'armiger de l'Ordre du Clou",
            "Avant tout une récompense de lore.", quantity="Insignes"),
      block("s06-loot-a7", "loot", "A7 — Rations et dague en argent",
            "Objets placés dans Foundry, à récolter seulement si la zone est visitée.", quantity="Rations + 1 dague en argent"),
      block("s06-loot-a8", "loot", "A8 — Pièces dans les mannequins",
            "20 pa cachés dans les mannequins d'entraînement.", quantity="20 pa"),
      block("s06-loot-a9", "loot", "A9 — Épée, pièces et Main du mage",
            "Épée longue en argent, 31 pa, sort Main du mage.", quantity="1 épée longue en argent · 31 pa · Main du mage"),
      block("s06-loot-a17", "loot", "A17 — Potions de soins mineures",
            "Deux potions de soins mineures.", quantity="2"),
      block("s06-loot-a19", "loot", "A19 — Fournitures et griffe d'ours-hibou",
            "Six nécessaires d'écriture, griffe d'ours-hibou legacy.", quantity="6 nécessaires · 1 griffe"),
      block("s06-loot-a21", "loot", "A21 — Armes, élixirs, objets et parchemin",
            "Fléau, marteau léger, masse, morgenstern en argent ; quatre élixirs de vision dans le noir ; Chat de jade ; élixir de guépard ; Cristal de puissance ; parchemin de Barrage de force.",
            quantity="4 armes · 4 élixirs de vision · Chat de jade · élixir de guépard · Cristal de puissance · parchemin"),
      block("s06-convention", "texte", "Convention Foundry — Loot",
            "Objet porté = inventaire du PNJ ; objet caché dans une pièce = Actor Loot caché aux joueurs, placé à l'emplacement. Les parchemins doivent contenir leur vrai sort, pas seulement une description."),
      block("s06-timing", "checklist", "Limiter l'exploration à 2–3 zones",
            "Réduire ou narrer les salles laissées de côté pour garder le grauladon et les remparts.")
)

stage("07", "22h15–22h50", "A12 — Cour et grauladon",
      "Combat principal du soir. Le grand prédateur a poursuivi les gobelins depuis les niveaux inférieurs ; le warg adulte est déjà mort, tué par lui.",
      block("s07-grauladon", "rencontre", "Grauladon (mud drake)",
            "Prédateur draconique de marais, grand, territorial et brutal, au souffle nauséabond. Il erre dans la cour ; c'est le VRAI combat majeur de la séance.",
            reference="A12 — cour"),
      block("s07-warg", "lore", "Warg adulte retrouvé mort",
            "Le warg adulte a été tué par le grauladon. Les jeunes wargs sont un dilemme facultatif.", secret=False),
      block("s07-secret", "lore", "SECRET MJ — Origine des deux grauladons",
            "Les Griffes de Cendre ont pénétré les niveaux inférieurs et ont envoyé deux grauladons en avant-garde. Les deux ont poursuivi les gobelins vers le haut ; l'un est mort dans l'effondrement, le survivant rôde dans la cour. Ne pas révéler le nom des Griffes de Cendre ce soir.", secret=True),
      block("s07-effondrement", "lore", "Accès effondré vers les profondeurs",
            "Les traces de l'attaque et l'accès effondré annoncent que le danger sous Altaerein est encore actif, sans révéler l'Anneau d'Alseta.", secret=False),
      block("s07-check", "checklist", "Conserver suffisamment de temps pour les remparts",
            "À la fin du combat, faire progresser vers A22 et Calmont.")
)

stage("08", "22h50–23h20", "A22 — Calmont et Helba : climax social",
      "Calmont retient Helba sur les remparts. Il croit les gobelins responsables de sa mésaventure, mais il est déjà isolé. Préférer négociation, diversion ou capture au combat de boss automatique.",
      block("s08-calmont", "personnage", "Calmont — Prise d'otage",
            "Fugitif halfelin. Il retient Helba et menace de la jeter du rempart ; le groupe doit le désarmer et le capturer vivant si possible.",
            name="Calmont", portraitUrl="", showName=True),
      block("s08-helba", "personnage", "Helba Bumblebrasher",
            "Cheffe des gobelins Bumblebrashers, prisonnière de Calmont sur les remparts ; à secourir.",
            name="Helba Bumblebrasher", portraitUrl="", showName=True),
      block("s08-gobelins", "lore", "Pourquoi les gobelins ont fui",
            "Les Bumblebrashers se sont enfuis des niveaux inférieurs après l'arrivée de deux grandes créatures draconiques. Ils s'étaient réfugiés plus haut ; l'un des prédateurs s'est effondré dans les profondeurs, l'autre rôdait dans la cour.",
            secret=False),
      block("s08-cache", "lore", "SECRET MJ — La véritable origine de la menace",
            "Les gobelins ne savent pas qui a envoyé ces créatures. Ce sont les Griffes de Cendre ; ne pas livrer ce nom. Ne pas présenter déjà l'Anneau d'Alseta ni le second arc.",
            secret=True),
      block("s08-tactique", "rencontre", "Négociation / diversion / capture",
            "L'objectif est de sauver Helba et ramener Calmont vivant ; l'affrontement n'est qu'une possibilité. Laisser les joueurs élaborer une manœuvre.",
            reference="A22 — remparts"),
      block("s08-calmont-loot", "loot", "Inventaire de Calmont",
            "Armes et parchemin de convocation portés par Calmont : doivent être récupérés sur sa personne, pas dans un coffre. Vérifier les objets exacts dans Foundry.",
            quantity="Inventaire porté"),
      block("s08-issue", "checklist", "Conclure le sauvetage et la capture",
            "Vérifier le sort de Helba et le devenir de Calmont ; ce sont les deux objectifs de la mission.")
)

stage("09", "23h20–23h30", "Conclusion — La citadelle est loin d'être vide",
      "Terminer sur un mystère : les profondeurs demeurent dangereuses. Ne pas lancer une exploration complète des niveaux inférieurs ce soir.",
      block("s09-gobelins", "lore", "Récit des gobelins",
            "Les gobelins ont été chassés vers les étages supérieurs par deux créatures draconiques venues d'en bas ; une a été ensevelie dans un effondrement, l'autre est le grauladon affronté dans la cour.",
            secret=False),
      block("s09-souterrains", "lore", "Annonce des niveaux inférieurs",
            "Les niveaux inférieurs de la citadelle restent à explorer ; quelque chose de plus grand est à l'œuvre. Éviter de révéler les secrets de l'Anneau d'Alseta.",
            secret=False),
      block("s09-fin", "checklist", "Checklist de fin",
            "Sauvetage de Helba ; Calmont capturé ou fuite notée ; remise en sécurité des gobelins ; loot récupéré/oublié ; décisions des PJ ; informations Hellknight apprises ; pistes reportées."),
      block("s09-suite", "checklist", "Reporter les étapes non jouées",
            "Les salles facultatives sautées et le loot non obtenu restent disponibles. Préparer la descente lors d'une séance suivante sans les déclarer joués.")
)

# Lore confidentiel spécifique à cette adaptation, distinct du jeu canonique.
stages[2]["blocks"].extend([
    block("s03-voz-secret", "lore", "SECRET MJ — Voz et la Voie des Murmures",
          "Dans cette adaptation, Voz Lirayne est liée à la Voie des Murmures, pas à Norgorber. Elle gravite autour d'une tradition nécromantique élargie ; elle n'est pas un agent direct du Tyran qui Murmure.", secret=True),
    block("s03-calmont-secret", "lore", "SECRET MJ — Pourquoi Calmont a choisi Altaerein",
          "Calmont ne s'est pas rendu à Altaerein par hasard : Voz s'intéresse à ce qui se trouve sous la citadelle. En séance 1, révéler seulement qu'il cherchait quelque chose ici.", secret=True),
])
stages[7]["blocks"].append(
    block("s08-helba-famille", "lore", "Helba, cousine plus âgée de Warbal",
          "Helba est la cheffe Bumblebrasher et la cousine plus âgée de Warbal ; elle peut expliquer comment les gobelins ont été chassés vers les remparts.", secret=False))
stages[8]["blocks"].append(
    block("s09-portails-secret", "lore", "SECRET MJ — Anneau d'Alseta et Labyrinthe de la Route Ouverte",
          "Le Labyrinthe de la Route Ouverte est le système général de mobilité de la campagne ouverte. L'Anneau d'Alseta garde son rôle canon indépendant ; ne pas révéler l'un ou l'autre en séance 1.", secret=True))

SUMMARY = (
  "Fiche MJ — Séance 1 (proposition, non jouée). Objectifs : appel à Brèchemur, incendie, "
  "sauver les Bumblebrashers, ramener Calmont vivant, ouvrir le mystère de Citadelle Altaerein. "
  "Fil rouge de lore : Hellknights, Ordre du Clou, armigers et tests (via Alak et Sashka). "
  "DANGER : ne pas révéler le rang/l'ordre de Toulon Vidoc, les Griffes de Cendre, ni l'Anneau d'Alseta. "
  "Rythme : deux ou trois salles ciblées, grauladon vers 22h15, remparts vers 22h50. "
  "Cette préparation provient du PDF fourni par le MJ ; les horaires sont indicatifs. "
  "Vérifier dans Foundry les inventaires, placements et éléments encore optionnels."
)

payload = {
  "title": TITLE, "campaignId": CAMPAIGN, "scenarioId": None, "sessionId": None,
  "body": {"summary": SUMMARY, "stages": stages},
}

def main():
    root = Path("/home/valou/services/lsr-nestjs-deploy/.env")
    env = dict(line.split("=", 1) for line in root.read_text().splitlines() if "=" in line and not line.lstrip().startswith("#"))
    key = env.get("PF2_SESSION_PREP_KEY", "")
    # The header is accepted by the old protected deployment; newer API versions ignore it.
    # The secret is never stored in the repository or printed.
    base = "http://127.0.0.1:3333/api/pf2-mj/session-preparations"
    headers = {"Content-Type": "application/json"}
    if key: headers["x-pf2-preparation-key"] = key
    with urlopen(Request(base, headers=headers), timeout=20) as response:
        existing = json.load(response)
    same = [item for item in existing if item.get("title") == TITLE and item.get("campaignId") == CAMPAIGN]
    if same:
        print("EXISTS: not overwriting existing preparation", same[0]["id"])
        return
    req = Request(base, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers=headers, method="POST")
    with urlopen(req, timeout=30) as response:
        created = json.load(response)
    print("CREATED:", created.get("id"), "TITLE:", created.get("title"))
    print("CAMPAIGN:", created.get("campaignId"), "STAGES:", len(created["body"]["stages"]),
          "BLOCKS:", sum(len(s["blocks"]) for s in created["body"]["stages"]),
          "REVISION:", created["revision"])
    print("SESSION:", created.get("sessionId"), "SOURCE: Age_des_Cendres_Seance_1_Fiche_MJ.pdf")

if __name__ == "__main__":
    main()
