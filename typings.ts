/* eslint-disable */
import {
  CollectionCustomizer,
  TAggregation,
  TConditionTree,
  TPaginatedFilter,
  TPartialRow,
  TSortClause
} from '@forestadmin/agent';

export type ConstellationCustomizer = CollectionCustomizer<Schema, 'Constellation'>;
export type ConstellationRecord = TPartialRow<Schema, 'Constellation'>;
export type ConstellationConditionTree = TConditionTree<Schema, 'Constellation'>;
export type ConstellationFilter = TPaginatedFilter<Schema, 'Constellation'>;
export type ConstellationSortClause = TSortClause<Schema, 'Constellation'>;
export type ConstellationAggregation = TAggregation<Schema, 'Constellation'>;

export type EventCustomizer = CollectionCustomizer<Schema, 'Event'>;
export type EventRecord = TPartialRow<Schema, 'Event'>;
export type EventConditionTree = TConditionTree<Schema, 'Event'>;
export type EventFilter = TPaginatedFilter<Schema, 'Event'>;
export type EventSortClause = TSortClause<Schema, 'Event'>;
export type EventAggregation = TAggregation<Schema, 'Event'>;

export type JoueuseCustomizer = CollectionCustomizer<Schema, 'Joueuse'>;
export type JoueuseRecord = TPartialRow<Schema, 'Joueuse'>;
export type JoueuseConditionTree = TConditionTree<Schema, 'Joueuse'>;
export type JoueuseFilter = TPaginatedFilter<Schema, 'Joueuse'>;
export type JoueuseSortClause = TSortClause<Schema, 'Joueuse'>;
export type JoueuseAggregation = TAggregation<Schema, 'Joueuse'>;

export type MessageCustomizer = CollectionCustomizer<Schema, 'Message'>;
export type MessageRecord = TPartialRow<Schema, 'Message'>;
export type MessageConditionTree = TConditionTree<Schema, 'Message'>;
export type MessageFilter = TPaginatedFilter<Schema, 'Message'>;
export type MessageSortClause = TSortClause<Schema, 'Message'>;
export type MessageAggregation = TAggregation<Schema, 'Message'>;

export type ModelMessageCustomizer = CollectionCustomizer<Schema, 'ModelMessage'>;
export type ModelMessageRecord = TPartialRow<Schema, 'ModelMessage'>;
export type ModelMessageConditionTree = TConditionTree<Schema, 'ModelMessage'>;
export type ModelMessageFilter = TPaginatedFilter<Schema, 'ModelMessage'>;
export type ModelMessageSortClause = TSortClause<Schema, 'ModelMessage'>;
export type ModelMessageAggregation = TAggregation<Schema, 'ModelMessage'>;

export type ScenarioCustomizer = CollectionCustomizer<Schema, 'Scenario'>;
export type ScenarioRecord = TPartialRow<Schema, 'Scenario'>;
export type ScenarioConditionTree = TConditionTree<Schema, 'Scenario'>;
export type ScenarioFilter = TPaginatedFilter<Schema, 'Scenario'>;
export type ScenarioSortClause = TSortClause<Schema, 'Scenario'>;
export type ScenarioAggregation = TAggregation<Schema, 'Scenario'>;

export type DbApotheoseCustomizer = CollectionCustomizer<Schema, 'db_apotheose'>;
export type DbApotheoseRecord = TPartialRow<Schema, 'db_apotheose'>;
export type DbApotheoseConditionTree = TConditionTree<Schema, 'db_apotheose'>;
export type DbApotheoseFilter = TPaginatedFilter<Schema, 'db_apotheose'>;
export type DbApotheoseSortClause = TSortClause<Schema, 'db_apotheose'>;
export type DbApotheoseAggregation = TAggregation<Schema, 'db_apotheose'>;

export type DbBloodlineCustomizer = CollectionCustomizer<Schema, 'db_bloodline'>;
export type DbBloodlineRecord = TPartialRow<Schema, 'db_bloodline'>;
export type DbBloodlineConditionTree = TConditionTree<Schema, 'db_bloodline'>;
export type DbBloodlineFilter = TPaginatedFilter<Schema, 'db_bloodline'>;
export type DbBloodlineSortClause = TSortClause<Schema, 'db_bloodline'>;
export type DbBloodlineAggregation = TAggregation<Schema, 'db_bloodline'>;

export type DbBloodlineProficienciesDbProficiencyCustomizer = CollectionCustomizer<Schema, 'db_bloodline_proficiencies_db_proficiency'>;
export type DbBloodlineProficienciesDbProficiencyRecord = TPartialRow<Schema, 'db_bloodline_proficiencies_db_proficiency'>;
export type DbBloodlineProficienciesDbProficiencyConditionTree = TConditionTree<Schema, 'db_bloodline_proficiencies_db_proficiency'>;
export type DbBloodlineProficienciesDbProficiencyFilter = TPaginatedFilter<Schema, 'db_bloodline_proficiencies_db_proficiency'>;
export type DbBloodlineProficienciesDbProficiencySortClause = TSortClause<Schema, 'db_bloodline_proficiencies_db_proficiency'>;
export type DbBloodlineProficienciesDbProficiencyAggregation = TAggregation<Schema, 'db_bloodline_proficiencies_db_proficiency'>;

export type DbBloodlineSkillsDbSkillCustomizer = CollectionCustomizer<Schema, 'db_bloodline_skills_db_skill'>;
export type DbBloodlineSkillsDbSkillRecord = TPartialRow<Schema, 'db_bloodline_skills_db_skill'>;
export type DbBloodlineSkillsDbSkillConditionTree = TConditionTree<Schema, 'db_bloodline_skills_db_skill'>;
export type DbBloodlineSkillsDbSkillFilter = TPaginatedFilter<Schema, 'db_bloodline_skills_db_skill'>;
export type DbBloodlineSkillsDbSkillSortClause = TSortClause<Schema, 'db_bloodline_skills_db_skill'>;
export type DbBloodlineSkillsDbSkillAggregation = TAggregation<Schema, 'db_bloodline_skills_db_skill'>;

export type DbCharacterCustomizer = CollectionCustomizer<Schema, 'db_character'>;
export type DbCharacterRecord = TPartialRow<Schema, 'db_character'>;
export type DbCharacterConditionTree = TConditionTree<Schema, 'db_character'>;
export type DbCharacterFilter = TPaginatedFilter<Schema, 'db_character'>;
export type DbCharacterSortClause = TSortClause<Schema, 'db_character'>;
export type DbCharacterAggregation = TAggregation<Schema, 'db_character'>;

export type DbCharacterApotheosesDbApotheoseCustomizer = CollectionCustomizer<Schema, 'db_character_apotheoses_db_apotheose'>;
export type DbCharacterApotheosesDbApotheoseRecord = TPartialRow<Schema, 'db_character_apotheoses_db_apotheose'>;
export type DbCharacterApotheosesDbApotheoseConditionTree = TConditionTree<Schema, 'db_character_apotheoses_db_apotheose'>;
export type DbCharacterApotheosesDbApotheoseFilter = TPaginatedFilter<Schema, 'db_character_apotheoses_db_apotheose'>;
export type DbCharacterApotheosesDbApotheoseSortClause = TSortClause<Schema, 'db_character_apotheoses_db_apotheose'>;
export type DbCharacterApotheosesDbApotheoseAggregation = TAggregation<Schema, 'db_character_apotheoses_db_apotheose'>;

