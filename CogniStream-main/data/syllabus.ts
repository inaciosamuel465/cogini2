
export type EnglishLevel = 'Iniciante' | 'Básico' | 'Intermediário' | 'Avançado' | 'Executivo';
export type CorporateArea = 'Gestão' | 'Vendas B2B' | 'Processos' | 'Operações' | 'Logística' | 'Qualidade' | 'Melhoria Contínua';

export const LEVELS: EnglishLevel[] = ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Executivo'];
export const AREAS: CorporateArea[] = ['Gestão', 'Vendas B2B', 'Processos', 'Operações', 'Logística', 'Qualidade', 'Melhoria Contínua'];

export interface Phrase {
  id: string;
  moduleId: string;
  level: EnglishLevel;
  type: 'word' | 'sentence';
  portuguese: string;
  english: string;
  order: number;
}

export interface Module {
  id: string;
  name: CorporateArea;
  description: string;
  icon: string;
}

export const INITIAL_MODULES: Module[] = [
  { id: 'm1', name: 'Gestão', description: 'Termos de liderança, reuniões e gestão de projetos.', icon: 'Briefcase' },
  { id: 'm2', name: 'Vendas B2B', description: 'Prospecção, negociação e fechamento de contratos.', icon: 'TrendingUp' },
  { id: 'm3', name: 'Processos', description: 'Mapeamento, otimização e fluxogramas.', icon: 'Workflow' },
  { id: 'm4', name: 'Operações', description: 'Manutenção, produção e eficiência fabril.', icon: 'Settings' },
  { id: 'm5', name: 'Logística', description: 'Remessas, estoque e cadeia de suprimentos.', icon: 'Truck' },
  { id: 'm6', name: 'Qualidade', description: 'Inspeção, normas ISO e conformidade.', icon: 'CheckCircle' },
  { id: 'm7', name: 'Melhoria Contínua', description: 'Lean, Six Sigma e PDCA.', icon: 'RefreshCcw' },
];

