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
                'Kunstrad Basketball wird auf Kunsträdern in der Steuerrohrsteiger-Position mit zwei Mannschaften à vier Spielern gespielt. Ziel jeder Mannschaft ist es, den Ball in den gegnerischen Korb zu werfen bzw. die andere Mannschaft daran zu hindern.'
            },
            {
              type: 'paragraph',
              text:
                'Das Spiel wird von zwei Schiedsrichtern sowie der Spielleitung überwacht. Für jeden erzielten Korb gibt es eine bestimmte Anzahl an Punkten. Gewonnen hat die Mannschaft mit den meisten erzielten Punkten nach Ablauf der Spielzeit.'
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
                'Pro Team sind maximal vier Spieler auf dem Feld und nehmen aktiv am Spiel teil.',
                'Spielerwechsel finden während des Spiels ohne Freigabe des Schiedsrichters statt und dürfen nur über die Endlinie der Coaching Zone erfolgen. Die Mannschaft muss darauf achten, dass zu jedem Zeitpunkt maximal vier Spieler auf dem Feld sind. Ein Verstoß wird mit 2 Minuten Zeitstrafe für einen Spieler geahndet; das Team spielt mit einem Spieler weniger weiter.'
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
                'Das gesamte Spiel wird im Steuerrohrsteiger auf einem Kunstrad oder Radballrad laut UCI-Reglement absolviert – diese Position wird in der Coaching Zone eingenommen.',
                'Bei Absteigen, Zeitstrafe o. Ä. muss das Spielfeld unmittelbar verlassen werden und darf erst in der Steuerrohrsteiger-Position wieder aus der Coaching Zone befahren werden.'
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
                'Jedes Team hat eine eigene Coaching Zone, in der sich die Auswechselspieler aufhalten müssen.',
                {
                  text: 'Die Punktewertung entspricht dem Basketball:',
                  subItems: ['1 Punkt – Freiwurf', '2 Punkte – normaler Wurf aus dem Spiel', '3 Punkte – Wurf hinter der Drei-Punkte-Linie']
                }
              ]
            },
            {
              type: 'image',
              src: '/reglement/spielfeld.png',
              alt: 'Spielfeld mit Freiwurfzonen, Drei-Punkte-Linien und Coaching Zones',
              caption: 'Spielfeld – die Freiwurfzone ist dunkelgrau gekennzeichnet.'
            },
            {
              type: 'list',
              items: [
                'Die Freiwurfzone ist dunkelgrau gekennzeichnet.',
                'Nach einem erfolgreichen Korbwurf erfolgt ein Ballwechsel; das Team startet von der Korbauslinie aus.'
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
                '2 × 5 Minuten mit Seitenwechsel – 1 Minute Halbzeitpause.',
                'Es wird grundsätzlich mit laufender Uhr gespielt. Die Uhr wird nur durch Pfiff des Schiedsrichters und entsprechendes Handsignal gestoppt (siehe 3.2). Gründe dafür können Verwarnung, Foul, Ball außerhalb des Spielfelds oder weitere Gründe nach Ermessen der Schiedsrichter sein.',
                {
                  text: 'Bei K.-o.-Spielen entscheidet der Zufall (Münzwurf des Schiedsrichters), welche Mannschaft anspielen darf. Bei Vorrundenspielen beginnt die erstgenannte Mannschaft.',
                  subItems: [
                    'Das Anspiel findet in der eigenen Hälfte an der Korbauslinie statt; jede Mannschaft startet in ihrer eigenen Hälfte.',
                    'Das Spiel wird durch einen Pfiff des Schiedsrichters sowie den Anzeigeton gestartet.'
                  ]
                },
                'Die Spieldauer wird von der Spielleitung überwacht; das Spielende wird durch einen Pfiff sowie den Anzeigeton signalisiert.'
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
                'Mit dem Ball in der Hand dürfen maximal drei Pedalumdrehungen gefahren werden.',
                {
                  text: 'Nach spätestens drei Pedalumdrehungen muss geprellt oder abgespielt werden.',
                  subItems: [
                    'Doppeldribbling ist verboten: Wurde der Ball ein zweites Mal aufgenommen, dürfen durch erneutes Prellen nicht mehr als drei Pedalumdrehungen gefahren werden – nach dem zweiten Aufnehmen muss der Ball abgespielt bzw. geworfen werden.',
                    'Ein Verstoß wird mit Ballwechsel zur gegnerischen Mannschaft geahndet.'
                  ]
                },
                {
                  text: 'Landet der Ball auf dem Boden und kann nicht aufgenommen werden, ohne die Steuerrohrsteiger-Position zu verlassen, erhält die gegnerische Mannschaft den Ball.',
                  subItems: ['Der Schiedsrichter hebt den Ball an dieser Stelle in die Luft; er muss vom gegnerischen Team aufgenommen werden.']
                },
                {
                  text: 'Landet der Ball außerhalb des Spielfelds, erhält das gegnerische Team an dieser Stelle den Ball.',
                  subItems: ['Der Schiedsrichter hebt den Ball an dieser Stelle an der Auslinie in die Luft; er muss vom gegnerischen Team aufgenommen werden.']
                }
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
                'Die Teams treten in der Vorrunde in einer oder mehreren Gruppen gegeneinander an.',
                'Spielgewinn: 3 Punkte, Unentschieden: 1 Punkt, Niederlage: 0 Punkte.',
                {
                  text: 'Ab der Endrunde wird im K.-o.-Modus gespielt.',
                  subItems: [
                    'Bei Unentschieden nach Zeitablauf gibt es eine Verlängerung über die halbe Spieldauer (5 Minuten).',
                    'Bei Unentschieden nach der Verlängerung folgt ein Freiwerfen mit je fünf Würfen beider Teams – dabei muss jeder Spieler mindestens einmal werfen.',
                    'Steht danach kein Sieger fest, wird jeweils einmal pro Team weitergeworfen, bis ein Team gewinnt – es wird abwechselnd geworfen.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.4 Freiwurfzone',
          body: [
            {
              type: 'list',
              items: [
                'Ein Spieler darf sowohl in der eigenen als auch in der gegnerischen Freiwurfzone maximal drei Pendelbewegungen auf der Stelle verweilen (pendeln). Danach muss die Freiwurfzone unmittelbar verlassen werden.',
                {
                  text: 'Strafen:',
                  subItems: [
                    'Wird bei einem Verstoß in der eigenen Freiwurfzone (Verteidigung) ein gegnerischer Angriff behindert, erhält das gegnerische Team zwei Freiwürfe.',
                    'Bei einem Verstoß in der gegnerischen Freiwurfzone (Angriff) wird der Angriff abgepfiffen und das gegnerische Team erhält den Ball.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.5 Verlassen der Steuerrohrsteiger-Position',
          body: [
            {
              type: 'paragraph',
              text:
                'Verlässt ein Spieler die Steuerrohrsteiger-Position bzw. fällt er auf den Boden, muss er das Spielfeld unverzüglich in Richtung der nächstgelegenen Außenmarkierung verlassen, ohne das laufende Spiel zu beeinträchtigen. Nach dem Einnehmen der Steuerrohrsteiger-Position in der eigenen Coaching Zone darf er das Spielfeld von dort wieder befahren und am weiteren Spiel teilnehmen.'
            }
          ]
        },
        {
          heading: '2.6 Technisches Foul, Berührung & regelwidriges Blocken',
          body: [
            {
              type: 'list',
              items: [
                {
                  text: 'Hierunter fallen z. B. Runterschubsen, regelwidriges Blocken bei hoher Geschwindigkeit, absichtliches „Anfahren“ bzw. Wegabschneiden des Gegners. Leichter, unvermeidlicher Körper- oder Radkontakt ist erlaubt.',
                  subItems: [
                    {
                      text: 'Regelkonformes Blocken',
                      subItems: ['Erlaubt ist robustes Stellungsspiel Rad an Rad. Maßgeblich ist die Richtung des Kontakts: Druck neben dem Gegner bei paralleler Fahrt ist erlaubt.']
                    },
                    {
                      text: 'Regelwidriges Blocken',
                      subItems: [
                        'Regelwidrig ist, dem Gegner quer in die Fahrlinie zu fahren bzw. ihm unmittelbar davor den Weg abzuschneiden – insbesondere aus einem steilen Winkel (~90°) einscherend, sodass er abrupt bremsen oder ausweichen muss oder ein Ausweichen nicht mehr möglich ist. Ebenso ist das aktive Hineinlenken oder Beschleunigen in den Gegner oder dessen Rad untersagt.'
                      ]
                    }
                  ]
                },
                {
                  text: 'Zeitstrafen für Fouls:',
                  subItems: [
                    'Leichtes Foul: Ballbesitz für den Gegner, keine Zeitstrafe',
                    'Mittelschweres Foul: Ballbesitz für den Gegner, 1 Minute Zeitstrafe',
                    'Schweres Foul: Ballbesitz für den Gegner, 2 Minuten Zeitstrafe',
                    'Grob unsportliches Verhalten oder gesundheitsgefährdendes Foul: Ballbesitz für den Gegner, Spielverweis',
                    'Während einer Zeitstrafe spielt das bestrafte Team in Unterzahl. Für den bestraften Spieler darf niemand eingewechselt werden.',
                    'Die Entscheidung über die Schwere eines Fouls obliegt dem Schiedsrichter.'
                  ]
                },
                {
                  text: 'Wiederholte Verstöße:',
                  subItems: [
                    'Wiederholte leichte Verstöße können zu einer höheren Zeitstrafe führen.',
                    'Wiederholte starke Verstöße können zum Spielverweis führen.',
                    'Ein einmaliger oder wiederholter Spielverweis kann zum Turnierausschluss einzelner Spieler oder des ganzen Teams führen.'
                  ]
                },
                {
                  text: 'Vorteilregel:',
                  subItems: ['Kann der gefoulte Spieler seinen Spielzug trotzdem fortführen, wird das Spiel nicht unterbrochen.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.7 Foul in der Freiwurfzone',
          body: [
            {
              type: 'paragraph',
              text: 'Ein Foul in der Freiwurfzone wird mit Zeitstrafe und Freiwurf geahndet.'
            }
          ]
        },
        {
          heading: '2.8 Ende der Zeitstrafe',
          body: [
            {
              type: 'paragraph',
              text:
                'Das Ende einer Zeitstrafe wird von der Spielleitung bekanntgegeben. Der Spieler darf das Spielfeld erst nach dieser Freigabe wieder befahren.'
            }
          ]
        },
        {
          heading: '2.9 Freiwurf',
          body: [
            {
              type: 'list',
              items: [
                'Die Uhr wird angehalten; es gibt grundsätzlich zwei Freiwürfe.',
                'Der Ball wird unverteidigt von der Freiwurflinie geworfen. Mit- und Gegenspieler müssen sich außerhalb des Freiwurffelds aufhalten. Ein erfolgreicher Freiwurf wird mit 1 Punkt bewertet.',
                'Nach dem zweiten Freiwurf läuft die Uhr weiter.'
              ]
            }
          ]
        },
        {
          heading: '2.10 Zeitspiel',
          body: [
            {
              type: 'paragraph',
              text:
                'Es ist eine Regelübertretung, das Spiel nicht aktiv zu verfolgen, also keinen Versuch zu unternehmen, einen Korb zu erzielen. Der Schiedsrichter hebt dann die Hand (siehe 3.2) und unterbricht das Spiel nach weiteren 10 Sekunden Passivspiel. Die gegnerische Mannschaft bekommt den Ball.'
            }
          ]
        }
      ]
    },
    {
      title: '3. Schiedsrichter',
      subsections: [
        {
          heading: '3.1 Stellung des Schiedsrichters und der Spielleitung',
          body: [
            {
              type: 'paragraph',
              text:
                'Der Umgang mit etwaigen fehlenden Regelungen obliegt dem Schiedsrichterteam und der Spielleitung. Jede Entscheidung über die Härte eines Fouls, die Länge einer Zeitstrafe oder die Anerkennung eines Punktgewinns obliegt dem Schiedsrichterteam.'
            },
            {
              type: 'paragraph',
              text:
                'Es wird Wert auf eine faire und sportliche Auseinandersetzung gelegt – mit Fokus auf die gesundheitliche Unversehrtheit aller Teilnehmenden!'
            }
          ]
        },
        {
          heading: '3.2 Handsignale der Schiedsrichter',
          body: [
            {
              type: 'image',
              src: '/reglement/handsignale.png',
              alt: 'Schiedsrichter-Signale: Uhr läuft, Uhr stopp, 1/2/3 Punkte, Pedalfehler, Ball aus/Ballwechsel, Time-Out, Zeitspiel, Angriffsrichtung',
              caption: 'Angriffsrichtung: nach jeder Unterbrechung mit gestrecktem Arm in Angriffsrichtung des ballbesitzenden Teams.'
            }
          ]
        }
      ]
    }
  ]
};
