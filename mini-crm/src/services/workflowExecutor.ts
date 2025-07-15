import { Node, Edge } from 'reactflow';
import { ExecutionLogEntry } from '../types/workflow';
import { automationService } from './automation';

export const executeWorkflow = async (
  nodes: Node[], 
  edges: Edge[], 
  leadData: any
): Promise<ExecutionLogEntry[]> => {
  const executionLog: ExecutionLogEntry[] = [];

  const findNextNodes = (currentNodeId: string) => {
    return edges
      .filter(edge => edge.source === currentNodeId)
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter(node => node) as Node[];
  };

  const executeNode = async (node: Node) => {
    const timestamp = new Date().toLocaleTimeString();
   
    try {
      switch (node.type) {
        case 'trigger':
          executionLog.push({
            nodeId: node.id,
            type: 'trigger',
            message: `Workflow triggered: ${node.data.label} for lead ${leadData.name}`,
            timestamp,
            success: true
          });
          return { success: true, continueExecution: true };
         
        case 'action':
          let result;
          switch (node.data.actionType) {
            case 'send-email':
              result = await automationService.sendEmail(
                leadData.id,
                node.data.emailTemplate || 'welcome',
                node.data.emailSubject || 'Follow-up'
              );
              break;
             
            case 'update-status':
              const newStatus = node.data.newStatus || 'contacted';
              result = await automationService.updateLeadStatus(leadData.id, newStatus);
              if (result.success) {
                leadData.status = newStatus;
              }
              break;
             
            default:
              result = { success: true, message: 'Unknown action type' };
          }
         
          executionLog.push({
            nodeId: node.id,
            type: 'action',
            message: `${result.success ? 'Successfully executed' : 'Failed to execute'}: ${node.data.label} for ${leadData.name}`,
            timestamp,
            success: result.success
          });
         
          return { success: result.success, continueExecution: result.success };
         
        case 'condition':
          let conditionMet = false;
         
          switch (node.data.conditionType) {
            case 'status-check':
              const expectedStatus = node.data.expectedStatus || 'new';
              conditionMet = leadData.status === expectedStatus;
              break;
             
            case 'email-opened':
              conditionMet = Math.random() > 0.5;
              break;
             
            default:
              conditionMet = true;
          }
         
          executionLog.push({
            nodeId: node.id,
            type: 'condition',
            message: `Condition "${node.data.label}": ${conditionMet ? 'Met' : 'Not met'} (Expected: ${node.data.expectedStatus || 'new'}, Actual: ${leadData.status})`,
            timestamp,
            success: true,
            conditionResult: conditionMet
          });
         
          return { success: true, continueExecution: conditionMet };
         
        case 'delay':
          const delayTime = node.data.delayTime || 1000;
          await new Promise(resolve => setTimeout(resolve, delayTime));
         
          executionLog.push({
            nodeId: node.id,
            type: 'delay',
            message: `Delayed for ${delayTime/1000} seconds`,
            timestamp,
            success: true
          });
         
          return { success: true, continueExecution: true };
         
        default:
          executionLog.push({
            nodeId: node.id,
            type: 'unknown',
            message: `Unknown node type: ${node.type}`,
            timestamp,
            success: false
          });
          return { success: false, continueExecution: false };
      }
     
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
     
      executionLog.push({
        nodeId: node.id,
        type: node.type ?? 'unknown',
        message: `Error executing ${node.data.label}: ${errorMessage}`,
        timestamp,
        success: false
      });
      return { success: false, continueExecution: false };
    }
  };

  // Find trigger node and execute workflow
  const triggerNode = nodes.find(node => node.type === 'trigger');
  if (!triggerNode) {
    executionLog.push({
      nodeId: 'system',
      type: 'error',
      message: 'No trigger node found in workflow',
      timestamp: new Date().toLocaleTimeString(),
      success: false
    });
    return executionLog;
  }

  const executeSequentially = async (currentNodeId: string) => {
    const nextNodes = findNextNodes(currentNodeId);
   
    for (const node of nextNodes) {
      const result = await executeNode(node);
     
      if (result.continueExecution) {
        await executeSequentially(node.id);
      } else {
        executionLog.push({
          nodeId: node.id,
          type: 'flow-control',
          message: `Execution stopped at ${node.data.label} - ${result.success ? 'condition not met' : 'execution failed'}`,
          timestamp: new Date().toLocaleTimeString(),
          success: result.success
        });
        break;
      }
    }
  };

  const triggerResult = await executeNode(triggerNode);
  if (triggerResult.continueExecution) {
    await executeSequentially(triggerNode.id);
  }

  return executionLog;
};

