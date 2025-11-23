
// services/orchestratorService.ts

import { AgentAction, AgentTraceLog, UserProfile, OrchestratorResponse, NodeName, VesselIntelligenceProfile, Tender } from '../types';
import { seaExpert } from './agents/seaAgent';
import { financeExpert } from './agents/financeAgent';
import { legalExpert } from './agents/legalAgent';
import { marinaExpert } from './agents/marinaAgent';
import { customerExpert } from './agents/customerAgent';
import { technicExpert } from './agents/technicAgent';
import { passkitExpert } from './agents/passkitAgent'; 
import { securityExpert } from './agents/securityAgent'; 
import { kitesExpert } from './agents/travelAgent'; 
import { congressExpert } from './agents/congressAgent';
import { facilityExpert } from './agents/facilityAgent'; 
import { hrExpert } from './agents/hrAgent';
import { commercialExpert } from './agents/commercialAgent';
import { analyticsExpert } from './agents/analyticsAgent';
import { berthExpert } from './agents/berthAgent';
import { reservationsExpert } from './agents/reservationsAgent';
import { wimMasterData } from './wimMasterData';
import { dmsToDecimal } from './utils';
import { generateComplianceSystemMessage } from './prompts';
import { VESSEL_KEYWORDS } from './constants';

type ExpertName = 'FINANCE' | 'TECHNIC' | 'LEGAL' | 'MARINA' | 'CUSTOMER' | 'SECURITY' | 'TRAVEL' | 'CONGRESS' | 'FACILITY' | 'HR' | 'COMMERCIAL' | 'ANALYTICS' | 'BERTH' | 'RESERVATIONS';

interface RouterIntent {
    target: ExpertName;
    confidence: number;
    reasoning: string;
}

const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

