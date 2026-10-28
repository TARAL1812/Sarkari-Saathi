import React, { useEffect, useMemo, useState } from 'react';
import { Check, FileText, RotateCcw } from 'lucide-react';
import { getChecklist, setChecklist } from '../lib/storage';
export default function Checklist({journey}){
  const documents=useMemo(()=>[...new Set(journey.steps.flatMap(s=>s.requiredDocuments||[]).filter(Boolean))],[journey]);
  const [checked,setChecked]=useState(()=>getChecklist(journey.id));
  useEffect(()=>setChecklist(journey.id,checked),[journey.id,checked]);
  const toggle=(doc)=>setChecked(prev=>prev.includes(doc)?prev.filter(x=>x!==doc):[...prev,doc]);
  const progress=documents.length?Math.round(checked.length/documents.length*100):0;
  return <section className="panel checklistPanel"><div className="panelHeading"><div><span className="eyebrow">Document checklist</span><h2>Documents</h2></div><b>{checked.length} / {documents.length} completed</b></div><div className="progressBar"><span style={{width:`${progress}%`}}/></div>{documents.length===0&&<p className="muted">No documents have been added. Verify the official service requirements first.</p>}{documents.map(doc=><label className="checkItem" key={doc}><input type="checkbox" checked={checked.includes(doc)} onChange={()=>toggle(doc)}/><span className="checkVisual">{checked.includes(doc)&&<Check size={13}/>}</span><FileText size={15}/><span>{doc}</span></label>)}<button className="textButton" onClick={()=>setChecked([])}><RotateCcw size={13}/> Reset checklist</button></section>
}
