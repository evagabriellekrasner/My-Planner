// Runs on GitHub every 10 minutes: finds reminders that are due and sends them to each person's devices.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import webpush from 'web-push';
import { localNow, dueReminders } from './reminders-core.mjs';

const sa = process.env.FIREBASE_SERVICE_ACCOUNT, vapidPrivate = process.env.VAPID_PRIVATE_KEY;
if (!sa || !vapidPrivate) { console.log('Missing FIREBASE_SERVICE_ACCOUNT or VAPID_PRIVATE_KEY secret, nothing sent.'); process.exit(0); }

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
webpush.setVapidDetails('https://evagabriellekrasner.github.io/My-Planner/', VAPID_PUBLIC, vapidPrivate);

const app = initializeApp({ credential: cert(JSON.parse(sa)) });
const db = getFirestore(app, process.env.FIRESTORE_DB || 'default');

const snap = await db.collection('planners').get();
let sent = 0, people = 0;
for (const doc of snap.docs) {
  const f = doc.data();
  if (!f.push) continue;
  let push, planner;
  try { push = JSON.parse(f.push); planner = JSON.parse(f.json || '{}'); } catch { continue; }
  if (!push.subs || !push.subs.length || planner.deleted) continue;
  const due = dueReminders(planner, localNow(push.tz));
  const already = new Set(f.sent || []);
  const fresh = due.filter(r => !already.has(r.tag));
  if (!fresh.length) continue;
  people++;
  const dead = new Set();
  for (const r of fresh) {
    for (const sub of push.subs) {
      const icon = `icons/${(planner.prefs && planner.prefs.icon) || 'a'}-${planner.theme || 'berry'}-192.png`;
      try { await webpush.sendNotification(sub, JSON.stringify({ ...r, icon }), { TTL: 3600 }); sent++; }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) dead.add(sub.endpoint); else console.log('send failed', e.statusCode || e.message); }
    }
    already.add(r.tag);
  }
  const update = { sent: [...already].slice(-300) };
  if (dead.size) { push.subs = push.subs.filter(s => !dead.has(s.endpoint)); update.push = JSON.stringify(push); }
  await doc.ref.update(update);
}
console.log(`Checked ${snap.size} planners, sent ${sent} notifications to ${people} people.`);
