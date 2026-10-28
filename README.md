# Sarkari Saathi — Complete Functional Demo

Sarkari Saathi is a React + Vite application for visually navigating complicated real-world processes.

## Scope implemented
- Home / landing page with hero, search examples, categories and Living Abroad mode.
- Explore page with search and category filters.
- Five built-in demo journeys:
  1. Government Document Application
  2. Hospital Visit Journey
  3. College Admission Journey
  4. Bank Account Opening
  5. Driving Licence Journey
- Journey detail view with START → steps → DONE timeline.
- Step inspector with:
  - What happens
  - What I need
  - What happens next
  - Where to go
  - Responsible organization / department
  - Possible fee
  - Estimated time
  - Common problems
  - Official source
  - Last verified / verification status context
- Document checklists with localStorage and progress.
- Decision branches with a visual yes/no split.
- Living Abroad mode and “Plan Before You Travel” information prompts.
- My Journey Plan with multiple saved journey tasks and example India Visit administrative tasks.
- Journey Builder with unlimited steps and optional decision branches.
- Admin Dashboard with journey management, create/edit/delete for user-created journeys, request review, verification/source workflow and last-verified fields.
- Official-information data model fields:
  organizationName, department, officialWebsite, sourceUrl, verificationStatus, lastVerified, location.
- Responsive layout for desktop and mobile.
- No paid APIs and no AI API required.

## Data safety / demo labeling
The app does not claim official integration with any government, hospital, bank, school, transport authority, insurance company, or other organization. Built-in content is explicitly labelled DEMO / EXAMPLE. It intentionally avoids inventing official procedures, fees, processing times, or document requirements.

## Run locally
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

## Persistence
The first version uses browser localStorage. Journey records are deliberately separated:

- `journeymap_admin_journeys`: official journeys managed by Admin; only `published` records are shown in Explore.
- `journeymap_user_journeys`: user-owned personal journeys and progress. Using a published journey deep-copies its steps, documents and branches into a new user record with `sourceJourneyId`.
- `journeymap_users` and `journeymap_session`: local demo sign-up/sign-in state.

The old `jm_journeys_v2` key is read once only as a migration source for the new admin collection; it is not used as live application state.
