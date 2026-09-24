import { Create, Datagrid, Edit, List, required, SimpleForm, TextField, TextInput } from 'react-admin'

export function StatList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <TextField source="slug" label="Slug" />
      </Datagrid>
    </List>
  )
}

export function StatEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
      </SimpleForm>
    </Edit>
  )
}

export function StatCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
      </SimpleForm>
    </Create>
  )
}
