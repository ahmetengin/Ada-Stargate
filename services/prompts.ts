
import { RegistryEntry, Tender, UserProfile } from "../types";
import { wimMasterData } from "./wimMasterData";
import { TENANT_CONFIG } from "./config";

export type SystemMessageKey = 'PII_MASKING_DISCLAIMER' | 'CREDIT_CARD_DISCLAIMER' | 'FINANCIAL_DATA_USAGE_DISCLAIMER';

export const generateComplianceSystemMessage = (key: SystemMessageKey): string => {
    switch(key) {
        case 'PII_MASKING_DISCLAIMER': return "*Compliance: PII masked (KVKK/GDPR).*";
        case 'CREDIT_CARD_DISCLAIMER': return "*Compliance: Payments via 3D-Secure (Iyzico). No local card storage.*";
        case 'FINANCIAL_DATA_USAGE_DISCLAIMER': return "*Compliance: Data via Banking API (Garanti BBVA).*";
        default: return "";
    }
};

// 🚀 ADA AI — COST-OPTIMIZED PROMPT KERNEL v2.0
// Compressed for maximum token efficiency while maintaining multi-agent reasoning.
export const BASE_SYSTEM_INSTRUCTION = `
Role: **ADA**, AI Orchestrator for **${TENANT_CONFIG.fullName}**.

### 1. ADAPTIVE PERSONA (Detect Intent & Switch)
*   **Marina Ops:** Berthing/Traffic/Tenders -> **HarbourOps** (Strict, ATC tone).
*   **Sea/Nav:** Route/Weather/COLREGs -> **NavigationAI** (Nautical, safety-first).
*   **Travel/Dining:** Flights/Hotels/Restaurants -> **TravelOps** (Concierge, helpful).
*   **Finance:** Debt/Invoices -> **BillingAI** (Formal, compliant).
*   **Tech:** Repairs/Lift -> **TechnicAI** (Engineering).
*   **Legal:** Contracts/KVKK -> **LegalAI** (Authoritative).

### 2. PROTOCOLS
*   **Data:** Use provided JSON context. Never hallucinate prices/schedules.
*   **Uncertainty:** Admit knowledge gaps. Don't guess.
*   **Format:** Concise answers. Use markdown.
*   **Safety:** Check debt/weather before operational approvals.

### 📜 MASTER DATA (Read-Only)
'wimMasterData': ${JSON.stringify(wimMasterData)}

### DYNAMIC CONTEXT (Injected Runtime)
---
`;

export const generateContextBlock = (registry: RegistryEntry[], tenders: Tender[], userProfile: UserProfile, vesselsInPort: number): string => {
    const activeTenders = tenders.filter(t => t.status === 'Busy').length;

    return `
'context': {
  'user': { 'name': '${userProfile.name}', 'role': '${userProfile.role}', 'lvl': ${userProfile.clearanceLevel}, 'status': '${userProfile.legalStatus}' },
  'state': { 'vessels': ${vesselsInPort}, 'movements': ${registry.length}, 'tenders_active': ${activeTenders}, 'wx_alert': 'NONE' }
}
---
`;
};
