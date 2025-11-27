
import React, { useState } from 'react';
import { Map as MapIcon } from 'lucide-react';

export const LiveMap: React.FC = () => {
  const [hoveredBerth, setHoveredBerth] = useState<string | null>(null);

  // Mock Berth Data
  // cx/cy is the anchoring point on the pontoon edge (Stern location)
  const berths = [
    // --- PONTOON A (Top) ---
    // North Side (Facing Up) - Stern at y=35, Bow at y=10
    { id: 'A-N1', status: 'OCCUPIED', vessel: 'S/Y Wind Chaser', type: 'Sail', cx: 60, cy: 35, orientation: 'up' },
    { id: 'A-N2', status: 'EMPTY', vessel: null, type: null, cx: 80, cy: 35, orientation: 'up' },
    { id: 'A-N3', status: 'OCCUPIED', vessel: 'M/Y Solaris', type: 'Motor', cx: 100, cy: 35, orientation: 'up' },
    
    // South Side (Facing Down) - Stern at y=43, Bow at y=68
    { id: 'A-S1', status: 'OCCUPIED', vessel: 'S/Y Phisedelia', type: 'Sail (VO65)', cx: 60, cy: 43, orientation: 'down' },
    { id: 'A-S2', status: 'OCCUPIED', vessel: 'M/Y Blue Horizon', type: 'Motor', cx: 80, cy: 43, orientation: 'down' },
    { id: 'A-S3', status: 'BREACH', vessel: 'Speedboat X', type: 'Speed', cx: 100, cy: 43, orientation: 'down' },
    { id: 'A-S4', status: 'OCCUPIED', vessel: 'Tender Alpha', type: 'Service', cx: 120, cy: 43, orientation: 'down' },

    // --- PONTOON B (Middle) ---
    // North Side (Facing Up) - Stern at y=85
    { id: 'B-N1', status: 'OCCUPIED', vessel: 'Catamaran Lir', type: 'Cat', cx: 60, cy: 85, orientation: 'up' },
    { id: 'B-N2', status: 'OCCUPIED', vessel: 'S/Y Aegeas', type: 'Sail', cx: 90, cy: 85, orientation: 'up' },

    // South Side (Facing Down) - Stern at y=93
    { id: 'B-S1', status: 'EMPTY', vessel: null, type: null, cx: 70, cy: 93, orientation: 'down' },
    { id: 'B-S2', status: 'OCCUPIED', vessel: 'M/Y Poseidon', type: 'Superyacht', cx: 100, cy: 93, orientation: 'down' },
    
    // --- VIP QUAY (Right) ---
    // Facing Left (West) - Stern at x=230
    { id: 'VIP-01', status: 'OCCUPIED', vessel: 'M/Y Grand Turk', type: 'Mega', cx: 230, cy: 50, orientation: 'left' },
    { id: 'VIP-02', status: 'OCCUPIED', vessel: 'M/Y White Pearl', type: 'Mega', cx: 230, cy: 100, orientation: 'left' },
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
                </defs>
                <rect width="300" height="150" fill="url(#grid)" opacity="0.3" />

                {/* --- INFRASTRUCTURE --- */}
                
                {/* Main Pier (Spine) - Left */}
                <rect x="10" y="10" width="15" height="130" rx="2" fill="#374151" stroke="#4b5563" strokeWidth="1" />
                
                {/* Pontoon A (Top) */}
                {/* y: 35 to 43 (Height 8) */}
                <rect x="25" y="35" width="140" height="8" rx="1" fill="#4b5563" stroke="#6b7280" strokeWidth="0.5" /> 
                <text x="30" y="40.5" fontSize="4" fill="#d1d5db" fontFamily="monospace" fontWeight="bold" letterSpacing="1">PONTOON A</text>

                {/* Pontoon B (Bottom) */}
                {/* y: 85 to 93 (Height 8) */}
                <rect x="25" y="85" width="140" height="8" rx="1" fill="#4b5563" stroke="#6b7280" strokeWidth="0.5" /> 
                <text x="30" y="90.5" fontSize="4" fill="#d1d5db" fontFamily="monospace" fontWeight="bold" letterSpacing="1">PONTOON B</text>

                {/* VIP Quay (Right) */}
                <rect x="230" y="20" width="60" height="110" rx="2" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1" />
                <text x="240" y="35" fontSize="6" fill="#818cf8" fontFamily="monospace" fontWeight="bold" transform="rotate(90, 240, 35)">VIP QUAY</text>

                {/* --- VESSELS (STERN-TO MOORING) --- */}
                {berths.map(b => {
                    // Geometry Calculation
                    let boatPath = "";
                    let mooringLine1 = ""; // Tonoz 1
                    let mooringLine2 = ""; // Tonoz 2
                    let labelX = b.cx;
                    let labelY = b.cy;
                    let passX1 = b.cx, passY1 = b.cy, passX2 = b.cx, passY2 = b.cy;

                    if (b.orientation === 'down') {
                        // Stern at Pontoon South Edge (y), Bow pointing South (y+)
                        // Shape: Stern width 10, Length 25. Points Down.
                        boatPath = `M ${b.cx-5} ${b.cy + 2} L ${b.cx+5} ${b.cy + 2} L ${b.cx+5} ${b.cy+20} Q ${b.cx} ${b.cy+28} ${b.cx-5} ${b.cy+20} Z`;
                        // Mooring Lines (Tonoz) - Extending from Bow further South
                        mooringLine1 = `M ${b.cx-4} ${b.cy+20} L ${b.cx-8} ${b.cy+35}`;
                        mooringLine2 = `M ${b.cx+4} ${b.cy+20} L ${b.cx+8} ${b.cy+35}`;
                        // Gangway
                        passY2 = b.cy + 4; 
                        labelY += 15;
                    } 
                    else if (b.orientation === 'up') {
                        // Stern at Pontoon North Edge (y), Bow pointing North (y-)
                        // Points Up.
                        boatPath = `M ${b.cx-5} ${b.cy - 2} L ${b.cx+5} ${b.cy - 2} L ${b.cx+5} ${b.cy-20} Q ${b.cx} ${b.cy-28} ${b.cx-5} ${b.cy-20} Z`;
                        // Mooring Lines (Tonoz) - Extending from Bow further North
                        mooringLine1 = `M ${b.cx-4} ${b.cy-20} L ${b.cx-8} ${b.cy-35}`;
                        mooringLine2 = `M ${b.cx+4} ${b.cy-20} L ${b.cx+8} ${b.cy-35}`;
                        // Gangway
                        passY2 = b.cy - 4; 
                        labelY -= 15;
                    }
                    else if (b.orientation === 'left') {
                        // Stern at Quay Left Edge (x), Bow pointing West (x-)
                        // Points Left.
                        boatPath = `M ${b.cx-2} ${b.cy-6} L ${b.cx-2} ${b.cy+6} L ${b.cx-30} ${b.cy+6} Q ${b.cx-40} ${b.cy} ${b.cx-30} ${b.cy-6} Z`;
                        // Mooring Lines (Tonoz) - Extending from Bow further West
                        mooringLine1 = `M ${b.cx-30} ${b.cy-5} L ${b.cx-50} ${b.cy-10}`;
                        mooringLine2 = `M ${b.cx-30} ${b.cy+5} L ${b.cx-50} ${b.cy+10}`;
                        // Gangway
                        passX2 = b.cx - 4; 
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
                            
                            {/* Passarelle (Gangway) - Connecting Stern to Pontoon */}
                            {(b.status === 'OCCUPIED' || b.status === 'BREACH') && (
                                <line x1={passX1} y1={passY1} x2={passX2} y2={passY2} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
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
