import { Create, Datagrid, Edit, List, required, SimpleForm, TextField, TextInput } from 'react-admin'

export function PlayerList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <TextField source="slug" label="Slug" />
      </Datagrid>
    </List>
  )
}

export function PlayerEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
      </SimpleForm>
    </Edit>
  )
}

export function PlayerCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
      </SimpleForm>
    </Create>
  )
}
