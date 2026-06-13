const API_URL = "http://127.0.0.1:5000";

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

document.addEventListener("DOMContentLoaded", function () {
    console.log("script.js carregou");

    carregarProdutos();
    atualizarCarrinho();

    const botaoFinalizar = document.querySelector(".finalizar");

    if (botaoFinalizar) {
        botaoFinalizar.addEventListener("click", finalizarCompra);
    }
});

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

    mostrarMensagem("Produto adicionado!", `${produto.nome} foi adicionado ao carrinho.`);
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
    if (carrinho[index].quantidade > 1) {
        carrinho[index].quantidade -= 1;
    } else {
        carrinho.splice(index, 1);
    }

    salvarCarrinho();
    atualizarCarrinho();
}

function finalizarCompra() {
    if (carrinho.length === 0) {
        mostrarMensagem("Carrinho vazio", "Adicione algum produto antes de finalizar.", "warning");
        return;
    }

    mostrarMensagem("Compra finalizada!", "Por enquanto, o carrinho foi salvo apenas no navegador.");

    carrinho = [];
    salvarCarrinho();
    atualizarCarrinho();
}

function salvarCarrinho() {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace(".", ",");
}

function mostrarMensagem(titulo, texto, tipo = "success") {
    if (typeof Swal !== "undefined") {
        Swal.fire(titulo, texto, tipo);
    } else {
        alert(texto || titulo);
    }
}

window.adicionarProduto = adicionarProduto;
window.removerProduto = removerProduto;