class Router {
    static route(prompt: string, user: UserProfile): RouterIntent {
        const lower = prompt.toLowerCase();

        // INTERNAL OPS
        if (lower.includes('vardiya') || lower.includes('shift') || lower.includes('personel') || lower.includes('staff') || lower.includes('patrol') || lower.includes('devriye')) {
            return { target: 'HR', confidence: 0.95, reasoning: 'HR and staff management keywords detected.' };
        }
        if (lower.includes('kiracı') || lower.includes('tenant') || lower.includes('dükkan') || lower.includes('shop') || lower.includes('kira') || lower.includes('rent')) {
            return { target: 'COMMERCIAL', confidence: 0.95, reasoning: 'Commercial tenant and lease keywords detected.' };
        }
        if (lower.includes('analiz') || lower.includes('analysis') || lower.includes('tahmin') || lower.includes('predict') || lower.includes('forecast') || lower.includes('rapor')) {
            return { target: 'ANALYTICS', confidence: 0.9, reasoning: 'Analytics and prediction keywords detected.' };
        }

        // FACILITY / ZERO WASTE / BLUE FLAG / PEDESTAL
        if (lower.includes('zero waste') || lower.includes('sıfır atık') || lower.includes('sifir atik') || lower.includes('recycling') || lower.includes('geri dönüşüm') || lower.includes('pedestal') || lower.includes('ponton') || lower.includes('yangın dolabı') || lower.includes('tesis') || lower.includes('facility') || lower.includes('denetim') || lower.includes('audit') || lower.includes('blue flag') || lower.includes('mavi bayrak') || lower.includes('sea water') || lower.includes('deniz suyu') || lower.includes('analiz') || lower.includes('analysis') || lower.includes('clean') || lower.includes('temiz') || lower.includes('elektriğ') || lower.includes('suyu kes') || lower.includes('power') || lower.includes('utility')) {
            return { target: 'FACILITY', confidence: 0.9, reasoning: 'Facility/Env/Blue Flag/Pedestal keywords detected.' };
        }

        if (lower.includes('congress') || lower.includes('kongre') || lower.includes('event') || lower.includes('etkinlik') || lower.includes('delegate') || lower.includes('delegasyon')) {
            return { target: 'CONGRESS', confidence: 0.9, reasoning: 'Congress/Event keywords detected.' };
        }

        // BOOKINGS / RESERVATIONS
        if (lower.includes('booking') || lower.includes('reservation') || lower.includes('rezervasyon') || (lower.includes('yer') && lower.includes('ayır'))) {
            if (lower.includes('poem') || lower.includes('fersah') || lower.includes('restaurant')) return { target: 'CUSTOMER', confidence: 0.8, reasoning: 'Dining booking.' };
            return { target: 'RESERVATIONS', confidence: 0.9, reasoning: 'Berth booking request detected.' };
        }

        if (lower.includes('vurdu') || lower.includes('çarptı') || lower.includes('collision') || lower.includes('hit') || lower.includes('damage') || lower.includes('hasar') || lower.includes('inkar')) {
            return { target: 'SECURITY', confidence: 0.99, reasoning: 'Collision/Incident keywords detected.' };
        }

        if (lower.includes('invoice') || lower.includes('pay') || lower.includes('debt') || lower.includes('balance') || lower.includes('sigorta') || lower.includes('insurance') || lower.includes('policy') || lower.includes('kasko') || lower.includes('poliçe') || lower.includes('komisyon') || lower.includes('commission') || lower.includes('hediye') || lower.includes('gift')) {
            return { target: 'FINANCE', confidence: 0.9, reasoning: 'Financial/Insurance/Commission keywords detected.' };
        }
        if (lower.includes('repair') || lower.includes('service') || lower.includes('technic') || lower.includes('haul') || lower.includes('job') || lower.includes('pis su') || lower.includes('atık') || lower.includes('blue card') || lower.includes('mavi kart')) {
            return { target: 'TECHNIC', confidence: 0.9, reasoning: 'Technical service/Waste keywords detected.' };
        }
        if (lower.includes('contract') || lower.includes('legal') || lower.includes('rule') || lower.includes('regulation') || lower.includes('kvkk')) {
            return { target: 'LEGAL', confidence: 0.9, reasoning: 'Legal/Regulatory keywords detected.' };
        }
        
        // UPDATED: Cross-Border Travel & Dining (Symi, Greek Islands) goes to TRAVEL
        if (lower.includes('acil dön') || lower.includes('urgent return') || lower.includes('emergency exit') || lower.includes('hemen dön') || lower.includes('uçak') || lower.includes('flight') || lower.includes('transfer') || lower.includes('bilet') || lower.includes('ticket') || lower.includes('hotel') || lower.includes('otel') || lower.includes('tatil') || lower.includes('symi') || lower.includes('simi') || lower.includes('yunan') || lower.includes('greek') || lower.includes('manos') || lower.includes('pantelis')) {
            return { target: 'TRAVEL', confidence: 0.95, reasoning: 'Travel/Urgent Exit/Cross-Border keywords detected.' };
        }
        
        if (lower.includes('wifi') || lower.includes('restaurant') || lower.includes('taxi') || lower.includes('market') || lower.includes('plan') || lower.includes('poem') || lower.includes('fersah') || lower.includes('eat') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('otopark') || lower.includes('parking') || lower.includes('ispark') || lower.includes('fiş') || lower.includes('ticket') || lower.includes('yarış') || lower.includes('race') || lower.includes('party')) {
            return { target: 'CUSTOMER', confidence: 0.8, reasoning: 'General inquiry/Customer/Dining/Parking service keywords.' };
        }
        
        return { target: 'MARINA', confidence: 0.5, reasoning: 'Defaulting to Marina Operations.' };
    }
}

