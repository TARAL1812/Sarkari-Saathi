import React, { useState } from 'react';
import { ChevronRight, ExternalLink, MapPin, Plus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Timeline from '../components/Timeline';
import StepInspector from '../components/StepInspector';
import Checklist from '../components/Checklist';
import Badge from '../components/Badge';

export default function JourneyDetail({ journey, kind, navigate, useJourney, updateProgress }) {
  const [active, setActive] = useState(0);
  const personal = kind === 'user';
  const step = journey.steps[active];
  const done = journey.completedSteps?.includes(step.id);
  const progress = personal ? journey.progress || 0 : 0;

  return (
    <main className="page detailPage">
      <div className="breadcrumbs">
        <button onClick={() => navigate(personal ? 'my' : 'explore')}>
          {personal ? 'My Plans' : 'Browse Services'}
        </button>
        <ChevronRight size={13} />
        <span>{journey.category}</span>
        <ChevronRight size={13} />
        <b>{journey.title}</b>
      </div>
      <div className="detailHeader">
        <div>
          <div className="detailLabels">
            <Badge variant="neutral">
              {personal ? 'SAVED GUIDE' : 'PUBLISHED GUIDE'}
            </Badge>
            {!personal && (
              <span>
                <ShieldCheck size={14} /> {journey.verificationStatus === 'verified' ? 'Verified information' : 'Verify before use'}
              </span>
            )}
          </div>
          <h1>{journey.title}</h1>
          <p>{journey.description}</p>
          <div className="journeyFacts">
            <span><MapPin size={14} /> {journey.location || journey.region || 'Location to verify'}</span>
            <span>{journey.steps.length} steps</span>
            {personal
              ? <span>{journey.completedSteps?.length || 0} completed</span>
              : <span>Last verified: {journey.lastVerified || 'Not set'}</span>}
          </div>
        </div>
        <div className="detailActions">
          {personal ? (
            <button className={`button ${done ? 'secondary' : 'primary'}`} onClick={() => updateProgress(journey.id, step.id)}>
              <CheckCircle2 size={16} /> {done ? 'Mark step incomplete' : 'Mark step complete'}
            </button>
          ) : (
            <button className="button primary" onClick={() => useJourney(journey.id)}>
              <Plus size={16} /> Save to My Plans
            </button>
          )}
        </div>
      </div>
      {personal && (
        <div className="detailProgress">
          <span>Personal progress</span>
          <div className="progressBar"><span style={{ width: `${progress}%` }} /></div>
          <b>{progress}%</b>
        </div>
      )}
      <div className="detailGrid">
        <Timeline steps={journey.steps} active={active} setActive={setActive} />
        <div>
          <StepInspector step={step} index={active} total={journey.steps.length} setIndex={setActive} />
          {personal && <Checklist journey={journey} />}
        </div>
      </div>
      {!personal && (
        <div className="dataNote">
          <ExternalLink size={14} />
          <span>
            <b>Published guide:</b> Save a separate copy of the steps, documents and branches to your personal workspace. Your progress never changes this published information.
          </span>
        </div>
      )}
    </main>
  );
}
