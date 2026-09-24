import {
  ArrayInput,
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  Edit,
  FunctionField,
  List,
  NumberInput,
  required,
  SelectArrayInput,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  useGetList
} from 'react-admin'
import { CharacterEntity } from '../data/types'

function useChoices(resource: string, labelField = 'name') {
  const { data } = useGetList(resource, {
    pagination: { page: 1, perPage: 500 },
    sort: { field: labelField, order: 'ASC' }
  })
  return (data ?? []).map((record) => ({
    id: record.id,
    name: (record as Record<string, unknown>)[labelField] as string
  }))
}

function GroupsInput() {
  return <SelectArrayInput source="groupSlugs" label="Groupes" choices={useChoices('groups')} />
}

function TraitsInput() {
  return <SelectArrayInput source="traitSlugs" label="Traits" choices={useChoices('traits')} />
}

function ClassInput() {
  return <SelectInput source="classSlug" label="Classe" choices={useChoices('classes')} emptyText="Aucune" />
}

function PlayerInput() {
  return <SelectInput source="playerSlug" label="Joueur" choices={useChoices('players')} emptyText="Non attribué" />
}

function ItemsInput() {
  const itemChoices = useChoices('items')
  return (
    <ArrayInput source="items" label="Objets possédés">
      <SimpleFormIterator inline>
        <SelectInput source="itemSlug" label="Objet" choices={itemChoices} validate={required()} />
        <NumberInput source="quantity" label="Quantité" defaultValue={1} min={1} />
      </SimpleFormIterator>
    </ArrayInput>
  )
}

function ResourcesInput() {
  return (
    <ArrayInput source="resources" label="Ressources">
      <SimpleFormIterator inline>
        <TextInput source="name" label="Nom" validate={required()} />
        <NumberInput source="value" label="Valeur" />
      </SimpleFormIterator>
    </ArrayInput>
  )
}

// Character stats always exist for every stat defined on the JdR (only their value can change,
// there is no add/remove endpoint), so this iterator only allows editing values, not rows.
function StatsInput() {
  const statNames = new Map(useChoices('stats').map((c) => [c.id, c.name]))

  return (
    <ArrayInput source="stats" label="Statistiques">
      <SimpleFormIterator inline disableAdd disableRemove disableReordering>
        <FunctionField
          label="Stat"
          render={(record: { statSlug?: string }) => statNames.get(record.statSlug ?? '') ?? record.statSlug}
        />
        <NumberInput source="value" label="Valeur" />
      </SimpleFormIterator>
    </ArrayInput>
  )
}

export function CharacterList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <BooleanField source="isPlayable" label="Jouable" />
        <BooleanField source="public" label="Public" />
        <FunctionField label="Groupes" render={(record: CharacterEntity) => record.groupSlugs.join(', ') || '-'} />
        <TextField source="slug" label="Slug" />
      </Datagrid>
    </List>
  )
}

export function CharacterEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <ClassInput />
        <PlayerInput />
        <TextInput source="classLevel" label="Niveau de classe" />
        <BooleanInput source="isPlayable" label="Jouable" />
        <BooleanInput source="public" label="Public" />
        <TextInput source="text" label="Description" multiline fullWidth />
        <GroupsInput />
        <TraitsInput />
        <ItemsInput />
        <ResourcesInput />
        <StatsInput />
      </SimpleForm>
    </Edit>
  )
}

export function CharacterCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <ClassInput />
        <PlayerInput />
        <TextInput source="classLevel" label="Niveau de classe" />
        <BooleanInput source="isPlayable" label="Jouable" />
        <BooleanInput source="public" label="Public" defaultValue={true} />
        <TextInput source="text" label="Description" multiline fullWidth />
      </SimpleForm>
    </Create>
  )
}
