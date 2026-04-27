import * as XLSX from 'xlsx';
import { Cargo } from '../store';
import { v4 as uuidv4 } from 'uuid';

export async function parseFile(file: File): Promise<Cargo[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheet = workbook.SheetNames[0];
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

        const importedCargo: Cargo[] = rows.map(r => {
          // Attempt to map columns reasonably
          const name = r.Name || r.name || r['Наименование'] || 'Imported Item';
          const length = parseFloat(r.Length || r.length || r['Длина'] || '1000');
          const width = parseFloat(r.Width || r.width || r['Ширина'] || '1000');
          const height = parseFloat(r.Height || r.height || r['Высота'] || '1000');
          const weight = parseFloat(r.Weight || r.weight || r['Вес'] || '50');
          const count = parseInt(r.Count || r.count || r.Qty || r['Кол-во'] || '1', 10);
          
          return {
            id: uuidv4(),
            name,
            length,
            width,
            height,
            weight,
            count,
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            canRotate: true,
            canStack: true,
            priority: 1
          };
        });

        resolve(importedCargo);
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
} 
