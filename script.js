const API_URL = "http://127.0.0.1:5000";

const SUPABASE_URL = "https://xexwzlgvcdmvdfuzvnut.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhleHd6bGd2Y2RtdmRmdXp2bnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzU4NjEsImV4cCI6MjA5NDExMTg2MX0.2plyVzUf2nT2lzjDp82HAGjeqBWvatE_3gzcFthlG4I";

const TAXA_CARTAO = 1;

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let carrinho = carregarCarrinho();
let precisaTroco = null;

/* =========================
   INÍCIO
========================= */

document.addEventListener("DOMContentLoaded", function () {
    console.log("script.js carregou");

    carregarProdutos();
    atualizarCarrinho();
    atualizarContadorCarrinho();

    configurarBotaoFinalizarCompra();

    configurarUsuario();
    abrirLoginPorParametro();
    atualizarTextoUsuario();

    configurarCheckout();
});

/* =========================
   PRODUTOS
========================= */

async function carregarProdutos() {
    const container = document.querySelector(".conteiner") || document.querySelector(".container");

    if (!container) {
        return;
    }

    container.innerHTML = "<p>Carregando produtos...</p>";

    try {
        const resposta = await fetch(`${API_URL}/produtos`);

        if (!resposta.ok) {
            throw new Error("Erro na requisição: " + resposta.status);
        }

        const produtos = await resposta.json();

        if (!produtos || produtos.length === 0) {
            container.innerHTML = "<p>Nenhum produto cadastrado.</p>";
            return;
        }

        container.innerHTML = "";

        produtos.forEach(function (produto) {
            const card = criarCardProduto(produto);
            container.appendChild(card);
        });

    } catch (erro) {
        console.log("Erro ao carregar produtos:", erro);
        container.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}

function criarCardProduto(produto) {
    const card = document.createElement("div");
    card.className = "card";

    const preco = Number(produto.preco);

    card.innerHTML = `
        ${produto.imagem_url ? `<img src="${produto.imagem_url}" alt="${produto.nome}">` : ""}
        <p>${produto.nome}</p>
        <p>${produto.descricao || ""}</p>
        <p>Preço: R$ ${formatarPreco(preco)}</p>
        <button type="button" class="botao-adicionar">+</button>
    `;

    const botaoAdicionar = card.querySelector(".botao-adicionar");

    botaoAdicionar.addEventListener("click", function () {
        adicionarProduto(produto.id, produto.nome, preco);
    });

    return card;
}

/* =========================
   CARRINHO
========================= */

function adicionarProduto(id, nome, preco) {
    carrinho = carregarCarrinho();

    const produto = {
        id: id ?? null,
        nome: nome,
        preco: Number(preco),
        quantidade: 1
    };

    const produtoExistente = carrinho.find(function (item) {
        if (produto.id !== null && produto.id !== undefined) {
            return String(item.id) === String(produto.id);
        }

        return item.nome === produto.nome;
    });

    if (produtoExistente) {
        produtoExistente.quantidade += 1;
    } else {
        carrinho.push(produto);
    }

    salvarCarrinho();

    mostrarMensagem(
        "Produto adicionado!",
        `${produto.nome} foi adicionado ao carrinho.`,
        "success"
    );
}

function atualizarCarrinho() {
    const lista = document.getElementById("lista-carrinho");
    const total = document.getElementById("total");

    if (!lista || !total) {
        return;
    }

    carrinho = carregarCarrinho();

    lista.innerHTML = "";

    if (carrinho.length === 0) {
        lista.innerHTML = "<li>Seu carrinho está vazio.</li>";
        total.innerHTML = "Total: R$ 0,00";
        return;
    }

    carrinho.forEach(function (produto, index) {
        const item = criarItemCarrinho(produto, index);
        lista.appendChild(item);
    });

    total.innerHTML = `Total: R$ ${formatarPreco(calcularTotalCarrinho())}`;
}

function criarItemCarrinho(produto, index) {
    const quantidade = produto.quantidade || 1;
    const preco = Number(produto.preco);
    const subtotal = preco * quantidade;

    const item = document.createElement("li");
    item.className = "item-carrinho";

    const texto = document.createElement("span");
    texto.textContent = `${produto.nome} (${quantidade}x) - R$ ${formatarPreco(subtotal)}`;

    const botaoRemover = document.createElement("button");
    botaoRemover.type = "button";
    botaoRemover.textContent = "-";

    botaoRemover.addEventListener("click", function () {
        removerProduto(index);
    });

    item.appendChild(texto);
    item.appendChild(botaoRemover);

    return item;
}

function removerProduto(index) {
    carrinho = carregarCarrinho();

    if (!carrinho[index]) {
        return;
    }

    if (carrinho[index].quantidade > 1) {
        carrinho[index].quantidade -= 1;
    } else {
        carrinho.splice(index, 1);
    }

    salvarCarrinho();
    atualizarCarrinho();
}

function carregarCarrinho() {
    try {
        const dados = JSON.parse(localStorage.getItem("carrinho"));

        if (Array.isArray(dados)) {
            return dados;
        }

        return [];
    } catch (erro) {
        console.log("Erro ao carregar carrinho:", erro);
        return [];
    }
}

function salvarCarrinho() {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarContadorCarrinho();
}

function limparCarrinho() {
    carrinho = [];
    localStorage.removeItem("carrinho");
    atualizarContadorCarrinho();
}

function calcularTotalCarrinho() {
    carrinho = carregarCarrinho();

    return carrinho.reduce(function (total, produto) {
        const quantidade = produto.quantidade || 1;
        const preco = Number(produto.preco);

        return total + preco * quantidade;
    }, 0);
}

function calcularQuantidadeCarrinho() {
    carrinho = carregarCarrinho();

    return carrinho.reduce(function (total, produto) {
        return total + (produto.quantidade || 1);
    }, 0);
}

function atualizarContadorCarrinho() {
    const contador = document.getElementById("contadorCarrinho");

    if (!contador) {
        return;
    }

    const quantidadeTotal = calcularQuantidadeCarrinho();

    if (quantidadeTotal === 0) {
        contador.style.display = "none";
        contador.textContent = "0";
        return;
    }

    contador.style.display = "flex";
    contador.textContent = quantidadeTotal;
}

/* =========================
   FINALIZAR COMPRA
========================= */

function configurarBotaoFinalizarCompra() {
    const botaoFinalizar = document.getElementById("finalizarCompra") || document.querySelector(".finalizar");

    if (!botaoFinalizar) {
        return;
    }

    botaoFinalizar.addEventListener("click", finalizarCompra);
}

async function finalizarCompra() {
    carrinho = carregarCarrinho();

    if (carrinho.length === 0) {
        mostrarMensagem(
            "Carrinho vazio",
            "Adicione algum produto antes de finalizar.",
            "warning"
        );
        return;
    }

    const session = await pegarSessaoUsuario();

    if (!session) {
        mostrarMensagem(
            "Login necessário",
            "Você precisa fazer login para finalizar a compra.",
            "warning"
        ).then(function () {
            window.location.href = "index.html?login=true";
        });

        return;
    }

    window.location.href = "checkout.html";
}

/* =========================
   CHECKOUT
========================= */

function configurarCheckout() {
    const abrirModalPix = document.getElementById("abrirModalPix");
    const abrirModalCartao = document.getElementById("abrirModalCartao");
    const abrirModalDinheiro = document.getElementById("abrirModalDinheiro");

    if (!abrirModalPix || !abrirModalCartao || !abrirModalDinheiro) {
        return;
    }

    abrirModalPix.addEventListener("click", function () {
        abrirModalPagamento("pix");
    });

    abrirModalCartao.addEventListener("click", function () {
        abrirModalPagamento("cartao");
    });

    abrirModalDinheiro.addEventListener("click", function () {
        abrirModalPagamento("dinheiro");
    });

    configurarFechamentoModaisCheckout();
    configurarTroco();
    configurarConfirmacaoPedido();
}

async function abrirModalPagamento(tipo) {
    carrinho = carregarCarrinho();

    if (carrinho.length === 0) {
        mostrarMensagem(
            "Carrinho vazio",
            "Seu carrinho está vazio.",
            "warning"
        ).then(function () {
            window.location.href = "carrinho.html";
        });

        return;
    }

    const session = await pegarSessaoUsuario();

    if (!session) {
        mostrarMensagem(
            "Login necessário",
            "Você precisa fazer login para finalizar o pedido.",
            "warning"
        ).then(function () {
            window.location.href = "index.html?login=true";
        });

        return;
    }

    const endereco = session.user.user_metadata?.endereco || "Endereço não informado";

    preencherResumoPedido(tipo, endereco);

    if (tipo === "pix") {
        abrirModal("modalPix");
        return;
    }

    if (tipo === "cartao") {
        abrirModal("modalCartao");
        return;
    }

    if (tipo === "dinheiro") {
        resetarTroco();
        abrirModal("modalDinheiro");
        return;
    }
}

function preencherResumoPedido(tipo, endereco) {
    const total = calcularTotalCarrinho();

    if (tipo === "pix") {
        definirTexto("enderecoPix", endereco);
        definirTexto("totalPix", `R$ ${formatarPreco(total)}`);
        preencherListaItens("itensPix");
        return;
    }

    if (tipo === "cartao") {
        const totalComTaxa = total + TAXA_CARTAO;

        definirTexto("enderecoCartao", endereco);
        definirTexto("totalCartao", `R$ ${formatarPreco(total)}`);
        definirTexto("totalCartaoFinal", `R$ ${formatarPreco(totalComTaxa)}`);
        preencherListaItens("itensCartao");
        return;
    }

    if (tipo === "dinheiro") {
        definirTexto("enderecoDinheiro", endereco);
        definirTexto("totalDinheiro", `R$ ${formatarPreco(total)}`);
        preencherListaItens("itensDinheiro");
    }
}

function preencherListaItens(idLista) {
    const lista = document.getElementById(idLista);

    if (!lista) {
        return;
    }

    carrinho = carregarCarrinho();

    lista.innerHTML = "";

    carrinho.forEach(function (produto) {
        const quantidade = produto.quantidade || 1;
        const preco = Number(produto.preco);
        const subtotal = preco * quantidade;

        const item = document.createElement("li");
        item.textContent = `${produto.nome} (${quantidade}x) - R$ ${formatarPreco(subtotal)}`;

        lista.appendChild(item);
    });
}

function configurarFechamentoModaisCheckout() {
    const botoesFechar = [
        { botao: "fecharModalPix", modal: "modalPix" },
        { botao: "fecharModalCartao", modal: "modalCartao" },
        { botao: "fecharModalDinheiro", modal: "modalDinheiro" }
    ];

    botoesFechar.forEach(function (item) {
        const botao = document.getElementById(item.botao);

        if (botao) {
            botao.addEventListener("click", function () {
                fecharModal(item.modal);
            });
        }
    });
}

function abrirModal(idModal) {
    const modal = document.getElementById(idModal);

    if (modal) {
        modal.style.display = "flex";
    }
}

function fecharModal(idModal) {
    const modal = document.getElementById(idModal);

    if (modal) {
        modal.style.display = "none";
    }
}

/* =========================
   TROCO
========================= */

function configurarTroco() {
    const trocoSim = document.getElementById("trocoSim");
    const trocoNao = document.getElementById("trocoNao");
    const valorPago = document.getElementById("valorPago");

    if (!trocoSim || !trocoNao || !valorPago) {
        return;
    }

    trocoSim.addEventListener("click", function () {
        precisaTroco = true;

        const campoTroco = document.getElementById("campoTroco");
        const resultadoTroco = document.getElementById("resultadoTroco");
        const labelTroco = document.querySelector('label[for="valorPago"]');

        if (campoTroco) {
            campoTroco.style.display = "block";
        }

        if (labelTroco) {
            labelTroco.style.display = "block";
        }

        valorPago.style.display = "block";
        valorPago.value = "";

        if (resultadoTroco) {
            resultadoTroco.textContent = "";
        }
    });

    trocoNao.addEventListener("click", function () {
        precisaTroco = false;

        const campoTroco = document.getElementById("campoTroco");
        const resultadoTroco = document.getElementById("resultadoTroco");
        const labelTroco = document.querySelector('label[for="valorPago"]');

        if (campoTroco) {
            campoTroco.style.display = "block";
        }

        if (labelTroco) {
            labelTroco.style.display = "none";
        }

        valorPago.style.display = "none";
        valorPago.value = "";

        if (resultadoTroco) {
            resultadoTroco.textContent = "Não levaremos troco.";
        }
    });

    valorPago.addEventListener("input", calcularTroco);
}

function resetarTroco() {
    precisaTroco = null;

    const campoTroco = document.getElementById("campoTroco");
    const valorPago = document.getElementById("valorPago");
    const resultadoTroco = document.getElementById("resultadoTroco");
    const labelTroco = document.querySelector('label[for="valorPago"]');

    if (campoTroco) {
        campoTroco.style.display = "none";
    }

    if (labelTroco) {
        labelTroco.style.display = "block";
    }

    if (valorPago) {
        valorPago.style.display = "block";
        valorPago.value = "";
    }

    if (resultadoTroco) {
        resultadoTroco.textContent = "";
    }
}

function calcularTroco() {
    const valorPago = document.getElementById("valorPago");
    const resultadoTroco = document.getElementById("resultadoTroco");

    if (!valorPago || !resultadoTroco) {
        return;
    }

    if (precisaTroco !== true) {
        return;
    }

    const total = calcularTotalCarrinho();
    const pago = Number(valorPago.value);

    if (!pago || pago <= 0) {
        resultadoTroco.textContent = "";
        return;
    }

    if (pago < total) {
        resultadoTroco.textContent = "Valor menor que o total do pedido.";
        return;
    }

    const troco = pago - total;

    resultadoTroco.textContent = `Troco: R$ ${formatarPreco(troco)}`;
}

/* =========================
   CONFIRMAÇÃO DO PEDIDO
========================= */

function configurarConfirmacaoPedido() {
    const confirmarPix = document.getElementById("confirmarPix");
    const confirmarCartao = document.getElementById("confirmarCartao");
    const confirmarDinheiro = document.getElementById("confirmarDinheiro");

    if (confirmarPix) {
        confirmarPix.addEventListener("click", function (event) {
            event.preventDefault();
            confirmarPedidoFinal("Pix");
        });
    }

    if (confirmarCartao) {
        confirmarCartao.addEventListener("click", function (event) {
            event.preventDefault();
            confirmarPedidoFinal("Cartão");
        });
    }

    if (confirmarDinheiro) {
        confirmarDinheiro.addEventListener("click", function (event) {
            event.preventDefault();
            confirmarPedidoDinheiro();
        });
    }
}

function confirmarPedidoDinheiro() {
    const valorPago = document.getElementById("valorPago");
    const total = calcularTotalCarrinho();

    if (precisaTroco === null) {
        mostrarMensagem(
            "Informe o troco",
            "Diga se precisa ou não de troco antes de confirmar o pedido.",
            "warning"
        );
        return;
    }

    if (precisaTroco === true) {
        const pago = Number(valorPago.value);

        if (!pago || pago <= 0) {
            mostrarMensagem(
                "Valor inválido",
                "Informe com quanto você vai pagar.",
                "warning"
            );
            return;
        }

        if (pago < total) {
            mostrarMensagem(
                "Valor insuficiente",
                "O valor informado é menor que o total do pedido.",
                "warning"
            );
            return;
        }
    }

    confirmarPedidoFinal("Dinheiro");
}

function confirmarPedidoFinal(formaPagamento) {
    limparCarrinho();

    mostrarMensagem(
        "Pedido confirmado!",
        `Seu pedido foi confirmado com pagamento em ${formaPagamento}.`,
        "success"
    ).then(function () {
        window.location.href = "index.html";
    });
}

/* =========================
   USUÁRIO / SUPABASE AUTH
========================= */

function configurarUsuario() {
    const btnUsuario = document.getElementById("btnUsuario");

    const loginModal = document.getElementById("loginModal");
    const cadastroModal = document.getElementById("cadastroModal");
    const contaModal = document.getElementById("contaModal");

    const fecharLogin = document.getElementById("fecharLogin");
    const fecharCadastro = document.getElementById("fecharCadastro");
    const fecharConta = document.getElementById("fecharConta");

    const abrirCadastro = document.getElementById("abrirCadastro");

    const botaoCadastrar = document.getElementById("cadastrar");
    const botaoEntrar = document.getElementById("entrar");
    const btnSairConta = document.getElementById("btnSairConta");

    if (btnUsuario) {
        btnUsuario.addEventListener("click", abrirModalUsuario);
    }

    if (fecharLogin) {
        fecharLogin.addEventListener("click", function () {
            esconderElemento(loginModal);
        });
    }

    if (abrirCadastro) {
        abrirCadastro.addEventListener("click", function (event) {
            event.preventDefault();

            esconderElemento(loginModal);
            mostrarElemento(cadastroModal);
        });
    }

    if (fecharCadastro) {
        fecharCadastro.addEventListener("click", function () {
            esconderElemento(cadastroModal);
            mostrarElemento(loginModal);
        });
    }

    if (fecharConta) {
        fecharConta.addEventListener("click", function () {
            esconderElemento(contaModal);
        });
    }

    if (botaoCadastrar) {
        botaoCadastrar.addEventListener("click", cadastrarUsuario);
    }

    if (botaoEntrar) {
        botaoEntrar.addEventListener("click", entrarUsuario);
    }

    if (btnSairConta) {
        btnSairConta.addEventListener("click", sairUsuario);
    }

    supabaseClient.auth.onAuthStateChange(function () {
        atualizarTextoUsuario();
    });
}

async function abrirModalUsuario() {
    const loginModal = document.getElementById("loginModal");
    const contaModal = document.getElementById("contaModal");

    const session = await pegarSessaoUsuario();

    if (!session) {
        mostrarElemento(loginModal);
        return;
    }

    const usuario = session.user;

    definirTexto("nomeConta", usuario.user_metadata?.nome || "Usuário");
    definirTexto("emailConta", usuario.email || "Não informado");
    definirTexto("telefoneConta", usuario.user_metadata?.telefone || "Não informado");
    definirTexto("enderecoConta", usuario.user_metadata?.endereco || "Não informado");

    mostrarElemento(contaModal);
}

async function cadastrarUsuario() {
    const nome = pegarValor("nomeCadastro");
    const email = pegarValor("emailCadastro");
    const telefone = pegarValor("telefoneCadastro");
    const endereco = pegarValor("enderecoCadastro");
    const senha = pegarValor("senhaCadastro");

    if (!nome || !email || !telefone || !endereco || !senha) {
        mostrarMensagem("Campos vazios", "Preencha todos os campos!", "warning");
        return;
    }

    if (!validarEmail(email)) {
        mostrarMensagem("E-mail inválido", "Digite um e-mail válido.", "warning");
        return;
    }

    if (!validarTelefone(telefone)) {
        mostrarMensagem("Telefone inválido", "Digite um telefone válido com DDD.", "warning");
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: senha,
        options: {
            data: {
                nome: nome,
                telefone: telefone,
                endereco: endereco
            }
        }
    });

    if (error) {
        mostrarMensagem("Erro no cadastro", traduzirErroSupabase(error.message), "error");
        return;
    }

    console.log("Cadastro:", data);

    limparCamposCadastro();

    mostrarMensagem(
        "Conta criada!",
        "Cadastro realizado com sucesso. Se o Supabase pedir confirmação, verifique seu e-mail.",
        "success"
    );

    esconderElemento(document.getElementById("cadastroModal"));
    mostrarElemento(document.getElementById("loginModal"));
}

