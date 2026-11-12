export default {
  hero: {
    title: 'Reglement Kunstrad Basketball',
    subtitle:
      'S’offiziäll Reglewärk für Kunstrad-Basketball: Spilfäld, Ablauf, Fouls und d’Zueständigkeite vo de Spilleitig.',
    footnote:
      'Das Dokumänt dient als Leitfade für d’Turnierleitig, d’Teams und d’Offiziälle. Es ergänzt s’Live-Dashboard, damit alli Beteiligte di glich Basis händ.'
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
                'Kunstrad Basketball wird uf Kunsträder i de Steuerrohrstiiger-Position gspilt, mit zwei Mannschafte à vier Spiler. Jedi Mannschaft wott de Ball in gägnerische Chorb wärfe – und di anderi Mannschaft dra hindere.'
            },
            {
              type: 'paragraph',
              text:
                'Zwei Schiris und d’Spilleitig lueged uf s’Spil. Für jede Chorb gits e bestimmti Aazahl Pünkt. Gwunne hät d’Mannschaft mit de meischte Pünkt, wänn d’Spilziit ume isch.'
            }
          ]
        },
        {
          heading: '1.2 Team',
          body: [
            {
              type: 'list',
              items: [
                'Es Team bestaht us maximal föif Spiler.',
                'Pro Team sind maximal vier Spiler uf em Fäld und spiled aktiv mit.',
                'Gwächslet wird während em Spil ohni Freigab vom Schiri, aber nur über d’Ändlinie vo de Coaching Zone. D’Mannschaft mues drauf luege, dass nie meh als vier Spiler uf em Fäld sind. Wer das missachtet, chunnt für ein Spiler 2 Minute Ziitstraf über – und s’Team spilt mit eim weniger wiiter.'
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
                'S’ganze Spil wird im Steuerrohrstiiger uf emne Kunstrad oder Radballrad nach UCI-Reglement gfahre – die Position nimmt mer i de Coaching Zone ii.',
                'Bim Abstiige, ere Ziitstraf oder ähnlichem mues mer s’Fäld sofort verlah und darf erscht im Steuerrohrstiiger us de Coaching Zone wieder ine.'
              ]
            }
          ]
        },
        {
          heading: '1.4 Spilfäld & Pünkt',
          body: [
            {
              type: 'list',
              items: [
                'Jedes Team hät sini eigeti Coaching Zone, wo d’Uswächselspiler mönd bliibe.',
                {
                  text: 'D’Pünkt gönd wie im Basketball:',
                  subItems: ['1 Punkt – Freiwurf', '2 Pünkt – normale Wurf us em Spil', '3 Pünkt – Wurf hinder de Drüpunkt-Linie']
                }
              ]
            },
            {
              type: 'image',
              src: '/reglement/spielfeld.png',
              alt: 'Spilfäld mit Freiwurfzone, Drüpunkt-Linie und Coaching Zones',
              caption: 'Spilfäld – d’Freiwurfzone isch dunkelgrau.'
            },
            {
              type: 'list',
              items: [
                'D’Freiwurfzone isch dunkelgrau iizeichnet.',
                'Nach emne Chorb wächslet de Ball; s’Team fangt a de Chorbuslinie aa.'
              ]
            }
          ]
        }
      ]
    },
    {
      title: '2. Spilablauf',
      subsections: [
        {
          heading: '2.1 Spildauer, Aafang & Änd',
          body: [
            {
              type: 'list',
              items: [
                '2 × 5 Minute mit Siitewächsel – 1 Minute Halbziitpause.',
                'Grundsätzlich lauft d’Uhr dure. Gstoppt wird si nur, wänn de Schiri pfiift und s’passende Handzeiche macht (lueg 3.2). Gründ chönd e Verwarnig, es Foul, de Ball im Uus oder suscht öppis sii, wo d’Schiris für richtig findet.',
                {
                  text: 'Bi K.-o.-Spil entscheidet de Zuefall (Münzwurf vom Schiri), wer aafange darf. I de Vorrundi fangt d’Mannschaft aa, wo zerscht gnännt isch.',
                  subItems: [
                    'Aagspilt wird i de eigete Hälfti a de Chorbuslinie; jedi Mannschaft startet i ihrere Hälfti.',
                    'S’Spil gaht mit emne Pfiff vom Schiri und em Aazeigton los.'
                  ]
                },
                'D’Spilziit überwacht d’Spilleitig; s’Änd wird mit Pfiff und Aazeigton gmeldet.'
              ]
            }
          ]
        },
        {
          heading: '2.2 Ballspil',
          body: [
            {
              type: 'list',
              items: [
                'Mit em Ball i de Hand dörf mer maximal drü Pedalumdrehige fahre.',
                {
                  text: 'Spöötischtens nach drü Pedalumdrehige mues prellt oder abgspilt wärde.',
                  subItems: [
                    'Doppeldribbling isch verbote: Häsch de Ball zum zweite Mal ufgno, chasch au mit nomal Prelle nöd meh als drü Pedalumdrehige fahre – nach em zweite Ufneh mues de Ball abgspilt oder gworfe wärde.',
                    'Wer sich nöd dra hebt, git de Ball de Gägner.'
                  ]
                },
                {
                  text: 'Landet de Ball uf em Bode und cha nöd ufgno wärde, ohni d’Steuerrohrstiiger-Position z’verlah, überchunnt d’Gägner de Ball.',
                  subItems: ['De Schiri hebt de Ball a dere Stell i d’Luft; s’gägnerische Team mues ne sich hole.']
                },
                {
                  text: 'Gaht de Ball is Uus, überchunnt s’gägnerische Team a dere Stell de Ball.',
                  subItems: ['De Schiri hebt de Ball a dere Stell a de Uuslinie i d’Luft; s’gägnerische Team mues ne sich hole.']
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
                'I de Vorrundi spiled d’Teams i einere oder mehrere Gruppe gägenand.',
                'Sieg: 3 Pünkt, Unentschide: 1 Punkt, Niederlag: 0 Pünkt.',
                {
                  text: 'Ab de Ändrundi wird im K.-o.-Modus gspilt.',
                  subItems: [
                    'Stahts nach Ablauf vo de Ziit unentschide, gits e Verlängerig mit de halbe Spilziit (5 Minute).',
                    'Isch es nach de Verlängerig immer no glich, wärfed beidi Teams föifmal frei – jede Spiler mues mindischtens eimal wärfe.',
                    'Isch dänn immer no niemer vorne, wird abwächslungswiis je eimal wiitergworfe, bis eis gwinnt.'
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
                'I de eigete wie i de gägnerische Freiwurfzone dörf en Spiler maximal drü Pändelbewegige uf de Stell bliibe (pändle). Dänn mues er sofort use.',
                {
                  text: 'Strafe:',
                  subItems: [
                    'Wird bi emne Verstoss i de eigete Freiwurfzone (Abwehr) en gägnerische Aagriff behinderet, überchunnt d’Gägner zwei Freiwürf.',
                    'Bi emne Verstoss i de gägnerische Freiwurfzone (Aagriff) wird de Aagriff abpfiffe und d’Gägner überchunnt de Ball.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.5 Steuerrohrstiiger-Position verlah',
          body: [
            {
              type: 'paragraph',
              text:
                'Wer d’Steuerrohrstiiger-Position verlaht oder uf de Bode gheit, mues s’Fäld sofort Richtig nöchschti Usse-Markierig verlah, ohni s’Spil z’störe. Wänn er i de eigete Coaching Zone wieder im Steuerrohrstiiger isch, darf er vo dört us wieder ine und wiiterspile.'
            }
          ]
        },
        {
          heading: '2.6 Technischs Foul, Berüerig & regelwidrigs Blocke',
          body: [
            {
              type: 'list',
              items: [
                {
                  text: 'Da drunder fallt z. B. Abeschupfe, regelwidrigs Blocke bi hohem Tämpo, absichtlichs „Aafahre“ oder em Gägner de Wäg abschniide. Liechte, unvermiidbare Körper- oder Radkontakt isch erlaubt.',
                  subItems: [
                    {
                      text: 'Regelkonforms Blocke',
                      subItems: ['Erlaubt isch robusts Stellungsspil Rad a Rad. Entscheidend isch d’Richtig vom Kontakt: Druck näbed em Gägner bi paralleler Fahrt isch erlaubt.']
                    },
                    {
                      text: 'Regelwidrigs Blocke',
                      subItems: [
                        'Nöd erlaubt isch, em Gägner quer i d’Fahrlinie z’fahre oder ihm diräkt devor de Wäg abzschniide – vor allem us emne stiile Winkel (~90°), so dass er abrupt mues brämse oder uswiiche oder gar nümm cha uswiiche. Au aktivs Iinelänke oder Beschlünige in Gägner oder sis Rad isch verbote.'
                      ]
                    }
                  ]
                },
                {
                  text: 'Ziitstrafe für Fouls:',
                  subItems: [
                    'Liechts Foul: Ball für de Gägner, kei Ziitstraf',
                    'Mittelschwärs Foul: Ball für de Gägner, 1 Minute Ziitstraf',
                    'Schwärs Foul: Ball für de Gägner, 2 Minute Ziitstraf',
                    'Grob unsportlichs Verhalte oder gsundheitsgfährdends Foul: Ball für de Gägner, Spilverwiis',
                    'Während ere Ziitstraf spilt s’bestrafte Team in Unterzahl. Für de bestrafte Spiler darf niemer iigwächslet wärde.',
                    'Wie schwär es Foul isch, entscheidet de Schiri.'
                  ]
                },
                {
                  text: 'Wiederholti Verstöss:',
                  subItems: [
                    'Wiederholti liechti Verstöss chönd zu ere höchere Ziitstraf füere.',
                    'Wiederholti schwäri Verstöss chönd zum Spilverwiis füere.',
                    'Ein oder mehreri Spilverwiis chönd zum Turnierusschluss vo einzelne Spiler oder vom ganze Team füere.'
                  ]
                },
                {
                  text: 'Vorteilregle:',
                  subItems: ['Cha de gfoulti Spiler sin Spilzug trotzdem fertig mache, wird s’Spil nöd unterbroche.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.7 Foul i de Freiwurfzone',
          body: [{ type: 'paragraph', text: 'Es Foul i de Freiwurfzone git Ziitstraf und Freiwurf.' }]
        },
        {
          heading: '2.8 Änd vo de Ziitstraf',
          body: [
            {
              type: 'paragraph',
              text: 'Wänn e Ziitstraf ume isch, seit d’Spilleitig aa. Erscht nach dere Freigab darf de Spiler wieder ufs Fäld.'
            }
          ]
        },
        {
          heading: '2.9 Freiwurf',
          body: [
            {
              type: 'list',
              items: [
                'D’Uhr wird aaghalte; grundsätzlich gits zwei Freiwürf.',
                'De Ball wird unverteidiget vo de Freiwurflinie gworfe. Mit- und Gägespiler mönd usserhalb vom Freiwurffäld bliibe. En Träffer zellt 1 Punkt.',
                'Nach em zweite Freiwurf lauft d’Uhr wiiter.'
              ]
            }
          ]
        },
        {
          heading: '2.10 Ziitspil',
          body: [
            {
              type: 'paragraph',
              text:
                'Wer s’Spil nöd aktiv verfolgt, also gar nöd probiert en Chorb z’mache, verstosst gäge d’Regle. De Schiri hebt d’Hand (lueg 3.2) und unterbricht nach wiitere 10 Sekunde Passivspil. D’Gägner überchunnt de Ball.'
            }
          ]
        }
      ]
    },
    {
      title: '3. Schiris',
      subsections: [
        {
          heading: '3.1 Stellig vo Schiri & Spilleitig',
          body: [
            {
              type: 'paragraph',
              text:
                'Was nöd extra greglet isch, entscheidet s’Schiriteam zäme mit de Spilleitig. Wie hert es Foul gsi isch, wie lang e Ziitstraf gaht oder öb en Punkt zellt – das entscheidet s’Schiriteam.'
            },
            {
              type: 'paragraph',
              text: 'Fair und sportlich sölls zuegah – und d’Gsundheit vo allne gaht vor!'
            }
          ]
        },
        {
          heading: '3.2 Handzeiche vo de Schiris',
          body: [
            {
              type: 'image',
              src: '/reglement/handsignale.png',
              alt: 'Schiri-Zeiche: Uhr lauft, Uhr stopp, 1/2/3 Pünkt, Pedalfähler, Ball uus/Ballwächsel, Time-Out, Ziitspil, Aagriffsrichtig',
              caption: 'Aagriffsrichtig: nach jedere Unterbrechig mit gstrecktem Arm i d’Aagriffsrichtig vom Team mit em Ball.'
            }
          ]
        }
      ]
    }
  ]
};
