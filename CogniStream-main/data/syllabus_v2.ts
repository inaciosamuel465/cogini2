
export type EnglishLevel = 'Iniciante' | 'Básico' | 'Intermediário' | 'Avançado' | 'Executivo';
export type CorporateArea = 'Gestão' | 'Vendas B2B' | 'Processos' | 'Operações' | 'Logística' | 'Qualidade' | 'Melhoria Contínua';

export interface Phrase {
    id: string;
    moduleId: string;
    level: EnglishLevel;
    portuguese: string;
    english: string;
    order: number;
    audioUrl?: string;
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
    { id: 'p1', moduleId: 'm1', level: 'Iniciante', portuguese: 'Bom dia, equipe.', english: 'Good morning, team.', order: 1 },
    { id: 'p2', moduleId: 'm1', level: 'Iniciante', portuguese: 'Vamos começar a reunião.', english: "Let's start the meeting.", order: 2 },
    { id: 'p3', moduleId: 'm1', level: 'Iniciante', portuguese: 'Preciso do seu relatório até sexta.', english: 'I need your report by Friday.', order: 3 },
    { id: 'p4', moduleId: 'm1', level: 'Iniciante', portuguese: 'Atualize o status do projeto, por favor.', english: 'Please update the project status.', order: 4 },
    { id: 'p5', moduleId: 'm1', level: 'Iniciante', portuguese: 'Quem é o responsável por esta tarefa?', english: 'Who is responsible for this task?', order: 5 },
    { id: 'p6', moduleId: 'm1', level: 'Iniciante', portuguese: 'Temos um prazo na próxima semana.', english: 'We have a deadline next week.', order: 6 },
    { id: 'p7', moduleId: 'm1', level: 'Iniciante', portuguese: 'Vamos definir metas claras.', english: "Let's set clear goals.", order: 7 },
    { id: 'p8', moduleId: 'm1', level: 'Iniciante', portuguese: 'Agradeço seu esforço.', english: 'I appreciate your effort.', order: 8 },
    { id: 'p9', moduleId: 'm1', level: 'Iniciante', portuguese: 'Você pode resumir os pontos principais?', english: 'Can you summarize the key points?', order: 9 },
    { id: 'p10', moduleId: 'm1', level: 'Iniciante', portuguese: 'Precisamos melhorar nosso desempenho.', english: 'We need to improve our performance.', order: 10 },
    // Básico
    { id: 'p11', moduleId: 'm1', level: 'Básico', portuguese: 'Vamos discutir o orçamento.', english: "Let's discuss the budget.", order: 1 },
    { id: 'p12', moduleId: 'm1', level: 'Básico', portuguese: 'Os resultados trimestrais são positivos.', english: 'The quarterly results are positive.', order: 2 },
    { id: 'p13', moduleId: 'm1', level: 'Básico', portuguese: 'Precisamos alinhar nossas prioridades.', english: 'We must align our priorities.', order: 3 },
    { id: 'p14', moduleId: 'm1', level: 'Básico', portuguese: 'Delegue tarefas de forma eficaz.', english: 'Delegate tasks effectively.', order: 4 },
    { id: 'p15', moduleId: 'm1', level: 'Básico', portuguese: 'Dê feedback construtivo.', english: 'Provide constructive feedback.', order: 5 },
    { id: 'p16', moduleId: 'm1', level: 'Básico', portuguese: 'Vamos revisar os itens de ação.', english: "Let's review the action items.", order: 6 },
    { id: 'p17', moduleId: 'm1', level: 'Básico', portuguese: 'Precisamos gerenciar riscos.', english: 'We need to manage risks.', order: 7 },
    { id: 'p18', moduleId: 'm1', level: 'Básico', portuguese: 'A equipe está motivada.', english: 'The team is motivated.', order: 8 },
    { id: 'p19', moduleId: 'm1', level: 'Básico', portuguese: 'Vamos agendar um acompanhamento.', english: "Let's schedule a follow-up.", order: 9 },
    { id: 'p20', moduleId: 'm1', level: 'Básico', portuguese: 'Alcançamos nossas metas.', english: 'We achieved our targets.', order: 10 },
    // Intermediário
    { id: 'p21', moduleId: 'm1', level: 'Intermediário', portuguese: 'Capacite os membros da sua equipe.', english: 'Empower your team members.', order: 1 },
    { id: 'p22', moduleId: 'm1', level: 'Intermediário', portuguese: 'Comunique a visão claramente.', english: 'Communicate the vision clearly.', order: 2 },
    { id: 'p23', moduleId: 'm1', level: 'Intermediário', portuguese: 'Monitore o progresso regularmente.', english: 'Monitor progress regularly.', order: 3 },
    { id: 'p24', moduleId: 'm1', level: 'Intermediário', portuguese: 'Resolva conflitos rapidamente.', english: 'Address conflicts promptly.', order: 4 },
    { id: 'p25', moduleId: 'm1', level: 'Intermediário', portuguese: 'Reconheça as conquistas publicamente.', english: 'Recognize achievements publicly.', order: 5 },
    { id: 'p26', moduleId: 'm1', level: 'Intermediário', portuguese: 'Desenvolva um plano estratégico.', english: 'Develop a strategic plan.', order: 6 },
    { id: 'p27', moduleId: 'm1', level: 'Intermediário', portuguese: 'Aloque recursos eficientemente.', english: 'Allocate resources efficiently.', order: 7 },
    { id: 'p28', moduleId: 'm1', level: 'Intermediário', portuguese: 'Promova uma cultura de inovação.', english: 'Foster a culture of innovation.', order: 8 },
    { id: 'p29', moduleId: 'm1', level: 'Intermediário', portuguese: 'Lidere pelo exemplo.', english: 'Lead by example.', order: 9 },
    { id: 'p30', moduleId: 'm1', level: 'Intermediário', portuguese: 'Meça os indicadores-chave de desempenho.', english: 'Measure key performance indicators.', order: 10 },
    // Avançado
    { id: 'p31', moduleId: 'm1', level: 'Avançado', portuguese: 'Adapte-se a circunstâncias em mudança.', english: 'Adapt to changing circumstances.', order: 1 },
    { id: 'p32', moduleId: 'm1', level: 'Avançado', portuguese: 'Conduza avaliações de desempenho.', english: 'Conduct performance reviews.', order: 2 },
    { id: 'p33', moduleId: 'm1', level: 'Avançado', portuguese: 'Implemente a gestão de mudanças.', english: 'Implement change management.', order: 3 },
    { id: 'p34', moduleId: 'm1', level: 'Avançado', portuguese: 'Garanta o alinhamento das partes interessadas.', english: 'Ensure stakeholder alignment.', order: 4 },
    { id: 'p35', moduleId: 'm1', level: 'Avançado', portuguese: 'Impulsione a melhoria contínua.', english: 'Drive continuous improvement.', order: 5 },
    { id: 'p36', moduleId: 'm1', level: 'Avançado', portuguese: 'Mitigue obstáculos potenciais.', english: 'Mitigate potential obstacles.', order: 6 },
    { id: 'p37', moduleId: 'm1', level: 'Avançado', portuguese: 'Cultive habilidades de liderança.', english: 'Cultivate leadership skills.', order: 7 },
    { id: 'p38', moduleId: 'm1', level: 'Avançado', portuguese: 'Otimize a dinâmica da equipe.', english: 'Optimize team dynamics.', order: 8 },
    { id: 'p39', moduleId: 'm1', level: 'Avançado', portuguese: 'Equilibre metas de curto e longo prazo.', english: 'Balance short-term and long-term goals.', order: 9 },
    { id: 'p40', moduleId: 'm1', level: 'Avançado', portuguese: 'Facilite a colaboração eficaz.', english: 'Facilitate effective collaboration.', order: 10 },
    // Executivo
    { id: 'p41', moduleId: 'm1', level: 'Executivo', portuguese: 'Negocie com as partes interessadas.', english: 'Negotiate with stakeholders.', order: 1 },
    { id: 'p42', moduleId: 'm1', level: 'Executivo', portuguese: 'Supervisione portfólios de projetos.', english: 'Oversee project portfolios.', order: 2 },
    { id: 'p43', moduleId: 'm1', level: 'Executivo', portuguese: 'Defenda a diversidade e inclusão.', english: 'Champion diversity and inclusion.', order: 3 },
    { id: 'p44', moduleId: 'm1', level: 'Executivo', portuguese: 'Desenvolva planos de sucessão.', english: 'Develop succession plans.', order: 4 },
    { id: 'p45', moduleId: 'm1', level: 'Executivo', portuguese: 'Analise as tendências de mercado.', english: 'Analyze market trends.', order: 5 },
    { id: 'p46', moduleId: 'm1', level: 'Executivo', portuguese: 'Lidere a mudança organizacional.', english: 'Drive organizational change.', order: 6 },
    { id: 'p47', moduleId: 'm1', level: 'Executivo', portuguese: 'Promova um ambiente de aprendizado.', english: 'Foster a learning environment.', order: 7 },
    { id: 'p48', moduleId: 'm1', level: 'Executivo', portuguese: 'Alinhe estratégia com execução.', english: 'Align strategy with execution.', order: 8 },
    { id: 'p49', moduleId: 'm1', level: 'Executivo', portuguese: 'Lidere iniciativas multifuncionais.', english: 'Lead cross-functional initiatives.', order: 9 },
    { id: 'p50', moduleId: 'm1', level: 'Executivo', portuguese: 'Inspire alto desempenho.', english: 'Inspire high performance.', order: 10 },

