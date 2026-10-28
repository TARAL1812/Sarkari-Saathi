import React from 'react';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, Clock3, ExternalLink, Globe2, MapPin, UserRound, WalletCards } from 'lucide-react';
function Info({icon:Icon,label,value}){return <div className="infoCard"><Icon size={17}/><div><small>{label}</small><b>{value||'Not provided'}</b></div></div>}
export default function StepInspector({step,index,total,setIndex}){
  return <>
    <section className="panel stepInspector"><div className="stepEyebrow">CURRENT STEP · {String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</div><h1>{step.title}</h1><p className="stepDescription">{step.description}</p>
      <div className="nextFlow"><div><small>WHAT HAPPENS</small><b>{step.description}</b></div><ArrowDown size={16}/><div><small>WHAT I NEED</small><b>{(step.requiredDocuments||[]).join(', ')||'Verify requirements'}</b></div><ArrowDown size={16}/><div className="nextHighlight"><small>WHAT HAPPENS NEXT</small><b>{step.whatHappensNext||'Verify what happens next from the official source.'}</b></div></div>
      <div className="infoGrid"><Info icon={MapPin} label="Where to go" value={step.location}/><Info icon={UserRound} label="Responsible organization / department" value={step.responsibleOrganization}/><Info icon={Clock3} label="Estimated time" value={step.estimatedTime}/><Info icon={WalletCards} label="Possible fee" value={step.possibleFee}/></div>
      <div className="problemBox"><AlertTriangle size={17}/><div><b>Common problems</b>{(step.commonProblems||['No common problems listed.']).map((p,i)=><p key={i}>{p}</p>)}</div></div>
      <div className="sourceBox"><Globe2 size={17}/><div><b>Official source</b><p>{step.officialSource||'No official source added yet. Verify with the relevant organization before use.'}</p>{step.officialSource&&<a href={step.officialSource} target="_blank" rel="noreferrer">Open source <ExternalLink size={12}/></a>}</div></div>
      <div className="stepControls"><button className="button secondary" disabled={index===0} onClick={()=>setIndex(index-1)}><ArrowLeft size={15}/> Previous</button><button className="button primary" disabled={index===total-1} onClick={()=>setIndex(index+1)}>Next step <ArrowRight size={15}/></button></div>
    </section>
    {step.branch&&<section className="panel branchPanel"><div className="eyebrow">DECISION BRANCH</div><h2>{step.branch.question}</h2><div className="branchGrid"><div className="branchOption yes"><span>YES</span><b>{step.branch.yes}</b></div><div className="branchOption no"><span>NO</span><b>{step.branch.no}</b></div></div><p className="branchHint">Branches are informational in this version. Always verify the actual alternative route from the official source.</p></section>}
  </>
}
