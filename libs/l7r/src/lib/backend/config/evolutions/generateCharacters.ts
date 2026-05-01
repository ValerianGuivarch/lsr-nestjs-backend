import { readFileSync, writeFileSync } from 'fs'

// Remplacez ces valeurs avec votre chemin de fichier d'entrée et de sortie
const inputFile = 'input.json'
const outputFile = 'output.txt'

const bloodlinesMap: Record<string, string> = {
  tenebre: 'tenebre'
  // Ajoutez d'autres bloodlines ici
}

interface CharacterData {
  _id: string
  name: string
  classe: string
  bloodline: string
  chair: number
  esprit: number
  essence: number
  niveau: number
  lux: string
  umbra: string
  secunda: string
  notes: string
  category: string
  genre: string
  picture: string
  pictureApotheose: string
  background: string
  playerName: string
}

const readInputFile = (filePath: string): any[] => {
  const fileContent = readFileSync(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

const generateCharacterCode = (varName: string, characterData: CharacterData): string => {
  return `const ${varName} = this.createCharacter({
    name: "${characterData.name.toLowerCase()}",
    classe: classes.get('${characterData.classe.toLowerCase()}'),
    bloodline: bloodlines.get('${characterData.bloodline.toLowerCase()}'),
    chair: ${characterData.chair},
    esprit: ${characterData.esprit},
    essence: ${characterData.essence},
    niveau: ${characterData.niveau},
    lux: "${characterData.lux}",
    umbra: "${characterData.umbra}",
    secunda: "${characterData.secunda}",
    category: Category.${characterData.category},
    genre: Genre.${characterData.genre},
    picture: "${characterData.picture}",
    pictureApotheose: "${characterData.pictureApotheose}",
    background: "${characterData.background}",
    playerName: "${characterData.playerName.toLowerCase()}"
  });\n\n`
}

const main = () => {
  const charactersData = readInputFile(inputFile)
  let generatedCode = `  static getCharacters(classes: Map<string, DBClasse>, bloodlines: Map<string, DBBloodline>): DBCharacter[] {
`
  const names: string[] = []

  charactersData.forEach((characterData) => {
    //console.log('Génération du code en cours...')
    //console.log(characterData)
    // varName is name with - and space removed and in lowercase
    const varName = characterData.character.name.toLowerCase().replace(/-|\s/g, '')
    generatedCode += generateCharacterCode(varName, characterData.character)
    names.push(varName)
  })
  generatedCode += `const newCharacters = [${names.join(', ')}]
  return newCharacters
}`
  writeFileSync(outputFile, generatedCode)
  //console.log('Code généré avec succès dans le fichier de sortie.')
}

main()
