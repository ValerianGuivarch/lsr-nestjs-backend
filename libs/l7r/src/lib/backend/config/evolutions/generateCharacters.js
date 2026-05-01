"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
// Remplacez ces valeurs avec votre chemin de fichier d'entrée et de sortie
var inputFile = 'input.json';
var outputFile = 'output.txt';
var bloodlinesMap = {
    tenebre: 'tenebre'
    // Ajoutez d'autres bloodlines ici
};
var readInputFile = function (filePath) {
    var fileContent = fs_1.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
};
var generateCharacterCode = function (characterData) {
    return "const " + characterData.name + " = this.createCharacter({\n    name: \"" + characterData.name.toLowerCase() + "\",\n    classe: classes.get('" + characterData.classe.toLowerCase() + "'),\n    bloodline: bloodlines.get('" + characterData.bloodline.toLowerCase() + "'),\n    chair: " + characterData.chair + ",\n    esprit: " + characterData.esprit + ",\n    essence: " + characterData.essence + ",\n    niveau: " + characterData.niveau + ",\n    lux: \"" + characterData.lux + "\",\n    umbra: \"" + characterData.umbra + "\",\n    secunda: \"" + characterData.secunda + "\",\n    notes: \"" + characterData.notes + "\",\n    category: Category.\"" + characterData.category + "\",\n    genre: Genre.\"" + characterData.genre + "\",\n    picture: \"" + characterData.picture + "\",\n    pictureApotheose: \"" + characterData.pictureApotheose + "\",\n    background: \"" + characterData.background + "\",\n    playerName: \"" + characterData.playerName.toLowerCase() + "\"\n  });\n\n";
};
var main = function () {
    var charactersData = readInputFile(inputFile);
    var generatedCode = '';
    charactersData.forEach(function (characterData) {
        generatedCode += generateCharacterCode(characterData);
    });
    fs_1.writeFileSync(outputFile, generatedCode);
    console.log('Code généré avec succès dans le fichier de sortie.');
};
main();