export const INITIAL_PHRASES: Phrase[] = [
  // 1. GESTÃO
  // Iniciante
  { id: 'p1', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Bom dia, equipe.', english: 'Good morning, team.', order: 1 },
  { id: 'p2', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Vamos começar a reunião.', english: "Let's start the meeting.", order: 2 },
  { id: 'p3', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Preciso do seu relatório até sexta.', english: 'I need your report by Friday.', order: 3 },
  { id: 'p4', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Atualize o status do projeto, por favor.', english: 'Please update the project status.', order: 4 },
  { id: 'p5', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Quem é o responsável por esta tarefa?', english: 'Who is responsible for this task?', order: 5 },
  { id: 'p6', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Temos um prazo na próxima semana.', english: 'We have a deadline next week.', order: 6 },
  { id: 'p7', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Vamos definir metas claras.', english: "Let's set clear goals.", order: 7 },
  { id: 'p8', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Agradeço seu esforço.', english: 'I appreciate your effort.', order: 8 },
  { id: 'p9', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Você pode resumir os pontos principais?', english: 'Can you summarize the key points?', order: 9 },
  { id: 'p10', type: 'sentence', moduleId: 'm1', level: 'Iniciante', portuguese: 'Precisamos melhorar nosso desempenho.', english: 'We need to improve our performance.', order: 10 },
  // Básico
  { id: 'p11', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'Vamos discutir o orçamento.', english: "Let's discuss the budget.", order: 1 },
  { id: 'p12', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'Os resultados trimestrais são positivos.', english: 'The quarterly results are positive.', order: 2 },
  { id: 'p13', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'Precisamos alinhar nossas prioridades.', english: 'We must align our priorities.', order: 3 },
  { id: 'p14', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'Delegue tarefas de forma eficaz.', english: 'Delegate tasks effectively.', order: 4 },
  { id: 'p15', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'Dê feedback construtivo.', english: 'Provide constructive feedback.', order: 5 },
  { id: 'p16', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'Vamos revisar os itens de ação.', english: "Let's review the action items.", order: 6 },
  { id: 'p17', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'Precisamos gerenciar riscos.', english: 'We need to manage risks.', order: 7 },
  { id: 'p18', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'A equipe está motivada.', english: 'The team is motivated.', order: 8 },
  { id: 'p19', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'Vamos agendar um acompanhamento.', english: "Let's schedule a follow-up.", order: 9 },
  { id: 'p20', type: 'sentence', moduleId: 'm1', level: 'Básico', portuguese: 'Alcançamos nossas metas.', english: 'We achieved our targets.', order: 10 },

  // Intermediário
  { id: 'p21', moduleId: 'm1', level: 'Intermediário', portuguese: 'Vamos agilizar o processo.', english: "Let's streamline the process.", order: 1 },
  { id: 'p22', moduleId: 'm1', level: 'Intermediário', portuguese: 'Fomente uma cultura de inovação.', english: 'Foster a culture of innovation.', order: 2 },
  { id: 'p23', moduleId: 'm1', level: 'Intermediário', portuguese: 'Mitigue riscos potenciais de forma proativa.', english: 'Proactively mitigate potential risks.', order: 3 },
  { id: 'p24', moduleId: 'm1', level: 'Intermediário', portuguese: 'Capacite os membros da sua equipe.', english: 'Empower your team members.', order: 4 },
  { id: 'p25', moduleId: 'm1', level: 'Intermediário', portuguese: 'Promova a colaboração multifuncional.', english: 'Promote cross-functional collaboration.', order: 5 },
  { id: 'p26', moduleId: 'm1', level: 'Intermediário', portuguese: 'Otimize a alocação de recursos.', english: 'Optimize resource allocation.', order: 6 },
  { id: 'p27', moduleId: 'm1', level: 'Intermediário', portuguese: 'Mantenha uma vantagem competitiva.', english: 'Maintain a competitive advantage.', order: 7 },
  { id: 'p28', moduleId: 'm1', level: 'Intermediário', portuguese: 'Aproveite nossos pontos fortes.', english: 'Leverage our strengths.', order: 8 },
  { id: 'p29', moduleId: 'm1', level: 'Intermediário', portuguese: 'Garanta a conformidade com as regulamentações.', english: 'Ensure compliance with regulations.', order: 9 },
  { id: 'p30', moduleId: 'm1', level: 'Intermediário', portuguese: 'Cultive relacionamentos fortes com os clientes.', english: 'Strong client relationships.', order: 10 },

  // Avançado
  { id: 'p31', moduleId: 'm1', level: 'Avançado', portuguese: 'Articule uma visão estratégica convincente.', english: 'Articulate a compelling strategic vision.', order: 1 },
  { id: 'p32', moduleId: 'm1', level: 'Avançado', portuguese: 'Incentive o pensamento disruptivo.', english: 'Encourage disruptive thinking.', order: 2 },
  { id: 'p33', moduleId: 'm1', level: 'Avançado', portuguese: 'Navegue por dinâmicas organizacionais complexas.', english: 'Navigate complex organizational dynamics.', order: 3 },
  { id: 'p34', moduleId: 'm1', level: 'Avançado', portuguese: 'Promova um ambiente de segurança psicológica.', english: 'Foster an environment of psychological safety.', order: 4 },
  { id: 'p35', moduleId: 'm1', level: 'Avançado', portuguese: 'Impulsione o crescimento sustentável a longo prazo.', english: 'Drive sustainable long-term growth.', order: 5 },
  { id: 'p36', moduleId: 'm1', level: 'Avançado', portuguese: 'Inculque um senso de propósito e pertencimento.', english: 'Instill a sense of purpose and belonging.', order: 6 },
  { id: 'p37', moduleId: 'm1', level: 'Avançado', portuguese: 'Orquestre mudanças transformacionais em toda a empresa.', english: 'Orchestrate company-wide transformational change.', order: 7 },
  { id: 'p38', moduleId: 'm1', level: 'Avançado', portuguese: 'Aproveite a inteligência coletiva da força de trabalho.', english: 'Harness the collective intelligence of the workforce.', order: 8 },
  { id: 'p39', moduleId: 'm1', level: 'Avançado', portuguese: 'Demonstre agilidade em face da incerteza.', english: 'Demonstrate agility in the face of uncertainty.', order: 9 },
  { id: 'p40', moduleId: 'm1', level: 'Avançado', portuguese: 'Incorpore princípios de liderança servidora.', english: 'Embody servant leadership principles.', order: 10 },

  // Executivo
  { id: 'p41', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Alavanque sinergias em todas as unidades de negócio.', english: 'Leverage synergies across all business units.', order: 1 },
  { id: 'p42', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Aumente o valor para o acionista por meio de decisões prudentes.', english: 'Enhance shareholder value through prudent decisions.', order: 2 },
  { id: 'p43', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Adapte-se a circunstâncias em mudança.', english: 'Adapt to changing circumstances.', order: 3 },
  { id: 'p44', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Aproveite oportunidades emergentes.', english: 'Seize emerging opportunities.', order: 4 },
  { id: 'p45', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Forje parcerias estratégicas para expansão de mercado.', english: 'Forge strategic partnerships for market expansion.', order: 5 },
  { id: 'p46', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Defenda iniciativas de diversidade, equidade e inclusão.', english: 'Champion diversity, equity, and inclusion initiatives.', order: 6 },
  { id: 'p47', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Garanta uma governança corporativa robusta e transparência.', english: 'Ensure robust corporate governance and transparency.', order: 7 },
  { id: 'p48', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Inspire confiança e lealdade entre as partes interessadas.', english: 'Inspire confidence and loyalty among stakeholders.', order: 8 },
  { id: 'p49', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Antecipe tendências do setor e pivote estrategicamente.', english: 'Anticipate industry trends and pivot strategically.', order: 9 },
  { id: 'p50', type: 'sentence', moduleId: 'm1', level: 'Executivo', portuguese: 'Pense em novas estratégias.', english: 'Think about new strategies.', order: 10 },

  // Vendas B2B
  { id: 'p51', type: 'sentence', moduleId: 'm2', level: 'Iniciante', portuguese: 'Olá, aqui é [Seu Nome] da [Empresa].', english: 'Hello, this is [Your Name] from [Company].', order: 1 },
  { id: 'p52', type: 'sentence', moduleId: 'm2', level: 'Iniciante', portuguese: 'Estou ligando para apresentar nossos serviços.', english: "I'm calling to introduce our services.", order: 2 },
  { id: 'p61', type: 'sentence', moduleId: 'm2', level: 'Básico', portuguese: 'Nossos preços são competitivos.', english: 'Our pricing is competitive.', order: 1 },
];

export interface Scenario {
  id: string;
  title: string;
  description: string;
  objective: string;
  role: string;
  aiRole: string;
}

export const SCENARIOS: Record<string, Record<string, Scenario[]>> = {
  'Iniciante': {
    'Gestão': [
      { id: 'ini_ges_sc1', title: 'Daily Standup', description: 'Você está em uma reunião diária rápida.', objective: 'Cumprimente a equipe e diga qual é sua tarefa principal hoje.', role: 'Team Member', aiRole: 'Project Manager' }
    ]
  }
};

export const INITIAL_SETTINGS = {
  instructorName: 'Fernanda',
  welcomeMessage: 'Olá! Sou Fernanda, sua instrutora virtual. Vamos começar seu treinamento?',
  repetitionCount: 3,
  correctionCriteria: 'standard'
};

// Legacy support: Map of Levels -> Areas -> Phrases
export const generateLegacySyllabus = (phrases: Phrase[], modules: Module[]) => {
  const result: any = {};
  LEVELS.forEach(lvl => {
    result[lvl] = {};
    AREAS.forEach(area => {
      const mod = modules.find(m => m.name === area);
      result[lvl][area] = phrases
        .filter(p => p.level === lvl && (p.moduleId === mod?.id || p.moduleId === area))
        .map(p => ({ id: p.id, english: p.english, portuguese: p.portuguese }));
    });
  });
  return result;
};

export const SYLLABUS = generateLegacySyllabus(INITIAL_PHRASES, INITIAL_MODULES);
