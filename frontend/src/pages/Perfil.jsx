import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { 
    User, 
    Shield, 
    Trash2, 
    Camera, 
    Key, 
    Mail, 
    CheckCircle2, 
    AlertTriangle, 
    RefreshCw, 
    Flame, 
    Trophy, 
    Award, 
    Zap, 
    Target 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Perfil() {
    const navigate = useNavigate();
    const usuarioId = localStorage.getItem('id');

    // Estados do Perfil
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [ano, setAno] = useState('Enem');
    const [perfil, setPerfil] = useState('ALUNO');
    const [foto, setFoto] = useState('');
    const [carregandoFoto, setCarregandoFoto] = useState(false);
    const [salvandoPerfil, setSalvandoPerfil] = useState(false);

    // Estados de Gamificação (Ofensiva, XP, Conquistas)
    const [dadosGamificacao, setDadosGamificacao] = useState({
        ofensiva: 1,
        pontosXP: 50,
        nivel: 1,
        progressoNivel: 50,
        conquistas: []
    });

    // Estados de Segurança
    const [novoEmail, setNovoEmail] = useState('');
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [salvandoSeguranca, setSalvandoSeguranca] = useState(false);

    // Carregar dados atuais do usuário e gamificação
    useEffect(() => {
        const carregarDados = async () => {
            if (!usuarioId) return;
            try {
                const [resUser, resGam] = await Promise.all([
                    axios.get(`http://localhost:5000/api/usuario/${usuarioId}`),
                    axios.get(`http://localhost:5000/api/gamificacao/${usuarioId}`)
                ]);

                setNome(resUser.data.nome || '');
                setEmail(resUser.data.email || '');
                setNovoEmail(resUser.data.email || '');
                setAno(resUser.data.ano || 'Enem');
                setPerfil(resUser.data.perfil || 'ALUNO');
                setFoto(resUser.data.foto || '');

                if (resGam.data) {
                    setDadosGamificacao(resGam.data);
                }
            } catch (err) {
                console.error("Erro ao carregar dados do perfil:", err);
            }
        };
        carregarDados();
    }, [usuarioId]);

    // Upload da Foto de Perfil
    const handleUploadFoto = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setCarregandoFoto(true);
        try {
            const res = await axios.post('http://localhost:5000/api/upload', formData);
            setFoto(res.data.url);
            
            await axios.put(`http://localhost:5000/api/usuario/${usuarioId}`, {
                nome, ano, foto: res.data.url
            });
            localStorage.setItem('foto', res.data.url);
            alert("Foto de perfil atualizada com sucesso!");
        } catch (err) {
            alert("Erro ao fazer upload da imagem.");
        } finally {
            setCarregandoFoto(false);
        }
    };

    // Salvar Dados Básicos
    const handleSalvarPerfil = async (e) => {
        e.preventDefault();
        setSalvandoPerfil(true);
        try {
            const res = await axios.put(`http://localhost:5000/api/usuario/${usuarioId}`, {
                nome, ano, foto
            });
            localStorage.setItem('nome', res.data.nome);
            localStorage.setItem('ano', res.data.ano);
            alert("Perfil atualizado com sucesso!");
        } catch (err) {
            alert("Erro ao atualizar o perfil.");
        } finally {
            setSalvandoPerfil(false);
        }
    };

    // Salvar Segurança (E-mail e Senha)
    const handleSalvarSeguranca = async (e) => {
        e.preventDefault();
        if (!senhaAtual) {
            return alert("Digite sua senha atual para confirmar as alterações.");
        }
        if (novaSenha && novaSenha !== confirmarSenha) {
            return alert("A nova senha e a confirmação não são iguais.");
        }

        setSalvandoSeguranca(true);
        try {
            await axios.put(`http://localhost:5000/api/usuario/${usuarioId}/seguranca`, {
                senhaAtual, novoEmail, novaSenha
            });
            alert("Segurança atualizada com sucesso!");
            setEmail(novoEmail);
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarSenha('');
        } catch (err) {
            alert(err.response?.data?.error || "Erro ao atualizar segurança.");
        } finally {
            setSalvandoSeguranca(false);
        }
    };

    // Excluir Conta
    const handleExcluirConta = async () => {
        const confirmacao = window.confirm("ATENÇÃO: Tem certeza de que deseja excluir sua conta permanentemente? Todo o seu progresso será apagado.");
        if (!confirmacao) return;

        const senhaConfirmacao = prompt("Por segurança, digite 'DELETAR' para confirmar:");
        if (senhaConfirmacao !== 'DELETAR') {
            return alert("Ação cancelada. A conta não foi excluída.");
        }

        try {
            await axios.delete(`http://localhost:5000/api/usuario/${usuarioId}`);
            alert("Sua conta foi excluída com sucesso.");
            localStorage.clear();
            navigate('/');
        } catch (err) {
            alert("Erro ao excluir conta.");
        }
    };

    return (
        <Sidebar>
            <div className="p-2 max-w-5xl mx-auto space-y-8">
                
                {/* CABEÇALHO */}
                <div className="bg-white p-5 sm:p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6">
                    <div className="relative group flex-shrink-0">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-100 flex items-center justify-center text-slate-400">
                            {foto ? (
                                <img src={foto} alt={nome} className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full cursor-pointer shadow-md transition-transform hover:scale-110">
                            {carregandoFoto ? <RefreshCw size={16} className="animate-spin" /> : <Camera size={16} />}
                            <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                        </label>
                    </div>

                    <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                            {perfil === 'PROFESSOR' ? 'Docente' : 'Estudante'}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-1 break-words">
                            {nome || 'Minha Conta'}
                        </h2>
                        <p className="text-slate-400 text-xs md:text-sm break-all">{email}</p>
                    </div>
                </div>

                {/* SEÇÃO GAMIFICAÇÃO: NÍVEL, XP E MEDALHAS */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 rounded-[28px] text-white shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/60 pb-6">
                        <div>
                            <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-widest">
                                <Trophy size={16} /> Carreira Acadêmica
                            </div>
                            <h3 className="text-2xl font-black mt-1">
                                Nível {dadosGamificacao.nivel} • {dadosGamificacao.pontosXP} XP
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-2xl font-black text-xs">
                            <Flame size={18} className="fill-orange-400" />
                            {dadosGamificacao.ofensiva} {dadosGamificacao.ofensiva === 1 ? 'Dia de Ofensiva' : 'Dias de Ofensiva'}
                        </div>
                    </div>

                    {/* Barra de Progresso do Nível */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400 font-semibold">
                            <span>Progresso para o Nível {dadosGamificacao.nivel + 1}</span>
                            <span>{dadosGamificacao.progressoNivel}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                            <div 
                                style={{ width: `${dadosGamificacao.progressoNivel}%` }}
                                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                            ></div>
                        </div>
                    </div>

                    {/* Grid de Medalhas */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                            <Award size={14} /> Medalhas Desbloqueáveis
                        </h4>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { id: 'primeiro_passo', nome: 'Primeiro Passo', desc: 'Concluiu a 1ª aula', icon: <Zap size={20} /> },
                                { id: 'foco_de_aco', nome: 'Foco de Aço', desc: 'Bateu meta no cronograma', icon: <Target size={20} /> },
                                { id: 'mestre_da_caneta', nome: 'Mestre da Caneta', desc: 'Redação nota 800+', icon: <Award size={20} /> },
                                { id: 'chama_imortal', nome: 'Chama Imortal', desc: '3 dias de ofensiva seguidos', icon: <Flame size={20} /> }
                            ].map(badge => {
                                const desbloqueada = Array.isArray(dadosGamificacao.conquistas) && dadosGamificacao.conquistas.includes(badge.id);

                                return (
                                    <div 
                                        key={badge.id}
                                        className={`p-3 sm:p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-2 ${
                                            desbloqueada 
                                                ? 'bg-white/10 border-yellow-400/40 text-white shadow-lg' 
                                                : 'bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-50 grayscale'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${desbloqueada ? 'bg-yellow-400 text-slate-900 shadow-md shadow-yellow-400/30' : 'bg-slate-700 text-slate-400'}`}>
                                            {badge.icon}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black leading-snug">{badge.nome}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{badge.desc}</p>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${desbloqueada ? 'bg-yellow-400/20 text-yellow-300' : 'bg-slate-700 text-slate-400'}`}>
                                            {desbloqueada ? 'Desbloqueada' : 'Bloqueada'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SEÇÃO 1: DADOS BÁSICOS */}
                <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-6">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                        <User className="text-blue-600" size={20} /> Informações Básicas
                    </h3>

                    <form onSubmit={handleSalvarPerfil} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nome Completo</label>
                            <input 
                                type="text" 
                                value={nome} 
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {perfil === 'ALUNO' && (
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Etapa Escolar / Foco</label>
                                <select 
                                    value={ano} 
                                    onChange={(e) => setAno(e.target.value)}
                                    className="w-full mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="1ano">1º Ano do Ensino Médio</option>
                                    <option value="2ano">2º Ano do Ensino Médio</option>
                                    <option value="3ano">3º Ano do Ensino Médio</option>
                                    <option value="Enem">Foco Exclusivo ENEM & Vestibulares</option>
                                </select>
                            </div>
                        )}

                        <div className="md:col-span-2 pt-2">
                            <button 
                                type="submit" 
                                disabled={salvandoPerfil}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
                            >
                                {salvandoPerfil ? "Salvando..." : "Salvar Alterações"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* SEÇÃO 2: SEGURANÇA E ACESSO */}
                <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-slate-100 space-y-6">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                        <Shield className="text-yellow-500" size={20} /> Segurança & Acesso
                    </h3>

                    <form onSubmit={handleSalvarSeguranca} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Mail size={14} /> E-mail da Conta
                            </label>
                            <input 
                                type="email" 
                                value={novoEmail} 
                                onChange={(e) => setNovoEmail(e.target.value)}
                                className="w-full mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                    <Key size={14} /> Nova Senha (Opcional)
                                </label>
                                <input 
                                    type="password" 
                                    value={novaSenha} 
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    placeholder="Deixe em branco para não alterar"
                                    className="w-full mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirmar Nova Senha</label>
                                <input 
                                    type="password" 
                                    value={confirmarSenha} 
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    placeholder="Repita a nova senha"
                                    className="w-full mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50/70 border border-yellow-200 rounded-2xl space-y-2 mt-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-yellow-800 block">
                                Senha Atual (Obrigatória para confirmar alterações de segurança)
                            </label>
                            <input 
                                type="password" 
                                value={senhaAtual} 
                                onChange={(e) => setSenhaAtual(e.target.value)}
                                placeholder="Digite sua senha atual"
                                className="w-full p-3 bg-white border border-yellow-300 rounded-xl text-sm outline-none text-slate-800"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={salvandoSeguranca}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
                        >
                            {salvandoSeguranca ? "Atualizando..." : "Atualizar Segurança"}
                        </button>
                    </form>
                </div>

                {/* SEÇÃO 3: ZONA DE PERIGO */}
                <div className="bg-red-50/60 p-6 md:p-8 rounded-[28px] border border-red-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h4 className="font-bold text-red-900 text-base flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-600" /> Zona de Perigo
                        </h4>
                        <p className="text-xs text-red-700 mt-1 max-w-xl">
                            Ao excluir sua conta, todo o seu progresso, medalhas e acessos serão apagados para sempre.
                        </p>
                    </div>
                    <button 
                        onClick={handleExcluirConta}
                        className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                    >
                        <Trash2 size={16} /> Excluir Minha Conta
                    </button>
                </div>

            </div>
        </Sidebar>
    );
}

export default Perfil;