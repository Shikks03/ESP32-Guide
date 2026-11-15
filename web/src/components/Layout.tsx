import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SkipLink } from './SkipLink';
import { TopBar } from './TopBar';
import './Layout.css';

function RouteProgress() {
  return <div className="layout-progress" role="progressbar" aria-label="Loading" />;
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <SkipLink />
      <TopBar />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<RouteProgress />}>
          <Outlet />
        </Suspense>
      </main>
      <p className="layout-foot">
        Pin layout follows your own 30-pin DevKit (ESP32-WROOM-32, CH340C, USB-C). Clones vary, so the labels printed on
        your board always win. Your ticks are saved in this browser only.
      </p>
    </>
  );
}
