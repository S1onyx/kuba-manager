import DisplaySettingsCard from './control/DisplaySettingsCard.jsx';
import GameSaveBanner from './control/GameSaveBanner.jsx';
import ScheduleIntegrationCard from './control/ScheduleIntegrationCard.jsx';
import TeamSelectionCard from './control/TeamSelectionCard.jsx';
import ScoreControlCard from './control/ScoreControlCard.jsx';
import OvertimeCard from './control/OvertimeCard.jsx';
import ShootoutCard from './control/ShootoutCard.jsx';
import FreeThrowCard from './control/FreeThrowCard.jsx';
import TimerControlCard from './control/TimerControlCard.jsx';
import PenaltyManagerCard from './control/PenaltyManagerCard.jsx';

export default function ControlTab() {
  return (
    <div className="tab-container">
      <GameSaveBanner />
      <OvertimeCard />
      <ShootoutCard />
      <DisplaySettingsCard />
      <ScheduleIntegrationCard />
      <TeamSelectionCard />
      <ScoreControlCard />
      <FreeThrowCard />
      <TimerControlCard />
      <PenaltyManagerCard />
    </div>
  );
}
