import { DBApotheose } from '../../data/database/apotheoses/DBApotheose'
import { DBBloodline } from '../../data/database/bloodlines/DBBloodline'
import { DBCharacter } from '../../data/database/character/DBCharacter'
import { DBClasse } from '../../data/database/classes/DBClasse'
import { DBProficiency } from '../../data/database/proficiencies/DBProficiency'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { BattleState } from '../../domain/models/characters/BattleState'
import { Genre } from '../../domain/models/characters/Genre'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitCharacters {
  static getCharacters(
    skills: Map<string, DBSkill>,
    proficiencies: Map<string, DBProficiency>,
    apotheoses: Map<string, DBApotheose>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>
  ): DBCharacter[] {
    const roger = this.createCharacter({
      name: 'roger',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('terre'),
      chair: 10,
      esprit: 5,
      essence: 6,
      niveau: 20,
      lux: 'Gadgets',
      umbra: 'Peur de tuer ses camarades',
      secunda: 'Connaissances animales',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/959399143485354004/959930006463725669/roger.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689044605311647799/1006318155049734144/unknown.png',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1001499478131482624/unknown.png',
      playerName: 'arcady',
      skills: [skills.get('arbre')]
    })

    const millia = this.createCharacter({
      name: 'millia',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('ombre'),
      chair: 3,
      esprit: 6,
      essence: 8,
      niveau: 17,
      lux: 'Manipulatrice',
      umbra: 'Cigarette',
      secunda: 'Reseaux sociaux',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001477316070866994/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689044605311647799/1003654562365845564/unknown.png',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1001484678806634576/unknown.png',
      playerName: 'guilhem',
      skills: [skills.get('montre')]
    })

    const viktor = this.createCharacter({
      name: 'viktor',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('vent'),
      chair: 3,
      esprit: 8,
      essence: 10,
      niveau: 21,
      lux: 'Résistance mentale',
      umbra: 'Pipelette',
      secunda: 'Botaniste',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001476980056784966/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689106767031828580/1004051323680993400/unknown.png',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1003755046422462475/unknown.png',
      playerName: 'eric',
      dailyUseMax: { ['arpenteur']: 1 },
      skills: [
        skills.get('communication arcanique'),
        skills.get('boost arcanique'),
        skills.get('blocage arcanique'),
        skills.get('copie arcanique'),
        {
          ...skills.get('arpenteur'),
          arcaneCost: 0
        }
      ]
    })

    const judith = this.createCharacter({
      name: 'judith',
      classe: classes.get('champion arcanique'),
      bloodline: bloodlines.get('arbre'),
      chair: 3,
      esprit: 4,
      essence: 5,
      niveau: 12,
      lux: 'Courage',
      umbra: 'Insouciance',
      secunda: 'Agilité',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001473966445166592/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689044605311647799/1003763200283660501/unknown.png',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1003763867932962956/unknown.png',
      playerName: 'elena',
      skills: [
        skills.get('Plante de soutien'),
        skills.get('Plante de combat'),
        skills.get('Plante de magie'),
        skills.get('Plante envahissante'),
        skills.get('Reco. naturelle'),
        skills.get('Lien naturel'),
        skills.get('Soulèvement de la Nature'),
        skills.get('Anim. de la Nature'),
        skills.get('Comm. avec la Nature'),
        skills.get('Voie des Arbres'),
        skills.get("Lien à l'Avatar")
      ]
    })

    const aurélien = this.createCharacter({
      name: 'aurélien',
      classe: classes.get('avatar'),
      bloodline: bloodlines.get('terreur'),
      chair: 4,
      esprit: 9,
      essence: 5,
      niveau: 14,
      lux: 'Protecteur',
      umbra: 'Imprudent',
      secunda: 'Connaissance de la rue',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/1016035628783243302/1089943901118402560/image.png?width=1050&height=1054',
      pictureApotheose:
        'https://media.discordapp.net/attachments/1016035628783243302/1089943093039603773/image.png?width=1084&height=960',
      background:
        'https://media.discordapp.net/attachments/1016035628783243302/1089943526072127669/image.png?width=2160&height=782',
      playerName: 'nico',
      skills: [
        { ...skills.get('sablier'), arcaneCost: 0 },
        { ...skills.get('illusioniste'), arcaneCost: 0 },
        { ...skills.get('diablotin'), arcaneCost: 0 },
        { ...skills.get('sorcière'), arcaneCost: 0 },
        { ...skills.get('forgeron'), arcaneCost: 0 },
        { ...skills.get('cheval'), arcaneCost: 0 },
        { ...skills.get('arbre'), arcaneCost: 0 },
        { ...skills.get('licorne'), arcaneCost: 0 },
        { ...skills.get('serpent'), arcaneCost: 0 },
        { ...skills.get('loup'), arcaneCost: 0 },
        { ...skills.get('ivrogne'), arcaneCost: 0 },
        { ...skills.get('erudit'), arcaneCost: 0 },
        { ...skills.get('fantome'), arcaneCost: 0 },
        { ...skills.get('faucon'), arcaneCost: 0 },
        { ...skills.get('mentaliste'), arcaneCost: 0 },
        { ...skills.get('amnesique'), arcaneCost: 0 },
        { ...skills.get('terreur'), arcaneCost: 0, dettesCost: 1 }
      ]
    })

    /* await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('illusioniste'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('sablier'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('diablotin'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('sorcière'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('forgeron'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('cheval'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('arbre'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('licorne'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('serpent'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('loup'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('ivrogne'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('erudit'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('fantome'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('faucon'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('terreur'),
      displayCategory: DisplayCategory.MAGIE,
      arcaneCost: 0,
      dettesCost: 1
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('mentaliste'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('amnesique'),
      limitationMax: 1,
      arcaneCost: 0
    })*/

    const pamuk = this.createCharacter({
      name: 'pamuk',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('feu'),
      chair: 5,
      esprit: 4,
      essence: 7,
      niveau: 16,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1003776173605658774/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const anastasia = this.createCharacter({
      name: 'anastasia',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('ombre'),
      chair: 7,
      esprit: 4,
      essence: 5,
      niveau: 15,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1003780008134844497/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const sumra = this.createCharacter({
      name: 'sumra',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('glace'),
      chair: 12,
      esprit: 7,
      essence: 3,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1003956879732519054/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const mahès = this.createCharacter({
      name: 'mahès',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('lycan'),
      chair: 12,
      esprit: 9,
      essence: 5,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://images-ext-2.discordapp.net/external/LCiRm0eJMZ-AAszTuy4sfk5UkXsOG1c7HyV5iGxTmyI/https/i.pinimg.com/originals/0b/8d/cd/0b8dcd8e21b986bbb1f93a739af895a8.jpg?width=954&height=1055',
      pictureApotheose:
        'https://images-ext-2.discordapp.net/external/LCiRm0eJMZ-AAszTuy4sfk5UkXsOG1c7HyV5iGxTmyI/https/i.pinimg.com/originals/0b/8d/cd/0b8dcd8e21b986bbb1f93a739af895a8.jpg?width=954&height=1055',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const fenrir = this.createCharacter({
      name: 'fenrir',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('lycan'),
      chair: 6,
      esprit: 12,
      essence: 7,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1003959897538445342/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689106767031828580/1003959897538445342/unknown.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const sirin = this.createCharacter({
      name: 'sirin',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('lycan'),
      chair: 6,
      esprit: 14,
      essence: 7,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1003963674282692628/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689106767031828580/1003963674282692628/unknown.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const euryale = this.createCharacter({
      name: 'euryale',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('aucun'),
      chair: 5,
      esprit: 7,
      essence: 15,
      niveau: 21,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1003970181661470730/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const sentence = this.createCharacter({
      name: 'sentence',
      classe: classes.get('champion arcanique'),
      bloodline: bloodlines.get('aucun'),
      chair: 7,
      esprit: 7,
      essence: 7,
      niveau: 3,
      lux: 'Enfant de Juge',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1003775078623879251/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const tara = this.createCharacter({
      name: 'tara',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('foudre'),
      chair: 7,
      esprit: 4,
      essence: 10,
      niveau: 20,
      lux: 'Archéologie',
      umbra: 'Nymphomanie',
      secunda: 'Cambrioleuse',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/959399143485354004/959486612390154361/tara.jpg',
      pictureApotheose:
        'https://media.discordapp.net/attachments/1016035628783243302/1072525104245907506/hermes_by_ninjart1st_d98161p-fullview.png',
      background: 'https://media.discordapp.net/attachments/689044605311647799/997930808969003098/unknown.png',
      playerName: 'nico'
    })

    const kyma = this.createCharacter({
      name: 'kyma',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('eau'),
      chair: 3,
      esprit: 9,
      essence: 6,
      niveau: 17,
      lux: 'Ingénieur',
      umbra: 'Naïf',
      secunda: 'Être bientôt mort',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001473529419669604/unknown.png',
      pictureApotheose: '',
      background:
        'https://images-ext-1.discordapp.net/external/aVlv9icrng_dulxPseBpALbyRRlEYaOCeAJKYdxmFCc/%3Ftable%3Dblock%26id%3D8e001995-05dd-413e-9163-1328fedaf0fa%26spaceId%3Da4f22bfa-739b-4835-89ff-43b3ef9f69f3%26width%3D600%26userId%3Dd28065db-d011-48fc-9e95-e1b89f7ea73d%26cache%3Dv2/https/www.notion.so/image/https%253A%252F%252Fs3-us-west-2.amazonaws.com%252Fsecure.notion-static.com%252F77840cc9-138b-4a1a-a35c-2a4ca1ec2871%252FKymaBG.jpg',
      playerName: 'guilhem'
    })

    /*dailyUse: {
      ['Mun. courantes']: 0,
        ['Mun. léthales']: 0,
        ['Mun. affaiblissantes']: 0,
        ['Mun. peste']: 0,
        ['Mun. marquage']: 0,
        ['Mun. dégénérative']: 0,
        ['Gr. fumigène']: 0,
        ['Gr. flash']: 0
    },*/

    const isycho = this.createCharacter({
      name: 'isycho',
      classe: classes.get('pacificateur'),
      bloodline: bloodlines.get('aucun'),
      chair: 11,
      esprit: 2,
      essence: 8,
      niveau: 22,
      lux: 'Casse cou',
      umbra: 'Paranoïa',
      secunda: 'Est admirée',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/959399143485354004/960119153887436800/Isycho.png',
      pictureApotheose:
        'https://media.discordapp.net/attachments/689034158307409933/1077311468678172692/isycho_apotheose.png',
      background: 'https://media.discordapp.net/attachments/689034158307409933/846816235157061672/bat2.jpg',
      playerName: 'guilhem',
      apotheoses: [apotheoses.get('Epée de Talos')]
    })

    const ayoub = this.createCharacter({
      name: 'ayoub',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('neige'),
      chair: 9,
      esprit: 5,
      essence: 7,
      niveau: 22,
      lux: 'Amitié avant tout',
      umbra: 'Synd. Post trauma',
      secunda: 'Stéganographie',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001475518643847248/unknown.png',
      pictureApotheose:
        'https://media.discordapp.net/attachments/689034158307409933/1082788605006729246/image.png?width=1028&height=1058',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1001499755354005524/unknown.png',
      playerName: 'eric',
      skills: [
        skills.get('juge'),
        skills.get('phoenix'),
        skills.get('balance'),
        skills.get('phoenix amélioré'),
        skills.get('juge amélioré'),
        skills.get('pokéball')
      ],
      dailyUse: {
        ['phoenix amélioré']: 1,
        ['juge amélioré']: 1
      },
      dailyUseMax: {
        ['phoenix amélioré']: 1,
        ['juge amélioré']: 1
      }
    })

    const roy = this.createCharacter({
      name: 'roy',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('ombre'),
      chair: 9,
      esprit: 7,
      essence: 6,
      niveau: 22,
      lux: 'Imaginatif',
      umbra: 'Bipolaire',
      secunda: 'Artiste',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001476768366088264/unknown.png',
      pictureApotheose: '',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1001506709442928772/unknown.png',
      playerName: 'elena'
    })

    const malkim = this.createCharacter({
      name: 'malkim',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('foudre'),
      chair: 9,
      esprit: 9,
      essence: 9,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1003775078623879251/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const canarticho = this.createCharacter({
      name: 'canarticho',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 3,
      esprit: 1,
      essence: 1,
      niveau: 6,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const jonathan = this.createCharacter({
      name: 'jonathan',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('lumière'),
      chair: 9,
      esprit: 2,
      essence: 8,
      niveau: 18,
      lux: 'Hyper social',
      umbra: 'Tendance psychopathe',
      secunda: 'Cuisinier hors pair',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001476340358328380/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689044605311647799/1006315258585034802/unknown.png',
      background:
        'https://media.discordapp.net/attachments/689044605311647799/1001506417561325568/unknown.png?width=2160&height=1021',
      playerName: 'valou'
    })

    const tibo = this.createCharacter({
      name: 'tibo',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('illithide'),
      chair: 4,
      esprit: 6,
      essence: 4,
      niveau: 14,
      lux: 'Digne de confiance',
      umbra: 'Claustrophobe',
      secunda: 'Être bientôt mort',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1006318594168213564/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689044605311647799/1006318064645722112/unknown.png',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1006318822522880040/unknown.png',
      playerName: 'florent'
    })

    const johnlecorrompu = this.createCharacter({
      name: 'john le corrompu',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 2,
      essence: 2,
      niveau: 1,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const lucien = this.createCharacter({
      name: 'lucien',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('feu'),
      chair: 3,
      esprit: 9,
      essence: 7,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1006612551217455275/1006619442194677890/07_-_Lucien__co.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const atès = this.createCharacter({
      name: 'atès',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('feu'),
      chair: 3,
      esprit: 2,
      essence: 9,
      niveau: 10,
      lux: 'Compétitive',
      umbra: 'Mauvaise perdante',
      secunda: 'Forte en dessin',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1007343083463135252/unknown.png',
      pictureApotheose:
        'https://media.discordapp.net/attachments/1008780709214830632/1054348582024654908/image.png?width=1056&height=1056',
      background: 'https://media.discordapp.net/attachments/689044605311647799/997931629525880845/unknown.png',
      playerName: 'eric'
    })

    const rafael = this.createCharacter({
      name: 'rafael',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('troglodyte'),
      chair: 5,
      esprit: 3,
      essence: 3,
      niveau: 7,
      lux: '',
      umbra: 'Cafteur',
      secunda: 'Suiveur',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689106767031828580/1007342575696490518/unknown.png',
      pictureApotheose: '',
      background: 'https://media.discordapp.net/attachments/689106767031828580/1007344709930336256/unknown.png',
      playerName: ''
    })

    const diablotin = this.createCharacter({
      name: 'diablotin',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 6,
      essence: 4,
      niveau: 15,
      lux: 'Mignon',
      umbra: 'Ne fait pas le boulot par lui même',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: 'https://media.discordapp.net/attachments/1008780709214830632/1054347849778868224/image.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const yehudahleib = this.createCharacter({
      name: 'yehudah-leib',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('terre'),
      chair: 4,
      esprit: 9,
      essence: 8,
      niveau: 18,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1007379191634874468/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const nounours = this.createCharacter({
      name: 'nounours',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 7,
      esprit: 2,
      essence: 7,
      niveau: 10,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1007380574073270373/unknown.png?width=1080&height=1056',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const gertrude = this.createCharacter({
      name: 'gertrude',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('eau'),
      chair: 2,
      esprit: 6,
      essence: 12,
      niveau: 19,
      lux: 'Connaissance occulte',
      umbra: 'Connaissance occulte',
      secunda: 'Globe-trotteuse',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001475877944692756/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1008780709214830632/1008781246433853450/unknown.png',
      background: 'https://media.discordapp.net/attachments/1008780709214830632/1008780732631617566/unknown.png',
      playerName: 'david'
    })

    const kalis = this.createCharacter({
      name: 'kalis',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('naga'),
      chair: 6,
      esprit: 6,
      essence: 6,
      niveau: 17,
      lux: 'Curieuse (Soif de connaissance)',
      umbra: 'Religieuse (Dionysos est le createur)',
      secunda: 'Sororité',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001476595934056588/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1008780709214830632/1008783630912475268/unknown.png',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1001513353547624570/unknown.png',
      playerName: 'david'
    })

    const john = this.createCharacter({
      name: 'john',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('aucun'),
      chair: 10,
      esprit: 5,
      essence: 3,
      niveau: 17,
      lux: 'Policier',
      umbra: 'Ancien alcoolique',
      secunda: 'Va bientôt perdre ses pouvoirs',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001479286856892466/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/689044605311647799/1001512108514627715/unknown.png?width=1876&height=1055',
      playerName: 'david'
    })

    const mathieu = this.createCharacter({
      name: 'mathieu',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('lumière'),
      chair: 3,
      esprit: 3,
      essence: 15,
      niveau: 22,
      lux: 'Passion des chiffres',
      umbra: 'Intellect avant la moral',
      secunda: 'Théatre amateur',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/959399143485354004/960187732720746516/mathieu.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1008780709214830632/1009121826049368114/unknown.png',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1001506344483946617/unknown.png',
      playerName: 'tom'
    })

    const rain = this.createCharacter({
      name: 'rain',
      classe: classes.get('arcaniste'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 3,
      essence: 15,
      niveau: 15,
      lux: 'Caméléon social',
      umbra: 'Anti-magie non arcanique',
      secunda: 'Historien',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001476542318260334/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/1008780709214830632/1008785940661145720/unknown.png?width=2160&height=561',
      playerName: 'tom'
    })

    const akira = this.createCharacter({
      name: 'akira',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('lycan'),
      chair: 5,
      esprit: 20,
      essence: 10,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1009196453454942248/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689034158307409933/1009206181459402772/unknown.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const polem = this.createCharacter({
      name: 'polem',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('eau'),
      chair: 12,
      esprit: 9,
      essence: 5,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1024386655316095076/unknown.png?width=1534&height=1055',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const deirdre = this.createCharacter({
      name: 'deirdre',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('feu'),
      chair: 2,
      esprit: 5,
      essence: 13,
      niveau: 21,
      lux: 'Intelligence méthodique',
      umbra: "Folie d'Ifrit",
      secunda: 'Biologiste',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/959399143485354004/959783587920617532/deirdre.png',
      pictureApotheose:
        'https://media.discordapp.net/attachments/734153794681700394/1000802351663284224/unknown.png?width=1096&height=1055',
      background: 'https://media.discordapp.net/attachments/689044605311647799/997931629525880845/unknown.png',
      playerName: 'jupi'
    })

    const oleg = this.createCharacter({
      name: 'oleg',
      classe: classes.get('parolier'),
      bloodline: bloodlines.get('aucun'),
      chair: 4,
      esprit: 8,
      essence: 2,
      niveau: 11,
      lux: 'Stratège',
      umbra: "N'aime pas le monde des humains (et les Rois)",
      secunda: 'Patient',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001477531070898188/unknown.png',
      pictureApotheose: '',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1001497985596796928/unknown.png',
      playerName: 'jupi'
    })

    const nautilus = this.createCharacter({
      name: 'nautilus',
      classe: classes.get('roi'),
      bloodline: bloodlines.get('eau'),
      chair: 6,
      esprit: 12,
      essence: 10,
      niveau: 50,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1008780709214830632/1016702430089588768/unknown.png',
      pictureApotheose: '',
      background:
        'https://images-ext-1.discordapp.net/external/aVlv9icrng_dulxPseBpALbyRRlEYaOCeAJKYdxmFCc/%3Ftable%3Dblock%26id%3D8e001995-05dd-413e-9163-1328fedaf0fa%26spaceId%3Da4f22bfa-739b-4835-89ff-43b3ef9f69f3%26width%3D600%26userId%3Dd28065db-d011-48fc-9e95-e1b89f7ea73d%26cache%3Dv2/https/www.notion.so/image/https%253A%252F%252Fs3-us-west-2.amazonaws.com%252Fsecure.notion-static.com%252F77840cc9-138b-4a1a-a35c-2a4ca1ec2871%252FKymaBG.jpg',
      playerName: 'david'
    })

    const béhémot = this.createCharacter({
      name: 'béhémot',
      classe: classes.get('roi'),
      bloodline: bloodlines.get('terre'),
      chair: 30,
      esprit: 30,
      essence: 30,
      niveau: 50,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1016704110994665541/unknown.png',
      pictureApotheose: '',
      background: 'https://media.discordapp.net/attachments/689044605311647799/1001499478131482624/unknown.png',
      playerName: ''
    })

    const bélial = this.createCharacter({
      name: 'bélial',
      classe: classes.get('roi'),
      bloodline: bloodlines.get('foudre'),
      chair: 20,
      esprit: 20,
      essence: 20,
      niveau: 50,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1016708028646576169/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const gabriel = this.createCharacter({
      name: 'gabriel',
      classe: classes.get('roi'),
      bloodline: bloodlines.get('lumière'),
      chair: 20,
      esprit: 20,
      essence: 20,
      niveau: 50,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1016717576681824326/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const lucifer = this.createCharacter({
      name: 'lucifer',
      classe: classes.get('roi'),
      bloodline: bloodlines.get('ombre'),
      chair: 20,
      esprit: 20,
      essence: 20,
      niveau: 50,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1016718948793864282/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const radhamantes = this.createCharacter({
      name: 'radhamantes',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('foudre'),
      chair: 15,
      esprit: 5,
      essence: 5,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1016736531303628850/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const kévin = this.createCharacter({
      name: 'kévin',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('vent'),
      chair: 4,
      esprit: 2,
      essence: 11,
      niveau: 16,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1017321603543085107/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const vernet = this.createCharacter({
      name: 'vernet',
      classe: classes.get('soldat'),
      bloodline: bloodlines.get('aucun'),
      chair: 5,
      esprit: 4,
      essence: 6,
      niveau: 9,
      munitionsMax: 10,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1017472997008879687/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/1016035628783243302/1017473535628808272/unknown.png?width=2160&height=966',
      playerName: 'florent',
      dailyUse: {
        ['Mun. courantes']: 0,
        ['Mun. léthales']: 0,
        ['Mun. affaiblissantes']: 0,
        ['Mun. peste']: 0,
        ['Mun. marquage']: 0,
        ['Mun. dégénérative']: 0,
        ['Gr. fumigène']: 0,
        ['Gr. flash']: 0
      },
      skills: [
        skills.get('Bras Robotique'),
        skills.get('Oeil Bionique'),
        skills.get('Mun. courantes'),
        skills.get('Mun. léthales'),
        skills.get('Mun. affaiblissantes'),
        skills.get('Mun. peste'),
        skills.get('Mun. marquage'),
        skills.get('Mun. dégénérative'),
        skills.get('Gr. fumigène'),
        skills.get('Gr. flash')
      ]
    })

    const méduse = this.createCharacter({
      name: 'méduse',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('aucun'),
      chair: 5,
      esprit: 7,
      essence: 15,
      niveau: 21,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1021873210649751622/unknown.png?width=1002&height=1055',
      pictureApotheose:
        'https://media.discordapp.net/attachments/689034158307409933/1021873210649751622/unknown.png?width=1002&height=1055',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const ogresse = this.createCharacter({
      name: 'ogresse',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('troglodyte'),
      chair: 12,
      esprit: 3,
      essence: 7,
      niveau: 18,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1021872552076923010/unknown.png?width=858&height=1056',
      pictureApotheose:
        'https://media.discordapp.net/attachments/689034158307409933/1021872552076923010/unknown.png?width=858&height=1056',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const lilou = this.createCharacter({
      name: 'lilou',
      classe: classes.get('dragon'),
      bloodline: bloodlines.get('aucun'),
      chair: 7,
      esprit: 5,
      essence: 9,
      niveau: 20,
      lux: 'Mentaliste',
      umbra: 'Addicte aux Arcanes Primes',
      secunda: 'Jet Set',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001478072031252602/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1008780709214830632/1029119025411801188/unknown.png',
      background: 'https://media.discordapp.net/attachments/1008780709214830632/1029117716965118065/unknown.png',
      playerName: 'florent'
    })

    const luperca = this.createCharacter({
      name: 'luperca',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('lycan'),
      chair: 16,
      esprit: 5,
      essence: 5,
      niveau: 20,
      lux: 'Alpha',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1004120376453894254/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689034158307409933/1004120376453894254/unknown.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const anamada = this.createCharacter({
      name: 'anamada',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 5,
      esprit: 5,
      essence: 5,
      niveau: 9,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const amen = this.createCharacter({
      name: 'amen',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 3,
      esprit: 4,
      essence: 5,
      niveau: 7,
      lux: 'Discrétion',
      umbra: 'Obligation religieuse',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/734153794681700394/1054344356745719828/image.png',
      pictureApotheose:
        'https://images-ext-1.discordapp.net/external/xF-F77GTvWg_8oU-rxWsZvil1pCv1CG96stxVDDF6Nw/https/www.worldanvil.com/uploads/images/e84a0c14647b8078d9933d0c5ae14ca3.png',
      background: 'https://media.discordapp.net/attachments/734153794681700394/1054345572267610152/image.png',
      playerName: 'nico'
    })

    const jackfrost = this.createCharacter({
      name: 'jack frost',
      classe: classes.get('roi'),
      bloodline: bloodlines.get('glace'),
      chair: 2,
      esprit: 2,
      essence: 2,
      niveau: 2,
      lux: 'Joueur',
      umbra: "Peur d'être méchant",
      secunda: 'Imagination fertile',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/734153794681700394/1054344357139976212/image.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1008780709214830632/1054352357858754610/image.png',
      background: 'https://media.discordapp.net/attachments/1008780709214830632/1054352775347183618/image.png',
      playerName: 'jupi'
    })

    const petitdiablotin = this.createCharacter({
      name: 'petitdiablotin',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 4,
      esprit: 4,
      essence: 4,
      niveau: 3,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const galaad = this.createCharacter({
      name: 'galaad',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('foudre'),
      chair: 11,
      esprit: 3,
      essence: 5,
      niveau: 18,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1062448523506876486/image.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1016035628783243302/1062448523506876486/image.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const mordred = this.createCharacter({
      name: 'mordred',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('ombre'),
      chair: 7,
      esprit: 10,
      essence: 5,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1062449258948726874/image.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1016035628783243302/1062449258948726874/image.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'florent'
    })

    const lancelot = this.createCharacter({
      name: 'lancelot',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('lumière'),
      chair: 10,
      esprit: 4,
      essence: 9,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1062465459124977824/image.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689034158307409933/1062465459124977824/image.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'nico'
    })

    const rabican = this.createCharacter({
      name: 'rabican',
      classe: classes.get('arcaniste'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 2,
      essence: 8,
      niveau: 7,
      lux: 'Caméléon social',
      umbra: 'Anti-magie non arcanique',
      secunda: 'Historien',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001476542318260334/unknown.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/1008780709214830632/1008785940661145720/unknown.png?width=2160&height=561',
      playerName: 'tom'
    })

    const arthur = this.createCharacter({
      name: 'arthur',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('terre'),
      chair: 9,
      esprit: 9,
      essence: 9,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1062450761658802186/image.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1016035628783243302/1062450761658802186/image.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const léodagan = this.createCharacter({
      name: 'léodagan',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('foudre'),
      chair: 7,
      esprit: 4,
      essence: 9,
      niveau: 8,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1062450762074030150/image.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const caradoc = this.createCharacter({
      name: 'caradoc',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('feu'),
      chair: 6,
      esprit: 2,
      essence: 14,
      niveau: 8,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/1016035628783243302/1062450875471241217/image.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const mentaliste = this.createCharacter({
      name: 'mentaliste',
      classe: classes.get('avatar'),
      bloodline: bloodlines.get('aucun'),
      chair: 3,
      esprit: 10,
      essence: 2,
      niveau: 5,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const nathan = this.createCharacter({
      name: 'nathan',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('ombre'),
      chair: 4,
      esprit: 6,
      essence: 10,
      niveau: 16,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1065001676752298014/image.png?width=778&height=920',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const milliadiablo = this.createCharacter({
      name: 'millia-diablo',
      classe: classes.get('avatar'),
      bloodline: bloodlines.get('aucun'),
      chair: 3,
      esprit: 9,
      essence: 9,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1067577204889890846/Diablo_adulte.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const milliacortès = this.createCharacter({
      name: 'millia-cortès',
      classe: classes.get('spirite'),
      bloodline: bloodlines.get('aucun'),
      chair: 3,
      esprit: 7,
      essence: 10,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1067551979506770011/image.png?width=812&height=1054',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const milliapolem = this.createCharacter({
      name: 'millia-polem',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('eau'),
      chair: 16,
      esprit: 5,
      essence: 3,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1067558006520283216/image.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const milliarafael = this.createCharacter({
      name: 'millia-rafael',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('troglodyte'),
      chair: 18,
      esprit: 2,
      essence: 2,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1067546049306177687/image.png?width=848&height=1054',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const milliamaia = this.createCharacter({
      name: 'millia-maia',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('feu'),
      chair: 2,
      esprit: 1,
      essence: 18,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1067535787870126120/image.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const milliaakira = this.createCharacter({
      name: 'millia-akira',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('lycan'),
      chair: 6,
      esprit: 12,
      essence: 6,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1067527301039919204/Sun_Wukong_Akira.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const darkmillia = this.createCharacter({
      name: 'darkmillia',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('ombre'),
      chair: 8,
      esprit: 6,
      essence: 3,
      niveau: 15,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001477316070866994/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689044605311647799/1003654562365845564/unknown.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const darktara = this.createCharacter({
      name: 'darktara',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('foudre'),
      chair: 7,
      esprit: 10,
      essence: 4,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/959399143485354004/959486612390154361/tara.jpg',
      pictureApotheose:
        'https://media.discordapp.net/attachments/1016035628783243302/1072525104245907506/hermes_by_ninjart1st_d98161p-fullview.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const darkkhalis = this.createCharacter({
      name: 'darkkhalis',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('naga'),
      chair: 6,
      esprit: 6,
      essence: 5,
      niveau: 15,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001476595934056588/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1008780709214830632/1008783630912475268/unknown.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const darkmathieu = this.createCharacter({
      name: 'darkmathieu',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('lumière'),
      chair: 15,
      esprit: 5,
      essence: 5,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/959399143485354004/960187732720746516/mathieu.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/1008780709214830632/1009121826049368114/unknown.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const milliatouami = this.createCharacter({
      name: 'millia-touami',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('ombre'),
      chair: 8,
      esprit: 5,
      essence: 11,
      niveau: 20,
      lux: 'Elue des dragons',
      umbra: 'Solitaire',
      secunda: 'Ancienne esclave',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1095447733239828590/image.png?width=940&height=848',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const milliajohn = this.createCharacter({
      name: 'millia-john',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('glace'),
      chair: 9,
      esprit: 5,
      essence: 7,
      niveau: 20,
      lux: 'Boxeur',
      umbra: 'Pyromane',
      secunda: 'Entomophile',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1080962345196605581/image.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const inèsetco = this.createCharacter({
      name: 'inèsetco',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 4,
      esprit: 11,
      essence: 2,
      niveau: 3,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const naia = this.createCharacter({
      name: 'naia',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 4,
      esprit: 12,
      essence: 4,
      niveau: 9,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1082751194277085245/image.png?width=696&height=1054',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const camille = this.createCharacter({
      name: 'camille',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('vent'),
      chair: 7,
      esprit: 4,
      essence: 8,
      niveau: 15,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1089976547164835870/image.png?width=1072&height=1054',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'florent'
    })

    const emmanuel = this.createCharacter({
      name: 'emmanuel',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('feu'),
      chair: 4,
      esprit: 5,
      essence: 3,
      niveau: 3,
      lux: 'Riche',
      umbra: 'Cocainoman',
      secunda: 'Cosplayer',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/734153794681700394/1113360850233872454/image-13.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/734153794681700394/1113360850233872454/image-13.png',
      background: 'https://media.discordapp.net/attachments/734153794681700394/1113407894034063440/image.png',
      playerName: 'guest'
    })

    const jessica = this.createCharacter({
      name: 'jessica',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('terre'),
      chair: 8,
      esprit: 2,
      essence: 2,
      niveau: 3,
      lux: 'Résistance à la douleur',
      umbra: 'Bête',
      secunda: 'Chanceuse',
      //category: Category.PJ,
      genre: Genre.FEMME,
      picture: 'https://media.discordapp.net/attachments/734153794681700394/1113377013915463710/image.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/734153794681700394/1113377013915463710/image.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1113412089571180605/image.png?width=958&height=286',
      playerName: 'guest'
    })

    const jean = this.createCharacter({
      name: 'jean',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('vent'),
      chair: 4,
      esprit: 4,
      essence: 4,
      niveau: 2,
      lux: 'Influenceur',
      umbra: 'Conspirationiste',
      secunda: 'Archéologie',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/734153794681700394/1113407034017189918/image.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/734153794681700394/1113407034017189918/image.png',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1113408145096716379/1259274-illuminati.png',
      playerName: 'guest'
    })

    const mickael = this.createCharacter({
      name: 'mickael',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('ombre'),
      chair: 4,
      esprit: 3,
      essence: 5,
      niveau: 2,
      lux: 'Artiste (raté)',
      umbra: 'Rêveur excessif',
      secunda: 'Hackeur',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/734153794681700394/1113360850858803220/image-12.png?width=882&height=1058',
      pictureApotheose:
        'https://media.discordapp.net/attachments/734153794681700394/1113360850858803220/image-12.png?width=882&height=1058',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1113412699368464485/image.png?width=1268&height=408',
      playerName: 'guest'
    })

    const dryade = this.createCharacter({
      name: 'dryade',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 5,
      esprit: 7,
      essence: 6,
      niveau: 7,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const héra = this.createCharacter({
      name: 'héra',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 7,
      esprit: 9,
      essence: 16,
      niveau: 9,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1105590402532261888/image.png?width=702&height=1054',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const isychoub = this.createCharacter({
      name: 'isychoub',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 20,
      esprit: 2,
      essence: 7,
      niveau: 15,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'eric'
    })

    const marceline = this.createCharacter({
      name: 'marceline',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 4,
      essence: 4,
      niveau: 5,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.FEMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1106950196090380369/image.png?width=808&height=748',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const maire = this.createCharacter({
      name: 'maire',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 3,
      esprit: 0,
      essence: 8,
      niveau: 11,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const alexandre = this.createCharacter({
      name: 'alexandre',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 6,
      esprit: 2,
      essence: 2,
      niveau: 0,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const grolem = this.createCharacter({
      name: 'grolem',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 15,
      esprit: 2,
      essence: 2,
      niveau: 14,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const gustav = this.createCharacter({
      name: 'gustav',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 2,
      essence: 2,
      niveau: 1,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1118245290315624539/Gustav.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'nico'
    })

    const henrik = this.createCharacter({
      name: 'henrik',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 2,
      essence: 2,
      niveau: 2,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689034158307409933/1118245290940584086/Henrik.png',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'guilhem'
    })

    const ingrid = this.createCharacter({
      name: 'ingrid',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 2,
      essence: 2,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1118245291552952380/ingrid.png?width=664&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'david'
    })

    const lars = this.createCharacter({
      name: 'lars',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 2,
      essence: 2,
      niveau: 9,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1118245291833958472/Lars.png?width=742&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'elena'
    })

    const astrid = this.createCharacter({
      name: 'astrid',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 2,
      esprit: 2,
      essence: 2,
      niveau: 14,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1118245292169506856/Astrid.png?width=962&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'eric'
    })

    const directeur = this.createCharacter({
      name: 'directeur',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 3,
      esprit: 3,
      essence: 3,
      niveau: 12,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture: '',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const cortès = this.createCharacter({
      name: 'cortès',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('lumière'),
      chair: 3,
      esprit: 6,
      essence: 11,
      niveau: 19,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PJ,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1116445523587633202/image.png?width=814&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: 'david'
    })

    const mendel = this.createCharacter({
      name: 'mendel',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 20,
      esprit: 2,
      essence: 6,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1123351465730256896/image.png?width=968&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const alséides = this.createCharacter({
      name: 'alséides',
      classe: classes.get('avatar'),
      bloodline: bloodlines.get('aucun'),
      chair: 4,
      esprit: 6,
      essence: 4,
      niveau: 15,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ALLY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1128039716181262547/image.png?width=726&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const ouranos = this.createCharacter({
      name: 'ouranos',
      classe: classes.get('corrompu'),
      bloodline: bloodlines.get('aucun'),
      chair: 15,
      esprit: 15,
      essence: 15,
      niveau: 4,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/689034158307409933/1130595210234183700/image.png?width=700&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const rat = this.createCharacter({
      name: 'rat',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 4,
      esprit: 6,
      essence: 5,
      niveau: 10,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877922617069578/rat.jpg?width=942&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const buffle = this.createCharacter({
      name: 'buffle',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 10,
      esprit: 3,
      essence: 2,
      niveau: 13,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877921413316618/buffle.png?width=862&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const tigre = this.createCharacter({
      name: 'tigre',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 4,
      esprit: 7,
      essence: 4,
      niveau: 5,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877922084392990/tigre.jpg?width=848&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const lapin = this.createCharacter({
      name: 'lapin',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 5,
      esprit: 5,
      essence: 5,
      niveau: 11,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877921740455997/lapin.jpg?width=862&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const serpent = this.createCharacter({
      name: 'serpent',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 3,
      esprit: 4,
      essence: 8,
      niveau: 7,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877933811683388/serpent.png?width=1046&height=1058',

      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const chat = this.createCharacter({
      name: 'chat',
      classe: classes.get('inconnu'),
      bloodline: bloodlines.get('aucun'),
      chair: 3,
      esprit: 9,
      essence: 3,
      niveau: 16,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877934210125844/chat.png?width=1094&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const singe = this.createCharacter({
      name: 'singe',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 4,
      esprit: 6,
      essence: 5,
      niveau: 2,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877920729645137/singe.jpg?width=918&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const coq = this.createCharacter({
      name: 'coq',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 5,
      esprit: 5,
      essence: 5,
      niveau: 8,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877920377311232/coq.jpg?width=748&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const chien = this.createCharacter({
      name: 'chien',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 7,
      esprit: 4,
      essence: 4,
      niveau: 1,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877921040011376/chien.jpg?width=818&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const cochon = this.createCharacter({
      name: 'cochon',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 11,
      esprit: 2,
      essence: 2,
      niveau: 17,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877920071122965/cochon.jpg?width=938&height=1058',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const cheval = this.createCharacter({
      name: 'cheval',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 3,
      esprit: 3,
      essence: 9,
      niveau: 10,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.HOMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877919760760914/cheval.jpg?width=700&height=956',
      pictureApotheose: '',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const dragon = this.createCharacter({
      name: 'dragon',
      classe: classes.get('rejete'),
      bloodline: bloodlines.get('lycan'),
      chair: 8,
      esprit: 8,
      essence: 8,
      niveau: 20,
      lux: '',
      umbra: '',
      secunda: '',
      //category: Category.PNJ_ENNEMY,
      genre: Genre.FEMME,
      picture:
        'https://media.discordapp.net/attachments/690902358057680897/1114877922319286364/mercenaire.jpeg?width=846&height=1058',
      pictureApotheose:
        'https://media.discordapp.net/attachments/690902358057680897/1114877933539041280/dragon.jpg?width=1058&height=1058',
      background:
        'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936',
      playerName: ''
    })

    const newCharacters = [
      roger,
      millia,
      viktor,
      judith,
      aurélien,
      pamuk,
      anastasia,
      sumra,
      mahès,
      fenrir,
      sirin,
      euryale,
      sentence,
      tara,
      kyma,
      isycho,
      ayoub,
      roy,
      malkim,
      canarticho,
      jonathan,
      tibo,
      johnlecorrompu,
      lucien,
      atès,
      rafael,
      diablotin,
      yehudahleib,
      nounours,
      gertrude,
      kalis,
      john,
      mathieu,
      rain,
      akira,
      polem,
      deirdre,
      oleg,
      nautilus,
      béhémot,
      bélial,
      gabriel,
      lucifer,
      radhamantes,
      kévin,
      vernet,
      méduse,
      ogresse,
      lilou,
      luperca,
      anamada,
      amen,
      jackfrost,
      petitdiablotin,
      galaad,
      mordred,
      lancelot,
      rabican,
      arthur,
      léodagan,
      caradoc,
      mentaliste,
      nathan,
      milliadiablo,
      milliacortès,
      milliapolem,
      milliarafael,
      milliamaia,
      milliaakira,
      darkmillia,
      darktara,
      darkkhalis,
      darkmathieu,
      milliatouami,
      milliajohn,
      inèsetco,
      naia,
      camille,
      emmanuel,
      jessica,
      jean,
      mickael,
      dryade,
      héra,
      isychoub,
      marceline,
      maire,
      alexandre,
      grolem,
      gustav,
      henrik,
      ingrid,
      lars,
      astrid,
      directeur,
      cortès,
      mendel,
      alséides,
      ouranos,
      rat,
      buffle,
      tigre,
      lapin,
      serpent,
      chat,
      singe,
      coq,
      chien,
      cochon,
      cheval,
      dragon
    ]
    return newCharacters
  }
  static createCharacter(p: {
    name: string
    classe: DBClasse
    bloodline: DBBloodline
    chair: number
    esprit: number
    essence: number
    niveau: number
    pvMax?: number
    pfMax?: number
    ppMax?: number
    lux?: string
    umbra?: string
    secunda?: string
    arcanesMax?: number
    munitionsMax?: number
    //category: Category
    genre: Genre
    picture?: string
    pictureApotheose?: string
    background?: string
    playerName?: string
    skills?: DBSkill[]
    apotheoses?: DBApotheose[]
    proficiencies?: DBProficiency[]
    dailyUse?: { [skillName: string]: number }
    dailyUseMax?: { [skillName: string]: number }
  }): DBCharacter {
    const newCharacter = new DBCharacter()
    newCharacter.name = p.name
    newCharacter.classe = p.classe
    newCharacter.classeName = p.classe.name
    newCharacter.bloodline = p.bloodline
    newCharacter.bloodlineName = p.bloodline.name
    newCharacter.chair = p.chair
    newCharacter.esprit = p.esprit
    newCharacter.essence = p.essence
    newCharacter.niveau = p.niveau
    newCharacter.munitionsMax = p.munitionsMax || 0
    // eslint-disable-next-line no-magic-numbers
    newCharacter.pvMax = p.pvMax || p.chair * 2
    // eslint-disable-next-line no-magic-numbers
    newCharacter.pfMax = p.pfMax || p.esprit
    // eslint-disable-next-line no-magic-numbers
    newCharacter.ppMax = p.ppMax || p.essence
    newCharacter.pv = newCharacter.pvMax
    newCharacter.pf = newCharacter.pfMax
    newCharacter.pp = newCharacter.ppMax
    newCharacter.lux = p.lux || ''
    newCharacter.umbra = p.umbra || ''
    newCharacter.secunda = p.secunda || ''
    // eslint-disable-next-line no-magic-numbers
    newCharacter.arcanesMax = p.arcanesMax || 3
    newCharacter.arcanes = newCharacter.arcanesMax
    newCharacter.genre = p.genre
    newCharacter.picture = p.picture || ''
    newCharacter.pictureApotheose = p.pictureApotheose || ''
    newCharacter.background = p.background || ''
    newCharacter.playerName = p.playerName || ''
    newCharacter.battleState = BattleState.NONE
    newCharacter.skills = p.skills || []
    newCharacter.apotheoses = p.apotheoses || []
    newCharacter.proficiencies = p.proficiencies || []
    newCharacter.dailyUse = p.dailyUse || {}
    newCharacter.dailyUseMax = p.dailyUseMax || {}
    return newCharacter
  }
}
