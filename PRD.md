# My Planner: Product Requirements

This document describes the product as it exists today, based on the code. Goals and audience are inferred from the app, so the product owner should confirm them. Status: current as of November 2026.

## Summary

My Planner is a free web app that helps students keep track of classes, homework, tests and activities, and turns them into a daily to-do list. It installs on a phone like a regular app, sends reminders, and works from any device with a name and a 4-number passcode.

## Problem

Students get assignments from many teachers, often in PDFs and weekly plans, on school schedules that rotate rather than follow the weekday. They need to know what to do today, not just what's due eventually, and need help breaking a test into daily studying.

## Users

**Primary:** middle and high school students, including those on A/B or rotating schedules. This is inferred from the app's examples and wording.

Parents and teachers have no role in the app today.

## Goals

- Answer "what do I need to do today?" as soon as the app opens.
- Make entering homework quick, including importing it from a document.
- Handle real school calendars, including rotating days and days off.
- Remind students even when the app is closed.
- Stay simple enough to start with no account setup or instructions.

## Features

### Getting in
- Log in or create a planner with a name and 4-number passcode, from any device.
- The device stays logged in. New users are prompted to add their classes first.

### Today
- Generated list for any day, chosen from a 7-day strip or date picker.
- Shows the day's school label, classes and events.
- Grouped order: tests and quizzes due within 3 days plus study tasks, then homework colored by urgency, then other to-dos.
- Missed study tasks carry forward.
- Personal to-dos can be added, starred and deleted. Checking anything off offers a 6-second Undo.

### Classes and homework
- Classes have a name, teacher or room details, and a color (10 shades or custom).
- Quick add takes the item, class, type and due date, with shortcuts such as Next class, Tomorrow and Next week.
- Types: homework, test, quiz, project, reading, other.
- List view (7 days, 30 days, everything, past due) or calendar view.

### Import
- Takes a text-based PDF of up to 150 pages, or pasted text. Scanned documents aren't read.
- Finds tables, labels, "Week of" headings and due dates written in the text.
- Tells homework apart from class work and skips repeats and "No class" rows.
- Everything is checked on a review screen before saving. If nothing is found, a fix-it screen shows the extracted text.

### Calendar and activities
- Six-week grid showing homework, events and study tasks, with details for each day.
- Event kinds include sport, practice, game, lesson, appointment, concert, club, work, birthday and reminder.
- Events have a time, place, notes and reminder, and can repeat through an end date. Single days can be skipped.
- Export through a Google Calendar link per event or a calendar (`.ics`) file.

### School schedule
- Day labels with a color and that day's classes, with presets: A/B, Gold/Blue, Anchor/rotation.
- Labels can take turns, follow the weekday, or be tapped or painted onto days.
- Labels appear on the Calendar and Today, and set "Next class" due dates.
- Any day can be marked "No school". Rotations either pick up where they left off or keep the rest of the week the same. Includes a US holiday checklist.

### Study plans
- Pick or create a test, choose 1 to 30 days, and list what to study.
- The app spreads the work across days, splitting things like "8 page study guide", and fills empty days with review.
- Plans show progress, and their tasks appear on Today.

### Reminders
- Works when the app is closed, once installed and notifications are allowed.
- Morning summary at a chosen time, and event reminders.
- On iPhone, the app must be added to the Home Screen first.

### Personalization and settings
- 5 color themes, light, dark or match device, 4 app icons, planner name, and the page to open first.
- Save and load a backup file, change passcode, log out.

## How it works

| Part | Technology |
|---|---|
| App | One static HTML file with vanilla JS, installable as a PWA |
| Data | Firestore through its REST API, one document per planner |
| Reminders | GitHub Actions every 10 minutes, sent with web push |
| PDF reading | pdf.js, loaded on demand; the PDF is processed on the device |
| Fonts | Google Fonts |

See `CLAUDE.md` for developer details.

## Out of scope today

- Sharing, or parent and teacher views
- Connecting to school systems such as Google Classroom or Canvas
- Offline use
- Reading scanned documents
- Native app store apps

## Known risks and gaps

| Area | Issue | Impact |
|---|---|---|
| Security | A name and 4-digit passcode are the only protection, with no real accounts. Firestore rules aren't in the repo and need review. | **High.** Users are likely minors, and planners can hold their name, school details and places they'll be. |
| Privacy | Planner data is stored as readable text in the cloud, and there's no privacy policy. If under-13s use it, children's privacy rules may apply. | **High.** Needs a decision and possibly legal advice. |
| Data loss | With several devices open, the last save wins, so an old tab can overwrite newer work. | Medium |
| Data loss | An edit made in the last 300ms before closing the page may not save. | Low |
| Reliability | No offline mode. If the cloud can't be reached at startup, the user lands back at login. School Wi-Fi can block it. | Medium |
| Reliability | Reminders depend on scheduled GitHub Actions, which can run late or be disabled after long repo inactivity. Missing secrets fail silently. | Medium |
| Reminders | Turning notifications off appears to stop them on all of a person's devices, though the wording says "on this device". | Low |
| Schedule | Holiday selections hold dates for one school year and may look set the next year without applying. | Low |
| Maintenance | No tests, duplicated reminder logic in two places, and leftover code from an earlier platform. | Medium |

## Suggested next steps

1. Review the Firestore rules and replace or strengthen passcode login.
2. Decide on the audience and add a privacy policy.
3. Prevent old tabs from overwriting newer data, and save on page close.
4. Show saved data when offline.
5. Add tests for the schedule, import and reminder logic.
6. Remove the leftover code.

## Open questions

- Is this for one student and friends, or for anyone publicly?
- Is there a minimum age?
- Should parents or teachers ever have access?
- How many people use it today? The repo doesn't show this.
