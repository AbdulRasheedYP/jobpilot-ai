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
  Filter
} from 'lucide-react';

const API_BASE = '/api/v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [token, setToken] = useState(localStorage.getItem('jobpilot_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

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

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Authenticated API Fetch Helper
  const authFetch = async (endpoint, options = {}) => {
    const headers = {
      ...(options.headers || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      await performLogin('candidate@jobpilot.ai', 'password123');
      return null;
    }

    return response;
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
        setApplications(data.items || (Array.isArray(data) ? data : []));
      }
    } catch (e) {
      console.error(e);
    }
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
    showToast(`Uploading and extracting facts via Gemini: ${file.name}...`, 'info');

    try {
      const res = await authFetch('/resumes', {
        method: 'POST',
        body: formData,
      });

      if (res && res.ok) {
        const newResume = await res.json();
        showToast('CV parsed successfully! Review and confirm verified facts.', 'success');
        fetchResumes();
        fetchProfile();
        setSelectedResume(newResume);
      } else {
        showToast('Failed to parse resume.', 'error');
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
      }
    } catch (e) {
      showToast('Failed to confirm resume: ' + e.message, 'error');
    }
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

  const handlePrepareApplication = async (jobId) => {
    showToast('Generating tailored ATS resume & screening answers...', 'info');
    try {
      const res = await authFetch('/applications/prepare', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId }),
      });
      if (res && res.ok) {
        showToast('Application prepared without hallucinations!', 'success');
        fetchApplications();
        fetchDashboard();
        setActiveTab('applications');
      } else {
        const err = await res.json();
        showToast(err.detail?.message || 'Preparation failed', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
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
          showToast('CAPTCHA / bot barrier detected: Manual action required.', 'warning');
        } else {
          showToast(`Application updated: ${data.status}`, 'info');
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

  // Helper for resume parsed facts
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
        {/* TAB 2: DISCOVERED JOBS */}
        {/* ============================================================== */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Discovered Job Opportunities</h2>
                <p className="text-xs text-slate-500">Live feed deduplicated by canonical URL with explainable match scores.</p>
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
                  <span>Evaluate Match Scores</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {jobs.length > 0 ? (
                jobs.map((job) => {
                  const match = matches.find((m) => m.job_id === job.id);
                  return (
                    <div
                      key={job.id}
                      className="p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                          {job.is_remote && (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                              Remote
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                          <span className="font-semibold text-slate-800">{job.company_name}</span>
                          <span>•</span>
                          <span>{job.location || 'Remote'}</span>
                        </p>

                        {match && match.decision_reasons && match.decision_reasons.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-700 mb-1">Match Rationale:</p>
                            <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                              {match.decision_reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.skills_required &&
                            job.skills_required.map((s) => (
                              <span
                                key={s}
                                className="text-xs bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded-md"
                              >
                                {s}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="text-right">
                          <div className="text-2xl font-black text-emerald-600">
                            {match ? `${match.overall_score.toFixed(0)}%` : '—'}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">Decision Engine Fit</span>
                        </div>
                        <button
                          onClick={() => handlePrepareApplication(job.id)}
                          className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Prepare CV</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
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
                <p className="text-xs text-slate-500">Real-time status, verifiable employer submission receipts, and action items.</p>
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
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.length > 0 ? (
                    applications.map((app) => {
                      const jobTitle = app.job?.title || 'Software Developer';
                      const company = app.job?.company_name || 'Employer';
                      const receiptCode = app.confirmation_evidence?.receipt_code || '—';

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-900">
                            <div>{jobTitle}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{company}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                app.status === 'APPLIED_CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'PREPARED'
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
                          <td className="py-4 px-4">
                            {app.status === 'PREPARED' ? (
                              <button
                                onClick={() => handleSubmitApplication(app.id)}
                                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Submit</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">Locked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No applications prepared yet. Go to "Discovered Jobs" to tailor a CV!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PROFILE & CV CENTER (WITH CV UPLOAD & ZERO-HALLUCINATION) */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: CV Upload & Zero-Hallucination Review */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span>Upload Candidate CV</span>
                </h2>
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
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingResume ? 'Parsing...' : 'Upload File'}</span>
                </button>
              </div>

              {/* Zero-Hallucination Notice */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong className="font-bold">Zero-Hallucination Policy:</strong> The LLM parses your CV, but all facts must be verified by you below before being used in any job application.
                </div>
              </div>

              {/* Extracted Details */}
              {selectedResume ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{selectedResume.file_name}</span>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isResumeConfirmed(selectedResume)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isResumeConfirmed(selectedResume) ? 'Verified & Locked' : 'Pending Confirmation'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block">Full Name</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {profile?.full_name || 'Candidate User'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block">Email & Experience</span>
                    <span className="text-slate-800">
                      {profile?.email} • {profile?.experience?.length || 2} Roles Listed
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">Confirmed Technical Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {getResumeSkills(selectedResume).length > 0 ? (
                        getResumeSkills(selectedResume).map((s) => (
                          <span
                            key={s}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[11px]"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">No skills parsed yet</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleConfirmResume(selectedResume.id)}
                      disabled={isResumeConfirmed(selectedResume)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        isResumeConfirmed(selectedResume)
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isResumeConfirmed(selectedResume) ? 'Facts Verified (Ready for ATS)' : 'Confirm & Lock Extracted Facts'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  No resume uploaded yet. Click "Upload File" above to parse your CV with Google Gemini!
                </div>
              )}
            </div>

            {/* Right: Preferences Configuration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>Job Preferences & Constraints</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Target Roles</span>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences?.target_roles ? (
                      preferences.target_roles.map((r, i) => (
                        <span key={i} className="bg-slate-100 border border-slate-200 text-slate-800 font-medium px-2 py-0.5 rounded-md">
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">Software Engineer, Python Developer</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Minimum Match Threshold</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-emerald-600">{preferences?.min_match_score || 60}%</span>
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full" style={{ width: `${preferences?.min_match_score || 60}%` }}></div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Daily Application Limit</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {preferences?.daily_application_limit || 10} applications/day
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Target Locations</span>
                  <span className="text-slate-800">{preferences?.target_countries?.join(', ') || 'Remote, India'}</span>
                </div>
              </div>
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
    </div>
  );
}
