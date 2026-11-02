import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  Activity, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthStatus, setHealthStatus] = useState({ status: 'checking', message: 'Checking backend...' });

  useEffect(() => {
    // Check backend health status
    fetch('/api/v1/health')
      .then((res) => {
        if (!res.ok) throw new Error('Backend offline');
        return res.json();
      })
      .then((data) => {
        setHealthStatus({ status: 'healthy', message: 'Backend connected' });
      })
      .catch((err) => {
        setHealthStatus({ status: 'offline', message: 'Backend not running (normal during setup)' });
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">JobPilot AI</h1>
              <p className="text-xs text-slate-500 font-medium">Personal Job Search & Application Agent</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border bg-slate-50 border-slate-200">
              <span 
                className={`w-2 h-2 rounded-full ${
                  healthStatus.status === 'healthy' 
                    ? 'bg-emerald-500 animate-pulse' 
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-600 font-medium">{healthStatus.message}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Hallucination Guard Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Navigation Tabs */}
        <nav className="flex space-x-2 border-b border-slate-200 pb-3 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'profile', label: 'Profile & CV', icon: FileText },
            { id: 'jobs', label: 'Jobs & Matches', icon: Briefcase },
            { id: 'applications', label: 'Application Tracker', icon: CheckCircle2 },
            { id: 'agent', label: 'Agent Controls', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Placeholder (Scaffold) */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2 capitalize">
              {activeTab} Overview
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              JobPilot AI frontend is initialized with React + Vite + Tailwind CSS. 
              The application strictly enforces candidate truthfulness and deterministic eligibility checks before any application activity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Market</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">India & International Roles</p>
              </div>
              <div className="p-4 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Core Engine</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">Deterministic Matching & LangGraph</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        JobPilot AI &bull; Personal AI Job Search & Application Agent &bull; React + Tailwind
      </footer>
    </div>
  );
}
