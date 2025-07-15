import React from 'react';
import { Handle, Position } from 'reactflow';
import { Clock } from 'lucide-react';

interface DelayNodeProps {
  data: any;
  selected: boolean;
}

const DelayNode: React.FC<DelayNodeProps> = ({ data, selected }) => (
  <div className={`relative px-6 py-4 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
    selected ? 'border-yellow-400 shadow-2xl scale-105' : 'border-purple-300 hover:shadow-xl'
  }`}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/20 rounded-lg">
        <Clock className="h-5 w-5" />
      </div>
      <div>
        <div className="font-bold text-sm uppercase tracking-wide">DELAY</div>
        <div className="text-xs mt-1 opacity-90 font-medium">{data.label}</div>
      </div>
    </div>
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-purple-500"
    />
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-purple-500"
    />
  </div>
);

export default DelayNode;