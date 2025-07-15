import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Workflow, 
  Plus, 
  Play, 
  Save, 
  Trash2, 
  Mail, 
  RefreshCw, 
  Zap,
  Target,
  Settings,
  CheckCircle,
  Clock,
  MessageSquare,
  Phone,
  AlertCircle,
  Layers,
  Edit3,
  Bell,
  Globe,
  GitBranch,
  Filter,
  Loader2,
  Box,
  Terminal
} from 'lucide-react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Node,
  Edge,
  Connection,
  MarkerType,
  ConnectionMode,
  BackgroundVariant,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

import { getLeads } from '@/lib/api';
import { toast } from 'sonner';
import { nodeTypes } from '../types/nodeTypes';
import { executeWorkflow } from '../services/workflowExecutor';
import { actionTypes, conditionTypes } from '../types/workflowTypes';

// Workflow storage using React state
interface StoredWorkflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  lastModified: Date;
  status: 'active' | 'inactive';
  description?: string;
}



const WorkflowBuilder = () => {

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 50, y: 200 },
      data: { label: 'Lead Created' },
    },
  ]);
  
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeId, setNodeId] = useState(2);
  const [selectedNodeType, setSelectedNodeType] = useState('action');
  const [selectedAction, setSelectedAction] = useState('send-email');
  const [workflowName, setWorkflowName] = useState('Welcome Email');
  const [executionLog, setExecutionLog] = useState<Array<{
    nodeId: string;
    type: string;
    message: string;
    timestamp: string;
    success: boolean;    
    conditionResult?: boolean;
    leadName?: string;  // Add this
    leadId?: string; 
  }>>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeConfig, setNodeConfig] = useState<any>({});
  
  // Workflow storage state
  const [savedWorkflows, setSavedWorkflows] = useState<StoredWorkflow[]>([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [showWorkflowList, setShowWorkflowList] = useState(false);
  const [workflowDescription, setWorkflowDescription] = useState('');

  
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      if (!params.source || !params.target) return;

      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: params.source,
        target: params.target,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          stroke: '#3b82f6', 
          strokeWidth: 2 
        },
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );
  
  const addNode = () => {
    if (nodes.length >= 8) {
      alert('Maximum of 7 nodes allowed in this demo');
      return;
    }

    const newNode: Node = {
      id: `node-${nodeId}`,
      type: selectedNodeType,
      position: { 
        x: 300 + (nodeId * 200), 
        y: 200 + (Math.random() * 100 - 50) 
      },
      data: selectedNodeType === 'action'
        ? {
            label: actionTypes[selectedAction]?.label || 'Action',
            description: actionTypes[selectedAction]?.description || 'Action description',
            actionType: selectedAction
          }
        : selectedNodeType === 'condition'
        ? {
            label: conditionTypes[selectedAction]?.label || 'Condition',
            description: conditionTypes[selectedAction]?.description || 'Condition description',
            conditionType: selectedAction
          }
        : {
            label: 'Delay 30 seconds',
            description: 'Wait before next action',
            delayTime: 30000
          },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeId((id) => id + 1);
  };    
  const createNewWorkflow = () => {
    setNodes([
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 50, y: 200 },
        data: { label: 'Lead Created' },
      },
    ]);
    setEdges([]);
    setExecutionLog([]);
    setNodeId(2);
    setWorkflowName('New Workflow');
    setWorkflowDescription('');
    setCurrentWorkflowId(null);
    setSelectedNode(null);
  };

  const saveWorkflow = () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    const workflowData: StoredWorkflow = {
      id: currentWorkflowId || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      nodes: nodes,
      edges: edges,
      createdAt: currentWorkflowId 
        ? savedWorkflows.find(w => w.id === currentWorkflowId)?.createdAt || new Date()
        : new Date(),
      lastModified: new Date(),
      status: 'active',
    };

    setSavedWorkflows(prev => {
      const existing = prev.findIndex(w => w.id === workflowData.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = workflowData;
        return updated;
      } else {
        return [...prev, workflowData];
      }
    });

    setCurrentWorkflowId(workflowData.id);
    alert(`Workflow "${workflowName}" saved successfully!`);
  };

  const loadWorkflow = (workflow: StoredWorkflow) => {
    setNodes(workflow.nodes);
    setEdges(workflow.edges);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setCurrentWorkflowId(workflow.id);
    setExecutionLog([]);
    setSelectedNode(null);
    setShowWorkflowList(false);
  };

  const deleteWorkflow = (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      setSavedWorkflows(prev => prev.filter(w => w.id !== workflowId));
      if (currentWorkflowId === workflowId) {
        createNewWorkflow();
      }
    }
  };

  const duplicateWorkflow = (workflow: StoredWorkflow) => {
    const duplicated: StoredWorkflow = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      name: `${workflow.name} (Copy)`,
      createdAt: new Date(),
      lastModified: new Date(),
    };
    
    setSavedWorkflows(prev => [...prev, duplicated]);
    alert(`Workflow duplicated as "${duplicated.name}"`);
  };

  const toggleWorkflowStatus = (workflowId: string) => {
    setSavedWorkflows(prev => 
      prev.map(w => 
        w.id === workflowId 
          ? { ...w, status: w.status === 'active' ? 'inactive' : 'active', lastModified: new Date() }
          : w
      )
    );
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === 'trigger-1') return;
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };
  
  const saveWorkflowToState = () => {
    const workflowData = {
      id: Date.now().toString(),
      name: workflowName,
      nodes: nodes,
      edges: edges,
      createdAt: new Date(),
    };
    
    console.log('Saving workflow:', workflowData);
    alert('Workflow saved successfully!');
  };
  
  const executeWorkflowDemo = async () => {
  setIsExecuting(true);
  setExecutionLog([]);
  
  try {
    const leads = await getLeads();
    if (leads.length === 0) {
      setExecutionLog([{
        nodeId: 'system',
        type: 'error',
        message: 'No leads found in database. Please add a lead first.',
        timestamp: new Date().toLocaleTimeString(),
        success: false
      }]);
      return;
    }
    
    // Execute workflow for all leads
    const allLogs = [];
    for (const lead of leads) {
       const log = await executeWorkflow(nodes, edges, lead);
  // Add lead identifier to each log entry
       const leadLogs = log.map(entry => ({
       ...entry,
       leadName: lead.name,
       leadId: lead.id
     }));
  allLogs.push(...leadLogs);
}
setExecutionLog(allLogs);

    // Toast on execution
  toast.success('Workflow executed successfully!');

  } catch (error) {
    // Fix: Proper error handling for unknown type
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    console.error('Workflow execution error:', error);
    setExecutionLog([{
      nodeId: 'system',
      type: 'error',
      message: `Failed to fetch lead data: ${errorMessage}`,
      timestamp: new Date().toLocaleTimeString(),
      success: false
    }]);

    // Toast on execution error
    toast.error('Workflow execution failed!');
  } finally {
    setIsExecuting(false);
  }
};
  
  const clearWorkflow = () => {
    if (confirm('Are you sure you want to clear the current workflow?')) {
      createNewWorkflow();
    }
  };

  const onNodeClick = (event: any, node: Node) => {
    setSelectedNode(node);
    setNodeConfig(node.data);
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...config } }
          : node
      )
    );
  };

  useEffect(() => {
  const saved = localStorage.getItem('savedWorkflows');
  if (saved) {
    try {
      const parsedWorkflows = JSON.parse(saved).map((w: any) => ({
        ...w,
        createdAt: new Date(w.createdAt),
        lastModified: new Date(w.lastModified)
      }));
      setSavedWorkflows(parsedWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  }
}, []);

// Save workflows to localStorage whenever savedWorkflows changes
   useEffect(() => {
      if (savedWorkflows.length > 0) {
      localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows));
    }
  }, [savedWorkflows]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <Card className="mb-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Workflow className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Workflow Builder
                  </h1>
                  <p className="text-gray-600 mt-1">Design intelligent automation workflows</p>
                  {currentWorkflowId && (
                    <Badge variant="outline" className="mt-2">
                      Editing: {workflowName}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowWorkflowList(!showWorkflowList)}
                  className="bg-white hover:bg-gray-50"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Workflows ({savedWorkflows.length})
                </Button>
                <Button 
                  variant="outline" 
                  onClick={createNewWorkflow}
                  className="bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearWorkflow}
                  className="bg-white hover:bg-gray-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={saveWorkflow}
                  className="bg-white hover:bg-gray-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button
                  variant="default"
                  onClick={executeWorkflowDemo}
                  disabled={isExecuting}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Workflow List Modal */}
        {showWorkflowList && (
          <Card className="mb-6 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-6 w-6" />
                  Saved Workflows ({savedWorkflows.length})
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowWorkflowList(false)}
                  className="text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {savedWorkflows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No workflows saved yet</p>
                  <p className="text-sm">Create your first workflow to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedWorkflows.map((workflow) => (
                    <div 
                      key={workflow.id}
                      className="group relative p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{workflow.name}</h3>
                          {workflow.description && (
                            <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={workflow.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {workflow.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {workflow.nodes.length} nodes
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWorkflowStatus(workflow.id)}
                          className={`text-xs ${
                            workflow.status === 'active' 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {workflow.status === 'active' ? 'Active' : 'Inactive'}
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-3">
                        <div>Created: {workflow.createdAt.toLocaleDateString()}</div>
                        <div>Modified: {workflow.lastModified.toLocaleDateString()}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => loadWorkflow(workflow)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          Load
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => duplicateWorkflow(workflow)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Copy
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteWorkflow(workflow.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Workflow Settings */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Workflow Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="workflow-name" className="text-sm font-medium text-gray-700">
                    Workflow Name
                  </Label>
                  <Input
                    id="workflow-name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Enter workflow name"
                    className="mt-1"
                  />
                </div>
                <div>
                <Label htmlFor="workflow-description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="workflow-description"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe what this workflow does..."
                  className="mt-1"
                  rows={3}
                />
              </div>
                
                <div>
                  <Label htmlFor="node-type" className="text-sm font-medium text-gray-700">
                    Node Type
                  </Label>
                  <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="action">Action</SelectItem>
                      <SelectItem value="condition">Condition</SelectItem>
                      <SelectItem value="delay">Delay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="action-type" className="text-sm font-medium text-gray-700">
                    {selectedNodeType === 'action' ? 'Action Type' : 
                     selectedNodeType === 'condition' ? 'Condition Type' : 'Delay Type'}
                  </Label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedNodeType === 'action' ? 
                        Object.entries(actionTypes).map(([key, action]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <action.icon className="h-4 w-4" />
                              {action.label}
                            </div>
                          </SelectItem>
                        )) :
                        selectedNodeType === 'condition' ?
                        Object.entries(conditionTypes).map(([key, condition]) => (
                          <SelectItem key={key} value={key}>
                            {condition.label}
                          </SelectItem>
                        )) :
                        <SelectItem value="delay">Time Delay</SelectItem>
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={addNode} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Node
                </Button>
              </CardContent>
            </Card>

            {/* Node Configuration */}
            {selectedNode && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Node Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Node: {selectedNode.data.label}
                    </Label>
                  </div>
                  
                  {selectedNode.data.actionType === 'send-email' && (
                    <>
                      <div>
                        <Label htmlFor="email-subject" className="text-sm font-medium text-gray-700">
                          Email Subject
                        </Label>
                        <Input
                          id="email-subject"
                          value={nodeConfig.emailSubject || ''}
                          onChange={(e) => setNodeConfig({...nodeConfig, emailSubject: e.target.value})}
                          placeholder="Enter email subject"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email-template" className="text-sm font-medium text-gray-700">
                          Email Template
                        </Label>
                        <Select 
                          value={nodeConfig.emailTemplate || 'welcome'} 
                          onValueChange={(value) => setNodeConfig({...nodeConfig, emailTemplate: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="welcome">Welcome Email</SelectItem>
                            <SelectItem value="followup">Follow-up Email</SelectItem>
                            <SelectItem value="qualified">Qualified Lead Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedNode.data.conditionType === 'status-check' && (
  <div>
    <Label htmlFor="expected-status" className="text-sm font-medium text-gray-700">
      Expected Status
    </Label>
    <Select
      value={nodeConfig.expectedStatus || 'new'}
      onValueChange={(value) => setNodeConfig({...nodeConfig, expectedStatus: value})}
    >
      <SelectTrigger className="mt-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="new">New</SelectItem>
        <SelectItem value="contacted">Contacted</SelectItem>
        <SelectItem value="qualified">Qualified</SelectItem>
        <SelectItem value="converted">Converted</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}

{selectedNode.data.actionType === 'update-status' && (
  <div>
    <Label htmlFor="new-status" className="text-sm font-medium text-gray-700">
      New Status
    </Label>
    <Select
      value={nodeConfig.newStatus || 'contacted'}
      onValueChange={(value) => setNodeConfig({...nodeConfig, newStatus: value})}
    >
      <SelectTrigger className="mt-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="contacted">Contacted</SelectItem>
        <SelectItem value="qualified">Qualified</SelectItem>
        <SelectItem value="converted">Converted</SelectItem>
        <SelectItem value="closed">Closed</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}
                  
                  <Button 
                    onClick={() => updateNodeConfig(selectedNode.id, nodeConfig)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    Update Configuration
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Enhanced React Flow Canvas */}
          <Card className="lg:col-span-3 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="h-6 w-6" />
                Workflow Canvas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] rounded-b-lg overflow-hidden">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  nodeTypes={nodeTypes}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  className="bg-gradient-to-br from-gray-50 to-gray-100"
                  defaultEdgeOptions={{
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { stroke: '#3b82f6', strokeWidth: 2 },
                    animated: true,
                  }}
                >
                  <Controls className="bg-white shadow-lg border border-gray-200 rounded-lg" />
                  <MiniMap 
                    className="bg-white shadow-lg border border-gray-200 rounded-lg"
                    nodeColor={(node) => {
                      switch (node.type) {
                        case 'trigger': return '#3b82f6';
                        case 'action': return '#10b981';
                        case 'condition': return '#f59e0b';
                        case 'delay': return '#8b5cf6';
                        default: return '#6b7280';
                      }
                    }}
                  />
                  <Background variant={'dots' as BackgroundVariant} gap={20} size={1} color="#e5e7eb" />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Enhanced Node Management */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="h-6 w-6" />
              Workflow Nodes ({nodes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nodes.map((node) => (
                <div 
                  key={node.id}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg shadow-sm ${
                      node.type === 'trigger' ? 'bg-blue-100 text-blue-600' :
                      node.type === 'action' ? 'bg-green-100 text-green-600' :
                      node.type === 'condition' ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {node.type === 'trigger' && <Target className="h-5 w-5" />}
                      {node.type === 'action' && <Zap className="h-5 w-5" />}
                      {node.type === 'condition' && <Settings className="h-5 w-5" />}
                      {node.type === 'delay' && <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      {typeof node.type === 'string' && (
                      <Badge variant={node.type === 'trigger' ? 'default' : 'secondary'} className="mb-2">
                        {node.type.toUpperCase()}
                      </Badge>
                      )}
                      <div className="font-semibold text-gray-900">{node.data.label}</div>
                      
                    </div>
                  </div>
                  {node.id !== 'trigger-1' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteNode(node.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Enhanced Execution Log */}
        {executionLog.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Execution Log ({executionLog.length} steps)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {executionLog.map((log, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-xl border-l-4 transition-all duration-300 ${
                      log.success 
                        ? 'bg-green-50 border-green-400 hover:bg-green-100' 
                        : 'bg-red-50 border-red-400 hover:bg-red-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      log.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {log.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${
                        log.success ? 'text-green-800' : 'text-red-800'
                       }`}>
                      {log.leadName && `[${log.leadName}] `}{log.message}
                    </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {log.type.toUpperCase()}
                        </Badge>
                        <span className={`text-xs ${
                          log.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflow Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Nodes</p>
                  <p className="text-3xl font-bold">{nodes.length}</p>
                </div>
                <Layers className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Connections</p>
                  <p className="text-3xl font-bold">{edges.length}</p>
                </div>
                <Target className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Executions</p>
                  <p className="text-3xl font-bold">{executionLog.length}</p>
                </div>
                <Play className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-6 shadow-lg border-0 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
              <AlertCircle className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Building Your Workflow</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Start with the trigger node (already added)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Add action nodes for automated tasks
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Use conditions to create smart branching
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Add delays between actions as needed
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Connecting Nodes</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Drag from output handle to input handle
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Click nodes to configure their settings
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Use the test button to simulate execution
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Save your workflow when complete
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowBuilder;