import React, { useState } from 'react';
import { CheckCircle2, Pencil, Plus, ShieldCheck, Trash2, Tags, Inbox, ArrowRight, KeyRound } from 'lucide-react';

export default function Admin({
  journeys,
  categories,
  customCategories,
  setCustomCategories,
  requests = [],
  setRequests,
  startAdminJourney,
  openJourney,
  editJourney,
  deleteJourney,
  setPublish,
  userOverview,
  userOverviewError,
  session,
  resetUserPassword,
  deleteUser,
  onSignOut,
}) {
  const [tab, setTab] = useState('journeys');
  const [newCategory, setNewCategory] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [resetResult, setResetResult] = useState(null);
  const [resetError, setResetError] = useState('');
  const [resettingUserId, setResettingUserId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');

  const published = journeys.filter((j) => j.status === 'published').length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const recent = [...journeys].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  return (
    <main className="page adminPage">
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Official content only</span>
          <h1>Admin Dashboard</h1>
          <p>
            Manage published document and service guides, review user requests, and maintain service categories.
          </p>
        </div>
        <button className="button primary" onClick={startAdminJourney}>
          <Plus size={15} /> Create Official Guide
        </button>
      </div>

      <div className="statsGrid">
        <Stat label="Total guides" value={journeys.length} />
        <Stat label="Published guides" value={published} />
        <Stat label="Pending requests" value={pendingRequests} />
        <Stat label="Recently updated" value={recent[0]?.updatedAt?.slice(0, 10) || '—'} />
      </div>

      <div className="adminTabs">
        <button className={tab === 'journeys' ? 'active' : ''} onClick={() => setTab('journeys')}>
          Guide management <span>{journeys.length}</span>
        </button>
        <button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>
          Manage service requests <span>{pendingRequests}</span>
        </button>
        <button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>
          Add categories <span>{categories.length}</span>
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          Users &amp; access <span>{userOverview?.totalAccounts ?? '—'}</span>
        </button>
        <button className={tab === 'sources' ? 'active' : ''} onClick={() => setTab('sources')}>
          Verification & sources
        </button>
      </div>

      {tab === 'users' && (
        <section className="panel tablePanel">
          <div className="tableHeader">
            <h2>Accounts and sign-in activity</h2>
            <span>Passwords and password hashes are never shown.</span>
          </div>
          {userOverviewError ? (
            <div className="emptyInline" role="alert">{userOverviewError}</div>
          ) : !userOverview ? (
            <div className="emptyInline">Account activity is loading.</div>
          ) : (
            <>
              <div className="statsGrid">
                <Stat label="Total accounts" value={userOverview.totalAccounts} />
                <Stat label="Administrator accounts" value={userOverview.adminAccounts} />
                <Stat label="Valid signed-in sessions" value={userOverview.activeUsers} />
                <Stat label="Recorded successful logins" value={userOverview.successfulLogins} />
              </div>
              <p className="muted">
                Login tracking starts when enabled; logins from before that date are not available.
                A valid session may belong to a user who is no longer actively using the site.
              </p>
              <div className="formField">
                <label htmlFor="admin-reset-confirmation">Confirm your current admin password before resetting an account</label>
                <input
                  id="admin-reset-confirmation"
                  type="password"
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                />
              </div>
              {resetError && <div className="formError" role="alert">{resetError}</div>}
              {deleteError && <div className="formError" role="alert">{deleteError}</div>}
              {resetResult && (
                <div className="notice" role="status">
                  <KeyRound size={18} />
                  <div>
                    <b>One-time temporary password for {resetResult.email}</b>
                    <p><code>{resetResult.temporaryPassword}</code></p>
                    <p>Copy it now and share it securely with the account holder. It is not saved in account history and must be changed at next sign-in.</p>
                    {resetResult.email === session?.email && (
                      <button className="button secondary" onClick={onSignOut}>
                        Sign out after copying
                      </button>
                    )}
                  </div>
                </div>
              )}
              {userOverview.users.length === 0 ? (
                <div className="emptyInline"><b>No accounts found.</b></div>
              ) : (
                userOverview.users.map((user) => (
                  <div className="tableRow" key={user.id}>
                    <div>
                      <b>{user.name}</b>
                      <span>{user.email}</span>
                    </div>
                    <span className="tableBadge">{user.role.toUpperCase()}</span>
                    <div>
                      <b>{user.loginCount}</b>
                      <span>successful logins</span>
                    </div>
                    <div>
                      <b>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Not recorded'}</b>
                      <span>last sign-in</span>
                    </div>
                    <span className="tableBadge">{user.isActive ? 'VALID SESSION' : 'SIGNED OUT'}</span>
                    <button
                      className="button secondary"
                      disabled={!adminPassword || resettingUserId === user.id}
                      onClick={async () => {
                        setResetError('');
                        setResetResult(null);
                        setResettingUserId(user.id);
                        try {
                          const result = await resetUserPassword(user.id, adminPassword);
                          setResetResult(result);
                          setAdminPassword('');
                        } catch (error) {
                          setResetError(error.message);
                        } finally {
                          setResettingUserId('');
                        }
                      }}
                    >
                      {resettingUserId === user.id ? 'Resetting...' : 'Reset password'}
                    </button>
                    <button
                      className="iconButton danger"
                      title={user.id === session?.id ? 'You cannot delete your own account' : 'Delete account'}
                      aria-label={`Delete ${user.name}'s account`}
                      disabled={user.id === session?.id || deletingUserId === user.id}
                      onClick={async () => {
                        if (!window.confirm(`Permanently delete ${user.name} (${user.email}) and their account data?`)) return;
                        setDeleteError('');
                        setResetResult(null);
                        setDeletingUserId(user.id);
                        try {
                          await deleteUser(user.id);
                        } catch (error) {
                          setDeleteError(error.message);
                        } finally {
                          setDeletingUserId('');
                        }
                      }}
                    >
                      {deletingUserId === user.id ? 'Deleting...' : <Trash2 size={15} />}
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </section>
      )}

      {tab === 'journeys' && (
        <section className="panel tablePanel">
          <div className="tableHeader">
            <h2>Official guides</h2>
            <span>Only published guides appear in Browse Services.</span>
          </div>
          {journeys.length === 0 ? (
            <div className="emptyInline">
              <b>No official guides yet.</b>
              <p>Create a guide to populate the official catalog.</p>
            </div>
          ) : (
            journeys.map((j) => (
              <div className="tableRow" key={j.id}>
                <div>
                  <b>{j.title}</b>
                  <span>
                    {j.category} · {j.steps?.length || 0} steps · {j.status}
                  </span>
                </div>
                <span className="tableBadge">
                  {j.status === 'published' ? 'PUBLISHED' : j.verificationStatus || 'DRAFT'}
                </span>
                <div className="rowButtons">
                  <button
                    className="button secondary"
                    onClick={() => setPublish(j.id, j.status !== 'published')}
                  >
                    {j.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button className="iconButton" onClick={() => openJourney(j.id)} title="View">
                    <CheckCircle2 size={15} />
                  </button>
                  <button className="iconButton" onClick={() => editJourney(j.id)} title="Edit">
                    <Pencil size={15} />
                  </button>
                  <button className="iconButton danger" onClick={() => deleteJourney(j.id)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'requests' && (
        <section className="panel tablePanel">
          <div className="tableHeader">
            <h2>Service Guide Requests</h2>
            <span>Requests from users for service guides.</span>
          </div>
          {requests.length === 0 ? (
            <div className="emptyInline">
              <Inbox size={24} />
              <b>No requests found.</b>
              <p>User requests will appear here for review.</p>
            </div>
          ) : (
            requests.map((r) => (
              <div className="requestRow" key={r.id}>
                <div>
                  <b>{r.title}</b>
                  <span>
                    {r.category} · {r.country || 'India'} · {r.status}
                  </span>
                  {r.description && <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>{r.description}</p>}
                </div>
                <span className="tableBadge">{r.status?.toUpperCase()}</span>
                <div className="rowButtons">
                  {r.status === 'pending' && (
                    <button
                      className="button secondary"
                      onClick={() =>
                        setRequests &&
                        setRequests((prev) =>
                          prev.map((item) => (item.id === r.id ? { ...item, status: 'approved' } : item))
                        )
                      }
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'categories' && (
        <section className="panel categoryAdminPanel">
          <div className="panelHeading">
            <div>
              <span className="eyebrow">Content taxonomy</span>
              <h2>Add categories</h2>
            </div>
            <Tags size={20} />
          </div>
          <div className="categoryAdd">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Legal, Health, Documents"
            />
            <button
              className="button primary"
              onClick={() => {
                const value = newCategory.trim();
                if (value && !categories.some((c) => c.id.toLowerCase() === value.toLowerCase())) {
                  setCustomCategories([...customCategories, { id: value, icon: null, description: 'Custom category' }]);
                  setNewCategory('');
                }
              }}
            >
              <Plus size={15} /> Add category
            </button>
          </div>
          <div className="customCategoryList">
            {categories.map((c) => (
              <span key={c.id}>{c.id}</span>
            ))}
          </div>
        </section>
      )}

      {tab === 'sources' && (
        <section className="panel">
          <div className="panelHeading">
            <div>
              <span className="eyebrow">Admin guide records</span>
              <h2>Verification & sources</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          {recent.map((j) => (
            <div className="sourceRow" key={j.id}>
              <div>
                <b>{j.title}</b>
                <span>{j.organizationName || 'Organization not set'}</span>
              </div>
              <div>
                <span>Last verified</span>
                <b>{j.lastVerified || 'Not set'}</b>
              </div>
              <div>
                <span>Source</span>
                <b>{j.sourceUrl || j.officialWebsite || 'Not added'}</b>
              </div>
              <button className="button secondary" onClick={() => editJourney(j.id)}>
                Edit / verify
              </button>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="statCard">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