export type DbCharacterProficienciesDbProficiencyCustomizer = CollectionCustomizer<Schema, 'db_character_proficiencies_db_proficiency'>;
export type DbCharacterProficienciesDbProficiencyRecord = TPartialRow<Schema, 'db_character_proficiencies_db_proficiency'>;
export type DbCharacterProficienciesDbProficiencyConditionTree = TConditionTree<Schema, 'db_character_proficiencies_db_proficiency'>;
export type DbCharacterProficienciesDbProficiencyFilter = TPaginatedFilter<Schema, 'db_character_proficiencies_db_proficiency'>;
export type DbCharacterProficienciesDbProficiencySortClause = TSortClause<Schema, 'db_character_proficiencies_db_proficiency'>;
export type DbCharacterProficienciesDbProficiencyAggregation = TAggregation<Schema, 'db_character_proficiencies_db_proficiency'>;

export type DbCharacterSkillsDbSkillCustomizer = CollectionCustomizer<Schema, 'db_character_skills_db_skill'>;
export type DbCharacterSkillsDbSkillRecord = TPartialRow<Schema, 'db_character_skills_db_skill'>;
export type DbCharacterSkillsDbSkillConditionTree = TConditionTree<Schema, 'db_character_skills_db_skill'>;
export type DbCharacterSkillsDbSkillFilter = TPaginatedFilter<Schema, 'db_character_skills_db_skill'>;
export type DbCharacterSkillsDbSkillSortClause = TSortClause<Schema, 'db_character_skills_db_skill'>;
export type DbCharacterSkillsDbSkillAggregation = TAggregation<Schema, 'db_character_skills_db_skill'>;

export type DbCharacterTemplateCustomizer = CollectionCustomizer<Schema, 'db_character_template'>;
export type DbCharacterTemplateRecord = TPartialRow<Schema, 'db_character_template'>;
export type DbCharacterTemplateConditionTree = TConditionTree<Schema, 'db_character_template'>;
export type DbCharacterTemplateFilter = TPaginatedFilter<Schema, 'db_character_template'>;
export type DbCharacterTemplateSortClause = TSortClause<Schema, 'db_character_template'>;
export type DbCharacterTemplateAggregation = TAggregation<Schema, 'db_character_template'>;

export type DbCharacterTemplateSkillsDbSkillCustomizer = CollectionCustomizer<Schema, 'db_character_template_skills_db_skill'>;
export type DbCharacterTemplateSkillsDbSkillRecord = TPartialRow<Schema, 'db_character_template_skills_db_skill'>;
export type DbCharacterTemplateSkillsDbSkillConditionTree = TConditionTree<Schema, 'db_character_template_skills_db_skill'>;
export type DbCharacterTemplateSkillsDbSkillFilter = TPaginatedFilter<Schema, 'db_character_template_skills_db_skill'>;
export type DbCharacterTemplateSkillsDbSkillSortClause = TSortClause<Schema, 'db_character_template_skills_db_skill'>;
export type DbCharacterTemplateSkillsDbSkillAggregation = TAggregation<Schema, 'db_character_template_skills_db_skill'>;

export type DbClasseCustomizer = CollectionCustomizer<Schema, 'db_classe'>;
export type DbClasseRecord = TPartialRow<Schema, 'db_classe'>;
export type DbClasseConditionTree = TConditionTree<Schema, 'db_classe'>;
export type DbClasseFilter = TPaginatedFilter<Schema, 'db_classe'>;
export type DbClasseSortClause = TSortClause<Schema, 'db_classe'>;
export type DbClasseAggregation = TAggregation<Schema, 'db_classe'>;

export type DbClasseApotheosesDbApotheoseCustomizer = CollectionCustomizer<Schema, 'db_classe_apotheoses_db_apotheose'>;
export type DbClasseApotheosesDbApotheoseRecord = TPartialRow<Schema, 'db_classe_apotheoses_db_apotheose'>;
export type DbClasseApotheosesDbApotheoseConditionTree = TConditionTree<Schema, 'db_classe_apotheoses_db_apotheose'>;
export type DbClasseApotheosesDbApotheoseFilter = TPaginatedFilter<Schema, 'db_classe_apotheoses_db_apotheose'>;
export type DbClasseApotheosesDbApotheoseSortClause = TSortClause<Schema, 'db_classe_apotheoses_db_apotheose'>;
export type DbClasseApotheosesDbApotheoseAggregation = TAggregation<Schema, 'db_classe_apotheoses_db_apotheose'>;

export type DbClasseProficienciesDbProficiencyCustomizer = CollectionCustomizer<Schema, 'db_classe_proficiencies_db_proficiency'>;
export type DbClasseProficienciesDbProficiencyRecord = TPartialRow<Schema, 'db_classe_proficiencies_db_proficiency'>;
export type DbClasseProficienciesDbProficiencyConditionTree = TConditionTree<Schema, 'db_classe_proficiencies_db_proficiency'>;
export type DbClasseProficienciesDbProficiencyFilter = TPaginatedFilter<Schema, 'db_classe_proficiencies_db_proficiency'>;
export type DbClasseProficienciesDbProficiencySortClause = TSortClause<Schema, 'db_classe_proficiencies_db_proficiency'>;
export type DbClasseProficienciesDbProficiencyAggregation = TAggregation<Schema, 'db_classe_proficiencies_db_proficiency'>;

export type DbClasseSkillsDbSkillCustomizer = CollectionCustomizer<Schema, 'db_classe_skills_db_skill'>;
export type DbClasseSkillsDbSkillRecord = TPartialRow<Schema, 'db_classe_skills_db_skill'>;
export type DbClasseSkillsDbSkillConditionTree = TConditionTree<Schema, 'db_classe_skills_db_skill'>;
export type DbClasseSkillsDbSkillFilter = TPaginatedFilter<Schema, 'db_classe_skills_db_skill'>;
export type DbClasseSkillsDbSkillSortClause = TSortClause<Schema, 'db_classe_skills_db_skill'>;
export type DbClasseSkillsDbSkillAggregation = TAggregation<Schema, 'db_classe_skills_db_skill'>;

export type DbEntryCustomizer = CollectionCustomizer<Schema, 'db_entry'>;
export type DbEntryRecord = TPartialRow<Schema, 'db_entry'>;
export type DbEntryConditionTree = TConditionTree<Schema, 'db_entry'>;
export type DbEntryFilter = TPaginatedFilter<Schema, 'db_entry'>;
export type DbEntrySortClause = TSortClause<Schema, 'db_entry'>;
export type DbEntryAggregation = TAggregation<Schema, 'db_entry'>;

export type DbFlipCustomizer = CollectionCustomizer<Schema, 'db_flip'>;
export type DbFlipRecord = TPartialRow<Schema, 'db_flip'>;
export type DbFlipConditionTree = TConditionTree<Schema, 'db_flip'>;
export type DbFlipFilter = TPaginatedFilter<Schema, 'db_flip'>;
export type DbFlipSortClause = TSortClause<Schema, 'db_flip'>;
export type DbFlipAggregation = TAggregation<Schema, 'db_flip'>;

export type DbKnowledgeCustomizer = CollectionCustomizer<Schema, 'db_knowledge'>;
export type DbKnowledgeRecord = TPartialRow<Schema, 'db_knowledge'>;
export type DbKnowledgeConditionTree = TConditionTree<Schema, 'db_knowledge'>;
export type DbKnowledgeFilter = TPaginatedFilter<Schema, 'db_knowledge'>;
export type DbKnowledgeSortClause = TSortClause<Schema, 'db_knowledge'>;
export type DbKnowledgeAggregation = TAggregation<Schema, 'db_knowledge'>;

