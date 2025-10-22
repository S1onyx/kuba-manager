const containerStyle = {
  background: 'rgba(0,0,0,0.24)',
  borderRadius: '20px',
  padding: '1.75rem',
  display: 'grid',
  gap: '1.5rem',
  lineHeight: 1.5
};

const headerStyle = {
  display: 'grid',
  gap: '0.5rem',
  textAlign: 'center'
};

const titleStyle = {
  margin: 0,
  fontSize: '1.8rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const subtitleStyle = {
  margin: 0,
  fontSize: '0.95rem',
  opacity: 0.75
};

const sectionGridStyle = {
  display: 'grid',
  gap: '1.25rem'
};

const sectionCardStyle = {
  background: 'rgba(0,0,0,0.18)',
  borderRadius: '16px',
  padding: '1.35rem',
  display: 'grid',
  gap: '0.95rem',
  boxShadow: '0 10px 24px rgba(0,0,0,0.22)'
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

const sections = [
  {
    title: '1. Allgemeines',
    subsections: [
      {
        heading: '1.1 Intro',
        body: [
          {
            type: 'paragraph',
            text:
              'Kunstrad Basketball wird auf Kunsträdern in der Steuerrohrsteiger-Position mit zwei Teams à vier Spielern gespielt. Ziel ist es, Körbe zu erzielen und Gegentreffer zu verhindern. Schiedsrichter und Spielleitung überwachen das Spiel; die Mannschaft mit den meisten Punkten nach Ablauf der Spielzeit gewinnt.'
          }
        ]
      },
      {
        heading: '1.2 Team',
        body: [
          {
            type: 'list',
            items: [
              'Ein Team besteht aus maximal fünf Spielern.',
              'Pro Team stehen maximal vier Spieler gleichzeitig auf dem Feld.',
              'Spielerwechsel erfolgen fliegend und ausschließlich über die eigene Coaching Zone.'
            ]
          }
        ]
      },
      {
        heading: '1.3 Fahrposition',
        body: [
          {
            type: 'list',
            items: [
              'Das gesamte Spiel wird im Steuerrohrsteiger auf einem Kunstrad oder Radballrad gemäß UCI-Reglement absolviert; die Position wird in der Coaching Zone eingenommen.',
              'Bei Absteigen, Zeitstrafe oder ähnlichen Situationen ist das Spielfeld sofort zu verlassen und darf erst in Steuerrohrsteiger-Position aus der Coaching Zone wieder befahren werden.'
            ]
          }
        ]
      },
      {
        heading: '1.4 Spielfeld & Punktewertung',
        body: [
          {
            type: 'list',
            items: [
              'Jedes Team verfügt über eine eigene Coaching Zone, in der sich Auswechselspieler aufhalten.',
              {
                text: 'Die Punktewertung entspricht dem Basketball:',
                subItems: ['1 Punkt – Freiwurf', '2 Punkte – Feldwurf', '3 Punkte – Wurf hinter der Drei-Punkte-Linie']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: '2. Spielablauf',
    subsections: [
      {
        heading: '2.1 Spieldauer, Beginn & Ende',
        body: [
          {
            type: 'list',
            items: [
              'Spieldauer: 10 oder 12 Minuten.',
              'Vor Spielbeginn entscheidet ein Zufallsprinzip (z. B. Münzwurf), welches Team den Ballbesitz erhält.',
              'Das Anspiel erfolgt in der eigenen Hälfte; beide Teams starten in ihrer Hälfte und das Spiel beginnt mit einem Pfiff des Schiedsrichters.',
              'Die Spielleitung überwacht die Zeit und signalisiert das Ende mit einem Pfiff.'
            ]
          }
        ]
      },
      {
        heading: '2.2 Ballspiel',
        body: [
          {
            type: 'list',
            items: [
              'Mit Ball in der Hand sind maximal drei Pedalumdrehungen erlaubt.',
              'Spätestens nach drei Pedalumdrehungen muss geprellt oder abgespielt werden.',
              'Kann ein Team den Ball nicht aufnehmen, ohne die Steuerrohrsteiger-Position zu verlassen, erhält das gegnerische Team Ballbesitz; der Schiedsrichter hebt den Ball an, damit das gegnerische Team ihn übernehmen kann.',
              'Verlässt der Ball das Spielfeld, erhält ebenfalls das gegnerische Team an dieser Stelle den Ball, den der Schiedsrichter freigibt.'
            ]
          }
        ]
      },
      {
        heading: '2.3 Turniermodus',
        body: [
          {
            type: 'list',
            items: [
              'Die Vorrunde wird in einer oder mehreren Gruppen ausgetragen.',
              'Punktevergabe: Sieg 3 Punkte, Unentschieden 1 Punkt, Niederlage 0 Punkte.',
              'In der Endrunde wird im K.-o.-Modus gespielt. Bei Unentschieden nach regulärer Spielzeit folgt eine Verlängerung über die halbe Spielzeit.',
              'Bleibt es danach unentschieden, erfolgt ein fünfmaliger Freiwurf shootout beider Teams hinter der Drei-Punkte-Linie. Falls weiterhin kein Sieger feststeht, wird der Ablauf wiederholt, bis ein Team gewinnt.'
            ]
          }
        ]
      }
    ]
  },
  {
    title: '3. Vergehen & Fouls',
    subsections: [
      {
        heading: '3.1 Verlassen der Steuerrohrsteiger-Position',
        body: [
          {
            type: 'paragraph',
            text:
              'Wer die Steuerrohrsteiger-Position verlässt oder stürzt, muss unverzüglich zur nächsten Außenmarkierung fahren, das Spielfeld verlassen und nach dem Wiedereinnnehmen der Position in der eigenen Coaching Zone wieder einsteigen. Dabei darf der Spielverlauf nicht beeinträchtigt werden.'
          }
        ]
      },
      {
        heading: '3.2 Technisches Foul, Berührung & regelwidriges Blocken',
        body: [
          {
            type: 'list',
            items: [
              'Umfasst unter anderem Runterschubsen, regelwidriges Blocken bei hoher Geschwindigkeit oder absichtliches Anfahren.',
              'Bei Zusammenstößen entscheidet der Schiedsrichter über die Schuldfrage; bei Unklarheit erhalten beide Spieler eine Zeitstrafe.',
              {
                text: 'Zeitstrafen-Katalog:',
                subItems: ['Leichtes Foul: 1 Minute', 'Starkes Foul: 2 Minuten', 'Unsportliches oder gefährdendes Foul: Spielverweis']
              },
              'Die Bewertung der Foul-Schwere obliegt allein dem Schiedsrichter.',
              {
                text: 'Wiederholte Verstöße können verschärft geahndet werden:',
                subItems: [
                  'Höhere Zeitstrafe bei wiederholten leichten Fouls',
                  'Spielverweis bei wiederholten starken Fouls',
                  'Turnierausschluss von Spielern oder Team bei Spielverweis(en)'
                ]
              },
              'Das Spiel wird unterbrochen und mit Ballbesitz für das gegnerische Team fortgesetzt, es sei denn, der gefoulte Spieler behält Vorteil und kann weiter angreifen.'
            ]
          }
        ]
      },
      {
        heading: '3.3 Foul in der Drei-Punkte-Zone',
        body: [
          {
            type: 'paragraph',
            text: 'Zusätzlich zur Zeitstrafe erhält das gefoulte Team einen Freiwurf.'
          }
        ]
      },
      {
        heading: '3.4 Ende der Zeitstrafe',
        body: [
          {
            type: 'paragraph',
            text:
              'Die Spielleitung signalisiert das Ende der Strafe; erst nach dieser Freigabe darf der Spieler das Spielfeld wieder betreten.'
          }
        ]
      },
      {
        heading: '3.5 Zeitspiel',
        body: [
          {
            type: 'paragraph',
            text:
              'Passive Spielweise ohne Korbversuch gilt als Regelverstoß. Der Schiedsrichter hebt die Hand, unterbricht gegebenenfalls das Spiel und überträgt den Ballbesitz an das andere Team.'
          }
        ]
      }
    ]
  },
  {
    title: '4. Stellung von Schiedsrichter & Spielleitung',
    subsections: [
      {
        heading: '4.1 Verantwortlichkeiten',
        body: [
          {
            type: 'paragraph',
            text:
              'Nicht ausdrücklich geregelte Situationen werden vom Schiedsrichterteam und der Spielleitung entschieden. Sie legen auch die Härte von Fouls, Länge von Zeitstrafen und Anerkennung von Punkten fest. Fairness, sportlicher Wettbewerb und die Gesundheit aller Teilnehmenden stehen im Vordergrund.'
          }
        ]
      }
    ]
  }
];

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
  return (
    <section style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>Reglement Kunstrad Basketball</h2>
        <p style={subtitleStyle}>
          Offizielles Regelwerk für Kunstrad-Basketball: Spielfeld, Ablauf, Fouls und Zuständigkeiten der Spielleitung.
        </p>
      </header>

      <div style={sectionGridStyle}>
        {sections.map((section) => (
          <article key={section.title} style={sectionCardStyle}>
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
