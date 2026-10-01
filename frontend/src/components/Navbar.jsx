import React from 'react';
import { 
  Bot, 
  ShieldCheck, 
  UserCheck, 
  Laptop, 
  Building2, 
  RotateCcw, 
  Users2, 
  Lock,
  ChevronDown
} from 'lucide-react';

const ROLE_BADGES = {
  'HR Manager': {
    label: 'HR Manager',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: ShieldCheck,
    iconColor: 'text-purple-400'
  },
  'HR': {
    label: 'HR Specialist',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: UserCheck,
    iconColor: 'text-emerald-400'
  },
  'IT': {
    label: 'IT Administrator',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: Laptop,
    iconColor: 'text-blue-400'
  },
  'Facilities': {
    label: 'Workplace Facilities',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Building2,
    iconColor: 'text-amber-400'
  }
};

export default function Navbar({ currentRole, onOpenRoleModal, onResetData, isResetting }) {
  const roleConfig = ROLE_BADGES[currentRole] || ROLE_BADGES['HR Manager'];
  const RoleIcon = roleConfig.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Orchestr<span className="text-indigo-400">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  v2.4 Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Autonomous Employee Onboarding Governance & Orchestration
              </p>
            </div>
          </div>

          {/* Right Controls: Role Switcher & Reset */}
          <div className="flex items-center gap-3">
            {/* Agent Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px]">CrewAI + OpenRouter Engine</span>
            </div>

            {/* Reset Seed Button */}
            <button
              onClick={onResetData}
              disabled={isResetting}
              title="Reset Database to Clean Demo Cohort"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Reset Demo</span>
            </button>

            {/* Active Persona Badge & Switcher */}
            <button
              onClick={onOpenRoleModal}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-150 ${roleConfig.badgeClass} hover:opacity-90 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <RoleIcon className={`w-4 h-4 ${roleConfig.iconColor}`} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">Active Persona</div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1">
                    {roleConfig.label}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
