import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { Kamon } from './Kamon';

/**
 * LuxuryAccountPage — "My Maison".
 *
 * Sticky Bantō card on the left, owned pieces with restoration history on
 * the right, Maison Program panel below. Pulls customer name + recent
 * orders from CustomerContext, falls back to the editorial defaults
 * (six pieces) when no order history is available.
 */

const FALLBACK_PIECES = [
  { name: 'Kiri Tote',         jp: '桐 トート',  master: 'Hideo Mori',          material: 'Kuwa-cha · Pisa', date: 'Spring 2024',                    lot: '橘-2024-K-0089', plate: 'kuwa-cha',  restored: [{ date: 'Autumn 2025', work: 'Edge refinishing · handle re-stitch' }] },
  { name: 'Sumi Briefcase',    jp: '墨',         master: 'Akiko Tanaka',        material: 'Sumi · Pisa',     date: 'Autumn 2022',                    lot: '橘-2022-S-0421', plate: 'sumi',      restored: [] },
  { name: 'Tachibana Voyage',  jp: '橘 旅',      master: 'Junji Okada',         material: 'Kuwa-cha · Pisa', date: 'In atelier · ships May 2026',    lot: '橘-2026-V-0017', plate: 'kuwa-cha',  restored: [], inAtelier: true },
  { name: 'Hana Minaudière',   jp: '花',         master: 'Yuki Sato',           material: 'Sumi · Lucca',    date: 'Spring 2023',                    lot: '橘-2023-H-0204', plate: 'sumi',      restored: [] },
  { name: 'Tachibana Crest',   jp: '橘 紋',      master: 'Marco Bianchi (Vicenza)', material: '18k Japanese gold', date: 'Winter 2023',           lot: '橘-2023-C-0061', plate: 'kinari',    restored: [] },
  { name: 'Sumi Card Case',    jp: '墨 札',      master: 'Hideo Mori',          material: 'Sumi · Pisa',     date: 'Spring 2021',                    lot: '橘-2021-S-1109', plate: 'sumi',      restored: [{ date: 'Spring 2024', work: 'Hardware replacement' }, { date: 'Spring 2025', work: 'Edge refinishing' }] },
];