export type DbProficiencyCustomizer = CollectionCustomizer<Schema, 'db_proficiency'>;
export type DbProficiencyRecord = TPartialRow<Schema, 'db_proficiency'>;
export type DbProficiencyConditionTree = TConditionTree<Schema, 'db_proficiency'>;
export type DbProficiencyFilter = TPaginatedFilter<Schema, 'db_proficiency'>;
export type DbProficiencySortClause = TSortClause<Schema, 'db_proficiency'>;
export type DbProficiencyAggregation = TAggregation<Schema, 'db_proficiency'>;

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

export type DbSpellCustomizer = CollectionCustomizer<Schema, 'db_spell'>;
export type DbSpellRecord = TPartialRow<Schema, 'db_spell'>;
export type DbSpellConditionTree = TConditionTree<Schema, 'db_spell'>;
export type DbSpellFilter = TPaginatedFilter<Schema, 'db_spell'>;
export type DbSpellSortClause = TSortClause<Schema, 'db_spell'>;
export type DbSpellAggregation = TAggregation<Schema, 'db_spell'>;

export type DbStatCustomizer = CollectionCustomizer<Schema, 'db_stat'>;
export type DbStatRecord = TPartialRow<Schema, 'db_stat'>;
export type DbStatConditionTree = TConditionTree<Schema, 'db_stat'>;
export type DbStatFilter = TPaginatedFilter<Schema, 'db_stat'>;
export type DbStatSortClause = TSortClause<Schema, 'db_stat'>;
export type DbStatAggregation = TAggregation<Schema, 'db_stat'>;

export type DbWizardCustomizer = CollectionCustomizer<Schema, 'db_wizard'>;
export type DbWizardRecord = TPartialRow<Schema, 'db_wizard'>;
export type DbWizardConditionTree = TConditionTree<Schema, 'db_wizard'>;
export type DbWizardFilter = TPaginatedFilter<Schema, 'db_wizard'>;
export type DbWizardSortClause = TSortClause<Schema, 'db_wizard'>;
export type DbWizardAggregation = TAggregation<Schema, 'db_wizard'>;

export type DbWizardKnowledgeCustomizer = CollectionCustomizer<Schema, 'db_wizard_knowledge'>;
export type DbWizardKnowledgeRecord = TPartialRow<Schema, 'db_wizard_knowledge'>;
export type DbWizardKnowledgeConditionTree = TConditionTree<Schema, 'db_wizard_knowledge'>;
export type DbWizardKnowledgeFilter = TPaginatedFilter<Schema, 'db_wizard_knowledge'>;
export type DbWizardKnowledgeSortClause = TSortClause<Schema, 'db_wizard_knowledge'>;
export type DbWizardKnowledgeAggregation = TAggregation<Schema, 'db_wizard_knowledge'>;

export type DbWizardSpellCustomizer = CollectionCustomizer<Schema, 'db_wizard_spell'>;
export type DbWizardSpellRecord = TPartialRow<Schema, 'db_wizard_spell'>;
export type DbWizardSpellConditionTree = TConditionTree<Schema, 'db_wizard_spell'>;
export type DbWizardSpellFilter = TPaginatedFilter<Schema, 'db_wizard_spell'>;
export type DbWizardSpellSortClause = TSortClause<Schema, 'db_wizard_spell'>;
export type DbWizardSpellAggregation = TAggregation<Schema, 'db_wizard_spell'>;

export type DbWizardStatCustomizer = CollectionCustomizer<Schema, 'db_wizard_stat'>;
export type DbWizardStatRecord = TPartialRow<Schema, 'db_wizard_stat'>;
export type DbWizardStatConditionTree = TConditionTree<Schema, 'db_wizard_stat'>;
export type DbWizardStatFilter = TPaginatedFilter<Schema, 'db_wizard_stat'>;
export type DbWizardStatSortClause = TSortClause<Schema, 'db_wizard_stat'>;
export type DbWizardStatAggregation = TAggregation<Schema, 'db_wizard_stat'>;

export type MigrationsCustomizer = CollectionCustomizer<Schema, 'migrations'>;
export type MigrationsRecord = TPartialRow<Schema, 'migrations'>;
export type MigrationsConditionTree = TConditionTree<Schema, 'migrations'>;
export type MigrationsFilter = TPaginatedFilter<Schema, 'migrations'>;
export type MigrationsSortClause = TSortClause<Schema, 'migrations'>;
export type MigrationsAggregation = TAggregation<Schema, 'migrations'>;


