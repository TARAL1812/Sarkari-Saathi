# JourneyMap implementation checklist

## Implemented
- [x] Landing hero and CTA buttons
- [x] Search bar and six example searches
- [x] Seven categories: Government, Healthcare, Banking, Education, Transport, Insurance, Other
- [x] Explore page with category filters and search
- [x] Five clearly labelled DEMO / EXAMPLE journeys
- [x] Journey detail with START -> steps -> DONE
- [x] Clickable steps
- [x] What happens / what I need / what happens next flow
- [x] Where to go / responsible organization / possible fee / estimated time / common problems / official source
- [x] Last verified + verification status fields
- [x] Document checklist with localStorage
- [x] Decision branches with YES / NO visual paths
- [x] Living Abroad mode: India / Outside India
- [x] Plan Before You Travel guidance prompts
- [x] India Visit — Administrative Tasks demo
- [x] My Journey Plan with multiple journeys
- [x] LocalStorage persistence for plans, journeys, requests, abroad tasks, categories, checklists
- [x] Journey Builder
- [x] Unlimited steps
- [x] Step-level optional decision branches
- [x] Admin Dashboard
- [x] Create / edit / delete user-created journeys
- [x] Add categories and use them in builder/explore
- [x] Manage journey requests and mark requests reviewed
- [x] Verify information by editing verification fields
- [x] Add official sources and set last verified dates
- [x] Official information model fields
- [x] Future-ready API/open-data/organization/document-upload architecture fields (not implemented integrations)
- [x] Responsive desktop/tablet/mobile layout
- [x] No paid API requirement
- [x] No AI API requirement

## Trust / demo constraints
Built-in procedures intentionally use generic demo text. No official fee, processing time, eligibility rule, document requirement, physical-presence requirement, or government/organization integration is asserted as fact.

## Environment note
`npm install` and `npm run build` could not be completed in the build environment because DNS/network access to the npm registry is unavailable (`registry.npmjs.org` could not be resolved). The source includes a Vite config and standard npm scripts and is ready to install/build in a normal Node/npm environment.
