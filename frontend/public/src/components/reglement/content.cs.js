export default {
  hero: {
    title: 'Pravidla Kunstrad Basketball',
    subtitle:
      'Oficiální pravidla Kunstrad Basketball: hřiště, průběh hry, fauly a působnost herního vedení.',
    footnote:
      'Tento dokument slouží jako vodítko pro vedení turnaje, týmy a rozhodčí. Doplňuje živý přehled, aby všichni zúčastnění vycházeli ze stejné základny.'
  },
  sections: [
    {
      title: '1. Všeobecná ustanovení',
      subsections: [
        {
          heading: '1.1 Úvod',
          body: [
            {
              type: 'paragraph',
              text:
                'Kunstrad Basketball se hraje na kolech pro krasojízdu v pozici stoje na hlavové trubce, se dvěma družstvy po čtyřech hráčích. Cílem každého družstva je dostat míč do soupeřova koše, případně v tom druhému družstvu zabránit.'
            },
            {
              type: 'paragraph',
              text:
                'Hru řídí dva rozhodčí a herní vedení. Za každý vstřelený koš se získává určitý počet bodů. Vítězí družstvo, které po uplynutí hrací doby nasbíralo nejvíce bodů.'
            }
          ]
        },
        {
          heading: '1.2 Družstvo',
          body: [
            {
              type: 'list',
              items: [
                'Družstvo tvoří nejvýše pět hráčů.',
                'Za každé družstvo jsou na hřišti nejvýše čtyři hráči, kteří se aktivně účastní hry.',
                'Střídání probíhá během hry bez souhlasu rozhodčího a smí se provádět jen přes koncovou čáru coaching zóny. Družstvo musí dbát na to, aby na hřišti bylo v každém okamžiku nejvýše čtyři hráči. Porušení se trestá dvouminutovým trestem pro jednoho hráče; družstvo pokračuje o jednoho hráče méně.'
              ]
            }
          ]
        },
        {
          heading: '1.3 Jízdní pozice',
          body: [
            {
              type: 'list',
              items: [
                'Celá hra se odehrává ve stoji na hlavové trubce na kole pro krasojízdu nebo kolovou podle pravidel UCI – tato pozice se zaujímá v coaching zóně.',
                'Při sestoupení, trestu apod. je nutné hřiště okamžitě opustit a znovu na něj vjet lze jen ve stoji na hlavové trubce z coaching zóny.'
              ]
            }
          ]
        },
        {
          heading: '1.4 Hřiště & bodování',
          body: [
            {
              type: 'list',
              items: [
                'Každé družstvo má vlastní coaching zónu, kde se musí zdržovat náhradníci.',
                {
                  text: 'Bodování odpovídá basketbalu:',
                  subItems: ['1 bod – trestný hod', '2 body – běžná střela ze hry', '3 body – střela zpoza tříbodové čáry']
                }
              ]
            },
            {
              type: 'image',
              src: '/reglement/spielfeld.png',
              alt: 'Hřiště se zónami trestných hodů, tříbodovými čarami a coaching zónami',
              caption: 'Hřiště – zóna trestných hodů je vyznačena tmavě šedě.'
            },
            {
              type: 'list',
              items: [
                'Zóna trestných hodů je vyznačena tmavě šedě.',
                'Po úspěšném koši se mění držení míče; družstvo začíná od koncové čáry.'
              ]
            }
          ]
        }
      ]
    },
    {
      title: '2. Průběh hry',
      subsections: [
        {
          heading: '2.1 Hrací doba, začátek & konec',
          body: [
            {
              type: 'list',
              items: [
                '2 × 5 minut se změnou stran – 1 minuta přestávka.',
                'Hraje se zásadně s běžícím časem. Čas se zastavuje pouze hvizdem rozhodčího a příslušným signálem (viz 3.2). Důvodem může být napomenutí, faul, míč mimo hřiště nebo jiné důvody podle uvážení rozhodčích.',
                {
                  text: 'Ve vyřazovacích zápasech rozhoduje náhoda (los mincí rozhodčím), které družstvo zahajuje. V zápasech základní skupiny začíná družstvo uvedené jako první.',
                  subItems: [
                    'Zahájení probíhá ve vlastní polovině u koncové čáry; každé družstvo startuje ve své polovině.',
                    'Hra začíná hvizdem rozhodčího a zvukovým signálem.'
                  ]
                },
                'Hrací dobu hlídá herní vedení; konec hry se oznamuje hvizdem a zvukovým signálem.'
              ]
            }
          ]
        },
        {
          heading: '2.2 Hra s míčem',
          body: [
            {
              type: 'list',
              items: [
                'S míčem v ruce lze ujet nejvýše tři otáčky pedálů.',
                {
                  text: 'Nejpozději po třech otáčkách pedálů je nutné driblovat nebo přihrát.',
                  subItems: [
                    'Dvojitý dribling je zakázán: pokud byl míč podruhé chycen, nelze opětovným driblingem ujet více než tři otáčky pedálů – po druhém chycení musí být míč přihrán nebo vystřelen.',
                    'Porušení se trestá ztrátou míče ve prospěch soupeře.'
                  ]
                },
                {
                  text: 'Pokud míč spadne na zem a nelze jej zvednout bez opuštění pozice na hlavové trubce, získává míč soupeř.',
                  subItems: ['Rozhodčí na tomto místě zvedne míč do vzduchu; musí jej převzít soupeřovo družstvo.']
                },
                {
                  text: 'Pokud míč opustí hřiště, získává jej na tomto místě soupeř.',
                  subItems: ['Rozhodčí na tomto místě u postranní čáry zvedne míč do vzduchu; musí jej převzít soupeřovo družstvo.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.3 Systém turnaje',
          body: [
            {
              type: 'list',
              items: [
                'V základní části se družstva utkávají v jedné nebo více skupinách.',
                'Výhra: 3 body, remíza: 1 bod, prohra: 0 bodů.',
                {
                  text: 'Od finálové části se hraje vyřazovacím systémem.',
                  subItems: [
                    'Při nerozhodném stavu po uplynutí hrací doby následuje prodloužení o polovinu hrací doby (5 minut).',
                    'Je-li i po prodloužení nerozhodně, obě družstva provedou po pěti trestných hodech – každý hráč musí házet alespoň jednou.',
                    'Pokud ani poté není vítěz, hází se střídavě vždy po jednom hodu, dokud jedno družstvo nezvítězí.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.4 Zóna trestných hodů',
          body: [
            {
              type: 'list',
              items: [
                'Hráč smí ve vlastní i soupeřově zóně trestných hodů setrvat na místě nejvýše po dobu tří kyvadlových pohybů (balancování). Poté musí zónu okamžitě opustit.',
                {
                  text: 'Tresty:',
                  subItems: [
                    'Pokud porušení ve vlastní zóně (obrana) omezí soupeřův útok, získává soupeř dva trestné hody.',
                    'Při porušení v soupeřově zóně (útok) je útok odpískán a míč získává soupeř.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.5 Opuštění pozice na hlavové trubce',
          body: [
            {
              type: 'paragraph',
              text:
                'Pokud hráč opustí pozici na hlavové trubce nebo spadne na zem, musí bez narušení hry okamžitě opustit hřiště směrem k nejbližšímu vnějšímu označení. Po opětovném zaujetí pozice ve vlastní coaching zóně smí odtud znovu vjet na hřiště a pokračovat ve hře.'
            }
          ]
        },
        {
          heading: '2.6 Technický faul, kontakt & nedovolené blokování',
          body: [
            {
              type: 'list',
              items: [
                {
                  text: 'Patří sem např. shození soupeře, nedovolené blokování ve vysoké rychlosti, úmyslné najetí do soupeře nebo jeho odříznutí. Lehký, nevyhnutelný kontakt těla nebo kola je dovolen.',
                  subItems: [
                    {
                      text: 'Dovolené blokování',
                      subItems: ['Dovolena je důrazná poziční hra kolo na kolo. Rozhoduje směr kontaktu: tlak vedle soupeře při souběžné jízdě je dovolen.']
                    },
                    {
                      text: 'Nedovolené blokování',
                      subItems: [
                        'Nedovolené je vjet soupeři napříč do jízdní stopy nebo mu těsně před ním odříznout cestu – zejména při zařazení pod ostrým úhlem (~90°), takže musí prudce brzdit či uhnout, nebo už uhnout nemůže. Zakázáno je také aktivní najíždění či zrychlování do soupeře nebo jeho kola.'
                      ]
                    }
                  ]
                },
                {
                  text: 'Tresty za fauly:',
                  subItems: [
                    'Lehký faul: míč pro soupeře, bez trestu',
                    'Středně těžký faul: míč pro soupeře, 1 minuta trestu',
                    'Těžký faul: míč pro soupeře, 2 minuty trestu',
                    'Hrubě nesportovní chování nebo faul ohrožující zdraví: míč pro soupeře, vyloučení ze zápasu',
                    'Během trestu hraje potrestané družstvo v oslabení. Za potrestaného hráče nesmí nikdo nastoupit.',
                    'O závažnosti faulu rozhoduje rozhodčí.'
                  ]
                },
                {
                  text: 'Opakované přestupky:',
                  subItems: [
                    'Opakované lehké přestupky mohou vést k vyššímu trestu.',
                    'Opakované těžké přestupky mohou vést k vyloučení ze zápasu.',
                    'Jednorázové či opakované vyloučení může vést k vyloučení jednotlivých hráčů nebo celého družstva z turnaje.'
                  ]
                },
                {
                  text: 'Pravidlo výhody:',
                  subItems: ['Pokud faulovaný hráč může přesto pokračovat v akci, hra se nepřerušuje.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.7 Faul v zóně trestných hodů',
          body: [
            {
              type: 'paragraph',
              text: 'Faul v zóně trestných hodů se trestá časovým trestem a trestným hodem.'
            }
          ]
        },
        {
          heading: '2.8 Konec trestu',
          body: [
            {
              type: 'paragraph',
              text: 'Konec trestu oznamuje herní vedení. Hráč smí znovu vjet na hřiště až po tomto uvolnění.'
            }
          ]
        },
        {
          heading: '2.9 Trestný hod',
          body: [
            {
              type: 'list',
              items: [
                'Čas se zastaví; zásadně se provádějí dva trestné hody.',
                'Míč se hází bez obrany z čáry trestných hodů. Spoluhráči i soupeři musí zůstat mimo pole trestných hodů. Úspěšný trestný hod má hodnotu 1 bodu.',
                'Po druhém trestném hodu čas běží dál.'
              ]
            }
          ]
        },
        {
          heading: '2.10 Zdržování hry',
          body: [
            {
              type: 'paragraph',
              text:
                'Přestupkem je nehrát aktivně, tedy nepokoušet se dát koš. Rozhodčí zvedne ruku (viz 3.2) a po dalších 10 sekundách pasivní hry hru přeruší. Míč získává soupeř.'
            }
          ]
        }
      ]
    },
    {
      title: '3. Rozhodčí',
      subsections: [
        {
          heading: '3.1 Postavení rozhodčích a herního vedení',
          body: [
            {
              type: 'paragraph',
              text:
                'O situacích, které pravidla neupravují, rozhoduje tým rozhodčích a herní vedení. Veškerá rozhodnutí o závažnosti faulu, délce trestu nebo uznání bodů náleží týmu rozhodčích.'
            },
            {
              type: 'paragraph',
              text: 'Důraz je kladen na férový a sportovní souboj – s ohledem na zdraví všech účastníků!'
            }
          ]
        },
        {
          heading: '3.2 Signály rozhodčích',
          body: [
            {
              type: 'image',
              src: '/reglement/handsignale.png',
              alt: 'Signály rozhodčích: čas běží, zastavení času, 1/2/3 body, chyba v šlapání, míč mimo/změna držení, oddechový čas, zdržování hry, směr útoku',
              caption: 'Přehled signálů rozhodčích (popisky v němčině). Směr útoku: po každém přerušení natažená paže ve směru útoku družstva s míčem.'
            }
          ]
        }
      ]
    }
  ]
};
