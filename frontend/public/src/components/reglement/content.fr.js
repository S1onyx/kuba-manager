export default {
  hero: {
    title: 'Règlement Kunstrad Basketball',
    subtitle:
      'Règlement officiel du Kunstrad Basketball : terrain, déroulement du jeu, fautes et attributions de la direction de jeu.',
    footnote:
      'Ce document sert de guide aux organisateurs du tournoi, aux équipes et aux officiels. Il complète le tableau de bord en direct afin que toutes les personnes impliquées partagent la même base.'
  },
  sections: [
    {
      title: '1. Généralités',
      subsections: [
        {
          heading: '1.1 Introduction',
          body: [
            {
              type: 'paragraph',
              text:
                'Le Kunstrad Basketball se pratique sur des vélos de cyclisme artistique, en position debout sur le tube de direction, avec deux équipes de quatre joueurs. Chaque équipe cherche à lancer le ballon dans le panier adverse et à empêcher l’autre équipe d’en faire autant.'
            },
            {
              type: 'paragraph',
              text:
                'La partie est surveillée par deux arbitres et la direction de jeu. Chaque panier marqué rapporte un certain nombre de points. L’équipe qui a marqué le plus de points à la fin du temps de jeu gagne.'
            }
          ]
        },
        {
          heading: '1.2 Équipe',
          body: [
            {
              type: 'list',
              items: [
                'Une équipe compte au maximum cinq joueurs.',
                'Au maximum quatre joueurs par équipe sont sur le terrain et participent activement au jeu.',
                'Les changements de joueurs ont lieu pendant le jeu sans autorisation de l’arbitre et ne peuvent se faire que par la ligne de fond de la coaching zone. L’équipe doit veiller à ce qu’il n’y ait jamais plus de quatre joueurs sur le terrain. Une infraction est sanctionnée de 2 minutes de pénalité pour un joueur ; l’équipe continue avec un joueur de moins.'
              ]
            }
          ]
        },
        {
          heading: '1.3 Position de conduite',
          body: [
            {
              type: 'list',
              items: [
                'Toute la partie se joue debout sur le tube de direction, sur un vélo de cyclisme artistique ou de cycle-balle conforme au règlement UCI – cette position est prise dans la coaching zone.',
                'En cas de chute, de pénalité ou situation similaire, le joueur doit quitter immédiatement le terrain et ne peut y revenir qu’en position debout sur le tube de direction, depuis la coaching zone.'
              ]
            }
          ]
        },
        {
          heading: '1.4 Terrain & décompte des points',
          body: [
            {
              type: 'list',
              items: [
                'Chaque équipe dispose de sa propre coaching zone, où doivent se tenir les remplaçants.',
                {
                  text: 'Le décompte des points est identique au basket-ball :',
                  subItems: ['1 point – lancer franc', '2 points – tir normal dans le jeu', '3 points – tir derrière la ligne à trois points']
                }
              ]
            },
            {
              type: 'image',
              src: '/reglement/spielfeld.png',
              alt: 'Terrain avec zones de lancer franc, lignes à trois points et coaching zones',
              caption: 'Terrain – la zone de lancer franc est indiquée en gris foncé.'
            },
            {
              type: 'list',
              items: [
                'La zone de lancer franc est indiquée en gris foncé.',
                'Après un panier réussi, la possession change ; l’équipe repart de la ligne de fond.'
              ]
            }
          ]
        }
      ]
    },
    {
      title: '2. Déroulement du jeu',
      subsections: [
        {
          heading: '2.1 Durée, début & fin',
          body: [
            {
              type: 'list',
              items: [
                '2 × 5 minutes avec changement de côté – 1 minute de mi-temps.',
                'Le chronomètre tourne en principe en continu. Il n’est arrêté que par un coup de sifflet de l’arbitre accompagné du signal correspondant (voir 3.2). Les raisons peuvent être un avertissement, une faute, un ballon hors du terrain ou toute autre raison laissée à l’appréciation des arbitres.',
                {
                  text: 'En match à élimination directe, le hasard (tirage au sort par l’arbitre) décide quelle équipe engage. En phase de groupes, l’équipe citée en premier commence.',
                  subItems: [
                    'L’engagement a lieu dans sa propre moitié, sur la ligne de fond ; chaque équipe démarre dans sa propre moitié.',
                    'Le match commence par un coup de sifflet de l’arbitre et le signal sonore.'
                  ]
                },
                'La durée du match est contrôlée par la direction de jeu ; la fin est signalée par un coup de sifflet et le signal sonore.'
              ]
            }
          ]
        },
        {
          heading: '2.2 Jeu de balle',
          body: [
            {
              type: 'list',
              items: [
                'Ballon en main, un joueur peut effectuer au maximum trois tours de pédale.',
                {
                  text: 'Après au plus trois tours de pédale, il faut dribbler ou passer.',
                  subItems: [
                    'Le double dribble est interdit : une fois le ballon repris une deuxième fois, un nouveau dribble ne permet pas plus de trois tours de pédale – après la deuxième prise, le ballon doit être passé ou tiré.',
                    'Toute infraction entraîne la possession pour l’équipe adverse.'
                  ]
                },
                {
                  text: 'Si le ballon tombe au sol et ne peut être ramassé sans quitter la position debout sur le tube de direction, l’équipe adverse obtient le ballon.',
                  subItems: ['L’arbitre lève le ballon à cet endroit ; il doit être récupéré par l’équipe adverse.']
                },
                {
                  text: 'Si le ballon sort du terrain, l’équipe adverse obtient le ballon à cet endroit.',
                  subItems: ['L’arbitre lève le ballon à cet endroit, sur la ligne de touche ; il doit être récupéré par l’équipe adverse.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.3 Formule du tournoi',
          body: [
            {
              type: 'list',
              items: [
                'En phase préliminaire, les équipes s’affrontent dans un ou plusieurs groupes.',
                'Victoire : 3 points, nul : 1 point, défaite : 0 point.',
                {
                  text: 'À partir de la phase finale, on joue à élimination directe.',
                  subItems: [
                    'En cas d’égalité à la fin du temps réglementaire, une prolongation de la moitié du temps de jeu (5 minutes) est disputée.',
                    'En cas d’égalité après la prolongation, chaque équipe tire cinq lancers francs – chaque joueur doit tirer au moins une fois.',
                    'S’il n’y a toujours pas de vainqueur, chaque équipe tire à nouveau une fois, en alternance, jusqu’à ce qu’une équipe gagne.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.4 Zone de lancer franc',
          body: [
            {
              type: 'list',
              items: [
                'Un joueur peut rester sur place dans sa propre zone de lancer franc comme dans celle de l’adversaire pendant au maximum trois mouvements de balancier (surplace). Il doit ensuite quitter immédiatement la zone.',
                {
                  text: 'Sanctions :',
                  subItems: [
                    'Si une infraction dans sa propre zone de lancer franc (défense) gêne une attaque adverse, l’équipe adverse obtient deux lancers francs.',
                    'En cas d’infraction dans la zone adverse (attaque), l’attaque est sifflée et l’équipe adverse obtient le ballon.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.5 Quitter la position debout sur le tube de direction',
          body: [
            {
              type: 'paragraph',
              text:
                'Si un joueur quitte la position debout sur le tube de direction ou tombe au sol, il doit quitter immédiatement le terrain en direction du marquage extérieur le plus proche, sans gêner le jeu. Après avoir repris la position dans sa propre coaching zone, il peut revenir sur le terrain depuis celle-ci et reprendre part au jeu.'
            }
          ]
        },
        {
          heading: '2.6 Faute technique, contact & blocage irrégulier',
          body: [
            {
              type: 'list',
              items: [
                {
                  text: 'Cela comprend par exemple faire tomber un adversaire, un blocage irrégulier à grande vitesse, le fait de foncer volontairement sur un adversaire ou de lui couper la route. Un contact léger et inévitable entre corps ou vélos est autorisé.',
                  subItems: [
                    {
                      text: 'Blocage régulier',
                      subItems: ['Le jeu de position robuste roue contre roue est autorisé. Ce qui compte, c’est la direction du contact : une pression à côté de l’adversaire en roulant en parallèle est autorisée.']
                    },
                    {
                      text: 'Blocage irrégulier',
                      subItems: [
                        'Il est irrégulier de couper la trajectoire de l’adversaire ou de lui barrer la route juste devant lui – notamment en se rabattant sous un angle aigu (~90°), de sorte qu’il doive freiner ou s’écarter brusquement, ou ne puisse plus l’éviter. Il est également interdit de se diriger ou d’accélérer activement contre l’adversaire ou son vélo.'
                      ]
                    }
                  ]
                },
                {
                  text: 'Pénalités pour fautes :',
                  subItems: [
                    'Faute légère : possession pour l’adversaire, pas de pénalité',
                    'Faute moyenne : possession pour l’adversaire, 1 minute de pénalité',
                    'Faute grave : possession pour l’adversaire, 2 minutes de pénalité',
                    'Comportement gravement antisportif ou faute mettant la santé en danger : possession pour l’adversaire, exclusion du match',
                    'Pendant une pénalité, l’équipe sanctionnée joue en infériorité numérique. Personne ne peut remplacer le joueur pénalisé.',
                    'La gravité d’une faute est laissée à l’appréciation de l’arbitre.'
                  ]
                },
                {
                  text: 'Infractions répétées :',
                  subItems: [
                    'Des infractions légères répétées peuvent entraîner une pénalité plus longue.',
                    'Des infractions graves répétées peuvent entraîner l’exclusion du match.',
                    'Une exclusion unique ou répétée peut entraîner l’exclusion du tournoi de joueurs ou de toute l’équipe.'
                  ]
                },
                {
                  text: 'Règle de l’avantage :',
                  subItems: ['Si le joueur victime de la faute peut poursuivre son action, le jeu n’est pas interrompu.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.7 Faute dans la zone de lancer franc',
          body: [
            {
              type: 'paragraph',
              text: 'Une faute dans la zone de lancer franc est sanctionnée d’une pénalité de temps et d’un lancer franc.'
            }
          ]
        },
        {
          heading: '2.8 Fin de la pénalité',
          body: [
            {
              type: 'paragraph',
              text:
                'La fin d’une pénalité est annoncée par la direction de jeu. Le joueur ne peut revenir sur le terrain qu’après cette autorisation.'
            }
          ]
        },
        {
          heading: '2.9 Lancer franc',
          body: [
            {
              type: 'list',
              items: [
                'Le chronomètre est arrêté ; en principe, deux lancers francs sont accordés.',
                'Le ballon est lancé sans défense depuis la ligne de lancer franc. Coéquipiers et adversaires doivent rester en dehors de la zone de lancer franc. Un lancer franc réussi vaut 1 point.',
                'Après le deuxième lancer franc, le chronomètre repart.'
              ]
            }
          ]
        },
        {
          heading: '2.10 Jeu passif',
          body: [
            {
              type: 'paragraph',
              text:
                'Ne pas poursuivre activement le jeu, c’est-à-dire ne faire aucune tentative de marquer, constitue une infraction. L’arbitre lève alors la main (voir 3.2) et interrompt le jeu après 10 secondes supplémentaires de jeu passif. L’équipe adverse obtient le ballon.'
            }
          ]
        }
      ]
    },
    {
      title: '3. Arbitres',
      subsections: [
        {
          heading: '3.1 Rôle des arbitres et de la direction de jeu',
          body: [
            {
              type: 'paragraph',
              text:
                'Les situations non prévues par le règlement sont tranchées par l’équipe arbitrale et la direction de jeu. Toute décision sur la gravité d’une faute, la durée d’une pénalité ou la validation de points revient à l’équipe arbitrale.'
            },
            {
              type: 'paragraph',
              text: 'Un affrontement loyal et sportif est primordial – en mettant l’accent sur l’intégrité physique de toutes et tous !'
            }
          ]
        },
        {
          heading: '3.2 Signaux des arbitres',
          body: [
            {
              type: 'image',
              src: '/reglement/handsignale.png',
              alt: 'Signaux des arbitres : chrono en marche, chrono arrêté, 1/2/3 points, faute de pédalage, ballon dehors/changement de possession, temps mort, jeu passif, sens de l’attaque',
              caption: 'Aperçu des signaux d’arbitre (légendes en allemand). Sens de l’attaque : après chaque interruption, bras tendu dans le sens d’attaque de l’équipe en possession du ballon.'
            }
          ]
        }
      ]
    }
  ]
};
