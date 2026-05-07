import { useNavigate } from 'react-router-dom';
import { Kamon } from './Kamon';

const HOUSES = [
  { name: 'Kyoto Atelier',  jp: '京都 アトリエ',     address: 'Gion · Kyoto',                    role: 'The original house. Workshop, archive, museum, and by-appointment commissioning. The destination for top-tier private clients and the home of the Lifetime Restoration program.', opened: '1923', advisor: 'Mariko Aoki',     plate: 'kuwa-cha',  id: 'kyoto' },
  { name: 'Tokyo',          jp: '東京 青山',          address: 'Aoyama · Tokyo',                  role: "Domestic flagship since 1968. The largest single store. Anchors the Japanese client base and serves international travelers.", opened: '1968', advisor: 'Kenji Watanabe',   plate: 'sumi',      id: 'tokyo' },
  { name: 'Milan',          jp: 'ミラノ',              address: 'Via Montenapoleone · Milan',     role: 'European flagship since 1991. The leather-craft heritage door — the closest the brand has to its Italian DNA on display. Preferred for serious leather commissions in Europe.',                            opened: '1991', advisor: 'Giulia Conti',     plate: 'kinari',    id: 'milan' },
  { name: 'Paris',          jp: 'パリ',                address: 'Avenue Montaigne · Paris',       role: 'The fashion door. Strongest ready-to-wear and jewelry assortment in Europe.',                              opened: '2014', advisor: 'Henri Rousseau',   plate: 'sumi',      id: 'paris' },
  { name: 'London',         jp: 'ロンドン',            address: 'Mount Street · Mayfair',         role: 'The discreet old-money door. The calmest of the European flagships, and the most reliant on the named-advisor program.',                                                                          opened: '2017', advisor: 'Edward Holborn',   plate: 'kuwa-cha',  id: 'london' },
  { name: 'New York',       jp: 'ニューヨーク',        address: 'Madison Avenue at 70th',         role: 'Anchors the U.S. market. Largest American share of new-client acquisition.',                              opened: '2019', advisor: 'Sasha Reyes',      plate: 'akakuchiba', id: 'newyork' },
  { name: 'Hong Kong',      jp: '香港',                address: 'Pedder Street · Central',        role: 'Greater China gateway. Highest single-transaction value of any Tachibana door.',                            opened: '2022', advisor: 'Lin Wei-Cheng',    plate: 'sumi',      id: 'hongkong' },
  { name: 'Beverly Hills',  jp: 'ビバリーヒルズ',      address: 'Rodeo Drive (north)',            role: 'The most recent door. The West Coast Patron and Gifting Patron audience; strong overlap with the entertainment-finance client.',                                                                  opened: '2024', advisor: 'Emi Tanaka',       plate: 'aijiro',    id: 'beverlyhills' },
];

export const LuxuryAtelierPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <section className="tk-section--tight tk-container">
        <p className="t-caps">The Houses</p>
        <h1 className="t-display t-display--lg tk-mt-sm" style={{ maxWidth: '22ch' }}>
          Eight doors. One atelier.
        </h1>
        <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '60ch' }}>
          Every Tachibana location is a flagship. There are no concessions, no outlets, no
          seasonal pop-ups. Each door operates appointment-first; walk-in is welcomed, but our
          Bantō program is reserved for booked time.
        </p>
        <p className="t-body-lg tk-mt" style={{ maxWidth: '60ch', color: 'var(--ink-quiet)', fontSize: 14 }}>
          The{' '}
          <em style={{ color: 'var(--kuwa-cha)', fontFamily: 'var(--serif)' }}>Bantō</em>{' '}
          <span className="t-jp" style={{ color: 'var(--kuwa-cha)' }}>番頭</span>{' '}
          is the senior figure of an Edo-era Japanese merchant house — the person who knew the
          customers by name and the work by hand. We have kept the title.
        </p>
      </section>

      <div className="tk-container"><div className="tk-kamon-divider"><Kamon /></div></div>

      <section className="tk-section--tight tk-container">
        <div className="tk-stack-lg" style={{ '--space': '96px' } as React.CSSProperties}>
          {HOUSES.map((h) => (
            <article key={h.id} id={h.id} style={{ borderTop: '1px solid var(--paper-edge)', paddingTop: 64 }}>
              <div className="tk-twocol--off" style={{ alignItems: 'start' }}>
                <div className={`tk-plate tk-plate--${h.plate} tk-plate--portrait`}>
                  <Kamon className="tk-plate__mark" />
                  <span className="tk-plate__caption">{h.address}</span>
                </div>
                <div>
                  <p className="t-caps">Opened {h.opened}</p>
                  <h2 className="t-display t-display--md tk-mt-sm">
                    {h.name}{' '}
                    <span className="t-jp" style={{ fontSize: '0.5em', color: 'var(--kuwa-cha)', marginLeft: 12, letterSpacing: '0.04em' }}>
                      {h.jp}
                    </span>
                  </h2>
                  <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '56ch' }}>{h.role}</p>

                  <div className="tk-mt-lg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', maxWidth: 480 }}>
                    <div>
                      <p className="t-meta">Address</p>
                      <p className="t-soft" style={{ marginTop: 6 }}>{h.address}</p>
                    </div>
                    <div>
                      <p className="t-meta">Hours</p>
                      <p className="t-soft" style={{ marginTop: 6 }}>By appointment · 10–18</p>
                    </div>
                    <div>
                      <p className="t-meta">Bantō</p>
                      <p className="t-soft" style={{ marginTop: 6 }}>{h.advisor}</p>
                    </div>
                    <div>
                      <p className="t-meta">Languages</p>
                      <p className="t-soft" style={{ marginTop: 6 }}>
                        English · Japanese
                        {(['paris', 'milan', 'london'] as const).includes(h.id as 'paris' | 'milan' | 'london') ? ' · French · Italian' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="tk-mt-xl">
                    <button type="button" onClick={() => navigate('/advisor')} className="tk-btn tk-btn--ghost">
                      Book an appointment
                    </button>
                    <p
                      className="t-meta tk-mt"
                      style={{ marginTop: 14, textTransform: 'none', letterSpacing: '0.02em', color: 'var(--ink-quiet)', fontSize: 13 }}
                    >
                      Or write directly to {h.advisor} at the {h.name.toLowerCase()} house.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="tk-container"><div className="tk-kamon-divider"><Kamon /></div></div>

      <section className="tk-section--tight tk-container tk-text-center">
        <p className="t-caps">The Maison Program</p>
        <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '24ch', margin: '12px auto 0' }}>
          For our most considered clients, by invitation.
        </h2>
        <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '56ch', margin: '24px auto 0' }}>
          Private appointments outside opening hours. Remote consultation by video. In-home or
          in-office trunk-show visits in the client&apos;s city. Access to the Kyoto atelier for
          personal commissioning. An annual cultural visit, recently to a private viewing of the
          Imperial Palace gardens.
        </p>
        <p
          className="t-meta tk-mt-lg"
          style={{ textTransform: 'none', letterSpacing: '0.02em', color: 'var(--ink-quiet)', marginTop: 32 }}
        >
          Membership is invitation-only. If you are already a client, your advisor will write to you.
        </p>
      </section>
    </>
  );
};
