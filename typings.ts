/* eslint-disable */
export type Schema = {
  'db_account': {
    plain: {
      'id': number;
      'createdDate': string;
      'updatedDate': string;
      'authority': string;
      'secret': string;
    };
    nested: {
      'db_profile': Schema['db_profile']['plain'] & Schema['db_profile']['nested'];
    };
    flat: {
      'db_profile:id': number;
      'db_profile:createdDate': string;
      'db_profile:updatedDate': string;
      'db_profile:accountId': number;
      'db_profile:name': string;
    };
  };
  'db_authentication': {
    plain: {
      'id': number;
      'createdDate': string;
      'updatedDate': string;
      'identifier': string;
      'password': string;
      'type': string;
      'accountId': number;
    };
    nested: {
      'account': Schema['db_account']['plain'] & Schema['db_account']['nested'];
    };
    flat: {
      'account:id': number;
      'account:createdDate': string;
      'account:updatedDate': string;
      'account:authority': string;
      'account:secret': string;
      'account:db_profile:id': number;
      'account:db_profile:createdDate': string;
      'account:db_profile:updatedDate': string;
      'account:db_profile:accountId': number;
      'account:db_profile:name': string;
    };
  };
  'db_character': {
    plain: {
      'id': number;
      'createdDate': string;
      'updatedDate': string;
      'name': string;
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
      'relance': number;
      'picture': string;
      'pictureApotheose': string;
      'background': string;
      'buttonColor': string;
      'textColor': string;
      'boosted': boolean;
      'classe': 'CHAMPION' | 'CORROMPU' | 'REJETE' | 'PACIFICATEUR' | 'SPIRITE' | 'ARCANISTE' | 'CHAMPION_ARCANIQUE' | 'SOLDAT' | 'AVATAR' | 'SKINWALKER' | 'GAME_MASTER' | 'ROI' | 'PAROLIER' | 'DRAGON' | 'INCONNU';
      'bloodline': 'LUMIERE' | 'TENEBRE' | 'EAU' | 'FEU' | 'VENT' | 'TERRE' | 'FOUDRE' | 'GLACE' | 'NAGA' | 'TROGLODYTE' | 'LYCAN' | 'GOULE' | 'SUCCUBE' | 'ILLITHIDE' | 'ARBRE' | 'TERREUR' | 'COLLECTIONNEUR' | 'GORGONNE' | 'NECROMANCIE' | 'VOYAGEUR' | 'JUGE' | 'VOLEUR' | 'AUCUN';
      'apotheose': 'NONE' | 'NORMALE' | 'IMPROVED' | 'FINALE' | 'ARCANIQUE' | 'FORME_VENGERESSE' | 'SURCHARGE' | 'SURCHARGE_IMPROVED';
      'category': 'PJ' | 'PNJ_ALLY' | 'PNJ_ENNEMY' | 'TEMPO' | 'TEMPLATE';
      'genre': 'HOMME' | 'FEMME' | 'AUTRE';
      'playerName': 'Arcady' | 'David' | 'Elena' | 'Eric' | 'Florent' | 'Guilhem' | 'Jupi' | 'Nico' | 'Tom' | 'Valou' | 'Guest';
      'battleState': 'NONE' | 'ALLIES' | 'ENNEMIES';
    };
    nested: {};
    flat: {};
  };
  'db_profile': {
    plain: {
      'id': number;
      'createdDate': string;
      'updatedDate': string;
      'accountId': number;
      'name': string;
    };
    nested: {
      'account': Schema['db_account']['plain'] & Schema['db_account']['nested'];
    };
    flat: {
      'account:id': number;
      'account:createdDate': string;
      'account:updatedDate': string;
      'account:authority': string;
      'account:secret': string;
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
