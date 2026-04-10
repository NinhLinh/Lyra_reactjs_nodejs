import type { ComponentType } from 'react';

export type RouteLoader = () => Promise<{ default: ComponentType<any> }>;

export type AppRouteConfig = {
    path: string;
    loader: RouteLoader;
};

export const appRoutes: AppRouteConfig[] = [
    { path: '/products', loader: () => import('./pages/products') },
    { path: '/about-us', loader: () => import('./pages/about-us') },
    { path: '/my-profile', loader: () => import('./pages/my-profile') },
    { path: '/auth', loader: () => import('./components/Auth') },
    { path: '/checkout', loader: () => import('./components/Checkout') },
    { path: '/orders', loader: () => import('./components/OrderHistory') },
    { path: '/orders/:id', loader: () => import('./components/OrderDetail') },
    { path: '/admin', loader: () => import('./components/AdminDashboard') },
];

