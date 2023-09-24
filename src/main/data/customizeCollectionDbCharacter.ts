import { Character } from '../domain/models/characters/Character'
import { Genre } from '../domain/models/characters/Genre'
import { CharacterService } from '../domain/services/CharacterService'
import { Agent } from '@forestadmin/agent'

export const customizeCollectionDbCompany = (p: { agent: Agent; characterService: CharacterService }): void => {
  p.agent.customizeCollection('db_character', (collectionCustomizer) => {
    collectionCustomizer.addAction('Ajouter Personnage', {
      scope: 'Global',
      form: [
        {
          label: 'Name',
          description: 'Nom du personnage',
          type: 'String', // Supposons que 'Reference' soit le type correct pour un champ relié à une autre collection
          isRequired: true
        },
        {
          label: 'Classe',
          description: 'Classe du personnage',
          type: 'Collection', // Supposons que 'Reference' soit le type correct pour un champ relié à une autre collection
          collectionName: 'db_classe', // La collection à laquelle ce champ est relié
          isRequired: true
        },
        {
          label: 'Bloodline',
          description: 'Lignée du personnage',
          type: 'Collection', // De même, supposons que 'Reference' soit le type correct ici
          collectionName: 'db_bloodline', // La collection à laquelle ce champ est relié
          isRequired: false
        },
        {
          label: 'Level',
          description: 'Niveau du personnage (entre 1 et 25)',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'Chair',
          description: 'Chair du personnage',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'Esprit',
          description: 'Esprit du personnage',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'Essence',
          description: 'Essence du personnage',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'PV',
          description: 'PV du personnage',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'PF',
          description: 'PF du personnage',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'PP',
          description: 'PP du personnage',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'picture',
          description: 'Picture du personnage',
          type: 'String',
          isRequired: false
        },
        {
          label: 'pictureApotheose',
          description: 'Picture apotheose du personnage',
          type: 'String',
          isRequired: false
        },
        {
          label: 'genre',
          description: 'Genre du personnage',
          type: 'Enum',
          enumValues: ['HOMME', 'FEMME'],
          isRequired: false
        },
        {
          label: 'lux',
          description: 'Lux du personnage',
          type: 'String',
          isRequired: false
        },
        {
          label: 'umbra',
          description: 'Umbra du personnage',
          type: 'String',
          isRequired: false
        },
        {
          label: 'secunda',
          description: 'Secunda du personnage',
          type: 'String',
          isRequired: false
        },
        {
          label: 'arcanesMax',
          description: 'arcanesMax du personnage',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'ether',
          description: 'ether du personnage',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'arcanePrimesMax',
          description: 'arcanePrimesMax du personnage',
          type: 'Number',
          isRequired: false
        },
        {
          label: 'munitionsMax',
          description: 'PP du personnage',
          type: 'Number',
          isRequired: false
        }
      ],
      execute: async (context) => {
        // Récupérez les nouvelles valeurs du formulaire
        const classeName = context.formValues['Classe'] as string
        const bloodlineName = context.formValues['Bloodline'] as string | undefined
        const name = context.formValues['Name'] as string
        // eslint-disable-next-line no-magic-numbers
        const niveau = (context.formValues['Level'] as number) ?? 10
        let chair = context.formValues['Chair'] as number | undefined
        let esprit = context.formValues['Esprit'] as number | undefined
        let essence = context.formValues['Essence'] as number | undefined

        if (!chair || !esprit || !essence) {
          // eslint-disable-next-line no-magic-numbers
          chair = 2
          // eslint-disable-next-line no-magic-numbers
          esprit = 2
          // eslint-disable-next-line no-magic-numbers
          essence = 2
          // eslint-disable-next-line no-magic-numbers
          const stat = Character.statByLevel[niveau] - 6
          for (let i = 0; i < stat; i++) {
            // eslint-disable-next-line no-magic-numbers
            const rand = Math.floor(Math.random() * 3)

            if (rand === 0) {
              chair++
            } else if (rand === 1) {
              esprit++
            } else {
              essence++
            }
          }
        }
        const characterToCreate = Character.characterToCreateFactory({
          name: name,
          niveau: niveau,
          chair: chair,
          esprit: esprit,
          essence: essence,
          // eslint-disable-next-line no-magic-numbers
          pvMax: (context.formValues['PV'] as number) ?? chair * 2,
          // eslint-disable-next-line no-magic-numbers
          pfMax: (context.formValues['PF'] as number) ?? esprit * 2,
          // eslint-disable-next-line no-magic-numbers
          ppMax: (context.formValues['PP'] as number) ?? essence * 2,
          ethersMax: (context.formValues['ether'] as number) ?? 0,
          // eslint-disable-next-line no-magic-numbers
          arcanesMax: (context.formValues['arcanesMax'] as number) ?? 3,
          // eslint-disable-next-line no-magic-numbers
          arcanePrimesMax: (context.formValues['arcanePrimesMax'] as number) ?? 3,
          munitionsMax: (context.formValues['munitionsMax'] as number) ?? 0,
          lux: (context.formValues['lux'] as string) ?? '',
          umbra: (context.formValues['umbra'] as string) ?? '',
          secunda: (context.formValues['secunda'] as string) ?? '',
          genre: (context.formValues['genre'] as Genre) ?? Genre.HOMME,
          picture: (context.formValues['picture'] as string) ?? '',
          pictureApotheose: (context.formValues['pictureApotheose'] as string) ?? ''
        })
        // log all data
        console.log('name', name)
        console.log('chair', chair)
        console.log('esprit', esprit)
        console.log('essence', essence)
        await p.characterService.createNewCharacter(
          characterToCreate,
          classeName[0],
          bloodlineName ? bloodlineName[0] : undefined
        )
      }
    })
  })
}