// NEW: Function to trigger workflow for a specific lead and event type
export const triggerWorkflowForLead = async (
  leadData: any, 
  eventType: string
): Promise<ExecutionLogEntry[]> => {
  try {
    // Get workflows that match the trigger event
    const workflows = await getWorkflowsForTrigger(eventType);
    
    let allExecutionLogs: ExecutionLogEntry[] = [];
    
    // Execute all matching workflows
    for (const workflow of workflows) {
      const executionLog = await executeWorkflow(
        workflow.nodes, 
        workflow.edges, 
        leadData
      );
      allExecutionLogs = [...allExecutionLogs, ...executionLog];
    }
    
    return allExecutionLogs;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return [{
      nodeId: 'system',
      type: 'error',
      message: `Failed to trigger workflow: ${errorMessage}`,
      timestamp: new Date().toLocaleTimeString(),
      success: false
    }];
  }
};

// NEW: Define the workflow type
interface WorkflowDefinition {
  id: string;
  name: string;
  triggerEvent: string;
  nodes: Node[];
  edges: Edge[];
}

// NEW: Function to get workflows that should be triggered by specific events
export const getWorkflowsForTrigger = async (eventType: string): Promise<WorkflowDefinition[]> => {
  // This would typically fetch from your database
  // For now, returning a mock structure - replace with actual DB query
  
  // Example structure of what this should return:
  // You'll need to modify this based on how you store workflows
  const workflows: WorkflowDefinition[] = [
    {
      id: 'welcome-workflow',
      name: 'Welcome New Lead',
      triggerEvent: 'lead-created',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: { label: 'Lead Created', triggerEvent: 'lead-created' }
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 100, y: 200 },
          data: { 
            label: 'Send Welcome Email',
            actionType: 'send-email',
            emailTemplate: 'welcome',
            emailSubject: 'Welcome to our service!'
          }
        },
        {
          id: 'delay-1',
          type: 'delay',
          position: { x: 100, y: 300 },
          data: { label: 'Wait 1 hour', delayTime: 3600000 }
        },
        {
          id: 'action-2',
          type: 'action',
          position: { x: 100, y: 400 },
          data: {
            label: 'Update Status',
            actionType: 'update-status',
            newStatus: 'contacted'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'action-1' },
        { id: 'e2', source: 'action-1', target: 'delay-1' },
        { id: 'e3', source: 'delay-1', target: 'action-2' }
      ]
    }
  ];
  
  return workflows.filter(workflow => 
    workflow.triggerEvent === eventType
  );
};

// NEW: Alternative direct execution function if you want to execute a specific workflow
export const executeWorkflowById = async (
  workflowId: string,
  leadData: any
): Promise<ExecutionLogEntry[]> => {
  try {
    // Fetch specific workflow by ID from your database
    const workflow = await getWorkflowById(workflowId);
    
    if (!workflow) {
      return [{
        nodeId: 'system',
        type: 'error',
        message: `Workflow with ID ${workflowId} not found`,
        timestamp: new Date().toLocaleTimeString(),
        success: false
      }];
    }
    
    return await executeWorkflow(workflow.nodes, workflow.edges, leadData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return [{
      nodeId: 'system',
      type: 'error',
      message: `Failed to execute workflow: ${errorMessage}`,
      timestamp: new Date().toLocaleTimeString(),
      success: false
    }];
  }
};

// Placeholder for workflow fetching - replace with actual DB query
const getWorkflowById = async (workflowId: string): Promise<WorkflowDefinition | null> => {
  // Replace with actual database query
  // return await supabase.from('workflows').select('*').eq('id', workflowId).single();
  return null;
};