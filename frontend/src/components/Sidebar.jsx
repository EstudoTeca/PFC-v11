import React, { useState, useEffect, useRef } from 'react';
import { 
    LayoutDashboard, 
    BookOpen, 
    GraduationCap, 
    Target, 
    Calendar, 
    PlusCircle, 
    LogOut, 
    Search, 
    Bell, 
    Menu, 
    ChevronLeft,
    PlayCircle,
    X,
    Eye,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Check
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ChatFlutuante from './ChatFlutuante';
import { useLanguage } from '../contexts/LanguageContext';

function Sidebar({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { idioma, alternarIdioma, t } = useLanguage();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    
    // ESTADOS DE BUSCA
    const [termoBusca, setTermoBusca] = useState('');
    const [resultadosBusca, setResultadosBusca] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [mostrarPainelBusca, setMostrarPainelBusca] = useState(false);
    const searchRef = useRef(null);

    // ESTADOS DE NOTIFICAÇÕES
    const [notificacoes, setNotificacoes] = useState([]);
    const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
    const notiRef = useRef(null);

    // ♿ ESTADOS DE ACESSIBILIDADE REAL (Persistentes no LocalStorage)
    const [tamanhoFonte, setTamanhoFonte] = useState(() => {
        const salvo = localStorage.getItem('estudoteca_zoom');
        return salvo ? Number(salvo) : 100;
    });

    const [altoContraste, setAltoContraste] = useState(() => {
        return localStorage.getItem('estudoteca_contraste') === 'true';
    });

    // Efeito para aplicar o zoom na raiz HTML (faz todo o Tailwind escalar de verdade!)
    useEffect(() => {
        document.documentElement.style.fontSize = `${tamanhoFonte}%`;
        localStorage.setItem('estudoteca_zoom', tamanhoFonte);
    }, [tamanhoFonte]);

    useEffect(() => {
        localStorage.setItem('estudoteca_contraste', altoContraste);
    }, [altoContraste]);

    const aumentarFonte = () => setTamanhoFonte(prev => Math.min(prev + 10, 140)); // Até 140%
    const diminuirFonte = () => setTamanhoFonte(prev => Math.max(prev - 10, 80));  // Até 80%
    const resetarFonte = () => setTamanhoFonte(100);

    const usuarioId = localStorage.getItem('id');
    const nomeUsuario = localStorage.getItem('nome') || 'Estudante';
    const perfil = localStorage.getItem('perfil') || 'ALUNO';
    const fotoUsuario = localStorage.getItem('foto');

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: t('dashboard'), path: "/dashboard" },
        { icon: <BookOpen size={20} />, label: t('disciplinas'), path: "/disciplinas" },
        ...(perfil === 'PROFESSOR' ? [
            { icon: <PlusCircle size={20} className="text-blue-400" />, label: t('areaProf'), path: "/professor" }
        ] : []),
        { icon: <GraduationCap size={20} />, label: t('vestibular'), path: "/vestibular" },
        { icon: <Target size={20} />, label: t('praticar'), path: "/praticar" },
        { icon: <Calendar size={20} />, label: t('cronograma'), path: "/cronograma" },
    ];

    // Carregar Notificações
    const carregarNotificacoes = async () => {
        if (!usuarioId) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/notificacoes/${usuarioId}`);
            setNotificacoes(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setNotificacoes([]);
        }
    };

    useEffect(() => {
        carregarNotificacoes();
        const intervalo = setInterval(carregarNotificacoes, 30000);
        return () => clearInterval(intervalo);
    }, [usuarioId]);

    const marcarComoLida = async (idNoti) => {
        try {
            await axios.put(`http://localhost:5000/api/notificacoes/ler/${idNoti}`);
            setNotificacoes(prev => prev.map(n => n._id === idNoti ? { ...n, lida: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    // Debounce da Busca
    useEffect(() => {
        if (!termoBusca.trim()) {
            setResultadosBusca([]);
            setBuscando(false);
            return;
        }
        setBuscando(true);
        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/pesquisa?q=${encodeURIComponent(termoBusca)}`);
                setResultadosBusca(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setBuscando(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [termoBusca]);

    // Click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setMostrarPainelBusca(false);
            if (notiRef.current && !notiRef.current.contains(e.target)) setMostrarNotificacoes(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const naoLidas = Array.isArray(notificacoes) ? notificacoes.filter(n => !n.lida).length : 0;

    return (
        <div className={`flex min-h-screen font-sans overflow-x-clip ${altoContraste ? 'bg-black text-yellow-300 invert-[0.95] hue-rotate-180' : 'bg-slate-50'}`}>
            
            {/* === BACKDROP MOBILE === */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* === SIDEBAR === */}
            <aside className={`${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-72 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 shadow-2xl z-50 transition-all duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className={`p-5 flex items-center ${isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'} border-b border-slate-800/80`}>
                    {!isCollapsed ? (
                        <>
                            <h1 className="text-xl font-black flex items-center gap-2 italic tracking-tight truncate">
                                <span className="text-blue-500 not-italic text-2xl">🎓</span> EstudoTeca
                            </h1>
                            <button onClick={() => setIsCollapsed(true)} className="hidden lg:inline-flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" aria-label="Fechar menu">
                                <X size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsCollapsed(false)} className="hidden lg:inline-flex text-2xl hover:scale-110 transition-transform">🎓</button>
                            <h1 className="lg:hidden text-xl font-black flex items-center gap-2 italic tracking-tight truncate">
                                <span className="text-blue-500 not-italic text-2xl">🎓</span> EstudoTeca
                            </h1>
                            <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" aria-label="Fechar menu">
                                <X size={18} />
                            </button>
                        </>
                    )}
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
                    <p className={`${isCollapsed ? 'lg:hidden' : ''} text-slate-500 text-[10px] font-bold uppercase px-4 mb-2 tracking-widest truncate`}>{t('plataforma')}</p>

                    {menuItems.map((item) => {
                        const ativo = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                                title={isCollapsed ? item.label : undefined}
                                className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center lg:px-0 gap-3.5 px-4' : 'gap-3.5 px-4'} py-3 rounded-2xl cursor-pointer transition-all text-xs font-bold tracking-wide ${
                                    ativo ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <span className={ativo ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                                <span className={`${isCollapsed ? 'lg:hidden' : ''} truncate`}>{item.label}</span>
                            </button>
                        );
                    })}

                    {/* Controles extras no drawer mobile (< md) */}
                    <div className="md:hidden pt-4 mt-4 border-t border-slate-800/80 space-y-3 px-2">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2">Acessibilidade & Idioma</p>
                        <div className="flex items-center justify-between gap-1 bg-slate-800/80 p-1.5 rounded-xl">
                            <button onClick={diminuirFonte} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" title="Diminuir Fonte (A-)">
                                <ZoomOut size={16} />
                            </button>
                            <button onClick={resetarFonte} className="px-2 py-1 text-[11px] font-black text-slate-300 hover:bg-slate-700 rounded-md">
                                {tamanhoFonte}%
                            </button>
                            <button onClick={aumentarFonte} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" title="Aumentar Fonte (A+)">
                                <ZoomIn size={16} />
                            </button>
                            <button
                                onClick={() => setAltoContraste(!altoContraste)}
                                className={`p-2 rounded-lg transition-colors ${altoContraste ? 'bg-yellow-400 text-slate-900' : 'hover:bg-slate-700 text-slate-300'}`}
                                title={t('altoContraste')}
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
                            <button
                                onClick={() => {
                                    const select = document.querySelector('.goog-te-combo');
                                    if (select) { select.value = 'pt'; select.dispatchEvent(new Event('change')); }
                                    document.cookie = "googtrans=/pt/pt; path=/";
                                }}
                                className="py-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
                            >🇧🇷 PT</button>
                            <button
                                onClick={() => {
                                    const select = document.querySelector('.goog-te-combo');
                                    if (select) { select.value = 'es'; select.dispatchEvent(new Event('change')); }
                                    else { document.cookie = "googtrans=/pt/es; path=/"; window.location.reload(); }
                                }}
                                className="py-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
                            >🇪🇸 ES</button>
                            <button
                                onClick={() => {
                                    const select = document.querySelector('.goog-te-combo');
                                    if (select) { select.value = 'en'; select.dispatchEvent(new Event('change')); }
                                    else { document.cookie = "googtrans=/pt/en; path=/"; window.location.reload(); }
                                }}
                                className="py-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
                            >🇺🇸 EN</button>
                        </div>
                    </div>
                </nav>

                <div className="p-3 border-t border-slate-800/80">
                    <div 
                        onClick={() => { navigate('/perfil'); setMobileOpen(false); }}
                        className={`flex items-center ${isCollapsed ? 'lg:justify-center lg:p-1.5 gap-3 p-2.5' : 'gap-3 p-2.5'} rounded-2xl hover:bg-slate-800/80 cursor-pointer transition-all mb-2 group border border-transparent hover:border-slate-700/50`}
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center flex-shrink-0">
                            {fotoUsuario ? (
                                <img src={fotoUsuario} alt={nomeUsuario} className="w-full h-full object-cover" />
                            ) : (
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${nomeUsuario}`} alt="avatar" />
                            )}
                        </div>
                        <div className={`${isCollapsed ? 'lg:hidden' : ''} overflow-hidden flex-1`}>
                            <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">{nomeUsuario}</p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase truncate">
                                {perfil === 'PROFESSOR' ? `👨‍🏫 ${t('docente')}` : `🎓 ${t('estudante')}`}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => { localStorage.clear(); navigate('/'); }}
                        title={isCollapsed ? t('sair') : undefined}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all text-xs font-bold uppercase tracking-wider`}
                    >
                        <LogOut size={16} />
                        <span className={isCollapsed ? 'lg:hidden' : ''}>{t('sair')}</span>
                    </button>
                </div>
            </aside>

            {/* === CONTEÚDO PRINCIPAL === */}
            <main className={`flex-1 min-w-0 ml-0 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} min-h-screen flex flex-col transition-all duration-300 ease-in-out`}>
                
                {/* HEADER */}
                <header className="min-h-16 sm:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2 sm:gap-4">
                    
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex-shrink-0" aria-label="Abrir menu">
                            <Menu size={20} />
                        </button>
                        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:inline-flex p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex-shrink-0" aria-label="Alternar barra lateral">
                            <Menu size={20} />
                        </button>

                        {/* Barra de Pesquisa */}
                        <div className="relative flex-1 max-w-xs sm:max-w-sm md:w-80 min-w-0" ref={searchRef}>
                            <Search size={16} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                value={termoBusca}
                                onChange={(e) => { setTermoBusca(e.target.value); setMostrarPainelBusca(true); }}
                                onFocus={() => setMostrarPainelBusca(true)}
                                placeholder={t('pesquisarPlaceholder')} 
                                className="w-full bg-slate-100 border-none rounded-2xl py-2.5 pl-10 sm:pl-11 pr-9 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                            />
                            {termoBusca && (
                                <button onClick={() => { setTermoBusca(''); setResultadosBusca([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                    <X size={14} />
                                </button>
                            )}

                            {/* Dropdown de Busca */}
                            {mostrarPainelBusca && termoBusca.trim() !== '' && (
                                <div className="absolute top-full mt-2 left-0 w-full min-w-[240px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                                    <div className="max-h-64 overflow-y-auto p-2 divide-y divide-slate-50">
                                        {resultadosBusca.map(aula => (
                                            <div 
                                                key={aula._id} 
                                                onClick={() => { navigate(`/disciplinas/${aula.materia}`); setMostrarPainelBusca(false); setTermoBusca(''); }}
                                                className="p-3 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center gap-3"
                                            >
                                                <PlayCircle size={16} className="text-blue-600 flex-shrink-0" />
                                                <div className="overflow-hidden">
                                                    <h5 className="text-xs font-bold text-slate-800 truncate">{aula.titulo}</h5>
                                                    <span className="text-[10px] text-slate-400 uppercase">{aula.materia}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {resultadosBusca.length === 0 && !buscando && (
                                            <p className="p-4 text-center text-xs text-slate-400">Nenhum resultado.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACESSIBILIDADE, IDIOMA E NOTIFICAÇÕES */}
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                        
                        {/* ♿ BARRA DE ACESSIBILIDADE COM ZOOM REAL */}
                        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button 
                                onClick={diminuirFonte}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                                title="Diminuir Fonte (A-)"
                            >
                                <ZoomOut size={16} />
                            </button>

                            <button 
                                onClick={resetarFonte}
                                className="px-1.5 py-0.5 text-[10px] font-black text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors"
                                title="Restaurar tamanho padrão (100%)"
                            >
                                {tamanhoFonte}%
                            </button>

                            <button 
                                onClick={aumentarFonte}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                                title="Aumentar Fonte (A+)"
                            >
                                <ZoomIn size={16} />
                            </button>

                            <button 
                                onClick={() => setAltoContraste(!altoContraste)}
                                className={`p-1.5 rounded-lg transition-colors ml-1 ${altoContraste ? 'bg-slate-900 text-yellow-400' : 'hover:bg-white text-slate-600'}`}
                                title={t('altoContraste')}
                            >
                                <Eye size={16} />
                            </button>
                        </div>

                        {/* 🌐 Seletor de Idioma */}
                        {/* 🌐 Tradutor Global Instantâneo (100% de todo o site) */}
<div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
    <button 
        onClick={() => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                select.value = 'pt';
                select.dispatchEvent(new Event('change'));
            }
            document.cookie = "googtrans=/pt/pt; path=/";
        }}
        className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition-all active:scale-95"
        title="Traduzir todo o site para Português"
    >
        🇧🇷 PT
    </button>
    
    <button 
        onClick={() => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                select.value = 'es';
                select.dispatchEvent(new Event('change'));
            } else {
                // Caso o script ainda esteja carregando, define o cookie e recarrega
                document.cookie = "googtrans=/pt/es; path=/";
                window.location.reload();
            }
        }}
        className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition-all active:scale-95"
        title="Traduzir todo o site para Espanhol"
    >
        🇪🇸 ES
    </button>
    <button 
    onClick={() => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = 'en';
            select.dispatchEvent(new Event('change'));
        } else {
            document.cookie = "googtrans=/pt/en; path=/";
            window.location.reload();
        }
    }}
    className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition-all active:scale-95"
    title="Translate to English"
>
    🇺🇸 EN
</button>
</div>

                        {/* 🔔 Sino */}
                        <div className="relative" ref={notiRef}>
                            <button 
                                onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
                                className="text-slate-500 hover:text-slate-800 p-2.5 rounded-xl hover:bg-slate-100 transition-colors relative"
                            >
                                <Bell size={20} />
                                {naoLidas > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                        {naoLidas}
                                    </span>
                                )}
                            </button>

                            {mostrarNotificacoes && (
                                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">{t('notificacoes')}</h4>
                                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{naoLidas} novas</span>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                                        {notificacoes.length === 0 ? (
                                            <p className="p-6 text-center text-slate-400 text-xs">{t('semNotificacoes')}</p>
                                        ) : (
                                            notificacoes.map((n) => (
                                                <div key={n._id} className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 ${!n.lida ? 'bg-blue-50/30' : ''}`}>
                                                    <div>
                                                        <h5 className="text-xs font-bold text-slate-800">{n.titulo}</h5>
                                                        <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{n.mensagem}</p>
                                                    </div>
                                                    {!n.lida && (
                                                        <button 
                                                            onClick={() => marcarComoLida(n._id)}
                                                            className="text-blue-600 hover:text-blue-800 p-1"
                                                            title={t('marcarLida')}
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Perfil */}
                        <div 
                            onClick={() => navigate('/perfil')}
                            className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 cursor-pointer group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                                {fotoUsuario ? (
                                    <img src={fotoUsuario} alt={nomeUsuario} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${nomeUsuario}`} alt="avatar" />
                                )}
                            </div>
                        </div>

                    </div>
                </header>

                <div className="p-3 sm:p-6 md:p-8 flex-1 min-w-0">
                    {children}
                </div>
            </main>

            <ChatFlutuante />
        </div>
    );
}

export default Sidebar;