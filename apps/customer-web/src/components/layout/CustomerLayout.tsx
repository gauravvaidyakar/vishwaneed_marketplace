import { Outlet } from 'react-router-dom';
import { runtimeConfig } from '../../api';
import { Footer } from './Footer';
import { Header } from './Header';

export function CustomerLayout() {
  return (
    <div className="app-shell">
      {runtimeConfig.isMock && <div className="development-banner" role="status">Development adapter active — catalogue, account and checkout data are local mock responses.</div>}
      <Header />
      <main id="main-content"><Outlet /></main>
      <Footer />
    </div>
  );
}
