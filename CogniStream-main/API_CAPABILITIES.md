# CogniStream Intelligence Hub - API Capabilities & Optimization

Este documento detalha como o CogniStream utiliza APIs de forma eficiente para manter alta performance e custos reduzidos (ou zero).

## 1. Inteligência Artificial (Gemini API)
Utilizamos o modelo **Gemini 2.0 Flash** e **2.5 Flash Native Audio** para processamento multimodal.

- **Uso Otimizado**: O sistema utiliza o Gemini apenas para a camada de "Cérebro" (tradução semântica, análise de mídia, lógica de conversação).
- **Conectividade**: Implementado via WebSockets (Live API) para latência ultra-baixa em tradução simultânea.
- **Grounding**: Integrado com Google Search para garantir que as informações fornecidas sejam factuais e atualizadas.

## 2. Processamento de Voz (Híbrido)
Para garantir funcionalidade gratuita e escalável, adotamos uma abordagem híbrida:

- **Voice-to-Text (STT)**: Utilizamos a **Web Speech API (`SpeechRecognition`)** nativa do navegador.
  - *Vantagem*: Custo zero e processamento local no dispositivo do usuário.
- **Text-to-Voice (TTS)**: 
  - **Conversação Geral**: Utiliza `SpeechSynthesis` nativo para respostas rápidas e gratuitas.
  - **Treinamento Corporativo (SJL)**: Utiliza a saída de áudio nativa do Gemini (Multimodal Audio) para uma voz mais natural e expressiva ("Kore").

## 3. Tradução Neural Simultânea
O módulo `LiveTranslation` foi aprimorado para ser uma ferramenta de nível profissional:

- **Modo Teatro**: Interface minimalista focada apenas nas legendas, ideal para apresentações.
- **Histórico Persistente**: Salva os turnos da conversa localmente e permite exportação.
- **Exportação Multi-formato**: Suporte para TXT, JSON e PDF (via função de impressão otimizada).

## 4. Persistência e Contexto (Firebase)
- **AI Memory**: O sistema salva o contexto das conversas no Firestore. Quando você volta a falar com a Sarah Jane, ela "lembra" do seu progresso e preferências.
- **Sincronização de Progresso**: O módulo SJL (Neural Link) sincroniza medalhas, XP e frases concluídas automaticamente com a nuvem.

---
**Nota Técnica**: Para o funcionamento pleno das APIs de áudio e microfone, o CogniStream deve ser acessado via **HTTPS** ou `localhost`.
