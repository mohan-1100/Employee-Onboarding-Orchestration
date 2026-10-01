import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Briefcase, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Building,
  User,
  Sparkles
} from 'lucide-react';

export default function RecruitList({ employees, onSelectEmployee, selectedEmployeeId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');

  const departments = ['All', ...new Set(employees.map(e => e.department))];

  // Helper to determine status category (checking 100% completion first!)
  const getEmployeeStatus = (emp) => {
    const is100Percent = emp.is_completed || emp.completed_tasks === emp.total_tasks || emp.progress_percentage === 100;
    if (is100Percent) return 'Done';
    if (emp.days_until_start < 2) return 'Critical';
    if (emp.days_until_start < 4) return 'At Risk';
    return 'On Track';
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = filterDepartment === 'All' || emp.department === filterDepartment;
    
    const status = getEmployeeStatus(emp);
    const matchesRisk = filterRisk === 'All' || status === filterRisk;

    return matchesSearch && matchesDept && matchesRisk;
  });

  // Compact Risk Indicator with Square / Checkmark
  const getCompactStatusTag = (emp) => {
    const is100Percent = emp.is_completed || emp.completed_tasks === emp.total_tasks || emp.progress_percentage === 100;

    // Rule: Bypass risk calculation for 100% completed recruits!
    if (is100Percent) {
      return (
        <span 
          title="100% Completed (All tasks finished)" 
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Done</span>
        </span>
      );
    }

    const days = emp.days_until_start;

    if (days < 2) {
      return (
        <span 
          title={`< 2 days remaining (${days}d left)`} 
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 shadow-sm"
        >
          <span className="w-2 h-2 rounded-[2px] bg-red-500 animate-pulse shrink-0" />
          <span>Critical</span>
        </span>
      );
    } else if (days < 4) {
      return (
        <span 
          title={`< 4 days remaining (${days}d left)`} 
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm"
        >
          <span className="w-2 h-2 rounded-[2px] bg-amber-400 shrink-0" />
          <span>At Risk</span>
        </span>
      );
    } else {
      return (
        <span 
          title={`> 4 days remaining (${days}d left)`} 
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm"
        >
          <span className="w-2 h-2 rounded-[2px] bg-emerald-400 shrink-0" />
          <span>On Track</span>
        </span>
      );
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-5 shadow-xl w-full min-w-0 overflow-hidden">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 w-full min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Onboarding Recruits Pipeline</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono shrink-0">
              {filteredEmployees.length} of {employees.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            Click any recruit to open the read-only process inspector.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search recruits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d === 'All' ? 'All Depts' : d}</option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Done">🟢 Done (100%)</option>
            <option value="Critical">🔴 Critical (&lt;2d)</option>
            <option value="At Risk">🟡 At Risk (&lt;4d)</option>
            <option value="On Track">🟢 On Track (&gt;4d)</option>
          </select>
        </div>
      </div>

      {/* Recruits List Table / Cards */}
      <div className="space-y-3 w-full min-w-0">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No recruits found matching your filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setFilterDepartment('All'); setFilterRisk('All'); }}
              className="text-xs text-indigo-400 hover:underline mt-2 inline-block"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const isSelected = selectedEmployeeId === emp.id;
            const is100Percent = emp.is_completed || emp.completed_tasks === emp.total_tasks || emp.progress_percentage === 100;
            const initials = emp.full_name
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={emp.id}
                onClick={() => onSelectEmployee(emp)}
                className={`group relative p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer w-full min-w-0 overflow-hidden ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500/50 shadow-lg' 
                    : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
                  
                  {/* Left: Avatar & Identity with min-w-0 truncation */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/80 text-white font-bold text-xs shadow-md group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                      {initials}
                      {is100Percent && (
                        <CheckCircle2 className="absolute -top-1 -right-1 w-3.5 h-3.5 text-emerald-400 bg-slate-950 rounded-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors truncate">
                          {emp.full_name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono shrink-0">
                          #{emp.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        <span className="text-slate-300">{emp.role}</span>
                        <span className="mx-1 text-slate-600">•</span>
                        <span className="text-slate-400">{emp.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle-Right Controls Container: Progress, Compact Risk Tag & Action Arrow */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-850">
                    
                    {/* Progress fraction and bar */}
                    <div className="w-28 sm:w-32 shrink-0">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-slate-300">
                          Tasks: <strong className="text-indigo-400 font-mono">{emp.progress_fraction}</strong>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {emp.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            is100Percent
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                          }`}
                          style={{ width: `${emp.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Compact Risk Indicator (Shrink-0, no overflow) */}
                    <div className="shrink-0 flex items-center">
                      {getCompactStatusTag(emp)}
                    </div>

                    {/* Arrow */}
                    <ChevronRight className={`w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 ${isSelected ? 'rotate-90 text-indigo-400' : ''}`} />

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
