import { Create, Datagrid, Edit, List, required, SimpleForm, TextField, TextInput } from 'react-admin'

export function JdrList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <TextField source="slug" label="Slug" />
      </Datagrid>
    </List>
  )
}

export function JdrEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <TextInput source="text" label="Description" multiline fullWidth />
      </SimpleForm>
    </Edit>
  )
}

export function JdrCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <TextInput source="text" label="Description" multiline fullWidth />
      </SimpleForm>
    </Create>
  )
}
