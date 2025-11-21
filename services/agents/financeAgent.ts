import { AgentAction, UserProfile, AgentTraceLog, VesselIntelligenceProfile, NodeName } from '../../types';
import { wimMasterData } from '../wimMasterData';

// Helper to create a log (copied from orchestratorService.ts for local use)
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

// Mock API integrations for Paraşüt, Iyzico, and Garanti BBVA
const PARASUT_API_MOCK = {
    // This mock now needs to store and update actual vessel data to reflect debt
    vesselLedger: new Map<string, { balance: number, paymentHistoryStatus?: VesselIntelligenceProfile['paymentHistoryStatus'] }>([
        ['s/y phisedelia', { balance: 850, paymentHistoryStatus: 'RECENTLY_LATE' }],
        ['m/y blue horizon', { balance: 0, paymentHistoryStatus: 'REGULAR' }],
        // Add other vessels as needed
    ]),
    
    createInvoice: (vessel: string, items: any[]) => {
        const total = items.reduce((acc, item) => acc + item.price, 0);
        return { 
            id: `INV-${Math.floor(Math.random()*10000)}`, 
            provider: 'PARASUT', 
            status: 'DRAFT', 
            amount: total,
            items: items,
            vesselName: vessel
        };
    },
    
    getBalance: (vesselName: string) => {
        const vesselData = PARASUT_API_MOCK.vesselLedger.get(vesselName.toLowerCase());
        if (vesselData) {
            return { balance: vesselData.balance, currency: 'EUR', paymentHistoryStatus: vesselData.paymentHistoryStatus };
        }
        return { balance: 0, currency: 'EUR', paymentHistoryStatus: 'REGULAR' }; 
    },

    updateBalance: (vesselName: string, newBalance: number, newPaymentHistoryStatus: Exclude<VesselIntelligenceProfile['paymentHistoryStatus'], undefined>) => {
        // The Exclude<..., undefined> type ensures newPaymentHistoryStatus is always one of the literal strings.
        PARASUT_API_MOCK.vesselLedger.set(vesselName.toLowerCase(), { balance: newBalance, paymentHistoryStatus: newPaymentHistoryStatus });
    }
};

const IYZICO_API_MOCK = {
    createPaymentLink: (invoiceId: string, amount: number, vesselName: string) => {
        return { 
            id: `PAY-${Date.now()}`, 
            provider: 'IYZICO', 
            url: `https://iyzi.co/pay/${invoiceId}?vessel=${encodeURIComponent(vesselName)}`, 
            status: 'PENDING' 
        };
    }
};

const GARANTI_BBVA_API_MOCK = {
    fetchTransactions: (startDate: Date, endDate: Date) => {
        // Simulate some payments coming in from different vessels
        const transactions = [];
        if (Math.random() > 0.5) { // Simulate a payment for Blue Horizon
            transactions.push({
                transactionId: `TRN-BBVA-${Date.now()}-1`,
                date: new Date().toISOString().split('T')[0],
                amount: 1200.00,
                currency: 'EUR',
                type: 'CREDIT',
                description: 'Mooring payment for M/Y Blue Horizon',
                reference: 'INV-0002',
                vesselImo: '123456789' // Assumed IMO for M/Y Blue Horizon
            });
        }
        if (Math.random() > 0.7) { // Simulate a payment for S/Y Phisedelia
            transactions.push({
                transactionId: `TRN-BBVA-${Date.now()}-2`,
                date: new Date().toISOString().split('T')[0],
                amount: 850.00, // Exact outstanding debt
                currency: 'EUR',
                type: 'CREDIT',
                description: 'Overdue payment for S/Y Phisedelia',
                reference: 'INV-0001',
                vesselImo: '987654321' // Assumed IMO for S/Y Phisedelia
            });
        }
        return transactions;
    }
}


