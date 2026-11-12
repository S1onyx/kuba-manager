export default {
  hero: {
    title: 'Reglement Kunstrad Basketball',
    subtitle:
      'S’offizielle Regelwerk fir Kunstrad-Basketball: Schbielfeld, Ablauf, Fouls ond wer fir was zuständig isch.',
    footnote:
      'Des Dokument isch a Anleitung fir d’Turnierleitung, d’Teams ond d’Offizielle. S’ergänzt s’Live-Dashboard, damit alli vo dr gleiche Basis ausgänget.'
  },
  sections: [
    {
      title: '1. Allgemeins',
      subsections: [
        {
          heading: '1.1 Intro',
          body: [
            {
              type: 'paragraph',
              text:
                'Kunstrad Basketball werd uff Kunsträdern en dr Steuerrohrsteiger-Position gschbielt, mit zwei Mannschafta à vier Schbieler. Jede Mannschaft will da Ball en da Korb vom Gegner neiwerfa – ond dr andra Mannschaft genau des vermassla.'
            },
            {
              type: 'paragraph',
              text:
                'Zwei Schiris ond d’Schbielleitung bassed uffs Schbiel uff. Fir jeden Korb gibt’s a bestimmte Bungdzahl. Gwunne hot d’Mannschaft mit de meischde Bungd, wenn d’Schbielzeit rom isch.'
            }
          ]
        },
        {
          heading: '1.2 Team',
          body: [
            {
              type: 'list',
              items: [
                'A Team beschdod aus höchschdens finf Schbieler.',
                'Pro Team sen höchschdens vier Schbieler uffem Feld ond schbielet aktiv mit.',
                'Gwechselt werd während em Schbiel ohne Freigab vom Schiri, aber bloß iber d’Endlinie vo dr Coaching Zone. D’Mannschaft muss druff gucka, dass nie meh als vier Schbieler uffem Feld sen. Wer des vergisst, kriegt fir oin Schbieler 2 Minuta Zeitstrafe – ond s’Team schbielt mit oim weniger weiter.'
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
                'S’ganze Schbiel werd em Steuerrohrsteiger uff ma Kunstrad oder Radballrad noch UCI-Reglement gfahra – die Position nemmt mr en dr Coaching Zone ei.',
                'Wer absteigt, a Zeitstrafe kriegt oder so, muss s’Feld sofort verlassa ond darf erscht em Steuerrohrsteiger aus dr Coaching Zone wieder nei.'
              ]
            }
          ]
        },
        {
          heading: '1.4 Schbielfeld & Bungd',
          body: [
            {
              type: 'list',
              items: [
                'Jedes Team hot sei eigene Coaching Zone, wo d’Auswechselschbieler bleiba missed.',
                {
                  text: 'D’Bungd gänget wie em Basketball:',
                  subItems: ['1 Bungd – Freiwurf', '2 Bungd – normaler Wurf aus em Schbiel', '3 Bungd – Wurf hender dr Dreier-Linie']
                }
              ]
            },
            {
              type: 'image',
              src: '/reglement/spielfeld.png',
              alt: 'Schbielfeld mit Freiwurfzona, Dreier-Linia ond Coaching Zones',
              caption: 'Schbielfeld – d’Freiwurfzone isch dunkelgrau.'
            },
            {
              type: 'list',
              items: [
                'D’Freiwurfzone isch dunkelgrau eizeichnet.',
                'Noch ma Korb wechselt dr Ball; s’Team fangt an dr Korbauslinie a.'
              ]
            }
          ]
        }
      ]
    },
    {
      title: '2. Schbielablauf',
      subsections: [
        {
          heading: '2.1 Schbieldauer, Afang & End',
          body: [
            {
              type: 'list',
              items: [
                '2 × 5 Minuta mit Seitawechsel – 1 Minut Halbzeitpause.',
                'Grundsätzlich lauft d’Uhr durch. Stoppt werd se bloß, wenn dr Schiri pfeift ond’s passende Handzeicha macht (guck 3.2). Grind kennet a Verwarnung, a Foul, dr Ball em Aus oder sonscht ebbes sei, was d’Schiris fir richtig haltet.',
                {
                  text: 'Bei K.-o.-Schbiel entscheidet dr Zufall (Münzwurf vom Schiri), wer afanga darf. En dr Vorronde fangt d’Mannschaft a, die zerscht gnennt isch.',
                  subItems: [
                    'Agschbielt werd en dr eigena Hälfte an dr Korbauslinie; jede Mannschaft startet en ihrer Hälfte.',
                    'S’Schbiel goht mit ma Pfiff vom Schiri ond am Azeigeton los.'
                  ]
                },
                'D’Schbielzeit iberwacht d’Schbielleitung; s’End gibt’s mit Pfiff ond Azeigeton.'
              ]
            }
          ]
        },
        {
          heading: '2.2 Ballschbiel',
          body: [
            {
              type: 'list',
              items: [
                'Mit em Ball en dr Hand darfsch höchschdens drei Pedalumdrehunga fahra.',
                {
                  text: 'Spätestens noch drei Pedalumdrehunga muss prellt oder abgschbielt werra.',
                  subItems: [
                    'Doppeldribbling gibt’s ned: Hosch da Ball zom zwoita Mol aufgnomma, kannsch au durch nomol Prella ned meh als drei Pedalumdrehunga fahra – noch em zwoita Aufnehma muss dr Ball abgschbielt oder gworfa werra.',
                    'Wer sich ned dra hält, gibt da Ball an d’Gegner ab.'
                  ]
                },
                {
                  text: 'Landet dr Ball uffem Boda ond kann ned aufghoba werra, ohne dass mr d’Steuerrohrsteiger-Position verlässt, kriegt d’Gegner da Ball.',
                  subItems: ['Dr Schiri hebt da Ball an dr Stell en d’Luft; s’gegnerische Team muss en sich hola.']
                },
                {
                  text: 'Goht dr Ball ens Aus, kriegt s’gegnerische Team an dr Stell da Ball.',
                  subItems: ['Dr Schiri hebt da Ball an dr Stell an dr Auslinie en d’Luft; s’gegnerische Team muss en sich hola.']
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
                'En dr Vorronde schbielet d’Teams en oiner oder mehrere Gruppa gegranand.',
                'Sieg: 3 Bungd, Unentschieda: 1 Bungd, Niederlag: 0 Bungd.',
                {
                  text: 'Ab dr Endronde werd em K.-o.-Modus gschbielt.',
                  subItems: [
                    'Stoht’s noch dr Zeit unentschieda, gibt’s a Verlängerung mit dr halba Schbielzeit (5 Minuta).',
                    'Isch’s noch dr Verlängerung emmer no gleich, werfet beide Teams fünfmol frei – jeder Schbieler muss mindeschdens oimol werfa.',
                    'Isch dann emmer no koiner vorne, werd abwechselnd je oimol weitergworfa, bis oiner gwinnt.'
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
                'En dr eigena wie en dr gegnerischa Freiwurfzone darf a Schbieler höchschdens drei Pendelbewegunga uff dr Stell bleiba (pendla). Dann muss er sofort raus.',
                {
                  text: 'Strofa:',
                  subItems: [
                    'Werd en dr eigena Freiwurfzone (Abwehr) gega d’Regel a gegnerischer Agriff behindert, kriegt d’Gegner zwei Freiwürf.',
                    'Bei ma Verstoß en dr gegnerischa Freiwurfzone (Agriff) werd dr Agriff abpfiffa ond d’Gegner kriegt da Ball.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.5 Steuerrohrsteiger-Position verlassa',
          body: [
            {
              type: 'paragraph',
              text:
                'Wer d’Steuerrohrsteiger-Position verlässt oder uff da Boda fliegt, muss s’Feld sofort Richtung nächschte Außamarkierung verlassa, ohne s’Schbiel zom störa. Wenn er en dr eigena Coaching Zone wieder em Steuerrohrsteiger isch, darf er von do aus wieder nei ond weiterschbiela.'
            }
          ]
        },
        {
          heading: '2.6 Technisches Foul, Berührung & regelwidrigs Blocka',
          body: [
            {
              type: 'list',
              items: [
                {
                  text: 'Do drunter fallt z. B. Runterschubsa, regelwidrigs Blocka bei hohem Tempo, absichtlichs „Afahra“ oder em Gegner da Weg abschneida. Leichter, ovrmeidbarer Körper- oder Radkontakt isch erlaubt.',
                  subItems: [
                    {
                      text: 'Regelkonforms Blocka',
                      subItems: ['Erlaubt isch robusts Stellungsschbiel Rad an Rad. Entscheidend isch d’Richtung vom Kontakt: Druck neba em Gegner bei paralleler Fahrt isch okay.']
                    },
                    {
                      text: 'Regelwidrigs Blocka',
                      subItems: [
                        'Ned erlaubt isch, em Gegner quer en d’Fahrlinie zom fahra oder em direkt davor da Weg abzschneida – vor allem aus ma steila Winkel (~90°), so dass er abrupt brems oder ausweicha muss oder gar nemme ausweicha ka. Au aktives Neilenka oder Beschleunige en da Gegner oder sei Rad isch verbota.'
                      ]
                    }
                  ]
                },
                {
                  text: 'Zeitstrofa fir Fouls:',
                  subItems: [
                    'Leichts Foul: Ball fir da Gegner, koi Zeitstrafe',
                    'Mittelschwers Foul: Ball fir da Gegner, 1 Minut Zeitstrafe',
                    'Schwers Foul: Ball fir da Gegner, 2 Minuta Zeitstrafe',
                    'Grob unsportlichs Verhalta oder gsondheitsgfährdends Foul: Ball fir da Gegner, Schbielverweis',
                    'Während ra Zeitstrafe schbielt s’bestrofte Team en Unterzahl. Fir da bestrofte Schbieler darf koiner neikomma.',
                    'Wie schwer a Foul isch, entscheidet dr Schiri.'
                  ]
                },
                {
                  text: 'Wiederholte Verstöß:',
                  subItems: [
                    'Wer emmer wieder leicht foult, ka a höhere Zeitstrafe kriega.',
                    'Wer emmer wieder schwer foult, ka vom Feld fliega.',
                    'Oi oder mehrere Schbielverweis kennet zom Turnierausschluss vo oizelne Schbieler oder vom ganza Team führa.'
                  ]
                },
                {
                  text: 'Vorteilregel:',
                  subItems: ['Ka dr gfoulte Schbieler sein Schbielzug trotzdem fertig macha, werd ned unterbrocha.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.7 Foul en dr Freiwurfzone',
          body: [{ type: 'paragraph', text: 'A Foul en dr Freiwurfzone gibt Zeitstrafe ond Freiwurf.' }]
        },
        {
          heading: '2.8 End vo dr Zeitstrafe',
          body: [
            {
              type: 'paragraph',
              text: 'Wann a Zeitstrafe rom isch, sagt d’Schbielleitung a. Erscht noch dera Freigab darf dr Schbieler wieder uffs Feld.'
            }
          ]
        },
        {
          heading: '2.9 Freiwurf',
          body: [
            {
              type: 'list',
              items: [
                'D’Uhr werd aghalta; grundsätzlich gibt’s zwei Freiwürf.',
                'Dr Ball werd unverteidigt vo dr Freiwurflinie gworfa. Mit- ond Gegaschbieler missed außerhalb vom Freiwurffeld bleiba. A Treffer zählt 1 Bungd.',
                'Noch em zwoita Freiwurf lauft d’Uhr weiter.'
              ]
            }
          ]
        },
        {
          heading: '2.10 Zeitschbiel',
          body: [
            {
              type: 'paragraph',
              text:
                'Wer s’Schbiel ned aktiv verfolgt, also gar ned probiert an Korb zom macha, verstößt gega d’Regel. Dr Schiri hebt d’Hand (guck 3.2) ond unterbricht noch weitere 10 Sekunda Passivschbiel. D’Gegner kriegt da Ball.'
            }
          ]
        }
      ]
    },
    {
      title: '3. Schiris',
      subsections: [
        {
          heading: '3.1 Schdellung vo Schiri & Schbielleitung',
          body: [
            {
              type: 'paragraph',
              text:
                'Was ned extra gregelt isch, entscheidet s’Schiriteam zamma mit dr Schbielleitung. Wie hart a Foul war, wie lang a Zeitstrafe isch oder ob a Bungd zählt – des entscheidet s’Schiriteam.'
            },
            {
              type: 'paragraph',
              text: 'Fair ond sportlich soll’s zuganga – ond d’Gsondheit vo alle goht vor!'
            }
          ]
        },
        {
          heading: '3.2 Handzeicha vo de Schiris',
          body: [
            {
              type: 'image',
              src: '/reglement/handsignale.png',
              alt: 'Schiri-Zeicha: Uhr lauft, Uhr stopp, 1/2/3 Bungd, Pedalfehler, Ball aus/Ballwechsel, Time-Out, Zeitschbiel, Agriffsrichtung',
              caption: 'Agriffsrichtung: noch jeder Unterbrechung mit gstreckdem Arm en d’Agriffsrichtung vom Team mit em Ball.'
            }
          ]
        }
      ]
    }
  ]
};
