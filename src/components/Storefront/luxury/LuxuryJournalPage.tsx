import { Kamon } from './Kamon';

const ENTRIES = [
  { eyebrow: 'Atelier · Master profile',  plate: 'kuwa-cha',   title: 'Hideo Mori, on two stitches a minute.',         deck: 'Thirty-one years in the atelier. A Kiri Tote takes him eleven days.' },
  { eyebrow: 'House · Provenance',        plate: 'kinari',     title: 'The product passport, explained.',              deck: 'Master, atelier date, tannery, lot, restoration history. What the kamon-marked card carries.' },
  { eyebrow: 'Material · Pisa',           plate: 'akakuchiba', title: 'Conceria 800. A seventy-year relationship.',    deck: 'The Tuscan tannery that has supplied our hides since 1954. Twenty-eight days in the pits.' },
  { eyebrow: 'Archive · Re-edition',      plate: 'sumi',       title: 'The 1931 Hana Minaudière, re-cut.',             deck: 'An archival evening clutch returns this season. Six pieces, by appointment only.' },
  { eyebrow: 'Material · Nishijin',       plate: 'aijiro',     title: 'Silk woven by the family our founder married into.', deck: 'The Nishikawa workshop has supplied our linings for one hundred years.' },
  { eyebrow: 'Wabi-Sabi · Notes',         plate: 'kuwa-cha',   title: 'A tote at year ten.',                           deck: 'A photograph essay on patina and use, with notes from owners who have brought their pieces back to the atelier.' },
];

export const LuxuryJournalPage: React.FC = () => {
  return (
    <>
      <section className="tk-section--tight tk-container">
        <p className="t-caps">Journal</p>
        <h1 className="t-display t-display--lg tk-mt-sm" style={{ maxWidth: '18ch' }}>
          Letters from the atelier.
        </h1>
        <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '60ch' }}>
          Notes on craftspeople, materials, archive pieces, and seasonal cultural moments. Issued
          from Kyoto, in English and Japanese, on no fixed schedule.
        </p>
        <p className="t-meta tk-mt">Spring 2026 &nbsp;·&nbsp; Number Seventeen</p>
      </section>

      <div className="tk-container"><div className="tk-kamon-divider"><Kamon /></div></div>

      {/* Featured */}
      <section className="tk-section--tight tk-container">
        <div className="tk-plate tk-plate--sumi" style={{ aspectRatio: '16 / 7' }}>
          <Kamon className="tk-plate__mark" />
          <span className="tk-plate__caption">Hisashi Tachibana, Kyoto, 1924 · archival</span>
        </div>
        <div className="tk-twocol--off" style={{ marginTop: 48, alignItems: 'start' }}>
          <div>
            <p className="t-caps">Heritage &nbsp;·&nbsp; Featured</p>
            <h2 className="t-display t-display--lg tk-mt-sm" style={{ maxWidth: '18ch' }}>
              &ldquo;We did not begin as a luxury house.&rdquo;
            </h2>
          </div>
          <div>
            <p className="t-body-lg t-soft">
              In November 1923, two months after the Great Kantō earthquake, a twenty-nine-year-old
              fourth-generation Kyoto craftsman opened a private atelier in Gion. It is the year,
              not the city, that defined the house. A century later, the same building, the same
              kamon, the same family.
            </p>
            <button type="button" className="tk-link tk-mt" style={{ marginTop: 28, display: 'inline-flex' }}>
              Continue reading <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      <div className="tk-container"><div className="tk-kamon-divider"><Kamon /></div></div>

      {/* 3-up grid */}
      <section className="tk-section--tight tk-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '64px 48px' }}>
          {ENTRIES.map((e) => (
            <button key={e.title} type="button" className="tk-product-card">
              <div className={`tk-plate tk-plate--${e.plate} tk-plate--square tk-product-card__plate`}>
                <Kamon className="tk-plate__mark" />
              </div>
              <p className="t-caps">{e.eyebrow}</p>
              <h3 className="t-display" style={{ fontSize: 26, marginTop: 8 }}>{e.title}</h3>
              <p className="t-quiet" style={{ marginTop: 8, fontSize: 14 }}>{e.deck}</p>
            </button>
          ))}
        </div>
        <style>{`
          @media (max-width: 1024px) {
            .tk-luxury section[style*="grid-template-columns: repeat(3"] > div { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 640px) {
            .tk-luxury section[style*="grid-template-columns: repeat(3"] > div { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>
    </>
  );
};
