import { StrictMode, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/index.css';
import { captureAttribution } from './lib/attribution';

captureAttribution();
import Layout from './components/Layout';
import Home from './pages/Home';
const Check = lazy(() => import('./pages/Check'));
const Report = lazy(() => import('./pages/Report'));
const ProviderCheck = lazy(() => import('./pages/ProviderCheck'));
const ProviderReview = lazy(() => import('./pages/ProviderReview'));
const ReviewDocuments = lazy(() => import('./pages/ReviewDocuments'));
const Privacy = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Terms })));
const NotFound = lazy(() => import('./pages/Legal').then((m) => ({ default: m.NotFound })));

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/check', element: <Check /> },
      { path: '/report', element: <Report /> },
      { path: '/provider-check', element: <ProviderCheck /> },
      { path: '/provider-review', element: <ProviderReview /> },
      { path: '/provider-review/documents', element: <ReviewDocuments /> },
      { path: '/privacy-policy', element: <Privacy /> },
      { path: '/terms', element: <Terms /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
