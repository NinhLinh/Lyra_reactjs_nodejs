import { useRoutes, RouteObject } from 'react-router-dom';

declare const require: any;
const pagesContext = require.context('../pages', false, /\.tsx$/);

function getSlugFromKey(key: string): string | null {
  const match = key.match(/^\.\/([a-z0-9-]+)\.tsx$/);
  return match ? match[1] : null;
}

export default function FileBasedRoutes() {
  const routes: RouteObject[] = [];

  for (const key of pagesContext.keys()) {
    const slug = getSlugFromKey(key);
    if (!slug) continue;

    const mod = pagesContext(key);
    const PageComponent = mod.default as React.ComponentType;

    routes.push({ path: `/${slug}`, element: <PageComponent /> });
    routes.push({ path: `/${slug}/`, element: <PageComponent /> });
  }

  return useRoutes(routes);
}