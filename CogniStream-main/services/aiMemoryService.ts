
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface AIMemoryEntry {
    userId: string;
    module: string; // 'SJL', 'Translation', 'Conversation', etc.
    type: 'conversation' | 'translation' | 'report' | 'progress';
    content: string;
    metadata?: any;
    timestamp?: any;
}

/**
 * Salva uma interação ou progresso na memória da IA no Firestore.
 * Isso permite que a IA tenha "consciência" do histórico do usuário.
 */
export const saveAIMemory = async (entry: AIMemoryEntry) => {
    if (!entry.userId) return;
    try {
        const memoryRef = collection(db, 'ai_memory');
        await addDoc(memoryRef, {
            ...entry,
            timestamp: serverTimestamp(),
        });
        console.log(`[AI Memory] Salvo: ${entry.module} - ${entry.type}`);
    } catch (error) {
        console.error("Erro ao salvar memória da IA:", error);
    }
};

/**
 * Recupera o contexto recente do usuário para alimentar o prompt da IA.
 */
export const getAIContextForUser = async (userId: string, limitCount = 5) => {
    if (!userId) return "";
    try {
        const memoryRef = collection(db, 'ai_memory');
        let q = query(
            memoryRef,
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        try {
            const snap = await getDocs(q);
            const logs = snap.docs.map(doc => {
                const data = doc.data();
                return `[${data.module}][${data.type}] ${data.content}`;
            });
            return logs.reverse().join('\n');
        } catch (idxError: any) {
            // Fallback se o índice não existir (FirebaseError: The query requires an index)
            if (idxError.message?.includes('index')) {
                console.warn("[AI Memory] Índice ausente, usando busca sem ordenação como fallback.");
                const fallbackQ = query(
                    memoryRef,
                    where('userId', '==', userId),
                    limit(limitCount)
                );
                const snap = await getDocs(fallbackQ);
                const logs = snap.docs.map(doc => {
                    const data = doc.data();
                    return `[${data.module}][${data.type}] ${data.content}`;
                });
                return logs.join('\n');
            }
            throw idxError;
        }
    } catch (error) {
        console.error("Erro ao buscar contexto da IA:", error);
        return "";
    }
};
