// Seven-day bar chart of completed study minutes. Tap a bar to see its details.
import { formatHours } from '../../utils/format.js';
import { weekdayLetter } from '../../utils/dates.js';

export default function WeeklyChart({ daily, baselineHours, selectedIndex, onSelect }) {
  const height = 144;
  const hours = daily.map((d) => d.minutes / 60);
  const max = Math.max(4, baselineHours * 1.5, ...hours);
  const baselineBottom = (baselineHours / max) * height;

  return (
    <div className="weekly-chart">
      <div className="weekly-chart__area" style={{ height }}>
        <div className="weekly-chart__baseline" style={{ bottom: baselineBottom }}>
          <span>Target: {baselineHours} hrs</span>
        </div>
        {daily.map((day, index) => {
          const value = hours[index];
          const barHeight = value > 0 ? Math.max(6, (value / max) * height) : 4;
          const tone = value === 0 ? 'empty' : value > baselineHours ? 'over' : 'ontrack';
          const isToday = index === daily.length - 1;
          const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
          return (
            <button
              key={day.key}
              type="button"
              className={`weekly-chart__col ${selectedIndex === index ? 'is-selected' : ''}`}
              onClick={() => onSelect(index)}
              aria-pressed={selectedIndex === index}
              aria-label={`${dayName}: ${formatHours(day.minutes)} hours`}
            >
              <span className="weekly-chart__value">{formatHours(day.minutes)}h</span>
              <span
                className={`weekly-chart__bar weekly-chart__bar--${tone} ${isToday ? 'is-today' : ''}`}
                style={{ height: barHeight }}
              />
              <span className="weekly-chart__label">{isToday ? 'Today' : weekdayLetter(day.date)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
