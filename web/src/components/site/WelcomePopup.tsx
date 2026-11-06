import { useEffect, useRef, useState } from 'react';

const POPUP_DURATION = 4000; // ms before auto-dismiss
let shownThisSession = false; // SPA: show once, not on every return to Home

/** Branded welcome splash shown once per visit on the home page. */
export function WelcomePopup() {
  const [visible, setVisible] = useState(() => !shownThisSession);
  const [dismissed, setDismissed] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    if (!visible) return;
    shownThisSession = true;
    timer.current = window.setTimeout(() => setDismissed(true), POPUP_DURATION);
    return () => window.clearTimeout(timer.current);
  }, [visible]);

  // Remove from DOM after the fade-out so it never blocks interaction
  useEffect(() => {
    if (!dismissed) return;
    const t = window.setTimeout(() => setVisible(false), 1000);
    return () => window.clearTimeout(t);
  }, [dismissed]);

  if (!visible) return null;

  const progressSeconds = (POPUP_DURATION - 800) / 1000;

  return (
    <div
      className={`welcome-overlay${dismissed ? ' dismissed' : ''}`}
      id="welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Neha Crockery House"
      onClick={() => setDismissed(true)}
    >
      <div className="welcome-card" id="welcome-card">
        <span className="welcome-corner welcome-corner--tl" aria-hidden="true" />
        <span className="welcome-corner welcome-corner--tr" aria-hidden="true" />
        <span className="welcome-corner welcome-corner--bl" aria-hidden="true" />
        <span className="welcome-corner welcome-corner--br" aria-hidden="true" />
        <div className="welcome-logo-wrap">
          <img src="/assets/images/logo.jpeg" alt="Neha Crockery House Logo" className="welcome-logo" />
        </div>
        <div className="welcome-divider" aria-hidden="true">
          <span className="welcome-divider-line" />
          <span className="welcome-divider-diamond">&#9670;</span>
          <span className="welcome-divider-line" />
        </div>
        <div className="welcome-text-wrap">
          <p className="welcome-eyebrow">
            <span className="welcome-eyebrow-line" aria-hidden="true" />
            EST. 1994 &nbsp;&middot;&nbsp; PARK TOWN, CHENNAI
            <span className="welcome-eyebrow-line" aria-hidden="true" />
          </p>
          <p className="welcome-heading" role="heading" aria-level={2}>
            {['Neha', 'Crockery', 'House'].map((w, i) => (
              <span key={w} className="welcome-word" style={{ ['--wd' as string]: i }}>
                {w}{' '}
              </span>
            ))}
          </p>
          <p className="welcome-subheading">
            {['Pleasure', 'to', 'Welcome', 'You'].map((w, i) => (
              <span key={w} className="welcome-word" style={{ ['--wd' as string]: i + 3 }}>
                {w}{' '}
              </span>
            ))}
          </p>
        </div>
        <div className="welcome-progress-wrap" aria-hidden="true">
          <div
            className="welcome-progress-bar"
            id="welcome-progress-bar"
            style={{ animationDuration: `${progressSeconds}s` }}
          />
        </div>
      </div>
    </div>
  );
}
