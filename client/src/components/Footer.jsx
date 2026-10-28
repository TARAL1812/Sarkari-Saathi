import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div className="footerBrand">
          <img src="/logo-icon.png" alt="Sarkari Saathi" className="footerLogoImg" />
          <b>
            Sarkari <span className="brandAccent">Saathi</span>
          </b>
        </div>
        <p>Guides for documents, certificates, and public services.</p>
        <div className="footerLinks">
          <button onClick={() => navigate('about')}>About</button>
          <button onClick={() => navigate('explore')}>Explore</button>
        </div>
        <div className="footerTrust">
          <ShieldCheck size={14} /> Verify requirements with the responsible organization.
        </div>
      </div>
    </footer>
  );
}
