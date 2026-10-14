// Builds an .ics file (iCalendar) from plan blocks so the user can import the schedule.
// Calendar apps (Google, Apple, Outlook) can all import this file.

const toICSDate = (value) =>
  new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const escapeText = (text) =>
  String(text).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

export function buildICS(blocks, now = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Academic Recovery Assistant//EN',
    'CALSCALE:GREGORIAN',
  ];
  blocks.forEach((block) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${block.id}@academic-recovery`,
      `DTSTAMP:${toICSDate(now)}`,
      `DTSTART:${toICSDate(block.start)}`,
      `DTEND:${toICSDate(block.end)}`,
      `SUMMARY:${escapeText(`Focus: ${block.title}`)}`,
      `DESCRIPTION:${escapeText(`${block.subject} - ${block.minutes} min focus block`)}`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadTextFile(filename, content, type = 'text/calendar') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