    // 2. VENDAS B2B
    // Iniciante
    { id: 'p51', moduleId: 'm2', level: 'Iniciante', portuguese: 'Olá, aqui é [Seu Nome] da [Empresa].', english: 'Hello, this is [Your Name] from [Company].', order: 1 },
    { id: 'p52', moduleId: 'm2', level: 'Iniciante', portuguese: 'Estou ligando para apresentar nossos serviços.', english: "I'm calling to introduce our services.", order: 2 },
    { id: 'p53', moduleId: 'm2', level: 'Iniciante', portuguese: 'Você tem alguns minutos para conversar?', english: 'Do you have a few minutes to talk?', order: 3 },
    { id: 'p54', moduleId: 'm2', level: 'Iniciante', portuguese: 'Somos especializados em soluções B2B.', english: 'We specialize in B2B solutions.', order: 4 },
    { id: 'p55', moduleId: 'm2', level: 'Iniciante', portuguese: 'Posso enviar mais informações?', english: 'Can I send you more information?', order: 5 },
    { id: 'p56', moduleId: 'm2', level: 'Iniciante', portuguese: 'Quais são seus desafios atuais?', english: 'What are your current challenges?', order: 6 },
    { id: 'p57', moduleId: 'm2', level: 'Iniciante', portuguese: 'Nosso produto pode ajudar você a economizar tempo.', english: 'Our product can help you save time.', order: 7 },
    { id: 'p58', moduleId: 'm2', level: 'Iniciante', portuguese: 'Vamos agendar uma demonstração.', english: "Let's schedule a demo.", order: 8 },
    { id: 'p59', moduleId: 'm2', level: 'Iniciante', portuguese: 'Farei um acompanhamento na próxima semana.', english: "I'll follow up next week.", order: 9 },
    { id: 'p60', moduleId: 'm2', level: 'Iniciante', portuguese: 'Oferecemos pacotes personalizados.', english: 'We offer customized packages.', order: 10 },
    // Básico
    { id: 'p61', moduleId: 'm2', level: 'Básico', portuguese: 'Nossos preços são competitivos.', english: 'Our pricing is competitive.', order: 1 },
    { id: 'p62', moduleId: 'm2', level: 'Básico', portuguese: 'Temos um forte retorno sobre investimento.', english: 'We have a strong ROI.', order: 2 },
    { id: 'p63', moduleId: 'm2', level: 'Básico', portuguese: 'Deixe-me explicar os benefícios.', english: 'Let me explain the benefits.', order: 3 },
    { id: 'p64', moduleId: 'm2', level: 'Básico', portuguese: 'Você tem um orçamento em mente?', english: 'Do you have a budget in mind?', order: 4 },
    { id: 'p65', moduleId: 'm2', level: 'Básico', portuguese: 'Podemos oferecer um teste gratuito.', english: 'We can provide a free trial.', order: 5 },
    { id: 'p66', moduleId: 'm2', level: 'Básico', portuguese: 'Nossos clientes incluem grandes empresas.', english: 'Our clients include major companies.', order: 6 },
    { id: 'p67', moduleId: 'm2', level: 'Básico', portuguese: 'Gostaria de entender suas necessidades.', english: "I'd like to understand your needs.", order: 7 },
    { id: 'p68', moduleId: 'm2', level: 'Básico', portuguese: 'Podemos integrar com seus sistemas.', english: 'We can integrate with your systems.', order: 8 },
    { id: 'p69', moduleId: 'm2', level: 'Básico', portuguese: 'Vamos discutir uma parceria.', english: "Let's discuss a partnership.", order: 9 },
    { id: 'p70', moduleId: 'm2', level: 'Básico', portuguese: 'Oferecemos excelente suporte.', english: 'We offer excellent support.', order: 10 },
    // Intermediário
    { id: 'p71', moduleId: 'm2', level: 'Intermediário', portuguese: 'Nossa solução escala com você.', english: 'Our solution scales with you.', order: 1 },
    { id: 'p72', moduleId: 'm2', level: 'Intermediário', portuguese: 'Temos um histórico comprovado.', english: 'We have a proven track record.', order: 2 },
    { id: 'p73', moduleId: 'm2', level: 'Intermediário', portuguese: 'Vamos falar sobre seus objetivos.', english: "Let's talk about your goals.", order: 3 },
    { id: 'p74', moduleId: 'm2', level: 'Intermediário', portuguese: 'Posso enviar uma proposta.', english: 'I can send you a proposal.', order: 4 },
    { id: 'p75', moduleId: 'm2', level: 'Intermediário', portuguese: 'Somos flexíveis nos termos.', english: "We're flexible on terms.", order: 5 },
    { id: 'p76', moduleId: 'm2', level: 'Intermediário', portuguese: 'Nossa tecnologia é de ponta.', english: 'Our technology is cutting-edge.', order: 6 },
    { id: 'p77', moduleId: 'm2', level: 'Intermediário', portuguese: 'Ajudamos negócios semelhantes.', english: "We've helped similar businesses.", order: 7 },
    { id: 'p78', moduleId: 'm2', level: 'Intermediário', portuguese: 'Vamos marcar uma reunião com sua equipe.', english: "Let's set up a call with your team.", order: 8 },
    { id: 'p79', moduleId: 'm2', level: 'Intermediário', portuguese: 'Oferecemos treinamento e integração.', english: 'We offer training and onboarding.', order: 9 },
    { id: 'p80', moduleId: 'm2', level: 'Intermediário', portuguese: 'Nossos contratos são diretos.', english: 'Our contracts are straightforward.', order: 10 },
    // Avançado
    { id: 'p81', moduleId: 'm2', level: 'Avançado', portuguese: 'Podemos cumprir seu prazo.', english: 'We can meet your deadline.', order: 1 },
    { id: 'p82', moduleId: 'm2', level: 'Avançado', portuguese: 'Vamos negociar os detalhes.', english: "Let's negotiate the details.", order: 2 },
    { id: 'p83', moduleId: 'm2', level: 'Avançado', portuguese: 'Estamos comprometidos com seu sucesso.', english: "We're committed to your success.", order: 3 },
    { id: 'p84', moduleId: 'm2', level: 'Avançado', portuguese: 'Nossas referências estão disponíveis.', english: 'Our references are available.', order: 4 },
    { id: 'p85', moduleId: 'm2', level: 'Avançado', portuguese: 'Oferecemos suporte 24/7.', english: 'We provide 24/7 support.', order: 5 },
    { id: 'p86', moduleId: 'm2', level: 'Avançado', portuguese: 'Nosso produto é fácil de usar.', english: 'Our product is user-friendly.', order: 6 },
    { id: 'p87', moduleId: 'm2', level: 'Avançado', portuguese: 'Oferecemos garantia de satisfação.', english: 'We offer a satisfaction guarantee.', order: 7 },
    { id: 'p88', moduleId: 'm2', level: 'Avançado', portuguese: 'Vamos explorar uma parceria de longo prazo.', english: "Let's explore a long-term partnership.", order: 8 },
    { id: 'p89', moduleId: 'm2', level: 'Avançado', portuguese: 'Podemos personalizar a solução.', english: 'We can customize the solution.', order: 9 },
    { id: 'p90', moduleId: 'm2', level: 'Avançado', portuguese: 'Nossos preços são transparentes.', english: 'Our pricing is transparent.', order: 10 },
    // Executivo
    { id: 'p91', moduleId: 'm2', level: 'Executivo', portuguese: 'Temos opções de pagamento flexíveis.', english: 'We have flexible payment options.', order: 1 },
    { id: 'p92', moduleId: 'm2', level: 'Executivo', portuguese: 'Somos líderes do setor.', english: "We're industry leaders.", order: 2 },
    { id: 'p93', moduleId: 'm2', level: 'Executivo', portuguese: 'Vamos discutir seus requisitos específicos.', english: "Let's discuss your specific requirements.", order: 3 },
    { id: 'p94', moduleId: 'm2', level: 'Executivo', portuguese: 'Podemos fazer um programa piloto.', english: 'We can do a pilot program.', order: 4 },
    { id: 'p95', moduleId: 'm2', level: 'Executivo', portuguese: 'Nossa equipe está pronta para ajudar.', english: 'Our team is ready to assist.', order: 5 },
    { id: 'p96', moduleId: 'm2', level: 'Executivo', portuguese: 'Valorizamos seu negócio.', english: 'We value your business.', order: 6 },
    { id: 'p97', moduleId: 'm2', level: 'Executivo', portuguese: 'Vamos fechar o negócio.', english: "Let's close the deal.", order: 7 },
    { id: 'p98', moduleId: 'm2', level: 'Executivo', portuguese: 'Estamos animados para trabalhar com você.', english: "We're excited to work with you.", order: 8 },
    { id: 'p99', moduleId: 'm2', level: 'Executivo', portuguese: 'Obrigado pela confiança.', english: 'Thank you for your trust.', order: 9 },
    { id: 'p100', moduleId: 'm2', level: 'Executivo', portuguese: 'Esperamos por uma parceria de sucesso.', english: 'We look forward to a successful partnership.', order: 10 },

