import { Message } from '../domain/models/elena/Message'
import { PlayState } from '../domain/models/elena/PlayState'
import { ScenarioCategory } from '../domain/models/elena/ScenarioCategory'
import { ConstellationService } from '../domain/services/entities/elena/ConstellationService'
import { JoueuseService } from '../domain/services/entities/elena/JoueuseService'
import { MessageService } from '../domain/services/entities/elena/MessageService'
import { ScenarioService } from '../domain/services/entities/elena/ScenarioService'
import { Agent } from '@forestadmin/agent'

export const forestAdminElena = (p: {
  agent: Agent
  scenarioService: ScenarioService
  constellationsService: ConstellationService
  joueuseService: JoueuseService
  messageService: MessageService
}): void => {
  p.agent.customizeCollection('Joueuse', (collectionCustomizer) => {
    collectionCustomizer.addAction('Sponsor', {
      scope: 'Global',
      form: [],
      execute: async (context) => {
        const starStream = (await p.constellationsService.findAll()).find((constellation) => constellation.isStarStream)

        await p.joueuseService.update({
          joueuseName: 'éléna',
          joueuse: {
            sponsorToChoose: true
          }
        })
        await p.messageService.create(
          {
            text: 'Choisissez votre sponsor. Celui que vous allez choisir deviendra votre principal soutien',
            senderId: starStream.id
          },
          'Choix du sponsor'
        )
      }
    })
  })

  p.agent.customizeCollection('Scenario', (collectionCustomizer) => {
    collectionCustomizer.addAction('Lancer scenario', {
      scope: 'Single',
      form: [],
      execute: async (context) => {
        const starStream = (await p.constellationsService.findAll()).find((constellation) => constellation.isStarStream)
        const scenarioId = (await context.getRecordId()).toString()
        const scenario = await p.scenarioService.findOneById(scenarioId)
        await p.joueuseService.update({
          joueuseName: 'éléna',
          joueuse: {
            scenarioId: scenarioId,
            state: PlayState.STARTED
          }
        })
        await p.messageService.create(
          {
            text: scenario.text,
            senderId: starStream.id
          },
          scenario.category === ScenarioCategory.PRINCIPAL
            ? 'Nouveau Scenario principal'
            : scenario.category === ScenarioCategory.SECONDAIRE
            ? 'Nouveau Scenario secondaire'
            : 'Nouveau Scenario caché'
        )
      }
    })
    collectionCustomizer.addAction('Fin scenario', {
      scope: 'Single',
      form: [
        {
          label: 'Reussite',
          type: 'Boolean',
          isRequired: true,
          defaultValue: true
        }
      ],
      execute: async (context) => {
        const reussite = context.formValues['Reussite'] as boolean
        const starStreamId = (await p.constellationsService.findAll()).find(
          (constellation) => constellation.isStarStream
        ).id
        const scenarioId = (await context.getRecordId()).toString()
        const scenario = await p.scenarioService.findOneById(scenarioId)

        await p.joueuseService.update({
          joueuseName: 'éléna',
          joueuse: {
            scenarioId: null
          }
        })
        await p.messageService.create(
          Message.toMessageToCreate({
            text: reussite ? scenario.victoryMsg : scenario.defaiteMsg,
            senderId: starStreamId
          }),
          reussite ? 'Scénario réussi !' : 'Echec du scénario...'
        )
      }
    })
  })

  p.agent.customizeCollection('ModelMessage', (collectionCustomizer) => {
    collectionCustomizer.addAction('Envoyer', {
      scope: 'Bulk',
      form: [],
      execute: async (context) => {
        const modelMessageIds = (await context.getRecordIds()).map((id) => id.toString())
        await p.messageService.sendWithModel(modelMessageIds)
      }
    })
  })

  p.agent.customizeCollection('migrations', (collectionCustomizer) => {
    collectionCustomizer.addAction('Stopper jeu', {
      scope: 'Global',
      form: [],
      execute: async (context) => {
        await p.joueuseService.update({
          joueuseName: 'éléna',
          joueuse: {
            state: PlayState.FINISHED
          }
        })
      }
    })
    collectionCustomizer.addAction('Init', {
      scope: 'Global',
      form: [],
      execute: async (context) => {
        await p.joueuseService.create({
          name: 'éléna',
          coins: 0,
          state: PlayState.NOT_STARTED,
          sponsorToChoose: false
        })
        await p.constellationsService.create({
          name: "L'Ours Furieux au Grand Coeur",
          realName: 'Sumra',
          pictureUrl:
            'https://media.discordapp.net/attachments/689044605311647799/1193500975319748609/file-k0xugMum8015ABiwCVIt13ZW.png?ex=65b62be6&is=65a3b6e6&hm=45cb0da79b90083cb91a2b19c2f2f025ba07870769f3c2d316d5afb5d74094fc&=&format=webp&quality=lossless&width=1056&height=1056',
          pictureUrlRevealed:
            'https://media.discordapp.net/attachments/689044605311647799/1193504208679358524/image.png?ex=65b62ee9&is=65a3b9e9&hm=14ba29d8c297399f516059e8960aa3ee4e2aee22e3ca8232ffddd820a68b41a0&=&format=webp&quality=lossless&width=1052&height=1056',
          revealed: false,
          isStarStream: false,
          sponsor: true
        })
        await p.constellationsService.create({
          name: 'Bihyung',
          realName: 'Bihyung',
          pictureUrl:
            'https://media.discordapp.net/attachments/689044605311647799/1198322047974129755/image.png?ex=65be7b5f&is=65ac065f&hm=08c6c4838abb17655d1891b24e5afecf19248cc62290e33a684fb90d072dd6d7&=&format=webp&quality=lossless&width=1054&height=994',
          pictureUrlRevealed:
            'https://media.discordapp.net/attachments/689044605311647799/1198322047974129755/image.png?ex=65be7b5f&is=65ac065f&hm=08c6c4838abb17655d1891b24e5afecf19248cc62290e33a684fb90d072dd6d7&=&format=webp&quality=lossless&width=1054&height=994',
          revealed: true,
          isStarStream: true,
          sponsor: false
        })
        await p.constellationsService.create({
          name: "La Mère débordante d'Amour",
          realName: 'Mère Gothel',
          pictureUrl:
            'https://media.discordapp.net/attachments/689044605311647799/1193500974938079292/file-GEoQS1X8fQkB9i52aVIfwDOL.png?ex=65b62be6&is=65a3b6e6&hm=2a3cc02eed21e107c2dd81270f057069e4f8f965ff1398fc713e296eb5286d18&=&format=webp&quality=lossless&width=1056&height=1056',
          pictureUrlRevealed:
            'https://media.discordapp.net/attachments/689044605311647799/1193504208440274974/image.png?ex=65b62ee9&is=65a3b9e9&hm=d05d3f707ba91e5f3277b6e2a7a0bdc8c6dd0b5fc90887f72a41111177104ebd&=&format=webp&quality=lossless&width=1052&height=1056',
          revealed: false,
          isStarStream: false,
          sponsor: true
        })
        await p.scenarioService.create({
          name: 'SCENARIO 1',
          category: ScenarioCategory.PRINCIPAL,
          difficulty: 'F',
          text: 'Prouver sa valeur',
          victory: 'Démontrez vos capacités gustatives en prenant un petit déjeuner calorique',
          defeat: 'Un manque important de glucide',
          time: '30 MINUTES',
          reward: '100 PIECES',
          victoryMsg: 'Vous avez prouvé votre valeur !',
          defaiteMsg: 'Vous avez perdu...'
        })
      }
    })
  })
}
