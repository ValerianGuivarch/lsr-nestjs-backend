/* eslint-disable */
export type Schema = {
  'db_arcane': {
    plain: {
      'name': string;
      'type': 'FIXE' | 'ESPRIT' | 'ESSENCE';
    };
    nested: {};
    flat: {};
  };
  'db_bloodline': {
    plain: {
      'name': string;
      'detteByMagicAction': number;
      'healthImproved': boolean;
      'display': string;
    };
    nested: {};
    flat: {};
  };
  'db_character': {
    plain: {
      'name': string;
      'classeName': string;
      'apotheose': 'NONE' | 'NORMALE' | 'IMPROVED' | 'FINALE' | 'ARCANIQUE' | 'FORME_VENGERESSE' | 'SURCHARGE' | 'SURCHARGE_IMPROVED';
      'apotheoseImprovement': string;
      'apotheoseImprovementList': string;
      'chair': number;
      'esprit': number;
      'essence': number;
      'bonus': number;
      'malus': number;
      'pv': number;
      'pvMax': number;
      'pf': number;
      'pfMax': number;
      'pp': number;
      'ppMax': number;
      'dettes': number;
      'arcanes': number;
      'arcanesMax': number;
      'niveau': number;
      'lux': string;
      'umbra': string;
      'secunda': string;
      'notes': string;
      'category': 'PJ' | 'PNJ_ALLY' | 'PNJ_ENNEMY' | 'TEMPO' | 'TEMPLATE';
      'battleState': 'NONE' | 'ALLIES' | 'ENNEMIES';
      'genre': 'HOMME' | 'FEMME';
      'relance': number;
      'playerName': 'Arcady' | 'David' | 'Elena' | 'Eric' | 'Florent' | 'Guilhem' | 'Jupi' | 'Nico' | 'Tom' | 'Valou' | 'Guest';
      'picture': string;
      'pictureApotheose': string;
      'background': string;
      'buttonColor': string;
      'textColor': string;
      'boosted': boolean;
      'bloodlineName': string;
    };
    nested: {
      'db_classe': Schema['db_classe']['plain'] & Schema['db_classe']['nested'];
      'db_bloodline': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
    };
    flat: {
      'db_classe:name': string;
      'db_classe:displayMale': string;
      'db_classe:displayFemale': string;
      'db_bloodline:name': string;
      'db_bloodline:detteByMagicAction': number;
      'db_bloodline:healthImproved': boolean;
      'db_bloodline:display': string;
    };
  };
  'db_classe': {
    plain: {
      'name': string;
      'displayMale': string;
      'displayFemale': string;
    };
    nested: {};
    flat: {};
  };
  'db_owned_arcane': {
    plain: {
      'id': number;
      'use': 'UNLIMITED' | 'LIMITED' | 'UNIQUE';
      'characterName': string;
      'arcaneName': string;
    };
    nested: {
      'db_character': Schema['db_character']['plain'] & Schema['db_character']['nested'];
      'db_arcane': Schema['db_arcane']['plain'] & Schema['db_arcane']['nested'];
    };
    flat: {
      'db_character:name': string;
      'db_character:classeName': string;
      'db_character:apotheose': 'NONE' | 'NORMALE' | 'IMPROVED' | 'FINALE' | 'ARCANIQUE' | 'FORME_VENGERESSE' | 'SURCHARGE' | 'SURCHARGE_IMPROVED';
      'db_character:apotheoseImprovement': string;
      'db_character:apotheoseImprovementList': string;
      'db_character:chair': number;
      'db_character:esprit': number;
      'db_character:essence': number;
      'db_character:bonus': number;
      'db_character:malus': number;
      'db_character:pv': number;
      'db_character:pvMax': number;
      'db_character:pf': number;
      'db_character:pfMax': number;
      'db_character:pp': number;
      'db_character:ppMax': number;
      'db_character:dettes': number;
      'db_character:arcanes': number;
      'db_character:arcanesMax': number;
      'db_character:niveau': number;
      'db_character:lux': string;
      'db_character:umbra': string;
      'db_character:secunda': string;
      'db_character:notes': string;
      'db_character:category': 'PJ' | 'PNJ_ALLY' | 'PNJ_ENNEMY' | 'TEMPO' | 'TEMPLATE';
      'db_character:battleState': 'NONE' | 'ALLIES' | 'ENNEMIES';
      'db_character:genre': 'HOMME' | 'FEMME';
      'db_character:relance': number;
      'db_character:playerName': 'Arcady' | 'David' | 'Elena' | 'Eric' | 'Florent' | 'Guilhem' | 'Jupi' | 'Nico' | 'Tom' | 'Valou' | 'Guest';
      'db_character:picture': string;
      'db_character:pictureApotheose': string;
      'db_character:background': string;
      'db_character:buttonColor': string;
      'db_character:textColor': string;
      'db_character:boosted': boolean;
      'db_character:bloodlineName': string;
      'db_character:db_classe:name': string;
      'db_character:db_classe:displayMale': string;
      'db_character:db_classe:displayFemale': string;
      'db_character:db_bloodline:name': string;
      'db_character:db_bloodline:detteByMagicAction': number;
      'db_character:db_bloodline:healthImproved': boolean;
      'db_character:db_bloodline:display': string;
      'db_arcane:name': string;
      'db_arcane:type': 'FIXE' | 'ESPRIT' | 'ESSENCE';
    };
  };
  'db_roll': {
    plain: {
      'id': number;
      'createdDate': string;
      'updatedDate': string;
      'rollerName': string;
      'rollType': string;
      'date': string;
      'secret': boolean;
      'displayDices': boolean;
      'focus': boolean;
      'power': boolean;
      'proficiency': boolean;
      'benediction': number;
      'malediction': number;
      'result': string;
      'success': number;
      'juge12': number;
      'juge34': number;
      'characterToHelp': string;
      'picture': string;
      'data': string;
      'empirique': string;
      'apotheose': string;
      'resistRoll': string;
      'helpUsed': boolean;
    };
    nested: {};
    flat: {};
  };
  'db_session': {
    plain: {
      'id': number;
      'createdDate': string;
      'updatedDate': string;
      'relanceMj': number;
      'chaos': number;
    };
    nested: {};
    flat: {};
  };
};