    // 3. PROCESSOS
    // Iniciante
    { id: 'p101', moduleId: 'm3', level: 'Iniciante', portuguese: 'Vamos mapear o processo.', english: "Let's map the process.", order: 1 },
    { id: 'p102', moduleId: 'm3', level: 'Iniciante', portuguese: 'Identifique as etapas envolvidas.', english: 'Identify the steps involved.', order: 2 },
    { id: 'p103', moduleId: 'm3', level: 'Iniciante', portuguese: 'Quem é o dono do processo?', english: 'Who is the process owner?', order: 3 },
    { id: 'p104', moduleId: 'm3', level: 'Iniciante', portuguese: 'Documente os procedimentos padrão.', english: 'Document the standard procedures.', order: 4 },
    { id: 'p105', moduleId: 'm3', level: 'Iniciante', portuguese: 'Precisamos simplificar isso.', english: 'We need to streamline this.', order: 5 },
    { id: 'p106', moduleId: 'm3', level: 'Iniciante', portuguese: 'Elimine gargalos.', english: 'Eliminate bottlenecks.', order: 6 },
    { id: 'p107', moduleId: 'm3', level: 'Iniciante', portuguese: 'Defina as entradas e saídas.', english: 'Define the inputs and outputs.', order: 7 },
    { id: 'p108', moduleId: 'm3', level: 'Iniciante', portuguese: 'Meça o tempo de ciclo.', english: 'Measure cycle time.', order: 8 },
    { id: 'p109', moduleId: 'm3', level: 'Iniciante', portuguese: 'Garanta a conformidade com regulamentos.', english: 'Ensure compliance with regulations.', order: 9 },
    { id: 'p110', moduleId: 'm3', level: 'Iniciante', portuguese: 'Treine os funcionários no processo.', english: 'Train employees on the process.', order: 10 },

