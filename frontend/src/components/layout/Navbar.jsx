import React from 'react';
import {
  Bot,
  RefreshCw,
  ShieldCheck,
  Activity,
  Briefcase,
  CheckCircle2,
  UserCheck,
  Sliders,
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'jobs', label: 'Discovered Jobs', icon: Briefcase },
  { id: 'applications', label: 'Applications Tracker', icon: CheckCircle2 },
  { id: 'profile', label: 'Profile & CV Center', icon: UserCheck },
  { id: 'agent', label: 'Agent Search Settings', icon: Sliders },
];

export default function Navbar({ activeTab, setActiveTab, isRunning }) {
  return (
    <>
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                JobPilot AI
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isRunning && (
              <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-800">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span className="font-semibold">Agent Running (10 Jobs)...</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Hallucination Guard Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-8">
        {TABS.map((tab) => {
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
    </>
  );
}
