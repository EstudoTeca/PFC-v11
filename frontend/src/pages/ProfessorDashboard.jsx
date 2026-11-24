import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { 
    Plus, 
    Trash2, 
    Video, 
    FileText, 
    Image as ImageIcon, 
    Type, 
    Send, 
    Users, 
    TrendingUp, 
    BookOpen, 
    UploadCloud,
    Calendar,
    ChevronUp,
    ChevronDown,
    Edit3,
    Calculator,
    X,
    CheckCircle2
} from 'lucide-react';

function ProfessorDashboard() {
    const professorId = localStorage.getItem('id');
    const professorNome = localStorage.getItem('nome') || 'Docente';

    const [loading, setLoading] = useState(false);
    
    // MODO EDIÇÃO: guarda o ID da aula se estiver editando, ou null se for aula nova
    const [editingId, setEditingId] = useState(null);

    // MÉTRICAS DO PROFESSOR
    const [metricas, setMetricas] = useState({
        totalConteudos: 0,
        totalConclusoes: 0,
        mediaAcertosTurma: 0,
        aulasDetalhadas: []
    });

    // 1. DADOS BASE DA AULA
    const [infoBase, setInfoBase] = useState({
        titulo: '',
        materia: 'Matemática',
        anoEscolar: '1ano',
        isDestaque: false,
        dataEntrega: ''
    });

    // 2. BLOCOS (VÍDEO, TEXTO, PDF, EXEMPLO DE CÁLCULO)
    const [elementos, setElementos] = useState([]);

    // 3. QUESTÕES (PADRÃO ENEM COM 5 ALTERNATIVAS)
    const [atividades, setAtividades] = useState([]);

    const carregarMetricas = async () => {
        if (!professorId) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/professor/metricas/${professorId}`);
            setMetricas(res.data);
        } catch (err) {
            console.error("Erro ao buscar métricas:", err);
        }
    };

    useEffect(() => {
        carregarMetricas();
    }, [professorId]);

    // INICIAR EDIÇÃO DE UMA AULA EXISTENTE
    const iniciarEdicao = (aula) => {
        setEditingId(aula._id);
        setInfoBase({
            titulo: aula.titulo,
            materia: aula.materia,
            anoEscolar: aula.anoEscolar,
            isDestaque: aula.isDestaque || false,
            dataEntrega: aula.dataEntrega ? aula.dataEntrega.split('T')[0] : ''
        });

        // Converte os blocos
        setElementos(aula.elementos ? [...aula.elementos] : []);

        // Converte as questões para edição
        const questoesFormatadas = (aula.atividades || []).map(a => ({
            tipo: a.tipo || 'multipla',
            pergunta: a.pergunta || '',
            respostaCorreta: a.respostaCorreta || 0,
            opcoesLista: a.opcoes ? a.opcoes.map(o => o.texto) : ['', '', '', '', '']
        }));
        setAtividades(questoesFormatadas);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarEdicao = () => {
        setEditingId(null);
        setInfoBase({ titulo: '', materia: 'Matemática', anoEscolar: '1ano', isDestaque: false, dataEntrega: '' });
        setElementos([]);
        setAtividades([]);
    };

    // REORDENAR BLOCOS (SUBIR / DESCER)
    const moverBloco = (index, direcao) => {
        const novos = [...elementos];
        const novoIndex = index + direcao;
        if (novoIndex < 0 || novoIndex >= novos.length) return;
        const temp = novos[index];
        novos[index] = novos[novoIndex];
        novos[novoIndex] = temp;
        setElementos(novos);
    };

    // Adicionar / Remover Blocos
    const addBloco = (tipo) => {
        setElementos([...elementos, { tipo, valor: '' }]);
    };

    const removeBloco = (idx) => {
        setElementos(elementos.filter((_, i) => i !== idx));
    };

    // Upload de Arquivos na Nuvem (Cloudinary)
    const handleFileUpload = async (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('http://localhost:5000/api/upload', formData);
            const novos = [...elementos];
            novos[index].valor = res.data.url;
            setElementos(novos);
            alert("Arquivo carregado com sucesso na nuvem!");
        } catch (err) {
            alert("Erro no upload do arquivo.");
        }
    };

    // Adicionar Questão no Padrão ENEM (5 Alternativas)
    const addQuestao = () => {
        setAtividades([...atividades, {
            tipo: 'multipla',
            pergunta: '',
            opcoesLista: ['', '', '', '', ''], // A, B, C, D, E por padrão
            respostaCorreta: 0
        }]);
    };

    const removeQuestao = (idx) => {
        setAtividades(atividades.filter((_, i) => i !== idx));
    };

    // Adicionar / Remover alternativa individualmente
    const addAlternativa = (qIdx) => {
        const n = [...atividades];
        n[qIdx].opcoesLista.push('');
        setAtividades(n);
    };

    const removeAlternativa = (qIdx, oIdx) => {
        const n = [...atividades];
        if (n[qIdx].opcoesLista.length <= 2) return alert("A questão precisa de pelo menos 2 alternativas.");
        n[qIdx].opcoesLista.splice(oIdx, 1);
        if (n[qIdx].respostaCorreta >= n[qIdx].opcoesLista.length) {
            n[qIdx].respostaCorreta = 0;
        }
        setAtividades(n);
    };

    // PUBLICAR (CRIAR NOVA OU SALVAR EDIÇÃO)
    const handleSalvar = async () => {
        if (!infoBase.titulo.trim()) return alert("Por favor, dê um título à sua aula.");
        if (elementos.length === 0) return alert("Adicione pelo menos um bloco de conteúdo (texto, vídeo, cálculo ou PDF).");

        setLoading(true);
        try {
            if (editingId) {
                // Modo Edição (PUT)
                await axios.put(`http://localhost:5000/api/conteudos/${editingId}`, {
                    conteudo: infoBase,
                    elementos,
                    atividades
                });
                alert("Aula atualizada com sucesso!");
            } else {
                // Modo Criação (POST)
                await axios.post('http://localhost:5000/api/conteudos/completo', {
                    conteudo: infoBase,
                    elementos,
                    atividades,
                    professorId
                });
                alert("Aula publicada com sucesso na EstudoTeca!");
            }

            cancelarEdicao();
            carregarMetricas();
        } catch (err) {
            alert(err.response?.data?.error || "Erro ao salvar material.");
        } finally {
            setLoading(false);
        }
    };

    const handleExcluir = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir esta aula? Todo o histórico de progresso dos alunos nesta aula será apagado.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/conteudos/${id}`);
            carregarMetricas();
            if (editingId === id) cancelarEdicao();
        } catch (err) {
            alert("Erro ao excluir aula.");
        }
    };

    return (
        <Sidebar>
            <div className="p-2 max-w-7xl mx-auto space-y-8">
                
                {/* CABEÇALHO */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                Painel de Gestão Docente
                            </span>
                            {editingId && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                                    <Edit3 size={10} /> Editando Aula
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-1">
                            Olá, Prof. {professorNome}! 👨‍🏫
                        </h2>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Monte aulas teóricas, resoluções de cálculos passo a passo e exercícios para seus alunos.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {editingId && (
                            <button
                                onClick={cancelarEdicao}
                                className="flex-1 sm:flex-none justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                            >
                                <X size={16} /> Cancelar
                            </button>
                        )}
                        <button
                            onClick={handleSalvar}
                            disabled={loading}
                            className={`flex-1 sm:flex-none justify-center ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50`}
                        >
                            <Send size={16} /> {loading ? "Salvando..." : editingId ? "Salvar Alterações" : "Publicar Aula"}
                        </button>
                    </div>
                </div>

                {/* 1. CARDS DE MÉTRICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aulas Publicadas</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{metricas.totalConteudos}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alunos Concluíram</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{metricas.totalConclusoes}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Acertos da Turma</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{metricas.mediaAcertosTurma}%</h3>
                        </div>
                    </div>
                </div>

                {/* 2. CONSTRUTOR */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* COLUNA ESQUERDA: CONFIGURAÇÃO + LISTA COM BOTÃO EDITAR */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        <div className="bg-white p-6 md:p-7 rounded-[28px] shadow-sm border border-slate-100 space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Plus size={16} className="text-blue-600" /> Configuração Geral
                            </h4>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Aula</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Equações de 2º Grau & Bhaskara"
                                    value={infoBase.titulo}
                                    onChange={(e) => setInfoBase({ ...infoBase, titulo: e.target.value })}
                                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Disciplina</label>
                                    <select 
                                        value={infoBase.materia}
                                        onChange={(e) => setInfoBase({ ...infoBase, materia: e.target.value })}
                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Matemática">Matemática</option>
                                        <option value="Português">Português</option>
                                        <option value="Física">Física</option>
                                        <option value="Química">Química</option>
                                        <option value="Biologia">Biologia</option>
                                        <option value="História">História</option>
                                        <option value="Geografia">Geografia</option>
                                        <option value="Inglês">Inglês</option>
                                        <option value="Filosofia">Filosofia</option>
                                        <option value="Sociologia">Sociologia</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Série / Etapa</label>
                                    <select 
                                        value={infoBase.anoEscolar}
                                        onChange={(e) => setInfoBase({ ...infoBase, anoEscolar: e.target.value })}
                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="1ano">1º Ano</option>
                                        <option value="2ano">2º Ano</option>
                                        <option value="3ano">3º Ano</option>
                                        <option value="Enem">ENEM</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <Calendar size={12} /> Prazo / Cronograma (Opcional)
                                </label>
                                <input 
                                    type="date"
                                    value={infoBase.dataEntrega}
                                    onChange={(e) => setInfoBase({ ...infoBase, dataEntrega: e.target.value })}
                                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                                />
                            </div>

                            <label className="flex items-center gap-2 pt-1 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={infoBase.isDestaque}
                                    onChange={(e) => setInfoBase({ ...infoBase, isDestaque: e.target.checked })}
                                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                <span className="text-xs font-bold text-slate-600">Destacar aula no início</span>
                            </label>
                        </div>

                        {/* Publicações com Botão de EDITAR e EXCLUIR */}
                        <div className="bg-white p-6 md:p-7 rounded-[28px] shadow-sm border border-slate-100 space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                                Suas Publicações ({metricas.aulasDetalhadas.length})
                            </h4>

                            {metricas.aulasDetalhadas.length === 0 ? (
                                <p className="text-slate-400 text-xs py-4 text-center">Nenhuma publicação cadastrada ainda.</p>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                    {metricas.aulasDetalhadas.map((aula) => (
                                        <div 
                                            key={aula._id} 
                                            className={`p-4 rounded-2xl border transition-all space-y-2 ${
                                                editingId === aula._id ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-100'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md uppercase">
                                                        {aula.materia} • {aula.anoEscolar}
                                                    </span>
                                                    <h5 className="font-bold text-xs text-slate-800 mt-1 line-clamp-1">{aula.titulo}</h5>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {/* BOTÃO DE EDITAR */}
                                                    <button 
                                                        onClick={() => iniciarEdicao(aula)} 
                                                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-white transition-colors"
                                                        title="Editar Aula"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleExcluir(aula._id)} 
                                                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-white transition-colors"
                                                        title="Excluir Aula"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-[10px] font-bold text-slate-500">
                                                <span className="text-green-600">{aula.conclusoes} concluíram</span>
                                                <span>{aula.taxaAcerto}% acertos</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUNA DIREITA: BLOCOS + SETAS DE REORDENAR + EXEMPLO DE CÁLCULO */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* CONSTRUTOR DE BLOCOS */}
                        <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                                        Conteúdo Teórico & Prático ({elementos.length} blocos)
                                    </h4>
                                    <p className="text-slate-400 text-xs mt-0.5">Use as setas para organizar a ordem dos blocos.</p>
                                </div>

                                <div className="flex gap-1.5 flex-wrap">
                                    <button onClick={() => addBloco('texto')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1">
                                        <Type size={14} /> + Teoria
                                    </button>

                                    {/* 🔢 NOVO BLOCO DE EXEMPLO PRÁTICO / CÁLCULO */}
                                    <button onClick={() => addBloco('exemplo')} className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 border border-amber-200">
                                        <Calculator size={14} /> + Exemplo de Cálculo
                                    </button>

                                    <button onClick={() => addBloco('video')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1">
                                        <Video size={14} /> + Vídeo YouTube
                                    </button>
                                    <button onClick={() => addBloco('pdf')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1">
                                        <FileText size={14} /> + PDF
                                    </button>
                                </div>
                            </div>

                            {/* LISTA DE BLOCOS COM REORDENAÇÃO (▲ / ▼) */}
                            <div className="space-y-4">
                                {elementos.length === 0 && (
                                    <p className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                                        Nenhum bloco adicionado. Escolha entre Teoria, Cálculo Prático, Vídeo ou PDF acima.
                                    </p>
                                )}

                                {elementos.map((el, idx) => (
                                    <div key={idx} className={`p-4 rounded-2xl border space-y-3 ${el.tipo === 'exemplo' ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                                        
                                        {/* Barra de Ações do Bloco (Subir, Descer e Excluir) */}
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                            <span className="uppercase text-[10px] font-black tracking-wider flex items-center gap-1">
                                                {el.tipo === 'exemplo' ? <Calculator size={14} className="text-amber-600" /> : null}
                                                Bloco {idx + 1}: {el.tipo === 'exemplo' ? 'Exemplo Prático de Cálculo' : el.tipo}
                                            </span>

                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => moverBloco(idx, -1)} 
                                                    disabled={idx === 0}
                                                    className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-800 disabled:opacity-30"
                                                    title="Mover para cima"
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => moverBloco(idx, 1)} 
                                                    disabled={idx === elementos.length - 1}
                                                    className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-800 disabled:opacity-30"
                                                    title="Mover para baixo"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                                <button onClick={() => removeBloco(idx)} className="p-1 text-slate-300 hover:text-red-500 ml-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Bloco de Teoria */}
                                        {el.tipo === 'texto' && (
                                            <textarea 
                                                rows="4" 
                                                placeholder="Escreva a explicação teórica, conceitos e definições..."
                                                value={el.valor}
                                                onChange={(e) => {
                                                    const n = [...elementos];
                                                    n[idx].valor = e.target.value;
                                                    setElementos(n);
                                                }}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                                            />
                                        )}

                                        {/* 🔢 Bloco de Exemplo Prático de Cálculo */}
                                        {el.tipo === 'exemplo' && (
                                            <div>
                                                <p className="text-[10px] text-amber-800 font-semibold mb-1">
                                                    💡 Dica: Mostre o passo a passo da conta ou resolução da fórmula.
                                                </p>
                                                <textarea 
                                                    rows="4" 
                                                    placeholder={`Passo 1: Identificar os coeficientes a=1, b=-5, c=6\nPasso 2: Δ = b² - 4ac = 25 - 24 = 1\nPasso 3: x = (5 ± √1)/2 => x1 = 3 e x2 = 2`}
                                                    value={el.valor}
                                                    onChange={(e) => {
                                                        const n = [...elementos];
                                                        n[idx].valor = e.target.value;
                                                        setElementos(n);
                                                    }}
                                                    className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                                                />
                                            </div>
                                        )}

                                        {el.tipo === 'video' && (
                                            <input 
                                                type="text" 
                                                placeholder="Cole o link do YouTube (qualquer formato: youtu.be ou youtube.com)"
                                                value={el.valor}
                                                onChange={(e) => {
                                                    const n = [...elementos];
                                                    n[idx].valor = e.target.value;
                                                    setElementos(n);
                                                }}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        )}

                                        {(el.tipo === 'imagem' || el.tipo === 'pdf') && (
                                            <div className="p-4 bg-white border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                                                <UploadCloud size={24} className="text-slate-400 mx-auto" />
                                                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold inline-block">
                                                    {el.valor ? "Trocar Arquivo" : `Selecionar ${el.tipo.toUpperCase()}`}
                                                    <input type="file" accept={el.tipo === 'imagem' ? "image/*" : ".pdf"} onChange={(e) => handleFileUpload(e, idx)} className="hidden" />
                                                </label>
                                                {el.valor && <p className="text-[10px] text-green-600 font-bold truncate">Arquivo salvo na nuvem!</p>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* EXERCÍCIOS COM 5 ALTERNATIVAS PADRÃO ENEM (A, B, C, D, E) */}
                        <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                                        Exercícios de Fixação ({atividades.length})
                                    </h4>
                                    <p className="text-slate-400 text-xs mt-0.5">Padrão ENEM com 5 alternativas (A, B, C, D, E).</p>
                                </div>

                                <button onClick={addQuestao} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-1">
                                    <Plus size={14} /> + Questão ENEM
                                </button>
                            </div>

                            <div className="space-y-6">
                                {atividades.length === 0 && (
                                    <p className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                                        Nenhuma questão adicionada a esta aula.
                                    </p>
                                )}

                                {atividades.map((ativ, qIdx) => (
                                    <div key={qIdx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-blue-600 uppercase">Questão {qIdx + 1}</span>
                                            <button onClick={() => removeQuestao(qIdx)} className="text-slate-300 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <input 
                                            type="text" 
                                            placeholder="Digite o enunciado da questão..."
                                            value={ativ.pergunta}
                                            onChange={(e) => {
                                                const n = [...atividades];
                                                n[qIdx].pergunta = e.target.value;
                                                setAtividades(n);
                                            }}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        />

                                        {/* Alternativas A, B, C, D, E */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                                                <span>Alternativas (Marque a correta no círculo):</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => addAlternativa(qIdx)}
                                                    className="text-blue-600 hover:underline flex items-center gap-0.5"
                                                >
                                                    <Plus size={12} /> Adicionar Opção
                                                </button>
                                            </div>

                                            {ativ.opcoesLista?.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                                                    <input 
                                                        type="radio" 
                                                        name={`correta-${qIdx}`}
                                                        checked={ativ.respostaCorreta === oIdx}
                                                        onChange={() => {
                                                            const n = [...atividades];
                                                            n[qIdx].respostaCorreta = oIdx;
                                                            setAtividades(n);
                                                        }}
                                                        className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer"
                                                        title="Marcar como alternativa correta"
                                                    />
                                                    <span className="text-xs font-black text-slate-400 w-5">
                                                        {String.fromCharCode(65 + oIdx)})
                                                    </span>
                                                    <input 
                                                        type="text" 
                                                        placeholder={`Texto da alternativa ${String.fromCharCode(65 + oIdx)}...`}
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const n = [...atividades];
                                                            n[qIdx].opcoesLista[oIdx] = e.target.value;
                                                            setAtividades(n);
                                                        }}
                                                        className="flex-1 min-w-0 text-xs outline-none text-slate-800"
                                                    />
                                                    {ativ.opcoesLista.length > 2 && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeAlternativa(qIdx, oIdx)}
                                                            className="text-slate-300 hover:text-red-500 p-1"
                                                            title="Remover opção"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </Sidebar>
    );
}

export default ProfessorDashboard;