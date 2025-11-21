
// services/orchestratorService.ts

import { AgentAction, AgentTraceLog, UserProfile, OrchestratorResponse, NodeName, VesselIntelligenceProfile } from '../types';
import { seaAgent } from './agents/seaAgent';
import { financeAgent } from './agents/financeAgent';
import { legalAgent } from './agents/legalAgent';
import { marinaAgent } from './agents/marinaAgent';
import { customerAgent } from './agents/customerAgent';
import { technicAgent } from './agents/technicAgent'; // Import technicAgent
import { wimMasterData } from './wimMasterData';
import { dmsToDecimal } from './utils';
import { generateComplianceSystemMessage, SystemMessageKey } from './prompts'; // Import compliance helper

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

// Use let so it can be dynamically updated for new registrations
let VESSEL_KEYWORDS = ['s/y phisedelia', 'm/y blue horizon', 's/y mistral', 'm/y poseidon', 'catamaran lir', 's/y aegeas', 'm/y grand turk', 'tender bravo'];

export const orchestratorService = {
    async processRequest(prompt: string, user: UserProfile): Promise<OrchestratorResponse> {
        const traces: AgentTraceLog[] = [];
        const actions: AgentAction[] = [];
        const lowerPrompt = prompt.toLowerCase();
        
        traces.push(createLog('ada.marina', 'ROUTING', `Signal Received: "${prompt}"`));

        let responseText = "";

        // Helper to find a vessel name in the prompt
        const findVesselInPrompt = (p: string) => VESSEL_KEYWORDS.find(v => p.includes(v));

        const infoKeywords = ['wifi', 'internet', 'market', 'gym', 'taxi', 'pharmacy', 'restaurant', 'fuel', 'water', 'electric', 'laundry', 'garbage', 'office', 'hours', 'atm', 'arrival', 'procedure'];
        
        // --- INTENT: GENERAL INQUIRY ---
        if (infoKeywords.some(kw => lowerPrompt.includes(kw)) && !lowerPrompt.includes('berth') && !lowerPrompt.includes('dock')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: GENERAL_INQUIRY. Routing to ada.customer (Low Cost Node).'));
            
            const result = await customerAgent.handleGeneralInquiry(prompt, (t) => traces.push(t));
            responseText = result.text;
            actions.push(...result.actions);
        }
        // --- INTENT: CONTRACTOR / TECHNICIAN ENTRY (New) ---
        else if (lowerPrompt.includes('technician') || lowerPrompt.includes('mechanic') || lowerPrompt.includes('usta') || lowerPrompt.includes('worker') || lowerPrompt.includes('servis elemanı') || (lowerPrompt.includes('giriş') && lowerPrompt.includes('izin'))) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: CONTRACTOR_ENTRY. Routing to Security/Legal Gate.', 'ORCHESTRATOR'));
            
            if (user.role === 'GUEST') {
                responseText = `**ACCESS DENIED**\n\nOnly Captains or Management can authorize contractor entry.`;
            } else {
                // Mock extraction
                const name = "Mehmet Usta"; // In a real LLM we'd extract this
                const company = lowerPrompt.includes('unknown') ? 'Unknown Co' : 'Safe Marine Ltd';
                const workType = lowerPrompt.includes('kaynak') || lowerPrompt.includes('welding') ? 'Hot Work (Welding)' : 'General Repair';

                const authResult = await marinaAgent.authorizeContractor(name, company, workType, (t) => traces.push(t));
                
                if (authResult.authorized) {
                    responseText = `**GATE PASS ISSUED**\n\n${authResult.message}\n\n*Reminder: All contractors must wear visible IDs.*`;
                } else {
                    responseText = `**ENTRY REJECTED**\n\n${authResult.message}\n\n*Please direct them to the Front Office for insurance verification.*`;
                }
            }
        }
        // --- INTENT: TECHNICAL SERVICE (ada.technic) ---
        else if (lowerPrompt.includes('repair') || lowerPrompt.includes('maintenance') || lowerPrompt.includes('service') || lowerPrompt.includes('haul out') || lowerPrompt.includes('lift') || lowerPrompt.includes('mechanic') || lowerPrompt.includes('parts') || lowerPrompt.includes('teknik') || lowerPrompt.includes('job')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: TECHNICAL_SERVICE. Routing to ada.technic.', 'ORCHESTRATOR'));
            
            const vesselName = findVesselInPrompt(lowerPrompt) || 's/y phisedelia';

            // 1. Schedule / Book
            if (lowerPrompt.includes('book') || lowerPrompt.includes('schedule') || lowerPrompt.includes('arrange') || lowerPrompt.includes('plan')) {
                if (user.role === 'GUEST') {
                    traces.push(createLog('ada.technic', 'ERROR', 'Access Denied: Guests cannot schedule technical services.', 'EXPERT'));
                    responseText = `**ACCESS DENIED**\n\nScheduling technical services requires CAPTAIN or GENERAL_MANAGER clearance.`;
                } else {
                    const jobType = lowerPrompt.includes('haul') || lowerPrompt.includes('lift') ? 'HAUL_OUT' : 
                                    lowerPrompt.includes('engine') ? 'ENGINE_SERVICE' : 'GENERAL_REPAIR';
                    const date = new Date().toISOString().split('T')[0]; // Simulating 'today' or next available
                    
                    const result = await technicAgent.scheduleService(vesselName, jobType, date, (t) => traces.push(t));
                    responseText = result.success 
                        ? `**TECHNICAL SERVICE SCHEDULED**\n\n**Job ID:** ${result.job?.id}\n**Vessel:** ${result.job?.vesselName}\n**Service:** ${result.job?.jobType}\n**Date:** ${result.job?.scheduledDate}\n\n*Please ensure vessel is ready for handover.*`
                        : `**SCHEDULING FAILED**\n\n${result.message}`;
                }
            } 
            // 2. Complete Job (FastRTC Trigger)
            else if (lowerPrompt.includes('complete') || lowerPrompt.includes('finish') || lowerPrompt.includes('done')) {
                if (user.role === 'GUEST') {
                    responseText = `**ACCESS DENIED**\n\nOnly authorized technical staff or GM can complete jobs.`;
                } else {
                    // Assuming 'complete job' prompt implies completing active job for vessel
                    const technicActions = await technicAgent.completeJob(vesselName, undefined, user, (t) => traces.push(t));
                    actions.push(...technicActions);
                    
                    const completionAction = technicActions.find(a => a.name === 'ada.technic.jobCompleted');
                    
                    if (completionAction) {
                        // --- FastRTC MESH ROUTING LOGIC ---
                        traces.push(createLog('ada.marina', 'ROUTING', `[FAST-RTC MESH] Handoff: ada.technic -> ada.finance (Invoice Gen)`, 'ORCHESTRATOR'));
                        
                        // Automatically trigger Finance
                        const financeActions = await financeAgent.process(
                            { 
                                intent: 'create_invoice', 
                                vesselName: completionAction.params.vesselName, 
                                amount: completionAction.params.cost, 
                                serviceType: 'TECHNICAL_SERVICE' 
                            },
                            user, 
                            (t) => traces.push(t)
                        );
                        actions.push(...financeActions);
                        
                        const link = financeActions.find(a => a.name === 'ada.finance.paymentLinkGenerated')?.params?.link?.url;
                        
                        responseText = `**JOB COMPLETED & BILLED**\n\n**Service:** ${completionAction.params.summary}\n**Cost:** €${completionAction.params.cost}\n\n**[AUTO-GENERATED INVOICE](${link})**\n\n*Sent to vessel owner.*`;
                    } else {
                        responseText = `**ERROR:** No active job found to complete for ${vesselName}.`;
                    }
                }
            }
            // 3. Check Status
            else {
                const report = await technicAgent.checkStatus(vesselName, (t) => traces.push(t));
                responseText = report;
            }
        }
        // --- INTENT: REGISTER NEW VESSEL ---
        else if (lowerPrompt.includes('register vessel') || lowerPrompt.includes('new vessel') || lowerPrompt.includes('add vessel')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: REGISTER_VESSEL. Routing to Marina Agent.', 'ORCHESTRATOR'));

            if (user.role !== 'GENERAL_MANAGER') {
                traces.push(createLog('ada.marina', 'ERROR', `Access Denied: User role '${user.role}' lacks clearance for Vessel Registration.`, 'EXPERT'));
                responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Vessel Registration. This operation requires 'GENERAL_MANAGER' privileges.`;
            } else {
                const nameMatch = prompt.match(/name:\s*([^,]+)/i);
                const imoMatch = prompt.match(/imo:\s*(\d{7,9})/i);
                const typeMatch = prompt.match(/type:\s*([^,]+)/i);
                const flagMatch = prompt.match(/flag:\s*([A-Z]{2})/i);
                const loaMatch = prompt.match(/loa:\s*(\d+(\.\d+)?)\s*m/i);
                const beamMatch = prompt.match(/beam:\s*(\d+(\.\d+)?)\s*m/i);

                const vesselName = nameMatch ? nameMatch[1].trim() : '';
                const imo = imoMatch ? imoMatch[1].trim() : '';
                const type = typeMatch ? typeMatch[1].trim() : '';
                const flag = flagMatch ? flagMatch[1].trim().toUpperCase() : '';
                const loa = loaMatch ? parseFloat(loaMatch[1]) : undefined;
                const beam = beamMatch ? parseFloat(beamMatch[1]) : undefined;
                
                if (!vesselName || !imo || !type || !flag) {
                    responseText = `**REGISTRATION FAILED**\n\nMissing essential details. Please provide vessel name, IMO, type, and flag. (e.g., "Register vessel name: S/Y Voyager, IMO: 1234567, type: Sailing Yacht, flag: GR, LOA: 15.5m")`;
                    traces.push(createLog('ada.marina', 'ERROR', `Missing parameters for vessel registration.`, 'EXPERT'));
                } else {
                    traces.push(createLog('ada.marina', 'TOOL_EXECUTION', `Attempting to register vessel: ${vesselName} (IMO: ${imo})`, 'WORKER'));
                    const result = await marinaAgent.registerVessel(vesselName, imo, type, flag, loa, beam);

                    if (result.success) {
                        responseText = `**VESSEL REGISTRATION SUCCESSFUL**\n\nVessel: **${result.vessel?.name}** (IMO: ${result.vessel?.imo})\nType: ${result.vessel?.type} | Flag: ${result.vessel?.flag}\nLOA: ${result.vessel?.loa || 'N/A'}m\n\n*Welcome to West Istanbul Marina, Captain.*`;
                        responseText += `\n\n${generateComplianceSystemMessage('PII_MASKING_DISCLAIMER')}`; // Add Compliance Note
                        // Dynamically update VESSEL_KEYWORDS for current session
                        VESSEL_KEYWORDS.push(vesselName.toLowerCase());
                        traces.push(createLog('ada.marina', 'OUTPUT', `Vessel ${vesselName} added to internal registry.`, 'EXPERT'));
                    } else {
                        responseText = `**REGISTRATION FAILED**\n\n${result.message}`;
                        traces.push(createLog('ada.marina', 'ERROR', `Vessel registration failed: ${result.message}`, 'EXPERT'));
                    }
                }
            }
        }
        // --- INTENT: DOCKING / BERTH REQUEST (New Skill Integration) ---
        else if (lowerPrompt.includes('berth') || lowerPrompt.includes('dock') || lowerPrompt.includes('mooring') || lowerPrompt.includes('yanaşma') || lowerPrompt.includes('yer var')) {
             traces.push(createLog('ada.marina', 'ROUTING', 'Intent: BERTH_ALLOCATION. Routing to Marina Expert Agent.', 'ORCHESTRATOR'));
             
             // Simulate extracting params from context or prompt
             // Ideally, we would parse "18m" or similar from the prompt.
             const mockSpecs = { loa: 18.4, beam: 5.2, draft: 2.8 }; 
             
             traces.push(createLog('ada.marina', 'THINKING', `Extracted Specs: LOA ${mockSpecs.loa}m, Beam ${mockSpecs.beam}m`, 'EXPERT'));
             
             // 1. Check Weather (Simulated dependency)
             traces.push(createLog('ada.weather', 'TOOL_EXECUTION', 'Checking Wind Conditions for Approach...', 'WORKER'));
             const weatherStatus = "Wind NW 12kts (Safe)"; // Simulated
             traces.push(createLog('ada.weather', 'OUTPUT', `Conditions: ${weatherStatus}`, 'WORKER'));

             // 2. Run Allocation Skill
             const allocation = await marinaAgent.executeSkill_BerthAllocation(mockSpecs, (t) => traces.push(t));
             
             // 3. Calculate Fee Quote
             const dailyRate = wimMasterData.legal_framework.base_pricing.mooring_daily;
             const estPrice = Math.round(mockSpecs.loa * mockSpecs.beam * dailyRate);

             responseText = `**BERTH ASSIGNMENT: ${allocation.berth}**\n\n**Status:** Confirmed Available\n**Notes:** ${allocation.notes}\n**Conditions:** ${weatherStatus}\n\n**Quote:** €${estPrice}/day (Approx)\n\n*Please switch to Ch 14 for Pilot assistance.*`;
        }
        // --- INTENT: DEPARTURE ---
        else if (lowerPrompt.includes('departure') || lowerPrompt.includes('depart') || lowerPrompt.includes('check out') || lowerPrompt.includes('leave')) {
            
            const vesselName = findVesselInPrompt(lowerPrompt); 

            if (!vesselName) {
                responseText = `**DEPARTURE PROTOCOL**\n\nPlease specify which vessel is departing (e.g., "S/Y Phisedelia to depart").`;
                traces.push(createLog('ada.marina', 'ERROR', `Departure request missing vessel name.`, 'EXPERT'));
                return { text: responseText, actions: [], traces };
            }
            
            // RBAC Check: Guests cannot authorize departure.
            if (user.role === 'GUEST') {
                traces.push(createLog('ada.marina', 'ERROR', `Access Denied: User role 'GUEST' lacks clearance for Departure Operations.`, 'EXPERT'));
                responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Departure Operations. This operation requires 'CAPTAIN' or 'GENERAL_MANAGER' privileges.`;
                return { text: responseText, actions: [], traces };
            }

            // CRITICAL: New security check for legal status before financial checks
            if (user.legalStatus === 'RED') {
                traces.push(createLog('ada.legal', 'ERROR', `Departure Denied: User/Vessel is in legal breach. Overrides are not permitted.`, 'EXPERT'));
                responseText = `**DEPARTURE DENIED - LEGAL HOLD**\n\nDeparture for **${vesselName}** is blocked due to a legal breach on record. Please contact Marina Management to resolve the issue.`;
                return { text: responseText, actions: [], traces };
            }


            traces.push(createLog('ada.marina', 'THINKING', `Intent: IMMEDIATE_DEPARTURE for ${vesselName}. Initiating Fast-Path Protocol.`, 'ORCHESTRATOR'));
            traces.push(createLog('ada.finance', 'TOOL_EXECUTION', `Verifying account balance for ${vesselName}...`, 'EXPERT'));
            const debtStatus = await financeAgent.checkDebt(vesselName);

            if (debtStatus.status === 'DEBT') {
                 if (user.role === 'GENERAL_MANAGER') {
                    traces.push(createLog('ada.marina', 'PLANNING', `**OVERRIDE:** Debt detected (€${debtStatus.amount}) but User is GM. Authorizing departure with Warning.`, 'ORCHESTRATOR'));
                    const marinaActions = await marinaAgent.processDeparture(vesselName);
                    actions.push(...marinaActions);
                    const tender = marinaActions[0].params.tender;
                    responseText = `**ADA MARINA CONTROL | GM OVERRIDE**\n\nDeparture Authorized for **${vesselName}**. \n\n**WARNING:** Outstanding balance of €${debtStatus.amount} remains on ledger.\n**${tender}** is dispatched for immediate assist.`;
                 } else {
                    traces.push(createLog('ada.finance', 'OUTPUT', `ALERT: Outstanding balance detected: €${debtStatus.amount}`, 'EXPERT'));
                    const financeActions = await financeAgent.process({ intent: 'create_invoice', vesselName, amount: debtStatus.amount, serviceType: 'DEBT_CLEARANCE' }, user, (t) => traces.push(t));
                    actions.push(...financeActions);
                    const link = financeActions.find(a => a.name === 'ada.finance.paymentLinkGenerated')?.params?.link?.url;
                    responseText = `**DEPARTURE DENIED**\n\nOutstanding balance of **€${debtStatus.amount}** detected. Regulations prohibit departure until settlement.\n\n[SECURE PAYMENT LINK](${link}) \n\n*Please notify once paid.*`;
                 }
            } else {
                 traces.push(createLog('ada.finance', 'OUTPUT', `Balance: CLEAR. Authorization code generated.`, 'EXPERT'));
                 traces.push(createLog('ada.marina', 'PLANNING', `Dispatching pilotage and line handlers.`, 'EXPERT'));
                 const marinaActions = await marinaAgent.processDeparture(vesselName);
                 actions.push(...marinaActions);
                 const tender = marinaActions[0].params.tender;
                 responseText = `**EXIT APPROVED.**\n\n**${tender}** dispatched to your position. Switch to Ch 14 for handover.`;
            }

        } 
        else if (lowerPrompt.includes('phone') || lowerPrompt.includes('contact')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: MARINA_PHONE_NUMBER. Retrieving WIM contact data.'));
            const { phone } = wimMasterData.identity.contact;
            responseText = `**ADA MARINA | Contact:**\n\nPhone: **${phone}**\n\n*You can also reach us on VHF Channel 72 (Callsign: West Istanbul Marina).*`;
        }
        else if (lowerPrompt.includes('marine traffic') || lowerPrompt.includes('ais')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: LIVE_TRAFFIC_LINK. Providing MarineTraffic URL.'));
            const marineTrafficUrl = "https://www.marinetraffic.com/en/ais/home/centerx:28.665/centery:40.955/zoom:15";
            responseText = `**Live AIS Data (MarineTraffic):**\n\nYou can view the live vessel traffic around West Istanbul Marina via the link below.\n\n[📡 View Live Marine Traffic](${marineTrafficUrl})`;
        }
        else if ((lowerPrompt.includes('location') || lowerPrompt.includes('where')) && 
                 !VESSEL_KEYWORDS.some(v => lowerPrompt.includes(v))) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: MARINA_LOCATION. Retrieving WIM master data.'));
            const { name, location, contact } = wimMasterData.identity;
            const mapLink = `https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`;
            responseText = `**${name} Location & Contact:**\n\nLatitude: ${location.coordinates.lat}\nLongitude: ${location.coordinates.lng}\n\n[📍 View on Google Maps](${mapLink})\n\nPhone: **${contact.phone}**\nVHF: Channel ${contact.vhf_channels.public[0]} (Callsign: ${contact.call_sign})`;
        }
        // --- INTENT: VESSEL PROXIMITY SEARCH ---
        else if (lowerPrompt.includes('vessels near') || lowerPrompt.includes('tekneler') && lowerPrompt.includes('mil')) {
            // Regex to extract radius (e.g., "20 miles", "10 mil")
            const radiusMatch = lowerPrompt.match(/(\d+)\s*(miles|mil)/);
            const radius = radiusMatch ? parseInt(radiusMatch[1]) : 10; // Default to 10 miles if not specified

            // Regex to extract coordinates (DMS format)
            const coordinateMatch = prompt.match(/([NS]\s*\d+°\d+’\d+’’)\s*([EW]\s*\d+°\d+’\d+’’)/i);
            
            let centerLat: number, centerLng: number;
            let centerName: string = "West Istanbul Marina";

            if (coordinateMatch) {
                const dmsCoords = dmsToDecimal(coordinateMatch[0]);
                if (dmsCoords) {
                    centerLat = dmsCoords.lat;
                    centerLng = dmsCoords.lng;
                    centerName = "specified coordinates";
                } else {
                    traces.push(createLog('ada.marina', 'WARNING', `Could not parse coordinates from prompt. Using marina default.`, 'EXPERT'));
                    centerLat = wimMasterData.identity.location.coordinates.lat;
                    centerLng = wimMasterData.identity.location.coordinates.lng;
                }
            } else {
                centerLat = wimMasterData.identity.location.coordinates.lat;
                centerLng = wimMasterData.identity.location.coordinates.lng;
            }

            traces.push(createLog('ada.marina', 'ROUTING', `Intent: PROXIMITY_SEARCH. Searching for vessels near ${centerName} within ${radius} miles.`, 'ORCHESTRATOR'));

            const nearbyVessels = await marinaAgent.findVesselsNear(centerLat, centerLng, radius, (t) => traces.push(t));

            if (nearbyVessels.length > 0) {
                responseText = `**VESSELS WITHIN ${radius} MILES OF ${centerName.toUpperCase()}:**\n\n`;
                responseText += `| Vessel Name | Status | Distance (miles) |\n|---|---|---|\n`;
                nearbyVessels.sort((a, b) => a.distanceMiles - b.distanceMiles).forEach(v => {
                    responseText += `| **${v.vessel}** | ${v.status} | ${v.distanceMiles} |\n`;
                });
            } else {
                responseText = `**NEGATIVE CONTACT.** No vessels detected within ${radius} miles of ${centerName}.`;
            }
        }
        // --- INTENT: VESSEL INTELLIGENCE BRIEFING ---
        else if (lowerPrompt.includes('intel') || lowerPrompt.includes('briefing') || lowerPrompt.includes('details') || lowerPrompt.includes('give info')) {
            const vesselName = findVesselInPrompt(lowerPrompt);
            if(vesselName) {
                // RBAC Check: Guests cannot get sensitive intelligence.
                if (user.role === 'GUEST') {
                    traces.push(createLog('ada.marina', 'ERROR', `Access Denied: User role 'GUEST' lacks clearance for Vessel Intelligence.`, 'EXPERT'));
                    responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Vessel Intelligence operations.`;
                    return { text: responseText, actions: [], traces };
                }

                traces.push(createLog('ada.marina', 'ROUTING', `Intent: VESSEL_INTELLIGENCE. Querying MCP for "${vesselName}".`, 'ORCHESTRATOR'));
                
                const intel: VesselIntelligenceProfile | null = await marinaAgent.getVesselIntelligence(vesselName);
                
                if (intel) {
                    traces.push(createLog('ada.marina', 'TOOL_EXECUTION', `Internal DB: Found IMO "${intel.imo}" for vessel "${intel.name}".`, 'WORKER'));
                    traces.push(createLog('ada.marina', 'TOOL_EXECUTION', `Querying Kpler MCP with IMO: ${intel.imo}...`, 'EXPERT'));
                    traces.push(createLog('ada.marina', 'CODE_OUTPUT', `MCP Response received for IMO ${intel.imo}`, 'WORKER'));
                    responseText = `**INTELLIGENCE BRIEFING: ${intel.name.toUpperCase()}**
| Parameter | Value |
|---|---|
| **IMO** | \`${intel.imo}\` |
| **Flag** | ${intel.flag} |
| **Type** | ${intel.type} |
| **Specs** | ${intel.loa || 'N/A'}m LOA / ${intel.beam || 'N/A'}m Beam / ${intel.dwt || 'N/A'} DWT |
| **Status** | **${intel.status}** at ${intel.location} |
| **Last Port** | ${intel.voyage?.lastPort || 'N/A'} |
| **Next Port** | **${intel.voyage?.nextPort || 'N/A'}** (ETA: ${intel.voyage?.eta || 'N/A'}) |
`;
                } else {
                     responseText = `**Negative Contact.** No intelligence data available for a vessel matching "${vesselName}".`;
                }
            } else {
                 responseText = "Please specify a vessel name for the intelligence briefing (e.g., 'intel on Phisedelia').";
            }
        }
        // --- INTENT: FLEET INTELLIGENCE ---
        else if (lowerPrompt.includes('where is') || lowerPrompt.includes('nerede') || lowerPrompt.includes('burada mı') || lowerPrompt.includes('tekneleri') || lowerPrompt.includes('list') || lowerPrompt.includes('hangi') || lowerPrompt.includes('konum') || lowerPrompt.includes('location of')) {
            
            // RBAC Check: Guests cannot get fleet intelligence.
            if (user.role === 'GUEST') {
                traces.push(createLog('ada.marina', 'ERROR', `Access Denied: User role 'GUEST' lacks clearance for Fleet Intelligence.`, 'EXPERT'));
                responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Fleet Intelligence operations.`;
                return { text: responseText, actions: [], traces };
            }
            
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: FLEET_INTELLIGENCE. Querying Registry Database.'));
            let queryResult;
            const lengthMatch = lowerPrompt.match(/(\d+)\s*(m|metre|meter)/);
            if (lengthMatch && (lowerPrompt.includes('üzeri') || lowerPrompt.includes('over') || lowerPrompt.includes('büyük') || lowerPrompt.includes('larger than'))) {
                const minLength = parseInt(lengthMatch[1]);
                queryResult = await marinaAgent.queryFleet('FILTER', { minLength }, (t) => traces.push(t));
            } 
            else {
                const vesselName = findVesselInPrompt(lowerPrompt);
                if (vesselName) {
                    queryResult = await marinaAgent.queryFleet('LOCATE', { vesselName }, (t) => traces.push(t));
                } else {
                    queryResult = await marinaAgent.queryFleet('FILTER', { minLength: 0 }, (t) => traces.push(t));
                }
            }
            responseText = queryResult.text;
            actions.push(...queryResult.actions);
        }
        // --- INTENT: FINANCIAL TRANSACTION (Debt Check) ---
        else if (lowerPrompt.includes('debt') || lowerPrompt.includes('balance')) {
            const vesselName = findVesselInPrompt(lowerPrompt) || 's/y phisedelia'; // Default or extracted
            traces.push(createLog('ada.marina', 'ROUTING', `Intent: FINANCIAL_DEBT_CHECK for ${vesselName}. Handing over to Finance Agent.`, 'ORCHESTRATOR'));

            if (user.role === 'GUEST') {
                traces.push(createLog('ada.finance', 'ERROR', `Access Denied: User role '${user.role}' lacks clearance for Financial Operations.`,'EXPERT'));
                 responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Financial Operations. Please contact the General Manager or Captain.`;
            } else {
                traces.push(createLog('ada.finance', 'TOOL_EXECUTION', `Checking account balance for ${vesselName}...`, 'EXPERT'));
                const debtStatus = await financeAgent.checkDebt(vesselName);

                if (debtStatus.status === 'DEBT') {
                    responseText = `**FINANCIAL STATUS: ${vesselName}**\n\n**ALERT:** Outstanding balance of **€${debtStatus.amount}** detected.`;
                } else {
                    responseText = `**FINANCIAL STATUS: ${vesselName}**\n\nAccount is **CLEAR**. No outstanding debt.`;
                }
            }
        }
        // --- INTENT: FINANCIAL TRANSACTION (Invoice/Payment) ---
        else if (lowerPrompt.includes('invoice') || lowerPrompt.includes('pay')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: FINANCIAL_TRANSACTION (Invoice/Payment). Handing over to Finance Agent.'));
            
            const financeActions = await financeAgent.process(
                { intent: 'create_invoice', vesselName: 's/y phisedelia', amount: 1500, serviceType: 'GENERAL' }, // Default for demo
                user, 
                (t) => traces.push(t)
            );
            
            actions.push(...financeActions);
            
            const denied = financeActions.find(a => a.name.includes('accessDenied'));
            if (denied) {
                responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Financial Operations. Please contact the General Manager.`;
            } else {
                const link = financeActions.find(a => a.name === 'ada.finance.paymentLinkGenerated')?.params?.link?.url;
                responseText = `**INVOICE GENERATED**\n\nProvider: **Parasut**\nLink: [Secure Pay](${link || '#'})\n\n*Awaiting confirmation.*`;
                responseText += `\n\n${generateComplianceSystemMessage('CREDIT_CARD_DISCLAIMER')}`; // Add Compliance Note
            }

        }
        // --- INTENT: PROCESS PAYMENT ---
        else if (lowerPrompt.includes('payment confirmed') || lowerPrompt.includes('process payment') || lowerPrompt.includes('payment made')) {
            const vesselName = findVesselInPrompt(lowerPrompt) || 's/y phisedelia'; // Default or extracted
            const paymentRefMatch = prompt.match(/ref:\s*(\w+-\d+)/i);
            const paymentRef = paymentRefMatch ? paymentRefMatch[1] : `MANUAL_CONFIRM_${Date.now()}`;
            const amountMatch = prompt.match(/amount:\s*(\d+(\.\d+)?)/i);
            const amount = amountMatch ? parseFloat(amountMatch[1]) : (await financeAgent.checkDebt(vesselName)).amount; // Default to outstanding

            traces.push(createLog('ada.marina', 'ROUTING', `Intent: PROCESS_PAYMENT for ${vesselName}. Handing over to Finance Agent.`, 'ORCHESTRATOR'));

            if (user.role !== 'GENERAL_MANAGER' && user.role !== 'CAPTAIN') { // Assuming Captain can also confirm payments for their vessel
                traces.push(createLog('ada.finance', 'ERROR', `Access Denied: User role '${user.role}' lacks clearance for Payment Confirmation.`, 'EXPERT'));
                responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Payment Confirmation. This operation requires 'GENERAL_MANAGER' or 'CAPTAIN' privileges.`;
            } else {
                const financeActions = await financeAgent.processPayment(vesselName, paymentRef, amount, (t) => traces.push(t));
                actions.push(...financeActions);
                
                const confirmedAction = financeActions.find(a => a.name === 'ada.finance.paymentConfirmed');
                if (confirmedAction) {
                    responseText = `**PAYMENT CONFIRMED**\n\nVessel **${vesselName}**'s outstanding debt of **€${confirmedAction.params.amount}** has been settled. Account is now CLEAR. Loyalty score updated.`;
                    responseText += `\n\n${generateComplianceSystemMessage('FINANCIAL_DATA_USAGE_DISCLAIMER')}`;
                } else {
                    responseText = `**PAYMENT PROCESSING FAILED**\n\nCould not confirm payment for ${vesselName}. Please check logs.`;
                }
            }
        }
        // --- INTENT: DAILY SETTLEMENT REPORT ---
        else if (lowerPrompt.includes('daily payments') || lowerPrompt.includes('settlement report') || lowerPrompt.includes('bank statement')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: DAILY_SETTLEMENT_REPORT. Handing over to Finance Agent.', 'ORCHESTRATOR'));

            if (user.role !== 'GENERAL_MANAGER') {
                traces.push(createLog('ada.finance', 'ERROR', `Access Denied: User role '${user.role}' lacks clearance for Daily Settlement Reports.`, 'EXPERT'));
                responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Daily Settlement Reports. This operation requires 'GENERAL_MANAGER' privileges.`;
            } else {
                const settlementResult = await financeAgent.fetchDailySettlement((t) => traces.push(t));
                actions.push(...settlementResult.actions);
                responseText = settlementResult.text;
                responseText += `\n\n${generateComplianceSystemMessage('FINANCIAL_DATA_USAGE_DISCLAIMER')}`;
            }
        }
        // --- INTENT: PAYMENT ASSISTANCE ---
        else if (lowerPrompt.includes('payment plan') || lowerPrompt.includes('can\'t pay') || lowerPrompt.includes('difficulties with payment') || (lowerPrompt.includes('need') && lowerPrompt.includes('help to pay'))) {
            const vesselName = findVesselInPrompt(lowerPrompt) || 's/y phisedelia'; // Default or extracted
            traces.push(createLog('ada.marina', 'ROUTING', `Intent: PAYMENT_ASSISTANCE for ${vesselName}. Handing over to Customer Agent.`, 'ORCHESTRATOR'));

            if (user.role === 'GUEST') {
                traces.push(createLog('ada.customer', 'ERROR', `Access Denied: User role '${user.role}' lacks clearance for Payment Assistance.`, 'EXPERT'));
                responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Payment Assistance. Please contact the General Manager or Captain.`;
            } else {
                const intelProfile = await marinaAgent.getVesselIntelligence(vesselName);
                if (!intelProfile) {
                    responseText = `**PAYMENT ASSISTANCE FAILED**\n\nCould not retrieve vessel intelligence for ${vesselName}. Please ensure the vessel is registered.`;
                    traces.push(createLog('ada.customer', 'ERROR', `Could not retrieve intelligence for ${vesselName}.`, 'EXPERT'));
                } else {
                    // FIX: Call the new proposePaymentPlan method and safely access loyaltyTier
                    const customerActions = await customerAgent.proposePaymentPlan(intelProfile, (t) => traces.push(t));
                    actions.push(...customerActions);
                    
                    const proposal = customerActions.find(a => a.name === 'ada.finance.proposePaymentPlan')?.params;
                    if (proposal) {
                        responseText = `**ADA CUSTOMER | PAYMENT ASSISTANCE PROPOSAL**\n\nFor **${intelProfile.name}** (Loyalty: ${intelProfile.loyaltyTier || 'Standard'}), given **${intelProfile.paymentHistoryStatus}** status:\n\n**Recommendation to GM:** ${proposal.recommendation}\n**Customer Message:** ${proposal.customerMessage}\n\n*Requires General Manager approval.*`;
                    } else {
                        responseText = `**PAYMENT ASSISTANCE FAILED**\n\nCould not generate a payment plan proposal for ${vesselName}.`;
                    }
                }
            }
        }
        // --- INTENT: NAVIGATION SAFETY ---
        else if (lowerPrompt.includes('collision') || lowerPrompt.includes('rule') || lowerPrompt.includes('overtaking') || lowerPrompt.includes('speed') || lowerPrompt.includes('navigation')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: NAVIGATION_SAFETY. Routing to Sea Agent (COLREGs).'));
            
            const seaActions = await seaAgent.process({ 
                situation: lowerPrompt.includes('crossing') ? 'crossing' : 'overtaking',
                mySpeed: 12,
                targetBearing: 45,
                visibility: lowerPrompt.includes('fog') ? 'low' : 'good'
            });
            actions.push(...seaActions);
            
            const maneuver = seaActions.find(a => a.name === 'ada.sea.maneuver');
            responseText = `**COLREGs ADVISORY:** \n\n${maneuver ? `**Action Required:** ${maneuver.params.action} (Rule ${maneuver.params.rule})` : 'Proceed with caution.'}`;

        } 
        // --- INTENT: LEGAL / REGULATIONS ---
        else if (lowerPrompt.includes('contract') || lowerPrompt.includes('legal') || lowerPrompt.includes('regulation') || lowerPrompt.includes('overstay') || lowerPrompt.includes('penalty') || lowerPrompt.includes('fees') || lowerPrompt.includes('breach') || lowerPrompt.includes('fine') || lowerPrompt.includes('refund') || lowerPrompt.includes('cancellation') || lowerPrompt.includes('terms') || lowerPrompt.includes('agreement')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: LEGAL_CONSULTATION. Routing to Legal Agent (RAG).'));
            const vesselName = findVesselInPrompt(lowerPrompt) || "s/y phisedelia"; // Default or extracted from context if available
            traces.push(createLog('ada.finance', 'TOOL_EXECUTION', `Security Protocol: Verifying financial standing of ${vesselName} before granting Legal access...`, 'WORKER'));
            const debtCheck = await financeAgent.checkDebt(vesselName);

            if (debtCheck.status === 'DEBT' && user.role !== 'GENERAL_MANAGER' && user.role !== 'CAPTAIN') { // GUEST with debt cannot access legal
                 traces.push(createLog('ada.marina', 'ERROR', `Access Denied: Vessel has outstanding debt of €${debtCheck.amount}.`, 'ORCHESTRATOR'));
                 responseText = `**ACCESS DENIED**\n\nAccess to **ada.legal** services is suspended due to an outstanding balance of **€${debtCheck.amount}**.\n\nPlease settle your account via **ada.finance** before requesting legal consultations.`;
                 return { text: responseText, actions: [], traces };
            }
            
            if (debtCheck.status === 'DEBT' && (user.role === 'GENERAL_MANAGER' || user.role === 'CAPTAIN')) { // GM/Captain with debt can override
                 traces.push(createLog('ada.marina', 'PLANNING', `GM/Captain Override: Granting Legal Access despite debt.`, 'ORCHESTRATOR'));
            } else {
                 traces.push(createLog('ada.finance', 'OUTPUT', `Financial Status: GREEN. Access Granted.`, 'WORKER'));
            }

            const legalActions = await legalAgent.process({ query: prompt }, user, (t) => traces.push(t));
            actions.push(...legalActions);

            const denied = legalActions.find(a => a.name.includes('accessDenied'));
            if (denied) {
                responseText = `**CLASSIFIED DATA** \n\nAccess to **ada.legal** Knowledge Graph is restricted to GENERAL_MANAGER or CAPTAIN roles only.`;
            } else {
                const advice = legalActions.find(a => a.name === 'ada.legal.consultation')?.params?.advice;
                responseText = `**Legal Opinion (WIM Regulations):**\n\n${advice}`;
                
                if (lowerPrompt.includes('kvkk') || lowerPrompt.includes('data') || lowerPrompt.includes('privacy')) {
                    responseText += `\n\n${generateComplianceSystemMessage('PII_MASKING_DISCLAIMER')}`;
                }
            }

        } else {
            traces.push(createLog('ada.marina', 'THINKING', 'Standard inquiry. Handling locally via LLM.'));
            responseText = ""; 
        }

        traces.push(createLog('ada.marina', 'OUTPUT', 'Execution complete.'));

        return { text: responseText, actions, traces };
    }
};
