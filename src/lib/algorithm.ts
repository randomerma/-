import { Cargo, PackedItem, Transport } from '../store';

interface Space {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

function isContained(a: Space, b: Space) {
  return a.x >= b.x && a.y >= b.y && a.z >= b.z &&
         a.x + a.w <= b.x + b.w &&
         a.y + a.h <= b.y + b.h &&
         a.z + a.d <= b.z + b.d;
}

function runFFD(
  chromosome: number[],
  itemsRef: ItemToPack[],
  transport: Transport
): { packed: PackedItem[], unpackedOriginalIds: string[], fitness: number } {
  const packed: PackedItem[] = [];
  const items = itemsRef.map(it => ({ ...it, isPacked: false }));

  let currentContainerIndex = 0;
  let containersUsed = 0;

  while (items.some(i => !i.isPacked) && currentContainerIndex < 20) {
    let packedInThisContainer = 0;
    let ems: Space[] = [{ x: 0, y: 0, z: 0, w: transport.width, h: transport.height, d: transport.length }];
    let currentWeight = 0;

    const availableItems = [];
    for (const idx of chromosome) {
      if (!items[idx].isPacked) {
        availableItems.push(items[idx]);
      }
    }

    for (const item of availableItems) {
      if (currentWeight + item.weight > transport.maxWeight) {
        continue;
      }

      let bestSpace: Space | null = null;
      let bestVariant: { w: number, h: number, d: number } | null = null;
      let bestScore = Infinity;

      const variants = item.canRotate ? [
        { w: item.width, h: item.height, d: item.length },
        { w: item.length, h: item.height, d: item.width }
      ] : [
        { w: item.width, h: item.height, d: item.length }
      ];

      for (const space of ems) {
        for (const v of variants) {
          if (v.w <= space.w && v.h <= space.h && v.d <= space.d) {
            
            // Check stacking constraint
            let canBePlaced = true;
            if (space.y > 0) {
              let totalSupportArea = 0;
              const requiredArea = v.w * v.d;
              for (const p of packed) {
                if (p.containerIndex !== currentContainerIndex) continue;

                if (Math.abs(p.y + p.h - space.y) < 2) {
                  const ix1 = Math.max(p.x, space.x);
                  const iz1 = Math.max(p.z, space.z);
                  const ix2 = Math.min(p.x + p.w, space.x + v.w);
                  const iz2 = Math.min(p.z + p.d, space.z + v.d);
                  if (ix1 < ix2 && iz1 < iz2) {
                    const supportCargoItems = itemsRef.filter(c => c.cargoId === p.originalCargoId);
                    if (supportCargoItems.length > 0 && !supportCargoItems[0].canStack) {
                      canBePlaced = false;
                      break;
                    }
                    totalSupportArea += (ix2 - ix1) * (iz2 - iz1);
                  }
                }
              }
              if (totalSupportArea < requiredArea * 0.5) {
                canBePlaced = false;
              }
            }

            if (canBePlaced) {
              const score = space.z * 1000000 + space.y * 1000 + space.x;
              if (score < bestScore) {
                bestScore = score;
                bestSpace = space;
                bestVariant = v;
              }
            }
          }
        }
      }

      if (bestSpace && bestVariant) {
        const placed: PackedItem = {
          cargoId: item.uid,
          originalCargoId: item.cargoId,
          containerIndex: currentContainerIndex,
          x: bestSpace.x,
          y: bestSpace.y,
          z: bestSpace.z,
          ...bestVariant
        };
        
        packed.push(placed);
        item.isPacked = true;
        packedInThisContainer++;
        currentWeight += item.weight;

        let newEms: Space[] = [];
        const p = placed;
        for (const space of ems) {
          const ix1 = Math.max(space.x, p.x);
          const iy1 = Math.max(space.y, p.y);
          const iz1 = Math.max(space.z, p.z);
          const ix2 = Math.min(space.x + space.w, p.x + p.w);
          const iy2 = Math.min(space.y + space.h, p.y + p.h);
          const iz2 = Math.min(space.z + space.d, p.z + p.d);

          if (ix1 >= ix2 || iy1 >= iy2 || iz1 >= iz2) {
            newEms.push(space);
            continue;
          }

          if (p.x > space.x) newEms.push({ ...space, w: p.x - space.x });
          if (p.x + p.w < space.x + space.w) newEms.push({ ...space, x: p.x + p.w, w: space.x + space.w - (p.x + p.w) });
          if (p.y > space.y) newEms.push({ ...space, h: p.y - space.y });
          if (p.y + p.h < space.y + space.h) newEms.push({ ...space, y: p.y + p.h, h: space.y + space.h - (p.y + p.h) });
          if (p.z > space.z) newEms.push({ ...space, d: p.z - space.z });
          if (p.z + p.d < space.z + space.d) newEms.push({ ...space, z: p.z + p.d, d: space.z + space.d - (p.z + p.d) });
        }

        let filtered: Space[] = [];
        for (let i = 0; i < newEms.length; i++) {
          let isFullyInside = false;
          for (let j = 0; j < newEms.length; j++) {
            if (i !== j && isContained(newEms[i], newEms[j])) {
              isFullyInside = true;
              break;
            }
          }
          if (!isFullyInside) filtered.push(newEms[i]);
        }
        ems = filtered;
      }
    }

    if (packedInThisContainer === 0) {
      break;
    }
    currentContainerIndex++;
    containersUsed++;
  }

  const unpacked = items.filter(i => !i.isPacked);
  const unpackedOriginalIds = Array.from(new Set(unpacked.map(i => i.cargoId)));
  
  let fitness = containersUsed * 1000000;
  fitness += unpacked.length * 10000000;
  
  let lastContainerVolume = 0;
  for (const p of packed) {
    if (p.containerIndex === containersUsed - 1) {
      lastContainerVolume += p.w * p.h * p.d;
    }
  }
  const maxVol = transport.width * transport.height * transport.length;
  if (containersUsed > 0 && maxVol > 0) {
    fitness += (lastContainerVolume / maxVol) * 10000;
  }

  return { packed, unpackedOriginalIds, fitness };
}

export function packCargo(cargoList: Cargo[], transport: Transport, fillMode: 'volume' | 'weight' = 'volume'): { packed: PackedItem[], unpacked: string[] } {
  if (transport.width <= 0 || transport.height <= 0 || transport.length <= 0) {
    return { packed: [], unpacked: cargoList.map(c => c.id) };
  }

  let items: ItemToPack[] = [];

  cargoList.forEach(c => {
    if (c.length > 0 && c.width > 0 && c.height > 0 && c.weight >= 0 && c.count > 0) {
      for (let i = 0; i < c.count; i++) {
        items.push({ ...c, cargoId: c.id, uid: `${c.id}_${i}`, isPacked: false });
      }
    }
  });

  if (items.length === 0) return { packed: [], unpacked: [] };

  items.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (fillMode === 'weight') {
      return b.weight - a.weight;
    } else {
      const volA = a.length * a.width * a.height;
      const volB = b.length * b.width * b.height;
      
      const densityA = volA > 0 ? a.weight / volA : 0;
      const densityB = volB > 0 ? b.weight / volB : 0;
      
      if (Math.abs(densityB - densityA) > 1e-10) {
        return densityA - densityB;
      }
      return volB - volA; // fallback geometry
    }
  });

  const baseOrder = items.map((_, i) => i);
  let bestResult = runFFD(baseOrder, items, transport);

  // Genetic Algorithm Config
  const POP_SIZE = Math.min(20, Math.max(10, items.length));
  const GENERATIONS = 3;

  let population: number[][] = [];
  population.push(baseOrder); // Seed with our heuristic
  
  // Initialize population with random shuffles of elements with SAME priority
  for (let i = 1; i < POP_SIZE; i++) {
    let newOrder = [...baseOrder];
    // Mutate by swapping two random elements
    const i1 = Math.floor(Math.random() * newOrder.length);
    const i2 = Math.floor(Math.random() * newOrder.length);
    [newOrder[i1], newOrder[i2]] = [newOrder[i2], newOrder[i1]];
    population.push(newOrder);
  }

  for (let g = 0; g < GENERATIONS; g++) {
    const scoredPop = population.map(chromosome => {
      const res = runFFD(chromosome, items, transport);
      if (res.fitness < bestResult.fitness) {
        bestResult = res;
      }
      return { chromosome, fitness: res.fitness };
    });

    scoredPop.sort((a, b) => a.fitness - b.fitness);

    const nextGen: number[][] = [];
    nextGen.push([...scoredPop[0].chromosome]); // Elitism

    while (nextGen.length < POP_SIZE) {
      // Tournament selection
      const t1 = scoredPop[Math.floor(Math.random() * (POP_SIZE / 2))];
      const t2 = scoredPop[Math.floor(Math.random() * (POP_SIZE / 2))];
      
      let child = [...(t1.fitness < t2.fitness ? t1.chromosome : t2.chromosome)];
      
      // Mutation
      if (Math.random() < 0.5) {
        const m1 = Math.floor(Math.random() * child.length);
        const m2 = Math.floor(Math.random() * child.length);
        [child[m1], child[m2]] = [child[m2], child[m1]];
      }
      
      nextGen.push(child);
    }
    population = nextGen;
  }

  return { packed: bestResult.packed, unpacked: bestResult.unpackedOriginalIds };
}
