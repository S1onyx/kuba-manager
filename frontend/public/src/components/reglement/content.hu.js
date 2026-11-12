export default {
  hero: {
    title: 'Kunstrad Basketball szabályzat',
    subtitle:
      'A Kunstrad Basketball hivatalos szabályzata: pálya, játékmenet, szabálytalanságok és a játékvezetés feladatai.',
    footnote:
      'Ez a dokumentum útmutatóként szolgál a torna szervezői, csapatai és tisztviselői számára. Kiegészíti az élő eredményjelzőt, hogy minden érintett ugyanazt az alapot használja.'
  },
  sections: [
    {
      title: '1. Általános rendelkezések',
      subsections: [
        {
          heading: '1.1 Bevezetés',
          body: [
            {
              type: 'paragraph',
              text:
                'A Kunstrad Basketballt művészeti kerékpárokon, fejcső-álló pozícióban, két négyfős csapat játssza. Minden csapat célja, hogy a labdát az ellenfél kosarába juttassa, illetve megakadályozza a másik csapatot ebben.'
            },
            {
              type: 'paragraph',
              text:
                'A játékot két játékvezető és a mérkőzésvezetés felügyeli. Minden kosárért meghatározott számú pont jár. Az a csapat nyer, amelyik a játékidő végén a legtöbb pontot szerezte.'
            }
          ]
        },
        {
          heading: '1.2 Csapat',
          body: [
            {
              type: 'list',
              items: [
                'Egy csapat legfeljebb öt játékosból áll.',
                'Csapatonként legfeljebb négy játékos van a pályán és vesz részt aktívan a játékban.',
                'A cserék játék közben, a játékvezető engedélye nélkül történnek, és csak a coaching zóna alapvonalán keresztül hajthatók végre. A csapatnak ügyelnie kell arra, hogy egyszerre legfeljebb négy játékos legyen a pályán. A szabály megszegése egy játékos 2 perces kiállítását vonja maga után; a csapat eggyel kevesebb játékossal folytatja.'
              ]
            }
          ]
        },
        {
          heading: '1.3 Haladási pozíció',
          body: [
            {
              type: 'list',
              items: [
                'A teljes mérkőzést fejcső-álló pozícióban, művészeti vagy kerékpárlabda-kerékpáron kell lejátszani az UCI-szabályzat szerint – ezt a pozíciót a coaching zónában kell felvenni.',
                'Leszállás, kiállítás vagy hasonló esetén a pályát azonnal el kell hagyni, és csak fejcső-álló pozícióban, a coaching zónából szabad visszatérni.'
              ]
            }
          ]
        },
        {
          heading: '1.4 Pálya & pontozás',
          body: [
            {
              type: 'list',
              items: [
                'Minden csapatnak saját coaching zónája van, ahol a cserejátékosoknak tartózkodniuk kell.',
                {
                  text: 'A pontozás a kosárlabdáéval megegyezik:',
                  subItems: ['1 pont – büntetődobás', '2 pont – normál mezőnydobás', '3 pont – dobás a hárompontos vonal mögül']
                }
              ]
            },
            {
              type: 'image',
              src: '/reglement/spielfeld.png',
              alt: 'Pálya büntetőzónákkal, hárompontos vonalakkal és coaching zónákkal',
              caption: 'Pálya – a büntetőzóna sötétszürkével jelölt.'
            },
            {
              type: 'list',
              items: [
                'A büntetőzóna sötétszürkével van jelölve.',
                'Sikeres kosár után labdacsere következik; a csapat az alapvonalról indul.'
              ]
            }
          ]
        }
      ]
    },
    {
      title: '2. A játék menete',
      subsections: [
        {
          heading: '2.1 Játékidő, kezdés & befejezés',
          body: [
            {
              type: 'list',
              items: [
                '2 × 5 perc térfélcserével – 1 perc félidei szünet.',
                'Alapvetően futó órával játszanak. Az órát csak a játékvezető sípszója és a megfelelő kézjel állítja meg (lásd 3.2). Ennek oka lehet figyelmeztetés, szabálytalanság, pályán kívüli labda vagy egyéb, a játékvezetők mérlegelésére bízott ok.',
                {
                  text: 'Kieséses mérkőzéseken a véletlen (a játékvezető pénzfeldobása) dönti el, melyik csapat kezd. Csoportmérkőzéseken az elsőként megnevezett csapat kezd.',
                  subItems: [
                    'A kezdés a saját térfélen, az alapvonalnál történik; mindkét csapat a saját térfeléről indul.',
                    'A mérkőzés a játékvezető sípszavával és a jelzőhanggal kezdődik.'
                  ]
                },
                'A játékidőt a mérkőzésvezetés felügyeli; a mérkőzés végét sípszó és jelzőhang jelzi.'
              ]
            }
          ]
        },
        {
          heading: '2.2 Labdajáték',
          body: [
            {
              type: 'list',
              items: [
                'Labdával a kézben legfeljebb három pedálfordulatot lehet megtenni.',
                {
                  text: 'Legkésőbb három pedálfordulat után pattintani vagy passzolni kell.',
                  subItems: [
                    'Kettős indítás tilos: ha a labdát másodszor is felvették, újabb pattintással sem lehet háromnál több pedálfordulatot megtenni – a második felvétel után a labdát passzolni vagy dobni kell.',
                    'A szabály megszegése labdacserével jár az ellenfél javára.'
                  ]
                },
                {
                  text: 'Ha a labda a földre esik, és a fejcső-álló pozíció elhagyása nélkül nem vehető fel, az ellenfél kapja a labdát.',
                  subItems: ['A játékvezető ezen a helyen a levegőbe emeli a labdát, amelyet az ellenfél csapatának kell átvennie.']
                },
                {
                  text: 'Ha a labda elhagyja a pályát, ezen a helyen az ellenfél kapja meg.',
                  subItems: ['A játékvezető ezen a helyen, az oldalvonalnál a levegőbe emeli a labdát, amelyet az ellenfél csapatának kell átvennie.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.3 Tornarendszer',
          body: [
            {
              type: 'list',
              items: [
                'A csapatok az előselejtezőben egy vagy több csoportban mérkőznek egymással.',
                'Győzelem: 3 pont, döntetlen: 1 pont, vereség: 0 pont.',
                {
                  text: 'A döntőkörtől kieséses rendszerben játszanak.',
                  subItems: [
                    'Ha a rendes játékidő végén döntetlen az állás, a játékidő felével (5 perc) hosszabbítás következik.',
                    'Ha a hosszabbítás után is döntetlen, mindkét csapat öt büntetődobást végez – minden játékosnak legalább egyszer dobnia kell.',
                    'Ha ezután sincs győztes, a csapatok felváltva egy-egy további dobást végeznek, amíg az egyik nem nyer.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.4 Büntetőzóna',
          body: [
            {
              type: 'list',
              items: [
                'Egy játékos mind a saját, mind az ellenfél büntetőzónájában legfeljebb három ingamozdulatig maradhat egy helyben (egyensúlyozás). Ezután a büntetőzónát azonnal el kell hagynia.',
                {
                  text: 'Büntetések:',
                  subItems: [
                    'Ha a saját büntetőzónában (védekezés) elkövetett szabálysértés akadályozza az ellenfél támadását, az ellenfél két büntetődobást kap.',
                    'Az ellenfél büntetőzónájában (támadás) elkövetett szabálysértésnél a támadást lefújják, és az ellenfél kapja a labdát.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.5 A fejcső-álló pozíció elhagyása',
          body: [
            {
              type: 'paragraph',
              text:
                'Ha egy játékos elhagyja a fejcső-álló pozíciót vagy a földre esik, a játék zavarása nélkül azonnal el kell hagynia a pályát a legközelebbi külső jelölés irányába. Miután saját coaching zónájában újra felvette a pozíciót, onnan visszatérhet a pályára és folytathatja a játékot.'
            }
          ]
        },
        {
          heading: '2.6 Technikai hiba, érintkezés & szabálytalan blokkolás',
          body: [
            {
              type: 'list',
              items: [
                {
                  text: 'Ide tartozik például az ellenfél lelökése, szabálytalan blokkolás nagy sebességnél, szándékos nekihajtás vagy az út elvágása. Az enyhe, elkerülhetetlen test- vagy kerékérintkezés megengedett.',
                  subItems: [
                    {
                      text: 'Szabályos blokkolás',
                      subItems: ['Megengedett a határozott helyezkedés kerék a kerék mellett. A döntő az érintkezés iránya: párhuzamos haladásnál az ellenfél melletti nyomás megengedett.']
                    },
                    {
                      text: 'Szabálytalan blokkolás',
                      subItems: [
                        'Szabálytalan az ellenfél haladási vonalába keresztben behajtani vagy közvetlenül előtte elvágni az útját – különösen meredek szögből (~90°) besorolva, így hirtelen fékeznie vagy kitérnie kell, vagy már nem tud kitérni. Tilos az ellenfélbe vagy kerékpárjába történő aktív bekormányzás vagy gyorsítás is.'
                      ]
                    }
                  ]
                },
                {
                  text: 'Kiállítások szabálytalanságokért:',
                  subItems: [
                    'Enyhe szabálytalanság: labdabirtoklás az ellenfélnek, nincs kiállítás',
                    'Közepes szabálytalanság: labdabirtoklás az ellenfélnek, 1 perc kiállítás',
                    'Súlyos szabálytalanság: labdabirtoklás az ellenfélnek, 2 perc kiállítás',
                    'Durván sportszerűtlen viselkedés vagy egészséget veszélyeztető szabálytalanság: labdabirtoklás az ellenfélnek, kizárás a mérkőzésről',
                    'Kiállítás alatt a büntetett csapat emberhátrányban játszik. A kiállított játékos helyére senki sem cserélhető be.',
                    'A szabálytalanság súlyosságáról a játékvezető dönt.'
                  ]
                },
                {
                  text: 'Ismételt szabálysértések:',
                  subItems: [
                    'Ismételt enyhe szabálysértések hosszabb kiállítást vonhatnak maguk után.',
                    'Ismételt súlyos szabálysértések kizáráshoz vezethetnek.',
                    'Egyszeri vagy ismételt kizárás egyes játékosok vagy az egész csapat tornáról való kizárásához vezethet.'
                  ]
                },
                {
                  text: 'Előnyszabály:',
                  subItems: ['Ha a szabálytalanságot elszenvedő játékos folytatni tudja az akcióját, a játékot nem szakítják meg.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.7 Szabálytalanság a büntetőzónában',
          body: [
            {
              type: 'paragraph',
              text: 'A büntetőzónában elkövetett szabálytalanságot kiállítással és büntetődobással sújtják.'
            }
          ]
        },
        {
          heading: '2.8 A kiállítás vége',
          body: [
            {
              type: 'paragraph',
              text:
                'A kiállítás végét a mérkőzésvezetés jelenti be. A játékos csak ezt követően térhet vissza a pályára.'
            }
          ]
        },
        {
          heading: '2.9 Büntetődobás',
          body: [
            {
              type: 'list',
              items: [
                'Az órát megállítják; alapvetően két büntetődobás jár.',
                'A labdát védekezés nélkül, a büntetővonalról dobják. A csapattársaknak és az ellenfeleknek a büntetőterületen kívül kell maradniuk. A sikeres büntetődobás 1 pontot ér.',
                'A második büntetődobás után az óra tovább fut.'
              ]
            }
          ]
        },
        {
          heading: '2.10 Időhúzás',
          body: [
            {
              type: 'paragraph',
              text:
                'Szabálysértés, ha egy csapat nem játszik aktívan, vagyis nem kísérel meg kosarat szerezni. A játékvezető ilyenkor felemeli a kezét (lásd 3.2), és további 10 másodperc passzív játék után megszakítja a játékot. Az ellenfél kapja a labdát.'
            }
          ]
        }
      ]
    },
    {
      title: '3. Játékvezetők',
      subsections: [
        {
          heading: '3.1 A játékvezetők és a mérkőzésvezetés szerepe',
          body: [
            {
              type: 'paragraph',
              text:
                'A szabályzatban nem rendezett helyzetekről a játékvezetői csapat és a mérkőzésvezetés dönt. A szabálytalanság súlyosságáról, a kiállítás hosszáról és a pontok elismeréséről minden döntés a játékvezetői csapaté.'
            },
            {
              type: 'paragraph',
              text: 'Kiemelten fontos a fair és sportszerű küzdelem – minden résztvevő testi épségének szem előtt tartásával!'
            }
          ]
        },
        {
          heading: '3.2 A játékvezetők kézjelei',
          body: [
            {
              type: 'image',
              src: '/reglement/handsignale.png',
              alt: 'Játékvezetői jelek: óra fut, óra áll, 1/2/3 pont, pedálhiba, labda kint/labdacsere, időkérés, időhúzás, támadási irány',
              caption: 'A játékvezetői jelek áttekintése (német feliratokkal). Támadási irány: minden megszakítás után kinyújtott karral a labdát birtokló csapat támadási irányába.'
            }
          ]
        }
      ]
    }
  ]
};
