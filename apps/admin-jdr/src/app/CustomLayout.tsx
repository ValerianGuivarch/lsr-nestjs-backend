import { AppBar, Layout, LayoutProps, TitlePortal } from 'react-admin'
import { JdrSwitcher } from './JdrSwitcher'

function JdrAdminAppBar() {
  return (
    <AppBar>
      <TitlePortal />
      <JdrSwitcher />
    </AppBar>
  )
}

export function CustomLayout(props: LayoutProps) {
  return <Layout {...props} appBar={JdrAdminAppBar} />
}
