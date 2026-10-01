import React from 'react';
import { ShieldCheck, UserCheck, Laptop, Building2, Sparkles, CheckCircle2 } from 'lucide-react';

const ROLES = [
  {
    id: 'HR Manager',
    title: 'HR Manager',
    badge: 'Full Governance',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: ShieldCheck,
    iconColor: 'text-purple-400',
    description: 'Supreme oversight. Can authorize all onboarding processes, add recruits, and override any department.',
    accessText: 'Access: All Tables (Employees, HR, IT, Facilities)'
  },
  {
    id: 'HR',
    title: 'HR Specialist',
    badge: 'People & Compliance',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: UserCheck,
    iconColor: 'text-emerald-400',
    description: 'Manages candidate records, NDA compliance, background verification (BGV), and payroll activation.',
    accessText: 'Access: Employees & HR Compliance'
  },
  {
    id: 'IT',
    title: 'IT Administrator',
    badge: 'Security & Systems',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: Laptop,
    iconColor: 'text-blue-400',
    description: 'Provisions enterprise SSO, GitHub team invites, AWS sandboxes, VPN credentials, and clears blockers.',
    accessText: 'Access: IT Provisioning Table'
  },
  {
    id: 'Facilities',
    title: 'Workplace & Facilities',
    badge: 'Logistics & Gear',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Building2,
    iconColor: 'text-amber-400',
    description: 'Handles hardware assignments (MacBook / Dell), equipment tracking, shipping dispatch, and security badges.',
    accessText: 'Access: Workplace Logistics Table'
  }
];

export default function LoginModal({ isOpen, currentRole, onSelectRole, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-indigo-500/10 p-6 md:p-8">
        
        {/* Glow decorative element */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Role-Based Access Control</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Select Your Orchestrator Persona
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-lg mx-auto">
            Choose a persona to experience strict role governance, autonomous agent tooling, and human-in-the-loop approvals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = currentRole === role.id;

            return (
              <button
                key={role.id}
                onClick={() => {
                  onSelectRole(role.id);
                  if (onClose) onClose();
                }}
                className={`relative flex flex-col items-start text-left p-5 rounded-xl border transition-all duration-200 group ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 ${role.iconColor} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-base flex items-center gap-2">
                        {role.title}
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border mt-0.5 ${role.badgeColor}`}>
                        {role.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed mb-3">
                  {role.description}
                </p>

                <div className="mt-auto pt-2 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{role.accessText}</span>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">Select &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>

        {currentRole && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Continue as <span className="text-indigo-400 font-medium">{currentRole}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
