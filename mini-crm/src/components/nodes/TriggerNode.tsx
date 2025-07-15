import React from 'react';
import { Handle, Position } from 'reactflow';
import { Target } from 'lucide-react';

interface TriggerNodeProps {
  data: any;
  selected: boolean;
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ data, selected }) => (
  <div className={`relative px-6 py-4 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
    selected ? 'border-yellow-400 shadow-2xl scale-105' : 'border-blue-300 hover:shadow-xl'
  }`}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/20 rounded-lg">
        <Target className="h-5 w-5" />
      </div>
      <div>
        <div className="font-bold text-sm uppercase tracking-wide">TRIGGER</div>
        <div className="text-xs mt-1 opacity-90 font-medium">{data.label}</div>
      </div>
    </div>
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-blue-500"
    />
  </div>
);

export default TriggerNode;