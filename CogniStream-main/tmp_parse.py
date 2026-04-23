
import re

text = """
1. Gestão (Management)
Iniciante
Bom dia, equipe. / Good morning, team.
Vamos começar a reunião. / Let's start the meeting.
Preciso do seu relatório até sexta. / I need your report by Friday.
Atualize o status do projeto, por favor. / Please update the project status.
Quem é o responsável por esta tarefa? / Who is responsible for this task?
Temos um prazo na próxima semana. / We have a deadline next week.
Vamos definir metas claras. / Let's set clear goals.
Agradeço seu esforço. / I appreciate your effort.
Você pode resumir os pontos principais? / Can you summarize the key points?
Precisamos melhorar nosso desempenho. / We need to improve our performance.
Básico
Vamos discutir o orçamento. / Let's discuss the budget.
Os resultados trimestrais são positivos. / The quarterly results are positive.
Precisamos alinhar nossas prioridades. / We must align our priorities.
Delegue tarefas de forma eficaz. / Delegate tasks effectively.
Dê feedback construtivo. / Provide constructive feedback.
Vamos revisar os itens de ação. / Let's review the action items.
Precisamos gerenciar riscos. / We need to manage risks.
A equipe está motivada. / The team is motivated.
Vamos agendar um acompanhamento. / Let's schedule a follow-up.
Alcançamos nossas metas. / We achieved our targets.
Intermediário
Capacite os membros da sua equipe. / Empower your team members.
Comunique a visão claramente. / Communicate the vision clearly.
Monitore o progresso regularmente. / Monitor progress regularly.
Resolva conflitos rapidamente. / Address conflicts promptly.
Reconheça as conquistas publicamente. / Recognize achievements publicly.
Desenvolva um plano estratégico. / Develop a strategic plan.
Aloque recursos eficientemente. / Allocate resources efficiently.
Promova uma cultura de inovação. / Foster a culture of innovation.
Lidere pelo exemplo. / Lead by example.
Meça os indicadores-chave de desempenho. / Measure key performance indicators.
Avançado
Adapte-se a circunstâncias em mudança. / Adapt to changing circumstances.
Conduza avaliações de desempenho. / Conduct performance reviews.
Implemente a gestão de mudanças. / Implement change management.
Garanta o alinhamento das partes interessadas. / Ensure stakeholder alignment.
Impulsione a melhoria contínua. / Drive continuous improvement.
Mitigue obstáculos potenciais. / Mitigate potential obstacles.
Cultive habilidades de liderança. / Cultivate leadership skills.
Otimize a dinâmica da equipe. / Optimize team dynamics.
Equilibre metas de curto e longo prazo. / Balance short-term and long-term goals.
Facilite a colaboração eficaz. / Facilitate effective collaboration.
Executivo
Negocie com as partes interessadas. / Negotiate with stakeholders.
Supervisione portfólios de projetos. / Oversee project portfolios.
Defenda a diversidade e inclusão. / Champion diversity and inclusion.
Desenvolva planos de sucessão. / Develop succession plans.
Analise as tendências de mercado. / Analyze market trends.
Lidere a mudança organizacional. / Drive organizational change.
Promova um ambiente de aprendizado. / Foster a learning environment.
Alinhe estratégia com execução. / Align strategy with execution.
Lidere iniciativas multifuncionais. / Lead cross-functional initiatives.
Inspire alto desempenho. / Inspire high performance.

2. Vendas B2B (B2B Sales)
Iniciante
Olá, aqui é [Seu Nome] da [Empresa]. / Hello, this is [Your Name] from [Company].
Estou ligando para apresentar nossos serviços. / I'm calling to introduce our services.
Você tem alguns minutos para conversar? / Do you have a few minutes to talk?
Somos especializados em soluções B2B. / We specialize in B2B solutions.
Posso enviar mais informações? / Can I send you more information?
Quais são seus desafios atuais? / What are your current challenges?
Nosso produto pode ajudar você a economizar tempo. / Our product can help you save time.
Vamos agendar uma demonstração. / Let's schedule a demo.
Farei um acompanhamento na próxima semana. / I'll follow up next week.
Oferecemos pacotes personalizados. / We offer customized packages.
Básico
Nossos preços são competitivos. / Our pricing is competitive.
Temos um forte retorno sobre investimento. / We have a strong ROI.
Deixe-me explicar os benefícios. / Let me explain the benefits.
Você tem um orçamento em mente? / Do you have a budget in mind?
Podemos oferecer um teste gratuito. / We can provide a free trial.
Nossos clientes incluem grandes empresas. / Our clients include major companies.
Gostaria de entender suas necessidades. / I'd like to understand your needs.
Podemos integrar com seus sistemas. / We can integrate with your systems.
Vamos discutir uma parceria. / Let's discuss a partnership.
Oferecemos excelente suporte. / We offer excellent support.
Intermediário
Nossa solução escala com você. / Our solution scales with you.
Temos um histórico comprovado. / We have a proven track record.
Vamos falar sobre seus objetivos. / Let's talk about your goals.
Posso enviar uma proposta. / I can send you a proposal.
Somos flexíveis nos termos. / We're flexible on terms.
Nossa tecnologia é de ponta. / Our technology is cutting-edge.
Ajudamos negócios semelhantes. / We've helped similar businesses.
Vamos marcar uma reunião com sua equipe. / Let's set up a call with your team.
Oferecemos treinamento e integração. / We offer training and onboarding.
Nossos contratos são diretos. / Our contracts are straightforward.
Avançado
Podemos cumprir seu prazo. / We can meet your deadline.
Vamos negociar os detalhes. / Let's negotiate the details.
Estamos comprometidos com seu sucesso. / We're committed to your success.
Nossas referências estão disponíveis. / Our references are available.
Oferecemos suporte 24/7. / We provide 24/7 support.
Nosso produto é fácil de usar. / Our product is user-friendly.
Oferecemos garantia de satisfação. / We offer a satisfaction guarantee.
Vamos explorar uma parceria de longo prazo. / Let's explore a long-term partnership.
Podemos personalizar a solução. / We can customize the solution.
Nossos preços são transparentes. / Our pricing is transparent.
Executivo
Temos opções de pagamento flexíveis. / We have flexible payment options.
Somos líderes do setor. / We're industry leaders.
Vamos discutir seus requisitos específicos. / Let's discuss your specific requirements.
Podemos fazer um programa piloto. / We can do a pilot program.
Nossa equipe está pronta para ajudar. / Our team is ready to assist.
Valorizamos seu negócio. / We value your business.
Vamos fechar o negócio. / Let's close the deal.
Estamos animados para trabalhar com você. / We're excited to work with you.
Obrigado pela confiança. / Thank you for your trust.
Esperamos por uma parceria de sucesso. / We look forward to a successful partnership.

3. Processos (Processes)
Iniciante
Vamos mapear o processo. / Let's map the process.
Identifique as etapas envolvidas. / Identify the steps involved.
Quem é o dono do processo? / Who is the process owner?
Documente os procedimentos padrão. / Document the standard procedures.
Precisamos simplificar isso. / We need to streamline this.
Elimine gargalos. / Eliminate bottlenecks.
Defina as entradas e saídas. / Define the inputs and outputs.
Meça o tempo de ciclo. / Measure cycle time.
Garanta a conformidade com regulamentos. / Ensure compliance with regulations.
Treine os funcionários no processo. / Train employees on the process.
Básico
Monitore o desempenho do processo. / Monitor process performance.
Identifique áreas de melhoria. / Identify areas for improvement.
Implemente mudanças no processo. / Implement process changes.
Comunique as atualizações à equipe. / Communicate updates to the team.
Use fluxogramas para visualizar. / Use flowcharts to visualize.
Defina KPIs do processo. / Set process KPIs.
Conduza auditorias de processo. / Conduct process audits.
Reduza desperdício e ineficiência. / Reduce waste and inefficiency.
Padronize as melhores práticas. / Standardize best practices.
Automatize tarefas repetitivas. / Automate repetitive tasks.
Intermediário
Garanta a precisão dos dados. / Ensure data accuracy.
Revise a documentação do processo. / Review process documentation.
Alinhe os processos com a estratégia. / Align processes with strategy.
Gerencie variações do processo. / Manage process variations.
Otimize a alocação de recursos. / Optimize resource allocation.
Implemente verificações de qualidade. / Implement quality checks.
Acompanhe os desvios do processo. / Track process deviations.
Estabeleça ciclos de feedback. / Establish feedback loops.
Melhore continuamente os processos. / Continuously improve processes.
Envolva as partes interessadas no design. / Involve stakeholders in design.
Avançado
Teste novos processos antes da implementação. / Test new processes before rollout.
Monitore a estabilidade do processo. / Monitor process stability.
Aborde as causas raiz dos problemas. / Address root causes of issues.
Use metodologias Seis Sigma. / Use Six Sigma methodologies.
Aplique princípios Lean. / Apply Lean principles.
Garanta a agilidade do processo. / Ensure process agility.
Compare com padrões da indústria. / Benchmark against industry standards.
Promova a propriedade do processo. / Foster process ownership.
Simplifique processos complexos. / Simplify complex processes.
Integre processos entre departamentos. / Integrate processes across departments.
Executivo
Use tecnologia para aprimorar processos. / Use technology to enhance processes.
Mantenha a documentação do processo. / Maintain process documentation.
Conduza revisões regulares de processo. / Conduct regular process reviews.
Treine novos funcionários nos processos. / Train new employees on processes.
Meça a eficácia do processo. / Measure process effectiveness.
Adapte os processos às necessidades em mudança. / Adapt processes to changing needs.
Celebre as melhorias de processo. / Celebrate process improvements.
Compartilhe insights de processo em toda a empresa. / Share process insights company-wide.
Garanta a escalabilidade do processo. / Ensure process scalability.
Promova uma cultura centrada em processos. / Drive a process-centric culture.

4. Operações (Operations)
Iniciante
A equipe de operações está pronta. / The operations team is ready.
Precisamos gerenciar o estoque. / We need to manage inventory.
Garanta que os equipamentos sejam mantidos. / Ensure equipment is maintained.
Programe as execuções de produção. / Schedule production runs.
Monitore a produção diária. / Monitor daily output.
Verifique a qualidade das matérias-primas. / Check quality of raw materials.
Coordene com fornecedores. / Coordinate with suppliers.
Acompanhe as remessas. / Track shipments.
Lide com reclamações de clientes. / Handle customer complaints.
Otimize o layout do armazém. / Optimize warehouse layout.
Básico
Gerencie as escalas da equipe. / Manage staff schedules.
Garanta os protocolos de segurança. / Ensure safety protocols.
Reduza o tempo de inatividade. / Reduce downtime.
Melhore a eficiência operacional. / Improve operational efficiency.
Controle os custos operacionais. / Control operational costs.
Implemente manutenção preventiva. / Implement preventive maintenance.
Gerencie interrupções na cadeia de suprimentos. / Manage supply chain disruptions.
Preveja a demanda com precisão. / Forecast demand accurately.
Equilibre a carga de trabalho entre turnos. / Balance workload across shifts.
Garanta a conformidade regulatória. / Ensure regulatory compliance.
Intermediário
Monitore as principais métricas operacionais. / Monitor key operational metrics.
Simplifique o atendimento de pedidos. / Streamline order fulfillment.
Melhore a flexibilidade da produção. / Enhance production flexibility.
Gerencie relacionamentos com fornecedores. / Manage vendor relationships.
Otimize as rotas de transporte. / Optimize transportation routes.
Implemente operações enxutas. / Implement lean operations.
Use dados para tomar decisões. / Use data to drive decisions.
Reduza o desperdício nas operações. / Reduce waste in operations.
Melhore o tempo de resposta. / Improve turnaround time.
Garanta a disponibilidade do produto. / Ensure product availability.
Avançado
Gerencie devoluções e reparos. / Manage returns and repairs.
Coordene com vendas e marketing. / Coordinate with sales and marketing.
Implemente novas tecnologias. / Implement new technologies.
Treine a equipe em novos equipamentos. / Train staff on new equipment.
Monitore o consumo de energia. / Monitor energy consumption.
Garanta a segurança no local de trabalho. / Ensure workplace safety.
Lide com situações de emergência. / Handle emergency situations.
Conduza auditorias operacionais. / Conduct operational audits.
Otimize os níveis de estoque. / Optimize inventory levels.
Melhore as operações de atendimento ao cliente. / Improve customer service operations.
Executivo
Gerencie a logística de terceiros. / Manage third-party logistics.
Implemente controle de qualidade. / Implement quality control.
Reduza os prazos de entrega. / Reduce lead times.
Melhore a resiliência operacional. / Enhance operational resilience.
Planeje a expansão da capacidade. / Plan for capacity expansion.
Monitore as operações dos concorrentes. / Monitor competitor operations.
Promova a melhoria contínua. / Foster continuous improvement.
Alinhe as operações com as metas de negócios. / Align operations with business goals.
Meça a excelência operacional. / Measure operational excellence.
Impulsione a inovação nas operações. / Drive innovation in operations.

5. Logística (Logistics)
Iniciante
A remessa está pronta. / The shipment is ready.
Rastreie o pacote online. / Track the package online.
Confirme o endereço de entrega. / Confirm delivery address.
Agende uma coleta. / Schedule a pickup.
Precisamos de um conhecimento de embarque. / We need a bill of lading.
Calcule os custos de envio. / Calculate shipping costs.
Escolha a melhor transportadora. / Choose the best carrier.
Garanta a embalagem adequada. / Ensure proper packaging.
Monitore o status da entrega. / Monitor delivery status.
Lide com o desembaraço aduaneiro. / Handle customs clearance.
Básico
Gerencie o estoque do armazém. / Manage warehouse stock.
Otimize o carregamento e descarregamento. / Optimize loading and unloading.
Reduza o tempo de trânsito. / Reduce transit time.
Coordene com despachantes aduaneiros. / Coordinate with freight forwarders.
Garanta o controle de temperatura. / Ensure temperature control.
Gerencie a logística reversa. / Manage returns logistics.
Acompanhe os veículos da frota. / Track fleet vehicles.
Planeje rotas de entrega. / Plan delivery routes.
Use leitura de código de barcodes. / Use barcode scanning.
Mantenha a precisão do inventário. / Maintain inventory accuracy.
Intermediário
Implemente entrega just-in-time. / Implement just-in-time delivery.
Gerencie entregas de fornecedores. / Manage supplier deliveries.
Lide com remessas urgentes. / Handle urgent shipments.
Garanta a conformidade com as leis comerciais. / Ensure compliance with trade laws.
Otimize a utilização de contêineres. / Optimize container utilization.
Monitore a eficiência de combustível. / Monitor fuel efficiency.
Gerencie operações de cross-docking. / Manage cross-docking operations.
Coordene com provedores de última milha. / Coordinate with last-mile providers.
Use software de logística. / Use logistics software.
Acompanhe indicadores-chave de desempenho. / Track key performance indicators.
Avançado
Reduza a pegada de carbono. / Reduce carbon footprint.
Gerencie materiais perigosos. / Manage hazardous materials.
Garanta a segurança do motorista. / Ensure driver safety.
Planeje para as temporadas de pico. / Plan for peak seasons.
Lide com remessas internacionais. / Handle international shipping.
Gerencie a documentação. / Manage documentation.
Otimize a logística reversa. / Optimize reverse logistics.
Use rastreamento em tempo real. / Use real-time tracking.
Melhore a separação de pedidos no armazém. / Improve warehouse picking.
Gerencie a logística de terceiros. / Manage third-party logistics.
Executivo
Garanta a entrega pontual. / Ensure timely delivery.
Reduza erros de envio. / Reduce shipping errors.
Monitore o desempenho da transportadora. / Monitor carrier performance.
Implemente tecnologia RFID. / Implement RFID technology.
Gerencie a visibilidade da cadeia de suprimentos. / Manage supply chain visibility.
Coordene o transporte multimodal. / Coordinate multimodal transport.
Otimize o giro de estoque. / Optimize inventory turnover.
Lide com consultas de clientes. / Handle customer inquiries.
Garanta a segurança dos dados. / Ensure data security.
Impulsione a inovação em logística. / Drive logistics innovation.

6. Qualidade (Quality)
Iniciante
Qualidade é nossa prioridade. / Quality is our priority.
Inspecione o produto cuidadosamente. / Inspect the product carefully.
Verifique se há defeitos. / Check for defects.
Garanta a conformidade com os padrões. / Ensure compliance with standards.
Use equipamentos calibrados. / Use calibrated equipment.
Documente as verificações de qualidade. / Document quality checks.
Identifique as causas raiz dos defeitos. / Identify root causes of defects.
Implemente ações corretivas. / Implement corrective actions.
Monitore as métricas de qualidade. / Monitor quality metrics.
Conduza auditorias regulares. / Conduct regular audits.
Básico
Treine a equipe nos procedimentos de qualidade. / Train staff on quality procedures.
Siga as normas ISO. / Follow ISO standards.
Reduza a variação nos processos. / Reduce variation in processes.
Use controle estatístico de processo. / Use statistical process control.
Reúna feedback dos clientes. / Gather customer feedback.
Melhore a confiabilidade do produto. / Improve product reliability.
Garanta a conformidade de segurança. / Ensure safety compliance.
Realize análise de falhas. / Perform failure analysis.
Implemente sistemas de gestão da qualidade. / Implement quality management systems.
Conduza auditorias de fornecedores. / Conduct supplier audits.
Intermediário
Monitore relatórios de não conformidade. / Monitor non-conformance reports.
Use ferramentas Seis Sigma. / Use Six Sigma tools.
Aplique gestão da qualidade total. / Apply total quality management.
Promova uma cultura de qualidade. / Foster a quality culture.
Meça a satisfação do cliente. / Measure customer satisfaction.
Reduza sucata e retrabalho. / Reduce scrap and rework.
Implemente círculos de qualidade. / Implement quality circles.
Use gráficos de controle. / Use control charts.
Garanta a rastreabilidade. / Ensure traceability.
Conduza análise de causa raiz. / Conduct root cause analysis.
Avançado
Implemente ações preventivas. / Implement preventive actions.
Valide processos regularmente. / Validate processes regularly.
Use FMEA (Análise de Modo e Efeito de Falha). / Use FMEA (Failure Mode Effects Analysis).
Monitore a capacidade do processo. / Monitor process capability.
Garanta a integridade dos dados. / Ensure data integrity.
Conduza revisões de qualidade. / Conduct quality reviews.
Implemente qualidade enxuta. / Implement lean quality.
Use desdobramento da função qualidade. / Use quality function deployment.
Compare com concorrentes. / Benchmark against competitors.
Garanta a conformidade regulatória. / Ensure regulatory compliance.
Executivo
Gerencie produtos não conformes. / Manage non-conforming products.
Implemente ações corretivas e preventivas (CAPA). / Implement corrective and preventive action (CAPA).
Use software de qualidade. / Use quality software.
Treine em ferramentas de qualidade. / Train on quality tools.
Monitore a qualidade dos fornecedores. / Monitor supplier quality.
Conduza inspeção de primeira peça. / Conduct first article inspection.
Garanta o teste de produtos. / Ensure product testing.
Impulsione a melhoria contínua da qualidade. / Drive continuous quality improvement.
Celebre as conquistas de qualidade. / Celebrate quality achievements.
Incorpore a qualidade em cada processo. / Embed quality in every process.

7. Melhoria Contínua (Continuous Improvement)
Iniciante
Podemos sempre fazer melhor. / We can always do better.
Identifique oportunidades de melhoria. / Identify improvement opportunities.
Sugira uma pequena mudança. / Suggest a small change.
Teste a nova ideia. / Test the new idea.
Meça o impacto. / Measure the impact.
Implemente a melhoria. / Implement the improvement.
Compartilhe os resultados com a equipe. / Share results with the team.
Incentive todos a contribuir. / Encourage everyone to contribute.
Use o ciclo PDCA. / Use the PDCA cycle.
Defina metas de melhoria. / Set improvement goals.
Básico
Elimine desperdícios. / Eliminate waste.
Simplifique processos. / Simplify processes.
Reduza erros. / Reduce errors.
Economize tempo e dinheiro. / Save time and money.
Ouça as sugestões dos funcionários. / Listen to employee suggestions.
Celebre pequenas vitórias. / Celebrate small wins.
Aprenda com os erros. / Learn from mistakes.
Compare as melhores práticas. / Benchmark best practices.
Use eventos Kaizen. / Use Kaizen events.
Envolva equipes multifuncionais. / Involve cross-functional teams.
Intermediário
Foque no valor para o cliente. / Focus on customer value.
Mapeie o fluxo de valor. / Map the value stream.
Identifique gargalos. / Identify bottlenecks.
Implemente sistemas puxados. / Implement pull systems.
Padronize mudanças bem-sucedidas. / Standardize successful changes.
Use análise de causa raiz. / Use root cause analysis.
Aplique a metodologia 5S. / Apply 5S methodology.
Reduza o tempo de setup. / Reduce setup times.
Melhore o fluxo de trabalho. / Improve workflow.
Use gestão visual. / Use visual management.
Avançado
Conduza walks gemba. / Conduct gemba walks.
Capacite os funcionários a fazer mudanças. / Empower employees to make changes.
Acompanhe as métricas de melhoria. / Track improvement metrics.
Promova uma cultura de inovação. / Foster a culture of innovation.
Use ferramentas Lean. / Use Lean tools.
Aplique Seis Sigma. / Apply Six Sigma.
Conduza revisões regulares de melhoria. / Conduct regular improvement reviews.
Compartilhe lições aprendidas. / Share lessons learned.
Reconheça os esforços de melhoria. / Recognize improvement efforts.
Alinhe as melhorias com a estratégia. / Align improvements with strategy.
Executivo
Use dados para tomar decisões. / Use data to drive decisions.
Implemente automação sempre que possível. / Implement automation where possible.
Reduza a variabilidade. / Reduce variability.
Melhore o tempo de ciclo. / Improve cycle time.
Melhore a qualidade. / Enhance quality.
Reduza custos. / Reduce costs.
Aumente a eficiência. / Increase efficiency.
Impulsione melhorias sustentáveis. / Drive sustainable improvements.
Incorpore a melhoria contínua no trabalho diário. / Embed continuous improvement in daily work.
Nunca pare de melhorar. / Never stop improving.
"""

