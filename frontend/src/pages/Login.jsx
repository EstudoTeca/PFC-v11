import React, { useState } from 'react';
import axios from 'axios';
import { KeyRound, Mail, Lock, User, ArrowRight, CheckCircle2, RefreshCw, X } from 'lucide-react';

function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ nome: '', email: '', senha: '', perfil: 'ALUNO', ano: 'Enem' });
    const [carregando, setCarregando] = useState(false);

    // Estados do Modal de Código OTP
    const [mostrarModalCodigo, setMostrarModalCodigo] = useState(false);
    const [codigoDigitado, setCodigoDigitado] = useState('');
    const [validandoCodigo, setValidandoCodigo] = useState(false);

    const handleAcao = async (e) => {
        e.preventDefault();
        setCarregando(true);

        try {
            if (isLogin) {
                // FLUXO DE LOGIN NORMAL
                const res = await axios.post('http://localhost:5000/api/auth/login', {
                    email: formData.email,
                    senha: formData.senha
                });

                localStorage.setItem('token', res.data.token);
                localStorage.setItem('perfil', res.data.perfil);
                localStorage.setItem('nome', res.data.nome);
                localStorage.setItem('ano', res.data.ano);
                localStorage.setItem('id', res.data.id);

                window.location.href = '/dashboard';
            } else {
                // FLUXO DE CADASTRO: SOLICITA O CÓDIGO DE VERIFICAÇÃO
                await axios.post('http://localhost:5000/api/auth/solicitar-codigo', formData);
                setMostrarModalCodigo(true);
            }
        } catch (err) {
            alert(err.response?.data?.error || "Erro ao processar solicitação.");
        } finally {
            setCarregando(false);
        }
    };

    // Confirmação do Código de 6 Dígitos
    const handleConfirmarCodigo = async (e) => {
        e.preventDefault();
        if (codigoDigitado.length < 6) return alert("Digite o código completo de 6 dígitos.");

        setValidandoCodigo(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/confirmar-codigo', {
                email: formData.email,
                codigo: codigoDigitado
            });

            // Salva dados e loga automaticamente
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('perfil', res.data.perfil);
            localStorage.setItem('nome', res.data.nome);
            localStorage.setItem('ano', res.data.ano);
            localStorage.setItem('id', res.data.id);

            alert("Conta verificada e criada com sucesso! Bem-vindo(a) à EstudoTeca.");
            window.location.href = '/dashboard';
        } catch (err) {
            alert(err.response?.data?.error || "Código inválido.");
        } finally {
            setValidandoCodigo(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
            
            {/* Círculos de Fundo Decorativos */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-2xl relative z-10 border border-slate-100">
                
                {/* Cabeçalho */}
                <div className="text-center space-y-2 mb-8">
                    <div className="w-12 h-12 bg-blue-600 text-white text-2xl font-black rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
                        🎓
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                        {isLogin ? 'Insira seus dados para acessar o painel' : 'Junte-se à plataforma de estudos de elite'}
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleAcao} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Nome Completo</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Seu nome"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">E-mail</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="email" 
                                required
                                placeholder="seu@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Senha</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                placeholder="••••••••"
                                value={formData.senha}
                                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Perfil</label>
                                <select 
                                    value={formData.perfil}
                                    onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ALUNO">Aluno</option>
                                    <option value="PROFESSOR">Professor</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Ano / Foco</label>
                                <select 
                                    value={formData.ano}
                                    onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="1ano">1º Ano</option>
                                    <option value="2ano">2º Ano</option>
                                    <option value="3ano">3º Ano</option>
                                    <option value="Enem">ENEM</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={carregando}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                        {carregando ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : (
                            <>
                                {isLogin ? 'Entrar na Plataforma' : 'Continuar Cadastro'} <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                {/* Alternar Login / Cadastro */}
                <div className="text-center mt-6 pt-6 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                        {isLogin ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
                        <button 
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-bold text-blue-600 hover:underline ml-1"
                        >
                            {isLogin ? 'Cadastre-se aqui' : 'Faça login'}
                        </button>
                    </p>
                </div>
            </div>

            {/* MODAL DE CONFIRMAÇÃO DO CÓDIGO DE 6 DÍGITOS (OTP) */}
            {mostrarModalCodigo && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-200">
                        
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                            <KeyRound size={28} />
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-800">Verifique seu e-mail</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Enviamos um código de 6 dígitos para: <br />
                                <b className="text-slate-700">{formData.email}</b>
                            </p>
                        </div>

                        <form onSubmit={handleConfirmarCodigo} className="space-y-4">
                            <input 
                                type="text" 
                                maxLength={6}
                                placeholder="000000"
                                value={codigoDigitado}
                                onChange={(e) => setCodigoDigitado(e.target.value.replace(/\D/g, ''))}
                                className="w-full text-center tracking-[8px] sm:tracking-[12px] text-xl sm:text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl py-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                autoFocus
                            />

                            <button
                                type="submit"
                                disabled={validandoCodigo || codigoDigitado.length < 6}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-40"
                            >
                                {validandoCodigo ? "Confirmando..." : "Validar e Criar Conta"}
                            </button>
                        </form>

                        <button 
                            onClick={() => setMostrarModalCodigo(false)}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                        >
                            Cancelar e corrigir e-mail
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
}

export default Login;