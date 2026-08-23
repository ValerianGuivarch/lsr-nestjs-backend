import {
  ArrayInput,
  Create,
  Datagrid,
  Edit,
  FunctionField,
  List,
  required,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput
} from 'react-admin'
import { ClassEntity } from '../data/types'

export function ClassList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Nom" />
        <FunctionField label="Niveaux" render={(record: ClassEntity) => record.levels.join(', ') || '-'} />
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
        <LevelsInput />
        <TextInput source="text" label="Description" multiline fullWidth />
      </SimpleForm>
    </Edit>
  )
}

export function ClassCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm>
        <TextInput source="name" label="Nom" validate={required()} />
        <LevelsInput />
        <TextInput source="text" label="Description" multiline fullWidth />
      </SimpleForm>
    </Create>
  )
}

function LevelsInput() {
  return (
    <ArrayInput source="levels" label="Niveaux nommés">
      <SimpleFormIterator inline>
        <TextInput source="" label="Niveau" validate={required()} />
      </SimpleFormIterator>
    </ArrayInput>
  )
}
