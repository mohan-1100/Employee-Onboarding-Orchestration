import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Database, 
  Sparkles, 
  ShieldAlert, 
  Layers,
  TableProperties
} from 'lucide-react';

export default function DiffApprovalCard({ 
  proposal, 
  onConfirm, 
  onCancel, 
  isConfirming 
}) {
  if (!proposal) return null;

  const isInsert = proposal.action_type === 'INSERT_EMPLOYEE';
  const cascades = proposal.cascade_defaults;

  return (
    <div className="rounded-xl border border-indigo-500/40 bg-slate-900/90 shadow-2xl p-4 sm:p-5 my-3 relative overflow-hidden ring-1 ring-indigo-500/20">
      
      {/* Decorative accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Human-In-The-Loop Governance
            </span>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Staged Action:</span>
              <span className="font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs">
                {proposal.action_type}
              </span>
            </h4>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Target Schema</span>
          <span className="text-xs font-mono font-bold text-slate-200">
            public.{proposal.target_table}
          </span>
        </div>
      </div>

      {/* Summary Explanation */}
      <p className="text-xs text-slate-300 mb-4 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
        {proposal.explanation}
      </p>

      {/* Primary Staged Diff Table */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
          <TableProperties className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isInsert ? 'New Record Attributes' : `Field Mutations for #${proposal.target_employee_id} (${proposal.target_employee_name})`}</span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2 px-3 font-medium">Field</th>
                {!isInsert && <th className="py-2 px-3 font-medium">Previous Value</th>}
                <th className="py-2 px-3 font-medium text-emerald-400">Proposed Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono text-xs">
              {Object.entries(proposal.field_changes).map(([field, newVal]) => {
                const prevVal = proposal.previous_values ? proposal.previous_values[field] : undefined;
                return (
                  <tr key={field} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-slate-300 font-medium">{field}</td>
                    {!isInsert && (
                      <td className="py-2 px-3 text-rose-400/80 line-through">
                        {prevVal !== undefined ? String(prevVal) : 'null'}
                      </td>
                    )}
                    <td className="py-2 px-3 text-emerald-300 font-bold bg-emerald-500/5">
                      {typeof newVal === 'boolean' ? (newVal ? 'true' : 'false') : String(newVal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Cascading Preview (for INSERT_EMPLOYEE) */}
      {isInsert && cascades && (
        <div className="mb-4 p-3 rounded-lg border border-purple-500/30 bg-purple-950/20">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-purple-300">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Role-Based Cascading Provisioning Preview</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200">
              Automated Inserts
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2.5">
            Upon your confirmation, the backend will cascade default records into 3 additional operational tables based on this recruit's role:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            {/* HR Compliance cascade */}
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">hr_compliance</span>
              <ul className="text-slate-400 space-y-0.5">
                <li>nda: {String(cascades.hr_compliance?.nda_signed)}</li>
                <li>bgv: {cascades.hr_compliance?.bgv_status}</li>
                <li>payroll: {String(cascades.hr_compliance?.payroll_ready)}</li>
              </ul>
            </div>

            {/* IT Provisioning cascade */}
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-blue-400 font-bold block mb-1">it_provisioning</span>
              <ul className="text-slate-400 space-y-0.5">
                <li>sso: {String(cascades.it_provisioning?.sso_account_active)}</li>
                <li>github: {String(cascades.it_provisioning?.github_invited)}</li>
                <li>aws: {String(cascades.it_provisioning?.aws_sandbox_ready)}</li>
                <li>vpn: {String(cascades.it_provisioning?.vpn_profile_issued)}</li>
              </ul>
            </div>

            {/* Workplace Logistics cascade */}
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-amber-400 font-bold block mb-1">workplace_logistics</span>
              <ul className="text-slate-400 space-y-0.5">
                <li className="truncate">laptop: {cascades.workplace_logistics?.laptop_assigned}</li>
                <li>ship: {cascades.workplace_logistics?.shipping_status}</li>
                <li>badge: {String(cascades.workplace_logistics?.building_badge_issued)}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons: Confirm & Apply vs Cancel */}
      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isConfirming}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50"
        >
          <XCircle className="w-4 h-4 text-slate-400" />
          <span>Cancel</span>
        </button>

        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 active:scale-95"
        >
          <CheckCircle className={`w-4 h-4 ${isConfirming ? 'animate-spin' : ''}`} />
          <span>{isConfirming ? 'Mutating Database...' : 'Confirm & Apply'}</span>
        </button>
      </div>

    </div>
  );
}
