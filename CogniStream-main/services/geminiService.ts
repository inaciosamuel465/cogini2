
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisMode, IndustryContext, AnalysisLanguage, AnalysisCategory } from "../types";

// Removidas importações do Firebase para modo Mock
// import { db } from "./firebase";
// import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    transcription: { type: Type.STRING, description: "Transcrição COMPLETA, LITERAL e VERBATIM (incluindo pausas). Use o IDIOMA ORIGINAL." },
    translation: { type: Type.STRING, description: "Tradução INTEGRAL: Original em PT -> EN; Outro -> PT-BR." },
    language: { type: Type.STRING, description: "Idioma original detectado." },
    sentiment: { type: Type.STRING, enum: ["Positivo", "Neutro", "Negativo", "Misto"] },
    tone: { type: Type.STRING, description: "Tom da fala (ex: persuasivo, formal, etc)." },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: {
      type: Type.OBJECT,
      properties: {
        executive: { type: Type.STRING, description: "Resumo executivo impactante." },
        bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Pontos chave e decisões detectadas." },
        detailed: { type: Type.STRING, description: "Relatório detalhado por tópicos cronológicos." },
        insights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Insights estratégicos e análise comportamental." },
        risksAndOpportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Riscos detectados e oportunidades de negócio/melhoria." },
        technicalObservations: { type: Type.STRING, description: "Observações técnicas sobre terminologia, métodos ou execução." },
        actionPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Sugestão de próximos passos e tarefas concretas." }
      }
    },
    segments: {
      type: Type.ARRAY,
      description: "Lista de segmentos de áudio com timestamps precisos no formato 'MM:SS - MM:SS' para recorte de áudio.",
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "Intervalo exato, ex: '00:00 - 00:30'" },
          text: { type: Type.STRING, description: "Texto falado neste segmento." }
        }
      }
    }
  },
  required: ["transcription", "translation", "language", "sentiment", "summary", "segments"]
};

const getSystemPersona = (industry: IndustryContext) => {
  const base = "Você é um Analista de Inteligência de Mídia de Elite do CogniStream.";
  switch (industry) {
    case 'legal': return `${base} Especialista jurídico focado em riscos e compliance.`;
    case 'financial': return `${base} CFO focado em métricas financeiras e mercado.`;
    case 'technical': return `${base} Arquiteto de Software focado em engenharia e stack.`;
    default: return base;
  }
};

