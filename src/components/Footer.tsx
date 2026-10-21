import React from 'react';
import { Link } from 'react-router-dom';

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

        {/* Right: Quick Links */}
        <div className="flex items-center flex-wrap justify-center gap-5">
          <Link
            to="/track"
            className="hover:text-blue-600 transition-colors font-semibold"
          >
            Track Ticket
          </Link>

          <Link
            to="/terms"
            className="hover:text-blue-600 transition-colors font-semibold"
          >
            Terms & Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
};
