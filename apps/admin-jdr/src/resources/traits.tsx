import {
  ArrayInput,
  Create,
  Datagrid,
  Edit,
  List,
  NumberInput,
  required,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  useGetList
} from 'react-admin'

const TRAIT_TYPE_CHOICES = [
  { id: 'Normal', name: 'Normal' },
  { id: 'Defaut', name: 'Défaut' },
  { id: 'Secret', name: 'Secret' },
  { id: 'Sort', name: 'Sort' }
]

function ModifiersInput() {
  const { data: stats } = useGetList('stats', {
    pagination: { page: 1, perPage: 200 },
    sort: { field: 'name', order: 'ASC' }
  })
  const statChoices = (stats ?? []).map((s) => ({ id: s.slug, name: s.name }))

  return (
    <ArrayInput source="modifiers" label="Modificateurs de stats">
      <SimpleFormIterator inline>
        <SelectInput source="statSlug" label="Stat" choices={statChoices} validate={required()} />
        <NumberInput source="value" label="Valeur" validate={required()} />
      </SimpleFormIterator>
    </ArrayInput>
  )
}

export function TraitList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <TextField source="type" label="Type" />
        <TextField source="slug" label="Slug" />
      </Datagrid>
    </List>
  )
}

export function TraitEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <SelectInput source="type" label="Type" choices={TRAIT_TYPE_CHOICES} validate={required()} />
        <NumberInput source="level" label="Niveau" />
        <ModifiersInput />
      </SimpleForm>
    </Edit>
  )
}

export function TraitCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <SelectInput
          source="type"
          label="Type"
          choices={TRAIT_TYPE_CHOICES}
          defaultValue="Normal"
          validate={required()}
        />
        <NumberInput source="level" label="Niveau" />
        <ModifiersInput />
      </SimpleForm>
    </Create>
  )
}
