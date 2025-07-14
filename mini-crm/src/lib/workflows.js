// src/lib/workflows.js
import { 
  getActiveWorkflowsByTrigger, 
  logWorkflowExecution, 
  getEmailLogsForLead,
  updateLeadStatus,
  supabase
} from './api';
import { automationService } from './automation';

////////////////////////
// 🔹 Workflow Execution Engine
////////////////////////
export async function executeWorkflow(nodes, edges, leadData, workflowId = null) {
  const executionLog = [];
  console.log(`Starting workflow execution for lead: ${leadData.name}`);
  
  const findNextNodes = (currentNodeId) => {
    return edges
      .filter(edge => edge.source === currentNodeId)
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter(node => node);
  };
  
  const executeNode = async (node) => {
    const timestamp = new Date().toISOString();
    console.log(`Executing node: ${node.data.label} (${node.type})`);
    
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
          let result = { success: false };
          
          switch (node.data.actionType) {
            case 'send-email':
              console.log(`Executing send-email action for lead ${leadData.id}`);
              result = await automationService.sendEmail(
                leadData.id, 
                node.data.emailTemplate || 'welcome',
                node.data.emailSubject
              );
              console.log(`Email action result:`, result);
              break;
              
            case 'update-status':
              console.log(`Executing update-status action for lead ${leadData.id}`);
              result = await automationService.updateLeadStatus(
                leadData.id,
                node.data.newStatus || 'contacted'
              );
              // Update leadData status for subsequent nodes
              if (result.success) {
                leadData.status = node.data.newStatus || 'contacted';
                console.log(`Lead status updated to: ${leadData.status}`);
              }
              break;
              
            default:
              console.log(`Unknown action type: ${node.data.actionType}`);
              result = { success: true, message: 'Unknown action type' };
          }
          
          executionLog.push({
            nodeId: node.id,
            type: 'action',
            message: `${result.success ? 'Successfully executed' : 'Failed to execute'}: ${node.data.label}`,
            timestamp,
            success: result.success,
            details: result.error || result.message
          });
          
          return { success: result.success, continueExecution: result.success };
          
        case 'condition':
          // Evaluate condition based on lead data
          let conditionMet = false;
          
          switch (node.data.conditionType) {
            case 'status-check':
              const expectedStatus = node.data.expectedStatus || 'new';
              conditionMet = leadData.status === expectedStatus;
              console.log(`Status check: Expected ${expectedStatus}, Got ${leadData.status}, Met: ${conditionMet}`);
              break;
              
            case 'email-opened':
              // Check if lead has opened previous emails
              const emailLogs = await getEmailLogsForLead(leadData.id);
              conditionMet = emailLogs.some(log => log.opened);
              console.log(`Email opened check: ${conditionMet}`);
              break;
              
            default:
              conditionMet = true; // Default to true for unknown conditions
              console.log(`Unknown condition type, defaulting to true`);
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
          const delayTime = node.data.delayTime || 30000; // Default 30 seconds
          const actualDelay = Math.min(delayTime, 5000); // Max 5 seconds for demo
          console.log(`Delaying for ${actualDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, actualDelay));
          
          executionLog.push({
            nodeId: node.id,
            type: 'delay',
            message: `Delayed for ${actualDelay/1000} seconds`,
            timestamp,
            success: true
          });
          
          return { success: true, continueExecution: true };
          
        default:
          console.log(`Unknown node type: ${node.type}`);
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
      console.error(`Error executing node ${node.data.label}:`, error);
      executionLog.push({
        nodeId: node.id,
        type: node.type,
        message: `Error executing ${node.data.label}: ${error.message}`,
        timestamp,
        success: false,
        error: error.message
      });
      return { success: false, continueExecution: false };
    }
  };
  
  // Find trigger node
  const triggerNode = nodes.find(node => node.type === 'trigger');
  if (!triggerNode) {
    console.error('No trigger node found in workflow');
    executionLog.push({
      nodeId: 'system',
      type: 'error',
      message: 'No trigger node found in workflow',
      timestamp: new Date().toISOString(),
      success: false
    });
    return executionLog;
  }
  
  // Execute workflow with proper flow control
  const executeSequentially = async (currentNodeId) => {
    const nextNodes = findNextNodes(currentNodeId);
    console.log(`Found ${nextNodes.length} next nodes for ${currentNodeId}`);
    
    for (const node of nextNodes) {
      const result = await executeNode(node);
      
      // Only continue to next nodes if execution should continue
      if (result.continueExecution) {
        await executeSequentially(node.id);
      } else {
        // Log why execution stopped
        console.log(`Execution stopped at ${node.data.label}`);
        executionLog.push({
          nodeId: node.id,
          type: 'flow-control',
          message: `Execution stopped at ${node.data.label} - ${result.success ? 'condition not met' : 'execution failed'}`,
          timestamp: new Date().toISOString(),
          success: result.success
        });
      }
    }
  };
  
  // Start execution
  console.log('Starting workflow execution from trigger node');
  const triggerResult = await executeNode(triggerNode);
  if (triggerResult.continueExecution) {
    await executeSequentially(triggerNode.id);
  }
  
  // Log execution in database
  if (workflowId) {
    try {
      await logWorkflowExecution(workflowId, leadData.id, executionLog);
      console.log('Workflow execution logged to database');
    } catch (error) {
      console.error('Failed to log workflow execution:', error);
    }
  }
  
  console.log('Workflow execution completed');
  return executionLog;
}

////////////////////////
// 🔹 Workflow Trigger System
////////////////////////
export async function triggerWorkflowForLead(leadData, triggerType) {
  try {
    const workflows = await getActiveWorkflowsByTrigger(triggerType);
    
    for (const workflow of workflows) {
      console.log(`Executing workflow: ${workflow.name} for lead: ${leadData.name}`);
      
      // Execute workflow in background
      setTimeout(async () => {
        try {
          await executeWorkflow(workflow.nodes, workflow.edges, leadData, workflow.id);
        } catch (error) {
          console.error(`Failed to execute workflow ${workflow.id}:`, error);
        }
      }, 1000); // Small delay to ensure lead is fully created
    }
  } catch (error) {
    console.error('Failed to trigger workflows:', error);
  }
}