import { Admin, CustomRoutes, Resource } from 'react-admin'
import { Route } from 'react-router-dom'
import { dataProvider } from '../data/dataProvider'
import { authProvider } from '../data/authProvider'
import { CustomLayout } from './CustomLayout'
import { JdrList, JdrEdit, JdrCreate } from '../resources/jdrs'
import { CharacterList, CharacterEdit, CharacterCreate } from '../resources/characters'
import { GroupList, GroupEdit, GroupCreate } from '../resources/groups'
import { ItemList, ItemEdit, ItemCreate } from '../resources/items'
import { ClassList, ClassEdit, ClassCreate } from '../resources/classes'
import { StatList, StatEdit, StatCreate } from '../resources/stats'
import { TraitList, TraitEdit, TraitCreate } from '../resources/traits'
import { GameResourceList, GameResourceEdit, GameResourceCreate } from '../resources/gameResources'
import { RollList } from '../resources/rolls'
import { PlayerCreate, PlayerEdit, PlayerList } from '../resources/players'
import { ImportJsonPage } from './ImportJsonPage'

export default function App() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider} layout={CustomLayout} title="JdR Admin">
      <Resource name="jdrs" options={{ label: 'JdRs' }} list={JdrList} edit={JdrEdit} create={JdrCreate} />
      <Resource
        name="characters"
        options={{ label: 'Personnages' }}
        list={CharacterList}
        edit={CharacterEdit}
        create={CharacterCreate}
      />
      <Resource
        name="players"
        options={{ label: 'Joueurs' }}
        list={PlayerList}
        edit={PlayerEdit}
        create={PlayerCreate}
      />
      <Resource name="groups" options={{ label: 'Groupes' }} list={GroupList} edit={GroupEdit} create={GroupCreate} />
      <Resource name="items" options={{ label: 'Objets' }} list={ItemList} edit={ItemEdit} create={ItemCreate} />
      <Resource name="classes" options={{ label: 'Classes' }} list={ClassList} edit={ClassEdit} create={ClassCreate} />
      <Resource name="traits" options={{ label: 'Traits' }} list={TraitList} edit={TraitEdit} create={TraitCreate} />
      <Resource
        name="resources"
        options={{ label: 'Ressources' }}
        list={GameResourceList}
        edit={GameResourceEdit}
        create={GameResourceCreate}
      />
      <Resource name="stats" options={{ label: 'Stats' }} list={StatList} edit={StatEdit} create={StatCreate} />
      <Resource name="rolls" options={{ label: 'Historique des jets' }} list={RollList} />
      <CustomRoutes>
        <Route path="/import-json" element={<ImportJsonPage />} />
      </CustomRoutes>
    </Admin>
  )
}
