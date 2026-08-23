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
                'Kunstrad Basketball is played on artistic cycling bikes in the head-tube standing position, with two teams of four players each. The objective is to score baskets and prevent the opponents from scoring. Referees and the match management supervise the game; the team with the most points when playing time expires wins.'
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
                'A maximum of four players per team may be on the court at the same time. Too many players on the court is penalised with a 2-minute time penalty.',
                'Player substitutions are made on the fly and exclusively via the team’s own coaching zone.'
              ]
            }
          ]
        },
        {
          heading: '1.3 Riding Position',
          body: [
            {
              type: 'list',
              items: [
                'The entire game is played in the head-tube standing position on an artistic cycling or cycle-ball bike in accordance with UCI regulations; the position is assumed in the coaching zone.',
                'When dismounting, serving a time penalty or in similar situations, the court must be left immediately and may only be re-entered from the coaching zone in the head-tube standing position.'
              ]
            }
          ]
        },
        {
          heading: '1.4 Court & Scoring',
          body: [
            {
              type: 'list',
              items: [
                'Each team has its own coaching zone where substitute players remain.',
                'After a successful basket, the conceding team restarts with a throw-in from its own baseline.',
                {
                  text: 'Scoring corresponds to basketball:',
                  subItems: ['1 point – free throw', '2 points – field goal', '3 points – shot from behind the three-point line']
                }
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
          heading: '2.1 Duration, Start & End',
          body: [
            {
              type: 'list',
              items: [
                'Playing time: 2×5 minutes with a 1-minute half-time break; the clock runs without interruption.',
                'Before the start, a random procedure (e.g. a coin toss) decides which team gets possession of the ball.',
                'The opening play takes place in the team’s own half; both teams start in their own half and the game begins with the referee’s whistle.',
                'The match management keeps the time and signals the end with a whistle.'
              ]
            }
          ]
        },
        {
          heading: '2.2 Playing the Ball',
          body: [
            {
              type: 'list',
              items: [
                'With the ball in hand, a maximum of three pedal revolutions is allowed.',
                'After three pedal revolutions at the latest, the ball must be dribbled or passed. Double dribbling – picking up the ball and dribbling again – is prohibited.',
                'If more than three pedal revolutions are made without passing or dribbling, possession changes to the opposing team.',
                'If a team cannot pick up the ball without leaving the head-tube standing position, the opposing team gains possession; the referee lifts the ball so that the opposing team can take it over.',
                'If the ball leaves the court, the opposing team likewise receives the ball at that spot, released by the referee.'
              ]
            }
          ]
        },
        {
          heading: '2.3 Tournament Format',
          body: [
            {
              type: 'list',
              items: [
                'The preliminary round is played in one or more groups.',
                'Points: win 3 points, draw 1 point, loss 0 points.',
                'The final round is played in knockout mode. If the score is tied after regular playing time, extra time of half the regular playing time follows.',
                'If it is still tied after that, a free-throw shootout takes place: both teams alternately shoot five times from behind the three-point line – every player must shoot at least once. If there is still no winner, the procedure is repeated until one team wins.'
              ]
            }
          ]
        }
      ]
    },
    {
      title: '3. Offences & Fouls',
      subsections: [
        {
          heading: '3.1 Leaving the Head-Tube Standing Position',
          body: [
            {
              type: 'paragraph',
              text:
                'Anyone who leaves the head-tube standing position or falls must immediately ride to the nearest outer marker, leave the court and re-enter from their own coaching zone after resuming the position. The course of play must not be impaired in the process.'
            }
          ]
        },
        {
          heading: '3.2 Technical Foul, Contact & Illegal Blocking',
          body: [
            {
              type: 'list',
              items: [
                'This includes, among other things, pushing players off their bikes, illegal blocking at high speed, deliberately riding into an opponent or cutting them off (swerving in front of a moving player without braking distance).',
                'Unavoidable body contact with no influence on the course of play is not considered a foul.',
                'In the event of collisions, the referee decides who is at fault; if unclear, both players receive a time penalty.',
                {
                  text: 'Time penalty catalogue:',
                  subItems: ['Minor foul: 1 minute', 'Severe foul: 2 minutes', 'Unsportsmanlike or dangerous foul: ejection from the game']
                },
                'The assessment of the severity of a foul rests solely with the referee.',
                {
                  text: 'Repeated offences may be penalised more severely:',
                  subItems: [
                    'Longer time penalty for repeated minor fouls',
                    'Ejection from the game for repeated severe fouls',
                    'Exclusion of players or the team from the tournament following ejection(s)'
                  ]
                },
                'The game is interrupted and resumed with possession for the opposing team, unless the fouled player retains the advantage and can continue attacking.'
              ]
            }
          ]
        },
        {
          heading: '3.3 Foul in the Three-Point Zone',
          body: [
            {
              type: 'paragraph',
              text: 'In addition to the time penalty, the fouled team is awarded a free throw.'
            }
          ]
        },
        {
          heading: '3.4 End of the Time Penalty',
          body: [
            {
              type: 'paragraph',
              text:
                'The match management signals the end of the penalty; only after this release may the player re-enter the court.'
            }
          ]
        },
        {
          heading: '3.5 Free Throw',
          body: [
            {
              type: 'list',
              items: [
                'Free throws are taken from behind the three-point line.',
                'The shooting player has three pedal revolutions to take the free throw.',
                'Opposing players must remain outside the three-point zone during the free throw.',
                'If the free throw scores, the opposing team puts the ball in play from the baseline.'
              ]
            }
          ]
        },
        {
          heading: '3.6 Stalling',
          body: [
            {
              type: 'paragraph',
              text:
                'Passive play without an attempt to score is considered a rule violation. The referee raises a hand, interrupts the game if necessary and awards possession to the other team.'
            }
          ]
        }
      ]
    },
    {
      title: '4. Role of the Referees & Match Management',
      subsections: [
        {
          heading: '4.1 Responsibilities',
          body: [
            {
              type: 'paragraph',
              text:
                'Situations not expressly covered by these rules are decided by the refereeing team and the match management. They also determine the severity of fouls, the length of time penalties and the awarding of points. Fairness, sporting competition and the health of all participants take precedence.'
            }
          ]
        }
      ]
    }
  ]
};
