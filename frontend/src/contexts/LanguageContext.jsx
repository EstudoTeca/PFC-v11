import React, { createContext, useContext, useState } from 'react';

export const dicionario = {
    pt: {
        // Menu & Geral
        plataforma: "Plataforma",
        dashboard: "Dashboard",
        disciplinas: "Disciplinas",
        areaProf: "Área do Professor",
        vestibular: "Vestibular & ENEM",
        praticar: "Praticar Questões",
        cronograma: "Cronograma",
        minhaConta: "Minha Conta",
        sair: "Sair da Conta",
        pesquisarPlaceholder: "Pesquisar aulas, simulados ou redações...",
        ola: "Olá",
        notificacoes: "Notificações",
        semNotificacoes: "Nenhuma notificação por enquanto.",
        marcarLida: "Marcar lida",
        docente: "Docente",
        estudante: "Estudante",
        altoContraste: "Alto Contraste",
        aumentarFonte: "Aumentar Fonte",
        diminuirFonte: "Diminuir Fonte",

        // Dashboard
        focoEnem: "Foco Total ENEM & Vestibulares",
        concluiuMetas: "Você já concluiu",
        de: "de",
        metasAgendadas: "metas agendadas. Acompanhe sua evolução e prepare-se com questões inéditas e redação IA.",
        explorarMaterias: "Explorar Matérias",
        areaVestibularIA: "Área Vestibular (IA)",
        rumoAoEnem: "Rumo ao ENEM",
        diasRestantes: "dias restantes",
        metasConcluidas: "Metas Concluídas",
        concluido: "concluído",
        aulasDisponiveis: "Aulas Disponíveis",
        naEstudoteca: "Na EstudoTeca",
        diasSeguidos: "Dias Seguidos",
        ofensivaAtiva: "Ofensiva ativa",
        focoDaSemana: "Foco da Semana",
        radarAtualidades: "Radar ENEM & Atualidades",
        radarSub: "Dicas essenciais e novidades para a sua preparação.",
        ultimasPublicacoes: "Últimas Publicações",
        verTudo: "Ver tudo",
        nenhumConteudo: "Nenhum conteúdo publicado ainda.",
        sessaoPomodoro: "Sessão de Foco Pomodoro",
        pomodoroDesc: "Utilize ciclos de 25 minutos de imersão total nos estudos com o cronômetro oficial da EstudoTeca.",
        abrirCronometro: "Abrir Cronômetro & Metas",
        produtividade: "Produtividade",

        // Disciplinas
        trilhasConhecimento: "Trilhas de Estudo",
        trilhasDesc: "Selecione uma disciplina para acessar as videoaulas, resumos e atividades cadastradas pelos professores.",
        progressoGeral: "Progresso Geral",

        // Cronograma
        cronogramaFoco: "Cronograma & Foco",
        cronogramaSub: "Planeje suas metas diárias e utilize a técnica Pomodoro.",
        criarTarefa: "Criar nova tarefa",
        adicionar: "Adicionar",
        agendamentosProf: "Agendamentos dos Professores",
        meuPlanoAcao: "Meu Plano de Ação",
        prazo: "Prazo",
        iaPlanejadora: "IA Planejadora",
        iaPlanejadoraSub: "Deixe a IA organizar o que você deve estudar hoje com base no seu tempo livre!",
        horasLivres: "Horas Livres Hoje",
        focoPrincipal: "Foco Principal",
        criarPlanoIA: "Criar Plano com IA",
        modoTrabalho: "Modo Estudo (25m)",
        modoDescanso: "Modo Descanso (5m)",

        // Vestibular & Redação
        labRedacao: "Laboratório de Redação",
        simuladorRapido: "Simulador Rápido",
        temaProposto: "Tema Proposto",
        gerarInedito: "Gerar Inédito",
        textosMotivadores: "Textos Motivadores",
        escrevaRedacao: "Escreva sua Redação",
        enviarAvaliacao: "Enviar para Avaliação ENEM",
        corrigindo: "Corrigindo com IA...",
        notaFinal: "Nota Final",
        feedbackAvaliador: "Feedback do Avaliador",
        historico: "Histórico",
        suasRedacoes: "Suas Redações Anteriores",
        gerarQuestoes: "Gerar Questões",
        explicacaoIA: "Explicação da IA"
    },
    es: {
        // Menu & Geral
        plataforma: "Plataforma",
        dashboard: "Panel Principal",
        disciplinas: "Materias",
        areaProf: "Área del Profesor",
        vestibular: "Exámenes & Pruebas",
        praticar: "Practicar Preguntas",
        cronograma: "Horario & Metas",
        minhaConta: "Mi Cuenta",
        sair: "Cerrar Sesión",
        pesquisarPlaceholder: "Buscar clases, exámenes o ensayos...",
        ola: "Hola",
        notificacoes: "Notificaciones",
        semNotificacoes: "Sin notificaciones por ahora.",
        marcarLida: "Marcar leída",
        docente: "Profesor",
        estudante: "Estudiante",
        altoContraste: "Alto Contraste",
        aumentarFonte: "Aumentar Fuente",
        diminuirFonte: "Disminuir Fuente",

        // Dashboard
        focoEnem: "Enfoque Total Exámenes & Pruebas",
        concluiuMetas: "Ya has completado",
        de: "de",
        metasAgendadas: "metas programadas. Sigue tu evolución y prepárate con preguntas inéditas y redacción IA.",
        explorarMaterias: "Explorar Materias",
        areaVestibularIA: "Área de Exámenes (IA)",
        rumoAoEnem: "Rumbo a las Pruebas",
        diasRestantes: "días restantes",
        metasConcluidas: "Metas Completadas",
        concluido: "completado",
        aulasDisponiveis: "Clases Disponibles",
        naEstudoteca: "En EstudoTeca",
        diasSeguidos: "Días Seguidos",
        ofensivaAtiva: "Racha activa",
        focoDaSemana: "Enfoque de la Semana",
        radarAtualidades: "Radar Exámenes & Actualidades",
        radarSub: "Consejos esenciales y novedades para tu preparación.",
        ultimasPublicacoes: "Últimas Publicaciones",
        verTudo: "Ver todo",
        nenhumConteudo: "Ningún contenido publicado aún.",
        sessaoPomodoro: "Sesión de Enfoque Pomodoro",
        pomodoroDesc: "Utiliza ciclos de 25 minutos de inmersión total en los estudios con el cronómetro oficial de EstudoTeca.",
        abrirCronometro: "Abrir Cronómetro & Metas",
        produtividade: "Productividad",

        // Disciplinas
        trilhasConhecimento: "Rutas de Estudio",
        trilhasDesc: "Selecciona una materia para acceder a las videoclases, resúmenes y actividades registradas por los profesores.",
        progressoGeral: "Progreso General",

        // Cronograma
        cronogramaFoco: "Horario & Enfoque",
        cronogramaSub: "Planifica tus metas diarias y utiliza la técnica Pomodoro.",
        criarTarefa: "Crear nueva tarea",
        adicionar: "Agregar",
        agendamentosProf: "Programaciones de los Profesores",
        meuPlanoAcao: "Mi Plan de Acción",
        prazo: "Plazo",
        iaPlanejadora: "IA Planificadora",
        iaPlanejadoraSub: "¡Deja que la IA organice lo que debes estudiar hoy según tu tiempo libre!",
        horasLivres: "Horas Libres Hoy",
        focoPrincipal: "Enfoque Principal",
        criarPlanoIA: "Crear Plan con IA",
        modoTrabalho: "Modo Estudio (25m)",
        modoDescanso: "Modo Descanso (5m)",

        // Vestibular & Redação
        labRedacao: "Laboratorio de Redacción",
        simuladorRapido: "Simulador Rápido",
        temaProposto: "Tema Propuesto",
        gerarInedito: "Generar Inédito",
        textosMotivadores: "Textos Motivadores",
        escrevaRedacao: "Escribe tu Redacción",
        enviarAvaliacao: "Enviar para Evaluación",
        corrigindo: "Corrigiendo con IA...",
        notaFinal: "Nota Final",
        feedbackAvaliador: "Comentarios del Evaluador",
        historico: "Historial",
        suasRedacoes: "Tus Ensayos Anteriores",
        gerarQuestoes: "Generar Preguntas",
        explicacaoIA: "Explicación de la IA"
    }
};

const LanguageContext = createContext({
    idioma: 'pt',
    alternarIdioma: () => {},
    t: (chave) => chave
});

export function LanguageProvider({ children }) {
    const [idioma, setIdioma] = useState(() => {
        return localStorage.getItem('idioma') || 'pt';
    });

    const alternarIdioma = (novoIdioma) => {
        setIdioma(novoIdioma);
        localStorage.setItem('idioma', novoIdioma);
    };

    const t = (chave) => {
        return dicionario[idioma]?.[chave] || dicionario['pt']?.[chave] || chave;
    };

    return (
        <LanguageContext.Provider value={{ idioma, alternarIdioma, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);