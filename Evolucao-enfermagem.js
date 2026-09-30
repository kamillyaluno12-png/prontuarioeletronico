// =========================================================
// 1. ELEMENTOS DA TELA E CHAVES DO LOCALSTORAGE
// =========================================================
const formulario = document.getElementById("formEvolucao");
const campoPaciente = document.getElementById("paciente");
const campoObservacao = document.getElementById("observacao");
const campoData = document.getElementById("dataEvolucao");
const mensagem = document.getElementById("mensagem");

const avisoSemPacientes = document.getElementById("avisoSemPacientes");
const dadosPaciente = document.getElementById("dadosPaciente");
const infoNome = document.getElementById("infoNome");
const infoId = document.getElementById("infoId");
const infoProntuario = document.getElementById("infoProntuario");

const btnSalvar = document.getElementById("btnSalvar");
const btnSair = document.getElementById("btnSair");
const btnDiminuir = document.getElementById("btnDiminuir");
const btnAumentar = document.getElementById("btnAumentar");
const btnTema = document.getElementById("btnTema");

const CHAVE_PACIENTES = "pacientes";     // pacientes salvos pela Tela-inicial
const CHAVE_EVOLUCOES = "evolucoes";     // evoluções salvas por esta tela


// =========================================================
// 2. FUNÇÕES DE APOIO
// =========================================================
function mostrarErro(elemento, texto) {
    const campo = elemento.closest(".campo");
    campo.querySelector(".erro").textContent = texto;
    campo.classList.add("invalido");
}

function limparErro(elemento) {
    const campo = elemento.closest(".campo");
    campo.querySelector(".erro").textContent = "";
    campo.classList.remove("invalido");
}

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem " + tipo;
}

// Data de hoje no formato do campo de data: "AAAA-MM-DD"
function hojeISO() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return hoje.getFullYear() + "-" + mes + "-" + dia;
}

// Lê uma lista do localStorage (ou lista vazia)
function lerLista(chave) {
    try {
        const lista = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        return [];
    }
}

function buscarPaciente(id) {
    return lerLista(CHAVE_PACIENTES).find(function (p) { return p.id === id; }) || null;
}


// =========================================================
// 3. SELEÇÃO DO PACIENTE
// As opções são criadas com os pacientes reais do localStorage.
// =========================================================
function carregarPacientes() {
    const pacientes = lerLista(CHAVE_PACIENTES).sort(function (a, b) {
        return a.identificacao.nome.localeCompare(b.identificacao.nome);   // ordem alfabética
    });

    // Primeira opção vazia
    const opcaoVazia = document.createElement("option");
    opcaoVazia.value = "";
    opcaoVazia.textContent = pacientes.length ? "Selecione" : "Nenhum paciente cadastrado";
    campoPaciente.appendChild(opcaoVazia);

    // Uma opção para cada paciente (textContent evita que o texto vire código HTML)
    pacientes.forEach(function (paciente) {
        const i = paciente.identificacao;
        const opcao = document.createElement("option");
        opcao.value = paciente.id;
        opcao.textContent = i.nome + " — ID " + i.idPaciente + " — Prontuário " + i.numeroProntuario;
        campoPaciente.appendChild(opcao);
    });

    // Sem pacientes: bloqueia o formulário e mostra o aviso
    if (pacientes.length === 0) {
        campoPaciente.disabled = true;
        btnSalvar.disabled = true;
        avisoSemPacientes.hidden = false;
    }
}

// Mostra nome, ID e prontuário do paciente escolhido
function mostrarDadosPaciente() {
    const paciente = buscarPaciente(campoPaciente.value);

    if (!paciente) {
        dadosPaciente.hidden = true;
        return;
    }

    infoNome.textContent = paciente.identificacao.nome;
    infoId.textContent = paciente.identificacao.idPaciente;
    infoProntuario.textContent = paciente.identificacao.numeroProntuario;
    dadosPaciente.hidden = false;
}

campoPaciente.addEventListener("change", function () {
    limparErro(campoPaciente);
    mostrarDadosPaciente();
});


// =========================================================
// 4. CAMPO DE OBSERVAÇÃO QUE CRESCE COM O TEXTO
// A altura acompanha o conteúdo, então o texto nunca fica cortado.
// =========================================================
function ajustarAltura() {
    campoObservacao.style.height = "auto";                               // volta ao mínimo
    campoObservacao.style.height = campoObservacao.scrollHeight + "px";  // cresce até caber tudo
}

campoObservacao.addEventListener("input", function () {
    limparErro(campoObservacao);
    ajustarAltura();
});

