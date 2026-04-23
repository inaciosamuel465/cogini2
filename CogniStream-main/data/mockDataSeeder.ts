
import { MOCK_MODULES, MOCK_PHRASES, MOCK_SYSTEM_SETTINGS } from "./mockData";
import { db } from "../services/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";

/**
 * Função para sincronizar todos os dados iniciais com o Firestore.
 * Utiliza o padrão Batched Write para máxima eficiência.
 */
export async function syncInitialDataWithFirebase() {
    const batch = writeBatch(db);

    // 1. Sincronizar Módulos
    MOCK_MODULES.forEach((module) => {
        const moduleRef = doc(db, "modules", module.id);
        batch.set(moduleRef, module, { merge: true });
    });

    // 2. Sincronizar Frases
    MOCK_PHRASES.forEach((phrase) => {
        const phraseRef = doc(db, "phrases", phrase.id);
        batch.set(phraseRef, phrase, { merge: true });
    });

    // 3. Sincronizar Configurações iniciais do sistema
    const settingsRef = doc(db, "config", "system_settings");
    batch.set(settingsRef, MOCK_SYSTEM_SETTINGS, { merge: true });

    await batch.commit();
    console.log("Dados sincronizados com sucesso no Firebase!");
}
