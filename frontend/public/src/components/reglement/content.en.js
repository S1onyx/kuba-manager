export default {
  hero: {
    title: 'Kunstrad Basketball Rulebook',
    subtitle:
      'Official rules of Kunstrad Basketball: court, gameplay, fouls and the responsibilities of the match officials.',
    footnote:
      'This document serves as a guide for tournament organisers, teams and officials. It complements the live dashboard so that everyone involved shares the same basis.'
  },
  sections: [
    {
      title: '1. General',
      subsections: [
        {
          heading: '1.1 Introduction',
          body: [
            {
              type: 'paragraph',
              text:
                'Kunstrad Basketball is played on artistic cycling bikes in the head-tube standing position, with two teams of four players each. Each team aims to throw the ball into the opposing basket and to prevent the other team from doing so.'
            },
            {
              type: 'paragraph',
              text:
                'The game is supervised by two referees and the match management. Each basket scored is worth a certain number of points. The team with the most points when playing time expires wins.'
            }
          ]
        },
        {
          heading: '1.2 Team',
          body: [
            {
              type: 'list',
              items: [
                'A team consists of a maximum of five players.',
                'A maximum of four players per team are on the court and actively take part in the game.',
                'Substitutions take place during the game without the referee’s approval and may only be made across the end line of the coaching zone. Teams must make sure that no more than four players are on the court at any time. A violation is punished with a 2-minute time penalty for one player; the team continues with one player fewer.'
              ]
            }
          ]
        },
        {
          heading: '1.3 Riding position',
          body: [
            {
              type: 'list',
              items: [
                'The entire game is played in the head-tube standing position on an artistic cycling bike or cycle-ball bike in accordance with UCI rules – this position is taken up in the coaching zone.',
                'After dismounting, a time penalty or similar, the player must leave the court immediately and may only re-enter it from the coaching zone in the head-tube standing position.'
              ]
            }
          ]
        },
        {
          heading: '1.4 Court & scoring',
          body: [
            {
              type: 'list',
              items: [
                'Each team has its own coaching zone where substitutes must stay.',
                {
                  text: 'Scoring is the same as in basketball:',
                  subItems: ['1 point – free throw', '2 points – regular field shot', '3 points – shot from behind the three-point line']
                }
              ]
            },
            {
              type: 'image',
              src: '/reglement/spielfeld.png',
              alt: 'Court with free-throw zones, three-point lines and coaching zones',
              caption: 'Court – the free-throw zone is shaded dark grey.'
            },
            {
              type: 'list',
              items: [
                'The free-throw zone is shaded dark grey.',
                'After a successful basket, possession changes; the team restarts from the baseline.'
              ]
            }
          ]
        }
      ]
    },
    {
      title: '2. Course of Play',
      subsections: [
        {
          heading: '2.1 Duration, start & end',
          body: [
            {
              type: 'list',
              items: [
                '2 × 5 minutes with change of ends – 1-minute half-time break.',
                'The clock generally keeps running. It is only stopped by a referee’s whistle and the corresponding hand signal (see 3.2). Reasons may include a warning, a foul, the ball leaving the court or other reasons at the referees’ discretion.',
                {
                  text: 'In knockout games, chance (the referee’s coin toss) decides which team kicks off. In group games, the team named first starts.',
                  subItems: [
                    'The kick-off takes place in the team’s own half at the baseline; each team starts in its own half.',
                    'The game is started by the referee’s whistle and the signal tone.'
                  ]
                },
                'Playing time is monitored by the match management; the end of the game is signalled by a whistle and the signal tone.'
              ]
            }
          ]
        },
        {
          heading: '2.2 Ball handling',
          body: [
            {
              type: 'list',
              items: [
                'With the ball in hand, a player may ride a maximum of three pedal revolutions.',
                {
                  text: 'After at most three pedal revolutions, the ball must be bounced or passed.',
                  subItems: [
                    'Double dribbling is not allowed: once the ball has been picked up a second time, bouncing again does not allow more than three further pedal revolutions – after the second pick-up the ball must be passed or shot.',
                    'A violation results in possession for the opposing team.'
                  ]
                },
                {
                  text: 'If the ball lands on the floor and cannot be picked up without leaving the head-tube standing position, the opposing team gets the ball.',
                  subItems: ['The referee lifts the ball into the air at that spot; it must be taken by the opposing team.']
                },
                {
                  text: 'If the ball leaves the court, the opposing team gets the ball at that spot.',
                  subItems: ['The referee lifts the ball into the air at the sideline at that spot; it must be taken by the opposing team.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.3 Tournament format',
          body: [
            {
              type: 'list',
              items: [
                'In the preliminary round, teams play against each other in one or more groups.',
                'Win: 3 points, draw: 1 point, loss: 0 points.',
                {
                  text: 'From the final round onwards, games are played in knockout format.',
                  subItems: [
                    'If the score is tied when time expires, there is an extra period of half the playing time (5 minutes).',
                    'If it is still tied after extra time, both teams take five free throws each – every player must shoot at least once.',
                    'If there is still no winner, each team takes one further throw at a time until one team wins – throws alternate.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.4 Free-throw zone',
          body: [
            {
              type: 'list',
              items: [
                'A player may stay in either their own or the opposing free-throw zone for at most three pendulum movements on the spot (track stand). After that, the free-throw zone must be left immediately.',
                {
                  text: 'Penalties:',
                  subItems: [
                    'If a violation in the team’s own free-throw zone (defence) hinders an opposing attack, the opposing team is awarded two free throws.',
                    'For a violation in the opposing free-throw zone (attack), the attack is whistled dead and the opposing team gets the ball.'
                  ]
                }
              ]
            }
          ]
        },
        {
          heading: '2.5 Leaving the head-tube standing position',
          body: [
            {
              type: 'paragraph',
              text:
                'If a player leaves the head-tube standing position or falls to the floor, they must leave the court immediately towards the nearest outer marking without affecting play. After taking up the head-tube standing position again in their own coaching zone, they may re-enter the court from there and continue playing.'
            }
          ]
        },
        {
          heading: '2.6 Technical foul, contact & illegal blocking',
          body: [
            {
              type: 'list',
              items: [
                {
                  text: 'This includes, for example, pushing an opponent off, illegal blocking at high speed, deliberately riding into an opponent or cutting off their path. Light, unavoidable body or bike contact is allowed.',
                  subItems: [
                    {
                      text: 'Legal blocking',
                      subItems: ['Robust positional play wheel to wheel is allowed. What matters is the direction of contact: pressure alongside the opponent while riding in parallel is allowed.']
                    },
                    {
                      text: 'Illegal blocking',
                      subItems: [
                        'It is illegal to ride across an opponent’s line or to cut them off directly in front of them – especially when cutting in from a steep angle (~90°) so that they have to brake or swerve abruptly or can no longer avoid contact. Actively steering or accelerating into the opponent or their bike is also prohibited.'
                      ]
                    }
                  ]
                },
                {
                  text: 'Time penalties for fouls:',
                  subItems: [
                    'Light foul: possession for the opponent, no time penalty',
                    'Moderate foul: possession for the opponent, 1-minute time penalty',
                    'Severe foul: possession for the opponent, 2-minute time penalty',
                    'Grossly unsporting behaviour or a foul endangering health: possession for the opponent, ejection from the game',
                    'During a time penalty, the penalised team plays short-handed. Nobody may be substituted in for the penalised player.',
                    'The severity of a foul is decided by the referee.'
                  ]
                },
                {
                  text: 'Repeated offences:',
                  subItems: [
                    'Repeated light offences may lead to a longer time penalty.',
                    'Repeated severe offences may lead to ejection from the game.',
                    'A single or repeated ejection may lead to individual players or the whole team being excluded from the tournament.'
                  ]
                },
                {
                  text: 'Advantage rule:',
                  subItems: ['If the fouled player can still continue their move, play is not interrupted.']
                }
              ]
            }
          ]
        },
        {
          heading: '2.7 Foul in the free-throw zone',
          body: [
            {
              type: 'paragraph',
              text: 'A foul in the free-throw zone is punished with a time penalty and a free throw.'
            }
          ]
        },
        {
          heading: '2.8 End of a time penalty',
          body: [
            {
              type: 'paragraph',
              text:
                'The end of a time penalty is announced by the match management. The player may only re-enter the court after this release.'
            }
          ]
        },
        {
          heading: '2.9 Free throw',
          body: [
            {
              type: 'list',
              items: [
                'The clock is stopped; as a rule, two free throws are awarded.',
                'The ball is thrown undefended from the free-throw line. Teammates and opponents must stay outside the free-throw area. A successful free throw is worth 1 point.',
                'After the second free throw, the clock runs again.'
              ]
            }
          ]
        },
        {
          heading: '2.10 Time wasting',
          body: [
            {
              type: 'paragraph',
              text:
                'Not actively pursuing the game – i.e. making no attempt to score – is a violation. The referee raises a hand (see 3.2) and stops play after a further 10 seconds of passive play. The opposing team gets the ball.'
            }
          ]
        }
      ]
    },
    {
      title: '3. Referees',
      subsections: [
        {
          heading: '3.1 Role of the referees and match management',
          body: [
            {
              type: 'paragraph',
              text:
                'Situations not covered by these rules are handled by the referee team and the match management. All decisions on the severity of a foul, the length of a time penalty or whether points are awarded lie with the referee team.'
            },
            {
              type: 'paragraph',
              text: 'Fair and sporting competition is paramount – with a focus on the physical well-being of all participants!'
            }
          ]
        },
        {
          heading: '3.2 Referee hand signals',
          body: [
            {
              type: 'image',
              src: '/reglement/handsignale.png',
              alt: 'Referee signals: clock runs, clock stop, 1/2/3 points, pedal fault, ball out/change of possession, time-out, time wasting, direction of attack',
              caption: 'Overview of referee signals (labels in German). Direction of attack: after every interruption, arm stretched out in the attacking direction of the team in possession.'
            }
          ]
        }
      ]
    }
  ]
};
