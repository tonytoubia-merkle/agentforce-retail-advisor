import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Kamon } from './Kamon';

const SERVICES = [
  { name: 'Edge refinishing',     desc: 'The handles, the seams, the corners — re-shaped, re-burnished, re-waxed by hand.', plate: 'kuwa-cha' },
  { name: 'Re-stitching',         desc: 'Saddle-stitched again by the original maker where possible. Two stitches per minute.', plate: 'sumi' },
  { name: 'Hardware replacement', desc: '18k Japanese gold, by Marco Bianchi (Vicenza). The dies have not changed since 1959.', plate: 'kinari' },
  { name: 'Lining repair',        desc: 'Nishijin silk from the Nishikawa workshop in Kyoto. Cut from the same bolt as the original.', plate: 'aijiro' },
  { name: 'Full restoration',     desc: "A piece returned to the atelier and rebuilt. Documented in the passport. Six to fourteen weeks.", plate: 'akakuchiba' },
];

export const LuxuryRestorationPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ lot: '', concern: '', when: '' });

  const update = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <section className="tk-section--tight tk-container">
        <p className="t-caps">Mottainai · もったいない</p>
        <h1 className="t-display t-display--lg tk-mt-sm" style={{ maxWidth: '20ch' }}>
          The piece returns. The piece is restored.
        </h1>
        <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '60ch' }}>
          Lifetime restoration is included with every Tachibana piece. The Japanese word{' '}
          <em style={{ fontFamily: 'var(--serif)', color: 'var(--kuwa-cha)' }}>mottainai</em>{' '}
          carries the sense that what is good ought not be wasted. The atelier was built around it.
        </p>
        <p className="t-body-lg t-soft tk-mt" style={{ maxWidth: '60ch' }}>
          Send the piece to Kyoto, or hand it to your Bantō at any of our houses. The original
          maker will work on it where possible. The passport records every visit and the name of
          the craftsperson who restored it.
        </p>
      </section>

      <div className="tk-container"><div className="tk-kamon-divider"><Kamon /></div></div>

      {/* Services */}
      <section className="tk-section--tight tk-container">
        <p className="t-caps">Services included</p>
        <h2 className="t-display t-display--md tk-mt-sm">Five forms of return.</h2>
        <div
          className="tk-mt-xl"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '48px 64px' }}
        >
          {SERVICES.map((s) => (
            <article key={s.name}>
              <div className={`tk-plate tk-plate--${s.plate}`} style={{ aspectRatio: '5 / 3' }}>
                <Kamon className="tk-plate__mark" />
              </div>
              <h3 className="t-display tk-mt-lg" style={{ fontSize: 24 }}>{s.name}</h3>
              <p className="t-soft tk-mt-sm" style={{ maxWidth: '40ch' }}>{s.desc}</p>
            </article>
          ))}
        </div>
        <style>{`
          @media (max-width: 900px) {
            .tk-luxury section .tk-mt-xl[style*="repeat(2, 1fr)"] { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      <div className="tk-container"><div className="tk-kamon-divider"><Kamon /></div></div>

      {/* Intake form (letter to the atelier) */}
      <section className="tk-section--tight tk-container">
        <div className="tk-twocol--off" style={{ alignItems: 'start', gap: 96 }}>
          <div>
            <p className="t-caps">A letter to the atelier</p>
            <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '20ch' }}>
              Three quiet steps. We will write back.
            </h2>
            <p className="t-soft tk-mt-lg">
              The intake reads like a letter, because that is what it is. Your Bantō receives it
              first, and replies within two business days with a courier label and a date.
            </p>
          </div>
          <div className="tk-paper" style={{ padding: 48 }}>
            {submitted ? (
              <>
                <p className="t-caps">Thank you</p>
                <h3 className="t-display tk-mt-sm" style={{ fontSize: 26 }}>Your letter has been received.</h3>
                <p className="t-soft tk-mt-lg">
                  Sasha will write back from New York within two business days with the courier
                  label and the next available date in Kyoto.
                </p>
                <button type="button" onClick={() => navigate('/account')} className="tk-link tk-mt-lg">
                  Return to My Maison →
                </button>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="tk-stack"
              >
                <div>
                  <p className="t-caps">01 · The piece</p>
                  <input
                    type="text"
                    placeholder="Lot number, e.g. 橘-2024-K-0089"
                    required
                    value={form.lot}
                    onChange={(e) => update('lot', e.target.value)}
                    className="tk-mt"
                    style={{
                      marginTop: 12, width: '100%', padding: '14px 16px',
                      border: '1px solid var(--paper-edge)', background: 'transparent',
                      fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '0.04em',
                    }}
                  />
                </div>
                <div>
                  <p className="t-caps">02 · What we should look at</p>
                  <textarea
                    rows={5}
                    required
                    placeholder="A few sentences. The Bantō will read this carefully."
                    value={form.concern}
                    onChange={(e) => update('concern', e.target.value)}
                    className="tk-mt"
                    style={{
                      marginTop: 12, width: '100%', padding: '14px 16px',
                      border: '1px solid var(--paper-edge)', background: 'transparent',
                      fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.6, resize: 'vertical',
                    }}
                  />
                </div>
                <div>
                  <p className="t-caps">03 · When you can send it</p>
                  <input
                    type="text"
                    placeholder="A week, a month — no rush"
                    value={form.when}
                    onChange={(e) => update('when', e.target.value)}
                    className="tk-mt"
                    style={{
                      marginTop: 12, width: '100%', padding: '14px 16px',
                      border: '1px solid var(--paper-edge)', background: 'transparent',
                      fontFamily: 'var(--serif)', fontSize: 18,
                    }}
                  />
                </div>
                <button type="submit" className="tk-btn tk-btn--ink" style={{ marginTop: 16, alignSelf: 'flex-start' }}>
                  Send the letter
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
