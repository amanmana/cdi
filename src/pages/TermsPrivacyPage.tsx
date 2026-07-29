import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';

export const TermsPrivacyPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(
    location.pathname.includes('/privacy') ? 'privacy' : 'terms'
  );

  useEffect(() => {
    if (location.pathname.includes('/privacy')) {
      setActiveTab('privacy');
    } else if (location.pathname.includes('/terms')) {
      setActiveTab('terms');
    }
  }, [location.pathname]);

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-50/50 p-4 md:p-10 antialiased">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Registration
          </Link>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-slate-100/80 text-left space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Terms of Service & Privacy Policy
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Corporate Communication & Identity (CDI) Management System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pt-4">
            <button
              onClick={() => setActiveTab('terms')}
              className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'terms'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              Terms of Service
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'privacy'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Lock className="w-4 h-4" />
              Privacy Policy
            </button>
          </div>

          {/* Content Area */}
          <div className="pt-4 text-slate-700 text-xs leading-relaxed space-y-6">
            {activeTab === 'terms' ? (
              <>
                <section className="space-y-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    1. Acceptance of Terms
                  </h2>
                  <p>
                    By creating an account or accessing the Corporate Communication & Identity (CDI) Portal, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not access or use this portal.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    2. User Responsibilities & Account Security
                  </h2>
                  <p>
                    Users are responsible for maintaining the confidentiality of their login credentials and for all activities conducted through their registered account. You agree to provide accurate, truthful information during registration, including your full name, valid email address, company/department, and phone number.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    3. Service Usage & Job Request Submissions
                  </h2>
                  <p>
                    The CDI Portal provides job request submission, tracking, and SLA management for corporate communications, graphic design, video production, social media, and related services. All requested tasks must comply with organizational guidelines and professional standards.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    4. Intellectual Property & Confidentiality
                  </h2>
                  <p>
                    All creative deliverables, designs, media assets, and strategic documents submitted or processed through the CDI Portal remain the intellectual property of the organization. Users shall respect the confidentiality of proprietary project briefs and internal communications.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    1. Personal Information Collection
                  </h2>
                  <p>
                    We collect necessary personal data required to operate the CDI Portal, including your full name, email address, company/organization name, contact phone number, and account credentials.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    2. Purpose of Data Processing (PDPA Compliance)
                  </h2>
                  <p>
                    Your data is processed strictly for authenticating your user account, managing job request workflows, notifying you of project status updates, and generating executive resource demand metrics.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    3. Security & Cloudflare Turnstile Verification
                  </h2>
                  <p>
                    We employ modern encryption standards, secure session tokens, and Cloudflare Turnstile anti-bot security to protect your account against unauthorized access, automated spam, and data breaches.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    4. Data Retention & Access Rights
                  </h2>
                  <p>
                    Your user profile and submission history are retained for operational record-keeping. You may request access to or updates of your personal profile details by contacting the System Administrator.
                  </p>
                </section>
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] font-semibold text-slate-400">
          Last updated: July 2026 • Corporate Communication & Identity (CDI) System
        </div>

      </div>
    </div>
  );
};
