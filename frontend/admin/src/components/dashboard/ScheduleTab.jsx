import MatchContextCard from './control/MatchContextCard.jsx';
import ScheduleBulkActionsCard from './schedule/ScheduleBulkActionsCard.jsx';
import SchedulePlannerCard from './control/SchedulePlannerCard.jsx';

export default function ScheduleTab() {
  return (
    <div style={{ display: 'grid', gap: '1.75rem' }}>
      <MatchContextCard />
      <ScheduleBulkActionsCard />
      <SchedulePlannerCard />
    </div>
  );
}
