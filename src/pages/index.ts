import DashboardPage from './DashboardPage';
import TournamentsPage from './TournamentsPage';
import PlayersPage from './PlayersPage';
import MatchesPage from './MatchesPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';

export const PAGE_ROUTES = [
  DashboardPage,
  TournamentsPage,
  PlayersPage,
  MatchesPage,
  ReportsPage,
  SettingsPage,
] as const;

export type PageKey = typeof PAGE_ROUTES[number]['key'];

export function routeForKey(key: string) {
  return PAGE_ROUTES.find(page => page.key === key) ?? DashboardPage;
}

export function routeForPath(pathname: string) {
  const normalized = pathname.replace(/\\/+$/, '') || '/';
  if (normalized === '/') return DashboardPage;
  return PAGE_ROUTES.find(page => page.path === normalized) ?? DashboardPage;
}
