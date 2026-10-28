import React, { useState } from 'react';
import { Menu, X, LayoutDashboard, LogOut, UserRound, Shield } from 'lucide-react';

export default function Header({ page, navigate, session, onSignOut, isBackendLive }) {
  const [open, setOpen] = useState(false);
  const nav = (p) => {
    setOpen(false);
    navigate(p);
  };

  return (
    <header className="topbar">
      <div className="navInner">
        <button className="brand" onClick={() => nav('home')} aria-label="Sarkari Saathi home">
          <img src="/logo-icon.png" alt="Sarkari Saathi logo" className="brandLogoImg" />
          <span className="brandTextGroup">
            <span className="brandText">
              Sarkari <span className="brandAccent">Saathi</span>
            </span>
            <span className="brandSub">Your Guide for Every Government Process</span>
          </span>
        </button>

        {isBackendLive !== undefined && (
          <span className={`apiStatusBadge ${isBackendLive ? '' : 'offline'}`} title={isBackendLive ? 'Connected to Express + SQLite backend' : 'Backend offline - Using local storage cache'}>
            <span className={`pulseDot ${isBackendLive ? '' : 'offline'}`} />
            {isBackendLive ? 'API Connected' : 'Local Mode'}
          </span>
        )}

        <nav className={open ? 'nav open' : 'nav'}>
          {['home', 'explore', 'my', 'about'].map((item) => (
            <button
              key={item}
              className={page === item ? 'navItem active' : 'navItem'}
              onClick={() => nav(item)}
            >
              {item === 'my'
                ? 'My Plans'
                : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}

          {session?.role === 'admin' && (
            <button
              className={page === 'admin' ? 'navItem admin active' : 'navItem admin'}
              onClick={() => nav('admin')}
              title="Admin access granted"
            >
              <LayoutDashboard size={15} /> Admin <Shield size={12} color="#00a2f9" />
            </button>
          )}

          {session ? (
            <button
              className="navItem"
              onClick={onSignOut}
              title={`Signed in as ${session.name} (${session.email})`}
            >
              <LogOut size={15} /> Sign out ({session.role === 'admin' ? 'Admin' : session.name?.split(' ')[0] || 'User'})
            </button>
          ) : (
            <button
              className={page === 'signin' ? 'navItem active' : 'navItem'}
              onClick={() => nav('signin')}
            >
              <UserRound size={15} /> Sign in
            </button>
          )}
        </nav>

        <button
          className="mobileMenu"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
}
