/* eslint-disable */
export type Schema = {
  'db_bloodline': {
    plain: {
      'name': string;
      'detteByMagicAction': number;
      'healthImproved': boolean;
    };
    nested: {};
    flat: {};
  };
  'db_character': {
    plain: {
      'name': string;
      'classe': 'CHAMPION' | 'CORROMPU' | 'REJETE' | 'PACIFICATEUR' | 'SPIRITE' | 'ARCANISTE' | 'CHAMPION_ARCANIQUE' | 'SOLDAT' | 'AVATAR' | 'SKINWALKER' | 'GAME_MASTER' | 'ROI' | 'PAROLIER' | 'DRAGON' | 'INCONNU';
      'bloodlineName': string;
      'apotheose': 'NONE' | 'NORMALE' | 'IMPROVED' | 'FINALE' | 'ARCANIQUE' | 'FORME_VENGERESSE' | 'SURCHARGE' | 'SURCHARGE_IMPROVED';
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
      'genre': 'HOMME' | 'FEMME' | 'AUTRE';
      'relance': number;
      'playerName': 'Arcady' | 'David' | 'Elena' | 'Eric' | 'Florent' | 'Guilhem' | 'Jupi' | 'Nico' | 'Tom' | 'Valou' | 'Guest';
      'picture': string;
      'pictureApotheose': string;
      'background': string;
      'buttonColor': string;
      'textColor': string;
      'boosted': boolean;
    };
    nested: {
      'db_bloodline': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
    };
    flat: {
      'db_bloodline:name': string;
      'db_bloodline:detteByMagicAction': number;
      'db_bloodline:healthImproved': boolean;
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
