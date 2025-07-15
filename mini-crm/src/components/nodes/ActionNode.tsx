import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';

interface ActionNodeProps {
  data: any;
  selected: boolean;
}

const ActionNode: React.FC<ActionNodeProps> = ({ data, selected }) => (
  <div className={`relative px-6 py-4 bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
    selected ? 'border-yellow-400 shadow-2xl scale-105' : 'border-green-300 hover:shadow-xl'
  }`}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/20 rounded-lg">
        <Zap className="h-5 w-5" />
      </div>
      <div>
        <div className="font-bold text-sm uppercase tracking-wide">ACTION</div>
        <div className="text-xs mt-1 opacity-90 font-medium">{data.label}</div>
        <div className="text-xs mt-1 opacity-75">{data.description}</div>
      </div>
    </div>
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-green-500"
    />
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-green-500"
    />
  </div>
);

export default ActionNode;