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
                'A Kunstrad Basketballt művészeti kerékpárokon, a fejcső-álló pozícióban, két négyszemélyes csapat játssza. A cél kosarakat szerezni és megakadályozni az ellenfél kosarait. A játékot játékvezetők és a mérkőzésvezetés felügyeli; az a csapat nyer, amelyik a játékidő leteltével a legtöbb ponttal rendelkezik.'
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
                'Csapatonként egyszerre legfeljebb négy játékos tartózkodhat a pályán. A pályán lévő túl sok játékos 2 perces időbüntetéssel jár.',
                'A játékoscserék repülőcsere formájában, kizárólag a saját coaching zónán keresztül történnek.'
              ]
            }
          ]
        },
        {
          heading: '1.3 Vezetési pozíció',
          body: [
            {
              type: 'list',
              items: [
                'Az egész játék a fejcső-álló pozícióban zajlik, az UCI szabályzatának megfelelő művészeti vagy kerékpárlabda-kerékpáron; a pozíciót a coaching zónában kell felvenni.',
                'Leszállás, időbüntetés vagy hasonló helyzetek esetén a pályát azonnal el kell hagyni, és az csak a coaching zónából, fejcső-álló pozícióban hajtható be újra.'
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
                'Minden csapat saját coaching zónával rendelkezik, ahol a cserejátékosok tartózkodnak.',
                'Sikeres kosárdobás után a kosarat kapó csapat a saját alapvonaláról kezd bedobással.',
                {
                  text: 'A pontozás megfelel a kosárlabdának:',
                  subItems: ['1 pont – szabaddobás', '2 pont – játékból szerzett dobás', '3 pont – a hárompontos vonal mögüli dobás']
                }
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
          heading: '2.1 Játékidő, kezdés & vége',
          body: [
            {
              type: 'list',
              items: [
                'Játékidő: 2×5 perc, 1 perces félidőszünettel; az óra megszakítás nélkül jár.',
                'A kezdés előtt véletlenszerű döntés (pl. pénzfeldobás) határozza meg, melyik csapat kapja a labdabirtoklást.',
                'A kezdőjáték a saját térfélen történik; mindkét csapat a saját térfeléről indul, és a játék a játékvezető sípjelzésére kezdődik.',
                'A mérkőzésvezetés figyeli az időt és sípjelzéssel jelzi a végét.'
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
                'Labdával a kézben legfeljebb három pedálfordulat engedélyezett.',
                'Legkésőbb három pedálfordulat után pattogtatni kell a labdát vagy passzolni kell. A dupla pattogtatás – a labda felvétele és újbóli pattogtatása – tilos.',
                'Háromnál több pedálfordulat esetén passz vagy pattogtatás nélkül a labdabirtoklás az ellenfél csapatához kerül.',
                'Ha egy csapat nem tudja felvenni a labdát anélkül, hogy elhagyná a fejcső-álló pozíciót, az ellenfél kapja a labdabirtoklást; a játékvezető felemeli a labdát, hogy az ellenfél átvehesse.',
                'Ha a labda elhagyja a pályát, az ellenfél csapata szintén ezen a helyen kapja meg a labdát, amelyet a játékvezető ad játékba.'
              ]
            }
          ]
        },
        {
          heading: '2.3 Tornamódusz',
          body: [
            {
              type: 'list',
              items: [
                'A selejtezőkör egy vagy több csoportban kerül megrendezésre.',
                'Pontozás: győzelem 3 pont, döntetlen 1 pont, vereség 0 pont.',
                'A döntőkör egyenes kieséses rendszerben zajlik. Rendes játékidő utáni döntetlen esetén a játékidő felének megfelelő hosszabbítás következik.',
                'Ha ezután is döntetlen az állás, szabaddobás-párbaj következik: mindkét csapat felváltva ötször dob a hárompontos vonal mögül – minden játékosnak legalább egyszer dobnia kell. Ha továbbra sincs győztes, a folyamat addig ismétlődik, amíg egy csapat nyer.'
              ]
            }
          ]
        }
      ]
    },
    {
      title: '3. Szabálytalanságok & faultok',
      subsections: [
        {
          heading: '3.1 A fejcső-álló pozíció elhagyása',
          body: [
            {
              type: 'paragraph',
              text:
                'Aki elhagyja a fejcső-álló pozíciót vagy elesik, annak haladéktalanul a legközelebbi külső jelöléshez kell hajtania, el kell hagynia a pályát, és a pozíció újbóli felvétele után a saját coaching zónából szállhat vissza. Ez közben a játékmenetet nem szabad akadályoznia.'
            }
          ]
        },
        {
          heading: '3.2 Technikai fault, érintkezés & szabálytalan blokkolás',
          body: [
            {
              type: 'list',
              items: [
                'Ide tartozik többek között a lelökés, a nagy sebességnél történő szabálytalan blokkolás, a szándékos ráfutás vagy az út elé vágás (mozgó játékos elé fékezési távolság nélkül keresztbe állni).',
                'A játékmenetet nem befolyásoló, elkerülhetetlen testi érintkezés nem minősül faultnak.',
                'Ütközések esetén a játékvezető dönt a vétkesség kérdésében; tisztázatlan esetben mindkét játékos időbüntetést kap.',
                {
                  text: 'Időbüntetések katalógusa:',
                  subItems: ['Enyhe fault: 1 perc', 'Súlyos fault: 2 perc', 'Sportszemélytelen vagy veszélyes fault: kizárás a játékból']
                },
                'A fault súlyosságának megítélése kizárólag a játékvezető hatásköre.',
                {
                  text: 'Az ismételt szabálytalanságok szigorúbban büntethetők:',
                  subItems: [
                    'Hosszabb időbüntetés ismételt enyhe faultok esetén',
                    'Kizárás a játékból ismételt súlyos faultok esetén',
                    'Játékosok vagy a csapat kizárása a tornáról játékbeli kizárás(ok) esetén'
                  ]
                },
                'A játék megszakad, és az ellenfél labdabirtoklásával folytatódik, kivéve, ha a faultot elszenvedő játékos megtartja az előnyt és folytathatja a támadást.'
              ]
            }
          ]
        },
        {
          heading: '3.3 Fault a hárompontos zónában',
          body: [
            {
              type: 'paragraph',
              text: 'Az időbüntetésen felül a faultot elszenvedő csapat szabaddobást kap.'
            }
          ]
        },
        {
          heading: '3.4 Az időbüntetés vége',
          body: [
            {
              type: 'paragraph',
              text:
                'A mérkőzésvezetés jelzi a büntetés végét; a játékos csak ezután az engedélyezés után léphet újra a pályára.'
            }
          ]
        },
        {
          heading: '3.5 Szabaddobás',
          body: [
            {
              type: 'list',
              items: [
                'A szabaddobásokat a hárompontos vonal mögül kell elvégezni.',
                'A dobó játékosnak három pedálfordulat áll rendelkezésére a szabaddobás elvégzéséhez.',
                'Az ellenfél játékosainak a szabaddobás alatt a hárompontos zónán kívül kell maradniuk.',
                'Ha a szabaddobás kosarat ér, az ellenfél csapata dob be az alapvonaltól.'
              ]
            }
          ]
        },
        {
          heading: '3.6 Időhúzás',
          body: [
            {
              type: 'paragraph',
              text:
                'A kosárkísérlet nélküli passzív játék szabálysértésnek minősül. A játékvezető felemeli a kezét, szükség esetén megszakítja a játékot, és a labdabirtoklást a másik csapatnak ítéli.'
            }
          ]
        }
      ]
    },
    {
      title: '4. A játékvezetők & a mérkőzésvezetés szerepe',
      subsections: [
        {
          heading: '4.1 Feladatok',
          body: [
            {
              type: 'paragraph',
              text:
                'A kifejezetten nem szabályozott helyzetekben a játékvezetői csapat és a mérkőzésvezetés dönt. Ők határozzák meg a faultok súlyosságát, az időbüntetések hosszát és a pontok elismerését is. Elsődleges szempont a sportszerűség, a sportolói verseny és minden résztvevő egészsége.'
            }
          ]
        }
      ]
    }
  ]
};
