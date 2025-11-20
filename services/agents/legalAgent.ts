
import { AgentAction, UserProfile, AgentTraceLog } from '../../types';
import { LEGAL_DOCUMENTS } from '../legalData';

// Regex to find article numbers like E.1.1, D.9, F.13, or Rule 15
const ARTICLE_REGEX = /(?:^|\n)(?:##\s*)?(?:MADD|MADDE|Madde|Article|Kural|Rule|Section|Part)\s+([A-Z]?\.?\d+(?:\.\d+)*|B\.\d+|A\.\d+)\.?\s*[:\-\s]/i;

function simulateRagLookup(query: string, documentId: string, addTrace: (t: AgentTraceLog) => void): string {
    const docContent = LEGAL_DOCUMENTS[documentId];
    if (!docContent) {
        return `Document not found: ${documentId}`;
    }

    const lowerQuery = query.toLowerCase();
    
    addTrace({
        id: `trace_rag_match_${Date.now()}`,
        timestamp: new Date().toISOString(),
        node: 'ada.legal',
        step: 'THINKING',
        content: `Searching "${documentId}" for keywords related to: "${query}"...`,
        persona: 'WORKER'
    });

    const lines = docContent.split('\n');
    const allSections: { article: string; text: string; score: number }[] = [];
    let currentArticle = "Genel Bilgi";
    let sectionBuffer: string[] = [];

    const addSection = () => {
        if (sectionBuffer.length > 0) {
            const text = sectionBuffer.join('\n').trim();
            let score = 0;
            // Simple keyword scoring
            if (text.toLowerCase().includes(lowerQuery)) {
                score = 2;
            }
            if (score > 0) {
                allSections.push({ article: currentArticle, text, score });
            }
            sectionBuffer = [];
        }
    };

    for (const line of lines) {
        const articleMatch = line.match(ARTICLE_REGEX);
        if (articleMatch) {
            addSection();
            currentArticle = articleMatch[1].trim();
            sectionBuffer.push(line.trim());
        } else {
            sectionBuffer.push(line.trim());
        }
    }
    addSection();

    if (allSections.length === 0) {
        return `**${documentId}** belgesinde "${query}" ile ilgili doğrudan bir madde bulunamadı.`;
    }

    // Sort by score
    allSections.sort((a, b) => b.score - a.score);

    const topSnippets = allSections.slice(0, 3);
    let formattedResponse = "";

    if (documentId.includes('colregs') || documentId.includes('maritime')) {
         formattedResponse += "Pusulayı doğrult kaptan! Denizcilik kuralları ve mevzuat hakkında bilmen gerekenler şunlar:\n\n";
    } else {
         formattedResponse += `**West Istanbul Marina Yönetmeliği ("${query}" ile ilgili):**\n\n`;
    }

    topSnippets.forEach(snippet => {
        formattedResponse += `--- **Madde ${snippet.article}:** ---\n${snippet.text}\n\n`;
    });

    if (documentId.includes('colregs')) {
        formattedResponse += "\nUnutma, denizde emniyet her şeyden önce gelir.";
    }

    return formattedResponse;
}

export const legalAgent = {
  process: async (params: any, user: UserProfile, addTrace: (t: AgentTraceLog) => void): Promise<AgentAction[]> => {
    
    // RBAC Check
    if (user.role !== 'GENERAL_MANAGER') {
        addTrace({
            id: `trace_legal_deny_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.legal',
            step: 'ERROR',
            content: `SECURITY ALERT: Unauthorized access attempt by ${user.name}.`
        });
        return [{
            id: `legal_deny_${Date.now()}`,
            kind: 'internal',
            name: 'ada.legal.accessDenied',
            params: { reason: 'Requires GENERAL_MANAGER role.' }
        }];
    }

    const { query } = params;
    const lowerQuery = query.toLowerCase();
    let documentToQuery: string | null = null;
    let queryContext: string = "";

    // SETUR Policy Check
    if (lowerQuery.includes('setur')) { 
        addTrace({
            id: `trace_legal_setur_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.legal',
            step: 'OUTPUT',
            content: `Policy: Competitor inquiry detected. Providing generic legal response.`,
            persona: 'EXPERT'
        });
        return [{
            id: `legal_resp_${Date.now()}`,
            kind: 'internal',
            name: 'ada.legal.consultation',
            params: { 
                advice: `Ada Marina, West Istanbul Marina'nın yasal mevzuatında uzmanlaşmıştır. Türkiye'de KVKK/GDPR yasal bir zorunluluktur. Başka kurumlarla ilgili sorularınız için lütfen doğrudan ilgili kurumla iletişime geçiniz.`,
                context: "Genel Yasal Bilgilendirme",
                references: []
            }
        }];
    } 
    
    // Document Selection
    if (lowerQuery.includes('colregs') || lowerQuery.includes('kural') || lowerQuery.includes('seyir') || lowerQuery.includes('çatışma')) {
        documentToQuery = 'colregs_and_straits.md';
        queryContext = "COLREGs ve Seyir Kuralları";
    } else if (lowerQuery.includes('rehber') || lowerQuery.includes('belge') || lowerQuery.includes('donanım')) {
        documentToQuery = 'turkish_maritime_guide.md';
        queryContext = "Denizcilik Rehberi";
    } else if (lowerQuery.includes('kvkk') || lowerQuery.includes('veri')) {
        documentToQuery = 'wim_kvkk.md';
        queryContext = "WIM KVKK Politikası";
    } else {
        documentToQuery = 'wim_contract_regulations.md';
        queryContext = "WIM İşletme Yönetmeliği";
    }

    const ragResult = documentToQuery ? simulateRagLookup(query, documentToQuery, addTrace) : "Bilgi bulunamadı.";

    return [{
        id: `legal_resp_${Date.now()}`,
        kind: 'internal',
        name: 'ada.legal.consultation',
        params: { 
            advice: ragResult,
            context: queryContext,
            references: documentToQuery ? [documentToQuery] : []
        }
    }];
  }
};
