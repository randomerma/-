import React, { useState, useRef } from 'react';
import { useStore, Cargo } from '../store';
import { Edit2, Trash2, Plus, GripVertical, Upload, Download } from 'lucide-react';
import { parseFile } from '../lib/importData';

export const CargoTable = () => {
  const { cargoList, addCargo, removeCargo, updateCargo, setCargoList } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    addCargo({
      name: 'Новый груз',
      length: 1000,
      width: 1000,
      height: 1000,
      weight: 100,
      count: 1,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      canRotate: true,
      canStack: true,
      priority: 1,
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await parseFile(file);
        if (imported.length > 0) {
          setCargoList([...cargoList, ...imported]);
        }
      } catch (err) {
        console.error("Failed to parse file", err);
        alert("Ошибка импорта. Убедитесь, что это правильный Excel или CSV файл.");
      }
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportCSV = () => {
    const header = ['Наименование', 'Длина', 'Ширина', 'Высота', 'Вес', 'Кол-во', 'Точка выгрузки', 'Кантовать', 'Штабелировать', 'Цвет'];
    const rows = cargoList.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.length,
      c.width,
      c.height,
      c.weight,
      c.count,
      c.priority,
      c.canRotate ? 'Да' : 'Нет',
      c.canStack ? 'Да' : 'Нет',
      c.color
    ]);
    
    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cargo-list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-4">
        <h3 className="font-semibold text-slate-800 shrink-0">Список грузов</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv, .xlsx, .xls"
            onChange={handleImport}
          />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none justify-center flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-50 transition">
            <Upload size={16} /> Импорт
          </button>
          <button onClick={handleExportCSV} className="flex-1 sm:flex-none justify-center flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-50 transition">
            <Download size={16} /> Экспорт
          </button>
          <button onClick={handleAdd} className="flex-1 sm:flex-none justify-center flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition">
            <Plus size={16} /> Добавить груз
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 min-w-[900px]">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Наименование</th>
              <th className="px-4 py-3">Д x Ш x В (мм)</th>
              <th className="px-4 py-3">Вес (кг)</th>
              <th className="px-4 py-3">Кол-во</th>
              <th className="px-4 py-3 text-center" title="Очередность выгрузки (1 = грузится глубже всех)">Точка</th>
              <th className="px-4 py-3 text-center" title="Можно кантовать (вращать на бок)">Вращ.</th>
              <th className="px-4 py-3 text-center" title="Можно ставить сверху другие грузы">Штаб.</th>
              <th className="px-4 py-3">Цвет</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {cargoList.map((cargo) => (
              <tr key={cargo.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 align-top">
                <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100 min-w-[200px]">
                  <textarea 
                    value={cargo.name} 
                    onChange={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = (e.target.scrollHeight) + 'px';
                      updateCargo(cargo.id, { name: e.target.value });
                    }} 
                    onFocus={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = (e.target.scrollHeight) + 'px';
                    }}
                    className="w-full bg-transparent outline-none border-b border-transparent focus:border-blue-500 resize-none overflow-hidden min-h-[30px]" 
                    rows={1}
                  />
                </td>
                <td className="px-4 py-3 border-r border-slate-100 whitespace-nowrap">
                  <div className="flex gap-1 items-center">
                    <input type="number" value={cargo.length || ''} onChange={e => updateCargo(cargo.id, { length: Math.max(1, +e.target.value) })} className="w-12 bg-transparent outline-none border-b border-transparent focus:border-blue-500 font-mono text-center" />
                    <span>x</span>
                    <input type="number" value={cargo.width || ''} onChange={e => updateCargo(cargo.id, { width: Math.max(1, +e.target.value) })} className="w-12 bg-transparent outline-none border-b border-transparent focus:border-blue-500 font-mono text-center" />
                    <span>x</span>
                    <input type="number" value={cargo.height || ''} onChange={e => updateCargo(cargo.id, { height: Math.max(1, +e.target.value) })} className="w-12 bg-transparent outline-none border-b border-transparent focus:border-blue-500 font-mono text-center" />
                  </div>
                </td>
                <td className="px-4 py-3 border-r border-slate-100">
                  <input type="number" value={cargo.weight || ''} onChange={e => updateCargo(cargo.id, { weight: Math.max(0, +e.target.value) })} className="w-16 bg-transparent outline-none border-b border-transparent focus:border-blue-500 text-center" />
                </td>
                <td className="px-4 py-3 border-r border-slate-100">
                  <input type="number" value={cargo.count || ''} onChange={e => updateCargo(cargo.id, { count: Math.max(1, +e.target.value) })} className="w-12 bg-transparent outline-none border-b border-transparent focus:border-blue-500 text-center font-bold" />
                </td>
                <td className="px-4 py-3 border-r border-slate-100 text-center">
                  <input type="number" value={cargo.priority} onChange={e => updateCargo(cargo.id, { priority: +e.target.value })} className="w-10 bg-transparent outline-none border-b border-transparent focus:border-blue-500 text-center" min="1" />
                </td>
                <td className="px-4 py-3 border-r border-slate-100 text-center">
                  <input type="checkbox" checked={cargo.canRotate} onChange={e => updateCargo(cargo.id, { canRotate: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </td>
                <td className="px-4 py-3 border-r border-slate-100 text-center">
                  <input type="checkbox" checked={cargo.canStack} onChange={e => updateCargo(cargo.id, { canStack: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                </td>
                <td className="px-4 py-3">
                  <div className="w-6 h-6 rounded-md shadow-sm border border-slate-200 cursor-pointer" style={{ backgroundColor: cargo.color }}>
                    <input 
                      type="color" 
                      value={cargo.color}
                      onChange={(e) => updateCargo(cargo.id, { color: e.target.value })}
                      className="opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => removeCargo(cargo.id)} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {cargoList.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  Грузы пока не добавлены.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
