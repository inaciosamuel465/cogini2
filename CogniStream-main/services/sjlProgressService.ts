
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { DuoUserProgress, DEFAULT_DUO_PROGRESS } from '../types';

const LOCAL_KEY = 'cogni_duo_progress_v1';

/**
 * Carrega o progresso do usuário — Firebase (se logado) ou localStorage.
 */
export async function loadDuoProgress(userId?: string | null): Promise<DuoUserProgress> {
    // 1. Tentar Firebase primeiro se usuário estiver logado
    if (userId) {
        try {
            const snap = await getDoc(doc(db, 'duo_progress', userId));
            if (snap.exists()) {
                const cloud = snap.data() as DuoUserProgress;
                // Mesclar com local para garantir que progresso mais recente vence
                const local = loadLocalProgress();
                return mergeProgress(local, cloud);
            }
        } catch (e) {
            console.warn('[DuoProgress] Falha ao carregar do Firebase, usando local:', e);
        }
    }

    // 2. Fallback para localStorage
    return loadLocalProgress();
}

/**
 * Salva o progresso — sempre no localStorage, e no Firebase se logado.
 */
export async function saveDuoProgress(
    progress: DuoUserProgress,
    userId?: string | null
): Promise<void> {
    // Atualiza streak
    const updated = computeStreak(progress);

    // Salvar local
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('[DuoProgress] Falha ao salvar no localStorage:', e);
    }

    // Salvar Firebase se logado
    if (userId) {
        try {
            await setDoc(
                doc(db, 'duo_progress', userId),
                { ...updated, userId, updatedAt: serverTimestamp() },
                { merge: true }
            );
        } catch (e) {
            console.warn('[DuoProgress] Falha ao salvar no Firebase:', e);
        }
    }
}

// --- Helpers ---

function loadLocalProgress(): DuoUserProgress {
    try {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (raw) return { ...DEFAULT_DUO_PROGRESS, ...JSON.parse(raw) };
    } catch (e) {
        console.warn('[DuoProgress] Erro ao ler localStorage:', e);
    }
    return { ...DEFAULT_DUO_PROGRESS };
}

function mergeProgress(local: DuoUserProgress, cloud: DuoUserProgress): DuoUserProgress {
    return {
        ...local,
        ...cloud,
        totalXP: Math.max(local.totalXP, cloud.totalXP ?? 0),
        streakDays: Math.max(local.streakDays, cloud.streakDays ?? 0),
        completedLessons: Array.from(
            new Set([...(local.completedLessons ?? []), ...(cloud.completedLessons ?? [])])
        ),
        wordsMastered: Array.from(
            new Set([...(local.wordsMastered ?? []), ...(cloud.wordsMastered ?? [])])
        ),
        statistics: {
            totalExercises: Math.max(
                local.statistics?.totalExercises ?? 0,
                cloud.statistics?.totalExercises ?? 0
            ),
            correctAnswers: Math.max(
                local.statistics?.correctAnswers ?? 0,
                cloud.statistics?.correctAnswers ?? 0
            ),
            totalSessions: Math.max(
                local.statistics?.totalSessions ?? 0,
                cloud.statistics?.totalSessions ?? 0
            ),
        },
    };
}

function computeStreak(progress: DuoUserProgress): DuoUserProgress {
    const today = new Date().toISOString().split('T')[0];
    if (progress.lastSessionDate === today) return progress;

    let newStreak = progress.streakDays ?? 0;
    if (progress.lastSessionDate) {
        const last = new Date(progress.lastSessionDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        newStreak = progress.lastSessionDate === yesterdayStr ? newStreak + 1 : 1;
    } else {
        newStreak = 1;
    }

    return { ...progress, streakDays: newStreak, lastSessionDate: today };
}
