const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { GoogleGenAI } = require("@google/genai");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURAÇÃO DE UPLOADS ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limite de 10MB

// --- CONEXÃO COM MONGODB ---
mongoose.set('bufferCommands', false);
try {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/mock', {
        serverSelectionTimeoutMS: 3000,
    })
        .then(() => console.log("✅ Banco MongoDB Conectado com Sucesso!"))
        .catch(err => console.warn("⚠️ MongoDB not connected — some features may not work:", err.message));
} catch (err) {
    console.warn("⚠️ MongoDB initialization skipped:", err.message);
}

// Configuração para garantir que o _id também venha como id no frontend
const schemaOptions = { 
    timestamps: true, 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
};

// --- MODELOS DO MONGODB ---
const UsuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    perfil: { type: String, enum: ['ALUNO', 'PROFESSOR'], default: 'ALUNO' },
    ano: { type: String, default: 'Enem' },
    foto: { type: String, default: '' }, 
    ofensiva: { type: Number, default: 1 },
    ultimoAcesso: { type: Date, default: Date.now },
    pontosXP: { type: Number, default: 50 },
    conquistas: { type: [String], default: [] }
}, schemaOptions);
const Usuario = mongoose.model('Usuario', UsuarioSchema);

const OpcaoSchema = new mongoose.Schema({ texto: { type: String, required: true } });

const AtividadeSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['multipla', 'manual'], required: true },
    pergunta: { type: String, required: true },
    respostaCorreta: Number,
    opcoes: [OpcaoSchema]
});

const ElementoSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['texto', 'video', 'imagem', 'pdf', 'exemplo'], required: true },
    valor: { type: String, required: true },
    ordem: { type: Number, default: 0 }
});

const ConteudoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    materia: { type: String, required: true },
    anoEscolar: { type: String, required: true },
    isDestaque: { type: Boolean, default: false },
    temAtividade: { type: Boolean, default: false },
    dataEntrega: { type: Date }, // Para agendamento do professor
    professorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    elementos: [ElementoSchema],
    atividades: [AtividadeSchema]
}, schemaOptions);
const Conteudo = mongoose.model('Conteudo', ConteudoSchema);

// NOVO: Modelo de Metas (Cronograma Pessoal do Aluno)
const MetaSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    texto: { type: String, required: true },
    data: { type: String, required: true }, 
    concluida: { type: Boolean, default: false },
    origem: { type: String, enum: ['manual', 'ia'], default: 'manual' }
}, schemaOptions);
const Meta = mongoose.model('Meta', MetaSchema);

// --- MODELO DE PROGRESSO DO ALUNO ---
const RespostaAtividadeSchema = new mongoose.Schema({
    atividadeId: { type: String, required: true },
    opcaoEscolhida: { type: Number, required: true },
    acertou: { type: Boolean, required: true }
});

const ProgressoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    conteudoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conteudo', required: true },
    materia: { type: String, required: true },
    concluido: { type: Boolean, default: false },
    respostas: [RespostaAtividadeSchema]
}, schemaOptions);

// Garante que só exista 1 registro de progresso por aula para cada aluno
ProgressoSchema.index({ usuarioId: 1, conteudoId: 1 }, { unique: true });
const Progresso = mongoose.model('Progresso', ProgressoSchema);

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
        headers: {
            'User-Agent': 'aistudio-build',
        }
    }
});
const JWT_SECRET = process.env.JWT_SECRET || 'EstudoTeca_Elite_2026';

// --- MIDDLEWARES DE SEGURANÇA (JWT) ---

// 1. Verifica se o usuário está logado com Token válido
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Acesso negado. Token de autenticação não fornecido." });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded; // Injeta { id, perfil } na requisição
        next();
    } catch (err) {
        return res.status(401).json({ error: "Sessão expirada ou token inválido. Faça login novamente." });
    }
};

// 2. Verifica se o usuário é realmente um PROFESSOR
const requireProfessor = (req, res, next) => {
    if (req.usuario?.perfil !== 'PROFESSOR') {
        return res.status(403).json({ error: "Acesso restrito. Apenas docentes têm permissão para esta ação." });
    }
    next();
};


// --- ROTAS DE AUTENTICAÇÃO ---
// Função para verificar se o domínio do e-mail tem servidores MX reais
async function validarDominioEmail(email) {
    const dominio = email.split('@')[1];
    if (!dominio) return false;
    
    // Bloqueia domínios descartáveis comuns
    const descartaveis = ['tempmail.com', '10minutemail.com', 'mailinator.com', 'guerrillamail.com'];
    if (descartaveis.includes(dominio.toLowerCase())) return false;

    try {
        const mxRecords = await dns.resolveMx(dominio);
        return mxRecords && mxRecords.length > 0;
    } catch (e) {
        return false; // Domínio não existe ou não recebe e-mails
    }
}