    // 4. OPERAÇÕES
    // Iniciante
    { id: 'p151', moduleId: 'm4', level: 'Iniciante', portuguese: 'A equipe de operações está pronta.', english: 'The operations team is ready.', order: 1 },
    { id: 'p152', moduleId: 'm4', level: 'Iniciante', portuguese: 'Precisamos gerenciar o estoque.', english: 'We need to manage inventory.', order: 2 },
    { id: 'p153', moduleId: 'm4', level: 'Iniciante', portuguese: 'Garanta que os equipamentos sejam mantidos.', english: 'Ensure equipment is maintained.', order: 3 },
    { id: 'p154', moduleId: 'm4', level: 'Iniciante', portuguese: 'Programe as execuções de produção.', english: 'Schedule production runs.', order: 4 },
    { id: 'p155', moduleId: 'm4', level: 'Iniciante', portuguese: 'Monitore a produção diária.', english: 'Monitor daily output.', order: 5 },
    { id: 'p156', moduleId: 'm4', level: 'Iniciante', portuguese: 'Verifique a qualidade das matérias-primas.', english: 'Check quality of raw materials.', order: 6 },
    { id: 'p157', moduleId: 'm4', level: 'Iniciante', portuguese: 'Coordene com fornecedores.', english: 'Coordinate with suppliers.', order: 7 },
    { id: 'p158', moduleId: 'm4', level: 'Iniciante', portuguese: 'Acompanhe as remessas.', english: 'Track shipments.', order: 8 },
    { id: 'p159', moduleId: 'm4', level: 'Iniciante', portuguese: 'Lide com reclamações de clientes.', english: 'Handle customer complaints.', order: 9 },
    { id: 'p160', moduleId: 'm4', level: 'Iniciante', portuguese: 'Otimize o layout do armazém.', english: 'Optimize warehouse layout.', order: 10 },

