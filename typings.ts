/* eslint-disable */
import {
  CollectionCustomizer,
  TAggregation,
  TConditionTree,
  TPaginatedFilter,
  TPartialRow,
  TSortClause
} from '@forestadmin/agent';

export type DBClasseSkillCustomizer = CollectionCustomizer<Schema, 'DBClasseSkill'>;
export type DBClasseSkillRecord = TPartialRow<Schema, 'DBClasseSkill'>;
export type DBClasseSkillConditionTree = TConditionTree<Schema, 'DBClasseSkill'>;
export type DBClasseSkillFilter = TPaginatedFilter<Schema, 'DBClasseSkill'>;
export type DBClasseSkillSortClause = TSortClause<Schema, 'DBClasseSkill'>;
export type DBClasseSkillAggregation = TAggregation<Schema, 'DBClasseSkill'>;

export type DbBloodlineCustomizer = CollectionCustomizer<Schema, 'db_bloodline'>;
export type DbBloodlineRecord = TPartialRow<Schema, 'db_bloodline'>;
export type DbBloodlineConditionTree = TConditionTree<Schema, 'db_bloodline'>;
export type DbBloodlineFilter = TPaginatedFilter<Schema, 'db_bloodline'>;
export type DbBloodlineSortClause = TSortClause<Schema, 'db_bloodline'>;
export type DbBloodlineAggregation = TAggregation<Schema, 'db_bloodline'>;

export type DbCharacterCustomizer = CollectionCustomizer<Schema, 'db_character'>;
export type DbCharacterRecord = TPartialRow<Schema, 'db_character'>;
export type DbCharacterConditionTree = TConditionTree<Schema, 'db_character'>;
export type DbCharacterFilter = TPaginatedFilter<Schema, 'db_character'>;
export type DbCharacterSortClause = TSortClause<Schema, 'db_character'>;
export type DbCharacterAggregation = TAggregation<Schema, 'db_character'>;

export type DbClasseCustomizer = CollectionCustomizer<Schema, 'db_classe'>;
export type DbClasseRecord = TPartialRow<Schema, 'db_classe'>;
export type DbClasseConditionTree = TConditionTree<Schema, 'db_classe'>;
export type DbClasseFilter = TPaginatedFilter<Schema, 'db_classe'>;
export type DbClasseSortClause = TSortClause<Schema, 'db_classe'>;
export type DbClasseAggregation = TAggregation<Schema, 'db_classe'>;

export type DbOwnedSkillCustomizer = CollectionCustomizer<Schema, 'db_owned_skill'>;
export type DbOwnedSkillRecord = TPartialRow<Schema, 'db_owned_skill'>;
export type DbOwnedSkillConditionTree = TConditionTree<Schema, 'db_owned_skill'>;
export type DbOwnedSkillFilter = TPaginatedFilter<Schema, 'db_owned_skill'>;
export type DbOwnedSkillSortClause = TSortClause<Schema, 'db_owned_skill'>;
export type DbOwnedSkillAggregation = TAggregation<Schema, 'db_owned_skill'>;

export type DbRollCustomizer = CollectionCustomizer<Schema, 'db_roll'>;
export type DbRollRecord = TPartialRow<Schema, 'db_roll'>;
export type DbRollConditionTree = TConditionTree<Schema, 'db_roll'>;
export type DbRollFilter = TPaginatedFilter<Schema, 'db_roll'>;
export type DbRollSortClause = TSortClause<Schema, 'db_roll'>;
export type DbRollAggregation = TAggregation<Schema, 'db_roll'>;

export type DbSessionCustomizer = CollectionCustomizer<Schema, 'db_session'>;
export type DbSessionRecord = TPartialRow<Schema, 'db_session'>;
export type DbSessionConditionTree = TConditionTree<Schema, 'db_session'>;
export type DbSessionFilter = TPaginatedFilter<Schema, 'db_session'>;
export type DbSessionSortClause = TSortClause<Schema, 'db_session'>;
export type DbSessionAggregation = TAggregation<Schema, 'db_session'>;

export type DbSkillCustomizer = CollectionCustomizer<Schema, 'db_skill'>;
export type DbSkillRecord = TPartialRow<Schema, 'db_skill'>;
export type DbSkillConditionTree = TConditionTree<Schema, 'db_skill'>;
export type DbSkillFilter = TPaginatedFilter<Schema, 'db_skill'>;
export type DbSkillSortClause = TSortClause<Schema, 'db_skill'>;
export type DbSkillAggregation = TAggregation<Schema, 'db_skill'>;

export type MigrationsCustomizer = CollectionCustomizer<Schema, 'migrations'>;
export type MigrationsRecord = TPartialRow<Schema, 'migrations'>;
export type MigrationsConditionTree = TConditionTree<Schema, 'migrations'>;
export type MigrationsFilter = TPaginatedFilter<Schema, 'migrations'>;
export type MigrationsSortClause = TSortClause<Schema, 'migrations'>;
export type MigrationsAggregation = TAggregation<Schema, 'migrations'>;


