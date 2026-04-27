/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useEffect, useState } from 'react';
import { ThreeScene } from './components/ThreeScene';
import { CargoTable } from './components/CargoTable';
import { TransportSelect } from './components/TransportSelect';
import { useStore } from './store';
import { packCargo } from './lib/algorithm';
import { exportToPdf } from './lib/export';
import { Box, Layers, Play, Download, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const { transport, fillMode, cargoList, setPackResult, packedItems, unpackedCargoIds } = useStore();
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const state = useStore.getState();
      const result = packCargo(state.cargoList, state.transport, state.fillMode);
      state.setPackResult(result.packed, result.unpacked);
      setIsCalculating(false);
    }, 50);
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    let weight = 0;
    let volume = 0;
    
    // Create an object to track per-container stats
    const containersMap: Record<number, { weight: number, volume: number }> = {};
    
    packedItems.forEach(item => {
      const idx = item.containerIndex || 0;
      if (!containersMap[idx]) containersMap[idx] = { weight: 0, volume: 0 };
      
      const cargo = cargoList.find(c => c.id === item.originalCargoId);
      if (cargo) {
        weight += cargo.weight;
        volume += (item.w * item.h * item.d) / 1000000000; // to m3
        
        containersMap[idx].weight += cargo.weight;
        containersMap[idx].volume += (item.w * item.h * item.d) / 1000000000;
      }
    });
    
    // Calculate LDM (Loading Meters - European standard: length needed across full trailer width)
    // Find max Z used by any item
    let maxZ = 0;
    packedItems.forEach(item => {
      maxZ = Math.max(maxZ, item.z + item.d);
    });
    const ldm = maxZ / 1000;

    const numContainers = packedItems.length > 0
      ? Math.max(...packedItems.map(p => p.containerIndex || 0)) + 1
      : 0;

    return {
      numContainers,
      weight,
      volume,
      ldm,
      maxWeight: transport.maxWeight * (numContainers || 1),
      maxVolume: ((transport.length * transport.width * transport.height) / 1000000000) * (numContainers || 1),
      containersMap
    };
  }, [packedItems, transport, cargoList]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Box className="text-blue-600 shrink-0" />
            <span className="truncate">Оптимизатор Погрузки</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Алгоритм 3D-упаковки и визуализация</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={handleCalculate} 
            disabled={isCalculating}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait text-white px-5 py-2.5 rounded-lg font-medium shadow-sm shadow-blue-500/20 transition"
          >
            {isCalculating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {isCalculating ? 'Обработка...' : 'Рассчитать'}
          </button>
          <button onClick={exportToPdf} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-medium border border-slate-200 shadow-sm transition">
            <Download size={18} />
            Экспорт отчета PDF
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <TransportSelect onPresetChange={handleCalculate} />
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="text-blue-600" size={20} />
                  <h3 className="font-semibold text-slate-800">Статистика</h3>
                </div>
             </div>
             
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Количество авто</span>
                  <span className="font-mono font-medium text-slate-800">
                    {stats.numContainers} шт.
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Общий вес</span>
                  <span className={`font-mono font-medium ${stats.weight > stats.maxWeight ? 'text-red-600' : 'text-slate-800'}`}>
                    {stats.weight.toLocaleString()} / {stats.maxWeight.toLocaleString()} кг
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Общий объем</span>
                  <span className="font-mono font-medium text-slate-800">
                    {stats.volume.toFixed(2)} / {stats.maxVolume.toFixed(2)} м³
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Погрузочные метры (LDM)</span>
                  <span className="font-mono font-medium text-slate-800">
                    {stats.ldm.toFixed(2)} LDM
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Мест упаковано</span>
                  <span className="font-mono font-medium text-slate-800">
                    {packedItems.length}
                  </span>
                </div>

                {unpackedCargoIds.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start gap-2">
                     <AlertCircle size={18} className="shrink-0 mt-0.5" />
                     <p className="text-sm">
                       <strong>Внимание:</strong> {unpackedCargoIds.length} мест не удалось упаковать (не хватает места или превышен вес/габариты).
                     </p>
                  </div>
                )}

                {stats.numContainers > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">Детализация по авто</h4>
                    {Array.from({ length: stats.numContainers }).map((_, idx) => {
                      const cData = stats.containersMap[idx] || { weight: 0, volume: 0 };
                      const maxV = (transport.width * transport.length * transport.height) / 1000000000;
                      const maxW = transport.maxWeight;
                      const vPct = ((cData.volume / maxV) * 100).toFixed(1);
                      const wPct = ((cData.weight / maxW) * 100).toFixed(1);

                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded p-3 text-sm">
                          <div className="font-medium text-slate-800 mb-2">Авто {idx + 1}</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Вес: {wPct}%</span>
                                <span>{cData.weight.toLocaleString()} кг</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number(wPct))}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Объем: {vPct}%</span>
                                <span>{cData.volume.toFixed(2)} м³</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number(vPct))}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
          </div>

        </div>

        {/* Center / Right Content */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* 3D Viewport */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 min-h-[350px] lg:h-[500px]">
             <ThreeScene />
          </div>
          
          <CargoTable />
        </div>
      </main>
    </div>
  );
}
