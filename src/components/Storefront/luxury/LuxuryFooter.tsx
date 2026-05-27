import { useNavigate } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoContext';
import { Kamon } from './Kamon';
import { BackendToggle } from '../BackendToggle';

/**
 * LuxuryFooter — three austere columns:
 *   • The eight houses (matches Atelier page list)
 *   • The Maison (Journal, Restoration, Atelier, About, Press)
 *   • The kamon, repeated, with copyright in JP and English
 *
 * No social pills, no email signup widget here — Maison Program is the
 * outreach surface and it lives on its own page.
 */
const HOUSES = [
  { name: 'Kyoto Atelier', jp: '京都' },
  { name: 'Tokyo',         jp: '東京 青山' },
  { name: 'Milan',         jp: 'ミラノ' },
  { name: 'Paris',         jp: 'パリ' },
  { name: 'London',        jp: 'ロンドン' },
  { name: 'New York',      jp: 'ニューヨーク' },
  { name: 'Hong Kong',     jp: '香港' },
  { name: 'Beverly Hills', jp: 'ビバリーヒルズ' },
];

export const LuxuryFooter: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useDemo();

  return (
    <footer className="tk-footer">
      <div className="tk-container">
        <div className="tk-twocol--off" style={{ alignItems: 'start', gap: 96 }}>
          <div>
            <div className="tk-flex tk-gap" style={{ alignItems: 'center', gap: 14 }}>
              <Kamon className="kamon" size={32} />
              <span style={{ fontFamily: 'var(--serif)', fontSize: 24, letterSpacing: '0.02em' }}>
                {config.brandName}
              </span>
            </div>
            <p className="t-soft tk-mt-lg" style={{ maxWidth: '36ch', color: 'rgba(245, 240, 230, 0.7)' }}>
              {config.brandTagline ||
                'A Kyoto house of leather and lacquer. Hand-stitched since 1923. Every piece carries the name of its maker.'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 56 }}>
            <div>
              <p className="t-caps">The Houses</p>
              <ul className="tk-stack-sm tk-mt-lg" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {HOUSES.map((h) => (
                  <li key={h.name}>
                    <button
                      type="button"
                      onClick={() => navigate('/atelier')}
                      className="tk-link"
                      style={{ borderBottomColor: 'rgba(245, 240, 230, 0.2)', color: 'var(--kinari)' }}
                    >
                      {h.name}{' '}
                      <span style={{ fontFamily: 'var(--jp)', color: 'var(--brass-soft)', fontSize: 13 }}>
                        {h.jp}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="t-caps">The Maison</p>
              <ul className="tk-stack-sm tk-mt-lg" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li>
                  <button type="button" onClick={() => navigate('/journal')} className="tk-link" style={{ borderBottomColor: 'rgba(245, 240, 230, 0.2)', color: 'var(--kinari)' }}>
                    Journal
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/restoration')} className="tk-link" style={{ borderBottomColor: 'rgba(245, 240, 230, 0.2)', color: 'var(--kinari)' }}>
                    Restoration
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/atelier')} className="tk-link" style={{ borderBottomColor: 'rgba(245, 240, 230, 0.2)', color: 'var(--kinari)' }}>
                    Atelier
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/account')} className="tk-link" style={{ borderBottomColor: 'rgba(245, 240, 230, 0.2)', color: 'var(--kinari)' }}>
                    My Maison
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="t-caps">Care</p>
              <ul className="tk-stack-sm tk-mt-lg" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li><button type="button" className="tk-link" style={{ borderBottomColor: 'rgba(245, 240, 230, 0.2)', color: 'var(--kinari)' }}>Lifetime restoration</button></li>
                <li><button type="button" className="tk-link" style={{ borderBottomColor: 'rgba(245, 240, 230, 0.2)', color: 'var(--kinari)' }}>Product passport</button></li>
                <li><button type="button" className="tk-link" style={{ borderBottomColor: 'rgba(245, 240, 230, 0.2)', color: 'var(--kinari)' }}>Press</button></li>
                <li><button type="button" className="tk-link" style={{ borderBottomColor: 'rgba(245, 240, 230, 0.2)', color: 'var(--kinari)' }}>Privacy</button></li>
              </ul>
            </div>
          </div>
        </div>

        <hr className="tk-rule" style={{ marginTop: 96, borderColor: 'rgba(245, 240, 230, 0.15)' }} />
        <div
          className="tk-flex tk-flex--between"
          style={{ marginTop: 32, flexWrap: 'wrap', gap: 16, color: 'rgba(245, 240, 230, 0.5)', fontSize: 12, letterSpacing: '0.06em' }}
        >
          <span>© {new Date().getFullYear()} {config.brandName}, Kyoto. All rights reserved.</span>
          <BackendToggle />
          <span style={{ fontFamily: 'var(--jp)' }}>京都 — 一九二三年創業</span>
        </div>
      </div>
    </footer>
  );
};
