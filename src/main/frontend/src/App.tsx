import { useState } from 'react';
import { AdminLayout } from './layouts/AdminLayout';
import type { NavigationId } from './navigation/navigationItems';
import { DashboardPage } from './pages/DashboardPage';
import { SparqlQueryPage } from './pages/SparqlQueryPage';
import { DependencyPathPage } from './pages/DependencyPathPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { DependenciesPage } from './pages/DependenciesPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import { AssistantPage } from './pages/AssistantPage';
import { SettingsPage } from './pages/SettingsPage';

const pageTitles: Record<NavigationId, string> = {
  dashboard: 'Dashboard',
  sparql: 'SPARQL Query',
  dependencyPath: 'Dependency Path',
  applications: 'Applications',
  dependencies: 'Dependencies',
  vulnerabilities: 'Vulnerabilities',
  assistant: 'Security Assistant',
  settings: 'Settings'
};

export default function App() {
  const [selectedPageId, setSelectedPageId] = useState<NavigationId>('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  function handleNavigationSelect(nextPageId: NavigationId) {
    setSelectedPageId(nextPageId);
    setMobileDrawerOpen(false);
  }

  function renderPage() {
    switch (selectedPageId) {
      case 'dashboard':
        return <DashboardPage />;
      case 'sparql':
        return <SparqlQueryPage />;
      case 'dependencyPath':
        return <DependencyPathPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'dependencies':
        return <DependenciesPage />;
      case 'vulnerabilities':
        return <VulnerabilitiesPage />;
      case 'assistant':
        return <AssistantPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  }

  return (
    <AdminLayout
      title={pageTitles[selectedPageId]}
      selectedPageId={selectedPageId}
      mobileDrawerOpen={mobileDrawerOpen}
      onMobileDrawerToggle={() => setMobileDrawerOpen((current) => !current)}
      onNavigationSelect={handleNavigationSelect}
    >
      {renderPage()}
    </AdminLayout>
  );
}
