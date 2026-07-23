import React from 'react';
import { Clock, CheckCircle2, XCircle, UserCheck, Wrench } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  stepName?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, stepName }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'manager_approval':
      case 'pending':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
          label: stepName || 'Manager Review',
        };
      case 'staff_processing':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300',
          icon: <Wrench className="w-3.5 h-3.5 mr-1 animate-pulse" />,
          label: stepName || 'Staff Processing',
        };
      case 'completed':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
          label: 'Completed',
        };
      case 'rejected':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300',
          icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Rejected',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
          icon: <UserCheck className="w-3.5 h-3.5 mr-1" />,
          label: stepName || status,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      {config.icon}
      {config.label}
    </span>
  );
};
