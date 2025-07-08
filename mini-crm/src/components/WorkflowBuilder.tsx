'use client';

import { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  //Panel,
  Node,
  Edge,
  Connection,
  NodeTypes,
} from 'reactflow';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  //Square, 
  GitBranch, 
  Bot, 
  Mail, 
  Phone, 
  Calendar,
  Save,
  Layout
} from 'lucide-react';
import dagre from 'dagre';

// Custom Node Components
const TriggerNode = ({ data }: { data: any }) => (
  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 min-w-[150px]">
    <div className="flex items-center gap-2">
      <Play className="h-4 w-4 text-green-600" />
      <span className="font-medium text-green-800">{data.label}</span>
    </div>
    <div className="text-xs text-green-600 mt-1">{data.description}</div>
  </div>
);

const ActionNode = ({ data }: { data: any }) => (
  <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-3 min-w-[150px]">
    <div className="flex items-center gap-2">
      {data.type === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
      {data.type === 'call' && <Phone className="h-4 w-4 text-blue-600" />}
      {data.type === 'meeting' && <Calendar className="h-4 w-4 text-blue-600" />}
      <span className="font-medium text-blue-800">{data.label}</span>
    </div>
    <div className="text-xs text-blue-600 mt-1">{data.description}</div>
  </div>
);

const ConditionNode = ({ data }: { data: any }) => (
  <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 min-w-[150px]">
    <div className="flex items-center gap-2">
      <GitBranch className="h-4 w-4 text-yellow-600" />
      <span className="font-medium text-yellow-800">{data.label}</span>
    </div>
    <div className="text-xs text-yellow-600 mt-1">{data.description}</div>
  </div>
);

const AINode = ({ data }: { data: any }) => (
  <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-3 min-w-[150px]">
    <div className="flex items-center gap-2">
      <Bot className="h-4 w-4 text-purple-600" />
      <span className="font-medium text-purple-800">{data.label}</span>
    </div>
    <div className="text-xs text-purple-600 mt-1">{data.description}</div>
  </div>
);

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  ai: AINode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: { 
      label: 'New Lead Added',
      description: 'Triggers when a new lead is added to CRM'
    },
  },
  {
    id: '2',
    type: 'ai',
    position: { x: 300, y: 100 },
    data: { 
      label: 'AI Lead Scoring',
      description: 'Analyze and score the lead using AI'
    },
  },
  {
    id: '3',
    type: 'condition',
    position: { x: 500, y: 100 },
    data: { 
      label: 'High Score?',
      description: 'Check if lead score > 80'
    },
  },
  {
    id: '4',
    type: 'action',
    position: { x: 700, y: 50 },
    data: { 
      label: 'Send Welcome Email',
      description: 'Send personalized welcome email',
      type: 'email'
    },
  },
  {
    id: '5',
    type: 'action',
    position: { x: 700, y: 150 },
    data: { 
      label: 'Schedule Follow-up',
      description: 'Schedule follow-up call in 2 days',
      type: 'call'
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
    label: 'Yes',
  },
  {
    id: 'e3-5',
    source: '3',
    target: '5',
    animated: true,
    style: { stroke: '#f59e0b', strokeWidth: 2 },
    label: 'No',
  },
];

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    }, eds));
  }, [setEdges]);

  const autoLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 80 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 90,
          y: nodeWithPosition.y - 40,
        },
      };
    });

    setNodes(newNodes);
  }, [nodes, edges, setNodes]);

  const saveWorkflow = useCallback(() => {
    const workflow = {
      nodes,
      edges,
      metadata: {
        created: new Date(),
        name: 'Lead Processing Workflow',
        version: '1.0'
      }
    };
    
    console.log('Saving workflow:', workflow);
    // In a real app, this would save to a database
  }, [nodes, edges]);

  const runWorkflow = useCallback(() => {
    setIsRunning(true);
    
    // Simulate workflow execution
    setTimeout(() => {
      setIsRunning(false);
      console.log('Workflow completed');
    }, 3000);
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const nodeTemplates = useMemo(() => [
    {
      type: 'trigger',
      label: 'New Lead',
      description: 'Triggers when a new lead is added',
      icon: Play,
    },
    {
      type: 'action',
      label: 'Send Email',
      description: 'Send automated email',
      icon: Mail,
    },
    {
      type: 'action',
      label: 'Make Call',
      description: 'Schedule or make a call',
      icon: Phone,
    },
    {
      type: 'condition',
      label: 'Check Score',
      description: 'Branch based on lead score',
      icon: GitBranch,
    },
    {
      type: 'ai',
      label: 'AI Analysis',
      description: 'Use AI to analyze or process',
      icon: Bot,
    },
  ], []);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Workflow Builder</h2>
        
        {/* Node Templates */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Node Templates</h3>
          <div className="space-y-2">
            {nodeTemplates.map((template) => (
  <motion.div
    key={template.type}
    whileHover={{ scale: 1.02 }}
    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
    draggable
    onDragStart={(e) => {
      const dragEvent = e as unknown as React.DragEvent;
      dragEvent.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    }}
  >
    <div className="flex items-center gap-3">
      <template.icon className="h-5 w-5 text-gray-600" />
      <div>
        <div className="font-medium">{template.label}</div>
        <div className="text-sm text-gray-600">{template.description}</div>
      </div>
    </div>
  </motion.div>
))}
          </div>
        </div>

        {/* Workflow Controls */}
        <div className="space-y-3">
          <Button onClick={runWorkflow} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Workflow
              </>
            )}
          </Button>
          
          <Button onClick={autoLayout} variant="outline" className="w-full">
            <Layout className="h-4 w-4 mr-2" />
            Auto Layout
          </Button>
          
          <Button onClick={saveWorkflow} variant="outline" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Workflow
          </Button>
        </div>

        {/* Node Properties */}
        {selectedNode && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Node Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Badge variant="outline" className="ml-2">
                    {selectedNode.type}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Label</label>
                  <div className="mt-1 text-sm">{selectedNode.data.label}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <div className="mt-1 text-sm text-gray-600">
                    {selectedNode.data.description}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Flow Area */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <Background color="#94a3b8" gap={20} />
          <Controls className="bg-white shadow-lg rounded-lg" />
          <MiniMap 
            nodeColor="#3b82f6"
            maskColor="rgba(0, 0, 0, 0.1)"
            className="bg-white shadow-lg rounded-lg"
          />
        </ReactFlow>
      </div>
    </div>
  );
}