export const LuxuryAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { customer, isAuthenticated } = useCustomer();

  const firstName = customer?.name?.split(' ')[0] || 'Friend';
  const memberSince = customer?.loyalty?.memberSince || '2021';

  return (
    <>
      <section className="tk-section--tight tk-container">
        <p className="t-caps">My Maison</p>
        <h1 className="t-display t-display--lg tk-mt-sm">Welcome, {firstName}-san.</h1>
        <p className="t-body-lg t-soft tk-mt" style={{ maxWidth: '60ch' }}>
          Your pieces, their passports, and their restoration history. Your Bantō at our New York
          house, Sasha Reyes, can be reached below.
        </p>

        <div className="tk-mt-lg tk-flex tk-gap" style={{ alignItems: 'center' }}>
          <span style={{ width: 22, height: 22, color: 'var(--brass-soft)', display: 'inline-flex' }}>
            <Kamon size={22} />
          </span>
          <span className="t-meta" style={{ color: 'var(--brass-soft)' }}>
            Maison Program · Member since {memberSince}
          </span>
        </div>
      </section>

      <div className="tk-container"><div className="tk-kamon-divider"><Kamon /></div></div>

      <section className="tk-section--tight tk-container">
        <div className="tk-twocol--off" style={{ alignItems: 'start', gap: 96 }}>
          {/* Bantō card */}
          <aside style={{ position: 'sticky', top: 120 }}>
            <p className="t-caps">
              Your Bantō &nbsp;·&nbsp; <span className="t-jp" style={{ color: 'var(--kuwa-cha)' }}>番頭</span>
            </p>
            <div className="tk-paper" style={{ marginTop: 20, padding: '32px 28px' }}>
              <div className="tk-plate tk-plate--kuwa-cha" style={{ aspectRatio: 1, width: '100%', maxWidth: 200 }}>
                <Kamon className="tk-plate__mark" />
              </div>
              <h3 className="t-display" style={{ fontSize: 26, marginTop: 24 }}>Sasha Reyes</h3>
              <p className="t-meta" style={{ marginTop: 6 }}>Senior Bantō &nbsp;·&nbsp; New York</p>
              <p className="t-body-lg t-soft" style={{ marginTop: 18, fontSize: 14 }}>
                We met at the New York opening of the Hana re-edition in February. I will write
                when the Tachibana Voyage you commissioned arrives from Kyoto.
              </p>
              <hr className="tk-rule" style={{ margin: '24px 0' }} />
              <div className="tk-stack-sm">
                <button type="button" onClick={() => navigate('/atelier')} className="tk-link" style={{ display: 'inline-flex' }}>
                  Book an appointment <span aria-hidden="true">→</span>
                </button>
                <button type="button" onClick={() => navigate('/advisor')} className="tk-link" style={{ display: 'inline-flex' }}>
                  Write to Sasha <span aria-hidden="true">→</span>
                </button>
                <button type="button" onClick={() => navigate('/atelier')} className="tk-link" style={{ display: 'inline-flex' }}>
                  Request a private visit <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Pieces */}
          <div>
            <p className="t-caps">Your pieces</p>
            <h2 className="t-display t-display--md tk-mt-sm">
              {FALLBACK_PIECES.length} pieces, in your hand.
            </h2>

            <div className="tk-stack" style={{ marginTop: 48, gap: 0 }}>
              {FALLBACK_PIECES.map((p) => (
                <article
                  key={p.lot}
                  style={{
                    display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32,
                    padding: '32px 0', borderBottom: '1px solid var(--paper-edge)',
                  }}
                >
                  <div className={`tk-plate tk-plate--${p.plate}`} style={{ aspectRatio: '3 / 4' }}>
                    <Kamon className="tk-plate__mark" />
                  </div>
                  <div>
                    <div className="tk-flex tk-flex--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <h3 className="t-display" style={{ fontSize: 22 }}>
                          {p.name} <span className="tk-product-card__title-jp">{p.jp}</span>
                        </h3>
                        <p className="t-meta" style={{ marginTop: 6 }}>
                          Master · {p.master} &nbsp;·&nbsp; {p.material}
                        </p>
                      </div>
                      {p.inAtelier && (
                        <span
                          className="t-meta"
                          style={{ color: 'var(--brass-soft)', border: '1px solid var(--brass-soft)', padding: '4px 10px' }}
                        >
                          In atelier
                        </span>
                      )}
                    </div>

                    <div
                      style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', maxWidth: 480 }}
                    >
                      <div>
                        <p className="t-meta">Atelier date</p>
                        <p className="t-soft" style={{ marginTop: 4, fontSize: 14 }}>{p.date}</p>
                      </div>
                      <div>
                        <p className="t-meta">Lot</p>
                        <p
                          className="t-soft"
                          style={{ marginTop: 4, fontSize: 14, fontFamily: 'var(--serif)', letterSpacing: '0.04em' }}
                        >
                          {p.lot}
                        </p>
                      </div>
                    </div>

                    <div style={{ marginTop: 22 }}>
                      <p className="t-meta">Restoration history</p>
                      {p.restored.length === 0 ? (
                        <p
                          className="t-quiet"
                          style={{ marginTop: 8, fontStyle: 'italic', fontFamily: 'var(--serif)', fontSize: 14 }}
                        >
                          — begins with the first owner —
                        </p>
                      ) : (
                        <ul
                          style={{
                            listStyle: 'none', marginTop: 12,
                            borderLeft: '1px solid var(--brass-soft)', paddingLeft: 18,
                          }}
                        >
                          {p.restored.map((r) => (
                            <li key={`${r.date}-${r.work}`} style={{ padding: '6px 0' }}>
                              <p className="t-soft" style={{ fontSize: 14 }}>
                                {r.date} &nbsp;·&nbsp; <span className="t-quiet">{r.work}</span>
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="tk-flex tk-gap" style={{ marginTop: 22 }}>
                      <button type="button" className="tk-link">View passport</button>
                      <button type="button" onClick={() => navigate('/restoration')} className="tk-link">
                        Begin restoration
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="tk-container"><div className="tk-kamon-divider"><Kamon /></div></div>

      {/* Maison Program panel */}
      <section className="tk-section--tight tk-container">
        <div className="tk-paper" style={{ padding: 64 }}>
          <p className="t-caps" style={{ color: 'var(--brass-soft)' }}>Maison Program</p>
          <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '32ch' }}>
            Your annual cultural visit, this October.
          </h2>
          <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '60ch' }}>
            We are organising a small October visit to our Tuscan tannery. Three days, including
            lunch with the Conceria 800 family. Sasha will be in touch with details closer to the
            date.
          </p>
          <button type="button" className="tk-link" style={{ marginTop: 28, display: 'inline-flex' }}>
            Confirm interest <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="tk-section--tight tk-container tk-text-center">
          <p className="t-soft" style={{ fontSize: 14 }}>
            You are viewing a sample maison. Sign in to see your own pieces and restoration history.
          </p>
        </section>
      )}
    </>
  );
};
