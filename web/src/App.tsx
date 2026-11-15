import { lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SettingsProvider } from './state/settings';
const HomePage = lazy(() => import('./pages/HomePage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const CodeReaderPage = lazy(() => import('./pages/CodeReaderPage'));
const DatasheetPage = lazy(() => import('./pages/DatasheetPage'));
const BenchPage = lazy(() => import('./pages/BenchPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <SettingsProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="lessons/:id" element={<LessonPage />} />
            <Route path="lessons/:id/code" element={<CodeReaderPage />} />
            <Route path="datasheet" element={<DatasheetPage />} />
            <Route path="log" element={<BenchPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </SettingsProvider>
  );
}
