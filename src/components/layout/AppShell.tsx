import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Breadcrumbs } from './Breadcrumbs'
import { PageTitleProvider } from '@/hooks/usePageTitle'

export function AppShell() {
  return (
    <PageTitleProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <div className="mb-4">
              <Breadcrumbs />
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </PageTitleProvider>
  )
}