export const financeAgent = {
  // Helper for Orchestrator Fast-Path
  checkDebt: async (vesselName: string): Promise<{ status: 'CLEAR' | 'DEBT', amount: number, paymentHistoryStatus: VesselIntelligenceProfile['paymentHistoryStatus'] }> => {
      const data = PARASUT_API_MOCK.getBalance(vesselName);
      return { 
          status: data.balance > 0 ? 'DEBT' : 'CLEAR', 
          amount: data.balance,
          paymentHistoryStatus: data.paymentHistoryStatus
      };
  },

  // Skill: Process an incoming payment (e.g., from Iyzico webhook or manual confirmation)
  processPayment: async (vesselName: string, paymentRef: string, amount: number, addTrace: (t: AgentTraceLog) => void): Promise<AgentAction[]> => {
      addTrace(createLog('ada.finance', 'TOOL_EXECUTION', `Confirming payment for ${vesselName} (Ref: ${paymentRef}, Amount: €${amount})...`, 'WORKER'));

      // FIX: Removed direct state mutation (updateBalance call). This function should only generate actions.
      // The caller (e.g., fetchDailySettlement) is responsible for updating the balance state.
      // This prevents a logical error where the balance was always reset to 0 regardless of payment amount.

      const actions: AgentAction[] = [];
      actions.push({
          id: `fin_pay_conf_${Date.now()}`,
          kind: 'internal',
          name: 'ada.finance.paymentConfirmed',
          params: { vesselName, paymentRef, amount, status: 'SUCCESS' }
      });

      // Trigger customer agent for loyalty score update
      actions.push({
          id: `cust_loyalty_update_${Date.now()}`,
          kind: 'internal',
          name: 'ada.customer.calculateLoyaltyScore',
          params: { vesselName, actionType: 'PAYMENT_CLEAR' }
      });

      // Trigger marina agent to update vessel profile (e.g., debt status)
      // We need to get the current loyalty score to calculate the update, not just placeholder
      const vesselData = PARASUT_API_MOCK.getBalance(vesselName);
      actions.push({
          id: `marina_profile_update_${Date.now()}`,
          kind: 'internal',
          name: 'ada.marina.updateVesselProfile',
          params: { 
              vesselName, 
              update: { 
                  outstandingDebt: 0, 
                  paymentHistoryStatus: 'REGULAR' // Force to REGULAR after payment
              } 
          }
      });

      return actions;
  },

  // Skill: Fetch daily bank settlement from Garanti BBVA
  fetchDailySettlement: async (addTrace: (t: AgentTraceLog) => void): Promise<{ text: string, actions: AgentAction[] }> => {
      addTrace(createLog('ada.finance', 'TOOL_EXECUTION', `Fetching daily transactions from Garanti BBVA API...`, 'WORKER'));

      const today = new Date();
      const transactions = GARANTI_BBVA_API_MOCK.fetchTransactions(today, today);
      const actions: AgentAction[] = [];
      let totalSettledAmount = 0;
      let settlementReport = `**DAILY SETTLEMENT REPORT (${today.toLocaleDateString()}):**\n\n`;
      settlementReport += `Received ${transactions.length} payments:\n`;

      if (transactions.length === 0) {
          settlementReport += `*No new payments received today.*\n`;
      } else {
          for (const tx of transactions) {
              settlementReport += `- **€${tx.amount}** for ${tx.description}\n`;
              // In a real system, we'd use IMO from transaction to find vessel name if not in description
              const vesselNameMatch = tx.description.match(/for (S\/Y|M\/Y|Catamaran) ([A-Za-z ]+)/i);
              const vesselName = vesselNameMatch ? vesselNameMatch[2].trim() : `Vessel (IMO:${tx.vesselImo})`;
              
              if (vesselName) {
                  addTrace(createLog('ada.finance', 'PLANNING', `Reconciling payment for ${vesselName} (Ref: ${tx.transactionId})...`, 'EXPERT'));
                  // In a real system, we'd use IMO from transaction to find vessel name if not in description
                  const currentBalanceData = PARASUT_API_MOCK.getBalance(vesselName);
                  // FIX: Ensure newPaymentHistoryStatus is a literal string and not undefined by providing a default.
                  // FIX: Changed 'OVERDUE' to 'CHRONICALLY_LATE' to match the type definition.
                  const newPaymentStatus: 'REGULAR' | 'RECENTLY_LATE' | 'CHRONICALLY_LATE' = currentBalanceData.paymentHistoryStatus ?? 'REGULAR';
                  // FIX: A payment (credit) should reduce the outstanding balance (debt).
                  PARASUT_API_MOCK.updateBalance(vesselName, currentBalanceData.balance - tx.amount, newPaymentStatus); 
                  const processPaymentActions = await financeAgent.processPayment(vesselName, tx.transactionId, tx.amount, addTrace);
                  actions.push(...processPaymentActions);
                  totalSettledAmount += tx.amount;
              } else {
                  // FIX: Changed log step 'WARNING' to 'ERROR' to match the allowed types.
                  addTrace(createLog('ada.finance', 'ERROR', `Could not identify vessel for transaction ${tx.transactionId}. Manual reconciliation required.`, 'EXPERT'));
              }
          }
          settlementReport += `\n**Total Settled: €${totalSettledAmount.toFixed(2)}**`;
      }


      return { text: settlementReport, actions: actions };
  },

  // Skill: Invoice Engine
  process: async (params: any, user: UserProfile, addTrace: (t: AgentTraceLog) => void): Promise<AgentAction[]> => {
    const actions: AgentAction[] = [];
    
    // RBAC Check: Finance data is sensitive
    if (user.role === 'GUEST') {
        addTrace(createLog('ada.finance', 'ERROR', `Access Denied: User role '${user.role}' lacks clearance for Financial Operations.`, 'EXPERT'));
        return [{
            id: `fin_deny_${Date.now()}`,
            kind: 'internal',
            name: 'ada.finance.accessDenied',
            params: { reason: 'Insufficient Clearance' }
        }];
    }

    const { intent, vesselName, amount, serviceType } = params;

    if (intent === 'create_invoice') {
        addTrace(createLog('ada.finance', 'THINKING', `Calculating fees for ${vesselName} (Service: ${serviceType || 'General Debt'})...`, 'EXPERT'));

        // Dynamic Item Generation based on service type
        let items = [];
        if (serviceType === 'MOORING') {
             // Example: 150m2 * 1.5 EUR
             items.push({ description: 'Daily Mooring Fee (150m2)', price: 225 });
             items.push({ description: 'Utility Connection Fee', price: 50 });
        } else {
             items.push({ description: 'Outstanding Balance Transfer', price: amount || 100 });
        }

        addTrace(createLog('ada.finance', 'TOOL_EXECUTION', `Connecting to PARASUT API... Creating invoice for ${items.length} items.`, 'WORKER'));

        const invoice = PARASUT_API_MOCK.createInvoice(vesselName, items);
        // Update ledger with new invoice amount
        const currentBalanceData = PARASUT_API_MOCK.getBalance(vesselName);
        // FIX: Ensure newPaymentHistoryStatus is a literal string and not undefined by providing a default.
        // FIX: Changed 'OVERDUE' to 'CHRONICALLY_LATE' to match the type definition.
        const newPaymentStatus: 'REGULAR' | 'RECENTLY_LATE' | 'CHRONICALLY_LATE' = currentBalanceData.paymentHistoryStatus ?? 'REGULAR';
        PARASUT_API_MOCK.updateBalance(vesselName, currentBalanceData.balance + invoice.amount, newPaymentStatus);

        actions.push({
            id: `fin_inv_${Date.now()}`,
            kind: 'external',
            name: 'ada.finance.invoiceCreated',
            params: { invoice }
        });

        // Chain reaction: Create Payment Link via Iyzico
        if (invoice.id) {
             addTrace(createLog('ada.finance', 'TOOL_EXECUTION', `Connecting to IYZICO/TRPay API... Generating payment link for Invoice ${invoice.id}.`, 'WORKER'));
            
            const link = IYZICO_API_MOCK.createPaymentLink(invoice.id, invoice.amount, vesselName);
            
            actions.push({
                id: `fin_pay_${Date.now()}`,
                kind: 'external',
                name: 'ada.finance.paymentLinkGenerated',
                params: { link }
            });
        }
    }

    return actions;
  },

};