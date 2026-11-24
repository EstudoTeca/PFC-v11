import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { 
    TrendingUp, 
    Target, 
    BookOpen, 
    Flame, 
    Sparkles, 
    Clock, 
    ChevronRight, 
    Newspaper, 
    PlayCircle, 
    CheckCircle2, 
    ArrowUpRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

function Dashboard() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const nomeUsuario = localStorage.getItem('nome') || 'Estudante';
    const usuarioId = localStorage.getItem('id');

    // ESTADOS NO LUGAR CORRETO (Dentro da função principal)
    const [stats, setStats] = useState({
        totalAulas: 0,
        totalMetas: 0,
        metasConcluidas: 0,
        aulasRecentes: []
    });

    const [gamificacao, setGamificacao] = useState({
        ofensiva: 1,
        pontosXP: 50,
        nivel: 1,
        progressoNivel: 50
    });

    const [noticias, setNoticias] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const calcularDiasEnem = () => {
        const anoAtual = new Date().getFullYear();
        const dataEnem = new Date(anoAtual, 10, 8);
        const hoje = new Date();
        const diferenca = dataEnem - hoje;
        const dias = Math.ceil(diferenca / (1000 * 60 * 60 * 24));
        return dias > 0 ? dias : 60;
    };

    useEffect(() => {
        const carregarDashboard = async () => {
            try {
                if (usuarioId) {
                    const [resStats, resGam] = await Promise.all([
                        axios.get(`http://localhost:5000/api/dashboard/stats/${usuarioId}`),
                        axios.get(`http://localhost:5000/api/gamificacao/${usuarioId}`)
                    ]);

                    setStats(resStats.data);
                    if (resGam.data) {
                        setGamificacao(resGam.data);
                    }
                }
                const resNoticias = await axios.get('http://localhost:5000/api/ia/radar-noticias');
                setNoticias(Array.isArray(resNoticias.data) ? resNoticias.data : []);
            } catch (err) {
                console.error("Erro ao carregar dados do Dashboard:", err);
            } finally {
                setCarregando(false);
            }
        };
        carregarDashboard();
    }, [usuarioId]);

    const porcentagemMetas = stats.totalMetas > 0 
        ? Math.round((stats.metasConcluidas / stats.totalMetas) * 100) 
        : 0;

    return (
        <Sidebar>
            <div className="p-2 max-w-7xl mx-auto space-y-8">
                
                {/* 1. BANNER PRINCIPAL COM CONTAGEM DO ENEM */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 md:p-10 relative overflow-hidden text-white shadow-2xl shadow-blue-950/20 border border-slate-800/80">
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
                        <div className="space-y-3 max-w-2xl">
                            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-3.5 py-1.5 rounded-full border border-yellow-400/20">
                                <Sparkles size={14} /> {t('focoEnem')}
                            </span>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight break-words">
                                {t('ola')}, {nomeUsuario}! 👋
                            </h1>
                            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                                {t('concluiuMetas')} <b>{stats.metasConcluidas} {t('de')} {stats.totalMetas}</b> {t('metasAgendadas')}
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <button 
                                    onClick={() => navigate('/disciplinas')}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-transform hover:scale-105 shadow-lg shadow-blue-600/30 text-center"
                                >
                                    {t('explorarMaterias')}
                                </button>
                                <button 
                                    onClick={() => navigate('/vestibular')}
                                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider backdrop-blur-sm transition-all border border-white/10 text-center"
                                >
                                    {t('areaVestibularIA')}
                                </button>
                            </div>
                        </div>

                        {/* Widget Contador do ENEM */}
                        <div className="bg-white/10 backdrop-blur-md p-5 sm:p-6 rounded-[24px] border border-white/15 text-center w-full lg:w-auto lg:min-w-[200px] shadow-inner">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 block mb-1">
                                {t('rumoAoEnem')}
                            </span>
                            <div className="text-4xl md:text-5xl font-black text-yellow-400 tracking-tight font-mono">
                                {calcularDiasEnem()}
                            </div>
                            <span className="text-xs text-slate-300 font-semibold mt-1 block">
                                {t('diasRestantes')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. CARDS DE ESTATÍSTICAS COM OFENSIVA E XP REAIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        label={t('metasConcluidas')} 
                        value={`${stats.metasConcluidas}/${stats.totalMetas}`} 
                        sub={`${porcentagemMetas}% ${t('concluido')}`}
                        icon={<CheckCircle2 size={24} />} 
                        corIcone="text-green-500 bg-green-50" 
                    />
                    <StatCard 
                        label={t('aulasDisponiveis')} 
                        value={stats.totalAulas.toString()} 
                        sub={t('naEstudoteca')}
                        icon={<BookOpen size={24} />} 
                        corIcone="text-blue-500 bg-blue-50" 
                    />
                    <StatCard 
                        label={t('diasSeguidos')} 
                        value={`${gamificacao.ofensiva} ${gamificacao.ofensiva === 1 ? 'Dia' : 'Dias'}`} 
                        sub={`Nível ${gamificacao.nivel} (${gamificacao.pontosXP} XP)`}
                        icon={<Flame size={24} />} 
                        corIcone="text-orange-500 bg-orange-50" 
                    />
                    <StatCard 
                        label={t('focoDaSemana')} 
                        value="Redação" 
                        sub="Nota 1000"
                        icon={<Target size={24} />} 
                        corIcone="text-purple-500 bg-purple-50" 
                    />
                </div>

                {/* 3. RADAR ENEM & AULAS RECENTES */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Radar */}
                    <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                    <Newspaper className="text-blue-600" size={20} /> {t('radarAtualidades')}
                                </h3>
                                <p className="text-slate-400 text-xs mt-0.5">{t('radarSub')}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {noticias.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-5 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-100 hover:border-blue-100 transition-all space-y-2 group"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md">
                                            {item.tag}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                            <Clock size={12} /> {item.tempo}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                        {item.titulo}
                                    </h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {item.resumo}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Aulas Recentes & Card Pomodoro */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-slate-800 text-base">{t('ultimasPublicacoes')}</h3>
                                <button 
                                    onClick={() => navigate('/disciplinas')}
                                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                    {t('verTudo')} <ChevronRight size={14} />
                                </button>
                            </div>

                            {stats.aulasRecentes.length === 0 ? (
                                <p className="text-slate-400 text-xs py-6 text-center">{t('nenhumConteudo')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.aulasRecentes.map(aula => (
                                        <div 
                                            key={aula.id || aula._id}
                                            onClick={() => navigate(`/disciplinas/${aula.materia}`)}
                                            className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between cursor-pointer transition-all border border-slate-100 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                                    <PlayCircle size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                        {aula.titulo}
                                                    </h5>
                                                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                                        {aula.materia} • {aula.anoEscolar}
                                                    </span>
                                                </div>
                                            </div>
                                            <ArrowUpRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Card Pomodoro */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 md:p-8 rounded-[28px] text-white shadow-xl flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">{t('produtividade')}</span>
                                <h4 className="text-xl font-black mt-1">{t('sessaoPomodoro')}</h4>
                                <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                                    {t('pomodoroDesc')}
                                </p>
                            </div>
                            <button 
                                onClick={() => navigate('/cronograma')}
                                className="mt-6 bg-white text-blue-700 hover:bg-blue-50 py-3 px-5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                {t('abrirCronometro')} <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </Sidebar>
    );
}

// Subcomponente puro fora da função principal (sem hooks internos)
function StatCard({ label, value, sub, icon, corIcone }) {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all min-w-0">
            <div className={`p-3.5 sm:p-4 rounded-2xl ${corIcone} flex-shrink-0`}>
                {icon}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{label}</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5 truncate">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{sub}</p>
            </div>
        </div>
    );
}

export default Dashboard;