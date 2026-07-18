import { useState } from 'react';
import { AdminLayout } from './layouts/AdminLayout';
import type { NavigationId } from './navigation/navigationItems';
import { DashboardPage } from './pages/DashboardPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { VulnerabilityEnrichmentPage } from './pages/VulnerabilityEnrichmentPage';
import { SparqlQueryPage } from './pages/SparqlQueryPage';
import { DependencyPathPage } from './pages/DependencyPathPage';
import { DEFAULT_SPARQL_QUERY } from './features/sparql/prefixPresets';

export default function App() {
  const [selectedPageId, setSelectedPageId] = useState<NavigationId>('dashboard');
  const [sparqlQuery, setSparqlQuery] = useState(DEFAULT_SPARQL_QUERY);
  const [exploreApplicationIri, setExploreApplicationIri] = useState<string | null>(null);

  function handleExploreApplication(applicationIri: string) {
    setExploreApplicationIri(applicationIri);
    setSelectedPageId('explorer');
  }

  function handleOpenVulnerabilityEnrichment(applicationIri: string) {
    setExploreApplicationIri(applicationIri);
    setSelectedPageId('vulnerabilityEnrichment');
  }

  function renderPage() {
    switch (selectedPageId) {
      case 'dashboard':
        return <DashboardPage onExploreApplication={handleExploreApplication} />;
      case 'explorer':
        return (
          <ExplorerPage
            initialApplicationIri={exploreApplicationIri}
            onOpenVulnerabilityEnrichment={handleOpenVulnerabilityEnrichment}
          />
        );
      case 'vulnerabilityEnrichment':
        return <VulnerabilityEnrichmentPage initialApplicationIri={exploreApplicationIri} />;
      case 'sparql':
        return <SparqlQueryPage query={sparqlQuery} onQueryChange={setSparqlQuery} />;
      case 'dependencyPath':
        return <DependencyPathPage />;
      default:
        return <DashboardPage onExploreApplication={handleExploreApplication} />;
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
