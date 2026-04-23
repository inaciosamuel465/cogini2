# CogniStream AI Analyst

Plataforma de inteligência multimodal com Google Search Grounding e persistência na nuvem, desenvolvida com React, Vite e Google Gemini API.

## Funcionalidades

- **Análise Multimodal**: Processamento de áudio e vídeo com transcrição, tradução e análise de sentimento.
- **SJL Neural Link 2.0**: Módulo de conversação em tempo real para treinamento de inglês corporativo.
- **Google Search Grounding**: Validação de fatos e enriquecimento de insights com dados da web.
- **Persistência Local**: Histórico de análises salvo no navegador.

## Pré-requisitos

- Node.js (v18 ou superior)
- Chave de API do Google Gemini (obtenha em [aistudio.google.com](https://aistudio.google.com/))

## Instalação

1. Clone o repositório ou baixe os arquivos.
2. Instale as dependências:
   ```bash
   npm install
   ```

## Configuração

1. Crie um arquivo `.env` na raiz do projeto (baseado no `.env.example`).
2. Adicione sua chave de API do Gemini:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```

## Execução

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`.

## Estrutura do Projeto

- `/components`: Componentes React da interface.
- `/services`: Integrações com APIs (Gemini, Áudio, Documentos).
- `/data`: Dados estáticos (currículo SJL).
- `/contexts`: Contextos React (Auth).

## Tecnologias

- React 19
- Vite
- Tailwind CSS
- Google Gemini API (`@google/genai`)
- Lucide React (Ícones)
