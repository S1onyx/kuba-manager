import { useTranslation } from 'react-i18next';
import { resolveLanguage } from '../i18n/index.js';
import contentDe from './reglement/content.de.js';
import contentEn from './reglement/content.en.js';
import contentFr from './reglement/content.fr.js';
import contentHu from './reglement/content.hu.js';
import contentCs from './reglement/content.cs.js';
import contentSwg from './reglement/content.swg.js';
import contentGsw from './reglement/content.gsw.js';
import contentZh from './reglement/content.zh.js';
import contentJa from './reglement/content.ja.js';

const REGLEMENT_CONTENT = {
  de: contentDe,
  en: contentEn,
  fr: contentFr,
  hu: contentHu,
  cs: contentCs,
  swg: contentSwg,
  gsw: contentGsw,
  zh: contentZh,
  ja: contentJa
};

const REGLEMENT_PDF_URL = '/reglement/reglement-kunstrad-basketball.pdf';

const wrapperStyle = {
  display: 'grid',
  gap: '1.75rem'
};

const heroCardStyle = {
  background: 'rgba(4, 12, 25, 0.7)',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '1.8rem clamp(1.4rem, 4vw, 2.4rem)',
  display: 'grid',
  gap: '0.85rem',
  boxShadow: '0 28px 60px rgba(2, 8, 20, 0.55)'
};

const heroTitleStyle = {
  margin: 0,
  fontSize: 'clamp(1.35rem, 5vw, 1.9rem)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .reglement-hero {
      padding: 1.4rem 1.2rem;
      border-radius: 18px;
    }
    .reglement-card {
      padding: 1.15rem 1.1rem;
      border-radius: 14px;
      gap: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .reglement-hero {
      padding: 1.2rem 1rem;
    }
    .reglement-card {
      padding: 1rem 0.9rem;
    }
    .reglement-card ul {
      padding-left: 0.95rem;
    }
  }
`;

const heroSubtitleStyle = {
  margin: 0,
  fontSize: '1rem',
  opacity: 0.78
};

const heroFootnoteStyle = {
  margin: 0,
  fontSize: '0.9rem',
  opacity: 0.65
};

const sectionGridStyle = {
  display: 'grid',
  gap: '1.4rem'
};

const sectionCardStyle = {
  background: 'rgba(5, 15, 30, 0.65)',
  borderRadius: '18px',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '1.45rem 1.6rem',
  display: 'grid',
  gap: '0.95rem',
  boxShadow: '0 18px 42px rgba(0,0,0,0.4)'
};

const sectionHeadingStyle = {
  margin: 0,
  fontSize: '1.3rem',
  letterSpacing: '0.07em'
};

const subsectionHeadingStyle = {
  margin: 0,
  fontSize: '1.05rem',
  letterSpacing: '0.04em',
  fontWeight: 600
};

const paragraphStyle = {
  margin: 0,
  opacity: 0.85
};

const listStyle = {
  margin: 0,
  paddingLeft: '1.1rem',
  display: 'grid',
  gap: '0.35rem',
  opacity: 0.85
};

const subListStyle = {
  marginTop: '0.35rem',
  paddingLeft: '1.05rem',
  display: 'grid',
  gap: '0.3rem'
};

function renderList(items) {
  return (
    <ul style={listStyle}>
      {items.map((item, index) => {
        if (typeof item === 'string') {
          return <li key={index}>{item}</li>;
        }
        if (item && typeof item === 'object') {
          return (
            <li key={index}>
              {item.text}
              {Array.isArray(item.subItems) && item.subItems.length > 0 ? (
                <ul style={subListStyle}>
                  {item.subItems.map((subItem, subIndex) => (
                    <li key={subIndex}>{subItem}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        }
        return null;
      })}
    </ul>
  );
}

function renderBody(body) {
  return body.map((block, index) => {
    if (block.type === 'paragraph') {
      return (
        <p key={index} style={paragraphStyle}>
          {block.text}
        </p>
      );
    }
    if (block.type === 'list' && Array.isArray(block.items)) {
      return <div key={index}>{renderList(block.items)}</div>;
    }
    return null;
  });
}

export default function Reglement() {
  const { t, i18n } = useTranslation();
  const language = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);
  const content = REGLEMENT_CONTENT[language] ?? REGLEMENT_CONTENT.de;
  const { hero, sections } = content;

  return (
    <section style={wrapperStyle}>
      <style>{responsiveStyles}</style>
      <article className="reglement-hero" style={heroCardStyle}>
        <header style={{ display: 'grid', gap: '0.45rem' }}>
          <h2 style={heroTitleStyle}>{hero.title}</h2>
          <p style={heroSubtitleStyle}>{hero.subtitle}</p>
        </header>
        <p style={heroFootnoteStyle}>{hero.footnote}</p>
        <p style={heroFootnoteStyle}>
          <a
            href={REGLEMENT_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#7cb9ff', textDecoration: 'underline' }}
          >
            {language === 'de' ? t('reglement.pdfLink') : t('reglement.pdfLinkGermanOnly')}
          </a>
        </p>
      </article>

      <div style={sectionGridStyle}>
        {sections.map((section) => (
          <article key={section.title} className="reglement-card" style={sectionCardStyle}>
            <h3 style={sectionHeadingStyle}>{section.title}</h3>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {section.subsections.map((subsection) => (
                <div key={subsection.heading} style={{ display: 'grid', gap: '0.5rem' }}>
                  <h4 style={subsectionHeadingStyle}>{subsection.heading}</h4>
                  {renderBody(subsection.body)}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