async function entrarUsuario() {
    const email = pegarValor("emailLogin");
    const senha = pegarValor("senhaLogin");

    if (!email || !senha) {
        mostrarMensagem("Campos vazios", "Digite seu e-mail e sua senha.", "warning");
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
        mostrarMensagem("Erro no login", traduzirErroSupabase(error.message), "error");
        return;
    }

    console.log("Login:", data);

    limparCamposLogin();

    await atualizarTextoUsuario();

    mostrarMensagem("Login realizado!", "Você entrou na sua conta.", "success");

    esconderElemento(document.getElementById("loginModal"));
}

async function sairUsuario() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        mostrarMensagem("Erro ao sair", traduzirErroSupabase(error.message), "error");
        return;
    }

    await atualizarTextoUsuario();

    esconderElemento(document.getElementById("contaModal"));

    mostrarMensagem("Você saiu", "Logout realizado com sucesso.", "success");
}

function abrirLoginPorParametro() {
    const parametros = new URLSearchParams(window.location.search);
    const loginModal = document.getElementById("loginModal");

    if (parametros.get("login") === "true" && loginModal) {
        mostrarElemento(loginModal);
    }
}

async function atualizarTextoUsuario() {
    const textoUsuario = document.getElementById("textoUsuario");

    if (!textoUsuario) {
        return;
    }

    const session = await pegarSessaoUsuario();

    if (!session) {
        textoUsuario.innerHTML = '<i class="fa-regular fa-user"></i>';
        return;
    }

    const usuario = session.user;
    const nome = usuario.user_metadata?.nome || usuario.email || "Usuário";
    const primeiroNome = nome.split(" ")[0];

    textoUsuario.textContent = "Olá, " + primeiroNome;
}

