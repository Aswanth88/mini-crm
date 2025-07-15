import { Mail, RefreshCw } from 'lucide-react';

export const actionTypes: Record<string, {
  label: string;
  description: string;
  icon: any;
  color: string;
}> = {
  'send-email': {
    label: 'Send Email',
    description: 'Send personalized email to lead',
    icon: Mail,
    color: 'bg-blue-500'
  },
  'update-status': {
    label: 'Update Status',
    description: 'Change lead status in CRM',
    icon: RefreshCw,
    color: 'bg-purple-500'
  },
};

export const conditionTypes: Record<string, { label: string; description: string }> = {
  'status-check': { label: 'Check Lead Status', description: 'Check if lead has specific status' },
  'email-opened': { label: 'Email Opened', description: 'Check if lead opened email' },
};

export const triggerTypes: Record<string, { label: string; description: string }> = {
  'lead-created': { label: 'Lead Created', description: 'When a new lead is created' },
  'form-submitted': { label: 'Form Submitted', description: 'When a form is submitted' },
};
