import { useEffect, useRef } from 'react';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(5, 12, 28, 0.75)',
  backdropFilter: 'blur(6px)',
  zIndex: 9999,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem 1.5rem'
};

const dialogStyle = {
  maxWidth: '720px',
  width: '100%',
  borderRadius: '16px',
  background: 'rgba(12, 26, 54, 0.94)',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
  color: '#f4f7ff',
  padding: '2rem',
  display: 'grid',
  gap: '1.5rem',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const sectionStyle = {
  display: 'grid',
  gap: '0.35rem'
};

const defaultImpressum = {
  operator: {
    company: 'Privatperson',
    legalForm: '',
    street: 'Am Tiefenbach 20',
    postalCode: '74360',
    city: 'Ilsfeld',
    country: 'Deutschland',
    representatives: ['Simon Riedinger'],
    email: 'riedinger.simon@t-online.de',
    phone: '+49 170 1753393',
    registerCourt: '',
    registerNumber: ''
  },
  vat: {
    required: false,
    identificationNumber: ''
  },
  supervision: {
    authority: ''
  },
  links: {
    datenschutzUrl: '' // z.B. '/datenschutz'
  },
  disclaimer: {
    content:
      'Verantwortlich im Sinne des § 18 Abs. 2 MStV: Simon Riedinger, Am Tiefenbach 20, 74360 Ilsfeld',
    liabilityLinks:
      'Trotz sorgfältiger inhaltlicher Kontrolle übernehme ich keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.',
    liabilityContent:
      'Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten verantwortlich. Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.'
  },
  meta: {
    lastUpdated: '2025-10-21'
  }
};

function Field({ label, value, render }) {
  const hasValue =
    value !== undefined &&
    value !== null &&
    (typeof value === 'string' ? value.trim() !== '' : true);

  if (!hasValue && !render) return null;

  if (render) {
    return (
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        <strong style={{ display: 'inline-block', minWidth: '8.5rem' }}>{label}:</strong> {render()}
      </p>
    );
  }

  return (
    <p style={{ margin: 0, lineHeight: 1.5 }}>
      <strong style={{ display: 'inline-block', minWidth: '8.5rem' }}>{label}:</strong> {value}
    </p>
  );
}

export default function Impressum({ data = defaultImpressum, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    // Fokus beim Öffnen auf den Dialog setzen
    dialogRef.current?.focus?.();
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const operator = data.operator ?? {};
  const vat = data.vat ?? {};
  const supervision = data.supervision ?? {};
  const disclaimer = data.disclaimer ?? {};
  const links = data.links ?? {};
  const meta = data.meta ?? {};

  const companyLine = operator.legalForm
    ? `${operator.company} (${operator.legalForm})`
    : operator.company || '';

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="impressum-title"
      aria-describedby="impressum-desc"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        style={dialogStyle}
        onClick={(event) => event.stopPropagation()}
        tabIndex={-1}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h2 id="impressum-title" style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '0.08em' }}>
              Impressum
            </h2>
            <p id="impressum-desc" style={{ margin: '0.4rem 0 0', opacity: 0.75 }}>
              Angaben gemäß § 5 TMG und § 18 Abs. 2 MStV.
            </p>
          </div>
          <button
            type="button"
            aria-label="Impressum schließen"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.5)',
              color: '#f4f7ff',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Schließen
          </button>
        </header>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '0.04em' }}>Anbieter</h3>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            {companyLine && (<>{companyLine}<br /></>)}
            {operator.street}<br />
            {operator.postalCode} {operator.city}<br />
            {operator.country}
          </p>
          {Array.isArray(operator.representatives) && operator.representatives.length > 0 ? (
            <Field label="Verantwortlich" value={operator.representatives.join(', ')} />
          ) : null}
          <Field label="E-Mail" value={operator.email} />
          <Field label="Telefon" value={operator.phone} />
          <Field label="Registergericht" value={operator.registerCourt} />
          <Field label="Registernummer" value={operator.registerNumber} />
          <Field
            label="Datenschutz"
            render={() =>
              links.datenschutzUrl ? (
                <a href={links.datenschutzUrl} style={{ color: '#cfe2ff', textDecoration: 'underline' }}>
                  Datenschutzerklärung
                </a>
              ) : null
            }
          />
        </section>

        {vat.required ? (
          <section style={sectionStyle}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '0.04em' }}>Umsatzsteuer-ID</h3>
            <Field label="USt-IdNr." value={vat.identificationNumber} />
          </section>
        ) : null}

        {supervision.authority ? (
          <section style={sectionStyle}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '0.04em' }}>Aufsichtsbehörde</h3>
            <p style={{ margin: 0 }}>{supervision.authority}</p>
          </section>
        ) : null}

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '0.04em' }}>Hinweise & Haftung</h3>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{disclaimer.content}</p>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{disclaimer.liabilityContent}</p>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{disclaimer.liabilityLinks}</p>
        </section>

        {(meta.lastUpdated || links.datenschutzUrl) && (
          <section style={sectionStyle}>
            {meta.lastUpdated && (
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.65 }}>
                Stand: {meta.lastUpdated}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}