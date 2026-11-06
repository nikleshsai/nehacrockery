import { Outlet, useLocation } from 'react-router-dom';
import { useContact } from '@/lib/settings';
import { useReveal } from '@/lib/hooks';
import { Header } from './Header';
import { Footer } from './Footer';
import { WelcomePopup } from './WelcomePopup';
import { WhatsAppIcon } from './WhatsAppIcon';
import { useEffect } from 'react';

/** Public site chrome: header, footer, floating WhatsApp button, route effects. */
export function SiteLayout() {
  const { pathname } = useLocation();
  const c = useContact();
  useReveal(pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <>
      {pathname === '/' && <WelcomePopup />}
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
      <a
        href={c.wa('Hello, I would like to enquire about your products.')}
        className="float-whatsapp"
        id="float-whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <WhatsAppIcon size={26} />
      </a>
    </>
  );
}
