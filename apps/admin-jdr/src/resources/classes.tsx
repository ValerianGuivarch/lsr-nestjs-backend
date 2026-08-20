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

const BEHAVIOR_CHOICES = [
  { id: 'fixed', name: 'Fixe' },
  { id: 'scalable', name: 'Évolutif avec le niveau' }
]

function ClassResourcesInput() {
  const { data: resources } = useGetList('resources', { pagination: { page: 1, perPage: 200 }, sort: { field: 'name', order: 'ASC' } })
  const resourceChoices = (resources ?? []).map((r) => ({ id: r.slug, name: r.name }))

  return (
    <ArrayInput source="resources" label="Ressources de la classe">
      <SimpleFormIterator inline>
        <SelectInput source="resourceSlug" label="Ressource" choices={resourceChoices} validate={required()} />
        <TextInput source="resourceType" label="Type" validate={required()} helperText="ex: specific, all" />
        <NumberInput source="defaultValue" label="Valeur par défaut" />
        <SelectInput source="behavior" label="Comportement" choices={BEHAVIOR_CHOICES} />
      </SimpleFormIterator>
    </ArrayInput>
  )
}

export function ClassList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <TextField source="level" label="Niveau" />
        <TextField source="slug" label="Slug" />
      </Datagrid>
    </List>
  )
}

export function ClassEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <NumberInput source="level" label="Niveau" validate={required()} />
        <TextInput source="text" label="Description" multiline fullWidth />
        <ClassResourcesInput />
      </SimpleForm>
    </Edit>
  )
}

export function ClassCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <NumberInput source="level" label="Niveau" defaultValue={1} validate={required()} />
        <TextInput source="text" label="Description" multiline fullWidth />
      </SimpleForm>
    </Create>
  )
}
