const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
        headers: {
            'User-Agent': 'aistudio-build',
        }
    }
});

router.post('/tutor', async (req, res) => {
    const { pergunta, contextoAno } = req.body;

    try {
        const promptSistema = `
            Você é o Tutor IA da plataforma EstudoTeca. 
            Seu objetivo é ajudar alunos do Ensino Médio (1º ao 3º ano) e vestibulandos do ENEM.
            O aluno está no: ${contextoAno}.
            Regras:
            1. Seja didático e use exemplos práticos.
            2. Se o aluno pedir uma resposta de exercício, não dê apenas a resposta, explique o passo a passo.
            3. Use uma linguagem amigável, mas respeitosa.
            4. Se for algo fora do contexto escolar, tente trazer o assunto de volta para os estudos.
            
            Pergunta: ${pergunta}
        `;

        const result = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: promptSistema,
        });
        res.json({ resposta: result.text });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro na IA" });
    }
});

// ROTA PARA CORREÇÃO DE REDAÇÃO
router.post('/corrigir-redacao', async (req, res) => {
    const { texto, tema } = req.body;

    const promptRedacao = `
        Aja como um corretor oficial do ENEM. Corrija a redação abaixo com o tema: "${tema}".
        Forneça a nota de 0 a 200 para cada uma das 5 competências do ENEM:
        1. Domínio da norma culta.
        2. Compreensão do tema.
        3. Organização das informações.
        4. Mecanismos linguísticos (coesão).
        5. Proposta de intervenção.
        
        Ao final, dê um feedback geral e a nota total (0-1000).
        Responda em formato JSON estruturado: 
        { "c1": 160, "c2": 200, "c3": 120, "c4": 160, "c5": 200, "total": 840, "feedback": "..." }

        Redação:
        ${texto}
    `;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: promptRedacao,
        });
        const responseText = (result.text || '').replace(/```json|```/g, "").trim();
        res.json(JSON.parse(responseText));
    } catch (error) {
        res.status(500).json({ error: "Erro ao corrigir redação" });
    }
});

// ROTA PARA GERAR SIMULADO
router.post('/gerar-simulado', async (req, res) => {
    const { materia } = req.body;

    const promptSimulado = `
        Gere 3 questões de múltipla escolha de nível ENEM sobre: ${materia}.
        Retorne APENAS um JSON no seguinte formato:
        [
          { "pergunta": "...", "opcoes": ["A", "B", "C", "D"], "correta": 0, "explicacao": "..." }
        ]
    `;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: promptSimulado,
        });
        const responseText = (result.text || '').replace(/```json|```/g, "").trim();
        res.json(JSON.parse(responseText));
    } catch (error) {
        res.status(500).json({ error: "Erro ao gerar questões" });
    }
});

module.exports = router;