export const analyzeMedia = async (
  file: File | null,
  promptText: string = "Analise esta mídia.",
  industry: IndustryContext = 'general',
  mode: AnalysisMode = 'detailed',
  targetLang: AnalysisLanguage = 'pt-BR',
  useGrounding: boolean = false,
  userId?: string,
  analysisCategory?: AnalysisCategory,
  apiKey?: string
): Promise<AnalysisResult> => {

  const finalKey = (apiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || "").trim();
  if (!finalKey || finalKey.length < 10) throw new Error("Chave de API inválida ou ausente.");
  const ai = new (GoogleGenAI as any)({ apiKey: finalKey });
  const isImage = file?.type?.startsWith('image');
  const modelId = useGrounding ? "gemini-1.5-pro" : "gemini-2.0-flash";

  const langNames = { 'pt-BR': 'Português (Brasil)', 'en-US': 'Inglês (Estados Unidos)', 'es-ES': 'Espanhol' };
  const targetLangName = langNames[targetLang];

  // --- CATEGORY-SPECIFIC INSTRUCTIONS ---
  let categoryInstruction = '';
  switch (analysisCategory) {
    case 'visual':
      categoryInstruction = `
        ANÁLISE VISUAL DE IMAGEM:
        - Descreva detalhadamente o que está na imagem (gráficos, tabelas, documentos, screenshots, fotos).
        - Extraia TODO texto visível (OCR) e o coloque no campo 'transcription'.
        - Identifique dados numéricos, tendências e padrões visuais.
        - No campo 'translation', traduza qualquer texto detectado para ${targetLangName}.
        - No campo 'segments', liste as regiões ou seções da imagem identificadas.
      `;
      break;
    case 'meeting_minutes':
      categoryInstruction = `
        ATA DE REUNIÃO PROFISSIONAL:
        - Estruture TODA a análise como uma Ata de Reunião formal.
        - No 'executive summary': Data, participantes (se mencionados) e objetivo.
        - Nos 'bulletPoints': Decisões tomadas e deliberações.
        - No 'actionPlan': Tarefas atribuídas a cada pessoa (se identificados).
        - Nos 'risksAndOpportunities': Próximos passos e riscos discutidos.
        - Nos 'insights': Observações comportamentais e de dinâmica de grupo.
      `;
      break;
    case 'investigation':
      categoryInstruction = `
        INVESTIGAÇÃO E VERIFICAÇÃO DE FATOS:
        - Use todas as ferramentas disponíveis para verificar fatos mencionados.
        - Compare dados mencionados com fontes públicas confiáveis.
        - Nos 'insights': Indique se informações são verificáveis ou não.
        - Nos 'risksAndOpportunities': Destaque informações potencialmente incorretas.
      `;
      useGrounding = true; // Force grounding for investigation
      break;
    case 'transcription':
      categoryInstruction = `
        TRANSCRIÇÃO E TRADUÇÃO PURAS:
        - Foque EXCLUSIVAMENTE na transcrição precisa e tradução fiel.
        - Não adicione interpretações pessoais.
        - Mantenha timestamps exatos nos segmentos.
      `;
      break;
    default:
      // Default: análise completa padrão
      break;
  }

  let instruction = `
    ${getSystemPersona(industry)}
    
    ${categoryInstruction}

    ESTRUTURA DE IDIOMA:
    ${isImage
      ? '- Transcrição: Extraia todo texto visível da imagem.\n    - Tradução: Traduza o texto extraído para ' + targetLangName + '.'
      : '- Transcrição: Mantenha o IDIOMA ORIGINAL.\n    - Tradução: Siga a regra PT->EN ou Outro->PT-BR.'
    }
    - TODA A ANÁLISE deve ser escrita em: **${targetLangName}**.
    
    ${useGrounding ? 'GROUNDING ATIVO: Use a ferramenta googleSearch para validar fatos e enriquecer insights com dados reais externos.' : ''}

    PROFUNDIDADE ANALÍTICA EXTREMA:
    - Identifique nuances não explícitas.
    - No Plano de Ação, seja específico com tarefas.
    - Nas Observações Técnicas, analise o vocabulário e métodos mencionados.
    
    ${isImage ? '' : 'SEGMENTAÇÃO:\n    - É CRUCIAL preencher o campo \'segments\' com timestamps precisos.'}
  `;

  const contentParts: any[] = [];
  if (file) {
    const reader = new FileReader();
    const base64 = await new Promise<string>(r => {
      reader.onload = () => r((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    contentParts.push({ inlineData: { data: base64, mimeType: file.type } });
  }
  contentParts.push({ text: instruction + "\n" + promptText });

  // Configuração de Tools
  const tools = [];
  if (useGrounding) {
    tools.push({ googleSearch: {} });
  }

  // Adicionar retry logic para erro 429 (Too Many Requests)
  const maxRetries = 3;
  let response;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: contentParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          tools: tools.length > 0 ? tools : undefined
        }
      });
      break; // Sucesso, sai do loop
    } catch (err: any) {
      const isRateLimit = err.message?.includes('429') || err.status === 429;
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[Gemini] Erro 429. Tentativa ${attempt + 1} de ${maxRetries}. Aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err; // Outros erros ou limite de tentativas atingido
    }
  }

  if (!response) throw new Error("Falha ao obter resposta da IA após múltiplas tentativas.");

  const resultData = JSON.parse(response.text || '{}');

  // Extrair metadados de Grounding se existirem
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    const chunks = response.candidates[0].groundingMetadata.groundingChunks;
    const webSources = chunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({ title: c.web.title, url: c.web.uri }));

    resultData.groundingMetadata = {
      searchQueries: [], // A API nem sempre retorna as queries exatas, mas retornamos a estrutura
      webSources: webSources
    };
  }

  // MOCK: Salvar no localStorage em vez do Firebase
  if (userId) {
    try {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        fileName: file?.name || promptText.substring(0, 30),
        fileType: file?.type.startsWith('video') ? 'video' : 'audio',
        date: new Date().toISOString(), // Mock timestamp
        result: resultData,
        tags: resultData.keywords ? resultData.keywords.slice(0, 5) : []
      };

      const existingHistory = localStorage.getItem('mock_history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.unshift(newItem);
      localStorage.setItem('mock_history', JSON.stringify(history));

    } catch (e) {
      console.error("Erro ao salvar histórico (Mock):", e);
    }
  }

  return resultData;
};

export const validateFile = (file: File): string | null => {
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'video/mp4', 'video/webm', 'video/quicktime'];
  if (!validTypes.includes(file.type)) return "Formato não suportado.";
  if (file.size > 150 * 1024 * 1024) return "Arquivo muito grande (máx 150MB).";
  return null;
};

export const chatWithAI = async (
  messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  systemInstruction: string = "Você é um assistente prestativo.",
  apiKey?: string
): Promise<string> => {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || "").trim();
  let finalKey = (apiKey || "").trim();

  // Se a chave passada for muito curta ou inválida, usa a do ambiente
  if (finalKey.length < 10) {
    finalKey = envKey;
  }

  console.log("Gemini Auth Debug:", {
    source: apiKey && apiKey.trim().length >= 10 ? "Manual/Settings" : "Environment (.env)",
    keyPrefix: finalKey ? finalKey.substring(0, 7) + "..." : "EMPTY"
  });

  if (!finalKey || finalKey.length < 10) {
    throw new Error("Chave de API do Gemini não encontrada ou inválida. Verifique o arquivo .env.");
  }

  // Inicialização no formato de objeto exigido estritamente pelo SDK no navegador
  const genAI = new (GoogleGenAI as any)({ apiKey: finalKey });
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: systemInstruction
  });

  const chat = model.startChat({
    history: messages.slice(0, -1), // All messages except the last one
  });

  const lastMessage = messages[messages.length - 1].parts[0].text;
  const result = await chat.sendMessage(lastMessage);
  const response = await result.response;
  return response.text();
};
