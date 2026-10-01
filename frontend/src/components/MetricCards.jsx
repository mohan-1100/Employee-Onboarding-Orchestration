import React from 'react';
import { Users, CheckCircle2, Clock, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

export default function MetricCards({ metrics, employees = [] }) {
  const total = metrics?.total_recruits ?? employees.length;
  const completed = metrics?.completed_recruits ?? employees.filter(e => e.is_completed).length;
  const uncompleted = metrics?.uncompleted_recruits ?? (total - completed);
  
  const critical = metrics?.critical_count ?? employees.filter(e => e.risk_level === 'Critical').length;
  const atRisk = metrics?.at_risk_count ?? employees.filter(e => e.risk_level === 'At Risk').length;
  const onTrack = metrics?.on_track_count ?? employees.filter(e => e.risk_level === 'On Track').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      
      {/* 1. Total Recruits Card */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-900/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Recruits</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{total}</h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <span>Active onboarding pipeline</span>
          <span className="text-indigo-400 font-semibold">{total} in cohort</span>
        </div>
      </div>

      {/* 2. Completed Recruits Card */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-900/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Completed Recruits</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{completed}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <span>12/12 Criteria fulfilled</span>
          <span className="text-emerald-400 font-semibold">{completionRate}% Ready</span>
        </div>
      </div>

      {/* 3. Uncompleted Recruits Card (with Risk Breakdown) */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-900/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Uncompleted Recruits</p>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{uncompleted}</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800/80 text-[11px]">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
            🔴 {critical} Critical (&lt;2d)
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
            🟡 {atRisk} At Risk (&lt;4d)
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
            🟢 {onTrack} On Track
          </span>
        </div>
      </div>

    </div>
  );
}
