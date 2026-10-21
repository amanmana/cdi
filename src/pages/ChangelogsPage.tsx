import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, GitBranch, Calendar } from 'lucide-react';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const changelogsData: ChangelogEntry[] = [
  {
    version: '1.6.0',
    date: '2026-10-21',
    items: [
      'Feature: Multi-Unit Department Scope — Reorganized organization structure into Departments (Design Department covering Graphic & Web Units; Corp. Comm. covering Social Media & Writer Units).',
      'Feature: Cross-Unit Staff Assignment — Department Managers can view all department job requests and assign tasks to staff across any sub-unit within their department.',
      'Feature: Direct 4-Unit Selection with Department Tags — Public Job Request form directly displays 4 core units with Department tags on top for rapid client selection.',
      'Feature: Custom Public Display Labels — Admins can set customer-facing unit labels for public requests (e.g. "Graphic Design", "Web Development & Portal", "Social Media Management", "Copywriting & Content").',
      'Feature: Unit Visibility Toggles — Admin setting to hide internal or dormant units (e.g., Administrator, Industrial Design 3D) from public job request submission.',
      'Feature: Unit Head Delegation — Designated Unit Heads (Ketua Unit) receive assignments from Managers and coordinate project tasks & staff invitations.',
      'Feature: Departments & Org Structure Admin Panel — New dedicated admin management view to create/edit departments, assign managers, configure units, and designate unit heads.',
      'Feature: User Email & Profile Editing — Enabled users across all roles to edit their registered email address and profile details directly from My Profile & Security.',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-10-21',
    items: [
      'Feature: Global Email Feature Switch — Added master ON/OFF toggle in System Settings allowing Admins to disable email dispatch during testing/development.',
      'Security: Secret Key Rotation — Migrated Cloudflare Turnstile Secret Key to environment secrets with production validation.',
      'Layout: Director Dashboard Grid Optimization — Reorganized executive KPI cards into a balanced 2-row, 3-column layout.',
      'Feature: Expanded KPI Summary Cards — Added dedicated "On Hold" and "Cancelled" metric cards across Admin, Manager, and Client dashboards.',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-10-20',
    items: [
      'Feature: Top Navigation Notification Bell — Real-time notification system with unread count badges and popover dropdown exclusively for Staff.',
      'Feature: Dynamic "NEW" Job Badges — Pulsing visual indicator for newly assigned, unopened jobs that auto-clears once viewed.',
      'Fix: Shared Read State Sync — Unified opened_jobs state synchronization across job tables, detail views, and bell notifications.',
      'Feature: All Jobs Tab — Added "ALL JOBS" tab filter to view both active processing requests and historical records.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-10-20',
    items: [
      'Feature: Status Reason Card — Prominent callout card on Job Request Detail page showing explicit hold reasons, cancellation notes, or rejection comments.',
      'Feature: Client On Hold Email Notifications — Automated email dispatch to clients when requests are placed on hold with reason details.',
      'Feature: Interactive KPI Drill-downs — Clickable dashboard summary cards that instantly filter the job requests list.',
      'Improvement: Executive Dashboard Timeframe — Defaulted metrics and charts to current operational year (2026).',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-08-11',
    items: [
      'Feature: Selective Team Invitation Emails — Automated email dispatch with instructions and deadlines sent only to newly assigned staff members.',
      'Feature: Dynamic Email Templates — Context-aware email content tailored to whether the assigner is a Manager or a Staff Lead.',
      'Feature: Manager Delegation Workflow — Temporary manager delegation functionality allowing designated staff to act as interim managers.',
      'Feature: External Client Projects Analytics — Direct tracking of project counts per external client with one-click drill-downs.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-07-30',
    items: [
      'Feature: Dynamic Unit Form Builder — Customizable form schema builder per unit with custom fields (text, textarea, select, radio, checkbox, date).',
      'Feature: Live Form Preview — Interactive real-time preview of customized forms as clients see them.',
      'Feature: Weekly Staff Reports — Comprehensive reporting system with task logging and submission workflow.',
      'Feature: Database Backup & Restore — JSON backup export and restore with schema validation.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-28',
    items: [
      'Initial Release: Complete Corporate Communication & Identity (CDI) Request Management System.',
      'Public Portal: Public job request submission with Cloudflare Turnstile anti-bot protection and unique ticket tracking (#INTxxxxxx, #PRxxxxxx).',
      'Workflow Engine: Multi-stage approval lifecycle (Manager Approval -> Staff Processing -> Review -> Completed).',
      'Role-based Access Control: Comprehensive permissions for Admin, Director, Manager, Staff, and Client roles.',
      'Cloudflare Edge Infrastructure: Built on Cloudflare Workers, D1 distributed SQL database, and Vite React frontend.',
    ],
  },
];

export const ChangelogsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user ? '/portal' : '/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-slate-50 to-slate-50 antialiased flex flex-col justify-between">
      <div className="max-w-4xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{user ? 'Back to Portal' : 'Back to Home'}</span>
          </button>
        </div>

        {/* Title Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Changelogs
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Track of major updates, enhancements, and releases
          </p>
        </div>

        {/* Main Content Container matching Image 2 reference */}
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Corporate Communication & Identity (CDI) Portal
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Production Release History
            </p>
          </div>

          <div className="space-y-7">
            {changelogsData.map((log) => (
              <div key={log.version} className="space-y-2.5">
                {/* Version Title format matching image: = 7.6.5 - 2026-04-03 = */}
                <div className="font-mono text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>= {log.version} - {log.date} =</span>
                  {log.version === changelogsData[0].version && (
                    <span className="font-sans text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wider">
                      Latest Release
                    </span>
                  )}
                </div>

                {/* Box Panel with monospace bullet list */}
                <div className="bg-slate-50/70 rounded-2xl p-4 md:p-5 border border-slate-200/80 font-mono text-xs md:text-[13px] text-slate-800 leading-relaxed shadow-2xs">
                  <ul className="space-y-2 list-none p-0 m-0">
                    {log.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-slate-400 select-none">-</span>
                        <span className="flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reusable Footer */}
        <Footer className="max-w-4xl mx-auto" />
      </div>
    </div>
  );
};
