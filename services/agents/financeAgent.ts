
import { AgentAction, UserProfile, AgentTraceLog } from '../../types';

// Mock API integrations for Paraşüt and Iyzico
const PARASUT_API_MOCK = {
    createInvoice: (vessel: string, amount: number) => ({ id: `INV-${Math.floor(Math.random()*10000)}`, provider: 'PARASUT', status: 'DRAFT', amount })
};

const IYZICO_API_MOCK = {
    createPaymentLink: (invoiceId: string, amount: number) => ({ id: `PAY-${Date.now()}`, provider: 'IYZICO', url: `https://iyzi.co/pay/${invoiceId}`, status: 'PENDING' })
};

export const financeAgent = {
  process: async (params: any, user: UserProfile, addTrace: (t: AgentTraceLog) => void): Promise<AgentAction[]> => {
    const actions: AgentAction[] = [];
    
    // RBAC Check: Finance data is sensitive
    if (user.role === 'GUEST') {
        addTrace({
            id: `trace_fin_deny_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.finance',
            step: 'ERROR',
            content: `Access Denied: User role '${user.role}' lacks clearance for Financial Operations.`
        });
        return [{
            id: `fin_deny_${Date.now()}`,
            kind: 'internal',
            name: 'ada.finance.accessDenied',
            params: { reason: 'Insufficient Clearance' }
        }];
    }

    const { intent, vesselName, amount } = params;

    if (intent === 'create_invoice') {
        addTrace({
            id: `trace_fin_parasut_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.finance',
            step: 'TOOL_EXECUTION',
            content: `Connecting to PARASUT API... Creating invoice for ${vesselName}.`
        });

        const invoice = PARASUT_API_MOCK.createInvoice(vesselName, amount || 100);
        
        actions.push({
            id: `fin_inv_${Date.now()}`,
            kind: 'external',
            name: 'ada.finance.invoiceCreated',
            params: { invoice }
        });

        // Chain reaction: Create Payment Link via Iyzico
        if (invoice.id) {
             addTrace({
                id: `trace_fin_iyzico_${Date.now()}`,
                timestamp: new Date().toISOString(),
                node: 'ada.finance',
                step: 'TOOL_EXECUTION',
                content: `Connecting to IYZICO/TRPay API... Generating payment link for Invoice ${invoice.id}.`
            });
            
            const link = IYZICO_API_MOCK.createPaymentLink(invoice.id, invoice.amount);
            
            actions.push({
                id: `fin_pay_${Date.now()}`,
                kind: 'external',
                name: 'ada.finance.paymentLinkGenerated',
                params: { link }
            });
        }
    }

    return actions;
  }
};
