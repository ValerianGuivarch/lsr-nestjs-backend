/* eslint-disable */
export type Schema = {
  'db_bloodline': {
    plain: {
      'name': string;
      'detteByMagicAction': number;
      'healthImproved': boolean;
      'display': string;
      'detteByPp': number;
    };
    nested: {};
    flat: {};
  };
  'db_character': {
    plain: {
      'name': string;
      'classeName': string;
      'apotheoseImprovement': string;
      'apotheoseImprovementList': string;
      'chair': number;
      'esprit': number;
      'essence': number;
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
      'apotheoseName': string;
    };
    nested: {
      'db_classe': Schema['db_classe']['plain'] & Schema['db_classe']['nested'];
      'db_bloodline_through_bloodlineName': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
      'db_bloodline_through_apotheoseName': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
    };
    flat: {
      'db_classe:name': string;
      'db_classe:displayMale': string;
      'db_classe:displayFemale': string;
      'db_bloodline_through_bloodlineName:name': string;
      'db_bloodline_through_bloodlineName:detteByMagicAction': number;
      'db_bloodline_through_bloodlineName:healthImproved': boolean;
      'db_bloodline_through_bloodlineName:display': string;
      'db_bloodline_through_bloodlineName:detteByPp': number;
      'db_bloodline_through_apotheoseName:name': string;
      'db_bloodline_through_apotheoseName:detteByMagicAction': number;
      'db_bloodline_through_apotheoseName:healthImproved': boolean;
      'db_bloodline_through_apotheoseName:display': string;
      'db_bloodline_through_apotheoseName:detteByPp': number;
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
  'db_owned_skill': {
    plain: {
      'id': number;
      'characterName': string;
      'skillName': string;
      'use': 'UNLIMITED' | 'LIMITED';
      'limitedUse': number;
      'pvCost': number;
      'pfCost': number;
      'ppCost': number;
      'dettesCost': number;
      'arcaneCost': number;
      'allowsPf': boolean;
      'allowsPp': boolean;
    };
    nested: {
      'db_character': Schema['db_character']['plain'] & Schema['db_character']['nested'];
      'db_skill': Schema['db_skill']['plain'] & Schema['db_skill']['nested'];
    };
    flat: {
      'db_character:name': string;
      'db_character:classeName': string;
      'db_character:apotheoseImprovement': string;
      'db_character:apotheoseImprovementList': string;
      'db_character:chair': number;
      'db_character:esprit': number;
      'db_character:essence': number;
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
      'db_character:apotheoseName': string;
      'db_character:db_classe:name': string;
      'db_character:db_classe:displayMale': string;
      'db_character:db_classe:displayFemale': string;
      'db_character:db_bloodline_through_bloodlineName:name': string;
      'db_character:db_bloodline_through_bloodlineName:detteByMagicAction': number;
      'db_character:db_bloodline_through_bloodlineName:healthImproved': boolean;
      'db_character:db_bloodline_through_bloodlineName:display': string;
      'db_character:db_bloodline_through_bloodlineName:detteByPp': number;
      'db_character:db_bloodline_through_apotheoseName:name': string;
      'db_character:db_bloodline_through_apotheoseName:detteByMagicAction': number;
      'db_character:db_bloodline_through_apotheoseName:healthImproved': boolean;
      'db_character:db_bloodline_through_apotheoseName:display': string;
      'db_character:db_bloodline_through_apotheoseName:detteByPp': number;
      'db_skill:name': string;
      'db_skill:attribution': 'ALL' | 'CLASSES' | 'BLOODLINES' | 'OWNED';
      'db_skill:stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'db_skill:category': 'STATS' | 'ARCANES' | 'SOLDATS' | 'PACIFICATEURS';
      'db_skill:use': 'UNLIMITED' | 'LIMITED';
      'db_skill:limitedUse': number;
      'db_skill:pvCost': number;
      'db_skill:pfCost': number;
      'db_skill:ppCost': number;
      'db_skill:dettesCost': number;
      'db_skill:arcaneCost': number;
      'db_skill:allowsPp': boolean;
      'db_skill:allowsPf': boolean;
      'db_skill:customRolls': string;
      'db_skill:successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1';
      'db_skill:secret': boolean;
      'db_skill:display': string;
    };
  };
  'db_roll': {
    plain: {
      'id': number;
      'createdDate': string;
      'updatedDate': string;
      'rollerName': string;
      'date': string;
      'secret': boolean;
      'displayDices': boolean;
      'focus': boolean;
      'power': boolean;
      'proficiency': boolean;
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
      'display': string;
      'bonus': number;
      'malus': number;
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
  'db_skill': {
    plain: {
      'name': string;
      'attribution': 'ALL' | 'CLASSES' | 'BLOODLINES' | 'OWNED';
      'stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'category': 'STATS' | 'ARCANES' | 'SOLDATS' | 'PACIFICATEURS';
      'use': 'UNLIMITED' | 'LIMITED';
      'limitedUse': number;
      'pvCost': number;
      'pfCost': number;
      'ppCost': number;
      'dettesCost': number;
      'arcaneCost': number;
      'allowsPp': boolean;
      'allowsPf': boolean;
      'customRolls': string;
      'successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1';
      'secret': boolean;
      'display': string;
    };
    nested: {};
    flat: {};
  };
  'db_skill_attribution_bloodline_list_db_bloodline': {
    plain: {
      'dbSkillName': string;
      'dbBloodlineName': string;
    };
    nested: {
      'db_skill': Schema['db_skill']['plain'] & Schema['db_skill']['nested'];
      'db_bloodline': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
    };
    flat: {
      'db_skill:name': string;
      'db_skill:attribution': 'ALL' | 'CLASSES' | 'BLOODLINES' | 'OWNED';
      'db_skill:stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'db_skill:category': 'STATS' | 'ARCANES' | 'SOLDATS' | 'PACIFICATEURS';
      'db_skill:use': 'UNLIMITED' | 'LIMITED';
      'db_skill:limitedUse': number;
      'db_skill:pvCost': number;
      'db_skill:pfCost': number;
      'db_skill:ppCost': number;
      'db_skill:dettesCost': number;
      'db_skill:arcaneCost': number;
      'db_skill:allowsPp': boolean;
      'db_skill:allowsPf': boolean;
      'db_skill:customRolls': string;
      'db_skill:successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1';
      'db_skill:secret': boolean;
      'db_skill:display': string;
      'db_bloodline:name': string;
      'db_bloodline:detteByMagicAction': number;
      'db_bloodline:healthImproved': boolean;
      'db_bloodline:display': string;
      'db_bloodline:detteByPp': number;
    };
  };
  'db_skill_attribution_classe_list_db_classe': {
    plain: {
      'dbSkillName': string;
      'dbClasseName': string;
    };
    nested: {
      'db_skill': Schema['db_skill']['plain'] & Schema['db_skill']['nested'];
      'db_classe': Schema['db_classe']['plain'] & Schema['db_classe']['nested'];
    };
    flat: {
      'db_skill:name': string;
      'db_skill:attribution': 'ALL' | 'CLASSES' | 'BLOODLINES' | 'OWNED';
      'db_skill:stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'db_skill:category': 'STATS' | 'ARCANES' | 'SOLDATS' | 'PACIFICATEURS';
      'db_skill:use': 'UNLIMITED' | 'LIMITED';
      'db_skill:limitedUse': number;
      'db_skill:pvCost': number;
      'db_skill:pfCost': number;
      'db_skill:ppCost': number;
      'db_skill:dettesCost': number;
      'db_skill:arcaneCost': number;
      'db_skill:allowsPp': boolean;
      'db_skill:allowsPf': boolean;
      'db_skill:customRolls': string;
      'db_skill:successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1';
      'db_skill:secret': boolean;
      'db_skill:display': string;
      'db_classe:name': string;
      'db_classe:displayMale': string;
      'db_classe:displayFemale': string;
    };
  };
  'migrations': {
    plain: {
      'id': number;
      'timestamp': number;
      'name': string;
    };
    nested: {};
    flat: {};
  };
};