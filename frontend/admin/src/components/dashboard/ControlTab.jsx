import DisplaySettingsCard from './control/DisplaySettingsCard.jsx';
import MatchContextCard from './control/MatchContextCard.jsx';
import ScheduleIntegrationCard from './control/ScheduleIntegrationCard.jsx';
import SchedulePlannerCard from './control/SchedulePlannerCard.jsx';
import TeamSelectionCard from './control/TeamSelectionCard.jsx';
import ScoreControlCard from './control/ScoreControlCard.jsx';
import TimerControlCard from './control/TimerControlCard.jsx';
import PenaltyManagerCard from './control/PenaltyManagerCard.jsx';

export default function ControlTab() {
  return (
    <div style={{ display: 'grid', gap: '1.75rem' }}>
      <DisplaySettingsCard />
      <MatchContextCard />
      <ScheduleIntegrationCard />
      <SchedulePlannerCard />
      <TeamSelectionCard />
      <ScoreControlCard />
      <TimerControlCard />
      <PenaltyManagerCard />
    </div>
  );
}
