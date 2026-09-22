import { PAGE_ROUTES, routeForKey, routeForPath } from './pages';

const pathByLabel = new Map(PAGE_ROUTES.map(page => [page.label, page.path]));

function cleanPath(pathname: string) {
  return pathname.replace(/\\/+$/, '') || '/';
}

function syncUrlFromRenderedPage() {
  const heading = document.querySelector('.topbar h1')?.textContent?.trim();
  if (!heading || !pathByLabel.has(heading)) return;
  const target = pathByLabel.get(heading)!;
  if (cleanPath(window.location.pathname) !== target) {
    window.history.replaceState({ tgsPage: heading }, '', target);
  }
}

function activatePath(pathname: string) {
  const page = routeForPath(pathname);
  window.dispatchEvent(new CustomEvent('tgs:navigate', { detail: page.key }));
  const buttons = Array.from(document.querySelectorAll<HTMLElement>('.sidebar .nav-item'));
  const button = buttons.find(item => item.textContent?.trim() === page.label);
  if (button && !button.classList.contains('active')) button.click();
}

export function installPageUrlRouting() {
  const clickHandler = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLElement>('.sidebar .nav-item');
    if (!button) return;
    const label = button.textContent?.trim() || '';
    const page = routeForKey(label);
    window.history.pushState({ tgsPage: page.key }, '', page.path);
  };

  document.addEventListener('click', clickHandler, true);
  window.addEventListener('popstate', () => activatePath(window.location.pathname));

  const observer = new MutationObserver(() => {
    syncUrlFromRenderedPage();
    activatePath(window.location.pathname);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  requestAnimationFrame(() => activatePath(window.location.pathname));

  return () => {
    document.removeEventListener('click', clickHandler, true);
    observer.disconnect();
  };
}
