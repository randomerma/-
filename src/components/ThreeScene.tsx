import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges, Html } from '@react-three/drei';
import { useStore } from '../store';

const Box = ({ x, y, z, w, h, d, color }: any) => {
  return (
    <mesh position={[x + w / 2, y + h / 2, z + d / 2]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} transparent opacity={0.8} />
      <Edges scale={1} threshold={15} color="black" />
    </mesh>
  );
};

export const ThreeScene = () => {
  const { transport, packedItems, cargoList } = useStore();

  const numContainers = Math.max(1, (packedItems.length > 0 ? Math.max(...packedItems.map(p => p.containerIndex || 0)) + 1 : 1));
  const spacing = transport.width + 1000; // 1 meter spacing between transports
  
  // Offset entire scene so containers are centered
  const cx = -((numContainers * spacing) - 1000) / 2;
  const cy = -transport.height / 2;
  const cz = -transport.length / 2;

  // Use a scale factor to bring mm down to a reasonable 3D unit (meters)
  const scale = 0.001;
  const sceneWidth = numContainers * spacing;
  const maxDim = Math.max(transport.length, sceneWidth, transport.height) * scale;

  return (
    <div id="three-scene-container" className="w-full h-full min-h-[350px] bg-slate-50 relative rounded-xl overflow-hidden border border-slate-200">
      <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [maxDim * 1.5, maxDim * 1, maxDim * 1.5], fov: 45, near: 0.1, far: maxDim * 10 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} />
        
        <group scale={scale} position={[cx * scale, cy * scale, cz * scale]}>
          <axesHelper args={[2000]} />
          
          {Array.from({ length: numContainers }).map((_, containerIdx) => {
            return (
              <group key={containerIdx} position={[containerIdx * spacing, 0, 0]}>
                {/* Transport Container */}
                <mesh position={[transport.width / 2, transport.height / 2, transport.length / 2]}>
                  <boxGeometry args={[transport.width, transport.height, transport.length]} />
                  <meshBasicMaterial color="#4a90e2" transparent opacity={0.1} depthWrite={false} side={2} />
                  <Edges scale={1} threshold={15} color="#4a90e2" />
                </mesh>

                {/* Packed Items for this container */}
                {packedItems.filter(p => (p.containerIndex || 0) === containerIdx).map((item, i) => {
                  const cargo = cargoList.find(c => c.id === item.originalCargoId);
                  return (
                    <Box 
                      key={item.cargoId + i}
                      x={item.x} y={item.y} z={item.z}
                      w={item.w} h={item.h} d={item.d}
                      color={cargo?.color || '#ff0000'}
                    />
                  );
                })}
              </group>
            );
          })}
        </group>
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};
