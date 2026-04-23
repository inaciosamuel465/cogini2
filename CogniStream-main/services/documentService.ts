
import { AnalysisResult } from '../types';

declare const jspdf: any;

export const generateDocument = (result: AnalysisResult, format: 'pdf' | 'txt' | 'md' | 'json', sourceName: string) => {
  const timestamp = new Date().toLocaleString('pt-BR');
  const filename = `Relatorio_CogniStream_${sourceName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;

  switch (format) {
    case 'pdf': generateProfessionalPDF(result, filename, sourceName, timestamp); break;
    case 'md': generateMarkdown(result, filename, sourceName, timestamp); break;
    case 'txt': generateTXT(result, filename, sourceName, timestamp); break;
    case 'json': downloadBlob(JSON.stringify(result, null, 2), filename + '.json', 'application/json'); break;
  }
};

const generateProfessionalPDF = (data: AnalysisResult, filename: string, source: string, date: string) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  const checkPage = (h: number) => { if (y + h > pageHeight - 20) { doc.addPage(); y = 20; } };

  const addText = (text: string, size = 10, style = 'normal', color = [50, 50, 50]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
       checkPage(6);
       doc.text(line, margin, y);
       y += 6;
    });
    y += 2;
  };

  const addHeader = (title: string) => {
    checkPage(20);
    y += 4;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text(title.toUpperCase(), margin, y);
    doc.setDrawColor(59, 130, 246);
    doc.line(margin, y + 2, margin + 60, y + 2);
    y += 12;
  };

  // --- Capa/Header ---
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("COGNISTREAM AI REPORT", margin, 25);
  doc.setFontSize(9);
  doc.text(`GERADO EM: ${date}`, pageWidth - margin - 50, 25);
  
  y = 50;
  addText(`FONTE: ${source}`, 10, 'bold', [100, 100, 100]);
  addText(`IDIOMA: ${data.language} | SENTIMENTO: ${data.sentiment} | TOM: ${data.tone}`, 9, 'italic');
  addText(`PALAVRAS-CHAVE: ${data.keywords.join(", ")}`, 9, 'italic');

  addHeader("1. Resumo Executivo");
  addText(data.summary.executive, 11);

  addHeader("2. Análise Detalhada (Tópicos)");
  addText(data.summary.detailed);

  if (data.summary.technicalObservations) {
    addHeader("3. Observações Técnicas");
    addText(data.summary.technicalObservations);
  }

  addHeader("4. Riscos e Oportunidades");
  data.summary.risksAndOpportunities?.forEach(r => addText(`• ${r}`));

  addHeader("5. Insights Estratégicos");
  data.summary.insights.forEach(i => addText(`• ${i}`));

  addHeader("6. Plano de Ação Sugerido");
  data.summary.actionPlan?.forEach(a => addText(`- ${a}`));

  // --- Anexos em novas páginas ---
  doc.addPage(); y = 20;
  addHeader("Anexo I: Tradução Integral");
  addText(data.translation, 9);

  doc.addPage(); y = 20;
  addHeader("Anexo II: Transcrição Verbatim");
  doc.setFont("courier", "normal");
  addText(data.transcription, 8);

  doc.save(`${filename}.pdf`);
};

const generateMarkdown = (data: AnalysisResult, filename: string, source: string, date: string) => {
  const content = `
# Relatório CogniStream AI
**Fonte:** ${source}
**Data:** ${date}

## Resumo Executivo
${data.summary.executive}

## Análise Detalhada
${data.summary.detailed}

## Riscos e Oportunidades
${data.summary.risksAndOpportunities?.map(r => `- ${r}`).join('\n')}

## Plano de Ação
${data.summary.actionPlan?.map(a => `- ${a}`).join('\n')}

## Tradução
${data.translation}

## Transcrição
${data.transcription}
  `;
  downloadBlob(content, filename + '.md', 'text/markdown');
};

const generateTXT = (data: AnalysisResult, filename: string, source: string, date: string) => {
  const content = `
RELATÓRIO COGNISTREAM AI
========================
Fonte: ${source}
Data: ${date}

1. RESUMO EXECUTIVO
${data.summary.executive}

2. PLANO DE AÇÃO
${data.summary.actionPlan?.join('\n')}

3. TRANSCRIÇÃO
${data.transcription}
  `;
  downloadBlob(content, filename + '.txt', 'text/plain');
};

const downloadBlob = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