    // 5. LOGÍSTICA
    // Iniciante
    { id: 'p201', moduleId: 'm5', level: 'Iniciante', portuguese: 'A remessa está pronta.', english: 'The shipment is ready.', order: 1 },
    { id: 'p202', moduleId: 'm5', level: 'Iniciante', portuguese: 'Rastreie o pacote online.', english: 'Track the package online.', order: 2 },
    { id: 'p203', moduleId: 'm5', level: 'Iniciante', portuguese: 'Confirme o endereço de entrega.', english: 'Confirm delivery address.', order: 3 },
    { id: 'p204', moduleId: 'm5', level: 'Iniciante', portuguese: 'Agende uma coleta.', english: 'Schedule a pickup.', order: 4 },
    { id: 'p205', moduleId: 'm5', level: 'Iniciante', portuguese: 'Precisamos de um conhecimento de embarque.', english: 'We need a bill of lading.', order: 5 },
    { id: 'p206', moduleId: 'm5', level: 'Iniciante', portuguese: 'Calcule os custos de envio.', english: 'Calculate shipping costs.', order: 6 },
    { id: 'p207', moduleId: 'm5', level: 'Iniciante', portuguese: 'Escolha a melhor transportadora.', english: 'Choose the best carrier.', order: 7 },
    { id: 'p208', moduleId: 'm5', level: 'Iniciante', portuguese: 'Garanta a embalagem adequada.', english: 'Ensure proper packaging.', order: 8 },
    { id: 'p209', moduleId: 'm5', level: 'Iniciante', portuguese: 'Monitore o status da entrega.', english: 'Monitor delivery status.', order: 9 },
    { id: 'p210', moduleId: 'm5', level: 'Iniciante', portuguese: 'Lide com o desembaraço aduaneiro.', english: 'Handle customs clearance.', order: 10 },

