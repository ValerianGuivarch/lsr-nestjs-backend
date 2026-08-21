import { AppBar, Layout, LayoutProps, TitlePortal } from 'react-admin'
import { JdrSwitcher } from './JdrSwitcher'

// Hub = web-misc dev server (npm run dev:web:misc), which lists all apps.
function buildHubUrl(): string {
  return `${window.location.protocol}//${window.location.hostname}:3000`
}

function JdrAdminAppBar() {
  return (
    <AppBar>
      <TitlePortal />
      <JdrSwitcher />
      <a
        href={buildHubUrl()}
        style={{ color: 'inherit', marginLeft: '1rem', fontSize: '0.85rem', textDecoration: 'none' }}
      >
        ← Apps
      </a>
    </AppBar>
  )
}

export function CustomLayout(props: LayoutProps) {
  return <Layout {...props} appBar={JdrAdminAppBar} />
}
