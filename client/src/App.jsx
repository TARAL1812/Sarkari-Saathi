import React, { useEffect, useState, useCallback } from 'react';
import { CATEGORIES } from './lib/constants';
import { readStorage, writeStorage } from './lib/storage';
import {
  cloneJourneyForUser,
  createAdminJourney,
  updateAdminJourney,
  updateUserJourneyProgress,
} from './lib/journeyStore';
import { api } from './lib/api';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import JourneyDetail from './pages/JourneyDetail';
import MyJourneys from './pages/MyJourneys';
import JourneyBuilder from './pages/JourneyBuilder';
import Admin from './pages/Admin';
import About from './pages/About';
import Auth, { PasswordChange } from './pages/Auth';

const KEYS = {
  admin: 'journeymap_admin_journeys',
  user: 'journeymap_user_journeys',
  session: 'journeymap_session',
  requests: 'jm_requests_v2',
  categories: 'jm_categories_v2',
};

export default function App() {
  const [page, setPage] = useState('home');
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [adminJourneys, setAdminJourneys] = useState(() => readStorage(KEYS.admin, []).filter((journey) => !journey.isDemo));
  const [userJourneys, setUserJourneys] = useState(() => readStorage(KEYS.user, []));
  const [session, setSession] = useState(() => readStorage(KEYS.session, null));
  const [requests, setRequests] = useState(() => readStorage(KEYS.requests, []).filter((request) => request.submittedBy !== 'Demo request'));
  const [adminUserOverview, setAdminUserOverview] = useState(null);
  const [adminUserOverviewError, setAdminUserOverviewError] = useState('');
  const [customCategories, setCustomCategories] = useState(() => readStorage(KEYS.categories, []));
  const [selected, setSelected] = useState(null);
  const [builder, setBuilder] = useState(null);
  const [pendingServiceId, setPendingServiceId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState('');

  // Persist local cache
  useEffect(() => writeStorage(KEYS.admin, adminJourneys), [adminJourneys]);
  useEffect(() => writeStorage(KEYS.user, userJourneys), [userJourneys]);
  useEffect(() => writeStorage(KEYS.session, session), [session]);
  useEffect(() => writeStorage(KEYS.requests, requests), [requests]);
  useEffect(() => writeStorage(KEYS.categories, customCategories), [customCategories]);

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Check Backend Connection and sync
  const checkBackendAndSync = useCallback(async () => {
    try {
      const health = await api.health();
      if (health?.ok) {
        setIsBackendLive(true);

        // Fetch categories from backend
        try {
          const apiCats = await api.getCategories();
          if (Array.isArray(apiCats)) {
            const extra = apiCats
              .filter((c) => !CATEGORIES.some((builtin) => builtin.id.toLowerCase() === c.id.toLowerCase()))
              .map((c) => ({ id: c.id, description: c.description, icon: null }));
            setCustomCategories(extra);
          }
        } catch { /* keep existing */ }

        // Fetch official catalog journeys from backend
        try {
          const apiJourneys = await api.getJourneys();
          if (Array.isArray(apiJourneys) && apiJourneys.length > 0) {
            setAdminJourneys((prev) => {
              const merged = [...apiJourneys];
              // Keep any local-only drafts
              prev.forEach((local) => {
                if (!merged.some((m) => m.id === local.id)) {
                  merged.push(local);
                }
              });
              return merged;
            });
          }
        } catch { /* keep existing */ }

        // Check active session via cookie
        try {
          const meData = await api.me();
          if (meData?.user) {
            setSession(meData.user);
            if (meData.user.mustChangePassword) {
              setPage('change-password');
              return;
            }
            // Fetch user personal journeys
            try {
              const uJourneys = await api.getUserJourneys();
              if (Array.isArray(uJourneys)) {
                setUserJourneys(uJourneys);
              }
            } catch { /* ignore */ }

            // If admin, fetch admin journeys & requests
            if (meData.user.role === 'admin') {
              try {
                const admJourneys = await api.getAdminJourneys();
                if (Array.isArray(admJourneys)) setAdminJourneys(admJourneys);
                const admReqs = await api.getAdminRequests();
                if (Array.isArray(admReqs)) setRequests(admReqs);
              } catch (error) {
                setToast(`Unable to load admin content: ${error.message}`);
              }
              try {
                setAdminUserOverview(await api.getAdminUserOverview());
                setAdminUserOverviewError('');
              } catch (error) {
                setAdminUserOverviewError(`Unable to load account activity: ${error.message}`);
              }
            }
          }
        } catch (error) {
          if (error.status === 401) {
            setSession(null);
            setPage('home');
          } else {
            setToast(`Unable to verify your sign-in: ${error.message}`);
          }
        }
      }
    } catch {
      setIsBackendLive(false);
    }
  }, []);

  useEffect(() => {
    checkBackendAndSync();
  }, [checkBackendAndSync]);

  const categories = [...CATEGORIES, ...customCategories];
  const publishedAdmin = adminJourneys.filter((j) => j.status === 'published');
  const activeUserJourneys = userJourneys.filter((j) => (session ? j.userId === session.id : false));

  const navigate = (next) => {
    if (session?.mustChangePassword && next !== 'change-password') {
      setToast('Change your temporary password before continuing.');
      return;
    }
    if (next === 'admin' && session?.role !== 'admin') {
      setToast('Admin access is restricted to administrators.');
      return;
    }
    if (next === 'builder' && session?.role !== 'admin') {
      setToast('Only administrators can create or edit official guides.');
      return;
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const requireUser = (action) => {
    if (session) return true;
    setToast(`Sign in to ${action}.`);
    navigate('signin');
    return false;
  };

  const openAdminJourney = async (id, { authenticated = Boolean(session) } = {}) => {
    if (!authenticated) {
      setPendingServiceId(id);
      setToast('Sign in to open a service guide.');
      setPage('signin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let journey = adminJourneys.find((item) => item.id === id);
    if (!journey) return;

    if (isBackendLive && !Array.isArray(journey.steps)) {
      try {
        journey = await api.getJourney(id);
        setAdminJourneys((prev) => prev.map((item) => (item.id === id ? journey : item)));
      } catch (err) {
        setToast(`Unable to load guide: ${err.message}`);
        return;
      }
    }

    setSelected({ kind: 'admin', id });
    navigate('detail');
  };

  const openUserJourney = (id) => {
    setSelected({ kind: 'user', id });
    navigate('detail');
  };

  const selectedJourney =
    selected?.kind === 'admin'
      ? adminJourneys.find((j) => j.id === selected.id)
      : activeUserJourneys.find((j) => j.id === selected?.id);

  const startAdmin = () => {
    setBuilder({ kind: 'admin', id: null });
    navigate('builder');
  };

  const builderInitial =
    builder?.kind === 'admin' ? adminJourneys.find((j) => j.id === builder.id) : null;

  // Authentication: Connects to Backend with fallback
  const handleAuth = (mode) => async ({ name, email, password }) => {
    const normalized = email.trim().toLowerCase();

    if (isBackendLive) {
      try {
        let responseUser;
        if (mode === 'signup') {
          const res = await api.register({ name, email: normalized, password });
          responseUser = res?.user;
          setToast('Account created successfully!');
        } else {
          const res = await api.login({ email: normalized, password });
          responseUser = res?.user;
          setToast(`Welcome back, ${responseUser?.name || 'User'}!`);
        }

        if (responseUser) {
          setSession(responseUser);
          if (responseUser.mustChangePassword) {
            setPage('change-password');
            return {};
          }
          // Refresh user data from backend
          try {
            const uJourneys = await api.getUserJourneys();
            if (Array.isArray(uJourneys)) setUserJourneys(uJourneys);
          } catch { /* ignore */ }

          if (responseUser.role === 'admin') {
            try {
              const admJourneys = await api.getAdminJourneys();
              if (Array.isArray(admJourneys)) setAdminJourneys(admJourneys);
              const admReqs = await api.getAdminRequests();
              if (Array.isArray(admReqs)) setRequests(admReqs);
            } catch (error) {
              setToast(`Unable to load admin content: ${error.message}`);
            }
            try {
              setAdminUserOverview(await api.getAdminUserOverview());
              setAdminUserOverviewError('');
            } catch (error) {
              setAdminUserOverviewError(`Unable to load account activity: ${error.message}`);
            }
          }
          if (pendingServiceId) {
            const serviceId = pendingServiceId;
            setPendingServiceId(null);
            await openAdminJourney(serviceId, { authenticated: true });
          } else {
            navigate('my');
          }
          return {};
        }
      } catch (err) {
        return { error: err.message || 'Authentication failed. Please check credentials.' };
      }
    }

    return { error: 'The service is offline. Sign in or create an account when the backend is available.' };
  };

  const handleSignOut = async () => {
    if (isBackendLive) {
      try {
        await api.logout();
      } catch { /* ignore */ }
    }
    setSession(null);
    setToast('Signed out successfully.');
    setPage('home');
  };

  const changeTemporaryPassword = async ({ currentPassword, newPassword }) => {
    const result = await api.changePassword({ currentPassword, newPassword });
    setSession(result.user);
    setToast('Password changed successfully.');
    if (result.user.role === 'admin') {
      try {
        setAdminUserOverview(await api.getAdminUserOverview());
        setAdminUserOverviewError('');
      } catch (error) {
        setAdminUserOverviewError(`Unable to load account activity: ${error.message}`);
      }
    } else {
      try {
        const journeys = await api.getUserJourneys();
        if (Array.isArray(journeys)) setUserJourneys(journeys);
      } catch (error) {
        setToast(`Password changed, but saved guides could not be loaded: ${error.message}`);
      }
    }
    if (pendingServiceId) {
      const serviceId = pendingServiceId;
      setPendingServiceId(null);
      await openAdminJourney(serviceId, { authenticated: true });
    } else {
      setPage(result.user.role === 'admin' ? 'admin' : 'my');
    }
    return {};
  };

  const resetUserPassword = async (userId, currentPassword) => {
    const result = await api.resetAdminUserPassword(userId, currentPassword);
    if (userId === session?.id) {
      setToast('Your admin session was revoked. Copy the temporary password before signing in again.');
    }
    return result;
  };

  const deleteAdminUser = async (userId) => {
    await api.deleteAdminUser(userId);
    setAdminUserOverview((current) => {
      if (!current) return current;
      const users = current.users.filter((user) => user.id !== userId);
      return {
        ...current,
        totalAccounts: users.length,
        adminAccounts: users.filter((user) => user.role === 'admin').length,
        activeUsers: users.filter((user) => user.isActive).length,
        successfulLogins: users.reduce((total, user) => total + user.loginCount, 0),
        users,
      };
    });
    try {
      setAdminUserOverview(await api.getAdminUserOverview());
      setAdminUserOverviewError('');
    } catch (error) {
      setAdminUserOverviewError(`Account deleted, but the account list could not be refreshed: ${error.message}`);
    }
  };

  // Clone an official catalog journey to user's personal journeys
  const useJourney = async (id) => {
    if (!requireUser('save this guide')) return;
    let source = publishedAdmin.find((j) => j.id === id);
    if (!source) return;

    if (isBackendLive && !Array.isArray(source.steps)) {
      try {
        source = await api.getJourney(id);
        setAdminJourneys((prev) => prev.map((journey) => (journey.id === id ? source : journey)));
      } catch (err) {
        setToast(`Unable to load guide: ${err.message}`);
        return;
      }
    }

    if (isBackendLive) {
      try {
        const created = await api.createUserJourney({
          sourceJourneyId: source.id,
        });
        if (created) {
          setUserJourneys((prev) => [created, ...prev]);
          setToast('Guide saved to My Plans.');
          openUserJourney(created.id);
          return;
        }
      } catch (err) {
        setToast(`Using offline clone: ${err.message}`);
      }
    }

    const clone = cloneJourneyForUser(source, session.id);
    setUserJourneys((prev) => [...prev, clone]);
    setToast('Guide saved to My Plans.');
    openUserJourney(clone.id);
  };

  // Save Admin Journey (Create / Update)
  const saveAdmin = async (data) => {
    if (isBackendLive && session?.role === 'admin') {
      try {
        if (data.id && !data.id.startsWith('admin-')) {
          const updated = await api.updateAdminJourney(data.id, data);
          setAdminJourneys((prev) => prev.map((j) => (j.id === data.id ? { ...j, ...updated } : j)));
          setToast('Official guide updated on server.');
          openAdminJourney(data.id);
          return;
        } else {
          const created = await api.createAdminJourney(data);
          setAdminJourneys((prev) => [created, ...prev]);
          setToast('Official guide created as draft on server.');
          navigate('admin');
          return;
        }
      } catch (err) {
        setToast(`Error saving to backend: ${err.message}`);
      }
    }

    if (data.id) {
      setAdminJourneys((prev) => prev.map((j) => (j.id === data.id ? updateAdminJourney(j, data) : j)));
      setToast('Official guide updated.');
      openAdminJourney(data.id);
    } else {
      setAdminJourneys((prev) => [...prev, createAdminJourney(data, session?.id || 'local-admin')]);
      setToast('Official guide created as draft. Publish it from Admin.');
      navigate('admin');
    }
  };

  // Update step progress
  const updateProgress = async (journeyId, stepId) => {
    const journey = userJourneys.find((j) => j.id === journeyId);
    if (!journey) return;

    const isDone = journey.completedSteps?.includes(stepId);
    const newCompleted = isDone
      ? journey.completedSteps.filter((x) => x !== stepId)
      : [...(journey.completedSteps || []), stepId];

    // Optimistic UI update
    setUserJourneys((prev) =>
      prev.map((j) => (j.id === journeyId ? updateUserJourneyProgress(j, newCompleted) : j))
    );

    if (isBackendLive && journeyId.startsWith('uj_')) {
      try {
        await api.patchProgress(journeyId, { stepId, completed: !isDone });
      } catch (err) {
        console.error('Failed to patch progress on backend:', err);
      }
    }
  };

  // Admin delete
  const deleteAdmin = async (id) => {
    if (isBackendLive && session?.role === 'admin' && !id.startsWith('admin-')) {
      try {
        await api.deleteAdminJourney(id);
      } catch (err) {
        setToast(`Failed to delete from server: ${err.message}`);
      }
    }
    setAdminJourneys((prev) => prev.filter((j) => j.id !== id));
    setToast('Official guide deleted.');
  };

  // Admin publish/unpublish
  const setPublish = async (id, publish) => {
    const newStatus = publish ? 'published' : 'draft';
    if (isBackendLive && session?.role === 'admin' && !id.startsWith('admin-')) {
      try {
        await api.setAdminJourneyStatus(id, newStatus);
      } catch (err) {
        setToast(`Failed to update status on server: ${err.message}`);
      }
    }
    setAdminJourneys((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: newStatus, updatedAt: new Date().toISOString() } : j))
    );
    setToast(publish ? 'Guide published to Browse Services.' : 'Guide unpublished from Browse Services.');
  };

  // Delete personal journey
  const deleteUser = async (id) => {
    if (isBackendLive && id.startsWith('uj_')) {
      try {
        await api.deleteUserJourney(id);
      } catch (err) {
        console.error('Failed to delete on server:', err);
      }
    }
    setUserJourneys((prev) => prev.filter((j) => j.id !== id));
    setToast('Personal plan removed.');
  };

  return (
    <div className="appShell">
      <Header
        page={page}
        navigate={navigate}
        session={session}
        onSignOut={handleSignOut}
        isBackendLive={isBackendLive}
      />

      {page === 'home' && (
        <Home
          navigate={navigate}
          search={globalSearch}
          setSearch={setGlobalSearch}
        />
      )}

      {page === 'explore' && (
        <Explore
          journeys={publishedAdmin}
          categories={categories}
          search={globalSearch}
          setSearch={setGlobalSearch}
          openJourney={openAdminJourney}
          useJourney={useJourney}
          session={session}
          navigate={navigate}
        />
      )}

      {page === 'my' && (
        <MyJourneys
          journeys={activeUserJourneys}
          openJourney={openUserJourney}
          deleteJourney={deleteUser}
        />
      )}

      {page === 'detail' && selectedJourney && (
        <JourneyDetail
          journey={selectedJourney}
          kind={selected.kind}
          navigate={navigate}
          useJourney={useJourney}
          updateProgress={updateProgress}
        />
      )}

      {page === 'builder' && session?.role === 'admin' && (
        <JourneyBuilder
          initial={builderInitial}
          categories={categories}
          mode={builder?.kind || 'admin'}
          onSave={saveAdmin}
          onCancel={() => navigate('admin')}
        />
      )}

      {page === 'admin' && session?.role === 'admin' && (
        <Admin
          journeys={adminJourneys}
          categories={categories}
          customCategories={customCategories}
          setCustomCategories={setCustomCategories}
          requests={requests}
          setRequests={setRequests}
          startAdminJourney={startAdmin}
          openJourney={openAdminJourney}
          editJourney={(id) => {
            setBuilder({ kind: 'admin', id });
            navigate('builder');
          }}
          deleteJourney={deleteAdmin}
          setPublish={setPublish}
          userOverview={adminUserOverview}
          userOverviewError={adminUserOverviewError}
          session={session}
          resetUserPassword={resetUserPassword}
          deleteUser={deleteAdminUser}
          onSignOut={handleSignOut}
        />
      )}

      {page === 'signin' && (
        <Auth mode="signin" onSubmit={handleAuth('signin')} navigate={navigate} />
      )}

      {page === 'signup' && (
        <Auth mode="signup" onSubmit={handleAuth('signup')} navigate={navigate} />
      )}

      {page === 'change-password' && session?.mustChangePassword && (
        <PasswordChange onSubmit={changeTemporaryPassword} onSignOut={handleSignOut} />
      )}

      {page === 'change-password' && !session?.mustChangePassword && (
        <Auth mode="signin" onSubmit={handleAuth('signin')} navigate={navigate} />
      )}

      {page === 'about' && <About />}

      {!selectedJourney && page === 'detail' && (
        <div className="page">
          <div className="emptyState">
            <h2>Guide not found</h2>
            <button className="button primary" onClick={() => navigate('explore')}>
              Back to Explore
            </button>
          </div>
        </div>
      )}

      <Footer navigate={navigate} />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
