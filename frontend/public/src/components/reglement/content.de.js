export default {
  hero: {
    title: 'Reglement Kunstrad Basketball',
    subtitle:
      'Offizielles Regelwerk für Kunstrad-Basketball: Spielfeld, Ablauf, Fouls und Zuständigkeiten der Spielleitung.',
    footnote:
      'Dieses Dokument dient als Leitfaden für Turnierleitung, Teams und Offizielle. Es ergänzt das Live-Dashboard, damit alle Beteiligten dieselbe Basis haben.'
  },
  sections: [
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
                'Pro Team stehen maximal vier Spieler gleichzeitig auf dem Feld. Zu viele Spieler auf dem Feld werden mit 2 Minuten Zeitstrafe geahndet.',
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
                'Nach einem erfolgreichen Korbwurf beginnt das kassierende Team mit Einwurf von der eigenen Grundlinie.',
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
                'Spieldauer: 2×5 Minuten mit 1 Minute Halbzeitpause; die Uhr läuft ohne Unterbrechung.',
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
                'Spätestens nach drei Pedalumdrehungen muss geprellt oder abgespielt werden. Doppeldribbling – Ball aufnehmen und erneut prellen – ist verboten.',
                'Bei mehr als drei Pedalumdrehungen ohne Abspiel oder Prellen erfolgt Ballwechsel an das gegnerische Team.',
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
                'Bleibt es danach unentschieden, erfolgt ein Freiwurf-Shootout: Beide Teams werfen abwechselnd fünfmal hinter der Drei-Punkte-Linie – jeder Spieler muss mindestens einmal werfen. Falls weiterhin kein Sieger feststeht, wird der Ablauf wiederholt, bis ein Team gewinnt.'
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
                'Wer die Steuerrohrsteiger-Position verlässt oder stürzt, muss unverzüglich zur nächsten Außenmarkierung fahren, das Spielfeld verlassen und nach dem Wiedereinnehmen der Position in der eigenen Coaching Zone wieder einsteigen. Dabei darf der Spielverlauf nicht beeinträchtigt werden.'
            }
          ]
        },
        {
          heading: '3.2 Technisches Foul, Berührung & regelwidriges Blocken',
          body: [
            {
              type: 'list',
              items: [
                'Umfasst unter anderem Runterschubsen, regelwidriges Blocken bei hoher Geschwindigkeit, absichtliches Anfahren oder Weg-Abschneiden (Querstellen vor einem fahrenden Spieler ohne Bremsabstand).',
                'Unvermeidlicher Körperkontakt ohne Einfluss auf den Spielverlauf gilt nicht als Foul.',
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
          heading: '3.5 Freiwurf',
          body: [
            {
              type: 'list',
              items: [
                'Freiwürfe werden hinter der Drei-Punkte-Linie ausgeführt.',
                'Der werfende Spieler hat drei Pedalumdrehungen Zeit, um den Freiwurf auszuführen.',
                'Gegnerische Spieler müssen während des Freiwurfs außerhalb der Drei-Punkte-Zone bleiben.',
                'Trifft der Freiwurf, gibt das gegnerische Team von der Grundlinie ein.'
              ]
            }
          ]
        },
        {
          heading: '3.6 Zeitspiel',
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
  ]
};