export const orchestratorService = {
    async processRequest(prompt: string, user: UserProfile, tenders: Tender[]): Promise<OrchestratorResponse> {
        const traces: AgentTraceLog[] = [];
        const actions: AgentAction[] = [];
        let responseText = "";

        traces.push(createLog('ada.marina', 'ROUTING', `Signal Received: "${prompt}"`));

        const intent = Router.route(prompt, user);
        traces.push(createLog('ada.marina', 'ROUTING', `Routing to ${intent.target} Expert (Confidence: ${intent.confidence})`, 'ORCHESTRATOR'));

        const findVesselInPrompt = (p: string) => VESSEL_KEYWORDS.find(v => p.toLowerCase().includes(v));
        const vesselName = findVesselInPrompt(prompt) || (user.role === 'CAPTAIN' ? 'S/Y Phisedelia' : 's/y phisedelia');

        // RBAC Check for GM-only agents
        const gmOnlyAgents: ExpertName[] = ['HR', 'COMMERCIAL', 'ANALYTICS', 'BERTH'];
        if (gmOnlyAgents.includes(intent.target) && user.role !== 'GENERAL_MANAGER') {
             responseText = `**ACCESS DENIED**\n\nThis information requires General Manager clearance.`;
             return { text: responseText, actions, traces };
        }

        switch (intent.target) {
            case 'HR':
                if (prompt.toLowerCase().includes('vardiya') || prompt.toLowerCase().includes('shift')) {
                    const res = await hrExpert.getShiftSchedule('Security', t => traces.push(t));
                    responseText = `**SECURITY SHIFT (Today):**\n` + res.schedule.map(s => `- ${s.name} (${s.shift}) - ${s.status}`).join('\n');
                } else {
                    const res = await hrExpert.trackPatrolStatus(t => traces.push(t));
                    responseText = res.message;
                }
                break;
            
            case 'COMMERCIAL':
                const leases = await commercialExpert.getTenantLeases(t => traces.push(t));
                const overdue = leases.filter(l => l.status === 'OVERDUE');
                responseText = `**COMMERCIAL TENANT OVERVIEW:**\n- Total Leases: ${leases.length}\n- Overdue Rent: ${overdue.length}\n\n`
                if(overdue.length > 0) {
                    responseText += `**Overdue Tenants:**\n${overdue.map(o => `- ${o.name} (€${o.rent})`).join('\n')}`;
                }
                break;

            case 'ANALYTICS':
                 if (prompt.toLowerCase().includes('what if') || prompt.toLowerCase().includes('senaryo')) {
                     const res = await analyticsExpert.runWhatIfScenario(prompt, t => traces.push(t));
                     responseText = res.message;
                 } else {
                     const res = await analyticsExpert.predictOccupancy('3M', t => traces.push(t));
                     responseText = res.message;
                 }
                 break;

            case 'FACILITY':
                if (prompt.toLowerCase().includes('waste') || prompt.toLowerCase().includes('atık') || prompt.toLowerCase().includes('denetim') || prompt.toLowerCase().includes('audit')) {
                    const report = await facilityExpert.generateZeroWasteReport(t => traces.push(t));
                    responseText = report.message;
                } else if (prompt.toLowerCase().includes('blue flag') || prompt.toLowerCase().includes('mavi bayrak') || prompt.toLowerCase().includes('water') || prompt.toLowerCase().includes('deniz') || prompt.toLowerCase().includes('clean') || prompt.toLowerCase().includes('temiz')) {
                    const report = await facilityExpert.checkSeaWaterQuality(t => traces.push(t));
                    responseText = report.message;
                } else if (prompt.toLowerCase().includes('power') || prompt.toLowerCase().includes('elektrik') || prompt.toLowerCase().includes('pedestal') || prompt.toLowerCase().includes('utility')) {
                    if (user.role === 'CAPTAIN') {
                        const result = await facilityExpert.controlPedestal("Pedestal-C12", "toggle", t => traces.push(t));
                        responseText = result.message;
                    } else {
                        const status = await facilityExpert.checkInfrastructureStatus(t => traces.push(t));
                        responseText = `**FACILITY STATUS**\nSystem: ${status.status}\nAlerts: ${status.alerts.length > 0 ? status.alerts.join(', ') : 'None'}`;
                    }
                } else {
                    const status = await facilityExpert.checkInfrastructureStatus(t => traces.push(t));
                    responseText = `**FACILITY STATUS**\nSystem: ${status.status}\nAlerts: ${status.alerts.length > 0 ? status.alerts.join(', ') : 'None'}`;
                }
                break;

            case 'CONGRESS':
                const event = await congressExpert.getEventDetails();
                responseText = `**ACTIVE EVENT: ${event.name}**\nStatus: ${event.status}\nDelegates: ${event.delegateCount}`;
                break;

            case 'TRAVEL':
                // Handle Cross-Border Dining (Symi/Pantelis) in Travel Node
                if (prompt.toLowerCase().includes('symi') || prompt.toLowerCase().includes('simi') || prompt.toLowerCase().includes('manos') || prompt.toLowerCase().includes('pantelis')) {
                    let venue = "Pantelis";
                    if (prompt.toLowerCase().includes('manos')) venue = "Manos";
                    const res = await kitesExpert.manageCrossBorderDining(venue, 4, "20:00", t => traces.push(t));
                    responseText = res.message;
                } 
                else if (prompt.toLowerCase().includes('acil') || prompt.toLowerCase().includes('urgent')) {
                    const extraction = await kitesExpert.arrangeEmergencyExit({ lat: 36.6, lng: 28.9 }, 'Istanbul', t => traces.push(t));
                    responseText = extraction.message;
                } else {
                    responseText = "Kites Travel (TÜRSAB A-2648) at your service. How can I assist with your travel plans?";
                }
                break;

            case 'RESERVATIONS':
                const resResult = await reservationsExpert.processBooking({ name: "Guest Vessel", type: "Yacht", loa: 15, beam: 4.5 }, { start: "Tomorrow", end: "Next Week" }, t => traces.push(t));
                responseText = resResult.message;
                break;

            case 'SECURITY':
                const offendingVesselMatch = prompt.match(/'([^']+)'/) || prompt.match(/"([^"]+)"/);
                const offendingVessel = offendingVesselMatch ? offendingVesselMatch[1] : "Unknown Vessel";
                const cctvResult = await securityExpert.reviewCCTV("Pontoon A", "Last 5 mins", t => traces.push(t));
                
                if (cctvResult.confirmed) {
                    const banAction = await securityExpert.flagVessel(offendingVessel, "Collision & Dispute", t => traces.push(t));
                    actions.push(...banAction);
                    const dispatchAction = await securityExpert.dispatchGuard("Pontoon A-05", "URGENT", t => traces.push(t));
                    actions.push(...dispatchAction);
                    actions.push({
                        id: `incident_log_${Date.now()}`,
                        kind: 'internal',
                        name: 'ada.marina.log_operation',
                        params: {
                            message: `[INCIDENT] COLLISION CONFIRMED | VICTIM:${vesselName.toUpperCase()} | OFFENDER:${offendingVessel.toUpperCase()} | STS:RED_FLAG`,
                            type: 'critical'
                        }
                    });
                    responseText = `**KRİTİK OLAY PROTOKOLÜ DEVREDE**\n\nSayın Kaptan, endişe etmeyiniz. Durum kontrolümüz altındadır.\n\n1. **Güvenlik Teyidi:** Ponton A CCTV kayıtları incelendi. Temas ve hasar görsel olarak teyit edilmiştir.\n2. **Yasal İşlem:** '${offendingVessel.toUpperCase()}' için **KIRMIZI BAYRAK** (Red Flag) açıldı. Seyirden Men (Departure Ban) prosedürü başlatıldı.\n3. **Saha Müdahalesi:** Güvenlik Botu ve olay yeri inceleme ekibi yanınıza intikal ediyor.`;
                } else {
                    responseText = "Kamera kayıtları inceleniyor, lütfen bekleyiniz...";
                }
                break;

            case 'FINANCE':
                if (user.role === 'GUEST') {
                    responseText = `**ACCESS DENIED**\n\nFinancial operations require authorized clearance.`;
                } else {
                    if (prompt.toLowerCase().includes('sigorta') || prompt.toLowerCase().includes('insurance')) {
                        const quoteRes = await financeExpert.generateInsuranceQuote(vesselName, 1500000, t => traces.push(t));
                        responseText = quoteRes.success ? quoteRes.message : "Unable to generate insurance quotes.";
                    } 
                    else if (prompt.toLowerCase().includes('komisyon') || prompt.toLowerCase().includes('commission')) {
                        if (user.role === 'GENERAL_MANAGER') {
                            let partner = "Poem Restaurant";
                            if (prompt.toLowerCase().includes('hediye') || prompt.toLowerCase().includes('gift')) {
                                const beneficiary = "Ahmet Bey";
                                const res = await financeExpert.process({ intent: 'gift_commission', partnerName: partner, beneficiary }, user, t => traces.push(t));
                                actions.push(...res);
                                responseText = `**LOYALTY GIFT PROCESSED**\n\nAccrued commissions from **${partner}** converted into Voucher for **${beneficiary}**.`;
                            } else {
                                const res = await financeExpert.process({ intent: 'invoice_partner', partnerName: partner }, user, t => traces.push(t));
                                actions.push(...res);
                                responseText = `**B2B INVOICE GENERATED**\n\nMonthly Commission Invoice created for **${partner}**.\nAmount: **€450.00**.\n\n*Status: Sent to Paraşüt.*`;
                            }
                        } else {
                            responseText = "Commission data is restricted to General Manager.";
                        }
                    }
                    else if (prompt.toLowerCase().includes('debt') || prompt.toLowerCase().includes('balance')) {
                        const status = await financeExpert.checkDebt(vesselName);
                        responseText = status.status === 'DEBT' ? `**FINANCE ALERT:** ${vesselName} has an outstanding balance of **€${status.amount}**.` : `**ACCOUNT CLEAR:** ${vesselName} is in good standing.`;
                    } else if (prompt.toLowerCase().includes('pay') || prompt.toLowerCase().includes('invoice')) {
                        const res = await financeExpert.process({ intent: 'create_invoice', vesselName, amount: 1500, serviceType: 'GENERAL' }, user, t => traces.push(t));
                        actions.push(...res);
                        const link = res.find(a => a.name.includes('paymentLink'))?.params?.link?.url;
                        responseText = `**INVOICE GENERATED**\n\n[Pay Securely via Iyzico](${link})`;
                    }
                }
                break;

            case 'TECHNIC':
                if (prompt.toLowerCase().includes('schedule') || prompt.toLowerCase().includes('book')) {
                     const date = new Date().toISOString().split('T')[0];
                     const res = await technicExpert.scheduleService(vesselName, 'HAUL_OUT', date, t => traces.push(t));
                     responseText = res.message;
                } else if (prompt.toLowerCase().includes('pis su') || prompt.toLowerCase().includes('atık') || prompt.toLowerCase().includes('blue card') || prompt.toLowerCase().includes('mavi kart')) {
                    const blueCardVessel = user.role === 'CAPTAIN' ? 'S/Y Phisedelia' : vesselName;
                    const res = await technicExpert.processBlueCard(blueCardVessel, "Pontoon C-12", 150, t => traces.push(t));
                    actions.push(...res.actions);
                    responseText = res.message;
                } else {
                    responseText = await technicExpert.checkStatus(vesselName, t => traces.push(t));
                }
                break;

            case 'LEGAL':
                const resLegal = await legalExpert.process({ query: prompt }, user, t => traces.push(t));
                actions.push(...resLegal);
                const advice = resLegal.find(a => a.name === 'ada.legal.consultation')?.params?.advice;
                responseText = advice || "Access Denied or No Info.";
                if (prompt.toLowerCase().includes('kvkk')) responseText += `\n\n${generateComplianceSystemMessage('PII_MASKING_DISCLAIMER')}`;
                break;

            case 'CUSTOMER':
                if (prompt.toLowerCase().includes('payment plan')) {
                     const intel = await marinaExpert.getVesselIntelligence(vesselName);
                     if (intel) {
                         const res = await customerExpert.proposePaymentPlan(intel, t => traces.push(t));
                         actions.push(...res);
                         responseText = `**PAYMENT PLAN PROPOSAL**\n\nSubmitted to GM for review.`;
                     }
                } 
                else if (prompt.toLowerCase().includes('poem') || prompt.toLowerCase().includes('fersah') || prompt.toLowerCase().includes('restaurant')) {
                    let venue = 'Poem Restaurant';
                    let preOrder = null;
                    if (prompt.toLowerCase().includes('levrek')) preOrder = "Grilled Sea Bass (Levrek Izgara) x 2";
                    const res = await customerExpert.manageDiningReservation(venue, 4, "19:30", preOrder, t => traces.push(t));
                    if (res.success) actions.push({ id: `dining_${Date.now()}`, kind: 'internal', name: 'ada.customer.diningReservation', params: { venue } });
                    responseText = res.message;
                }
                else if (prompt.toLowerCase().includes('otopark') || prompt.toLowerCase().includes('ispark')) {
                    const res = await customerExpert.issueParkingValidation("34 XX 99", t => traces.push(t));
                    actions.push(...res.actions);
                    responseText = res.message;
                }
                else if (prompt.toLowerCase().includes('yarış') || prompt.toLowerCase().includes('event')) {
                    const events = await customerExpert.getUpcomingEvents(t => traces.push(t));
                    responseText = `**MARINA EVENT CALENDAR**\n\n` + events.map(e => `📅 **${e.date}**: ${e.name}`).join('\n');
                }
                else {
                    const res = await customerExpert.handleGeneralInquiry(prompt, t => traces.push(t));
                    responseText = res.text;
                }
                break;

            case 'MARINA':
            default:
                if (prompt.toLowerCase().includes('scan') || prompt.toLowerCase().includes('radar')) {
                     const nearby = await marinaExpert.findVesselsNear(wimMasterData.identity.location.coordinates.lat, wimMasterData.identity.location.coordinates.lng, 20, t => traces.push(t));
                     responseText = `**RADAR SCAN (20nm Sector):**\nFound ${nearby.length} contacts.`;
                     
                     const inboundVessel = nearby.find(v => v.name.toLowerCase().includes('phisedelia'));
                     if (inboundVessel) {
                         responseText += `\n\n**AUTO-IDENTIFICATION:** ${inboundVessel.name.toUpperCase()} (WIM FLEET)`;
                         const hailMessage = await marinaExpert.generateProactiveHail(inboundVessel.name);
                         responseText += `\n\n${hailMessage}`;
                         actions.push({
                             id: `log_hail_${Date.now()}`,
                             kind: 'internal',
                             name: 'ada.marina.log_operation',
                             params: { message: `[OP] PROACTIVE HAIL | VS:${inboundVessel.name.toUpperCase()}`, type: 'info' }
                         });
                     }
                } 
                else if (prompt.toLowerCase().includes('depart') || prompt.toLowerCase().includes('leaving')) {
                     if (user.role === 'GUEST') {
                         responseText = "**ACCESS DENIED.** Restricted to Vessel Command.";
                     } else {
                         const debt = await financeExpert.checkDebt(vesselName);
                         if (debt.status === 'DEBT' && user.role !== 'GENERAL_MANAGER') {
                             // Polite Denial with Legal Reference
                             responseText = `**DEPARTURE CLEARANCE: DENIED**\n\n` +
                                            `Captain, I regret to inform you that I cannot authorize departure at this time.\n\n` +
                                            `Pursuant to **Marina Regulation Article H.2 (Right of Retention)**, clearance is withheld due to an outstanding balance on your account.\n\n` +
                                            `Please contact the **Marina Office (VHF Ch 72)** to resolve this administrative matter.`;
                         } else {
                             const departureResult = await marinaExpert.processDeparture(vesselName, tenders, t => traces.push(t));
                             if (departureResult.success) {
                                 actions.push(...departureResult.actions);
                                 responseText = `**DEPARTURE APPROVED**\n\n> **[ATC]:** ${vesselName.toUpperCase()}, cleared for departure. **${departureResult.tender?.name.toUpperCase()}** has been reserved for your assistance. Switch to **VHF Channel 14** for coordination. Out.`;
                             } else {
                                 responseText = `**DEPARTURE DELAYED**\n\n${departureResult.message}`;
                             }
                         }
                     }
                }
                else if (prompt.toLowerCase().includes('arrival') || prompt.toLowerCase().includes('enter')) {
                     // Berth Allocation via new Berth Agent
                     let assignedBerth = "Pontoon C-12";
                     if (user.role !== 'GUEST') {
                         const vesselProfile = await marinaExpert.getVesselIntelligence(vesselName);
                         if (vesselProfile) {
                             const allocation = await berthExpert.findOptimalBerth({
                                 loa: vesselProfile.loa || 15,
                                 beam: vesselProfile.beam || 4,
                                 draft: 3, 
                                 type: vesselProfile.type
                             }, t => traces.push(t));
                             assignedBerth = allocation.berth;
                             const fee = await berthExpert.calculateBerthPrice(vesselProfile.loa || 15, vesselProfile.beam || 4, allocation.pontoon === 'VIP' ? 'VIP' : 'STANDARD', t => traces.push(t));
                             responseText += `\n*Estimated Daily Fee: €${fee}*`;
                         }
                     }

                     const arrivalResult = await marinaExpert.processArrival(vesselName, tenders, t => traces.push(t));
                     if (arrivalResult.success) {
                         actions.push(...arrivalResult.actions);
                         responseText = `**ARRIVAL APPROVED**\n\n> **[ATC]:** ${vesselName.toUpperCase()}, radar contact. Proceed to breakwater. **${arrivalResult.tender?.name.toUpperCase()}** is reserved and standing by on **Channel 14** to escort you to **${assignedBerth}**. Welcome home.`;
                     } else {
                         responseText = `**APPROACH DENIED**\n\n${arrivalResult.message}`;
                     }
                }
                else {
                    return { text: "", actions: [], traces }; 
                }
                break;
        }

        // Orchestration Post-Process
        const passkitAction = actions.find(a => a.name === 'ada.passkit.issuePass');
        if (passkitAction) {
             const { vesselName, type } = passkitAction.params;
             const passResult = await passkitExpert.issuePass(vesselName, "Owner/Captain", type, t => traces.push(t));
             actions.push({ id: `passkit_res_${Date.now()}`, kind: 'external', name: 'ada.passkit.generated', params: passResult });
             responseText += `\n\n**ACCESS GRANTED:** Digital Pass sent to wallet.`;
        }

        traces.push(createLog('ada.marina', 'OUTPUT', 'Orchestration complete.'));
        return { text: responseText, actions, traces };
    }
};