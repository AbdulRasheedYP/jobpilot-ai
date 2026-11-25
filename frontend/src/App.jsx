import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  Activity, 
  ShieldCheck, 
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Search,
  ExternalLink,
  Sliders,
  Send,
  Eye,
  Check,
  Building,
  MapPin,
  Clock,
  Award,
  Zap,
  UserCheck,
  Upload,
  Square,
  FileCheck,
  Filter,
  X,
  Copy,
  ChevronRight,
  Globe,
  Trash2,
  Plus,
  Save,
  GraduationCap,
  Sparkles
} from 'lucide-react';

const API_BASE = '/api/v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [token, setToken] = useState(localStorage.getItem('jobpilot_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preparingJobId, setPreparingJobId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  // Modal State for Viewing Tailored CV & Answers
  const [viewingApp, setViewingApp] = useState(null);
  const [modalTab, setModalTab] = useState('resume'); // 'resume' | 'answers'
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
    daily_applications_used: 0
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
    preferred_locations: [],
    skills: [],
    education: [],
    experience: [],
    notice_period_days: 0,
    sponsorship_required: false,
  });

  const [prefForm, setPrefForm] = useState({
    target_roles: ['Python Developer', 'Backend Developer'],
    target_countries: ['India', 'Remote'],
    work_modes: ['remote', 'hybrid', 'onsite'],
    min_match_score: 65,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newRoleInput, setNewRoleInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');
  const [newExp, setNewExp] = useState({ company: '', title: '', start_date: '', end_date: '', description: '' });
  const [showAddExp, setShowAddExp] = useState(false);
  const [newEdu, setNewEdu] = useState({ institution: '', degree: '', graduation_year: 2024 });
  const [showAddEdu, setShowAddEdu] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Authenticated API Fetch Helper
  const authFetch = async (endpoint, options = {}, isRetry = false) => {
    let currentToken = token;
    if (!currentToken) {
      currentToken = await performLogin('candidate@jobpilot.ai', 'password123');
    }

    const headers = {
      ...(options.headers || {}),
    };
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401 && !isRetry) {
        const freshToken = await performLogin('candidate@jobpilot.ai', 'password123');
        if (freshToken) {
          return await authFetch(endpoint, options, true);
        }
      }

      return response;
    } catch (networkErr) {
      console.error('Fetch error:', networkErr);
      return {
        ok: false,
        status: 0,
        statusText: 'Connection Refused',
        json: async () => ({
          detail: 'Cannot connect to backend server. Make sure uvicorn is running on http://127.0.0.1:8000'
        })
      };
    }
  };

  const performLogin = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem('jobpilot_token', data.access_token);
        return data.access_token;
      }
    } catch (err) {
      console.error('Login error:', err);
    }
    return null;
  };

  // Initial Auth & Dashboard Sync
  useEffect(() => {
    const init = async () => {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await performLogin('candidate@jobpilot.ai', 'password123');
      }
      if (currentToken) {
        fetchCurrentUser();
        fetchDashboard();
        fetchRunsAndLogs();
      }
    };
    init();
  }, [token]);

  // Periodic polling for Dashboard & Runs
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchDashboard(true);
      fetchRunsAndLogs();
    }, 8000);
    return () => clearInterval(interval);
  }, [token]);

  // Fetch data on tab change
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'overview') {
      fetchDashboard();
      fetchJobs();
      fetchMatches();
      fetchRunsAndLogs();
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
      fetchDashboard();
      fetchRunsAndLogs();
    }
  }, [activeTab, token]);

  // Synchronize backend profile & preferences into interactive form state
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        current_location: profile.current_location || '',
        preferred_locations: profile.preferred_locations || [],
        skills: profile.skills || [],
        education: profile.education || [],
        experience: profile.experience || [],
        notice_period_days: profile.notice_period_days || 0,
        sponsorship_required: profile.sponsorship_required || false,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (preferences) {
      setPrefForm({
        target_roles: preferences.target_roles || ['Python Developer', 'Backend Developer'],
        target_countries: preferences.target_countries || ['India', 'Remote'],
        work_modes: preferences.work_modes || ['remote', 'hybrid', 'onsite'],
        min_match_score: preferences.min_match_score || 65,
      });
    }
  }, [preferences]);

  const fetchCurrentUser = async () => {
    try {
      const res = await authFetch('/auth/me');
      if (res && res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      console.error(e);
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
      console.error(e);
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
      console.error(e);
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
      console.error(e);
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
      console.error(e);
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
      console.error(e);
    }
    return [];
  };

  const fetchProfile = async () => {
    try {
      const res = await authFetch('/profile');
      if (res && res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await authFetch('/preferences');
      if (res && res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await authFetch('/resumes');
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.items || [];
        setResumes(list);
        if (list.length > 0 && !selectedResume) {
          setSelectedResume(list[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Actions
  const handleUploadCV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingResume(true);
    showToast(`Parsing CV facts from ${file.name}...`, 'info');

    try {
      const res = await authFetch('/resumes', {
        method: 'POST',
        body: formData,
      });

      if (res && res.ok) {
        const newResume = await res.json();
        showToast('CV imported & parsed! Candidate profile auto-populated.', 'success');
        fetchResumes();
        fetchProfile();
        fetchPreferences();
        fetchJobs();
        setSelectedResume(newResume);
      } else {
        let errDetail = 'Unknown upload error.';
        try {
          const errData = await res.json();
          if (typeof errData.detail === 'string') {
            errDetail = errData.detail;
          } else if (errData.detail?.message) {
            errDetail = errData.detail.message;
          } else if (Array.isArray(errData.detail)) {
            errDetail = errData.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
          } else if (errData.message) {
            errDetail = errData.message;
          }
        } catch (e) {
          errDetail = `HTTP ${res?.status || 500}: ${res?.statusText || 'Server Error'}`;
        }
        showToast(`Upload Failed: ${errDetail}`, 'error');
      }
    } catch (err) {
      showToast('Error uploading resume: ' + err.message, 'error');
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmResume = async (resumeId) => {
    try {
      const parsed = selectedResume?.parsed_facts || {};
      const skillsToConfirm = parsed.extracted_skills || parsed.skills || profile?.skills || [];
      const educationToConfirm = parsed.extracted_education || parsed.education || [];
      const experienceToConfirm = parsed.extracted_experience || parsed.experience || [];

      const payload = {
        confirmed_skills: skillsToConfirm,
        confirmed_education: educationToConfirm,
        confirmed_experience: experienceToConfirm,
      };

      const res = await authFetch(`/resumes/${resumeId}/confirm`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res && res.ok) {
        showToast('Zero-Hallucination Gate Verified: Profile locked & ready!', 'success');
        fetchResumes();
        fetchProfile();
        fetchJobs();
      }
    } catch (e) {
      showToast('Failed to confirm resume: ' + e.message, 'error');
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const profRes = await authFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          current_location: profileForm.current_location,
          preferred_locations: profileForm.preferred_locations,
          skills: profileForm.skills,
          education: profileForm.education,
          experience: profileForm.experience,
          notice_period_days: Number(profileForm.notice_period_days) || 0,
          sponsorship_required: Boolean(profileForm.sponsorship_required),
        }),
      });

      const prefRes = await authFetch('/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          target_roles: prefForm.target_roles,
          target_countries: prefForm.target_countries,
          work_modes: prefForm.work_modes,
          min_match_score: Number(prefForm.min_match_score) || 65,
        }),
      });

      if (profRes && profRes.ok && prefRes && prefRes.ok) {
        showToast('Profile & preferences saved! Jobs re-scored and ranked.', 'success');
        await fetchProfile();
        await fetchPreferences();
        await fetchJobs();
      } else {
        showToast('Failed to save profile changes.', 'error');
      }
    } catch (err) {
      showToast('Error saving profile: ' + err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSkill = (e) => {
    e?.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!profileForm.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setProfileForm((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddRole = (e) => {
    e?.preventDefault();
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    if (!prefForm.target_roles.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
      setPrefForm((prev) => ({ ...prev, target_roles: [...prev.target_roles, trimmed] }));
    }
    setNewRoleInput('');
  };

  const handleRemoveRole = (roleToRemove) => {
    setPrefForm((prev) => ({
      ...prev,
      target_roles: prev.target_roles.filter((r) => r !== roleToRemove),
    }));
  };

  const handleAddLocation = (e) => {
    e?.preventDefault();
    const trimmed = newLocationInput.trim();
    if (!trimmed) return;
    if (!prefForm.target_countries.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setPrefForm((prev) => ({ ...prev, target_countries: [...prev.target_countries, trimmed] }));
    }
    setNewLocationInput('');
  };

  const handleRemoveLocation = (locToRemove) => {
    setPrefForm((prev) => ({
      ...prev,
      target_countries: prev.target_countries.filter((l) => l !== locToRemove),
    }));
  };

  const handleToggleWorkMode = (mode) => {
    setPrefForm((prev) => {
      const exists = prev.work_modes.includes(mode);
      const nextModes = exists ? prev.work_modes.filter((m) => m !== mode) : [...prev.work_modes, mode];
      return { ...prev, work_modes: nextModes.length ? nextModes : [mode] };
    });
  };

  const handleAddExperience = () => {
    if (!newExp.company.trim() || !newExp.title.trim()) {
      showToast('Please provide Company and Title.', 'error');
      return;
    }
    setProfileForm((prev) => ({
      ...prev,
      experience: [...prev.experience, { ...newExp }],
    }));
    setNewExp({ company: '', title: '', start_date: '', end_date: '', description: '' });
    setShowAddExp(false);
  };

  const handleRemoveExperience = (idx) => {
    setProfileForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  };

  const handleAddEducation = () => {
    if (!newEdu.institution.trim() || !newEdu.degree.trim()) {
      showToast('Please provide Institution and Degree.', 'error');
      return;
    }
    setProfileForm((prev) => ({
      ...prev,
      education: [...prev.education, { ...newEdu, graduation_year: Number(newEdu.graduation_year) || 2024 }],
    }));
    setNewEdu({ institution: '', degree: '', graduation_year: 2024 });
    setShowAddEdu(false);
  };

  const handleRemoveEducation = (idx) => {
    setProfileForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  };

  const handleSyncJobs = async () => {
    setLoading(true);
    showToast('Fetching live jobs from Arbeitnow...', 'info');
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
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_applied: true } : j));
        fetchApplications();
        fetchDashboard();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to mark as applied', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  const handleDeleteApplication = async (appId, jobId) => {
    try {
      const res = await authFetch(`/applications/${appId}`, {
        method: 'DELETE',
      });
      if (res && res.ok) {
        showToast('Application record removed.', 'info');
        if (jobId) {
          setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_applied: false } : j));
        }
        fetchApplications();
        fetchDashboard();
      }
    } catch (e) {
      showToast('Error removing application: ' + e.message, 'error');
    }
  };

  const handlePrepareApplication = async (jobId) => {
    // Check if user has uploaded a CV first
    if (!resumes || resumes.length === 0) {
      showToast('Please upload your CV in the Profile & CV Center first!', 'error');
      setActiveTab('profile');
      return;
    }

    setPreparingJobId(jobId);
    showToast('Attaching your uploaded CV and preparing application...', 'info');
    try {
      const res = await authFetch('/applications/prepare', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId }),
      });
      if (res && res.ok) {
        const preparedApp = await res.json();
        showToast('Application ready with your uploaded CV! Review details before submitting.', 'success');
        const updatedList = await fetchApplications();
        fetchDashboard();
        setActiveTab('applications');
        // Open the newly prepared application in the View Modal immediately!
        setViewingApp(preparedApp);
        setModalTab('resume');
      } else {
        const err = await res.json();
        showToast(err.detail?.message || err.detail || 'Preparation failed', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setPreparingJobId(null);
    }
  };

  const handleSubmitApplication = async (appId) => {
    showToast('Submitting application via verified portal adapter...', 'info');
    try {
      const res = await authFetch(`/applications/${appId}/submit?is_manual=true`, {
        method: 'POST',
      });
      if (res && res.ok) {
        const data = await res.json();
        if (data.status === 'APPLIED_CONFIRMED') {
          showToast(`Applied Confirmed! Receipt: ${data.confirmation_evidence?.receipt_code || 'Verified'}`, 'success');
        } else if (data.status === 'MANUAL_ACTION_REQUIRED') {
          showToast('CAPTCHA / bot challenge detected: Manual action required.', 'warning');
        } else {
          showToast(`Application updated: ${data.status}`, 'info');
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

  const handleTriggerAgent = async () => {
    showToast('Triggering autonomous cycle in background...', 'info');
    try {
      const res = await authFetch('/agent/run', {
        method: 'POST',
        body: JSON.stringify({ run_type: 'FULL_CYCLE' }),
      });
      if (res && res.ok) {
        showToast('Autonomous cycle started!', 'success');
        fetchDashboard();
        fetchRunsAndLogs();
      }
    } catch (e) {
      showToast('Error triggering agent: ' + e.message, 'error');
    }
  };

  const handleAgentControl = async (action) => {
    if (!activeRun?.id) {
      showToast('No active agent run to control.', 'warning');
      return;
    }
    try {
      const res = await authFetch(`/agent/runs/${activeRun.id}/${action}`, { method: 'POST' });
      if (res && res.ok) {
        showToast(`Agent ${action} command sent.`, 'success');
        fetchDashboard();
        fetchRunsAndLogs();
      }
    } catch (e) {
      showToast('Control error: ' + e.message, 'error');
    }
  };

  const handleCopyResume = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getResumeSkills = (res) => {
    if (!res?.parsed_facts) return [];
    return (
      res.parsed_facts.confirmed_skills ||
      res.parsed_facts.extracted_skills ||
      res.parsed_facts.skills ||
      []
    );
  };

  const isResumeConfirmed = (res) => {
    return res?.parsed_facts?.status === 'confirmed';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : toast.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <Activity className="w-5 h-5 animate-pulse text-emerald-400" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                JobPilot AI
                <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  v1.0 Cloud
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Autonomous 24/7 Job Search & Application Agent</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border bg-slate-50 border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-semibold">
                {activeRun ? activeRun.status : 'Agent Online'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Hallucination Guard Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col gap-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'jobs', label: 'Discovered Jobs', icon: Briefcase },
            { id: 'applications', label: 'Applications Tracker', icon: CheckCircle2 },
            { id: 'profile', label: 'Profile & CV Center', icon: UserCheck },
            { id: 'agent', label: 'Agent Control & Logs', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                  active
                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discovered Jobs</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">{kpis.total_jobs}</span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Live Sync</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Strong Matches (≥75%)</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-extrabold text-emerald-600">{kpis.strong_matches}</span>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">High Fit</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Submissions</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-extrabold text-blue-600">{kpis.applied_confirmed}</span>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Verified Proof</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Required</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-extrabold text-amber-600">{kpis.needs_action}</span>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Review Needed</span>
                </div>
              </div>
            </div>

            {/* Quick Agent Status & Top Matches */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-slate-900">Top Scored Job Matches</h2>
                  <button onClick={() => setActiveTab('jobs')} className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer">
                    View All ({jobs.length})
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {jobs.length > 0 ? (
                    jobs.slice(0, 3).map((job) => {
                      const match = matches.find((m) => m.job_id === job.id);
                      return (
                        <div
                          key={job.id}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-all flex justify-between items-start"
                        >
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                            <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span>{job.company_name}</span>
                              <span>•</span>
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{job.location || 'Remote'}</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {job.skills_required &&
                                job.skills_required.slice(0, 4).map((s) => (
                                  <span
                                    key={s}
                                    className="text-[11px] font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                                  >
                                    {s}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-emerald-600">
                              {match ? `${match.overall_score.toFixed(0)}%` : 'New'}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-medium">Match Score</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No jobs discovered yet. Click "Discovered Jobs" tab and sync live listings.
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Status Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-2">Autonomous Agent Ops</h2>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">
                    Runs periodic 24/7 background worker cycles discovering jobs, checking eligibility, and auto-applying where permitted.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Daemon Cycle:</span>
                      <span className="font-bold text-slate-900">
                        {activeRun ? activeRun.status : 'Active (Polling 10m)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Auto-Apply Daily Limit:</span>
                      <span className="font-bold text-slate-900">
                        {kpis.daily_applications_used} / {kpis.daily_application_limit} Used
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Ethical Policy Gate:</span>
                      <span className="font-bold text-emerald-600">Strict (No Bypass)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTriggerAgent}
                  disabled={isRunning}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isRunning ? 'Running Agent Cycle...' : 'Trigger Agent Run Now'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DISCOVERED & MATCHED JOBS */}
        {/* ============================================================== */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Matched Opportunities (Ranked by CV Fit)</h2>
                <p className="text-xs text-slate-500">Live job listings scored and ordered strictly by candidate match. Click 'Apply on Employer Site' to submit your CV directly.</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSyncJobs}
                  disabled={loading}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Sync Live Jobs (Arbeitnow)</span>
                </button>
                <button
                  onClick={handleEvaluateMatches}
                  disabled={loading}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Re-score Fits</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {jobs.length > 0 ? (
                jobs.map((job) => {
                  const match = matches.find((m) => m.job_id === job.id);
                  const fitScore = job.match_score !== undefined && job.match_score !== null ? job.match_score : (match ? match.overall_score : null);
                  const reasons = (job.decision_reasons && job.decision_reasons.length > 0) ? job.decision_reasons : (match ? match.decision_reasons : []);
                  const matchedSkillsList = (job.matched_skills && job.matched_skills.length > 0) ? job.matched_skills : (match ? match.matched_skills : []);

                  return (
                    <div
                      key={job.id}
                      className="p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                          {job.is_remote && (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                              Remote
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <Globe className="w-3 h-3 text-emerald-600" />
                            <span>Source: {job.source_name || 'Direct Portal'}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                          <span className="font-semibold text-slate-800">{job.company_name}</span>
                          <span>•</span>
                          <span>{job.location || 'Remote'}</span>
                          {(job.application_url || job.canonical_url) && (
                            <>
                              <span>•</span>
                              <a
                                href={job.application_url || job.canonical_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
                                title="Open original job posting"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Visit {job.source_name || 'Portal'}</span>
                              </a>
                            </>
                          )}
                        </p>

                        {reasons && reasons.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-700 mb-1">Match Rationale:</p>
                            <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                              {reasons.slice(0, 3).map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.skills_required &&
                            job.skills_required.map((s) => {
                              const isMatched = matchedSkillsList.some(ms => ms.toLowerCase() === s.toLowerCase());
                              return (
                                <span
                                  key={s}
                                  className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                                    isMatched
                                      ? 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {s} {isMatched ? '✓' : ''}
                                </span>
                              );
                            })}
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="text-right">
                          <div className={`text-2xl font-black ${
                            fitScore && fitScore >= 80 ? 'text-emerald-600' : fitScore && fitScore >= 50 ? 'text-blue-600' : 'text-slate-600'
                          }`}>
                            {fitScore !== null && fitScore > 0 ? `${Math.round(fitScore)}%` : '—'}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">CV Match Fit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={job.application_url || job.canonical_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                            title="Open employer application page"
                          >
                            <span>Apply on Site</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {job.is_applied ? (
                            <span className="py-2 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs rounded-lg flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Applied</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkApplied(job.id)}
                              className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Mark this job as applied in your tracker"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Mark Applied</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No jobs in feed. Click "Sync Live Jobs (Arbeitnow)" above to discover real listings!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: APPLICATIONS TRACKER */}
        {/* ============================================================== */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Application Status & Audit Tracker</h2>
                <p className="text-xs text-slate-500">Real-time status, verifiable employer submission receipts, and tailored documents.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Role & Company</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submission Receipt</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.length > 0 ? (
                    applications.map((app) => {
                      const jobTitle = app.job?.title || 'Software Developer';
                      const company = app.job?.company_name || 'Employer';
                      const sourceName = app.source_name || app.job?.source_name || 'Portal';
                      const receiptCode = app.confirmation_evidence?.receipt_code || '—';
                      const cvName = app.resume_file_name || (resumes && resumes[0]?.file_name) || 'Uploaded CV';

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{jobTitle}</span>
                              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                🌐 {sourceName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal flex items-center gap-2 mt-0.5">
                              <span>{company}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">CV: {cvName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                app.status === 'APPLIED_CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'READY' || app.status === 'PREPARED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {app.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-700">
                            {receiptCode}
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            {app.submitted_at
                              ? new Date(app.submitted_at).toLocaleDateString()
                              : app.created_at
                              ? new Date(app.created_at).toLocaleDateString()
                              : 'Pending'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {/* Open Employer Portal Link */}
                              {(app.job?.application_url || app.job?.canonical_url) && (
                                <a
                                  href={app.job.application_url || app.job.canonical_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                  title="Open live employer job page"
                                >
                                  <ExternalLink className="w-3 h-3 text-slate-600" />
                                  <span>Portal</span>
                                </a>
                              )}

                              {/* View Application & Uploaded CV Button */}
                              <button
                                onClick={() => {
                                  setViewingApp(app);
                                  setModalTab('resume');
                                }}
                                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-slate-600" />
                                <span>View</span>
                              </button>

                              {/* Delete / Un-track application */}
                              <button
                                onClick={() => handleDeleteApplication(app.id, app.job_id)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Remove application"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No applications tracked yet. Go to "Discovered Jobs" to find matches and self-apply!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: CANDIDATE PROFILE & DECISION CENTER */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Top Header & Actions Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>Candidate Profile & Decision Center</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Auto-filled from your CV. Edit or fill missing fields anytime. The Decision Engine uses this verified profile to search and rank jobs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadCV}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingResume}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>{uploadingResume ? 'Parsing CV...' : 'Import / Replace CV'}</span>
                </button>

                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {savingProfile ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{savingProfile ? 'Saving & Re-scoring...' : 'Save Profile & Re-score Jobs'}</span>
                </button>
              </div>
            </div>

            {/* Sync & Zero-Hallucination Status Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-900">
                  <span className="font-bold">Active CV Source: </span>
                  {selectedResume ? (
                    <span>
                      <strong className="text-slate-900">{selectedResume.file_name}</strong> (Auto-populated into profile)
                    </span>
                  ) : (
                    <span className="text-amber-800">No CV file uploaded yet. Form is in manual entry mode.</span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-white/70 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                Zero-Hallucination Active
              </span>
            </div>

            {/* Main Profile Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: Personal Info & Preferences */}
              <div className="space-y-6">
                {/* Card 1: Personal & Contact Information */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Personal & Contact Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="e.g. Arjun Nair"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Current Location</label>
                      <input
                        type="text"
                        value={profileForm.current_location}
                        onChange={(e) => setProfileForm({ ...profileForm, current_location: e.target.value })}
                        placeholder="e.g. Kochi, Kerala, India"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Notice Period (Days)</label>
                      <input
                        type="number"
                        min="0"
                        value={profileForm.notice_period_days}
                        onChange={(e) => setProfileForm({ ...profileForm, notice_period_days: e.target.value })}
                        placeholder="0 (Immediate)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="sponsorshipReq"
                        checked={profileForm.sponsorship_required}
                        onChange={(e) => setProfileForm({ ...profileForm, sponsorship_required: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="sponsorshipReq" className="text-xs text-slate-700 font-medium cursor-pointer">
                        Visa Sponsorship Required
                      </label>
                    </div>
                  </div>
                </div>

                {/* Card 2: Job Search & Role Preferences */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>Job Preferences & Constraints</span>
                  </h3>

                  {/* Target Roles */}
                  <div className="text-xs space-y-2">
                    <label className="block text-slate-500 font-semibold">Target Roles</label>
                    <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {prefForm.target_roles.map((role) => (
                        <span
                          key={role}
                          className="bg-white border border-slate-200 text-slate-800 font-medium px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{role}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRole(role)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <form onSubmit={handleAddRole} className="flex gap-2">
                      <input
                        type="text"
                        value={newRoleInput}
                        onChange={(e) => setNewRoleInput(e.target.value)}
                        placeholder="Add role (e.g. Python Developer)..."
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </form>
                  </div>

                  {/* Work Modes */}
                  <div className="text-xs space-y-2 pt-2">
                    <label className="block text-slate-500 font-semibold">Allowed Work Modes</label>
                    <div className="flex items-center gap-3">
                      {['remote', 'hybrid', 'onsite'].map((mode) => (
                        <label
                          key={mode}
                          onClick={() => handleToggleWorkMode(mode)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all ${
                            prefForm.work_modes.includes(mode)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {mode}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Target Locations */}
                  <div className="text-xs space-y-2 pt-2">
                    <label className="block text-slate-500 font-semibold">Target Locations / Countries</label>
                    <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {prefForm.target_countries.map((loc) => (
                        <span
                          key={loc}
                          className="bg-white border border-slate-200 text-slate-800 font-medium px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{loc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(loc)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <form onSubmit={handleAddLocation} className="flex gap-2">
                      <input
                        type="text"
                        value={newLocationInput}
                        onChange={(e) => setNewLocationInput(e.target.value)}
                        placeholder="Add location (e.g. Remote, India, Bangalore)..."
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </form>
                  </div>

                  {/* Minimum Match Score Threshold */}
                  <div className="text-xs space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-500 font-semibold">Minimum Match Score Threshold</label>
                      <span className="font-bold text-emerald-600 text-sm">{prefForm.min_match_score}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      value={prefForm.min_match_score}
                      onChange={(e) => setPrefForm({ ...prefForm, min_match_score: Number(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Jobs with a match score above this threshold will receive priority ranking.
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: Skills, Experience & Education */}
              <div className="space-y-6">
                {/* Card 3: Technical Skills */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span>Confirmed Technical Skills ({profileForm.skills.length})</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Used for 35% of match scoring</span>
                  </div>

                  {/* Skills Tag Cloud */}
                  <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {profileForm.skills.length > 0 ? (
                      profileForm.skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-emerald-500 hover:text-rose-600 cursor-pointer"
                            title="Remove skill"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        No skills listed yet. Add skills below or upload your CV to auto-extract.
                      </span>
                    )}
                  </div>

                  {/* Add Skill Form */}
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      placeholder="Add technical skill (e.g. FastAPI, Docker, React)..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Skill</span>
                    </button>
                  </form>
                </div>

                {/* Card 4: Work Experience */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      <span>Work Experience ({profileForm.experience.length})</span>
                    </h3>
                    <button
                      onClick={() => setShowAddExp(!showAddExp)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddExp ? 'Cancel' : 'Add Experience'}</span>
                    </button>
                  </div>

                  {/* Add Experience Inline Form */}
                  {showAddExp && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <h4 className="font-bold text-slate-800">Add New Experience</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Company name"
                          value={newExp.company}
                          onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Role title"
                          value={newExp.title}
                          onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Start Date (e.g. 2023-01)"
                          value={newExp.start_date}
                          onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="End Date (e.g. Present)"
                          value={newExp.end_date}
                          onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                        />
                      </div>
                      <textarea
                        placeholder="Key responsibilities and technical accomplishments..."
                        value={newExp.description}
                        onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                      />
                      <button
                        onClick={handleAddExperience}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
                      >
                        Save Experience
                      </button>
                    </div>
                  )}

                  {/* Experience List */}
                  <div className="space-y-3">
                    {profileForm.experience.length > 0 ? (
                      profileForm.experience.map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{exp.title || 'Role'}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-emerald-700 font-semibold">{exp.company || 'Company'}</span>
                            </div>
                            <span className="text-slate-400 text-[11px] block">
                              {exp.start_date || 'Past'} – {exp.end_date || 'Present'}
                            </span>
                            {exp.description && (
                              <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{exp.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(idx)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                            title="Remove role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        No experience recorded. Click "Add Experience" above or upload a CV.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 5: Education Credentials */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>Education Credentials ({profileForm.education.length})</span>
                    </h3>
                    <button
                      onClick={() => setShowAddEdu(!showAddEdu)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddEdu ? 'Cancel' : 'Add Education'}</span>
                    </button>
                  </div>

                  {/* Add Education Inline Form */}
                  {showAddEdu && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <h4 className="font-bold text-slate-800">Add New Credential</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Institution / University"
                          value={newEdu.institution}
                          onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Degree (e.g. B.Tech CS)"
                          value={newEdu.degree}
                          onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                        />
                        <input
                          type="number"
                          placeholder="Graduation Year (e.g. 2024)"
                          value={newEdu.graduation_year}
                          onChange={(e) => setNewEdu({ ...newEdu, graduation_year: e.target.value })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                        />
                      </div>
                      <button
                        onClick={handleAddEducation}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
                      >
                        Save Education
                      </button>
                    </div>
                  )}

                  {/* Education List */}
                  <div className="space-y-3">
                    {profileForm.education.length > 0 ? (
                      profileForm.education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 text-sm block">{edu.degree || 'Degree'}</span>
                            <span className="text-slate-600">{edu.institution || 'University'}</span>
                            {edu.graduation_year && (
                              <span className="text-slate-400 text-[11px] block">Graduation: {edu.graduation_year}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(idx)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                            title="Remove education"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        No education recorded. Click "Add Education" above or upload a CV.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Ensure all details accurately match your credentials before applying to jobs.
              </span>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {savingProfile ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{savingProfile ? 'Saving & Re-scoring...' : 'Save Profile & Re-score Jobs'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: AGENT CONTROL & LOGS */}
        {/* ============================================================== */}
        {activeTab === 'agent' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Agent Execution Controls & Audit Logs</h2>
                <p className="text-xs text-slate-500">Lifecycle state machine controls with real-time audit stream.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTriggerAgent}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Cycle</span>
                </button>
                <button
                  onClick={() => handleAgentControl('pause')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={() => handleAgentControl('stop')}
                  className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-medium text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Audit Log Stream</span>
                <button onClick={() => fetchRunsAndLogs()} className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer">
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {agentLogs.length > 0 ? (
                  agentLogs.map((log) => (
                    <div key={log.id} className="p-3.5 text-xs flex items-center justify-between font-mono">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
                          {log.stage}
                        </span>
                        <span className="text-slate-700">{log.message}</span>
                      </div>
                      <span className="text-slate-400 text-[11px] ml-4 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs font-mono">
                    No audit events yet. Click "Start Cycle" to run the agent daemon.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: VIEW APPLICATION DETAILS (USING UPLOADED CV) */}
      {/* ============================================================== */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {viewingApp.job?.title || 'Job Application'}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      viewingApp.status === 'APPLIED_CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : viewingApp.status === 'READY' || viewingApp.status === 'PREPARED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {viewingApp.status.replace('_', ' ')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Globe className="w-3 h-3 text-emerald-600" />
                    <span>Source: {viewingApp.source_name || viewingApp.job?.source_name || 'Direct Portal'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{viewingApp.job?.company_name || 'Employer'}</span>
                  <span>•</span>
                  <span>{viewingApp.job?.location || 'Remote'}</span>
                  {(viewingApp.job?.application_url || viewingApp.job?.canonical_url) && (
                    <>
                      <span>•</span>
                      <a
                        href={viewingApp.job?.application_url || viewingApp.job?.canonical_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Portal Posting</span>
                      </a>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setViewingApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
              <button
                onClick={() => setModalTab('resume')}
                className={`py-3 px-4 border-b-2 font-semibold text-xs transition-colors cursor-pointer ${
                  modalTab === 'resume'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Attached Uploaded CV
              </button>
              <button
                onClick={() => setModalTab('answers')}
                className={`py-3 px-4 border-b-2 font-semibold text-xs transition-colors cursor-pointer ${
                  modalTab === 'answers'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Screening Q&A ({viewingApp.answers?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/40">
              {modalTab === 'resume' && (
                <div className="space-y-4">
                  {/* Attached File Banner */}
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold text-emerald-950">
                          {viewingApp.resume_file_name || (resumes && resumes[0]?.file_name) || 'Uploaded Resume Attached'}
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          Using your verified original uploaded CV file (No AI embellishments)
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wide">
                      Original CV
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      CV Details & Verified Facts
                    </span>
                    <button
                      onClick={() => handleCopyResume(viewingApp.tailored_resume_text)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-white border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-800 leading-relaxed shadow-inner max-h-96 overflow-y-auto">
                    {viewingApp.tailored_resume_text ||
                      `Candidate Name: ${profile?.full_name || 'Candidate'}\nEmail: ${profile?.email}\nPhone: ${profile?.phone || 'Not provided'}\nAttached File: ${viewingApp.resume_file_name || (resumes && resumes[0]?.file_name) || 'arjun nair.pdf'}\n\nKEY VERIFIED SKILLS\n${profile?.skills?.join(', ') || 'Python, FastAPI, React'}\n\nSTATUS\nYour verified uploaded CV document will be transmitted directly with this application.`}
                  </pre>
                </div>
              )}

              {modalTab === 'answers' && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                    Application Screening Form Answers
                  </span>
                  {viewingApp.answers && viewingApp.answers.length > 0 ? (
                    viewingApp.answers.map((ans, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                        <div className="text-xs font-bold text-slate-900">{ans.question}</div>
                        <div className="text-xs text-slate-700 font-medium bg-slate-50 p-2 rounded-md border border-slate-100">
                          {ans.answer}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Standard candidate screening answers prepared from verified profile.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified with Zero-Hallucination Policy</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewingApp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                {(viewingApp.status === 'READY' || viewingApp.status === 'PREPARED') && (
                  <button
                    onClick={() => handleSubmitApplication(viewingApp.id)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Application Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
