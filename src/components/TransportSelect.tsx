import React from 'react';
import { useStore, PRESETS } from '../store';
import { Truck } from 'lucide-react';

export const TransportSelect = ({ onPresetChange }: { onPresetChange?: () => void }) => {
  const { transport, setTransport, fillMode, setFillMode } = useStore();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESETS.find(p => p.id === e.target.value);
    if (preset) {
      setTransport(preset);
      if (onPresetChange) {
        // use setTimeout so state updates first in React 18+ (though setTransport is state update, it will be batched)
        setTimeout(() => onPresetChange(), 0);
      }
    }
  };

  const handleFillModeChange = (mode: 'volume' | 'weight') => {
    setFillMode(mode);
    if (onPresetChange) {
      setTimeout(() => onPresetChange(), 0);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="text-blue-600" size={20} />
          <h3 className="font-semibold text-slate-800">Параметры транспорта</h3>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Приоритет заполнения</label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => handleFillModeChange('volume')}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${fillMode === 'volume' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              По объему
            </button>
            <button 
              onClick={() => handleFillModeChange('weight')}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${fillMode === 'weight' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              По весу
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Шаблон</label>
          <select 
            className="w-full border border-slate-300 rounded-md p-2 text-sm text-slate-700 bg-slate-50 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={transport.id}
            onChange={handleSelect}
          >
            {PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            {!PRESETS.find(p => p.id === transport.id) && <option value={transport.id}>Пользовательский</option>}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Длина (мм)</label>
            <input type="number" value={transport.length || ''} onChange={(e) => setTransport({...transport, length: Math.max(1, +e.target.value), id: 'custom'})} className="w-full border border-slate-300 rounded-md p-2 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ширина (мм)</label>
            <input type="number" value={transport.width || ''} onChange={(e) => setTransport({...transport, width: Math.max(1, +e.target.value), id: 'custom'})} className="w-full border border-slate-300 rounded-md p-2 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Высота (мм)</label>
            <input type="number" value={transport.height || ''} onChange={(e) => setTransport({...transport, height: Math.max(1, +e.target.value), id: 'custom'})} className="w-full border border-slate-300 rounded-md p-2 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Грузоподъемность (кг)</label>
            <input type="number" value={transport.maxWeight || ''} onChange={(e) => setTransport({...transport, maxWeight: Math.max(0, +e.target.value), id: 'custom'})} className="w-full border border-slate-300 rounded-md p-2 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