export type Schema = {
  'db_bloodline': {
    plain: {
      'name': string;
      'detteByMagicAction': number;
      'detteByPp': number;
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
      'apotheoseName': string;
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
      'playerName': string;
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
      'db_bloodline_through_apotheoseName': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
      'db_bloodline_through_bloodlineName': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
    };
    flat: {
      'db_classe:name': string;
      'db_classe:displayMale': string;
      'db_classe:displayFemale': string;
      'db_bloodline_through_apotheoseName:name': string;
      'db_bloodline_through_apotheoseName:detteByMagicAction': number;
      'db_bloodline_through_apotheoseName:detteByPp': number;
      'db_bloodline_through_apotheoseName:healthImproved': boolean;
      'db_bloodline_through_apotheoseName:display': string;
      'db_bloodline_through_bloodlineName:name': string;
      'db_bloodline_through_bloodlineName:detteByMagicAction': number;
      'db_bloodline_through_bloodlineName:detteByPp': number;
      'db_bloodline_through_bloodlineName:healthImproved': boolean;
      'db_bloodline_through_bloodlineName:display': string;
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
      'db_character:apotheoseName': string;
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
      'db_character:playerName': string;
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
      'db_character:db_bloodline_through_apotheoseName:name': string;
      'db_character:db_bloodline_through_apotheoseName:detteByMagicAction': number;
      'db_character:db_bloodline_through_apotheoseName:detteByPp': number;
      'db_character:db_bloodline_through_apotheoseName:healthImproved': boolean;
      'db_character:db_bloodline_through_apotheoseName:display': string;
      'db_character:db_bloodline_through_bloodlineName:name': string;
      'db_character:db_bloodline_through_bloodlineName:detteByMagicAction': number;
      'db_character:db_bloodline_through_bloodlineName:detteByPp': number;
      'db_character:db_bloodline_through_bloodlineName:healthImproved': boolean;
      'db_character:db_bloodline_through_bloodlineName:display': string;
      'db_skill:name': string;
      'db_skill:attribution': 'ALL' | 'CLASSES' | 'BLOODLINES' | 'OWNED';
      'db_skill:allowsPf': boolean;
      'db_skill:allowsPp': boolean;
      'db_skill:stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'db_skill:category': 'STATS' | 'MAGIE' | 'CORROMPUS' | 'PAROLIERS' | 'SPIRITES' | 'ARCANES' | 'SOLDATS' | 'ROYALS' | 'PACIFICATEURS';
      'db_skill:use': 'UNLIMITED' | 'LIMITED';
      'db_skill:limitedUse': number;
      'db_skill:position': number;
      'db_skill:pvCost': number;
      'db_skill:pfCost': number;
      'db_skill:ppCost': number;
      'db_skill:dettesCost': number;
      'db_skill:arcaneCost': number;
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
      'bonus': number;
      'malus': number;
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
      'allowsPf': boolean;
      'allowsPp': boolean;
      'stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'category': 'STATS' | 'MAGIE' | 'CORROMPUS' | 'PAROLIERS' | 'SPIRITES' | 'ARCANES' | 'SOLDATS' | 'ROYALS' | 'PACIFICATEURS';
      'use': 'UNLIMITED' | 'LIMITED';
      'limitedUse': number;
      'position': number;
      'pvCost': number;
      'pfCost': number;
      'ppCost': number;
      'dettesCost': number;
      'arcaneCost': number;
      'customRolls': string;
      'successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1';
      'secret': boolean;
      'display': string;
    };
    nested: {};
    flat: {};
  };
  'DBClasseSkill': {
    plain: {
      'dbClasseName': string;
      'dbSkillName': string;
    };
    nested: {
      'db_classe': Schema['db_classe']['plain'] & Schema['db_classe']['nested'];
      'db_skill': Schema['db_skill']['plain'] & Schema['db_skill']['nested'];
    };
    flat: {
      'db_classe:name': string;
      'db_classe:displayMale': string;
      'db_classe:displayFemale': string;
      'db_skill:name': string;
      'db_skill:attribution': 'ALL' | 'CLASSES' | 'BLOODLINES' | 'OWNED';
      'db_skill:allowsPf': boolean;
      'db_skill:allowsPp': boolean;
      'db_skill:stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'db_skill:category': 'STATS' | 'MAGIE' | 'CORROMPUS' | 'PAROLIERS' | 'SPIRITES' | 'ARCANES' | 'SOLDATS' | 'ROYALS' | 'PACIFICATEURS';
      'db_skill:use': 'UNLIMITED' | 'LIMITED';
      'db_skill:limitedUse': number;
      'db_skill:position': number;
      'db_skill:pvCost': number;
      'db_skill:pfCost': number;
      'db_skill:ppCost': number;
      'db_skill:dettesCost': number;
      'db_skill:arcaneCost': number;
      'db_skill:customRolls': string;
      'db_skill:successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1';
      'db_skill:secret': boolean;
      'db_skill:display': string;
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
