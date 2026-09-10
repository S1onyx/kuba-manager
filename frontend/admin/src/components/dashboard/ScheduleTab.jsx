import MatchContextCard from './control/MatchContextCard.jsx';
import ScheduleBulkActionsCard from './schedule/ScheduleBulkActionsCard.jsx';
import SchedulePlannerCard from './control/SchedulePlannerCard.jsx';

export default function ScheduleTab() {
  return (
    <div className="tab-container">
      <MatchContextCard />
      <ScheduleBulkActionsCard />
      <SchedulePlannerCard />
    </div>
  );
}
