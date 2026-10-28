import React from 'react';
import { ArrowRight, FileCheck2, Trash2 } from 'lucide-react';
import { getChecklist } from '../lib/storage';

export default function MyJourneys({ journeys, openJourney, deleteJourney }) {
  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Your personal workspace</span>
          <h1>My Plans</h1>
          <p>Save published guides and track your own progress. Your private copies stay separate from official information.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panelHeading">
          <div>
            <span className="eyebrow">Saved guides</span>
            <h2>Your saved services</h2>
          </div>
          <b>{journeys.length} saved</b>
        </div>

        {journeys.length === 0 ? (
          <div className="emptyInline">
            <FileCheck2 size={22} />
            <b>No saved guides yet.</b>
            <p>Browse services and save a guide to keep a private copy and checklist.</p>
          </div>
        ) : (
          journeys.map((journey) => {
            const docs = [...new Set(journey.steps.flatMap((step) => step.requiredDocuments || []).filter(Boolean))];
            const completed = getChecklist(journey.id).filter((item) => docs.includes(item)).length;
            const checklistProgress = docs.length ? Math.round((completed / docs.length) * 100) : 0;
            return (
              <div className="planRow" key={journey.id}>
                <span className="categoryIcon">
                  <FileCheck2 size={18} />
                </span>
                <div className="planRowMain">
                  <div>
                    <h3>{journey.title}</h3>
                    <span>
                      {journey.sourceJourneyId ? 'Saved official guide' : 'Saved personal record'} · {journey.steps.length} steps
                    </span>
                  </div>
                  <div className="microProgress">
                    <span style={{ width: `${journey.progress || 0}%` }} />
                  </div>
                  <small>
                    {journey.progress || 0}% steps complete · {checklistProgress}% document checklist complete
                  </small>
                </div>
                <button className="iconButton" onClick={() => openJourney(journey.id)} title="Open saved guide">
                  <ArrowRight size={15} />
                </button>
                <button
                  className="iconButton danger"
                  onClick={() => deleteJourney(journey.id)}
                  title="Remove saved guide"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </section>

      <section className="futurePanel">
        <div>
          <span className="eyebrow">Private copies</span>
          <h2>Your progress stays yours.</h2>
          <p>Saved guides keep a separate copy of their steps, documents, and checklist progress.</p>
        </div>
        <div className="futureTokens">
          <span>Separate records</span>
          <span>Private progress</span>
          <span>Document checklists</span>
        </div>
      </section>
    </main>
  );
}
