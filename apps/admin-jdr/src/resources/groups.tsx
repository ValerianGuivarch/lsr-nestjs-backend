import {
  ArrayInput,
  Create,
  Datagrid,
  Edit,
  List,
  NumberInput,
  required,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput
} from 'react-admin'

export function GroupList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <TextField source="slug" label="Slug" />
      </Datagrid>
    </List>
  )
}

export function GroupEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <TextInput source="text" label="Description" multiline fullWidth />
        <ArrayInput source="resources" label="Ressources">
          <SimpleFormIterator inline>
            <TextInput source="name" label="Nom" validate={required()} />
            <NumberInput source="value" label="Valeur" />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Edit>
  )
}

export function GroupCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <TextInput source="text" label="Description" multiline fullWidth />
      </SimpleForm>
    </Create>
  )
}
