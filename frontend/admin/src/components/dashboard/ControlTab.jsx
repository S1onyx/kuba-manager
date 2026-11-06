import { useTranslation } from 'react-i18next';
import DisplaySettingsCard from './control/DisplaySettingsCard.jsx';
import MatchContextCard from './control/MatchContextCard.jsx';
import ScheduleIntegrationCard from './control/ScheduleIntegrationCard.jsx';
import TeamSelectionCard from './control/TeamSelectionCard.jsx';
import ScoreControlCard from './control/ScoreControlCard.jsx';
import TimerControlCard from './control/TimerControlCard.jsx';
import PenaltyManagerCard from './control/PenaltyManagerCard.jsx';

export default function ControlTab() {
  const { t } = useTranslation();
  return (
    <div className="tab-container">
      <DisplaySettingsCard />
      <ScheduleIntegrationCard />
      <TeamSelectionCard />
      <ScoreControlCard />
      <TimerControlCard />
      <PenaltyManagerCard />
      <details className="control-advanced">
        <summary>{t('control.context.advancedToggle')}</summary>
        <MatchContextCard />
      </details>
    </div>
  );
}
