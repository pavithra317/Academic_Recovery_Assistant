// One row in the task list. Complete/reopen, start, edit, and delete actions.
import Icon from '../icons/Icon.jsx';
import Chip from '../common/Chip.jsx';
import { formatDeadline, relativeDue } from '../../utils/dates.js';
import { formatDuration } from '../../utils/format.js';
import { PRIORITY_LABELS, STATUS_LABELS, isOpen, isOverdue } from '../../utils/taskUtils.js';

const PRIORITY_TONE = { high: 'danger', medium: 'accent', low: 'neutral' };
const STATUS_TONE = { pending: 'neutral', 'in-progress': 'primary', completed: 'success' };

export default function TaskItem({ task, now, onEdit, onDelete, onStatusChange }) {
  const done = !isOpen(task);
  const overdue = isOverdue(task, now);

  return (
    <li className={`task-item ${done ? 'task-item--done' : ''}`}>
      <button
        type="button"
        className={`task-check ${done ? 'is-done' : ''}`}
        onClick={() => onStatusChange(task.id, done ? 'pending' : 'completed')}
        aria-label={done ? `Reopen ${task.title}` : `Mark ${task.title} as completed`}
      >
        {done && <Icon name="check" size={14} />}
      </button>

      <div className="task-item__body">
        <h3 className="task-item__title">{task.title}</h3>
        <p className="task-item__meta">
          {task.subject} · Due {formatDeadline(task.deadline)} · {formatDuration(task.estimatedMinutes)}
        </p>
        {task.description && <p className="task-item__desc">{task.description}</p>}
        <div className="task-item__chips">
          <Chip tone={PRIORITY_TONE[task.priority]}>{PRIORITY_LABELS[task.priority]} priority</Chip>
          <Chip tone={STATUS_TONE[task.status]}>{STATUS_LABELS[task.status]}</Chip>
          {overdue && <Chip tone="danger">{relativeDue(task.deadline, now)}</Chip>}
        </div>
      </div>

      <div className="task-item__actions">
        {!done && task.status === 'pending' && (
          <button className="btn btn--ghost btn--small" type="button" onClick={() => onStatusChange(task.id, 'in-progress')}>
            <Icon name="play" size={14} /> Start
          </button>
        )}
        {!done && (
          <button className="btn btn--secondary btn--small" type="button" onClick={() => onStatusChange(task.id, 'completed')}>
            <Icon name="check" size={14} /> Complete
          </button>
        )}
        <button className="icon-btn" type="button" aria-label={`Edit ${task.title}`} onClick={() => onEdit(task)}>
          <Icon name="edit" size={16} />
        </button>
        <button className="icon-btn icon-btn--danger" type="button" aria-label={`Delete ${task.title}`} onClick={() => onDelete(task)}>
          <Icon name="trash" size={16} />
        </button>
      </div>
    </li>
  );
}
