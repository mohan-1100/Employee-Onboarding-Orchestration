import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import MetricCards from './components/MetricCards';
import RecruitList from './components/RecruitList';
import RecruitDetailModal from './components/RecruitDetailModal';
import ChatPanel from './components/ChatPanel';
import Toast from './components/Toast';

// Base API URL: Supports Vercel environment variable (for separate deployments) or falls back to relative /api
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export default function App() {
  const [currentRole, setCurrentRole] = useState('HR Manager');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  
  const [employees, setEmployees] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdatingDetail, setIsUpdatingDetail] = useState(false);

  // Chat & Human-In-The-Loop proposal states
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: "👋 Welcome to **OrchestrAI**! I'm your autonomous Onboarding Orchestrator powered by CrewAI. Type any command to onboard recruits, activate IT credentials, or coordinate equipment dispatch.\n\n🛡️ **Strict Governance Active**: All mutations generate a structured diff proposal requiring your manual confirmation before writing to the database.",
      role: 'System'
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeProposal, setActiveProposal] = useState(null);
  const [isConfirmingProposal, setIsConfirmingProposal] = useState(false);

  const [toast, setToast] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch employees and metrics from FastAPI backend
  const fetchDashboardData = async () => {
    try {
      const [empRes, metRes] = await Promise.all([
        fetch(`${API_BASE}/api/employees`),
        fetch(`${API_BASE}/api/metrics`)
      ]);

      if (empRes.ok && metRes.ok) {
        const empData = await empRes.json();
        const metData = await metRes.json();
        setEmployees(empData);
        setMetrics(metData);

        // Keep selected employee in sync if modal is open
        if (selectedEmployee) {
          const updated = empData.find(e => e.id === selectedEmployee.id);
          if (updated) setSelectedEmployee(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Send message to AI Chat Endpoint
  const handleSendMessage = async (text) => {
    // Append user message
    const userMsg = { sender: 'user', text, role: currentRole };
    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role: currentRole
        })
      });

      const data = await res.json();

      const agentMsg = {
        sender: 'agent',
        text: data.reply,
        requires_approval: data.requires_approval,
        is_error: data.is_error,
        proposal: data.proposal
      };

      setMessages(prev => [...prev, agentMsg]);

      if (data.requires_approval && data.proposal) {
        setActiveProposal(data.proposal);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: 'Error communicating with AI agent backend. Please check server logs.',
          is_error: true
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Human-in-the-loop: Confirm & Apply diff mutation
  const handleConfirmProposal = async () => {
    if (!activeProposal) return;
    setIsConfirmingProposal(true);

    try {
      const res = await fetch(`${API_BASE}/api/actions/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal: activeProposal,
          user_role: currentRole
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Confirmation failed');
      }

      const result = await res.json();
      showToast('success', 'Changes Applied to Database', result.message);

      // Append success message to chat
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `✅ **Database Mutation Confirmed**: ${result.message}\nAction silently logged to \`audit_logs\`. Dashboard updated live.`,
          is_error: false
        }
      ]);

      setActiveProposal(null);
      await fetchDashboardData();
    } catch (err) {
      showToast('error', 'Action Rejected', err.message);
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `❌ Execution Failed: ${err.message}`,
          is_error: true
        }
      ]);
    } finally {
      setIsConfirmingProposal(false);
    }
  };

  // Cancel staged proposal
  const handleCancelProposal = () => {
    setActiveProposal(null);
    setMessages(prev => [
      ...prev,
      {
        sender: 'agent',
        text: '🚫 Staged database mutation was cancelled by human operator. No records were modified.',
        is_error: false
      }
    ]);
    showToast('info', 'Mutation Cancelled', 'Staged changes were discarded.');
  };

  // Direct field update from Detail Modal (subject to same RBAC)
  const handleUpdateProcess = async (employeeId, table, fields) => {
    setIsUpdatingDetail(true);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${employeeId}/process`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table,
          fields,
          user_role: currentRole
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Update failed');
      }

      const updatedEmp = await res.json();
      setSelectedEmployee(updatedEmp);
      showToast('success', 'Process Updated', `Updated ${table} for ${updatedEmp.full_name}. Action logged to audit_logs.`);
      await fetchDashboardData();
    } catch (err) {
      showToast('error', 'Access Denied', err.message);
    } finally {
      setIsUpdatingDetail(false);
    }
  };

  // Reset database seed data
  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reset-data`, { method: 'POST' });
      if (res.ok) {
        showToast('success', 'Demo Cohort Reset', 'Database successfully restored to clean initial recruit cohort.');
        await fetchDashboardData();
      }
    } catch (err) {
      showToast('error', 'Reset Error', 'Failed to reset database.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onResetData={handleResetData}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Metric Cards Row */}
        <MetricCards metrics={metrics} employees={employees} />

        {/* Dashboard 2-Column Split: Recruits Pipeline (Left) & AI Command Interface (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
          
          {/* Left Column: Recruits List (7 cols) */}
          <div className="lg:col-span-7 min-w-0 w-full overflow-hidden">
            <RecruitList
              employees={employees}
              onSelectEmployee={(emp) => {
                setSelectedEmployee(emp);
                setIsDetailOpen(true);
              }}
              selectedEmployeeId={selectedEmployee?.id}
            />
          </div>

          {/* Right Column: AI Chat & Approval Card (5 cols) */}
          <div className="lg:col-span-5 min-w-0 w-full">
            <ChatPanel
              currentRole={currentRole}
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              activeProposal={activeProposal}
              onConfirmProposal={handleConfirmProposal}
              onCancelProposal={handleCancelProposal}
              isConfirming={isConfirmingProposal}
              onClearChat={() => setMessages([])}
            />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>
          OrchestrAI Enterprise • AI-Agent-Driven Onboarding Governance • Built for IT Enterprise Hackathon
        </p>
      </footer>

      {/* Role Selection Persona Modal */}
      <LoginModal
        isOpen={isRoleModalOpen}
        currentRole={currentRole}
        onSelectRole={(role) => {
          setCurrentRole(role);
          setIsRoleModalOpen(false);
          showToast('info', 'Role Switched', `Now acting as ${role}`);
        }}
        onClose={() => setIsRoleModalOpen(false)}
      />

      {/* Recruit Detail Inspector Modal (Strictly Read-Only) */}
      <RecruitDetailModal
        employee={selectedEmployee}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        currentRole={currentRole}
      />

      {/* Floating Feedback Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