modules = re.split(r'\d+\.\s+', text)[1:]
levels = ["Iniciante", "Básico", "Intermediário", "Avançado", "Executivo"]
level_map = {
    "Iniciante": "i",
    "Básico": "b",
    "Intermediário": "m",
    "Avançado": "a",
    "Executivo": "e"
}

output = []

for m_idx, module_content in enumerate(modules):
    m_id = f"m{m_idx + 1}"
    lines = module_content.strip().split('\n')
    current_level = None
    level_counts = {l: 0 for l in levels}
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        found_level = False
        for level in levels:
            if line.startswith(level):
                current_level = level
                found_level = True
                break
        
        if found_level: continue
        
        if current_level and " / " in line:
            pt, en = line.split(" / ", 1)
            level_counts[current_level] += 1
            idx = level_counts[current_level]
            l_code = level_map[current_level]
            phrase_id = f"{m_id}-{l_code}{idx}"
            
            # Global order (approximate as in mockData)
            # Level blocks are usually 10 phrases each
            level_base = levels.index(current_level) * 10
            order = level_base + idx
            
            output.append(f"{{ id: '{phrase_id}', moduleId: '{m_id}', level: '{current_level}', portuguese: '{pt}', english: '{en}', order: {order} }},")

print("\n".join(output))
