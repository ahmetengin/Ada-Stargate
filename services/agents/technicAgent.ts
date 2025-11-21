
import { AgentAction, AgentTraceLog, MaintenanceJob, NodeName, UserProfile } from '../../types';
import { TaskHandlerFn } from '../decomposition/types';
import { persistenceService, STORAGE_KEYS } from '../persistence'; // Enterprise Persistence

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

// --- DEFAULT TECHNIC DATA ---
const DEFAULT_JOBS: MaintenanceJob[] = [
    {
        id: 'JOB-1023',
        vesselName: 'M/Y Poseidon',
        jobType: 'HAUL_OUT',
        status: 'SCHEDULED',
        scheduledDate: '2025-11-25 09:00',
        contractor: 'WIM Tech Services',
        partsStatus: 'N/A',
        notes: '700T Lift Reserved. Hull inspection.'
    },
    {
        id: 'JOB-1024',
        vesselName: 'S/Y Mistral',
        jobType: 'ENGINE_SERVICE',
        status: 'WAITING_PARTS',
        scheduledDate: '2025-11-22',
        contractor: 'Authorized Volvo Penta Service',
        partsStatus: 'ORDERED',
        notes: 'Main engine overhaul. Filters ordered from Italy.'
    },
    {
        id: 'JOB-1025',
        vesselName: 'Tender Charlie',
        jobType: 'GENERAL_REPAIR',
        status: 'IN_PROGRESS',
        scheduledDate: '2025-11-20',
        contractor: 'WIM Tech Services',
        partsStatus: 'ARRIVED',
        notes: 'Outboard motor electrical fault.'
    }
];

// --- LOAD FROM PERSISTENCE ---
let TECHNIC_DB: MaintenanceJob[] = persistenceService.load(STORAGE_KEYS.TECHNIC_JOBS, DEFAULT_JOBS);
persistenceService.save(STORAGE_KEYS.TECHNIC_JOBS, TECHNIC_DB);


// --- HANDLERS FOR BRAIN/MDAP ---
const scheduleServiceHandler: TaskHandlerFn = async (ctx, obs) => {
    return [{
        id: `technic_sched_${Date.now()}`,
        kind: 'internal',
        name: 'technic.service.scheduled',
        params: { status: 'confirmed', jobId: 'JOB-NEW' }
    }];
};

export const technicHandlers: Record<string, TaskHandlerFn> = {
    'technic.scheduleService': scheduleServiceHandler,
};

// --- DIRECT AGENT INTERFACE ---
export const technicAgent = {
    
    // Skill: Get all active jobs for UI
    getActiveJobs: (): MaintenanceJob[] => {
        return TECHNIC_DB;
    },

    // Skill: Check availability and schedule
    scheduleService: async (vesselName: string, jobType: string, date: string, addTrace: (t: AgentTraceLog) => void): Promise<{ success: boolean, message: string, job?: MaintenanceJob }> => {
        
        addTrace(createLog('ada.technic', 'THINKING', `Checking resource availability for ${jobType} on ${date}...`, 'EXPERT'));

        // Simulation: Simple availability check
        const isBusy = TECHNIC_DB.some(j => j.scheduledDate.includes(date) && j.jobType === 'HAUL_OUT');
        
        if (isBusy && jobType.includes('HAUL')) {
            addTrace(createLog('ada.technic', 'ERROR', `Conflict detected. Travel Lift is booked on ${date}.`, 'WORKER'));
            return { success: false, message: `Schedule Conflict: The Travel Lift is fully booked on ${date}. Please select another slot.` };
        }

        const newJob: MaintenanceJob = {
            id: `JOB-${Math.floor(Math.random() * 10000)}`,
            vesselName: vesselName,
            jobType: jobType as any || 'GENERAL_REPAIR',
            status: 'SCHEDULED',
            scheduledDate: date,
            contractor: 'WIM Tech Services', // Default
            partsStatus: 'N/A',
            notes: 'Scheduled via Ada AI.'
        };

        TECHNIC_DB.push(newJob);
        
        // Enterprise: PERSISTENCE SAVE
        persistenceService.save(STORAGE_KEYS.TECHNIC_JOBS, TECHNIC_DB);

        addTrace(createLog('ada.technic', 'TOOL_EXECUTION', `Job Ticket ${newJob.id} created in WIM Technical System.`, 'WORKER'));

        return { success: true, message: `Service Confirmed. Ticket #${newJob.id} created for ${vesselName}.`, job: newJob };
    },

    // Skill: Check status of existing jobs
    checkStatus: async (vesselName: string, addTrace: (t: AgentTraceLog) => void): Promise<string> => {
        addTrace(createLog('ada.technic', 'TOOL_EXECUTION', `Querying Technical Database for ${vesselName}...`, 'WORKER'));
        
        const jobs = TECHNIC_DB.filter(j => j.vesselName.toLowerCase().includes(vesselName.toLowerCase()));
        
        if (jobs.length === 0) {
            return `No active technical records found for **${vesselName}**.`;
        }

        let report = `**TECHNICAL STATUS REPORT: ${vesselName}**\n\n`;
        jobs.forEach(j => {
            report += `**Job #${j.id}: ${j.jobType}**\n`;
            report += `- Status: **${j.status}**\n`;
            report += `- Schedule: ${j.scheduledDate}\n`;
            report += `- Contractor: ${j.contractor}\n`;
            if (j.partsStatus !== 'N/A') report += `- Parts: ${j.partsStatus}\n`;
            report += `\n`;
        });

        return report;
    },

    // Skill: Complete Job & Trigger Billing (FastRTC Mesh)
    completeJob: async (vesselName: string, jobId: string | undefined, user: UserProfile, addTrace: (t: AgentTraceLog) => void): Promise<AgentAction[]> => {
        addTrace(createLog('ada.technic', 'THINKING', `Processing job completion for ${vesselName}...`, 'EXPERT'));

        const jobIndex = TECHNIC_DB.findIndex(j => 
            (jobId ? j.id === jobId : true) && 
            j.vesselName.toLowerCase().includes(vesselName.toLowerCase()) && 
            j.status !== 'COMPLETED'
        );
        
        if (jobIndex === -1) {
             addTrace(createLog('ada.technic', 'ERROR', `Active job not found for ${vesselName}.`, 'WORKER'));
             return [];
        }

        const job = TECHNIC_DB[jobIndex];
        TECHNIC_DB[jobIndex].status = 'COMPLETED';
        
        // Enterprise: PERSISTENCE SAVE
        persistenceService.save(STORAGE_KEYS.TECHNIC_JOBS, TECHNIC_DB);

        // Calculate Final Cost (Simulated)
        let cost = 500; // Base call out
        if (job.jobType === 'HAUL_OUT') cost = 3500;
        if (job.jobType === 'ENGINE_SERVICE') cost = 1200;

        addTrace(createLog('ada.technic', 'OUTPUT', `Job ${job.id} marked COMPLETED. Final Cost: €${cost}.`, 'WORKER'));
        addTrace(createLog('ada.technic', 'PLANNING', `Initiating Billing Hand-off to ada.finance...`, 'ORCHESTRATOR'));

        return [{
            id: `technic_complete_${Date.now()}`,
            kind: 'external',
            name: 'ada.technic.jobCompleted',
            params: { 
                jobId: job.id,
                vesselName: job.vesselName,
                cost: cost,
                summary: `${job.jobType} Completed`
            }
        }];
    }
};