async function pegarSessaoUsuario() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        mostrarMensagem("Erro", traduzirErroSupabase(error.message), "error");
        return null;
    }

    return data.session;
}

/* =========================
   UTILIDADES
========================= */

function pegarValor(id) {
    const elemento = document.getElementById(id);

    if (!elemento) {
        return "";
    }

    return elemento.value.trim();
}

function definirTexto(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}

function mostrarElemento(elemento) {
    if (elemento) {
        elemento.style.display = "flex";
    }
}

function esconderElemento(elemento) {
    if (elemento) {
        elemento.style.display = "none";
    }
}

function limparCampo(id) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.value = "";
    }
}

function limparCamposCadastro() {
    limparCampo("nomeCadastro");
    limparCampo("emailCadastro");
    limparCampo("telefoneCadastro");
    limparCampo("enderecoCadastro");
    limparCampo("senhaCadastro");
}

function limparCamposLogin() {
    limparCampo("emailLogin");
    limparCampo("senhaLogin");
}

function validarEmail(email) {
    return email.includes("@") && email.includes(".");
}

function validarTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, "");

    return numeros.length >= 10 && numeros.length <= 11;
}

function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace(".", ",");
}

function mostrarMensagem(titulo, texto, tipo = "success") {
    if (typeof Swal !== "undefined") {
        return Swal.fire(titulo, texto, tipo);
    }

    alert(texto || titulo);
    return Promise.resolve();
}

function traduzirErroSupabase(mensagem) {
    if (!mensagem) {
        return "Ocorreu um erro.";
    }

    if (mensagem.includes("Invalid login credentials")) {
        return "E-mail ou senha incorretos.";
    }

    if (mensagem.includes("Email not confirmed")) {
        return "Confirme seu e-mail antes de entrar.";
    }

    if (mensagem.includes("User already registered")) {
        return "Esse e-mail já está cadastrado.";
    }

    if (mensagem.includes("Signup requires a valid email")) {
        return "Digite um e-mail válido.";
    }

    if (mensagem.includes("Unable to validate email address")) {
        return "Digite um e-mail válido.";
    }

    if (mensagem.includes("Password should be at least")) {
        return "A senha precisa ter pelo menos 6 caracteres.";
    }

    return mensagem;
}

/* =========================
   FUNÇÕES GLOBAIS
========================= */

window.adicionarProduto = adicionarProduto;
window.removerProduto = removerProduto;