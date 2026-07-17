import { useState } from 'react';
import { AdminLayout } from './layouts/AdminLayout';
import type { NavigationId } from './navigation/navigationItems';
import { DashboardPage } from './pages/DashboardPage';
import { SparqlQueryPage } from './pages/SparqlQueryPage';
import { DependencyPathPage } from './pages/DependencyPathPage';
import { DEFAULT_SPARQL_QUERY } from './features/sparql/prefixPresets';

export default function App() {
  const [selectedPageId, setSelectedPageId] = useState<NavigationId>('dashboard');
  const [sparqlQuery, setSparqlQuery] = useState(DEFAULT_SPARQL_QUERY);

  function renderPage() {
    switch (selectedPageId) {
      case 'dashboard':
        return <DashboardPage />;
      case 'sparql':
        return <SparqlQueryPage query={sparqlQuery} onQueryChange={setSparqlQuery} />;
      case 'dependencyPath':
        return <DependencyPathPage />;
      default:
        return <DashboardPage />;
    }
  }

  return (
    <AdminLayout
      selectedPageId={selectedPageId}
      onNavigationSelect={setSelectedPageId}
    >
      {renderPage()}
    </AdminLayout>
  );
}
