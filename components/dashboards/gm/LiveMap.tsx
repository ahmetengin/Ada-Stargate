
import React, { useState } from 'react';
import { Info, Map as MapIcon } from 'lucide-react';

export const LiveMap: React.FC = () => {
  const [hoveredBerth, setHoveredBerth] = useState<string | null>(null);

  // Mock Berth Data
  // cx/cy is the center of the berth slot on the pontoon edge
  const berths = [
    // PONTOON A (Top) - Boats facing Down (South)
    { id: 'A-01', status: 'OCCUPIED', vessel: 'S/Y Phisedelia', type: 'Sail', cx: 60, cy: 40, orientation: 'down' },
    { id: 'A-02', status: 'OCCUPIED', vessel: 'M/Y Blue Horizon', type: 'Motor', cx: 80, cy: 40, orientation: 'down' },
    { id: 'A-03', status: 'EMPTY', vessel: null, type: null, cx: 100, cy: 40, orientation: 'down' },
    { id: 'A-04', status: 'BREACH', vessel: 'Speedboat X', type: 'Speed', cx: 120, cy: 40, orientation: 'down' },
    
    // PONTOON B (Middle) - Boats facing Down
    { id: 'B-01', status: 'OCCUPIED', vessel: 'Catamaran Lir', type: 'Cat', cx: 60, cy: 90, orientation: 'down' },
    { id: 'B-02', status: 'OCCUPIED', vessel: 'M/Y Poseidon', type: 'Superyacht', cx: 90, cy: 90, orientation: 'down' },
    
    // VIP QUAY (Right) - Boats facing Left (West)
    { id: 'VIP-01', status: 'OCCUPIED', vessel: 'M/Y Grand Turk', type: 'Mega', cx: 230, cy: 70, orientation: 'left' },
  ];

  const getFill = (status: string) => {
      switch(status) {
          case 'OCCUPIED': return '#10b981'; // Emerald
          case 'EMPTY': return '#3f3f46'; // Zinc 700
          case 'BREACH': return '#ef4444'; // Red
          default: return '#3f3f46';
      }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden relative animate-in fade-in duration-500">
        <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
            <h3 className="text-xs font-bold text-sky-500 uppercase tracking-widest flex items-center gap-2">
                <MapIcon size={14} /> DIGITAL TWIN (LIVE)
            </h3>
            <div className="flex gap-2 text-[9px] font-bold uppercase">
                <span className="text-emerald-500 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Occ</span>
                <span className="text-red-500 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> Breach</span>
                <span className="text-zinc-500 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div> Vacant</span>
            </div>
        </div>
        
        <div className="flex-1 relative bg-[#050b14] p-0 flex items-center justify-center overflow-hidden">
            {/* SVG MAP REPRESENTATION */}
            <svg viewBox="0 0 300 150" className="w-full h-full">
                {/* Water Background Pattern (Subtle Grid) */}
                <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2937" strokeWidth="0.5" opacity="0.5"/>
                    </pattern>
                    <marker id="arrow" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto">
                        <path d="M0,0 L0,4 L4,2 z" fill="#374151" />
                    </marker>
                </defs>
                <rect width="300" height="150" fill="url(#grid)" opacity="0.3" />

                {/* --- INFRASTRUCTURE --- */}
                
                {/* Main Pier (Spine) - Left */}
                <rect x="10" y="10" width="15" height="130" rx="2" fill="#374151" stroke="#4b5563" strokeWidth="1" />
                
                {/* Pontoon A */}
                <rect x="25" y="35" width="140" height="8" rx="1" fill="#4b5563" /> 
                <text x="30" y="32" fontSize="5" fill="#9ca3af" fontFamily="monospace" fontWeight="bold">PONTOON A</text>

                {/* Pontoon B */}
                <rect x="25" y="85" width="140" height="8" rx="1" fill="#4b5563" /> 
                <text x="30" y="82" fontSize="5" fill="#9ca3af" fontFamily="monospace" fontWeight="bold">PONTOON B</text>

                {/* VIP Quay (Right) */}
                <rect x="230" y="20" width="60" height="110" rx="2" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1" />
                <text x="240" y="35" fontSize="6" fill="#818cf8" fontFamily="monospace" fontWeight="bold" transform="rotate(90, 240, 35)">VIP QUAY</text>

                {/* --- VESSELS (STERN-TO MOORING) --- */}
                {berths.map(b => {
                    // Calculate geometry based on orientation
                    // Standard Boat Shape: 8 wide, 24 long
                    let boatPath = "";
                    let mooringLine1 = ""; // Tonoz 1
                    let mooringLine2 = ""; // Tonoz 2
                    let labelX = b.cx;
                    let labelY = b.cy;

                    if (b.orientation === 'down') {
                        // Stern at b.cy (Pontoon edge), Bow pointing down (y+)
                        // Stern width 10, Bow point at +25y
                        boatPath = `M ${b.cx-5} ${b.cy + 2} L ${b.cx+5} ${b.cy + 2} L ${b.cx+5} ${b.cy+20} Q ${b.cx} ${b.cy+28} ${b.cx-5} ${b.cy+20} Z`;
                        // Mooring lines from Bow to Anchor points
                        mooringLine1 = `M ${b.cx-4} ${b.cy+20} L ${b.cx-8} ${b.cy+35}`;
                        mooringLine2 = `M ${b.cx+4} ${b.cy+20} L ${b.cx+8} ${b.cy+35}`;
                        labelY += 15;
                    } else if (b.orientation === 'left') {
                        // Stern at b.cx (Quay edge), Bow pointing left (x-)
                        boatPath = `M ${b.cx-2} ${b.cy-6} L ${b.cx-2} ${b.cy+6} L ${b.cx-30} ${b.cy+6} Q ${b.cx-40} ${b.cy} ${b.cx-30} ${b.cy-6} Z`;
                        mooringLine1 = `M ${b.cx-30} ${b.cy-5} L ${b.cx-50} ${b.cy-10}`;
                        mooringLine2 = `M ${b.cx-30} ${b.cy+5} L ${b.cx-50} ${b.cy+10}`;
                        labelX -= 20;
                    }

                    return (
                        <g 
                            key={b.id} 
                            onMouseEnter={() => setHoveredBerth(b.id)}
                            onMouseLeave={() => setHoveredBerth(null)}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                        >
                            {/* Mooring Lines (Tonoz) - Only if occupied */}
                            {(b.status === 'OCCUPIED' || b.status === 'BREACH') && (
                                <>
                                    <path d={mooringLine1} stroke="#4b5563" strokeWidth="0.5" strokeDasharray="1,1" />
                                    <path d={mooringLine2} stroke="#4b5563" strokeWidth="0.5" strokeDasharray="1,1" />
                                </>
                            )}

                            {/* Boat Hull */}
                            <path 
                                d={boatPath} 
                                fill={getFill(b.status)} 
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="0.5"
                                filter={b.status === 'BREACH' ? 'drop-shadow(0 0 4px #ef4444)' : ''}
                            />
                            
                            {/* Passarelle (Gangway) */}
                            {(b.status === 'OCCUPIED' || b.status === 'BREACH') && (
                                b.orientation === 'down' 
                                ? <line x1={b.cx} y1={b.cy} x2={b.cx} y2={b.cy+4} stroke="white" strokeWidth="1.5" />
                                : <line x1={b.cx} y1={b.cy} x2={b.cx-4} y2={b.cy} stroke="white" strokeWidth="1.5" />
                            )}

                            {/* Breach Indicator */}
                            {b.status === 'BREACH' && (
                                <circle cx={labelX} cy={labelY} r="3" fill="#ef4444" className="animate-ping" />
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredBerth && (
                <div className="absolute top-2 left-2 bg-zinc-900/90 backdrop-blur border border-zinc-700 p-3 rounded-lg text-xs z-20 shadow-2xl pointer-events-none animate-in fade-in zoom-in duration-200 min-w-[140px]">
                    {(() => {
                        const b = berths.find(x => x.id === hoveredBerth);
                        return (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white font-mono">{b?.id}</span>
                                    <span className={`text-[9px] px-1.5 rounded ${b?.status === 'OCCUPIED' ? 'bg-emerald-900 text-emerald-400' : b?.status === 'BREACH' ? 'bg-red-900 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{b?.status}</span>
                                </div>
                                <div className="text-zinc-300 font-bold text-sm mb-1">
                                    {b?.vessel || 'VACANT'}
                                </div>
                                {b?.vessel && (
                                    <div className="text-[10px] text-zinc-500 flex justify-between">
                                        <span>{b?.type}</span>
                                        <span>Stern-to</span>
                                    </div>
                                )}
                                {b?.status === 'BREACH' && <div className="text-[9px] text-red-400 uppercase mt-2 font-bold border-t border-red-900 pt-1">⚠️ UNAUTHORIZED</div>}
                            </div>
                        )
                    })()}
                </div>
            )}
        </div>
    </div>
  );
};
