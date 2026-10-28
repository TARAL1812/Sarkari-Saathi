import React from 'react';
import { Database, Globe2, FileCheck2, ShieldCheck, Workflow } from 'lucide-react';

export default function About() {
  return (
    <main className="page narrowPage">
      <div className="pageHeader">
        <div>
          <span className="eyebrow">About Sarkari Saathi</span>
          <h1>Clear guidance for important documents and services.</h1>
          <p>
            Sarkari Saathi organizes document and service guidance into clear steps, checklists, and links to sources for verification.
          </p>
        </div>
      </div>

      <div className="aboutGrid">
        <AboutCard
          icon={FileCheck2}
          title="Document focused"
          text="Save official guides and use private checklists to track your preparation and progress."
        />
        <AboutCard
          icon={ShieldCheck}
          title="Trust by design"
          text="Verification status, last verified date and source fields are visible parts of the experience."
        />
        <AboutCard
          icon={Workflow}
          title="Future-ready"
          text="The data model can later support official organization dashboards, APIs, open-data sources and official document uploads."
        />
        <AboutCard
          icon={Database}
          title="Local first"
          text="The first version uses localStorage for saved guides, plans, request status and checklist progress."
        />
      </div>

      <section className="notice">
        <Globe2 size={20} />
        <div>
          <b>Important scope</b>
          <p>
            Sarkari Saathi does not claim an official connection to any government, hospital, bank, school, transport authority, insurance company or other organization. Confirm eligibility, required documents, fees and procedures with the responsible organization.
          </p>
        </div>
      </section>

      <section className="dataModel">
        <span className="eyebrow">Official information model & future capabilities</span>
        <h2>Fields ready for future trusted sources</h2>
        <div className="tokenGrid">
          {[
            'organizationName',
            'department',
            'officialWebsite',
            'sourceUrl',
            'verificationStatus',
            'lastVerified',
            'location',
            'API integration',
            'Government open-data',
            'Organization dashboards',
            'Official document uploads',
          ].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </section>
    </main>
  );
}

function AboutCard({ icon: Icon, title, text }) {
  return (
    <div className="aboutCard">
      <span className="categoryIcon">
        <Icon size={20} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
