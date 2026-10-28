import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, UserRound, AlertCircle } from 'lucide-react';

export default function Auth({ mode, onSubmit, navigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signup = mode === 'signup';

  const validate = () => {
    if (signup && (!name.trim() || name.trim().length < 2)) {
      return 'Please enter a name with at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (!password) {
      return 'Password is required.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Za-z]/.test(password)) {
      return 'Password must include at least one letter.';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must include at least one number.';
    }
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const validationMsg = validate();
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setLoading(true);
    try {
      const result = await onSubmit({ name: name.trim(), email: email.trim(), password });
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="authPage">
      <section className="authCard">
        <button className="brand authBrand" onClick={() => navigate('home')} aria-label="Sarkari Saathi home">
          <img src="/logo-icon.png" alt="Sarkari Saathi" className="brandLogoImg" />
          <span className="brandTextGroup">
            <span className="brandText">Sarkari <span className="brandAccent">Saathi</span></span>
            <span className="brandSub">Your Guide for Every Government Process</span>
          </span>
        </button>

        <div className="authIntro">
          <span className="eyebrow">Your personal workspace</span>
          <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
          <p>
            {signup
              ? 'Save guides to your personal plans and track your progress securely.'
              : 'Sign in to continue with your plans, checklists, and admin features.'}
          </p>
        </div>

        {error && (
          <div className="formError">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="authForm" noValidate>
          {signup && (
            <label className="formField">
              <span>Full Name</span>
              <div className="authInput">
                <UserRound size={16} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </div>
              <span className="authFieldHint">Minimum 2 characters</span>
            </label>
          )}

          <label className="formField">
            <span>Email Address</span>
            <div className="authInput">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <label className="formField">
            <span>Password</span>
            <div className="authInput">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 chars (letters & numbers)"
                required
              />
            </div>
            <span className="authFieldHint">Must be at least 8 characters with a letter and a number</span>
          </label>

          <button className="button primary full" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}{' '}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="authSwitch">
          {signup ? 'Already have an account?' : 'New to Sarkari Saathi?'}{' '}
          <button onClick={() => { setError(''); navigate(signup ? 'signin' : 'signup'); }}>
            {signup ? 'Sign in' : 'Create an account'}
          </button>
        </p>

        <p className="authNote">
          Accounts require the Sarkari Saathi API. Passwords are securely hashed.
        </p>
      </section>
    </main>
  );
}

export function PasswordChange({ onSubmit, onSignOut }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Use at least 8 characters, including a letter and a number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const result = await onSubmit({ currentPassword, newPassword });
      if (result?.error) setError(result.error);
    } catch (requestError) {
      setError(requestError.message || 'Unable to change the password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="authPage">
      <section className="authCard">
        <div className="authIntro">
          <span className="eyebrow">Required account security</span>
          <h1>Set a new password</h1>
          <p>Use your temporary password as the current password. You must replace it before continuing.</p>
        </div>
        {error && <div className="formError" role="alert"><AlertCircle size={15} /><span>{error}</span></div>}
        <form onSubmit={submit} className="authForm" noValidate>
          <PasswordField label="Temporary password" value={currentPassword} onChange={setCurrentPassword} />
          <PasswordField label="New password" value={newPassword} onChange={setNewPassword} />
          <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} />
          <button className="button primary full" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Change password'}
          </button>
        </form>
        <button className="textButton" onClick={onSignOut}>Sign out</button>
      </section>
    </main>
  );
}

function PasswordField({ label, value, onChange }) {
  return (
    <label className="formField">
      <span>{label}</span>
      <div className="authInput">
        <LockKeyhole size={16} />
        <input type="password" value={value} onChange={(event) => onChange(event.target.value)} required />
      </div>
    </label>
  );
}