app.post('/api/auth/registro', async (req, res) => {
    try {
        const { nome, email, senha, perfil, ano } = req.body;

        // 🛡️ VERIFICAÇÃO REAL DE E-MAIL VIA DNS
        const emailValido = await validarDominioEmail(email);
        if (!emailValido) {
            return res.status(400).json({ error: "O e-mail informado não é válido ou o domínio não existe." });
        }

        const hash = await bcrypt.hash(senha, 10);
        const user = await Usuario.create({ nome, email, senha: hash, perfil, ano });
        const token = jwt.sign({ id: user._id, perfil: user.perfil }, JWT_SECRET);
        
        // Cria notificação de boas-vindas para o usuário
        await Notificacao.create({
            usuarioId: user._id,
            titulo: "Bem-vindo à EstudoTeca! 🎉",
            mensagem: "Explore as disciplinas, crie seu cronograma e pratique com o Tutor IA.",
            tipo: "sistema"
        });

        res.json({ token, nome: user.nome, perfil: user.perfil, ano: user.ano, id: user._id });
    } catch (err) {
        res.status(400).json({ error: "E-mail já cadastrado ou dados inválidos." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const user = await Usuario.findOne({ email });
        if (!user || !(await bcrypt.compare(senha, user.senha))) {
            return res.status(401).json({ error: "E-mail ou senha incorretos." });
        }
        const token = jwt.sign({ id: user._id, perfil: user.perfil }, JWT_SECRET);
        res.json({ token, nome: user.nome, perfil: user.perfil, ano: user.ano, id: user._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROTAS DE NOTIFICAÇÃO ---

// Buscar notificações do usuário
app.get('/api/notificacoes/:usuarioId', authMiddleware, async (req, res) => {
    try {
        const notas = await Notificacao.find({ usuarioId: req.params.usuarioId }).sort({ createdAt: -1 }).limit(10);
        res.json(notas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Marcar como lida
app.put('/api/notificacoes/ler/:id', authMiddleware, async (req, res) => {
    try {
        await Notificacao.findByIdAndUpdate(req.params.id, { lida: true });
        res.json({ message: "Notificação lida." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROTAS DE GERENCIAMENTO DE CONTA / PERFIL ---

// 1. Buscar dados do usuário logado
app.get('/api/usuario/:id', authMiddleware, async (req, res) => {
    try {
        const user = await Usuario.findById(req.params.id).select('-senha');
        if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Atualizar Nome, Ano e Foto de Perfil
app.put('/api/usuario/:id', authMiddleware, async (req, res) => {
    try {
        const { nome, ano, foto } = req.body;
        const user = await Usuario.findByIdAndUpdate(
            req.params.id,
            { nome, ano, foto },
            { new: true }
        ).select('-senha');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Atualizar Segurança (Email e Senha com verificação da senha antiga)
app.put('/api/usuario/:id/seguranca', authMiddleware, async (req, res) => {
    try {
        const { senhaAtual, novoEmail, novaSenha } = req.body;
        const user = await Usuario.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

        // Valida se a senha atual digitada está correta
        const senhaCorreta = await bcrypt.compare(senhaAtual, user.senha);
        if (!senhaCorreta) {
            return res.status(400).json({ error: "Sua senha atual está incorreta." });
        }

        // Se quiser mudar o email, verifica se não pertence a outro usuário
        if (novoEmail && novoEmail !== user.email) {
            const emailExiste = await Usuario.findOne({ email: novoEmail });
            if (emailExiste) return res.status(400).json({ error: "Este novo e-mail já está cadastrado em outra conta." });
            user.email = novoEmail;
        }

        // Se digitou uma nova senha, criptografa ela
        if (novaSenha && novaSenha.trim() !== '') {
            user.senha = await bcrypt.hash(novaSenha, 10);
        }

        await user.save();
        res.json({ message: "Dados de segurança atualizados com sucesso!", email: user.email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Apagar conta definitivamente
app.delete('/api/usuario/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Limpa as metas do aluno e conteúdos do professor antes de apagar
        await Meta.deleteMany({ usuarioId: id });
        await Conteudo.deleteMany({ professorId: id });
        await Usuario.findByIdAndDelete(id);
        res.json({ message: "Conta excluída permanentemente." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROTAS DE UPLOAD & CONTEÚDO ---
// --- ROTA DE UPLOAD HÍBRIDA (CLOUDINARY COM FALLBACK LOCAL) ---
app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    // Se as chaves do Cloudinary estiverem no .env, faz upload direto para a Nuvem!
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        try {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'estudoteca', resource_type: 'auto' },
                (error, result) => {
                    if (error) {
                        console.error("❌ Erro no Cloudinary:", error);
                        return res.status(500).json({ error: "Falha ao enviar arquivo para a nuvem." });
                    }
                    console.log("☁️ Arquivo salvo na nuvem com sucesso:", result.secure_url);
                    return res.json({ url: result.secure_url });
                }
            );
            stream.end(req.file.buffer);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro interno no upload." });
        }
    } else {
        // Fallback local caso ainda não tenha colocado as chaves do Cloudinary no .env
        const nomeArquivo = Date.now() + path.extname(req.file.originalname);
        const caminhoCompleto = path.join(uploadDir, nomeArquivo);
        fs.writeFileSync(caminhoCompleto, req.file.buffer);
        console.log("📁 Arquivo salvo localmente em ./uploads:", nomeArquivo);
        return res.json({ url: `/uploads/${nomeArquivo}` });
    }
});
app.post('/api/conteudos/completo', authMiddleware, requireProfessor, async (req, res) => {
    try {
        const { conteudo, elementos, atividades, professorId } = req.body;

        // No MongoDB, formatamos as opções para salvar junto com a atividade, num documento só!
        const atividadesFormatadas = atividades?.map(ativ => ({
            ...ativ,
            opcoes: ativ.opcoesLista ? ativ.opcoesLista.map(txt => ({ texto: txt })) : []
        })) || [];

        const novoConteudo = new Conteudo({
            ...conteudo,
            professorId,
            temAtividade: atividades && atividades.length > 0,
            elementos: elementos || [],
            atividades: atividadesFormatadas
        });

        await novoConteudo.save();

        // Notifica todos os alunos sobre o novo material
        const alunos = await Usuario.find({ perfil: 'ALUNO' }, '_id');
        if (alunos.length > 0) {
            const notificacoesAlunos = alunos.map(aluno => ({
                usuarioId: aluno._id,
                titulo: `Nova aula: ${conteudo.materia}! 📚`,
                mensagem: `O conteúdo "${conteudo.titulo}" já está disponível para estudo.`,
                tipo: 'aula'
            }));
            await Notificacao.insertMany(notificacoesAlunos);
        }

        res.json({ message: "Conteúdo criado com sucesso!", id: novoConteudo._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROTA DE EDIÇÃO DE CONTEÚDO (APENAS O PROFESSOR DONO DA AULA) ---
app.put('/api/conteudos/:id', authMiddleware, requireProfessor, async (req, res) => {
    try {
        const { conteudo, elementos, atividades } = req.body;
        const conteudoExistente = await Conteudo.findById(req.params.id);
        
        if (!conteudoExistente) {
            return res.status(404).json({ error: "Aula não encontrada." });
        }

        // Garante que só o professor que criou possa editar
        if (conteudoExistente.professorId.toString() !== req.usuario.id) {
            return res.status(403).json({ error: "Você só pode editar aulas criadas por você." });
        }

        const atividadesFormatadas = atividades?.map(ativ => ({
            ...ativ,
            opcoes: ativ.opcoesLista ? ativ.opcoesLista.map(txt => ({ texto: txt })) : (ativ.opcoes || [])
        })) || [];

        conteudoExistente.titulo = conteudo.titulo;
        conteudoExistente.materia = conteudo.materia;
        conteudoExistente.anoEscolar = conteudo.anoEscolar;
        conteudoExistente.isDestaque = conteudo.isDestaque;
        conteudoExistente.dataEntrega = conteudo.dataEntrega ? new Date(conteudo.dataEntrega) : null;
        conteudoExistente.temAtividade = atividades && atividades.length > 0;
        conteudoExistente.elementos = elementos || [];
        conteudoExistente.atividades = atividadesFormatadas;

        await conteudoExistente.save();
        res.json({ message: "Aula atualizada com sucesso!", conteudo: conteudoExistente });
    } catch (err) {
        console.error("Erro ao atualizar aula:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- ROTA DE PESQUISA GLOBAL ---
app.get('/api/pesquisa', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') return res.json([]);

        // Busca case-insensitive no título ou na matéria usando regex do MongoDB
        const regex = new RegExp(q, 'i');
        const resultados = await Conteudo.find({
            $or: [
                { titulo: regex },
                { materia: regex }
            ]
        }).limit(6); // Retorna até 6 resultados rápidos

        res.json(resultados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NOVO: Modelo de Histórico de Redações
const RedacaoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    tema: { type: String, required: true },
    texto: { type: String, required: true },
    total: { type: Number, required: true },
    c1: Number,
    c2: Number,
    c3: Number,
    c4: Number,
    c5: Number,
    feedback: String
}, schemaOptions);
const RedacaoHistorico = mongoose.model('RedacaoHistorico', RedacaoSchema);

// --- MODELO DE NOTIFICAÇÕES ---
const NotificacaoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    titulo: { type: String, required: true },
    mensagem: { type: String, required: true },
    tipo: { type: String, enum: ['aula', 'cronograma', 'sistema'], default: 'aula' },
    lida: { type: Boolean, default: false }
}, schemaOptions);
const Notificacao = mongoose.model('Notificacao', NotificacaoSchema);

// --- ROTAS DE HISTÓRICO DE REDAÇÕES ---

// Salvar correção no histórico
app.post('/api/historico/redacao', async (req, res) => {
    try {
        const novaRedacao = await RedacaoHistorico.create(req.body);
        await registrarAtividadeGamificacao(req.body.usuarioId, 'redacao_enviada', 100, { nota: req.body.total }); // +100 XP
        res.json(novaRedacao);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Buscar histórico de redações do aluno
app.get('/api/historico/redacao/:usuarioId', async (req, res) => {
    try {
        const historico = await RedacaoHistorico.find({ usuarioId: req.params.usuarioId }).sort({ createdAt: -1 });
        res.json(historico);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/conteudos/:materia/:ano', async (req, res) => {
    try {
        const { materia, ano } = req.params;
        const filtro = {};
        
        if (materia && materia !== 'all') filtro.materia = materia;
        if (ano && ano !== 'all') filtro.anoEscolar = ano;

        // Traz o conteúdo e já ordena pelo mais recente
        const lista = await Conteudo.find(filtro).sort({ createdAt: -1 });
        res.json(lista);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/conteudos/:id', authMiddleware, requireProfessor, async (req, res) => {
    try {
        const result = await Conteudo.findByIdAndDelete(req.params.id);
        res.json({ message: result ? "Conteúdo removido com sucesso!" : "Conteúdo não encontrado." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- NOVAS ROTAS DO CRONOGRAMA ---
app.post('/api/cronograma', authMiddleware, async (req, res) => {
    try {
        const novaMeta = await Meta.create(req.body);
        res.json(novaMeta);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/cronograma/:usuarioId', authMiddleware, async (req, res) => {
    try {
        const metasAluno = await Meta.find({ usuarioId: req.params.usuarioId }).sort({ createdAt: -1 });
        // Busca conteúdos postados pelos professores que tem data de entrega
        const tarefasProfessores = await Conteudo.find({ dataEntrega: { $ne: null } }).sort({ dataEntrega: 1 });
        res.json({ metas: metasAluno, tarefasProfessor: tarefasProfessores });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/cronograma/:id', authMiddleware, async (req, res) => {
    try {
        const meta = await Meta.findById(req.params.id);
        meta.concluida = !meta.concluida;
        await meta.save();
        if (meta.concluida) {
    await registrarAtividadeGamificacao(meta.usuarioId, 'meta_concluida', 30); // +30 XP
}
        res.json(meta);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/cronograma/:id', authMiddleware, async (req, res) => {
    try {
        await Meta.findByIdAndDelete(req.params.id);
        res.json({ message: "Meta excluída." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ROTAS DE INTELIGÊNCIA ARTIFICIAL (GEMINI) ---

app.post('/api/ia/tutor', async (req, res) => {
    const { pergunta, contextoAno } = req.body;
    try {
        const prompt = `Você é o Tutor IA da EstudoTeca focado em alunos do Ensino Médio e ENEM. O aluno está na etapa: ${contextoAno || 'Geral'}. Responda com clareza, didática e passo a passo se for exercício:\n\nPergunta: ${pergunta}`;
        const result = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
        });
        res.json({ resposta: result.text });
    } catch (err) {
        console.error("❌ ERRO NO TUTOR:", err.message || err);
        res.status(500).json({ error: "Erro ao comunicar com a IA do Tutor." });
    }
});

app.post('/api/ia/corrigir-redacao', async (req, res) => {
    const { texto, tema } = req.body;
    try {
        const prompt = `
            Você é um avaliador oficial da redação do ENEM. Avalie a redação sobre o tema: "${tema}".
            Retorne ESTRITAMENTE um objeto JSON válido, SEM NENHUM TEXTO ANTES OU DEPOIS.
            Exemplo de formato obrigatório:
            {"c1": 160, "c2": 160, "c3": 140, "c4": 160, "c5": 180, "total": 800, "feedback": "Análise..."}
            
            Redação do aluno:
            ${texto}
        `;
        const result = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
        });
        let respostaRaw = result.text || '';
        const limpo = respostaRaw.replace(/```json/gi, "").replace(/```/g, "").trim();
        res.json(JSON.parse(limpo));
    } catch (err) {
        console.error("❌ ERRO NA REDAÇÃO:", err.message || err);
        res.status(500).json({ error: "Erro ao processar correção da redação." });
    }
});

app.post('/api/ia/gerar-simulado', async (req, res) => {
    const { materia } = req.body;
    try {
        const prompt = `
            Gere 3 questões inéditas de múltipla escolha no estilo ENEM para a disciplina: "${materia}".
            Retorne ESTRITAMENTE um JSON Array válido, SEM NENHUM TEXTO ANTES OU DEPOIS.
            Exemplo de formato obrigatório:
            [
              {
                "pergunta": "Enunciado...",
                "opcoes": ["A", "B", "C", "D"],
                "correta": 0,
                "explicacao": "Explicação..."
              }
            ]
        `;
        const result = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
        });
        let respostaRaw = result.text || '';
        const limpo = respostaRaw.replace(/```json/gi, "").replace(/```/g, "").trim();
        res.json(JSON.parse(limpo));
    } catch (err) {
        console.error("❌ ERRO NO SIMULADO:", err.message || err);
        res.status(500).json({ error: "Erro ao gerar questões de simulado." });
    }
});

// AQUI ESTÁ A ROTA NOVA DO TEMA:
app.post('/api/ia/gerar-tema-redacao', async (req, res) => {
    try {
        const prompt = `
            Aja como a banca do ENEM. Gere um tema atual, complexo e relevante para a redação do ENEM.
            Crie também de 2 a 3 textos motivadores (textos de apoio) curtos e informativos sobre esse tema.
            Retorne ESTRITAMENTE um objeto JSON válido, SEM NENHUM TEXTO ANTES OU DEPOIS.
            Exemplo de formato obrigatório:
            {
              "tema": "Título do tema gerado",
              "textosApoio": [
                "Texto motivador 1...",
                "Texto motivador 2..."
              ]
            }
        `;
        const result = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
        });
        let respostaRaw = result.text || '';
        const limpo = respostaRaw.replace(/```json/gi, "").replace(/```/g, "").trim();
        res.json(JSON.parse(limpo));
    } catch (err) {
        console.error("❌ ERRO NO GERADOR DE TEMA:", err.message || err);
        res.status(500).json({ error: "Erro ao gerar o tema de redação." });
    }
}); // <-- AQUI FECHA A ROTA DO TEMA

// NOVO: Gerador de Plano de Estudos IA
app.post('/api/ia/gerar-plano', async (req, res) => {
    const { horas, foco } = req.body;
    try {
        const prompt = `
            O aluno tem ${horas} horas disponíveis para estudar hoje, com foco em ${foco}.
            Gere 3 tarefas de estudo curtas e eficientes para o cronograma dele.
            Retorne ESTRITAMENTE um JSON Array válido, sem textos antes ou depois.
            Exemplo:
            [
              {"texto": "Revisar teoria de Biologia sobre Células (30 min)", "origem": "ia"},
              {"texto": "Fazer 10 exercícios de Química Orgânica (45 min)", "origem": "ia"}
            ]
        `;
        const result = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
        });
        let respostaRaw = result.text || '';
        const limpo = respostaRaw.replace(/```json/gi, "").replace(/```/g, "").trim();
        res.json(JSON.parse(limpo));
    } catch (err) {
        console.error("❌ ERRO NO PLANO IA:", err.message || err);
        res.status(500).json({ error: "Erro ao gerar plano de estudos." });
    }
}); // <-- AQUI FECHA A ROTA DO PLANO

// --- ROTAS DO DASHBOARD DINÂMICO ---

// 1. Estatísticas reais do aluno e aulas recentes
app.get('/api/dashboard/stats/:usuarioId', authMiddleware, async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const totalAulas = await Conteudo.countDocuments();
        const metasAluno = await Meta.find({ usuarioId });
        const metasConcluidas = metasAluno.filter(m => m.concluida).length;
        const aulasRecentes = await Conteudo.find().sort({ createdAt: -1 }).limit(3);

        res.json({
            totalAulas,
            totalMetas: metasAluno.length,
            metasConcluidas,
            aulasRecentes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Radar de Notícias & Dicas do ENEM (Alimentado por IA com Fallback)
app.get('/api/ia/radar-noticias', async (req, res) => {
    try {
        const prompt = `
            Gere 3 notícias ou dicas práticas e atualizadas sobre o ENEM e Vestibulares (ex: estratégias de prova, temas quentes de redação, foco em exatas).
            Retorne ESTRITAMENTE um JSON Array válido, sem textos antes ou depois:
            [
              {
                "tag": "ENEM",
                "titulo": "Estratégia TRI: Como não perder pontos em questões fáceis",
                "resumo": "Priorizar questões de nível fácil e médio garante maior coerência pedagógica na sua nota final.",
                "tempo": "Hoje"
              }
            ]
        `;
        const result = await ai.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: prompt,
        });
        let respostaRaw = result.text || '';
        const limpo = respostaRaw.replace(/```json/gi, "").replace(/```/g, "").trim();
        res.json(JSON.parse(limpo));
    } catch (err) {
        // Notícias padrão caso a internet/IA oscile
        res.json([
            { tag: "ENEM", titulo: "Estratégia TRI: Como pontuar alto nas questões fáceis", resumo: "Priorizar questões básicas e médias aumenta muito a sua nota pela coerência pedagógica.", tempo: "Hoje" },
            { tag: "REDAÇÃO", titulo: "Guia de Repertórios Socioculturais Curingas", resumo: "Veja como usar conceitos de Bauman e Habermas em múltiplos eixos temáticos.", tempo: "Destaque" },
            { tag: "ESTUDOS", titulo: "Técnica da Recuperação Ativa no Ensino Médio", resumo: "Fazer simulados frequentes retém até 50% mais conteúdo do que apenas reler resumos.", tempo: "Dica da Semana" }
        ]);
    }
});

// Modelo temporário para guardar os códigos de 6 dígitos (expira em 10 min)
const CodigoVerificacaoSchema = new mongoose.Schema({
    email: { type: String, required: true },
    codigo: { type: String, required: true },
    dadosCadastro: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } // Apaga sozinho após 10 minutos
});
const CodigoVerificacao = mongoose.model('CodigoVerificacao', CodigoVerificacaoSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
});

// 1. Solicitar código de verificação
// 1. Solicitar código de verificação real
app.post('/api/auth/solicitar-codigo', async (req, res) => {
    try {
        const { nome, email, senha, perfil, ano } = req.body;

        // Verifica se o domínio existe via DNS
        const emailValido = await validarDominioEmail(email);
        if (!emailValido) {
            return res.status(400).json({ error: "O domínio do e-mail não existe ou não pode receber mensagens." });
        }

        const jaExiste = await Usuario.findOne({ email });
        if (jaExiste) {
            return res.status(400).json({ error: "Este e-mail já está cadastrado. Faça login!" });
        }

        // Gera código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        await CodigoVerificacao.deleteMany({ email });
        await CodigoVerificacao.create({
            email,
            codigo,
            dadosCadastro: { nome, email, senha, perfil, ano }
        });

        // VERIFICAÇÃO SE AS CHAVES FORAM CONFIGURADAS
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail({
                    from: `"EstudoTeca" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: "Seu Código de Verificação - EstudoTeca 🎓",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; rounded: 16px;">
                            <h2 style="color: #1e293b; text-align: center;">Bem-vindo à EstudoTeca! 🎓</h2>
                            <p style="color: #64748b; font-size: 14px; text-align: center;">Use o código de segurança abaixo para confirmar sua conta:</p>
                            <div style="background: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                                <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #2563eb;">${codigo}</span>
                            </div>
                            <p style="color: #94a3b8; font-size: 12px; text-align: center;">Este código expira em 10 minutos. Se você não solicitou este cadastro, ignore este e-mail.</p>
                        </div>
                    `
                });
                console.log(`✅ [E-MAIL REAL ENVIADO COM SUCESSO] Para: ${email}`);
            } catch (mailErr) {
                console.error("❌ [ERRO AO ENVIAR E-MAIL VIA GMAIL]:", mailErr.message);
                return res.status(500).json({ error: "Erro ao autenticar no Gmail. Verifique a Senha de App no .env." });
            }
        } else {
            console.warn("\n⚠️ AVISO: EMAIL_USER e EMAIL_PASS não estão no .env! O envio real foi ignorado.");
            console.log(`🔑 CÓDIGO TEMPORÁRIO PARA TESTE: ${codigo} (Para: ${email})\n`);
        }

        res.json({ message: "Código gerado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao gerar código de verificação." });
    }
});
// 2. Confirmar código e criar a conta definitiva
app.post('/api/auth/confirmar-codigo', async (req, res) => {
    try {
        const { email, codigo } = req.body;

        const registro = await CodigoVerificacao.findOne({ email, codigo });
        if (!registro) {
            return res.status(400).json({ error: "Código incorreto ou expirado. Tente novamente." });
        }

        // Criptografa a senha e cria o usuário oficial no MongoDB
        const { nome, senha, perfil, ano } = registro.dadosCadastro;
        const hash = await bcrypt.hash(senha, 10);
        const user = await Usuario.create({ nome, email, senha: hash, perfil, ano });

        // Gera o token de login imediato
        const token = jwt.sign({ id: user._id, perfil: user.perfil }, JWT_SECRET);

        // Notificação de boas-vindas
        await Notificacao.create({
            usuarioId: user._id,
            titulo: "Conta Verificada com Sucesso! 🚀",
            mensagem: "Seu e-mail foi validado e sua jornada na EstudoTeca começou.",
            tipo: "sistema"
        });

        // Limpa o código temporário
        await CodigoVerificacao.deleteMany({ email });

        res.json({ token, nome: user.nome, perfil: user.perfil, ano: user.ano, id: user._id });
    } catch (err) {
        res.status(500).json({ error: "Erro ao confirmar cadastro." });
    }
});

// --- ROTAS DE PROGRESSO DO ALUNO ---

// 1. Marcar ou desmarcar aula como concluída
app.post('/api/progresso/aula', authMiddleware, async (req, res) => {
    try {
        const { usuarioId, conteudoId, materia } = req.body;
        let prog = await Progresso.findOne({ usuarioId, conteudoId });
        
        if (!prog) {
            prog = new Progresso({ usuarioId, conteudoId, materia, concluido: true, respostas: [] });
        } else {
            prog.concluido = !prog.concluido; // Alterna entre concluído e não concluído
        }
        
        await prog.save();
        res.json(prog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Salvar resposta de exercício no banco
app.post('/api/progresso/resposta', authMiddleware, async (req, res) => {
    try {
        const { usuarioId, conteudoId, materia, atividadeId, opcaoEscolhida, acertou } = req.body;
        let prog = await Progresso.findOne({ usuarioId, conteudoId });
        
        if (!prog) {
            prog = new Progresso({ usuarioId, conteudoId, materia, concluido: false, respostas: [] });
        }

        // Se já respondeu essa questão antes, atualiza com a nova resposta
        prog.respostas = prog.respostas.filter(r => r.atividadeId !== atividadeId);
        prog.respostas.push({ atividadeId, opcaoEscolhida, acertou });
        
        await prog.save();
        if (prog.concluido) {
    await registrarAtividadeGamificacao(usuarioId, 'aula_concluida', 50); // +50 XP
}
        res.json(prog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Buscar progresso do aluno para a aula aberta
app.get('/api/progresso/:usuarioId', authMiddleware, async (req, res) => {
    try {
        const progressos = await Progresso.find({ usuarioId: req.params.usuarioId });
        res.json(progressos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Resumo de progresso por matéria (para as barras em Disciplinas.jsx)
app.get('/api/progresso/resumo/:usuarioId', authMiddleware, async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const todosConteudos = await Conteudo.find({}, 'materia _id');
        const progressosConcluidos = await Progresso.find({ usuarioId, concluido: true });

        const concluidosSet = new Set(progressosConcluidos.map(p => p.conteudoId.toString()));

        const resumo = {};
        todosConteudos.forEach(c => {
            const mat = c.materia;
            if (!resumo[mat]) {
                resumo[mat] = { total: 0, concluidas: 0, percentual: 0 };
            }
            resumo[mat].total += 1;
            if (concluidosSet.has(c._id.toString())) {
                resumo[mat].concluidas += 1;
            }
        });

        // Calcula a porcentagem real de cada matéria
        Object.keys(resumo).forEach(mat => {
            const item = resumo[mat];
            item.percentual = item.total > 0 ? Math.round((item.concluidas / item.total) * 100) : 0;
        });

        res.json(resumo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MOTOR DE GAMIFICAÇÃO (OFENSIVA, XP E CONQUISTAS) ---
async function registrarAtividadeGamificacao(usuarioId, tipoAcao, pontosGanhos = 10, dadosExtras = {}) {
    try {
        const user = await Usuario.findById(usuarioId);
        if (!user) return null;

        const hoje = new Date();
        const ultimoAcesso = new Date(user.ultimoAcesso);

        // Zera as horas para comparar apenas o dia do calendário (YYYY-MM-DD)
        const dHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const dUltimo = new Date(ultimoAcesso.getFullYear(), ultimoAcesso.getMonth(), ultimoAcesso.getDate());
        const diferencaDias = Math.floor((dHoje - dUltimo) / (1000 * 60 * 60 * 24));

        if (diferencaDias === 1) {
            // Entrou no dia seguinte consecutivo! Aumenta a ofensiva
            user.ofensiva += 1;
            user.ultimoAcesso = hoje;
        } else if (diferencaDias > 1) {
            // Perdeu mais de um dia: quebrou a sequência, reseta para 1
            user.ofensiva = 1;
            user.ultimoAcesso = hoje;
        } else if (diferencaDias === 0) {
            // Mesmo dia: atualiza a hora do último acesso
            user.ultimoAcesso = hoje;
        }

        // Soma os pontos de experiência
        user.pontosXP += pontosGanhos;

        // VERIFICAÇÃO E DESBLOQUEIO DE CONQUISTAS / MEDALHAS
        const novasConquistas = new Set(user.conquistas || []);

        // 1. Conquista: Primeiro Passo (concluiu aula)
        if (tipoAcao === 'aula_concluida') {
            novasConquistas.add('primeiro_passo');
        }

        // 2. Conquista: Foco de Aço (concluiu meta)
        if (tipoAcao === 'meta_concluida') {
            novasConquistas.add('foco_de_aco');
        }

        // 3. Conquista: Mestre da Caneta (redação nota 800+)
        if (tipoAcao === 'redacao_enviada' && dadosExtras.nota >= 800) {
            novasConquistas.add('mestre_da_caneta');
        }

        // 4. Conquista: Chama Imortal (3 dias de ofensiva)
        if (user.ofensiva >= 3) {
            novasConquistas.add('chama_imortal');
        }

        user.conquistas = Array.from(novasConquistas);
        await user.save();

        return user;
    } catch (err) {
        console.error("Erro no motor de gamificação:", err);
        return null;
    }
}

// Check-in diário e busca dos dados de gamificação
app.get('/api/gamificacao/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        // Faz o check-in diário (+10 XP)
        const user = await registrarAtividadeGamificacao(usuarioId, 'checkin', 10);
        if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

        // Calcula o nível do aluno (a cada 100 XP sobe de nível)
        const nivel = Math.floor(user.pontosXP / 100) + 1;
        const progressoNivel = user.pontosXP % 100;

        res.json({
            ofensiva: user.ofensiva,
            pontosXP: user.pontosXP,
            nivel,
            progressoNivel,
            conquistas: user.conquistas || []
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROTA DE MÉTRICAS ANALÍTICAS DO PROFESSOR ---
app.get('/api/professor/metricas/:professorId', authMiddleware, requireProfessor, async (req, res) => {
    try {
        const { professorId } = req.params;
        const conteudos = await Conteudo.find({ professorId });

        if (!conteudos || conteudos.length === 0) {
            return res.json({
                totalConteudos: 0,
                totalConclusoes: 0,
                mediaAcertosTurma: 0,
                aulasDetalhadas: []
            });
        }

        const conteudoIds = conteudos.map(c => c._id);
        const todosProgressos = await Progresso.find({ conteudoId: { $in: conteudoIds } });

        let totalConclusoes = 0;
        let totalQuestoesRespondidas = 0;
        let totalAcertos = 0;

        const aulasDetalhadas = conteudos.map(c => {
            const progressosAula = todosProgressos.filter(p => p.conteudoId.toString() === c._id.toString());
            const concluidos = progressosAula.filter(p => p.concluido).length;
            totalConclusoes += concluidos;

            let questoesAula = 0;
            let acertosAula = 0;
            progressosAula.forEach(p => {
                if (p.respostas) {
                    p.respostas.forEach(r => {
                        questoesAula += 1;
                        totalQuestoesRespondidas += 1;
                        if (r.acertou) {
                            acertosAula += 1;
                            totalAcertos += 1;
                        }
                    });
                }
            });

            const taxaAcertoAula = questoesAula > 0 ? Math.round((acertosAula / questoesAula) * 100) : 0;

            return {
                _id: c._id,
                titulo: c.titulo,
                materia: c.materia,
                anoEscolar: c.anoEscolar,
                temAtividade: c.temAtividade,
                conclusoes: concluidos,
                taxaAcerto: taxaAcertoAula,
                totalRespondidas: questoesAula
            };
        });

        const mediaGeralAcertos = totalQuestoesRespondidas > 0 
            ? Math.round((totalAcertos / totalQuestoesRespondidas) * 100) 
            : 0;

        res.json({
            totalConteudos: conteudos.length,
            totalConclusoes,
            mediaAcertosTurma: mediaGeralAcertos,
            aulasDetalhadas
        });
    } catch (err) {
        console.error("Erro nas métricas do professor:", err);
        res.status(500).json({ error: err.message });
    }
});

// Serve built React frontend in production / AI Studio single-process mode
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// SPA fallback (for client-side routing)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        const indexPath = path.join(frontendDist, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    next();
});

// Fallback middleware for offline MongoDB
app.use((err, req, res, next) => {
    if (
        err.name === 'MongooseError' ||
        err.name === 'MongoNetworkError' ||
        (err.message && (err.message.includes('buffering timed out') || err.message.includes('Client must be connected')))
    ) {
        console.warn('[AI Studio] Database offline — returning mock empty response');
        if (req.method === 'GET') {
            return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
        }
        return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor EstudoTeca rodando na porta ${PORT}`));