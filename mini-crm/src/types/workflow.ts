import { Edge } from "reactflow";

export interface StoredWorkflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  lastModified: Date;
  status: 'active' | 'inactive';
  description?: string;
}

export type WorkflowNodeData = {
  label: string;
  description?: string;
  actionType?: string;
  conditionType?: string;
  emailTemplate?: string;
  emailSubject?: string;
  smsMessage?: string;
  newStatus?: string;
  taskTitle?: string;
  taskDescription?: string;
  delayTime?: number;
  expectedStatus?: string;
};

export interface ExecutionLogEntry {
  nodeId: string;
  type: string;
  message: string;
  timestamp: string;
  success: boolean;
  conditionResult?: boolean;
  leadName?: string;
  leadId?: string;
}
