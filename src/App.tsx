import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { repository } from './db/repository'
import { CustomersPage } from './pages/CustomersPage'
import { DashboardPage } from './pages/DashboardPage'
import { IssueDetailPage } from './pages/IssueDetailPage'
import { IssuesPage } from './pages/IssuesPage'
import { OwnersPage } from './pages/OwnersPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SitesPage } from './pages/SitesPage'

function App() {
  useEffect(() => {
    void repository.createOverdueNotifications()

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined)
    }
  }, [])

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/owners" element={<OwnersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

export default App
