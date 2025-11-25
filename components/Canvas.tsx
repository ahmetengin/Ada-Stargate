
import React, { useEffect, useState } from 'react';
import { RegistryEntry, Tender, VhfLog, UserProfile, VesselSystemsStatus, AgentTraceLog } from '../types';
import { ExternalLink, Radar, List, Database, Cloud, Globe, Radio, Calendar, Utensils, Wind, Droplets, Battery, Anchor, Navigation } from 'lucide-react';
import { wimMasterData } from '../services/wimMasterData';
import { marinaExpert } from '../services/agents/marinaAgent';
import { GuestDashboard } from './dashboards/GuestDashboard';
import { CaptainDashboard } from './dashboards/CaptainDashboard';
import { GMDashboard } from './dashboards/GMDashboard';

interface CanvasProps {
  vesselsInPort: number;
  registry: RegistryEntry[];
  tenders: Tender[];
  vhfLogs?: VhfLog[];
  userProfile: UserProfile;
  onOpenReport?: () => void;
  onOpenTrace?: () => void;
  agentTraces?: AgentTraceLog[];
}

export const Canvas: React.FC<CanvasProps> = ({ 
  vesselsInPort, 
  registry,
  tenders,
  vhfLogs = [],
  userProfile,
  onOpenReport,
  onOpenTrace,
  agentTraces = []
}) => {
  // Live Data Simulation for "Static" fix
  const [occupancyRate, setOccupancyRate] = useState(92);
  const [movementCount, setMovementCount] = useState(registry.length);
  
  useEffect(() => {
      // Simulate live operational heartbeat
      const interval = setInterval(() => {
          setOccupancyRate(prev => prev + (Math.random() > 0.5 ? 0.1 : -0.1));
          setMovementCount(registry.length); // Sync with real props
      }, 5000);

      return () => clearInterval(interval);
  }, [registry.length]);

  // --- VIEW 1: GUEST (LIFESTYLE DECK) ---
  if (userProfile.role === 'GUEST') {
      return <GuestDashboard userProfile={userProfile} />;
  }

  // --- VIEW 2: CAPTAIN (VESSEL DECK) ---
  if (userProfile.role === 'CAPTAIN') {
      return <CaptainDashboard />;
  }

  // --- VIEW 3: GM / OPERATOR (MASTER OPS) ---
  return (
      <div className="h-full w-full pb-20 lg:pb-0">
        <GMDashboard 
            userProfile={userProfile}
            logs={[]} // Pass logs if available in future
            registry={registry}
            tenders={tenders}
            vesselsInPort={vesselsInPort}
            agentTraces={agentTraces}
            vhfLogs={vhfLogs} // PASS THE COMMS
            onOpenReport={onOpenReport || (() => {})}
            onOpenTrace={onOpenTrace || (() => {})}
        />
      </div>
  );
};
