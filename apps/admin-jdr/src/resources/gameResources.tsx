import {
  Create,
  Datagrid,
  Edit,
  List,
  NumberInput,
  required,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput
} from 'react-admin'

const OWNER_CHOICES = [
  { id: 'CHARACTER', name: 'Personnages' },
  { id: 'GROUP', name: 'Groupes' }
]

export function GameResourceList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <TextField source="ownerType" label="Propriétaires" />
        <TextField source="defaultValue" label="Valeur par défaut" />
        <TextField source="slug" label="Slug" />
      </Datagrid>
    </List>
  )
}

export function GameResourceEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <TextField source="ownerType" label="Propriétaires" />
        <NumberInput source="defaultValue" label="Valeur par défaut" />
      </SimpleForm>
    </Edit>
  )
}

export function GameResourceCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <SelectInput
          source="ownerType"
          label="Propriétaires"
          choices={OWNER_CHOICES}
          defaultValue="CHARACTER"
          validate={required()}
        />
        <NumberInput source="defaultValue" label="Valeur par défaut" defaultValue={0} />
      </SimpleForm>
    </Create>
  )
}