    // 6. QUALIDADE
    // Iniciante
    { id: 'p251', moduleId: 'm6', level: 'Iniciante', portuguese: 'Qualidade é nossa prioridade.', english: 'Quality is our priority.', order: 1 },
    { id: 'p252', moduleId: 'm6', level: 'Iniciante', portuguese: 'Inspecione o produto cuidadosamente.', english: 'Inspect the product carefully.', order: 2 },
    { id: 'p253', moduleId: 'm6', level: 'Iniciante', portuguese: 'Verifique se há defeitos.', english: 'Check for defects.', order: 3 },
    { id: 'p254', moduleId: 'm6', level: 'Iniciante', portuguese: 'Garanta a conformidade com os padrões.', english: 'Ensure compliance with standards.', order: 4 },
    { id: 'p255', moduleId: 'm6', level: 'Iniciante', portuguese: 'Use equipamentos calibrados.', english: 'Use calibrated equipment.', order: 5 },
    { id: 'p256', moduleId: 'm6', level: 'Iniciante', portuguese: 'Documente as verificações de qualidade.', english: 'Document quality checks.', order: 6 },
    { id: 'p257', moduleId: 'm6', level: 'Iniciante', portuguese: 'Identifique as causas raiz dos defeitos.', english: 'Identify root causes of defects.', order: 7 },
    { id: 'p258', moduleId: 'm6', level: 'Iniciante', portuguese: 'Implemente ações corretivas.', english: 'Implement corrective actions.', order: 8 },
    { id: 'p259', moduleId: 'm6', level: 'Iniciante', portuguese: 'Monitore as métricas de qualidade.', english: 'Monitor quality metrics.', order: 9 },
    { id: 'p260', moduleId: 'm6', level: 'Iniciante', portuguese: 'Conduza auditorias regulares.', english: 'Conduct regular audits.', order: 10 },

