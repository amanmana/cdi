import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Shield, ExternalLink, HelpCircle } from 'lucide-react';

export const Footer: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <footer className={`mt-auto pt-10 pb-6 text-xs text-slate-400 font-medium ${className}`}>
      <div className="border-t border-slate-200/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Copyright */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
          <span className="font-extrabold text-slate-700 tracking-tight">CDI Portal</span>
          <span className="text-slate-300">•</span>
          <span>Corporate Communication & Identity</span>
          <span className="text-slate-300">•</span>
          <span>© 2026 All rights reserved</span>
        </div>

        {/* Right: Quick Links & Version Badge */}
        <div className="flex items-center flex-wrap justify-center gap-4">
          <Link
            to="/changelogs"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-[11px] transition-all border border-blue-200/80 shadow-2xs"
            title="View system changelogs"
          >
            <GitBranch className="w-3 h-3 text-blue-600" />
            <span>v1.6.0 Changelogs</span>
          </Link>

          <Link
            to="/track"
            className="hover:text-slate-700 transition-colors"
          >
            Track Ticket
          </Link>

          <Link
            to="/terms"
            className="hover:text-slate-700 transition-colors"
          >
            Terms & Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
};
