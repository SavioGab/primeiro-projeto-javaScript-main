const API_URL = "http://127.0.0.1:5000";

const SUPABASE_URL = "https://xexwzlgvcdmvdfuzvnut.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhleHd6bGd2Y2RtdmRmdXp2bnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzU4NjEsImV4cCI6MjA5NDExMTg2MX0.2plyVzUf2nT2lzjDp82HAGjeqBWvatE_3gzcFthlG4I";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

document.addEventListener("DOMContentLoaded", function () {
    console.log("script.js carregou");

    carregarProdutos();
    atualizarCarrinho();

    configurarUsuario();
    abrirLoginPorParametro();
    atualizarTextoUsuario();

    const botaoFinalizar = document.getElementById("finalizarCompra") || document.querySelector(".finalizar");

    if (botaoFinalizar) {
        botaoFinalizar.addEventListener("click", finalizarCompra);
    }
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

        console.log("Produtos recebidos:", produtos);

        if (!produtos || produtos.length === 0) {
            container.innerHTML = "<p>Nenhum produto cadastrado.</p>";
            return;
        }

        container.innerHTML = "";

        produtos.forEach(function (produto) {
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

            const botao = card.querySelector(".botao-adicionar");

            botao.addEventListener("click", function () {
                adicionarProduto(produto.id, produto.nome, preco);
            });

            container.appendChild(card);
        });

    } catch (erro) {
        console.log("Erro ao carregar produtos:", erro);
        container.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}

/* =========================
   CARRINHO
========================= */

function adicionarProduto(primeiro, segundo, terceiro) {
    let produto;

    if (terceiro !== undefined) {
        produto = {
            id: primeiro,
            nome: segundo,
            preco: Number(terceiro),
            quantidade: 1
        };
    } else {
        produto = {
            id: null,
            nome: primeiro,
            preco: Number(segundo),
            quantidade: 1
        };
    }

    const produtoExistente = carrinho.find(function (item) {
        if (produto.id !== null && produto.id !== undefined) {
            return item.id === produto.id;
        }

        return item.nome === produto.nome;
    });

    if (produtoExistente) {
        produtoExistente.quantidade += 1;
    } else {
        carrinho.push(produto);
    }

    salvarCarrinho();

    console.log("Carrinho:", carrinho);

    mostrarMensagem("Produto adicionado!", `${produto.nome} foi adicionado ao carrinho.`, "success");
}

function atualizarCarrinho() {
    const lista = document.getElementById("lista-carrinho");
    const total = document.getElementById("total");

    if (!lista || !total) {
        return;
    }

    lista.innerHTML = "";

    if (carrinho.length === 0) {
        lista.innerHTML = "<li>Seu carrinho está vazio.</li>";
        total.innerHTML = "Total: R$ 0,00";
        return;
    }

    let soma = 0;

    carrinho.forEach(function (produto, index) {
        const quantidade = produto.quantidade || 1;
        const preco = Number(produto.preco);
        const subtotal = preco * quantidade;

        soma += subtotal;

        const item = document.createElement("li");
        item.className = "item-carrinho";

        const texto = document.createElement("span");
        texto.textContent = `${produto.nome} (${quantidade}x) - R$ ${formatarPreco(subtotal)}`;

        const botaoRemover = document.createElement("button");
        botaoRemover.textContent = "-";

        botaoRemover.addEventListener("click", function () {
            removerProduto(index);
        });

        item.appendChild(texto);
        item.appendChild(botaoRemover);

        lista.appendChild(item);
    });

    total.innerHTML = `Total: R$ ${formatarPreco(soma)}`;
}

function removerProduto(index) {
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

function salvarCarrinho() {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

/* =========================
   FINALIZAR COMPRA
========================= */

async function finalizarCompra() {
    if (carrinho.length === 0) {
        mostrarMensagem("Carrinho vazio", "Adicione algum produto antes de finalizar.", "warning");
        return;
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        mostrarMensagem("Erro", error.message, "error");
        return;
    }

    const session = data.session;

    if (!session) {
        mostrarMensagem("Login necessário", "Você precisa fazer login para finalizar a compra.", "warning")
            .then(function () {
                window.location.href = "index.html?login=true";
            });

        return;
    }

    carrinho = [];
    salvarCarrinho();
    localStorage.removeItem("carrinho");
    atualizarCarrinho();

    mostrarMensagem("Compra finalizada!", "Compra finalizada com sucesso!", "success")
        .then(function () {
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

    const nomeConta = document.getElementById("nomeConta");
    const emailConta = document.getElementById("emailConta");
    const telefoneConta = document.getElementById("telefoneConta");
    const enderecoConta = document.getElementById("enderecoConta");

    if (btnUsuario) {
        btnUsuario.addEventListener("click", async function () {
            const { data, error } = await supabaseClient.auth.getSession();

            if (error) {
                mostrarMensagem("Erro", error.message, "error");
                return;
            }

            const session = data.session;

            if (session) {
                const usuario = session.user;

                if (nomeConta) {
                    nomeConta.textContent = usuario.user_metadata?.nome || "Usuário";
                }

                if (emailConta) {
                    emailConta.textContent = usuario.email || "Não informado";
                }

                if (telefoneConta) {
                    telefoneConta.textContent = usuario.user_metadata?.telefone || "Não informado";
                }

                if (enderecoConta) {
                    enderecoConta.textContent = usuario.user_metadata?.endereco || "Não informado";
                }

                if (contaModal) {
                    contaModal.style.display = "flex";
                }

            } else {
                if (loginModal) {
                    loginModal.style.display = "flex";
                }
            }
        });
    }

    if (fecharLogin) {
        fecharLogin.addEventListener("click", function () {
            if (loginModal) {
                loginModal.style.display = "none";
            }
        });
    }

    if (abrirCadastro) {
        abrirCadastro.addEventListener("click", function (e) {
            e.preventDefault();

            if (loginModal) {
                loginModal.style.display = "none";
            }

            if (cadastroModal) {
                cadastroModal.style.display = "flex";
            }
        });
    }

    if (fecharCadastro) {
        fecharCadastro.addEventListener("click", function () {
            if (cadastroModal) {
                cadastroModal.style.display = "none";
            }

            if (loginModal) {
                loginModal.style.display = "flex";
            }
        });
    }

    if (fecharConta) {
        fecharConta.addEventListener("click", function () {
            if (contaModal) {
                contaModal.style.display = "none";
            }
        });
    }

    if (botaoCadastrar) {
        botaoCadastrar.addEventListener("click", async function () {
            const nome = pegarValor("nomeCadastro");
            const email = pegarValor("emailCadastro");
            const telefone = pegarValor("telefoneCadastro");
            const endereco = pegarValor("enderecoCadastro");
            const senha = pegarValor("senhaCadastro");

            if (nome === "" || email === "" || telefone === "" || endereco === "" || senha === "") {
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

            if (cadastroModal) {
                cadastroModal.style.display = "none";
            }

            if (loginModal) {
                loginModal.style.display = "flex";
            }
        });
    }

    if (botaoEntrar) {
        botaoEntrar.addEventListener("click", async function () {
            const email = pegarValor("emailLogin");
            const senha = pegarValor("senhaLogin");

            if (email === "" || senha === "") {
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

            if (loginModal) {
                loginModal.style.display = "none";
            }
        });
    }

    if (btnSairConta) {
        btnSairConta.addEventListener("click", async function () {
            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                mostrarMensagem("Erro ao sair", traduzirErroSupabase(error.message), "error");
                return;
            }

            await atualizarTextoUsuario();

            if (contaModal) {
                contaModal.style.display = "none";
            }

            mostrarMensagem("Você saiu", "Logout realizado com sucesso.", "success");
        });
    }

    supabaseClient.auth.onAuthStateChange(function () {
        atualizarTextoUsuario();
    });
}

function abrirLoginPorParametro() {
    const parametros = new URLSearchParams(window.location.search);
    const loginModal = document.getElementById("loginModal");

    if (parametros.get("login") === "true" && loginModal) {
        loginModal.style.display = "flex";
    }
}

async function atualizarTextoUsuario() {
    const textoUsuario = document.getElementById("textoUsuario");

    if (!textoUsuario) {
        return;
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        textoUsuario.innerHTML = '<i class="fa-regular fa-user"></i>';
        return;
    }

    const session = data.session;

    if (session) {
        const usuario = session.user;
        const nome = usuario.user_metadata?.nome || usuario.email || "Usuário";
        const primeiroNome = nome.split(" ")[0];

        textoUsuario.textContent = "Olá, " + primeiroNome;
    } else {
        textoUsuario.innerHTML = '<i class="fa-regular fa-user"></i>';
    }
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
    } else {
        alert(texto || titulo);
        return Promise.resolve();
    }
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

window.adicionarProduto = adicionarProduto;
window.removerProduto = removerProduto;