export type Schema = {
  'Constellation': {
    plain: {
      'id': string;
      'name': string;
      'realName': string;
      'pictureUrl': string;
      'pictureUrlRevealed': string;
      'revealed': boolean;
      'isStarStream': boolean;
      'sponsor': boolean;
    };
    nested: {};
    flat: {};
  };
  'db_apotheose': {
    plain: {
      'name': string;
      'shortName': string;
      'displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'description': string;
      'position': number;
      'minLevel': number;
      'maxLevel': number;
      'cost': number;
      'chairImprovement': number;
      'espritImprovement': number;
      'essenceImprovement': number;
      'arcaneImprovement': boolean;
      'avantage': boolean;
      'apotheoseEffect': string;
    };
    nested: {};
    flat: {};
  };
  'db_bloodline': {
    plain: {
      'name': string;
      'display': string;
    };
    nested: {};
    flat: {};
  };
  'db_bloodline_proficiencies_db_proficiency': {
    plain: {
      'dbBloodlineName': string;
      'dbProficiencyName': string;
    };
    nested: {
      'db_bloodline': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
      'db_proficiency': Schema['db_proficiency']['plain'] & Schema['db_proficiency']['nested'];
    };
    flat: {
      'db_bloodline:name': string;
      'db_bloodline:display': string;
      'db_proficiency:name': string;
      'db_proficiency:shortName': string;
      'db_proficiency:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_proficiency:description': string;
      'db_proficiency:minLevel': number;
    };
  };
  'db_bloodline_skills_db_skill': {
    plain: {
      'dbBloodlineName': string;
      'dbSkillId': number;
    };
    nested: {
      'db_bloodline': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
      'dbSkill': Schema['db_skill']['plain'] & Schema['db_skill']['nested'];
    };
    flat: {
      'db_bloodline:name': string;
      'db_bloodline:display': string;
      'dbSkill:id': number;
      'dbSkill:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'dbSkill:allowsPf': boolean;
      'dbSkill:allowsPp': boolean;
      'dbSkill:stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'dbSkill:pvCost': number;
      'dbSkill:pfCost': number;
      'dbSkill:ppCost': number;
      'dbSkill:dettesCost': number;
      'dbSkill:dragonDettesCost': number;
      'dbSkill:arcaneCost': number;
      'dbSkill:etherCost': number;
      'dbSkill:arcanePrimeCost': number;
      'dbSkill:customRolls': string;
      'dbSkill:successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1' | 'DOUBLE' | 'DOUBLE_PLUS_1' | 'CUSTOM';
      'dbSkill:secret': boolean;
      'dbSkill:invocationTemplateName': string;
      'dbSkill:name': string;
      'dbSkill:shortName': string;
      'dbSkill:longName': string;
      'dbSkill:allAttribution': boolean;
      'dbSkill:position': number;
      'dbSkill:display': string;
      'dbSkill:isArcanique': boolean;
      'dbSkill:isHeal': boolean;
      'dbSkill:resistance': boolean;
      'dbSkill:help': boolean;
      'dbSkill:blessure': boolean;
      'dbSkill:description': string;
      'dbSkill:owner': string;
      'dbSkill:precision': string;
      'dbSkill:soldatCost': number;
      'dbSkill:db_character_template:name': string;
      'dbSkill:db_character_template:chairValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:chairValueRule': number;
      'dbSkill:db_character_template:espritValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:espritValueRule': number;
      'dbSkill:db_character_template:essenceValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:essenceValueRule': number;
      'dbSkill:db_character_template:pvMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:pvMaxValueRule': number;
      'dbSkill:db_character_template:pfMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:pfMaxValueRule': number;
      'dbSkill:db_character_template:ppMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:ppMaxValueRule': number;
      'dbSkill:db_character_template:picture': string;
      'dbSkill:db_character_template:customData': string;
      'dbSkill:db_character_template:classeName': string;
      'dbSkill:db_character_template:bloodlineName': string;
      'dbSkill:db_character_template:db_classe:name': string;
      'dbSkill:db_character_template:db_classe:displayMale': string;
      'dbSkill:db_character_template:db_classe:displayFemale': string;
      'dbSkill:db_character_template:db_classe:canUsePp': boolean;
      'dbSkill:db_character_template:db_bloodline:name': string;
      'dbSkill:db_character_template:db_bloodline:display': string;
    };
  };
  'db_character': {
    plain: {
      'name': string;
      'classeName': string;
      'controlledBy': string;
      'isInvocation': boolean;
      'currentApotheoseName': string;
      'apotheoseState': 'NONE' | 'ALREADY_USED' | 'COST_TO_PAY' | 'COST_PAID';
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
      'dragonDettes': number;
      'arcanes': number;
      'arcanesMax': number;
      'ether': number;
      'etherMax': number;
      'arcanePrimes': number;
      'arcanePrimesMax': number;
      'munitions': number;
      'munitionsMax': number;
      'niveau': number;
      'restImproved': boolean;
      'lux': string;
      'umbra': string;
      'secunda': string;
      'notes': string;
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
      'customData': string;
      'dailyUse': any;
      'dailyUseMax': any;
      'arcaneDette': any;
      'hurtMalus': boolean;
      'boulet': boolean;
      'dark': boolean;
    };
    nested: {
      'db_classe': Schema['db_classe']['plain'] & Schema['db_classe']['nested'];
      'db_apotheose': Schema['db_apotheose']['plain'] & Schema['db_apotheose']['nested'];
      'db_bloodline': Schema['db_bloodline']['plain'] & Schema['db_bloodline']['nested'];
    };
    flat: {
      'db_classe:name': string;
      'db_classe:displayMale': string;
      'db_classe:displayFemale': string;
      'db_classe:canUsePp': boolean;
      'db_apotheose:name': string;
      'db_apotheose:shortName': string;
      'db_apotheose:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_apotheose:description': string;
      'db_apotheose:position': number;
      'db_apotheose:minLevel': number;
      'db_apotheose:maxLevel': number;
      'db_apotheose:cost': number;
      'db_apotheose:chairImprovement': number;
      'db_apotheose:espritImprovement': number;
      'db_apotheose:essenceImprovement': number;
      'db_apotheose:arcaneImprovement': boolean;
      'db_apotheose:avantage': boolean;
      'db_apotheose:apotheoseEffect': string;
      'db_bloodline:name': string;
      'db_bloodline:display': string;
    };
  };
  'db_character_apotheoses_db_apotheose': {
    plain: {
      'dbCharacterName': string;
      'dbApotheoseName': string;
    };
    nested: {
      'db_character': Schema['db_character']['plain'] & Schema['db_character']['nested'];
      'db_apotheose': Schema['db_apotheose']['plain'] & Schema['db_apotheose']['nested'];
    };
    flat: {
      'db_character:name': string;
      'db_character:classeName': string;
      'db_character:controlledBy': string;
      'db_character:isInvocation': boolean;
      'db_character:currentApotheoseName': string;
      'db_character:apotheoseState': 'NONE' | 'ALREADY_USED' | 'COST_TO_PAY' | 'COST_PAID';
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
      'db_character:dragonDettes': number;
      'db_character:arcanes': number;
      'db_character:arcanesMax': number;
      'db_character:ether': number;
      'db_character:etherMax': number;
      'db_character:arcanePrimes': number;
      'db_character:arcanePrimesMax': number;
      'db_character:munitions': number;
      'db_character:munitionsMax': number;
      'db_character:niveau': number;
      'db_character:restImproved': boolean;
      'db_character:lux': string;
      'db_character:umbra': string;
      'db_character:secunda': string;
      'db_character:notes': string;
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
      'db_character:customData': string;
      'db_character:dailyUse': any;
      'db_character:dailyUseMax': any;
      'db_character:arcaneDette': any;
      'db_character:hurtMalus': boolean;
      'db_character:boulet': boolean;
      'db_character:dark': boolean;
      'db_character:db_classe:name': string;
      'db_character:db_classe:displayMale': string;
      'db_character:db_classe:displayFemale': string;
      'db_character:db_classe:canUsePp': boolean;
      'db_character:db_apotheose:name': string;
      'db_character:db_apotheose:shortName': string;
      'db_character:db_apotheose:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_character:db_apotheose:description': string;
      'db_character:db_apotheose:position': number;
      'db_character:db_apotheose:minLevel': number;
      'db_character:db_apotheose:maxLevel': number;
      'db_character:db_apotheose:cost': number;
      'db_character:db_apotheose:chairImprovement': number;
      'db_character:db_apotheose:espritImprovement': number;
      'db_character:db_apotheose:essenceImprovement': number;
      'db_character:db_apotheose:arcaneImprovement': boolean;
      'db_character:db_apotheose:avantage': boolean;
      'db_character:db_apotheose:apotheoseEffect': string;
      'db_character:db_bloodline:name': string;
      'db_character:db_bloodline:display': string;
      'db_apotheose:name': string;
      'db_apotheose:shortName': string;
      'db_apotheose:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_apotheose:description': string;
      'db_apotheose:position': number;
      'db_apotheose:minLevel': number;
      'db_apotheose:maxLevel': number;
      'db_apotheose:cost': number;
      'db_apotheose:chairImprovement': number;
      'db_apotheose:espritImprovement': number;
      'db_apotheose:essenceImprovement': number;
      'db_apotheose:arcaneImprovement': boolean;
      'db_apotheose:avantage': boolean;
      'db_apotheose:apotheoseEffect': string;
    };
  };
  'db_character_proficiencies_db_proficiency': {
    plain: {
      'dbCharacterName': string;
      'dbProficiencyName': string;
    };
    nested: {
      'db_character': Schema['db_character']['plain'] & Schema['db_character']['nested'];
      'db_proficiency': Schema['db_proficiency']['plain'] & Schema['db_proficiency']['nested'];
    };
    flat: {
      'db_character:name': string;
      'db_character:classeName': string;
      'db_character:controlledBy': string;
      'db_character:isInvocation': boolean;
      'db_character:currentApotheoseName': string;
      'db_character:apotheoseState': 'NONE' | 'ALREADY_USED' | 'COST_TO_PAY' | 'COST_PAID';
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
      'db_character:dragonDettes': number;
      'db_character:arcanes': number;
      'db_character:arcanesMax': number;
      'db_character:ether': number;
      'db_character:etherMax': number;
      'db_character:arcanePrimes': number;
      'db_character:arcanePrimesMax': number;
      'db_character:munitions': number;
      'db_character:munitionsMax': number;
      'db_character:niveau': number;
      'db_character:restImproved': boolean;
      'db_character:lux': string;
      'db_character:umbra': string;
      'db_character:secunda': string;
      'db_character:notes': string;
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
      'db_character:customData': string;
      'db_character:dailyUse': any;
      'db_character:dailyUseMax': any;
      'db_character:arcaneDette': any;
      'db_character:hurtMalus': boolean;
      'db_character:boulet': boolean;
      'db_character:dark': boolean;
      'db_character:db_classe:name': string;
      'db_character:db_classe:displayMale': string;
      'db_character:db_classe:displayFemale': string;
      'db_character:db_classe:canUsePp': boolean;
      'db_character:db_apotheose:name': string;
      'db_character:db_apotheose:shortName': string;
      'db_character:db_apotheose:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_character:db_apotheose:description': string;
      'db_character:db_apotheose:position': number;
      'db_character:db_apotheose:minLevel': number;
      'db_character:db_apotheose:maxLevel': number;
      'db_character:db_apotheose:cost': number;
      'db_character:db_apotheose:chairImprovement': number;
      'db_character:db_apotheose:espritImprovement': number;
      'db_character:db_apotheose:essenceImprovement': number;
      'db_character:db_apotheose:arcaneImprovement': boolean;
      'db_character:db_apotheose:avantage': boolean;
      'db_character:db_apotheose:apotheoseEffect': string;
      'db_character:db_bloodline:name': string;
      'db_character:db_bloodline:display': string;
      'db_proficiency:name': string;
      'db_proficiency:shortName': string;
      'db_proficiency:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_proficiency:description': string;
      'db_proficiency:minLevel': number;
    };
  };
  'db_character_skills_db_skill': {
    plain: {
      'dbCharacterName': string;
      'dbSkillId': number;
    };
    nested: {
      'db_character': Schema['db_character']['plain'] & Schema['db_character']['nested'];
      'dbSkill': Schema['db_skill']['plain'] & Schema['db_skill']['nested'];
    };
    flat: {
      'db_character:name': string;
      'db_character:classeName': string;
      'db_character:controlledBy': string;
      'db_character:isInvocation': boolean;
      'db_character:currentApotheoseName': string;
      'db_character:apotheoseState': 'NONE' | 'ALREADY_USED' | 'COST_TO_PAY' | 'COST_PAID';
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
      'db_character:dragonDettes': number;
      'db_character:arcanes': number;
      'db_character:arcanesMax': number;
      'db_character:ether': number;
      'db_character:etherMax': number;
      'db_character:arcanePrimes': number;
      'db_character:arcanePrimesMax': number;
      'db_character:munitions': number;
      'db_character:munitionsMax': number;
      'db_character:niveau': number;
      'db_character:restImproved': boolean;
      'db_character:lux': string;
      'db_character:umbra': string;
      'db_character:secunda': string;
      'db_character:notes': string;
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
      'db_character:customData': string;
      'db_character:dailyUse': any;
      'db_character:dailyUseMax': any;
      'db_character:arcaneDette': any;
      'db_character:hurtMalus': boolean;
      'db_character:boulet': boolean;
      'db_character:dark': boolean;
      'db_character:db_classe:name': string;
      'db_character:db_classe:displayMale': string;
      'db_character:db_classe:displayFemale': string;
      'db_character:db_classe:canUsePp': boolean;
      'db_character:db_apotheose:name': string;
      'db_character:db_apotheose:shortName': string;
      'db_character:db_apotheose:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_character:db_apotheose:description': string;
      'db_character:db_apotheose:position': number;
      'db_character:db_apotheose:minLevel': number;
      'db_character:db_apotheose:maxLevel': number;
      'db_character:db_apotheose:cost': number;
      'db_character:db_apotheose:chairImprovement': number;
      'db_character:db_apotheose:espritImprovement': number;
      'db_character:db_apotheose:essenceImprovement': number;
      'db_character:db_apotheose:arcaneImprovement': boolean;
      'db_character:db_apotheose:avantage': boolean;
      'db_character:db_apotheose:apotheoseEffect': string;
      'db_character:db_bloodline:name': string;
      'db_character:db_bloodline:display': string;
      'dbSkill:id': number;
      'dbSkill:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'dbSkill:allowsPf': boolean;
      'dbSkill:allowsPp': boolean;
      'dbSkill:stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'dbSkill:pvCost': number;
      'dbSkill:pfCost': number;
      'dbSkill:ppCost': number;
      'dbSkill:dettesCost': number;
      'dbSkill:dragonDettesCost': number;
      'dbSkill:arcaneCost': number;
      'dbSkill:etherCost': number;
      'dbSkill:arcanePrimeCost': number;
      'dbSkill:customRolls': string;
      'dbSkill:successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1' | 'DOUBLE' | 'DOUBLE_PLUS_1' | 'CUSTOM';
      'dbSkill:secret': boolean;
      'dbSkill:invocationTemplateName': string;
      'dbSkill:name': string;
      'dbSkill:shortName': string;
      'dbSkill:longName': string;
      'dbSkill:allAttribution': boolean;
      'dbSkill:position': number;
      'dbSkill:display': string;
      'dbSkill:isArcanique': boolean;
      'dbSkill:isHeal': boolean;
      'dbSkill:resistance': boolean;
      'dbSkill:help': boolean;
      'dbSkill:blessure': boolean;
      'dbSkill:description': string;
      'dbSkill:owner': string;
      'dbSkill:precision': string;
      'dbSkill:soldatCost': number;
      'dbSkill:db_character_template:name': string;
      'dbSkill:db_character_template:chairValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:chairValueRule': number;
      'dbSkill:db_character_template:espritValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:espritValueRule': number;
      'dbSkill:db_character_template:essenceValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:essenceValueRule': number;
      'dbSkill:db_character_template:pvMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:pvMaxValueRule': number;
      'dbSkill:db_character_template:pfMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:pfMaxValueRule': number;
      'dbSkill:db_character_template:ppMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:ppMaxValueRule': number;
      'dbSkill:db_character_template:picture': string;
      'dbSkill:db_character_template:customData': string;
      'dbSkill:db_character_template:classeName': string;
      'dbSkill:db_character_template:bloodlineName': string;
      'dbSkill:db_character_template:db_classe:name': string;
      'dbSkill:db_character_template:db_classe:displayMale': string;
      'dbSkill:db_character_template:db_classe:displayFemale': string;
      'dbSkill:db_character_template:db_classe:canUsePp': boolean;
      'dbSkill:db_character_template:db_bloodline:name': string;
      'dbSkill:db_character_template:db_bloodline:display': string;
    };
  };
  'db_character_template': {
    plain: {
      'name': string;
      'chairValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'chairValueRule': number;
      'espritValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'espritValueRule': number;
      'essenceValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'essenceValueRule': number;
      'pvMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'pvMaxValueRule': number;
      'pfMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'pfMaxValueRule': number;
      'ppMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'ppMaxValueRule': number;
      'picture': string;
      'customData': string;
      'classeName': string;
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
      'db_classe:canUsePp': boolean;
      'db_bloodline:name': string;
      'db_bloodline:display': string;
    };
  };
  'db_character_template_skills_db_skill': {
    plain: {
      'dbCharacterTemplateName': string;
      'dbSkillId': number;
    };
    nested: {
      'db_character_template': Schema['db_character_template']['plain'] & Schema['db_character_template']['nested'];
      'dbSkill': Schema['db_skill']['plain'] & Schema['db_skill']['nested'];
    };
    flat: {
      'db_character_template:name': string;
      'db_character_template:chairValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:chairValueRule': number;
      'db_character_template:espritValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:espritValueRule': number;
      'db_character_template:essenceValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:essenceValueRule': number;
      'db_character_template:pvMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:pvMaxValueRule': number;
      'db_character_template:pfMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:pfMaxValueRule': number;
      'db_character_template:ppMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:ppMaxValueRule': number;
      'db_character_template:picture': string;
      'db_character_template:customData': string;
      'db_character_template:classeName': string;
      'db_character_template:bloodlineName': string;
      'db_character_template:db_classe:name': string;
      'db_character_template:db_classe:displayMale': string;
      'db_character_template:db_classe:displayFemale': string;
      'db_character_template:db_classe:canUsePp': boolean;
      'db_character_template:db_bloodline:name': string;
      'db_character_template:db_bloodline:display': string;
      'dbSkill:id': number;
      'dbSkill:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'dbSkill:allowsPf': boolean;
      'dbSkill:allowsPp': boolean;
      'dbSkill:stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'dbSkill:pvCost': number;
      'dbSkill:pfCost': number;
      'dbSkill:ppCost': number;
      'dbSkill:dettesCost': number;
      'dbSkill:dragonDettesCost': number;
      'dbSkill:arcaneCost': number;
      'dbSkill:etherCost': number;
      'dbSkill:arcanePrimeCost': number;
      'dbSkill:customRolls': string;
      'dbSkill:successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1' | 'DOUBLE' | 'DOUBLE_PLUS_1' | 'CUSTOM';
      'dbSkill:secret': boolean;
      'dbSkill:invocationTemplateName': string;
      'dbSkill:name': string;
      'dbSkill:shortName': string;
      'dbSkill:longName': string;
      'dbSkill:allAttribution': boolean;
      'dbSkill:position': number;
      'dbSkill:display': string;
      'dbSkill:isArcanique': boolean;
      'dbSkill:isHeal': boolean;
      'dbSkill:resistance': boolean;
      'dbSkill:help': boolean;
      'dbSkill:blessure': boolean;
      'dbSkill:description': string;
      'dbSkill:owner': string;
      'dbSkill:precision': string;
      'dbSkill:soldatCost': number;
      'dbSkill:db_character_template:name': string;
      'dbSkill:db_character_template:chairValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:chairValueRule': number;
      'dbSkill:db_character_template:espritValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:espritValueRule': number;
      'dbSkill:db_character_template:essenceValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:essenceValueRule': number;
      'dbSkill:db_character_template:pvMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:pvMaxValueRule': number;
      'dbSkill:db_character_template:pfMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:pfMaxValueRule': number;
      'dbSkill:db_character_template:ppMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:ppMaxValueRule': number;
      'dbSkill:db_character_template:picture': string;
      'dbSkill:db_character_template:customData': string;
      'dbSkill:db_character_template:classeName': string;
      'dbSkill:db_character_template:bloodlineName': string;
      'dbSkill:db_character_template:db_classe:name': string;
      'dbSkill:db_character_template:db_classe:displayMale': string;
      'dbSkill:db_character_template:db_classe:displayFemale': string;
      'dbSkill:db_character_template:db_classe:canUsePp': boolean;
      'dbSkill:db_character_template:db_bloodline:name': string;
      'dbSkill:db_character_template:db_bloodline:display': string;
    };
  };
  'db_classe': {
    plain: {
      'name': string;
      'displayMale': string;
      'displayFemale': string;
      'canUsePp': boolean;
    };
    nested: {};
    flat: {};
  };
  'db_classe_apotheoses_db_apotheose': {
    plain: {
      'dbClasseName': string;
      'dbApotheoseName': string;
    };
    nested: {
      'db_classe': Schema['db_classe']['plain'] & Schema['db_classe']['nested'];
      'db_apotheose': Schema['db_apotheose']['plain'] & Schema['db_apotheose']['nested'];
    };
    flat: {
      'db_classe:name': string;
      'db_classe:displayMale': string;
      'db_classe:displayFemale': string;
      'db_classe:canUsePp': boolean;
      'db_apotheose:name': string;
      'db_apotheose:shortName': string;
      'db_apotheose:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_apotheose:description': string;
      'db_apotheose:position': number;
      'db_apotheose:minLevel': number;
      'db_apotheose:maxLevel': number;
      'db_apotheose:cost': number;
      'db_apotheose:chairImprovement': number;
      'db_apotheose:espritImprovement': number;
      'db_apotheose:essenceImprovement': number;
      'db_apotheose:arcaneImprovement': boolean;
      'db_apotheose:avantage': boolean;
      'db_apotheose:apotheoseEffect': string;
    };
  };
  'db_classe_proficiencies_db_proficiency': {
    plain: {
      'dbClasseName': string;
      'dbProficiencyName': string;
    };
    nested: {
      'db_classe': Schema['db_classe']['plain'] & Schema['db_classe']['nested'];
      'db_proficiency': Schema['db_proficiency']['plain'] & Schema['db_proficiency']['nested'];
    };
    flat: {
      'db_classe:name': string;
      'db_classe:displayMale': string;
      'db_classe:displayFemale': string;
      'db_classe:canUsePp': boolean;
      'db_proficiency:name': string;
      'db_proficiency:shortName': string;
      'db_proficiency:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_proficiency:description': string;
      'db_proficiency:minLevel': number;
    };
  };
  'db_classe_skills_db_skill': {
    plain: {
      'dbClasseName': string;
      'dbSkillId': number;
    };
    nested: {
      'db_classe': Schema['db_classe']['plain'] & Schema['db_classe']['nested'];
      'dbSkill': Schema['db_skill']['plain'] & Schema['db_skill']['nested'];
    };
    flat: {
      'db_classe:name': string;
      'db_classe:displayMale': string;
      'db_classe:displayFemale': string;
      'db_classe:canUsePp': boolean;
      'dbSkill:id': number;
      'dbSkill:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'dbSkill:allowsPf': boolean;
      'dbSkill:allowsPp': boolean;
      'dbSkill:stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'dbSkill:pvCost': number;
      'dbSkill:pfCost': number;
      'dbSkill:ppCost': number;
      'dbSkill:dettesCost': number;
      'dbSkill:dragonDettesCost': number;
      'dbSkill:arcaneCost': number;
      'dbSkill:etherCost': number;
      'dbSkill:arcanePrimeCost': number;
      'dbSkill:customRolls': string;
      'dbSkill:successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1' | 'DOUBLE' | 'DOUBLE_PLUS_1' | 'CUSTOM';
      'dbSkill:secret': boolean;
      'dbSkill:invocationTemplateName': string;
      'dbSkill:name': string;
      'dbSkill:shortName': string;
      'dbSkill:longName': string;
      'dbSkill:allAttribution': boolean;
      'dbSkill:position': number;
      'dbSkill:display': string;
      'dbSkill:isArcanique': boolean;
      'dbSkill:isHeal': boolean;
      'dbSkill:resistance': boolean;
      'dbSkill:help': boolean;
      'dbSkill:blessure': boolean;
      'dbSkill:description': string;
      'dbSkill:owner': string;
      'dbSkill:precision': string;
      'dbSkill:soldatCost': number;
      'dbSkill:db_character_template:name': string;
      'dbSkill:db_character_template:chairValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:chairValueRule': number;
      'dbSkill:db_character_template:espritValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:espritValueRule': number;
      'dbSkill:db_character_template:essenceValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:essenceValueRule': number;
      'dbSkill:db_character_template:pvMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:pvMaxValueRule': number;
      'dbSkill:db_character_template:pfMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:pfMaxValueRule': number;
      'dbSkill:db_character_template:ppMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'dbSkill:db_character_template:ppMaxValueRule': number;
      'dbSkill:db_character_template:picture': string;
      'dbSkill:db_character_template:customData': string;
      'dbSkill:db_character_template:classeName': string;
      'dbSkill:db_character_template:bloodlineName': string;
      'dbSkill:db_character_template:db_classe:name': string;
      'dbSkill:db_character_template:db_classe:displayMale': string;
      'dbSkill:db_character_template:db_classe:displayFemale': string;
      'dbSkill:db_character_template:db_classe:canUsePp': boolean;
      'dbSkill:db_character_template:db_bloodline:name': string;
      'dbSkill:db_character_template:db_bloodline:display': string;
    };
  };
  'db_entry': {
    plain: {
      'day': number;
      'month': number;
      'year': number;
      'text': string;
    };
    nested: {};
    flat: {};
  };
  'db_flip': {
    plain: {
      'id': string;
      'createdDate': string;
      'updatedDate': string;
      'text': string;
      'wizardName': string;
      'result': number;
      'base': number;
      'modif': number;
      'difficulty': string;
    };
    nested: {};
    flat: {};
  };
  'db_knowledge': {
    plain: {
      'createdDate': string;
      'updatedDate': string;
      'name': string;
      'flipText': string;
    };
    nested: {};
    flat: {};
  };
  'db_proficiency': {
    plain: {
      'name': string;
      'shortName': string;
      'displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'description': string;
      'minLevel': number;
    };
    nested: {};
    flat: {};
  };
  'db_roll': {
    plain: {
      'id': string;
      'rollerName': string;
      'date': string;
      'stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
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
      'picture': string;
      'illustration': string;
      'data': string;
      'empiriqueRoll': string;
      'resistRoll': string;
      'display': string;
      'healPoint': number;
      'resistance': boolean;
      'blessure': boolean;
      'help': boolean;
      'precision': string;
      'pictureUrl': string;
      'dark': boolean;
    };
    nested: {
      'db_character': Schema['db_character']['plain'] & Schema['db_character']['nested'];
    };
    flat: {
      'db_character:name': string;
      'db_character:classeName': string;
      'db_character:controlledBy': string;
      'db_character:isInvocation': boolean;
      'db_character:currentApotheoseName': string;
      'db_character:apotheoseState': 'NONE' | 'ALREADY_USED' | 'COST_TO_PAY' | 'COST_PAID';
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
      'db_character:dragonDettes': number;
      'db_character:arcanes': number;
      'db_character:arcanesMax': number;
      'db_character:ether': number;
      'db_character:etherMax': number;
      'db_character:arcanePrimes': number;
      'db_character:arcanePrimesMax': number;
      'db_character:munitions': number;
      'db_character:munitionsMax': number;
      'db_character:niveau': number;
      'db_character:restImproved': boolean;
      'db_character:lux': string;
      'db_character:umbra': string;
      'db_character:secunda': string;
      'db_character:notes': string;
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
      'db_character:customData': string;
      'db_character:dailyUse': any;
      'db_character:dailyUseMax': any;
      'db_character:arcaneDette': any;
      'db_character:hurtMalus': boolean;
      'db_character:boulet': boolean;
      'db_character:dark': boolean;
      'db_character:db_classe:name': string;
      'db_character:db_classe:displayMale': string;
      'db_character:db_classe:displayFemale': string;
      'db_character:db_classe:canUsePp': boolean;
      'db_character:db_apotheose:name': string;
      'db_character:db_apotheose:shortName': string;
      'db_character:db_apotheose:displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'db_character:db_apotheose:description': string;
      'db_character:db_apotheose:position': number;
      'db_character:db_apotheose:minLevel': number;
      'db_character:db_apotheose:maxLevel': number;
      'db_character:db_apotheose:cost': number;
      'db_character:db_apotheose:chairImprovement': number;
      'db_character:db_apotheose:espritImprovement': number;
      'db_character:db_apotheose:essenceImprovement': number;
      'db_character:db_apotheose:arcaneImprovement': boolean;
      'db_character:db_apotheose:avantage': boolean;
      'db_character:db_apotheose:apotheoseEffect': string;
      'db_character:db_bloodline:name': string;
      'db_character:db_bloodline:display': string;
    };
  };
  'db_session': {
    plain: {
      'id': number;
      'chaos': '0' | '15' | '30' | '45' | '60' | '75';
      'nature': 'LEVEL_0_PAUVRE' | 'LEVEL_1_RARE' | 'LEVEL_2_PRESENTE' | 'LEVEL_3_ABONDANTE' | 'LEVEL_4_RICHE' | 'LEVEL_5_DOMINANTE';
      'baseRest': number;
      'improvedRest': number;
      'owners': string;
      'fake': number;
      'entries': string;
      'speaking': string;
    };
    nested: {};
    flat: {};
  };
  'db_skill': {
    plain: {
      'id': number;
      'displayCategory': 'STATS' | 'MAGIE' | 'ARCANES' | 'ARCANES_PRIMES' | 'BONUS' | 'SOLDATS' | 'PACIFICATEURS' | 'PAROLIERS' | 'TECHNOMANCIE' | 'SOUTIENS';
      'allowsPf': boolean;
      'allowsPp': boolean;
      'stat': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'EMPIRIQUE' | 'CUSTOM';
      'pvCost': number;
      'pfCost': number;
      'ppCost': number;
      'dettesCost': number;
      'dragonDettesCost': number;
      'arcaneCost': number;
      'etherCost': number;
      'arcanePrimeCost': number;
      'customRolls': string;
      'successCalculation': 'AUCUN' | 'SIMPLE' | 'SIMPLE_PLUS_1' | 'DIVISE' | 'DIVISE_PLUS_1' | 'DOUBLE' | 'DOUBLE_PLUS_1' | 'CUSTOM';
      'secret': boolean;
      'invocationTemplateName': string;
      'name': string;
      'shortName': string;
      'longName': string;
      'allAttribution': boolean;
      'position': number;
      'display': string;
      'isArcanique': boolean;
      'isHeal': boolean;
      'resistance': boolean;
      'help': boolean;
      'blessure': boolean;
      'description': string;
      'owner': string;
      'precision': string;
      'soldatCost': number;
    };
    nested: {
      'db_character_template': Schema['db_character_template']['plain'] & Schema['db_character_template']['nested'];
    };
    flat: {
      'db_character_template:name': string;
      'db_character_template:chairValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:chairValueRule': number;
      'db_character_template:espritValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:espritValueRule': number;
      'db_character_template:essenceValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:essenceValueRule': number;
      'db_character_template:pvMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:pvMaxValueRule': number;
      'db_character_template:pfMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:pfMaxValueRule': number;
      'db_character_template:ppMaxValueReferential': 'FIXE' | 'CHAIR' | 'ESPRIT' | 'ESSENCE' | 'SUCCESS';
      'db_character_template:ppMaxValueRule': number;
      'db_character_template:picture': string;
      'db_character_template:customData': string;
      'db_character_template:classeName': string;
      'db_character_template:bloodlineName': string;
      'db_character_template:db_classe:name': string;
      'db_character_template:db_classe:displayMale': string;
      'db_character_template:db_classe:displayFemale': string;
      'db_character_template:db_classe:canUsePp': boolean;
      'db_character_template:db_bloodline:name': string;
      'db_character_template:db_bloodline:display': string;
    };
  };
  'db_spell': {
    plain: {
      'createdDate': string;
      'updatedDate': string;
      'name': string;
      'rank': number;
      'statId': string;
      'knowledgeId': string;
    };
    nested: {
      'stat': Schema['db_stat']['plain'] & Schema['db_stat']['nested'];
      'knowledge': Schema['db_knowledge']['plain'] & Schema['db_knowledge']['nested'];
    };
    flat: {
      'stat:createdDate': string;
      'stat:updatedDate': string;
      'stat:name': string;
      'stat:order': number;
      'stat:flipText': string;
      'knowledge:createdDate': string;
      'knowledge:updatedDate': string;
      'knowledge:name': string;
      'knowledge:flipText': string;
    };
  };
  'db_stat': {
    plain: {
      'createdDate': string;
      'updatedDate': string;
      'name': string;
      'order': number;
      'flipText': string;
    };
    nested: {};
    flat: {};
  };
  'db_wizard': {
    plain: {
      'createdDate': string;
      'updatedDate': string;
      'name': string;
      'category': string;
      'xp': number;
    };
    nested: {};
    flat: {};
  };
  'db_wizard_knowledge': {
    plain: {
      'createdDate': string;
      'updatedDate': string;
      'level': number;
      'wizardName': string;
      'knowledgeName': string;
      'xp': number;
    };
    nested: {
      'db_wizard': Schema['db_wizard']['plain'] & Schema['db_wizard']['nested'];
      'db_knowledge': Schema['db_knowledge']['plain'] & Schema['db_knowledge']['nested'];
    };
    flat: {
      'db_wizard:createdDate': string;
      'db_wizard:updatedDate': string;
      'db_wizard:name': string;
      'db_wizard:category': string;
      'db_wizard:xp': number;
      'db_knowledge:createdDate': string;
      'db_knowledge:updatedDate': string;
      'db_knowledge:name': string;
      'db_knowledge:flipText': string;
    };
  };
  'db_wizard_spell': {
    plain: {
      'createdDate': string;
      'updatedDate': string;
      'difficulty': string;
      'wizardName': string;
      'spellName': string;
      'xp': number;
    };
    nested: {
      'db_wizard': Schema['db_wizard']['plain'] & Schema['db_wizard']['nested'];
      'db_spell': Schema['db_spell']['plain'] & Schema['db_spell']['nested'];
    };
    flat: {
      'db_wizard:createdDate': string;
      'db_wizard:updatedDate': string;
      'db_wizard:name': string;
      'db_wizard:category': string;
      'db_wizard:xp': number;
      'db_spell:createdDate': string;
      'db_spell:updatedDate': string;
      'db_spell:name': string;
      'db_spell:rank': number;
      'db_spell:statId': string;
      'db_spell:knowledgeId': string;
      'db_spell:stat:createdDate': string;
      'db_spell:stat:updatedDate': string;
      'db_spell:stat:name': string;
      'db_spell:stat:order': number;
      'db_spell:stat:flipText': string;
      'db_spell:knowledge:createdDate': string;
      'db_spell:knowledge:updatedDate': string;
      'db_spell:knowledge:name': string;
      'db_spell:knowledge:flipText': string;
    };
  };
  'db_wizard_stat': {
    plain: {
      'createdDate': string;
      'updatedDate': string;
      'level': number;
      'wizardName': string;
      'statName': string;
      'xp': number;
    };
    nested: {
      'db_wizard': Schema['db_wizard']['plain'] & Schema['db_wizard']['nested'];
      'db_stat': Schema['db_stat']['plain'] & Schema['db_stat']['nested'];
    };
    flat: {
      'db_wizard:createdDate': string;
      'db_wizard:updatedDate': string;
      'db_wizard:name': string;
      'db_wizard:category': string;
      'db_wizard:xp': number;
      'db_stat:createdDate': string;
      'db_stat:updatedDate': string;
      'db_stat:name': string;
      'db_stat:order': number;
      'db_stat:flipText': string;
    };
  };
  'Event': {
    plain: {
      'id': string;
      'description': string;
    };
    nested: {};
    flat: {};
  };
  'Joueuse': {
    plain: {
      'id': string;
      'name': string;
      'sponsorToChoose': boolean;
      'coins': number;
      'sponsorId': string;
      'scenarioId': string;
      'state': 'NOT_STARTED' | 'STARTED' | 'FINISHED';
    };
    nested: {
      'sponsor': Schema['Constellation']['plain'] & Schema['Constellation']['nested'];
      'scenario': Schema['Scenario']['plain'] & Schema['Scenario']['nested'];
    };
    flat: {
      'sponsor:id': string;
      'sponsor:name': string;
      'sponsor:realName': string;
      'sponsor:pictureUrl': string;
      'sponsor:pictureUrlRevealed': string;
      'sponsor:revealed': boolean;
      'sponsor:isStarStream': boolean;
      'sponsor:sponsor': boolean;
      'scenario:id': string;
      'scenario:name': string;
      'scenario:difficulty': string;
      'scenario:victory': string;
      'scenario:defeat': string;
      'scenario:time': string;
      'scenario:reward': string;
      'scenario:rewardCoin': number;
      'scenario:text': string;
      'scenario:victoryMsg': string;
      'scenario:defaiteMsg': string;
    };
  };
  'Message': {
    plain: {
      'id': string;
      'text': string;
      'senderId': string;
    };
    nested: {
      'sender': Schema['Constellation']['plain'] & Schema['Constellation']['nested'];
    };
    flat: {
      'sender:id': string;
      'sender:name': string;
      'sender:realName': string;
      'sender:pictureUrl': string;
      'sender:pictureUrlRevealed': string;
      'sender:revealed': boolean;
      'sender:isStarStream': boolean;
      'sender:sponsor': boolean;
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
  'ModelMessage': {
    plain: {
      'id': string;
      'text': string;
      'senderId': string;
      'eventId': string;
      'scenarioId': string;
      'scenario': string;
    };
    nested: {
      'sender': Schema['Constellation']['plain'] & Schema['Constellation']['nested'];
      'event': Schema['Event']['plain'] & Schema['Event']['nested'];
      'Scenario': Schema['Scenario']['plain'] & Schema['Scenario']['nested'];
    };
    flat: {
      'sender:id': string;
      'sender:name': string;
      'sender:realName': string;
      'sender:pictureUrl': string;
      'sender:pictureUrlRevealed': string;
      'sender:revealed': boolean;
      'sender:isStarStream': boolean;
      'sender:sponsor': boolean;
      'event:id': string;
      'event:description': string;
      'Scenario:id': string;
      'Scenario:name': string;
      'Scenario:difficulty': string;
      'Scenario:victory': string;
      'Scenario:defeat': string;
      'Scenario:time': string;
      'Scenario:reward': string;
      'Scenario:rewardCoin': number;
      'Scenario:text': string;
      'Scenario:victoryMsg': string;
      'Scenario:defaiteMsg': string;
    };
  };
  'Scenario': {
    plain: {
      'id': string;
      'name': string;
      'difficulty': string;
      'victory': string;
      'defeat': string;
      'time': string;
      'reward': string;
      'rewardCoin': number;
      'text': string;
      'victoryMsg': string;
      'defaiteMsg': string;
    };
    nested: {};
    flat: {};
  };
};