// Se a largura da tela mudar, o texto quebra em outras linhas: recalcula a altura
window.addEventListener("resize", ajustarAltura);

campoData.addEventListener("input", function () {
    limparErro(campoData);
});


// =========================================================
// 5. SALVAR EVOLUÇÃO
// =========================================================
function validar() {
    let tudoCerto = true;

    // 1) Paciente selecionado (e que ainda exista)
    if (campoPaciente.value === "" || !buscarPaciente(campoPaciente.value)) {
        mostrarErro(campoPaciente, "Selecione um paciente.");
        tudoCerto = false;
    }

    // 2) Observação preenchida
    if (campoObservacao.value.trim() === "") {
        mostrarErro(campoObservacao, "Escreva a observação do paciente.");
        tudoCerto = false;
    }

    // 3) Data válida (o campo de data já recusa datas impossíveis, como 31/02)
    if (campoData.validity.badInput || (campoData.value !== "" && campoData.value < "1900-01-01")) {
        mostrarErro(campoData, "Digite uma data válida.");
        tudoCerto = false;
    } else if (campoData.value === "") {
        mostrarErro(campoData, "Informe a data.");
        tudoCerto = false;
    }

    return tudoCerto;
}

formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();   // impede a página de recarregar

    if (!validar()) {
        mostrarMensagem("Corrija os campos destacados em vermelho.", "erro");
        return;
    }

    // Cada evolução guarda o id do paciente: é isso que liga a evolução a ele
    const novaEvolucao = {
        id: String(Date.now()),
        pacienteId: campoPaciente.value,
        data: campoData.value,
        observacao: campoObservacao.value.trim()
    };

    const evolucoes = lerLista(CHAVE_EVOLUCOES);
    evolucoes.push(novaEvolucao);

    try {
        localStorage.setItem(CHAVE_EVOLUCOES, JSON.stringify(evolucoes));
    } catch (e) {
        mostrarMensagem("Não foi possível salvar neste navegador.", "erro");
        return;
    }

    mostrarMensagem("Evolução de enfermagem salva com sucesso!", "sucesso");

    // Limpa só a observação, para permitir registrar outra evolução
    campoObservacao.value = "";
    ajustarAltura();
});


// =========================================================
// 6. SAIR (não apaga nada do localStorage)
// =========================================================
btnSair.addEventListener("click", function () {
    window.location.replace("Login.html");
});


// =========================================================
// 7. AUMENTAR E DIMINUIR LETRAS (não é zoom)
// Muda SOMENTE a variável CSS --fonte-base, que só os textos usam.
// =========================================================
const FONTE_MINIMA = 12;
const FONTE_MAXIMA = 22;
const PASSO = 2;
let tamanhoFonte = 16;

function aplicarFonte() {
    document.documentElement.style.setProperty("--fonte-base", tamanhoFonte + "px");
    ajustarAltura();   // letras maiores ocupam mais linhas no campo de observação
}

btnDiminuir.addEventListener("click", function () {
    if (tamanhoFonte > FONTE_MINIMA) {
        tamanhoFonte = tamanhoFonte - PASSO;
        aplicarFonte();
    }
});

btnAumentar.addEventListener("click", function () {
    if (tamanhoFonte < FONTE_MAXIMA) {
        tamanhoFonte = tamanhoFonte + PASSO;
        aplicarFonte();
    }
});


// =========================================================
// 8. TEMA CLARO / ESCURO (mesma chave das outras telas)
// =========================================================
function aplicarTema(tema) {
    if (tema === "escuro") {
        document.documentElement.setAttribute("data-tema", "escuro");
        btnTema.setAttribute("aria-label", "Alternar para tema claro");
    } else {
        document.documentElement.removeAttribute("data-tema");
        btnTema.setAttribute("aria-label", "Alternar para tema escuro");
    }
}

btnTema.addEventListener("click", function () {
    const temaAtual = document.documentElement.getAttribute("data-tema");
    const novoTema = temaAtual === "escuro" ? "claro" : "escuro";

    aplicarTema(novoTema);

    try {
        localStorage.setItem("temaProntuario", novoTema);
    } catch (e) {
        // Se o navegador bloquear o localStorage, o tema só não fica salvo
    }
});

try {
    aplicarTema(localStorage.getItem("temaProntuario") || "claro");
} catch (e) {
    aplicarTema("claro");
}


// =========================================================
// 9. AO ABRIR A TELA
// =========================================================
carregarPacientes();
campoData.value = hojeISO();   // já vem com a data de hoje (pode ser alterada)