    // 7. MELHORIA CONTÍNUA
    // Iniciante
    { id: 'p301', moduleId: 'm7', level: 'Iniciante', portuguese: 'Podemos sempre fazer melhor.', english: 'We can always do better.', order: 1 },
    { id: 'p302', moduleId: 'm7', level: 'Iniciante', portuguese: 'Identifique oportunidades de melhoria.', english: 'Identify improvement opportunities.', order: 2 },
    { id: 'p303', moduleId: 'm7', level: 'Iniciante', portuguese: 'Sugira uma pequena mudança.', english: 'Suggest a small change.', order: 3 },
    { id: 'p304', moduleId: 'm7', level: 'Iniciante', portuguese: 'Teste a nova ideia.', english: 'Test the new idea.', order: 4 },
    { id: 'p305', moduleId: 'm7', level: 'Iniciante', portuguese: 'Meça o impacto.', english: 'Measure the impact.', order: 5 },
    { id: 'p306', moduleId: 'm7', level: 'Iniciante', portuguese: 'Implemente a melhoria.', english: 'Implement the improvement.', order: 6 },
    { id: 'p307', moduleId: 'm7', level: 'Iniciante', portuguese: 'Compartilhe os resultados com a equipe.', english: 'Share results with the team.', order: 7 },
    { id: 'p308', moduleId: 'm7', level: 'Iniciante', portuguese: 'Incentive todos a contribuir.', english: 'Encourage everyone to contribute.', order: 8 },
    { id: 'p309', moduleId: 'm7', level: 'Iniciante', portuguese: 'Use o ciclo PDCA.', english: 'Use the PDCA cycle.', order: 9 },
    { id: 'p310', moduleId: 'm7', level: 'Iniciante', portuguese: 'Defina metas de melhoria.', english: 'Set improvement goals.', order: 10 },
];

export const INITIAL_SETTINGS = {
    instructorName: 'Fernanda',
    welcomeMessage: 'Olá! Sou Fernanda, sua instrutora virtual. Vamos começar seu treinamento?',
    repetitionCount: 3,
    correctionCriteria: 'standard'
};
