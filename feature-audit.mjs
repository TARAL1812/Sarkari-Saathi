import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const checks = {
  landing: ['Understand Any Process', 'What are you trying to do?', 'Explore by need'],
  explore: ['Explore Journeys', 'Search journeys...', 'Filter by category'],
  demos: ['Government Document Application', 'Hospital Visit Journey', 'College Admission Journey', 'Bank Account Opening', 'Driving Licence Journey'],
  journey_detail: ['WHAT HAPPENS', 'WHAT I NEED', 'WHAT HAPPENS NEXT', 'Common problems', 'Official source'],
  checklist: ['Document checklist', 'Reset checklist'],
  branching: ['DECISION BRANCH', 'YES', 'NO'],
  abroad: ['Where are you currently living?', 'Plan Before You Travel', 'Aadhaar-related work', 'PAN-related service', 'Banking / KYC', 'Government documentation'],
  my_journeys: ['My Journey Plan', 'LOCAL STORAGE'],
  builder: ['Create a Journey', 'Journey information', 'Journey steps', 'Add step', 'Add branch'],
  admin: ['Admin Dashboard', 'Total journeys', 'Published journeys', 'Pending requests', 'Recently updated', 'Manage journey requests', 'Add categories', 'Verification & sources'],
  official_model: ['organizationName', 'department', 'officialWebsite', 'sourceUrl', 'verificationStatus', 'lastVerified', 'location'],
  future: ['API integration', 'Government open-data', 'Organization dashboards', 'Official document uploads'],
  safety: ['DEMO / EXAMPLE', 'does not claim an official connection', 'does not invent official procedures']
};

function collect(dir){
  let out=[];
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name); const st=fs.statSync(p);
    if(st.isDirectory() && name!=='node_modules' && name!=='dist') out=out.concat(collect(p));
    else if(st.isFile() && /\.(jsx|js|css|html|md)$/.test(name)) out.push(p);
  }
  return out;
}
const files=collect(root); const corpus=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const failures=[];
for(const [group,items] of Object.entries(checks)) for(const item of items) if(!corpus.includes(item)) failures.push(`${group}: ${item}`);
console.log(`JourneyMap feature audit: ${failures.length?'FAIL':'PASS'}`);
console.log(`Scanned ${files.length} source/document files.`);
if(failures.length){ console.error(failures.join('\n')); process.exitCode=1; }
