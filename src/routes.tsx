import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { appRoutes } from './routes.config';

const Home = lazy(() => import('./pages/home'));

const appRouteElements = appRoutes.map((route) => {
    const Component = lazy(route.loader);
    return { path: route.path, element: <Component /> };
});

const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-400 rounded-full animate-spin"></div>
    </div>
);

const AppRoutes: React.FC = () => {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route path="/" element={<Home />} />
                {appRouteElements.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                ))}
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
