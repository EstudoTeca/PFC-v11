import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';

function ChatFlutuante() {
    const [aberto, setAberto] = useState(false);
    const [mensagens, setMensagens] = useState([
        { texto: "Olá! Sou o Tutor IA da EstudoTeca. Como posso te ajudar nos estudos hoje?", tipo: 'tutor' }
    ]);
    const [input, setInput] = useState('');
    const [carregando, setCarregando] = useState(false);
    
    const mensagensFimRef = useRef(null);
    const contextoAno = localStorage.getItem('ano') || 'Enem';

    const rolarParaBaixo = () => {
        mensagensFimRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (aberto) {
            rolarParaBaixo();
        }
    }, [mensagens, aberto]);

    const enviarMensagem = async (e) => {
        e.preventDefault();
        if (!input.trim() || carregando) return;

        const perguntaUsuario = input;
        setInput('');
        setMensagens(prev => [...prev, { texto: perguntaUsuario, tipo: 'aluno' }]);
        setCarregando(true);

        try {
            const res = await axios.post('http://localhost:5000/api/ia/tutor', {
                pergunta: perguntaUsuario,
                contextoAno: contextoAno
            });

            setMensagens(prev => [...prev, { texto: res.data.resposta, tipo: 'tutor' }]);
        } catch (err) {
            setMensagens(prev => [...prev, { texto: "Ops! Tive um problema de conexão com a IA. Tente novamente em instantes.", tipo: 'tutor' }]);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
            
            {/* BOTÃO FLUTUANTE (CHAT FECHADO) */}
            {!aberto && (
                <button
                    onClick={() => setAberto(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3.5 sm:p-4 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center transition-transform hover:scale-110 group relative"
                    title="Tutor IA - Tire dúvidas"
                >
                    <MessageSquare size={24} className="sm:w-[26px] sm:h-[26px]" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 border-2 border-white rounded-full animate-pulse"></span>
                </button>
            )}

            {/* CAIXA DE CHAT ABERTA */}
            {aberto && (
                <div className="w-[calc(100vw-2rem)] sm:w-[380px] md:w-[400px] h-[min(520px,calc(100dvh-6rem))] bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
                    
                    {/* Header do Chat */}
                    <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-yellow-400">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                                    Tutor EstudoTeca <Sparkles size={12} className="text-yellow-400" />
                                </h3>
                                <p className="text-[10px] text-slate-300 font-medium">Pronto para explicar qualquer matéria</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAberto(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Mensagens */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                        {mensagens.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`flex items-start gap-2.5 ${msg.tipo === 'aluno' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                    msg.tipo === 'aluno' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-yellow-400'
                                }`}>
                                    {msg.tipo === 'aluno' ? <User size={14} /> : <Bot size={14} />}
                                </div>

                                <div className={`max-w-[78%] p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                                    msg.tipo === 'aluno' 
                                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10' 
                                        : 'bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-100 font-medium'
                                }`}>
                                    {msg.texto}
                                </div>
                            </div>
                        ))}
                        
                        {carregando && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-9">
                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
                                Tutor está formulando a explicação...
                            </div>
                        )}
                        <div ref={mensagensFimRef} />
                    </div>

                    {/* Input de Envio */}
                    <form onSubmit={enviarMensagem} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua dúvida (ex: Explique Bhaskara)..."
                            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-xs md:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={carregando || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-3 rounded-xl transition-all shadow-md flex items-center justify-center"
                        >
                            <Send size={16} />
                        </button>
                    </form>

                </div>
            )}
        </div>
    );
}

export default ChatFlutuante;