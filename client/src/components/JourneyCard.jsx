import React from 'react';
import { ArrowRight, ListChecks, MapPin, CalendarClock, Plus, ExternalLink } from 'lucide-react';
import { CATEGORIES } from '../lib/constants';
import Badge from './Badge';
export default function JourneyCard({journey,openJourney,useJourney}){
  const Icon=CATEGORIES.find(c=>c.id===journey.category)?.icon;
  return <article className="journeyCard">
    <div className="cardTop"><span className="categoryIcon">{Icon?<Icon size={21}/>:<ExternalLink size={20}/>}</span><Badge variant="neutral">SERVICE GUIDE</Badge></div>
    <h3>{journey.title}</h3><p>{journey.description}</p>
    <div className="cardMeta"><span><ListChecks size={14}/>{journey.steps?.length ?? journey.stepCount ?? 0} steps</span><span><MapPin size={14}/>{journey.location||journey.region||'Location to verify'}</span></div>
    <div className="cardStatus"><span><span className="statusDot"/> {journey.verificationStatus==='verified'?'Verified source':'Information status: Unverified'}</span><span><CalendarClock size={13}/> Last verified: {journey.lastVerified||'Not set'}</span></div>
    <div className="cardActions"><button className="button primary" onClick={()=>openJourney(journey.id)}>View guide <ArrowRight size={15}/></button><button className="button secondary" onClick={()=>useJourney(journey.id)}><Plus size={15}/> Save to My Plans</button></div>
  </article>
}
