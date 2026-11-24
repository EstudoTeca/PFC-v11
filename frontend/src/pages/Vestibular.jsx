import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Sparkles, PenTool, CheckCircle2, AlertCircle, RefreshCw, Award, FileText, Lightbulb, History, TrendingUp } from 'lucide-react';

function Vestibular() {
    const usuarioId = localStorage.getItem('id');
    const [abaAtiva, setAbaAtiva] = useState('redacao'); // 'redacao', 'historico' ou 'simulado'

    // Estados da Redação
    const [tema, setTema] = useState('Desafios para a valorização da herança africana na formação cultural brasileira');
    const [textosApoio, setTextosApoio] = useState([]);
    const [redacao, setRedacao] = useState('');
    const [resultadoRedacao, setResultadoRedacao] = useState(null);
    const [carregandoRedacao, setCarregandoRedacao] = useState(false);
    const [carregandoTema, setCarregandoTema] = useState(false);

    // Estado do Histórico de Redações
    const [historicoRedacoes, setHistoricoRedacoes] = useState([]);

    // Estados do Simulado
    const [materia, setMateria] = useState('Matemática');
    const [questoes, setQuestoes] = useState([]);
    const [carregandoSimulado, setCarregandoSimulado] = useState(false);
    const [respostas, setRespostas] = useState({});

    // Carregar histórico ao iniciar
    const carregarHistorico = async () => {
        if (!usuarioId) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/historico/redacao/${usuarioId}`);
            setHistoricoRedacoes(res.data);
        } catch (err) {
            console.error("Erro ao carregar histórico de redações");
        }
    };

    useEffect(() => {
        carregarHistorico();
    }, [usuarioId]);

    // Gerar Tema + Textos de Apoio
    const handleGerarTema = async () => {
        setCarregandoTema(true);
        try {
            const res = await axios.post('http://localhost:5000/api/ia/gerar-tema-redacao');
            setTema(res.data.tema);
            setTextosApoio(res.data.textosApoio);
            setRedacao('');
            setResultadoRedacao(null);
        } catch (err) {
            alert("Erro ao gerar tema com IA.");
        } finally {
            setCarregandoTema(false);
        }
    };

    // Corrigir Redação e Salvar no Banco
    const handleCorrigirRedacao = async () => {
        if (!redacao.trim() || redacao.length < 50) {
            return alert("Por favor, escreva uma redação mais completa antes de enviar.");
        }
        setCarregandoRedacao(true);
        try {
            const res = await axios.post('http://localhost:5000/api/ia/corrigir-redacao', {
                texto: redacao,
                tema: tema
            });
            
            const resultado = res.data;
            setResultadoRedacao(resultado);

            // Salva no Histórico do Aluno via Backend
            if (usuarioId) {
                await axios.post('http://localhost:5000/api/historico/redacao', {
                    usuarioId,
                    tema,
                    texto: redacao,
                    total: resultado.total || 0,
                    c1: resultado.c1 || 0,
                    c2: resultado.c2 || 0,
                    c3: resultado.c3 || 0,
                    c4: resultado.c4 || 0,
                    c5: resultado.c5 || 0,
                    feedback: resultado.feedback || ''
                });
                carregarHistorico(); // Atualiza a lista
            }
        } catch (err) {
            alert("Erro ao corrigir a redação.");
        } finally {
            setCarregandoRedacao(false);
        }
    };

    // Gerar Simulado
    const handleGerarSimulado = async () => {
        setCarregandoSimulado(true);
        setQuestoes([]);
        setRespostas({});
        try {
            const res = await axios.post('http://localhost:5000/api/ia/gerar-simulado', { materia });
            setQuestoes(res.data);
        } catch (err) {
            alert("Erro ao gerar simulado.");
        } finally {
            setCarregandoSimulado(false);
        }
    };

    // Média geral das notas salvas
    const mediaNotas = historicoRedacoes.length > 0 
        ? Math.round(historicoRedacoes.reduce((acc, curr) => acc + curr.total, 0) / historicoRedacoes.length) 
        : 0;

    return (
        <Sidebar>
            <div className="p-2 max-w-7xl mx-auto space-y-8">
                
                {/* TOPO: ABAS */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Sparkles className="text-yellow-500 fill-yellow-400" />
                            Área Vestibular & ENEM (IA)
                        </h2>
                        <p className="text-slate-500 text-xs md:text-sm mt-1">
                            Treine redações, acompanhe sua evolução de notas e resolva simulados inéditos.
                        </p>
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl flex-wrap gap-1 w-full md:w-auto">
                        <button
                            onClick={() => setAbaAtiva('redacao')}
                            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                                abaAtiva === 'redacao' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            ✍️ Laboratório
                        </button>
                        <button
                            onClick={() => setAbaAtiva('historico')}
                            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                                abaAtiva === 'historico' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <History size={14} /> Histórico ({historicoRedacoes.length})
                        </button>
                        <button
                            onClick={() => setAbaAtiva('simulado')}
                            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                                abaAtiva === 'simulado' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            ⚡ Simulador
                        </button>
                    </div>
                </div>

                {/* ABA 1: REDAÇÃO */}
                {abaAtiva === 'redacao' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* Tema e Textos de Apoio */}
                            <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                                            <Lightbulb size={14} /> Tema Proposto
                                        </label>
                                        <input 
                                            type="text" 
                                            value={tema}
                                            onChange={(e) => setTema(e.target.value)}
                                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleGerarTema}
                                        disabled={carregandoTema}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md disabled:opacity-50"
                                    >
                                        {carregandoTema ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="text-yellow-400" />}
                                        Gerar Inédito
                                    </button>
                                </div>

                                {textosApoio.length > 0 && (
                                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl">
                                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1 mb-3">
                                            <FileText size={14} /> Textos Motivadores
                                        </h4>
                                        <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                                            {textosApoio.map((texto, idx) => (
                                                <div key={idx} className="text-xs leading-relaxed text-slate-700 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                                    <span className="font-bold text-slate-400 block mb-1">Texto {idx + 1}</span>
                                                    {texto}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bloco de Escrita */}
                            <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Escreva sua Redação</label>
                                <textarea
                                    rows="12"
                                    value={redacao}
                                    onChange={(e) => setRedacao(e.target.value)}
                                    placeholder="Digite sua proposta de redação respeitando a estrutura do ENEM..."
                                    className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-sans"
                                />

                                <button
                                    onClick={handleCorrigirRedacao}
                                    disabled={carregandoRedacao}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {carregandoRedacao ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" /> Corrigindo e Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <PenTool size={16} /> Enviar para Avaliação ENEM
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Painel de Resultados */}
                        <div className="lg:col-span-5 space-y-6">
                            {resultadoRedacao ? (
                                <div className="bg-white p-5 sm:p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-6 lg:sticky lg:top-28">
                                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Nota Final</span>
                                            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                                {resultadoRedacao.total} <span className="text-lg text-slate-400">/ 1000</span>
                                            </h3>
                                        </div>
                                        <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-600 border border-yellow-100">
                                            <Award size={32} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                                        {['c1', 'c2', 'c3', 'c4', 'c5'].map((comp, idx) => (
                                            <div key={comp} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">C{idx + 1}</span>
                                                <p className="text-sm font-black text-blue-600 mt-1">{resultadoRedacao[comp] || 0}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Feedback do Avaliador</h4>
                                        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs md:text-sm text-slate-700 leading-relaxed max-h-64 overflow-y-auto">
                                            {resultadoRedacao.feedback}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-6 sm:p-8 rounded-[28px] shadow-sm border border-slate-100 text-center py-12 sm:py-20 lg:sticky lg:top-28">
                                    <PenTool size={40} className="text-slate-300 mx-auto mb-3" />
                                    <h4 className="text-slate-700 font-bold text-sm">Nenhuma correção ativa</h4>
                                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                                        Escreva seu texto e clique em avaliar. Sua nota será salva automaticamente no seu histórico.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ABA 2: HISTÓRICO DE REDAÇÕES */}
                {abaAtiva === 'historico' && (
                    <div className="space-y-6">
                        
                        {/* Card Resumo de Média */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média das Redações</p>
                                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{mediaNotas} <span className="text-xs text-slate-400 font-normal">/ 1000 pts</span></h3>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl"><FileText size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Treinadas</p>
                                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{historicoRedacoes.length} Redações</h3>
                                </div>
                            </div>
                        </div>

                        {/* Lista do Histórico */}
                        <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-6">
                            <h3 className="font-black text-slate-800 text-lg">Suas Redações Anteriores</h3>

                            {historicoRedacoes.length === 0 ? (
                                <div className="text-center py-16 text-slate-400 text-xs">
                                    Nenhuma redação salva no histórico ainda. Escreva seu primeiro texto no Laboratório!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historicoRedacoes.map((item) => (
                                        <div key={item._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-slate-800 mt-0.5">{item.tema}</h4>
                                                </div>
                                                <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full font-black text-xs shadow-sm">
                                                    Nota: {item.total} pts
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center pt-2">
                                                <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs"><span className="text-[9px] text-slate-400 block">C1</span><b>{item.c1}</b></div>
                                                <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs"><span className="text-[9px] text-slate-400 block">C2</span><b>{item.c2}</b></div>
                                                <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs"><span className="text-[9px] text-slate-400 block">C3</span><b>{item.c3}</b></div>
                                                <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs"><span className="text-[9px] text-slate-400 block">C4</span><b>{item.c4}</b></div>
                                                <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs"><span className="text-[9px] text-slate-400 block">C5</span><b>{item.c5}</b></div>
                                            </div>

                                            <p className="text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                                                <b>Feedback:</b> {item.feedback}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* ABA 3: SIMULADO */}
                {abaAtiva === 'simulado' && (
                    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Gerador de Questões Inéditas</h3>
                                <p className="text-slate-400 text-xs">Selecione uma disciplina para gerar 3 questões padrão ENEM.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <select 
                                    value={materia} 
                                    onChange={(e) => setMateria(e.target.value)}
                                    className="w-full sm:w-auto p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                >
                                    <option value="Matemática">Matemática</option>
                                    <option value="Português">Língua Portuguesa</option>
                                    <option value="Física">Física</option>
                                    <option value="Química">Química</option>
                                    <option value="Biologia">Biologia</option>
                                    <option value="História">História</option>
                                    <option value="Geografia">Geografia</option>
                                </select>
                                <button
                                    onClick={handleGerarSimulado}
                                    disabled={carregandoSimulado}
                                    className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-transform hover:scale-105 shadow-md disabled:opacity-50"
                                >
                                    {carregandoSimulado ? "Gerando..." : "Gerar Questões"}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {questoes.length === 0 && !carregandoSimulado && (
                                <p className="text-center text-slate-400 text-xs py-10">
                                    Nenhum simulado ativo no momento. Escolha a matéria e clique em <b>Gerar Questões</b>.
                                </p>
                            )}

                            {questoes.map((q, qIndex) => (
                                <div key={qIndex} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 leading-relaxed">
                                        <span className="text-blue-600 font-black">Questão {qIndex + 1}: </span> 
                                        {q.pergunta}
                                    </h4>

                                    <div className="space-y-2">
                                        {q.opcoes.map((opcao, optIndex) => {
                                            const selecionada = respostas[qIndex] === optIndex;
                                            const respondeu = respostas[qIndex] !== undefined;
                                            const isCorreta = q.correta === optIndex;

                                            let estiloBotao = "bg-white border-slate-200 text-slate-700 hover:bg-slate-100";
                                            if (respondeu) {
                                                if (isCorreta) estiloBotao = "bg-green-100 border-green-300 text-green-800 font-bold";
                                                else if (selecionada && !isCorreta) estiloBotao = "bg-red-100 border-red-300 text-red-800";
                                            }

                                            return (
                                                <button
                                                    key={optIndex}
                                                    disabled={respondeu}
                                                    onClick={() => setRespostas({ ...respostas, [qIndex]: optIndex })}
                                                    className={`w-full text-left p-4 rounded-xl border text-xs md:text-sm transition-all flex items-center justify-between ${estiloBotao}`}
                                                >
                                                    <span>{opcao}</span>
                                                    {respondeu && isCorreta && <CheckCircle2 size={18} className="text-green-600" />}
                                                    {respondeu && selecionada && !isCorreta && <AlertCircle size={18} className="text-red-600" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {respostas[qIndex] !== undefined && (
                                        <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-700">
                                            <b>Explicação da IA:</b> {q.explicacao}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Sidebar>
    );
}

export default Vestibular;