import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Calculator, BookOpen, Atom, FlaskConical, Dna, 
    Landmark, Globe, Languages, Brain, Users, Activity, ChevronRight 
} from 'lucide-react';

const disciplinas = [
    { id: 'Matemática', nome: 'Matemática', icon: <Calculator size={32} />, corIcone: 'text-blue-600', bgIcone: 'bg-blue-100', borderHover: 'hover:border-blue-400' },
    { id: 'Português', nome: 'Língua Portuguesa', icon: <BookOpen size={32} />, corIcone: 'text-orange-600', bgIcone: 'bg-orange-100', borderHover: 'hover:border-orange-400' },
    { id: 'Física', nome: 'Física', icon: <Atom size={32} />, corIcone: 'text-purple-600', bgIcone: 'bg-purple-100', borderHover: 'hover:border-purple-400' },
    { id: 'Química', nome: 'Química', icon: <FlaskConical size={32} />, corIcone: 'text-pink-600', bgIcone: 'bg-pink-100', borderHover: 'hover:border-pink-400' },
    { id: 'Biologia', nome: 'Biologia', icon: <Dna size={32} />, corIcone: 'text-emerald-600', bgIcone: 'bg-emerald-100', borderHover: 'hover:border-emerald-400' },
    { id: 'História', nome: 'História', icon: <Landmark size={32} />, corIcone: 'text-amber-600', bgIcone: 'bg-amber-100', borderHover: 'hover:border-amber-400' },
    { id: 'Geografia', nome: 'Geografia', icon: <Globe size={32} />, corIcone: 'text-teal-600', bgIcone: 'bg-teal-100', borderHover: 'hover:border-teal-400' },
    { id: 'Inglês', nome: 'Inglês', icon: <Languages size={32} />, corIcone: 'text-red-600', bgIcone: 'bg-red-100', borderHover: 'hover:border-red-400' },
    { id: 'Filosofia', nome: 'Filosofia', icon: <Brain size={32} />, corIcone: 'text-indigo-600', bgIcone: 'bg-indigo-100', borderHover: 'hover:border-indigo-400' },
    { id: 'Sociologia', nome: 'Sociologia', icon: <Users size={32} />, corIcone: 'text-cyan-600', bgIcone: 'bg-cyan-100', borderHover: 'hover:border-cyan-400' },
    { id: 'Educação Física', nome: 'Educação Física', icon: <Activity size={32} />, corIcone: 'text-rose-600', bgIcone: 'bg-rose-100', borderHover: 'hover:border-rose-400' }
];

function Disciplinas() {
    const navigate = useNavigate();
    const usuarioId = localStorage.getItem('id');
    const [resumoProgresso, setResumoProgresso] = useState({});

    useEffect(() => {
        const carregarResumo = async () => {
            if (!usuarioId) return;
            try {
                const res = await axios.get(`http://localhost:5000/api/progresso/resumo/${usuarioId}`);
                setResumoProgresso(res.data);
            } catch (err) {
                console.error("Erro ao carregar resumo de progresso:", err);
            }
        };
        carregarResumo();
    }, [usuarioId]);

    return (
        <Sidebar>
            <div className="p-2 max-w-7xl mx-auto space-y-8">
                
                <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        Trilhas de Estudo
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm mt-1">
                        Selecione uma disciplina para acessar as videoaulas, resumos e atividades cadastradas pelos professores.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {disciplinas.map((disc) => {
                        const dadosProgresso = resumoProgresso[disc.id] || { total: 0, concluidas: 0, percentual: 0 };
                        const percentual = dadosProgresso.percentual;

                        return (
                            <div 
                                key={disc.id}
                                onClick={() => navigate(`/disciplinas/${disc.id}`)}
                                className={`bg-white p-6 rounded-[24px] border-2 border-transparent shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group ${disc.borderHover}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${disc.bgIcone} ${disc.corIcone} transition-transform group-hover:scale-110`}>
                                        {disc.icon}
                                    </div>
                                    <div className="text-slate-300 group-hover:text-slate-800 transition-colors mt-2">
                                        <ChevronRight size={24} />
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">
                                    {disc.nome}
                                </h3>

                                {/* BARRA DE PROGRESSO 100% REAL BASEADA NO BANCO */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Progresso</span>
                                        <span>{percentual}% ({dadosProgresso.concluidas}/{dadosProgresso.total})</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            style={{ width: `${percentual}%` }}
                                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </Sidebar>
    );
}

export default Disciplinas;