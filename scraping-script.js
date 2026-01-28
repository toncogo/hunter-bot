const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const readline = require('readline');

// Configurações de Busca e Filtros
const TERMOS_BUSCA = ['TI', 'INFORMATICA', 'SISTEMAS', 'COMPUTACAO', 'ANALISTA', 'PROGRAMADOR', 'DESENVOLVEDOR', 'PERITO', 'CRIMINAL', 'TECNOLOGIA', 'REDES', 'DADOS', 'INFRAESTRUTURA', 'SEGURANCA', 'SOFTWARE', 'COMPUTADOR'];
const PROIBIDOS = ['APOSTILA', 'PRIVACIDADE', 'CANCELAMENTO', 'CURSO', 'VIDEOAULA', 'FALE CONOSCO', 'HOME', 'POLITICA', 'NOTICIAS', 'ULTIMAS'];
const UFS_BRASIL = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const CARGOS_ESPECIFICOS = [
    'analista-de-sistemas', 'tecnico-de-informatica', 'perito-criminal', 
    'desenvolvedor-de-software', 'sistemas-da-informacao', 'tecnologia-da-informacao',
    'seguranca-da-informacao', 'redes', 'computador', 'computadores', 'engenheiro-de-software', 'software', 'cibersegurança'
];

async function enviarEmail(listaConcursos) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'botoncogo@gmail.com',
            pass: 'process.env.EMAIL_PASS' //
        }
    });

    // Ordenação: Itens "A definir" primeiro para destaque
    const listaOrdenada = listaConcursos.sort((a, b) => (a.prazo === 'A definir' ? -1 : 1));

    let corpoHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; width: 100%; max-width: 1100px; margin: auto; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: #1a237e; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🔍 Radar de Oportunidades Consolidado</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">TI, Perícia Criminal & Especialidades de Tecnologia</p>
            </div>
            
            <div style="padding: 25px;">
                <div style="margin-bottom: 25px; display: flex; gap: 15px;">
                    <div style="background: #fff9c4; padding: 8px 15px; border: 1px solid #fbc02d; border-radius: 6px; font-size: 13px;">⚠️ <b>Previsto / A definir</b></div>
                    <div style="background: #e8f5e9; padding: 8px 15px; border: 1px solid #4caf50; border-radius: 6px; font-size: 13px;">✅ <b>Inscrições Abertas</b></div>
                </div>

                <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                    <thead>
                        <tr style="background: #f8f9fa; text-align: left;">
                            <th style="padding: 15px; border-bottom: 3px solid #1a237e; width: 50%;">Concurso / Cargo</th>
                            <th style="padding: 15px; border-bottom: 3px solid #1a237e; text-align: center;">UF</th>
                            <th style="padding: 15px; border-bottom: 3px solid #1a237e; text-align: center;">Salário</th>
                            <th style="padding: 15px; border-bottom: 3px solid #1a237e; text-align: center;">Prazo</th>
                            <th style="padding: 15px; border-bottom: 3px solid #1a237e; text-align: center;">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listaOrdenada.map(c => {
                            const isADefinir = c.prazo.toLowerCase().includes('definir');
                            const bg = isADefinir ? '#fff9c4' : '#e8f5e9'; //
                            return `
                            <tr style="background-color: ${bg}; border-bottom: 1px solid #eee;">
                                <td style="padding: 15px; line-height: 1.4;"><b>${c.titulo}</b></td>
                                <td style="padding: 15px; text-align: center; font-weight: bold;">${c.uf}</td>
                                <td style="padding: 15px; text-align: center; white-space: nowrap;">${c.salario}</td>
                                <td style="padding: 15px; text-align: center; font-weight: bold;">${c.prazo}</td>
                                <td style="padding: 15px; text-align: center;">
                                    <a href="${c.link}" style="background: #1a237e; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: bold; display: inline-block;">VER EDITAL</a>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #555; border-radius: 0 0 12px 12px;">
                🤖 Hunter Bot 3.2 - Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString()}
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"Hunter Bot 🕵️" <botoncogo@gmail.com>',
            to: 'cogotechnologies@gmail.com',
            subject: `🚀 ${listaConcursos.length} Concursos Encontrados - ${new Date().toLocaleDateString()}`,
            html: corpoHtml
        });
        console.log("\x1b[32m%s\x1b[0m", "\n📬 E-mail enviado com sucesso! Verifique sua caixa de entrada. ✅");
    } catch (error) {
        console.log("\x1b[31m%s\x1b[0m", `❌ Erro no envio do e-mail: ${error.message}`);
    }
}

async function extrairDados(page) {
    return await page.evaluate((termos, proibidos, ufs) => {
        return Array.from(document.querySelectorAll('a')).map(a => {
            const pai = a.parentElement;
            const textoPai = pai ? pai.innerText : "";
            const titulo = a.innerText || "";
            const busca = (titulo + " " + textoPai).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

            const ehProibido = proibidos.some(p => busca.includes(p));
            const ehRelevante = termos.some(t => busca.includes(t));

            // Garante que títulos irrelevantes do topo (Notícias/Últimas) sejam removidos
            if (ehProibido || titulo.length < 15 || !ehRelevante) return null;

            const matches = textoPai.match(/\b([A-Z]{2})\b/g) || [];
            const ufFinal = matches.find(m => ufs.includes(m)) || 'Nacional';
            const salario = textoPai.match(/R\$\s?[\d\.]+(,\d{2})?/)?.[0] || 'Consultar';
            
            // Captura a data ou define como "A definir"
            const dataMatch = textoPai.match(/\d{2}\/\d{2}(\/\d{2,4})?/g);
            const data = dataMatch ? dataMatch.pop() : 'A definir';

            return { titulo: titulo.trim(), uf: ufFinal, salario, prazo: data, link: a.href };
        }).filter(item => item !== null);
    }, TERMOS_BUSCA, PROIBIDOS, UFS_BRASIL);
}

async function buscarVagas() {
    console.log("\x1b[36m%s\x1b[0m", "🤖 Iniciando Varredura Hunter Bot 3.2...");
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    let resultadosBrutos = [];

    try {
        process.stdout.write("🌐 Verificando Editais Nacionais... ");
        await page.goto('https://www.pciconcursos.com.br/concursos/', { waitUntil: 'networkidle2' });
        resultadosBrutos.push(...(await extrairDados(page)));
        console.log("OK!");

        let i = 1;
        for (const cargo of CARGOS_ESPECIFICOS) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`🔎 Varrendo Cargos Específicos: [${i}/${CARGOS_ESPECIFICOS.length}] - Analisando: ${cargo}... `);
            await page.goto(`https://www.pciconcursos.com.br/cargos/${cargo}`, { waitUntil: 'networkidle2' });
            resultadosBrutos.push(...(await extrairDados(page)));
            i++;
        }
        console.log("\n✨ Varredura finalizada com sucesso!");

        // Unificação para evitar duplicados
        const unicosMap = new Map();
        resultadosBrutos.forEach(item => { if (!unicosMap.has(item.link)) unicosMap.set(item.link, item); });
        const listaFinal = Array.from(unicosMap.values());

        if (listaFinal.length > 0) {
            console.log(`\n📊 Exibindo ${listaFinal.length} resultados unificados:`);
            console.table(listaFinal.map(u => ({ "Oportunidade": u.titulo.substring(0, 45), "UF": u.uf, "Data": u.prazo })));
            await enviarEmail(listaFinal);
        } else {
            console.log("\n⚠️  Nenhuma oportunidade relevante encontrada nos critérios atuais.");
        }
    } catch (e) {
        console.error("\n💥 Ocorreu um erro inesperado:", e.message);
    } finally {
        await browser.close();
        console.log("\x1b[33m%s\x1b[0m", "🏁 Script finalizado.");
    }
}

buscarVagas();
