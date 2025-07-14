// src/lib/automation.js
import { updateLeadStatus, supabase } from './api';
import { sendEmailViaResend, EMAIL_TEMPLATES, isValidEmail } from './emailService';

////////////////////////
// 🔹 Enhanced Automation Service
////////////////////////
export const automationService = {
  async sendEmail(leadId, template = 'welcome', customSubject = null) {
    try {
      console.log(`Sending email for lead ${leadId} with template ${template}`);
      
      const lead = await this.getLeadData(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      // Validate email address
      if (!lead.email || !isValidEmail(lead.email)) {
        throw new Error('Invalid email address');
      }

      const emailTemplate = EMAIL_TEMPLATES[template] || EMAIL_TEMPLATES.welcome;
      const subject = customSubject || emailTemplate.subject.replace('{{name}}', lead.name);
      const htmlContent = emailTemplate.html.replace(/{{name}}/g, lead.name);
      
      console.log(`Sending email to ${lead.email} with subject: ${subject}`);
      
      const result = await sendEmailViaResend(lead.email, subject, htmlContent, leadId);
      
      if (result.success) {
        console.log('Email sent successfully, updating lead status');
        // Only update status if email was actually sent
        await this.updateLeadStatus(leadId, 'contacted');
      }
      
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  },

  async updateLeadStatus(leadId, status) {
    try {
      console.log(`Updating lead ${leadId} status to: ${status}`);
      const result = await updateLeadStatus(leadId, status);
      console.log('Lead status updated successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('Status update failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getLeadData(leadId) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch lead data:', error);
      return null;
    }
  }
};