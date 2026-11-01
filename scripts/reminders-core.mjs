// Works out which reminders are due for one planner right now. No network here, so it can be tested on its own.
const pad = n => String(n).padStart(2, '0');
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const iso = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (s, n) => { const d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const between = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmtTime = t => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };

// the planner owner's local date and minutes past midnight
export function localNow(tz, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz || 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, mins: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function eventsOn(events, ds) {
  const out = [];
  for (const ev of events || []) {
    let hit = ev.date === ds;
    if (!hit && ev.repeat && ev.repeat !== 'none' && ds > ev.date && (!ev.until || ds <= ev.until)) {
      const gap = between(ev.date, ds), dow = parse(ds).getUTCDay();
      if (ev.repeat === 'weekly') hit = gap % 7 === 0;
      else if (ev.repeat === 'daily') hit = true;
      else if (ev.repeat === 'weekdays') hit = dow !== 0 && dow !== 6;
      else if (ev.repeat === 'yearly') hit = ev.date.slice(5) === ds.slice(5);
    }
    if (hit && !(ev.doneOn || []).includes(ds)) out.push(ev);
  }
  return out.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
}

const WINDOW = 60; // minutes late a reminder may still go out (the service runs every ~10 min)

export function dueReminders(planner, now) {
  const prefs = planner.prefs || {};
  if (!prefs.notifyOn) return [];
  const classes = new Map((planner.classes || []).map(c => [c.id, c]));
  const out = [];
  const t = now.date, tomorrow = addDays(t, 1);

  for (const [ds, offset] of [[t, 0], [tomorrow, 1440]]) {
    for (const ev of eventsOn(planner.events, ds)) {
      if (ev.remind === '' || ev.remind == null) continue;
      const at = (ev.time ? toMin(ev.time) : 8 * 60) - Number(ev.remind) + offset;
      if (now.mins >= at && now.mins < at + WINDOW) {
        out.push({ tag: `ev:${ev.id}:${ds}`, title: ev.title, page: 'calendar',
          body: `${ds === t ? 'Today' : 'Tomorrow'}${ev.time ? ' at ' + fmtTime(ev.time) : ''}${ev.place ? ' · ' + ev.place : ''}` });
      }
    }
  }

  if (prefs.daily) {
    const at = toMin(prefs.daily);
    if (now.mins >= at && now.mins < at + WINDOW) {
      const open = (planner.items || []).filter(i => classes.has(i.classId) && !i.done);
      const late = open.filter(i => i.due < t), today = open.filter(i => i.due === t), tmw = open.filter(i => i.due === tomorrow);
      const tests = open.filter(i => (i.type === 'test' || i.type === 'quiz') && i.due >= t && between(t, i.due) <= 2);
      const study = (planner.plans || []).flatMap(p => (p.sessions || []).filter(s => s.date === t).flatMap(s => s.tasks.filter(k => !k.done)));
      const todos = (planner.todos || []).filter(x => x.date === t && !x.done);
      const evs = eventsOn(planner.events, t);
      const bits = [];
      if (late.length) bits.push(`${late.length} past due`);
      if (today.length) bits.push(`${today.length} due today`);
      if (tmw.length) bits.push(`${tmw.length} due tomorrow`);
      if (tests.length) bits.push(`${tests.map(i => i.title).slice(0, 2).join(', ')} coming up`);
      if (study.length) bits.push(`${study.length} study task${study.length === 1 ? '' : 's'}`);
      if (todos.length) bits.push(`${todos.length} to-do${todos.length === 1 ? '' : 's'}`);
      if (evs.length) bits.push(`${evs.length} event${evs.length === 1 ? '' : 's'}: ${evs.slice(0, 2).map(e => e.title).join(', ')}`);
      if (bits.length) out.push({ tag: `daily:${t}`, title: 'Your day in My Planner', body: bits.join(' · '), page: 'today' });
    }
  }
  return out;
}
