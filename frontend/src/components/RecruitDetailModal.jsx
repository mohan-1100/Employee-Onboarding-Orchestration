import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Laptop, 
  Building2, 
  Lock, 
  Info,
  Sparkles,
  Bot
} from 'lucide-react';

export default function RecruitDetailModal({ 
  employee, 
  isOpen, 
  onClose, 
  currentRole
}) {
  if (!isOpen || !employee) return null;

  const hr = employee.hr_compliance || {};
  const it = employee.it_provisioning || {};
  const fac = employee.workplace_logistics || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Profile Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono font-medium border border-indigo-500/30">
                Recruit #{employee.id}
              </span>
              <span className="text-xs text-slate-400">
                Start Date: <strong className="text-slate-200 font-mono">{employee.start_date}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              {employee.full_name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="text-slate-300 font-medium">{employee.role}</span>
              <span>•</span>
              <span>{employee.department}</span>
              <span>•</span>
              <span className="text-indigo-400 font-mono">{employee.email}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {employee.work_mode}
              </span>
            </div>
          </div>

          {/* Progress Badge */}
          <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium uppercase">Overall Progress</div>
              <div className="text-lg font-bold text-white flex items-center justify-end gap-1.5">
                <span className="text-indigo-400 font-mono">Tasks: {employee.progress_fraction}</span>
                <span className="text-xs text-slate-400">({employee.progress_percentage}%)</span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${
              employee.is_completed
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
            }`}>
              {employee.progress_percentage}%
            </div>
          </div>
        </div>

        {/* Governance Enforcement Notice */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-slate-300 leading-relaxed">
            <strong className="text-white font-semibold">Strict Governance Policy: </strong>
            This inspector is <span className="text-indigo-300 font-medium">strictly read-only</span>. To preserve enterprise audit integrity, no direct database writes are permitted from this modal. All status updates must be requested through the <span className="text-indigo-300 font-medium">AI Agent Chat</span> and verified via the <span className="text-emerald-300 font-medium">Human-in-the-Loop Diff & Approval flow</span>.
          </div>
        </div>

        {/* 3 Department Panels Grid (Strictly Read-Only) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          
          {/* ========================================================= */}
          {/* 1. HR Compliance Panel */}
          {/* ========================================================= */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white text-sm">HR Compliance</h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 font-medium">
                <Lock className="w-3 h-3 text-slate-400" /> Read-Only
              </span>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* NDA Signed */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-300">NDA Agreement</span>
                {hr.nda_signed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Signed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Clock className="w-3 h-3" /> Pending Sign
                  </span>
                )}
              </div>

              {/* BGV Status */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Background Verification</span>
                  {hr.bgv_status === 'Verified' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Verified (Cleared)
                    </span>
                  ) : hr.bgv_status === 'In Progress' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Clock className="w-3 h-3" /> In Progress
                    </span>
                  ) : hr.bgv_status === 'Failed' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
                      <AlertCircle className="w-3 h-3" /> Failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Payroll Ready */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-300">Payroll Setup</span>
                {hr.payroll_ready ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Activated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Clock className="w-3 h-3" /> Unconfigured
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. IT Provisioning Panel */}
          {/* ========================================================= */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">IT Provisioning</h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 font-medium">
                <Lock className="w-3 h-3 text-slate-400" /> Read-Only
              </span>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* SSO Active */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-300">Okta / SSO Active</span>
                {it.sso_account_active ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                    Inactive
                  </span>
                )}
              </div>

              {/* GitHub Invited */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-300">GitHub Org Invited</span>
                {it.github_invited ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Invited
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                    Pending
                  </span>
                )}
              </div>

              {/* AWS Sandbox */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-300">AWS Sandbox Ready</span>
                {it.aws_sandbox_ready ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Provisioned
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                    Pending
                  </span>
                )}
              </div>

              {/* VPN Profile */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-300">VPN Profile Issued</span>
                {it.vpn_profile_issued ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Issued
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                    Pending
                  </span>
                )}
              </div>

              {/* Ticket Blocker */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Ticket Blocker</span>
                  {it.ticket_blocker && it.ticket_blocker !== 'None' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-red-500/15 border border-red-500/30 text-red-400">
                      <AlertTriangle className="w-3 h-3" /> {it.ticket_blocker}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                      None (Clear)
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. Workplace Logistics Panel */}
          {/* ========================================================= */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white text-sm">Workplace Logistics</h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 font-medium">
                <Lock className="w-3 h-3 text-slate-400" /> Read-Only
              </span>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* Laptop Assigned */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Laptop Hardware Assigned</span>
                <span className="text-xs font-semibold text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 block truncate font-mono">
                  {fac.laptop_assigned || 'Pending Allocation'}
                </span>
              </div>

              {/* Shipping Status */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-300">Equipment Dispatch</span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  fac.shipping_status === 'Delivered' 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                    : fac.shipping_status === 'Shipped' || fac.shipping_status === 'In Transit'
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                    : fac.shipping_status === 'Pickup Scheduled'
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {fac.shipping_status || 'Pending'}
                </span>
              </div>

              {/* Building Badge Issued */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-300">Building Access Badge</span>
                {fac.building_badge_issued ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Active Badge
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                    Not Issued
                  </span>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions & Instructions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              To modify any value, type in the AI Assistant chat (e.g. <em className="text-slate-300">"Activate SSO and GitHub for {employee.full_name}"</em>).
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-white font-medium rounded-xl border border-slate-700/80 transition-colors shrink-0"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
