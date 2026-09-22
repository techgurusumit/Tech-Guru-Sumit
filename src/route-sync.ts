import { routeForKey, routeForPath } from './pages';

function navigateToPath(path: string, key: string, replace = false) {
  if (window.location.pathname !== path) {
    const state = { tgsPage: key };
    if (replace) window.history.replaceState(state, '', path);
    else window.history.pushState(state, '', path);
  }
  window.dispatchEvent(new CustomEvent('tgs:navigate', { detail: key }));
}

function activatePath(pathname: string) {
  const page = routeForPath(pathname);
  navigateToPath(page.path, page.key, true);
}

export function installPageUrlRouting() {
  const clickHandler = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLElement>('.sidebar .nav-item');
    if (!button) return;

    const label = button.textContent?.trim() || '';
    const page = routeForKey(label);
    navigateToPath(page.path, page.key);
  };

  document.addEventListener('click', clickHandler, true);

  const popstateHandler = () => {
    activatePath(window.location.pathname);
  };
  window.addEventListener('popstate', popstateHandler);

  // Make the URL match the page on the first render too.
  requestAnimationFrame(() => activatePath(window.location.pathname));

  return () => {
    document.removeEventListener('click', clickHandler, true);
    window.removeEventListener('popstate', popstateHandler);
  };
}
