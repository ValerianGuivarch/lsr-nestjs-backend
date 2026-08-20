import { Create, Datagrid, Edit, List, NumberInput, required, SimpleForm, TextField, TextInput } from 'react-admin'

export function GameResourceList() {
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

export function GameResourceEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <TextInput source="type" label="Type" validate={required()} helperText="ex: specific, all" />
        <NumberInput source="groupValue" label="Valeur du pool de groupe" min={0} helperText="Réserve partagée par toute l'équipe, indépendante des personnages" />
      </SimpleForm>
    </Edit>
  )
}

export function GameResourceCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <TextInput source="type" label="Type" validate={required()} helperText="ex: specific, all" />
      </SimpleForm>
    </Create>
  )
}
