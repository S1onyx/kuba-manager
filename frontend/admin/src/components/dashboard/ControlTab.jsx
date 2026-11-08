import DisplaySettingsCard from './control/DisplaySettingsCard.jsx';
import ScheduleIntegrationCard from './control/ScheduleIntegrationCard.jsx';
import TeamSelectionCard from './control/TeamSelectionCard.jsx';
import ScoreControlCard from './control/ScoreControlCard.jsx';
import ShootoutCard from './control/ShootoutCard.jsx';
import TimerControlCard from './control/TimerControlCard.jsx';
import PenaltyManagerCard from './control/PenaltyManagerCard.jsx';

export default function ControlTab() {
  return (
    <div className="tab-container">
      <ShootoutCard />
      <DisplaySettingsCard />
      <ScheduleIntegrationCard />
      <TeamSelectionCard />
      <ScoreControlCard />
      <TimerControlCard />
      <PenaltyManagerCard />
    </div>
  );
}
