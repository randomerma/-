import { create } from 'zustand';

export const PRESETS = [
  { id: 'gazelle', name: 'Газель (3 м)', length: 3000, width: 2000, height: 1800, maxWeight: 1500, color: '#e2e8f0' },
  { id: 'gazelle_long', name: 'Газель удлиненная (4.2 м)', length: 4200, width: 2000, height: 2000, maxWeight: 1500, color: '#e2e8f0' },
  { id: 'valdai', name: 'Валдай / Газон (5 т)', length: 6000, width: 2400, height: 2400, maxWeight: 5000, color: '#cbd5e1' },
  { id: '10ton', name: 'Фура одиночка (10 т)', length: 8000, width: 2450, height: 2500, maxWeight: 10000, color: '#94a3b8' },
  { id: 'euro', name: 'Еврофура (20 т, 82м³)', length: 13600, width: 2450, height: 2700, maxWeight: 22000, color: '#64748b' },
  { id: 'euro_mega', name: 'Еврофура Мега (100м³)', length: 13600, width: 2450, height: 3000, maxWeight: 22000, color: '#475569' },
  { id: '20ft', name: '20-фт Контейнер', length: 5898, width: 2352, height: 2393, maxWeight: 28200, color: '#cbd5e1' },
  { id: '40ft', name: '40-фт Контейнер', length: 12032, width: 2352, height: 2393, maxWeight: 26600, color: '#94a3b8' },
  { id: '40fthc', name: '40-фт Контейнер HC', length: 12032, width: 2352, height: 2698, maxWeight: 26600, color: '#64748b' }
];

export interface Transport {
  id: string;
  name: string;
  length: number; // mm
  width: number; // mm
  height: number; // mm
  maxWeight: number; // kg
  color: string;
}

export interface Cargo {
  id: string;
  name: string;
  length: number; // mm
  width: number; // mm
  height: number; // mm
  weight: number; // kg
  count: number;
  color: string;
  canRotate: boolean;
  canStack: boolean;
  priority: number; // 1 = pack first, deepest
}

export interface PackedItem {
  cargoId: string;
  originalCargoId: string; // Ref to original cargo
  containerIndex: number;
  x: number; // mm
  y: number; // mm
  z: number; // mm
  w: number; // mm
  h: number; // mm
  d: number; // mm
}

interface AppState {
  transport: Transport;
  fillMode: 'volume' | 'weight';
  cargoList: Cargo[];
  packedItems: PackedItem[];
  unpackedCargoIds: string[];
  
  setTransport: (t: Transport) => void;
  setFillMode: (mode: 'volume' | 'weight') => void;
  addCargo: (c: Omit<Cargo, 'id'>) => void;
  updateCargo: (id: string, c: Partial<Cargo>) => void;
  removeCargo: (id: string) => void;
  setCargoList: (list: Cargo[]) => void;
  setPackResult: (packed: PackedItem[], unpacked: string[]) => void;
}

export const useStore = create<AppState>((set) => ({
  transport: {
    id: 'euro',
    name: 'Еврофура (20 т, 82м³)',
    length: 13600,
    width: 2450,
    height: 2700,
    maxWeight: 22000,
    color: '#888888',
  },
  cargoList: [
    {
      id: 'box1',
      name: 'Стандартная паллета',
      length: 1200,
      width: 800,
      height: 1000,
      weight: 500,
      count: 10,
      color: '#ff7700',
      canRotate: true,
      canStack: true,
      priority: 1,
    },
    {
      id: 'box2',
      name: 'Большая коробка',
      length: 600,
      width: 400,
      height: 400,
      weight: 50,
      count: 30,
      color: '#00ccff',
      canRotate: true,
      canStack: true,
      priority: 1,
    }
  ],
  packedItems: [],
  unpackedCargoIds: [],
  fillMode: 'volume',
  
  setTransport: (t) => set({ transport: t }),
  setFillMode: (mode) => set({ fillMode: mode }),
  addCargo: (c) => set((state) => ({ cargoList: [...state.cargoList, { ...c, id: crypto.randomUUID() }] })),
  updateCargo: (id, c) => set((state) => ({
    cargoList: state.cargoList.map(item => item.id === id ? { ...item, ...c } : item)
  })),
  removeCargo: (id) => set((state) => ({
    cargoList: state.cargoList.filter(item => item.id !== id)
  })),
  setCargoList: (list) => set({ cargoList: list }),
  setPackResult: (packed, unpacked) => set({ packedItems: packed, unpackedCargoIds: unpacked }),
}));
