import {
  ArrayInput,
  BooleanInput,
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

function ModifiersInput() {
  const { data: stats } = useGetList('stats', { pagination: { page: 1, perPage: 200 }, sort: { field: 'name', order: 'ASC' } })
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

export function ItemList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <TextField source="description" label="Description" />
        <TextField source="slug" label="Slug" />
      </Datagrid>
    </List>
  )
}

export function ItemEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <TextInput source="description" label="Description" multiline fullWidth />
        <BooleanInput source="unique" label="Objet unique" />
        <ModifiersInput />
        <NumberInput source="groupQuantity" label="Quantité dans l'inventaire du groupe" min={0} helperText="Objet partagé par toute l'équipe, indépendant des personnages" />
      </SimpleForm>
    </Edit>
  )
}

export function ItemCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <TextInput source="description" label="Description" multiline fullWidth />
        <BooleanInput source="unique" label="Objet unique" />
        <ModifiersInput />
      </SimpleForm>
    </Create>
  )
}
