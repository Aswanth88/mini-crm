// src/lib/api.js
import { createClient } from "@supabase/supabase-js";
  // Import workflow trigger function
import { triggerWorkflowForLead } from '../services/workflowExecutor';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

////////////////////////
// 🔹 Lead Management
////////////////////////
export async function getLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createLead(lead) {
  const { data, error } = await supabase
    .from("leads")
    .insert([lead])
    .select()
    .single();
  
  if (error) throw error;
  
     triggerWorkflowForLead(data, 'lead-created');
  
  return data;
}

export async function updateLeadStatus(id, newStatus) {
  const { data, error } = await supabase
    .from("leads")
    .update({ 
      status: newStatus
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLead(id) {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}

////////////////////////
// 🔹 Workflow Management (Basic CRUD)
////////////////////////
export async function saveWorkflow(workflowData) {
  const { data, error } = await supabase
    .from('workflows')
    .insert([{
      name: workflowData.name,
      nodes: workflowData.nodes,
      edges: workflowData.edges,
      trigger_type: workflowData.triggerType || 'lead-created',
      status: 'active',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getWorkflows() {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActiveWorkflowsByTrigger(triggerType) {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('status', 'active');
  if (error) throw error;
  return data;
}

export async function logWorkflowExecution(workflowId, leadId, executionLog) {
  const { data, error } = await supabase
    .from('workflow_executions')
    .insert([{
      workflow_id: workflowId,
      lead_id: leadId,
      execution_log: executionLog,
      status: 'completed',
      executed_at: new Date().toISOString()
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

////////////////////////
// 🔹 Email Logs
////////////////////////
export async function getEmailLogsForLead(leadId) {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('lead_id', leadId)
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Log email attempts in database
export async function logEmailAttempt(leadId, to, subject, status, errorMessage = null) {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert([{
        lead_id: leadId,
        recipient: to,
        subject,
        status,
        error_message: errorMessage,
        sent_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to log email attempt:', error);
  }
}



////////////////////////
// 🔹 Meeting Management
////////////////////////
export async function getMeetings() {
  const { data, error } = await supabase
    .from("meetings")
    .select(`
      *,
      leads:lead_id (
        id,
        name,
        email,
        company
      )
    `)
    .order("scheduled_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createMeeting(meeting) {
  const { data, error } = await supabase
    .from("meetings")
    .insert([{
      ...meeting,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMeeting(id, updates) {
  const { data, error } = await supabase
    .from("meetings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMeeting(id) {
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) throw error;
}

export async function getMeetingsForLead(leadId) {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("lead_id", leadId)
    .order("scheduled_date", { ascending: true });
  if (error) throw error;
  return data;
}





// Company Management
export async function getCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCompany(company) {
  const { data, error } = await supabase
    .from("companies")
    .insert([company])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id, updates) {
  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCompany(id) {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}






////////////////////////
// 🔹 External API Calls (Python Backend)
////////////////////////
const PYTHON_API_BASE = "http://localhost:8000";

////////////////////////
// 🔹 OCR Processing
////////////////////////
export async function extractLeadFromFile(file) {
  console.log('extractLeadFromFile called with:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  });

  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/bmp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Supported types: ${allowedTypes.join(', ')}`);
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB');
  }

  const formData = new FormData();
  formData.append("file", file);

  console.log('Sending request to:', `${PYTHON_API_BASE}/ocr`);

  try {
    const response = await fetch(`${PYTHON_API_BASE}/ocr`, {
      method: "POST",
      body: formData,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || `OCR processing failed: ${response.status}`);
      } catch (parseError) {
        throw new Error(`OCR processing failed: ${response.status} - ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('OCR result:', result);
    
    if (!result.success) {
      throw new Error(result.message || "OCR processing failed");
    }

    return result;
  } catch (error) {
    console.error('Network or processing error:', error);
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to OCR service. Please ensure the Python backend is running on http://localhost:8000');
    }
    
    throw error;
  }
}

export async function processMultipleFiles(files) {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  if (files.length > 10) {
    throw new Error("Maximum 10 files allowed per batch");
  }

  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append("files", file);
  });

  const response = await fetch(`${PYTHON_API_BASE}/ocr/batch`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Batch OCR processing failed: ${response.status}`);
  }

  return await response.json();
}

export async function testOCRConnection() {
  try {
    const response = await fetch(`${PYTHON_API_BASE}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Cannot connect to OCR service: ${error.message}`);
  }
}

export async function testOCRAPI() {
  const response = await fetch(`${PYTHON_API_BASE}/test-api`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API test failed: ${response.status}`);
  }

  return await response.json();
}

export async function interactWithLLM(query, lead) {
  const res = await fetch(`${PYTHON_API_BASE}/llm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, lead }),
  });
  if (!res.ok) throw new Error("LLM interaction failed");
  return await res.json();
}