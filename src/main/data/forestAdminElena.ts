import { PlayState } from '../domain/models/elena/PlayState'
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
        await p.messageService.create({
          text: scenario.text,
          senderId: starStream.id
        })
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

        const joueuse = await p.joueuseService.findOneByName('éléna')
        const coins = joueuse.coins + (reussite ? scenario.rewardCoin : 0)

        await p.joueuseService.update({
          joueuseName: 'éléna',
          joueuse: {
            coins: coins,
            scenarioId: null
          }
        })

        await p.messageService.create({
          text: reussite ? 'Scénario réussi !' : 'Echec du scénario...',
          senderId: starStreamId
        })
        /*await p.messageService.create(
          Message.toMessageToCreate({
            text: reussite ? scenario.victoryMsg : scenario.defaiteMsg,
            senderId: starStreamId
          }),
          reussite ? 'Scénario réussi !' : 'Echec du scénario...'
        )*/
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
    collectionCustomizer.addHook('After', 'Create', async (context) => {
      const modelMessage = context.records[0]
      await p.messageService.sendWithModel([modelMessage.id])
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
  })
}
