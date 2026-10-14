// One scheduled focus block in the AI Recovery Plan timeline.
import Icon from '../icons/Icon.jsx';
import Chip from '../common/Chip.jsx';
import { formatDeadline, formatTime } from '../../utils/dates.js';
import { PRIORITY_LABELS } from '../../utils/taskUtils.js';

const PRIORITY_TONE = { high: 'danger', medium: 'accent', low: 'neutral' };

export default function PlanBlock({ block, onComplete }) {
  return (
    <article className="plan-block">
      <div className="plan-block__main">
        <div className="plan-block__chips">
          <Chip tone="primary">
            {formatTime(block.start)} – {formatTime(block.end)} · {block.minutes}m
          </Chip>
          <Chip tone="accent">{block.subject}</Chip>
          <Chip tone={PRIORITY_TONE[block.priority]}>{PRIORITY_LABELS[block.priority]} priority</Chip>
          {block.overdue && <Chip tone="danger">Overdue</Chip>}
        </div>
        <h3 className="plan-block__title">{block.title}</h3>
        <p className="plan-block__note">
          <Icon name="sparkles" size={13} />
          {block.overdue ? 'Scheduled first because this task is already overdue.' : `Due ${formatDeadline(block.deadline)}`}
        </p>
      </div>
      <button type="button" className="btn btn--secondary btn--small" onClick={() => onComplete(block.taskId)}>
        <Icon name="check" size={14} /> Mark as Completed
      </button>
    </article>
  );
}
