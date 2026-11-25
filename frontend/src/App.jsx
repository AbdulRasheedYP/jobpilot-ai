import React, { useState, useEffect, useRef } from 'react';
import { authFetch, performLogin } from './api/client';
import Navbar from './components/layout/Navbar';
import Toast from './components/layout/Toast';
import OverviewTab from './components/overview/OverviewTab';
import JobsTab from './components/jobs/JobsTab';
import ApplicationsTab from './components/applications/ApplicationsTab';
import ProfileTab from './components/profile/ProfileTab';
import AgentSettingsTab from './components/agent/AgentSettingsTab';
import ApplicationDetailModal from './components/modals/ApplicationDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  // Modal State for Viewing Tailored CV & Answers
  const [viewingApp, setViewingApp] = useState(null);
  const [modalTab, setModalTab] = useState('resume');
  const [copied, setCopied] = useState(false);

  // Real Data States (Zero Mock Data)
  const [kpis, setKpis] = useState({
    total_jobs: 0,
    total_matches: 0,
    strong_matches: 0,
    total_applications: 0,
    applied_confirmed: 0,
    needs_action: 0,
    auto_apply_enabled: true,
    daily_application_limit: 10,
    daily_applications_used: 0,
  });

  const [activeRun, setActiveRun] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [resumes, setResumes] = useState([]);

  // File Upload State
  const fileInputRef = useRef(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);

  // Interactive Profile & Preferences Editing State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    current_location: '',
    skills: [],
    experience: [],
    education: [],
    notice_period_days: 0,
    sponsorship_required: false,
  });

  const [prefForm, setPrefForm] = useState({
    target_roles: [],
    target_countries: [],
    work_modes: ['remote', 'hybrid'],
    min_match_score: 65,
    posted_within_days: 7,
    min_salary: 6,
    max_salary: 15,
    currency: 'INR',
  });

  const [savingProfile, setSavingProfile] = useState(false);

  // Tag inputs
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newRoleInput, setNewRoleInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');

  // Experience and Education inputs
  const [newExp, setNewExp] = useState({ company: '', title: '', start_date: '', end_date: '', description: '' });
  const [newEdu, setNewEdu] = useState({ institution: '', degree: '', graduation_year: '' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Initial Auth & Dashboard Sync
  useEffect(() => {
    const init = async () => {
      const token = await performLogin();
      if (token) {
        await Promise.all([
          fetchCurrentUser(),
          fetchDashboard(true),
          fetchRunsAndLogs(),
          fetchJobs(),
          fetchPreferences(),
          fetchProfile(),
          fetchResumes(),
        ]);
      }
    };
    init();
  }, []);

  // Fetch data on tab change
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboard(true);
      fetchJobs();
    } else if (activeTab === 'jobs') {
      fetchJobs();
      fetchMatches();
    } else if (activeTab === 'applications') {
      fetchApplications();
    } else if (activeTab === 'profile') {
      fetchProfile();
      fetchPreferences();
      fetchResumes();
    } else if (activeTab === 'agent') {
      fetchPreferences();
      fetchRunsAndLogs();
    }
  }, [activeTab]);

  const fetchCurrentUser = async () => {
    try {
      const res = await authFetch('/auth/me');
      if (res && res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      console.error('Fetch user error:', e);
    }
  };

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await authFetch('/agent/dashboard');
      if (res && res.ok) {
        const data = await res.json();
        setKpis({
          total_jobs: data.total_jobs ?? 0,
          total_matches: data.total_matches ?? 0,
          strong_matches: data.strong_matches ?? 0,
          total_applications: data.total_applications ?? 0,
          applied_confirmed: data.applied_confirmed ?? 0,
          needs_action: data.needs_action ?? 0,
          auto_apply_enabled: data.auto_apply_enabled ?? true,
          daily_application_limit: data.daily_application_limit ?? 10,
          daily_applications_used: data.daily_applications_used ?? 0,
        });
      }
    } catch (e) {
      console.error('Fetch dashboard error:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchRunsAndLogs = async () => {
    try {
      const res = await authFetch('/agent/runs?page=1&size=10');
      if (res && res.ok) {
        const data = await res.json();
        const runsList = data.items || [];
        if (runsList.length > 0) {
          const latestRun = runsList[0];
          setActiveRun(latestRun);
          setIsRunning(latestRun.status === 'RUNNING');
          if (latestRun.events && latestRun.events.length > 0) {
            setAgentLogs(latestRun.events);
          }
        }
      }
    } catch (e) {
      console.error('Fetch runs error:', e);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await authFetch('/jobs?page=1&size=50');
      if (res && res.ok) {
        const data = await res.json();
        setJobs(data.items || (Array.isArray(data) ? data : []));
      }
    } catch (e) {
      console.error('Fetch jobs error:', e);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await authFetch('/matches?page=1&size=50');
      if (res && res.ok) {
        const data = await res.json();
        setMatches(data.items || (Array.isArray(data) ? data : []));
      }
    } catch (e) {
      console.error('Fetch matches error:', e);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await authFetch('/applications?page=1&size=50');
      if (res && res.ok) {
        const data = await res.json();
        const appList = data.items || (Array.isArray(data) ? data : []);
        setApplications(appList);
        return appList;
      }
    } catch (e) {
      console.error('Fetch applications error:', e);
    }
    return [];
  };

  const fetchProfile = async () => {
    try {
      const res = await authFetch('/profile');
      if (res && res.ok) {
        const data = await res.json();
        setProfile(data);
        setProfileForm({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          current_location: data.current_location || '',
          skills: data.skills || [],
          experience: data.experience || [],
          education: data.education || [],
          notice_period_days: data.notice_period_days || 0,
          sponsorship_required: data.sponsorship_required || false,
        });
      }
    } catch (e) {
      console.error('Fetch profile error:', e);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await authFetch('/preferences');
      if (res && res.ok) {
        const data = await res.json();
        setPreferences(data);
        setPrefForm({
          target_roles: data.target_roles || [],
          target_countries: data.target_countries || [],
          work_modes: data.work_modes || ['remote', 'hybrid'],
          min_match_score: data.min_match_score || 65,
          posted_within_days: data.posted_within_days || 7,
          min_salary: data.min_salary || 6,
          max_salary: data.max_salary || 15,
          currency: data.currency || 'INR',
        });
      }
    } catch (e) {
      console.error('Fetch preferences error:', e);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await authFetch('/resumes');
      if (res && res.ok) {
        const data = await res.json();
        setResumes(data);
        if (data && data.length > 0) {
          setSelectedResume(data[0]);
        }
      }
    } catch (e) {
      console.error('Fetch resumes error:', e);
    }
  };

  const handleUploadCV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    showToast(`Parsing ${file.name} without hallucination...`, 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch('/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (res && res.ok) {
        const data = await res.json();
        showToast('CV parsed and facts extracted! Auto-filling profile draft.', 'success');
        setSelectedResume(data);
        await Promise.all([fetchResumes(), fetchProfile(), fetchPreferences(), fetchJobs(), fetchDashboard()]);
      } else {
        const err = await res?.json().catch(() => ({}));
        showToast(err.detail || 'Failed to parse CV.', 'error');
      }
    } catch (err) {
      showToast('Error uploading CV: ' + err.message, 'error');
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await authFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });

      if (res && res.ok) {
        showToast('Profile updated successfully! Re-scored matching jobs.', 'success');
        await Promise.all([fetchProfile(), fetchJobs(), fetchMatches(), fetchDashboard()]);
      } else {
        const err = await res?.json().catch(() => ({}));
        showToast(err.detail || 'Failed to save profile.', 'error');
      }
    } catch (err) {
      showToast('Error saving profile: ' + err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async (silent = false) => {
    const cleanRoles = (prefForm.target_roles || []).filter((r) => r && r.trim());
    if (cleanRoles.length === 0) {
      showToast('Target Roles are required! Please add at least one role.', 'warning');
      return false;
    }
    const cleanLocations = (prefForm.target_countries || []).filter((c) => c && c.trim());
    if (cleanLocations.length === 0) {
      showToast('Target Search Locations are required! Please add at least one location.', 'warning');
      return false;
    }
    if (!prefForm.work_modes || prefForm.work_modes.length === 0) {
      showToast('Allowed Work Modes are required! Please select at least one mode.', 'warning');
      return false;
    }
    if (prefForm.min_salary === '' || prefForm.max_salary === '') {
      showToast('Expected Salary Range is required! Please enter min and target LPA.', 'warning');
      return false;
    }

    setSavingProfile(true);
    try {
      const prefRes = await authFetch('/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          target_roles: cleanRoles,
          target_countries: cleanLocations,
          work_modes: prefForm.work_modes,
          min_match_score: Number(prefForm.min_match_score) || 65,
          posted_within_days: Number(prefForm.posted_within_days) || 7,
          min_salary: Number(prefForm.min_salary) || 6,
          max_salary: Number(prefForm.max_salary) || 15,
          currency: prefForm.currency || 'INR',
        }),
      });

      if (prefRes && prefRes.ok) {
        if (!silent) showToast('Agent search settings saved! Job matches re-calculated.', 'success');
        await Promise.all([fetchPreferences(), fetchJobs(), fetchMatches()]);
        return true;
      } else {
        const err = await prefRes.json().catch(() => ({}));
        showToast(err.detail || 'Failed to save search settings.', 'error');
        return false;
      }
    } catch (err) {
      showToast('Error saving settings: ' + err.message, 'error');
      return false;
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTriggerAgent = async () => {
    setIsRunning(true);
    showToast('Autonomous agent cycle triggered! Running discovery and matching on server...', 'info');

    try {
      const res = await authFetch('/agent/run', {
        method: 'POST',
        body: JSON.stringify({ run_type: 'FULL_CYCLE' }),
      });

      const data = await res?.json().catch(() => ({}));
      if (res && res.ok) {
        await Promise.all([fetchJobs(), fetchMatches(), fetchDashboard(), fetchRunsAndLogs()]);
        showToast('Autonomous cycle finished! Evaluated & ranked jobs ready.', 'success');
      } else {
        showToast(data.detail || 'Failed to start agent cycle.', 'error');
        setActiveTab('agent');
      }
    } catch (e) {
      showToast('Error triggering agent: ' + e.message, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveAndTriggerAgent = async () => {
    const saved = await handleSavePreferences(true);
    if (saved) {
      await handleTriggerAgent();
    }
  };

  // Skill management
  const handleAddSkill = (e) => {
    e?.preventDefault();
    if (!newSkillInput.trim()) return;
    const clean = newSkillInput.trim();
    if (!profileForm.skills.includes(clean)) {
      setProfileForm((prev) => ({
        ...prev,
        skills: [...prev.skills, clean],
      }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSelectSkillOption = (skill) => {
    if (!profileForm.skills.includes(skill)) {
      setProfileForm((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
    setNewSkillInput('');
  };

  // Role management
  const handleAddRole = (e) => {
    e?.preventDefault();
    if (!newRoleInput.trim()) return;
    const clean = newRoleInput.trim();
    if (!prefForm.target_roles.includes(clean)) {
      setPrefForm((prev) => ({
        ...prev,
        target_roles: [...prev.target_roles, clean],
      }));
    }
    setNewRoleInput('');
  };

  const handleRemoveRole = (roleToRemove) => {
    setPrefForm((prev) => ({
      ...prev,
      target_roles: prev.target_roles.filter((r) => r !== roleToRemove),
    }));
  };

  const handleSelectRoleOption = (role) => {
    if (!prefForm.target_roles.includes(role)) {
      setPrefForm((prev) => ({
        ...prev,
        target_roles: [...prev.target_roles, role],
      }));
    }
    setNewRoleInput('');
  };

  // Location management
  const handleAddLocation = (e) => {
    e?.preventDefault();
    if (!newLocationInput.trim()) return;
    const clean = newLocationInput.trim();
    if (!prefForm.target_countries.includes(clean)) {
      setPrefForm((prev) => ({
        ...prev,
        target_countries: [...prev.target_countries, clean],
      }));
    }
    setNewLocationInput('');
  };

  const handleRemoveLocation = (locToRemove) => {
    setPrefForm((prev) => ({
      ...prev,
      target_countries: prev.target_countries.filter((l) => l !== locToRemove),
    }));
  };

  const handleSelectLocationOption = (loc) => {
    if (!prefForm.target_countries.includes(loc)) {
      setPrefForm((prev) => ({
        ...prev,
        target_countries: [...prev.target_countries, loc],
      }));
    }
    setNewLocationInput('');
  };

  const handleToggleWorkMode = (mode) => {
    setPrefForm((prev) => {
      const exists = prev.work_modes.includes(mode);
      const nextModes = exists ? prev.work_modes.filter((m) => m !== mode) : [...prev.work_modes, mode];
      return { ...prev, work_modes: nextModes.length ? nextModes : [mode] };
    });
  };

  // Experience management
  const handleAddExperience = () => {
    if (!newExp.company || !newExp.title) {
      showToast('Company and Role title are required.', 'warning');
      return;
    }
    setProfileForm((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
    setNewExp({ company: '', title: '', start_date: '', end_date: '', description: '' });
  };

  const handleRemoveExperience = (idx) => {
    setProfileForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  };

  // Education management
  const handleAddEducation = () => {
    if (!newEdu.institution || !newEdu.degree) {
      showToast('Institution and Degree are required.', 'warning');
      return;
    }
    setProfileForm((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
    setNewEdu({ institution: '', degree: '', graduation_year: '' });
  };

  const handleRemoveEducation = (idx) => {
    setProfileForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  };

  // Job and Application actions
  const handleSyncJobs = async () => {
    setLoading(true);
    showToast('Fetching fresh listings from official feeds...', 'info');
    try {
      const res = await authFetch('/jobs/sync', {
        method: 'POST',
        body: JSON.stringify({ source_code: 'arbeitnow', query: 'Python' }),
      });
      if (res && res.ok) {
        const data = await res.json();
        showToast(`Discovered ${data.total_fetched} jobs (${data.new_jobs} new).`, 'success');
        fetchJobs();
        fetchDashboard();
      }
    } catch (e) {
      showToast('Sync error: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateMatches = async () => {
    setLoading(true);
    showToast('Evaluating match scores via Decision Engine...', 'info');
    try {
      const res = await authFetch('/matches/evaluate', {
        method: 'POST',
        body: JSON.stringify({ limit: 50 }),
      });
      if (res && res.ok) {
        const data = await res.json();
        showToast(`Evaluated ${data.evaluated_count} jobs. Strong matches: ${data.strong_matches_count}`, 'success');
        fetchJobs();
        fetchMatches();
        fetchDashboard();
      }
    } catch (e) {
      showToast('Evaluation error: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkApplied = async (jobId) => {
    try {
      const res = await authFetch('/applications/mark-applied', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId }),
      });
      if (res && res.ok) {
        showToast('Marked as applied! Tracked in your Applications tab.', 'success');
        fetchJobs();
        fetchApplications();
        fetchDashboard();
      }
    } catch (e) {
      showToast('Error marking applied: ' + e.message, 'error');
    }
  };

  const handleDeleteApplication = async (appId, jobId) => {
    try {
      const res = await authFetch(`/applications/${appId}`, { method: 'DELETE' });
      if (res && res.ok) {
        showToast('Application record removed.', 'info');
        setApplications((prev) => prev.filter((a) => a.id !== appId));
        fetchJobs();
        fetchDashboard();
      }
    } catch (e) {
      showToast('Delete error: ' + e.message, 'error');
    }
  };

  const handleSubmitApplication = async (appId) => {
    showToast('Submitting application with original verified CV...', 'info');
    try {
      const res = await authFetch(`/applications/${appId}/submit`, { method: 'POST' });
      if (res && res.ok) {
        const data = await res.json();
        if (data.status === 'APPLIED_CONFIRMED') {
          showToast(`Application submitted! Receipt code: ${data.confirmation_evidence?.receipt_code || 'VERIFIED'}`, 'success');
        } else {
          showToast('External action needed: please complete on employer site.', 'warning');
        }
        if (viewingApp?.id === appId) {
          setViewingApp(data);
        }
        fetchApplications();
        fetchDashboard();
      }
    } catch (e) {
      showToast('Submit error: ' + e.message, 'error');
    }
  };

  const handleCopyResume = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Toast toast={toast} />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRunning={isRunning}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col gap-8">
        {activeTab === 'overview' && (
          <OverviewTab
            kpis={kpis}
            jobs={jobs}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsTab
            jobs={jobs}
            loading={loading}
            handleSyncJobs={handleSyncJobs}
            handleEvaluateMatches={handleEvaluateMatches}
            handleMarkApplied={handleMarkApplied}
          />
        )}

        {activeTab === 'applications' && (
          <ApplicationsTab
            applications={applications}
            resumes={resumes}
            setViewingApp={setViewingApp}
            setModalTab={setModalTab}
            handleDeleteApplication={handleDeleteApplication}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            resumes={resumes}
            selectedResume={selectedResume}
            setSelectedResume={setSelectedResume}
            fileInputRef={fileInputRef}
            uploadingResume={uploadingResume}
            handleUploadCV={handleUploadCV}
            handleSaveProfile={handleSaveProfile}
            savingProfile={savingProfile}
            handleAddSkill={handleAddSkill}
            handleRemoveSkill={handleRemoveSkill}
            handleSelectSkillOption={handleSelectSkillOption}
            newSkillInput={newSkillInput}
            setNewSkillInput={setNewSkillInput}
            handleAddExperience={handleAddExperience}
            handleRemoveExperience={handleRemoveExperience}
            newExp={newExp}
            setNewExp={setNewExp}
            handleAddEducation={handleAddEducation}
            handleRemoveEducation={handleRemoveEducation}
            newEdu={newEdu}
            setNewEdu={setNewEdu}
          />
        )}

        {activeTab === 'agent' && (
          <AgentSettingsTab
            prefForm={prefForm}
            setPrefForm={setPrefForm}
            handleSavePreferences={handleSavePreferences}
            handleSaveAndTriggerAgent={handleSaveAndTriggerAgent}
            savingProfile={savingProfile}
            isRunning={isRunning}
            activeRun={activeRun}
            agentLogs={agentLogs}
            fetchRunsAndLogs={fetchRunsAndLogs}
            setActiveTab={setActiveTab}
            handleAddRole={handleAddRole}
            handleRemoveRole={handleRemoveRole}
            handleSelectRoleOption={handleSelectRoleOption}
            newRoleInput={newRoleInput}
            setNewRoleInput={setNewRoleInput}
            handleAddLocation={handleAddLocation}
            handleRemoveLocation={handleRemoveLocation}
            handleSelectLocationOption={handleSelectLocationOption}
            newLocationInput={newLocationInput}
            setNewLocationInput={setNewLocationInput}
            handleToggleWorkMode={handleToggleWorkMode}
          />
        )}
      </main>

      <ApplicationDetailModal
        viewingApp={viewingApp}
        setViewingApp={setViewingApp}
        modalTab={modalTab}
        setModalTab={setModalTab}
        resumes={resumes}
        profile={profile}
        handleCopyResume={handleCopyResume}
        copied={copied}
        handleSubmitApplication={handleSubmitApplication}
      />
    </div>
  );
}
