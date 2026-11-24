import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Calculator } from 'lucide-react'; // adicione na lista de imports do lucide-react
import { 
    BookOpen, 
    Video, 
    FileText, 
    Image as ImageIcon, 
    CheckCircle, 
    CheckCircle2,
    ArrowLeft, 
    Play, 
    ExternalLink, 
    Trash2, 
    Sparkles,
    Filter,
    HelpCircle,
    ChevronRight
} from 'lucide-react';

function MateriaDetalhe() {
    const { id } = useParams(); // Ex: 'Matemática'
    const navigate = useNavigate();
    
    const perfil = localStorage.getItem('perfil');
    const usuarioId = localStorage.getItem('id');

    const [conteudos, setConteudos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [conteudoAtivo, setConteudoAtivo] = useState(null);
    const [mostrarAtividade, setMostrarAtividade] = useState(false);
    
    // FILTROS
    const [filtroAno, setFiltroAno] = useState('all');
    const [filtroMidia, setFiltroMidia] = useState('all');

    // PROGRESSO SALVO NO BANCO
    const [aulasConcluidas, setAulasConcluidas] = useState({});
    const [respostasUsuario, setRespostasUsuario] = useState({});
    const [salvandoProgresso, setSalvandoProgresso] = useState(false);

    const carregarDados = async () => {
        try {
            const [resConteudos, resProgresso] = await Promise.all([
                axios.get(`http://localhost:5000/api/conteudos/${id}/all`),
                usuarioId ? axios.get(`http://localhost:5000/api/progresso/${usuarioId}`) : Promise.resolve({ data: [] })
            ]);

            setConteudos(resConteudos.data);
            if (resConteudos.data.length > 0) {
                setConteudoAtivo(resConteudos.data[0]);
            }

            const mapaConcluidas = {};
            const mapaRespostas = {};
            
            resProgresso.data.forEach(p => {
                if (p.concluido) {
                    mapaConcluidas[p.conteudoId] = true;
                }
                if (p.respostas) {
                    p.respostas.forEach(r => {
                        const chave = `${p.conteudoId}-${r.atividadeId}`;
                        mapaRespostas[chave] = {
                            opcao: r.opcaoEscolhida,
                            acertou: r.acertou
                        };
                    });
                }
            });

            setAulasConcluidas(mapaConcluidas);
            setRespostasUsuario(mapaRespostas);
        } catch (err) {
            console.error("Erro ao carregar conteúdos e progresso:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [id, usuarioId]);

    // Marcar / Desmarcar Conclusão da Aula
    const toggleConcluirAula = async () => {
        if (!usuarioId || !conteudoAtivo) return;
        setSalvandoProgresso(true);
        try {
            const res = await axios.post('http://localhost:5000/api/progresso/aula', {
                usuarioId,
                conteudoId: conteudoAtivo._id,
                materia: conteudoAtivo.materia
            });

            setAulasConcluidas(prev => ({
                ...prev,
                [conteudoAtivo._id]: res.data.concluido
            }));
        } catch (err) {
            alert("Erro ao atualizar status da aula.");
        } finally {
            setSalvandoProgresso(false);
        }
    };

    // Responder Exercício e Salvar no Banco
    const handleResponderQuestao = async (ativ, optIndex) => {
        if (!usuarioId || !conteudoAtivo) return;
        const atividadeId = ativ._id || ativ.id || optIndex.toString();
        const chave = `${conteudoAtivo._id}-${atividadeId}`;
        const isCorreta = ativ.respostaCorreta === optIndex;

        setRespostasUsuario(prev => ({
            ...prev,
            [chave]: { opcao: optIndex, acertou: isCorreta }
        }));

        try {
            await axios.post('http://localhost:5000/api/progresso/resposta', {
                usuarioId,
                conteudoId: conteudoAtivo._id,
                materia: conteudoAtivo.materia,
                atividadeId,
                opcaoEscolhida: optIndex,
                acertou: isCorreta
            });
        } catch (err) {
            console.error("Erro ao salvar resposta no banco:", err);
        }
    };

    const handleExcluir = async (conteudoId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta aula?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/conteudos/${conteudoId}`);
            carregarDados();
            setConteudoAtivo(null);
        } catch (err) {
            alert("Erro ao excluir conteúdo.");
        }
    };

    const getYoutubeEmbed = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    };

    const conteudosFiltrados = conteudos.filter(item => {
        const matchAno = filtroAno === 'all' || item.anoEscolar === filtroAno;
        const matchMidia = filtroMidia === 'all' || (item.elementos && item.elementos.some(el => el.tipo === filtroMidia));
        return matchAno && matchMidia;
    });

    const isAulaAtivaConcluida = conteudoAtivo && aulasConcluidas[conteudoAtivo._id];
    const totalQuestoesAulaAtiva = conteudoAtivo?.atividades?.length || 0;

    return (
        <Sidebar>
            <div className="p-2 max-w-7xl mx-auto space-y-8">
                
                {/* CABEÇALHO & BREADCRUMB */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 w-full md:w-auto">
                        <button 
                            onClick={() => navigate('/disciplinas')}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex-shrink-0"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>Disciplinas</span>
                                <ChevronRight size={14} />
                                <span className="text-blue-600">{id}</span>
                                {conteudoAtivo && (
                                    <>
                                        <ChevronRight size={14} />
                                        <span className="text-slate-600 truncate max-w-[160px] sm:max-w-[200px]">{conteudoAtivo.titulo}</span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1 capitalize break-words">
                                {conteudoAtivo ? conteudoAtivo.titulo : `Trilha de ${id}`}
                            </h1>
                        </div>
                    </div>

                    {/* FILTROS POR ANO */}
                    <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
                        {[
                            { label: 'Todos', val: 'all' },
                            { label: '1º Ano', val: '1ano' },
                            { label: '2º Ano', val: '2ano' },
                            { label: '3º Ano', val: '3ano' },
                            { label: 'ENEM', val: 'Enem' },
                        ].map(tab => (
                            <button
                                key={tab.val}
                                onClick={() => setFiltroAno(tab.val)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                    filtroAno === tab.val ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FILTROS SECUNDÁRIOS POR TIPO DE MÍDIA */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 pl-1 whitespace-nowrap">
                        <Filter size={14} /> Filtrar mídia:
                    </span>
                    {[
                        { label: 'Tudo', val: 'all' },
                        { label: '🎥 Vídeos', val: 'video' },
                        { label: '📄 PDFs', val: 'pdf' },
                        { label: '✍️ Textos', val: 'texto' },
                    ].map(m => (
                        <button
                            key={m.val}
                            onClick={() => setFiltroMidia(m.val)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 ${
                                filtroMidia === m.val 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-400 text-sm">Carregando aulas...</div>
                ) : conteudosFiltrados.length === 0 ? (
                    <div className="bg-white p-12 rounded-[28px] border border-slate-100 text-center space-y-3">
                        <BookOpen size={48} className="text-slate-300 mx-auto" />
                        <h3 className="text-slate-700 font-bold text-base">Nenhum conteúdo encontrado</h3>
                        <p className="text-slate-400 text-xs max-w-sm mx-auto">
                            Não há aulas correspondentes aos filtros selecionados.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* COLUNA ESQUERDA: LISTA DE AULAS E ATALHO DE QUESTÕES */}
                        <div className="lg:col-span-4 space-y-4">
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider px-2">
                                Módulos ({conteudosFiltrados.length})
                            </h3>
                            
                            <div className="space-y-3">
                                {conteudosFiltrados.map((item) => {
                                    const ativo = conteudoAtivo?._id === item._id;
                                    const concluida = aulasConcluidas[item._id];
                                    const qtdQuestoes = item.atividades?.length || 0;

                                    return (
                                        <div
                                            key={item._id}
                                            className={`p-4 rounded-[22px] border transition-all ${
                                                ativo 
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                                    : 'bg-white border-slate-100 text-slate-800 hover:border-slate-300 shadow-sm'
                                            }`}
                                        >
                                            {/* Cabeçalho do Card */}
                                            <div 
                                                onClick={() => { setConteudoAtivo(item); setMostrarAtividade(false); }}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                        ativo ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {item.anoEscolar}
                                                    </span>

                                                    {concluida && (
                                                        <span className="text-[9px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> Concluída
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="font-bold text-sm leading-snug line-clamp-2">{item.titulo}</h4>
                                            </div>

                                            {/* Barra de Ação Rápida: Ir para Teoria ou Direto para Tarefa */}
                                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100/20">
                                                <button
                                                    onClick={() => { setConteudoAtivo(item); setMostrarAtividade(false); }}
                                                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                                        ativo && !mostrarAtividade 
                                                            ? 'bg-white text-blue-600 shadow-sm' 
                                                            : ativo ? 'bg-blue-700/50 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    <BookOpen size={12} /> Aula
                                                </button>

                                                {qtdQuestoes > 0 && (
                                                    <button
                                                        onClick={() => { setConteudoAtivo(item); setMostrarAtividade(true); }}
                                                        className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                                            ativo && mostrarAtividade 
                                                                ? 'bg-yellow-400 text-black shadow-sm' 
                                                                : ativo ? 'bg-blue-700/50 text-yellow-300 hover:bg-blue-700' : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-200/60'
                                                        }`}
                                                        title="Acessar exercícios desta aula"
                                                    >
                                                        <Sparkles size={12} /> Tarefas ({qtdQuestoes})
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* COLUNA DIREITA: VISUALIZADOR DA AULA / EXERCÍCIOS */}
                        <div className="lg:col-span-8 space-y-6">
                            {conteudoAtivo && (
                                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[32px] shadow-sm border border-slate-100 space-y-6 sm:space-y-8">
                                    
                                    {/* TOPO DA AULA COM STATUS E BOTÃO CONCLUIR */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                                        <div className="min-w-0">
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                                {conteudoAtivo.materia} • {conteudoAtivo.anoEscolar}
                                            </span>
                                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1 break-words">
                                                {conteudoAtivo.titulo}
                                            </h2>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={toggleConcluirAula}
                                                disabled={salvandoProgresso}
                                                className={`px-4 sm:px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md ${
                                                    isAulaAtivaConcluida
                                                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/20'
                                                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                                                }`}
                                            >
                                                <CheckCircle2 size={16} />
                                                {isAulaAtivaConcluida ? 'Aula Concluída 🎉' : 'Marcar como Concluída'}
                                            </button>

                                            {perfil === 'PROFESSOR' && (
                                                <button
                                                    onClick={() => handleExcluir(conteudoAtivo._id)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-2xl transition-colors"
                                                    title="Excluir Aula"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* NAVEGADOR PRINCIPAL DE ABAS (SEMPRE VISÍVEL) */}
                                    <div className="flex flex-col sm:flex-row bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit gap-1">
                                        <button
                                            onClick={() => setMostrarAtividade(false)}
                                            className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                !mostrarAtividade ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            <BookOpen size={14} /> Material de Estudo
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (totalQuestoesAulaAtiva === 0) {
                                                    return alert("Esta aula ainda não possui exercícios cadastrados.");
                                                }
                                                setMostrarAtividade(true);
                                            }}
                                            className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                mostrarAtividade 
                                                    ? 'bg-blue-600 text-white shadow-md' 
                                                    : totalQuestoesAulaAtiva > 0 
                                                        ? 'text-slate-600 hover:text-slate-900' 
                                                        : 'text-slate-400 opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <Sparkles size={14} className={totalQuestoesAulaAtiva > 0 ? "text-yellow-400" : ""} />
                                            Exercícios / Tarefas ({totalQuestoesAulaAtiva})
                                        </button>
                                    </div>

                                    {/* ABA 1: CONTEÚDO TEÓRICO (VÍDEOS, TEXTOS, PDFS) */}
                                    {!mostrarAtividade ? (
                                        <div className="space-y-8">
                                            {conteudoAtivo.elementos && conteudoAtivo.elementos.sort((a,b) => a.ordem - b.ordem).map((el, idx) => (
                                                <div key={idx} className="space-y-3">
                                                    {el.tipo === 'texto' && (
                                                        <div className="prose max-w-none text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-6 rounded-2xl border border-slate-100">
                                                            {el.valor}
                                                        </div>
                                                    )}

                                                    {el.tipo === 'video' && (
                                                        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-video bg-black">
                                                            <iframe
                                                                src={getYoutubeEmbed(el.valor)}
                                                                title="Videoaula"
                                                                className="w-full h-full"
                                                                allowFullScreen
                                                            ></iframe>
                                                        </div>
                                                    )}

                                                    {el.tipo === 'imagem' && (
                                                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                                            <img src={el.valor} alt="Ilustração" className="w-full object-cover max-h-[450px]" />
                                                        </div>
                                                    )}

                                                    {el.tipo === 'pdf' && (
                                                        <div className="p-4 sm:p-5 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="text-blue-600 flex-shrink-0" size={28} />
                                                                <div>
                                                                    <h5 className="font-bold text-sm text-slate-800">Material em PDF</h5>
                                                                    <p className="text-xs text-slate-500">Documento de apoio anexado pelo professor.</p>
                                                                </div>
                                                            </div>
                                                            <a 
                                                                href={el.valor} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
                                                            >
                                                                Abrir PDF <ExternalLink size={14} />
                                                            </a>
                                                        </div>
                                                    )}

                                                    {el.tipo === 'exemplo' && (
                                                        <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 rounded-3xl space-y-3 shadow-sm">
                                                            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                                                                <div className="p-2 bg-amber-200/70 text-amber-900 rounded-xl">
                                                                    <Calculator size={18} />
                                                                </div>
                                                                <span>Resolução Prática / Cálculo Passo a Passo</span>
                                                            </div>
                                                            <div className="text-slate-800 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-mono bg-white/80 p-4 sm:p-5 rounded-2xl border border-amber-200/60 shadow-inner overflow-x-auto">
                                                                {el.valor}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* BOTÃO DE OURO NO FIM DA AULA: CHAMADA PARA AS TAREFAS */}
                                            <div className="pt-10 mt-10 border-t border-slate-100 text-center space-y-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    Fim do material de estudo
                                                </p>

                                                {totalQuestoesAulaAtiva > 0 ? (
                                                    <div>
                                                        <button 
                                                            onClick={() => {
                                                                setMostrarAtividade(true);
                                                                window.scrollTo({ top: 180, behavior: 'smooth' });
                                                            }}
                                                            className="w-full sm:w-auto justify-center bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-6 sm:px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-yellow-400/20 hover:scale-105 transition-all inline-flex items-center gap-2"
                                                        >
                                                            <Sparkles size={16} /> Iniciar Prática de Questões ({totalQuestoesAulaAtiva})
                                                        </button>
                                                        <p className="text-[11px] text-slate-400 mt-2">
                                                            Teste seus conhecimentos com os exercícios fixados desta aula!
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 bg-slate-50 rounded-2xl max-w-sm mx-auto text-xs text-slate-400 font-medium">
                                                        Esta aula não possui exercícios extras cadastrados pelo professor.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* ABA 2: TAREFAS E EXERCÍCIOS DA AULA */
                                        <div className="space-y-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                                <div>
                                                    <h3 className="font-black text-slate-800 text-lg">Exercícios de Fixação</h3>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        Responda às questões para gravar seu progresso no banco de dados.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setMostrarAtividade(false)}
                                                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    <ArrowLeft size={14} /> Voltar para Aula
                                                </button>
                                            </div>

                                            {conteudoAtivo.atividades.map((ativ, aIdx) => {
                                                const atividadeId = ativ._id || ativ.id || aIdx.toString();
                                                const chave = `${conteudoAtivo._id}-${atividadeId}`;
                                                const respostaSalva = respostasUsuario[chave];

                                                return (
                                                    <div key={atividadeId} className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                                        <p className="text-sm font-bold text-slate-800">
                                                            <span className="text-blue-600">Questão {aIdx + 1}:</span> {ativ.pergunta}
                                                        </p>

                                                        {ativ.tipo === 'multipla' && ativ.opcoes && (
                                                            <div className="space-y-2">
                                                                {ativ.opcoes.map((opt, oIdx) => {
                                                                    const foiRespondida = respostaSalva !== undefined;
                                                                    const selecionada = respostaSalva?.opcao === oIdx;
                                                                    const isCorreta = ativ.respostaCorreta === oIdx;

                                                                    let estilo = "bg-white border-slate-200 text-slate-700 hover:bg-slate-100";
                                                                    if (foiRespondida) {
                                                                        if (isCorreta) estilo = "bg-green-100 border-green-300 text-green-800 font-bold";
                                                                        else if (selecionada && !isCorreta) estilo = "bg-red-100 border-red-300 text-red-800";
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={opt._id || oIdx}
                                                                            onClick={() => handleResponderQuestao(ativ, oIdx)}
                                                                            className={`w-full text-left p-4 rounded-xl border text-xs md:text-sm transition-all flex items-center justify-between ${estilo}`}
                                                                        >
                                                                            <span>{opt.texto}</span>
                                                                            {foiRespondida && isCorreta && <CheckCircle size={18} className="text-green-600" />}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {ativ.tipo === 'manual' && (
                                                            <div className="p-4 bg-blue-50/60 rounded-xl text-xs text-blue-800">
                                                                📝 <b>Questão dissertativa:</b> Responda em seu caderno e compare com os pontos destacados na aula teórica.
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>
        </Sidebar>
    );
}

export default MateriaDetalhe;