// ============================================
// GERENCIAMENTO DO CARRINHO (LocalStorage)
// ============================================

// Buscar carrinho do LocalStorage
function getCarrinho() {
  const carrinho = localStorage.getItem('carrinho');
  return carrinho ? JSON.parse(carrinho) : [];
}


// Salvar carrinho no LocalStorage (ATUALIZADA)
function salvarCarrinho(carrinho) {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarBadgeCarrinho();
  renderizarCarrinho();
  
  // Atualizar também o carrinho flutuante
  if (typeof atualizarCarrinhoFlutuante === 'function') {
    atualizarCarrinhoFlutuante();
  }
}

// Adicionar item ao carrinho (bolo ou combo) - ATUALIZADA
function adicionarAoCarrinho(id, nome, preco, imagem, tipo) {
  const carrinho = getCarrinho();
  
  const existente = carrinho.find(item => item.id === id && item.tipo === tipo);
  
  if (existente) {
    existente.quantidade += 1;
  } else {
    carrinho.push({
      id: id,
      nome: nome,
      preco: preco,
      imagem: imagem,
      tipo: tipo,
      quantidade: 1
    });
  }
  
  salvarCarrinho(carrinho);
  
  // Mostrar modal em vez de toast
  if (typeof mostrarModalConfirmacao === 'function') {
    mostrarModalConfirmacao(`${nome} adicionado!`);
  } else {
    mostrarToast(`${nome} adicionado ao carrinho!`);
  }
}

// Adicionar açaí personalizado - ATUALIZADA
function adicionarAcaiCarrinho(tamanho, ingredientes, precoFinal, idExistente = null) {
  let carrinho = getCarrinho();
  
  // Se for edição (tem id existente), remove o antigo primeiro
  if (idExistente) {
    carrinho = carrinho.filter(item => item.id !== idExistente);
  }
  
  const id = idExistente || 'acai-' + Date.now();
  
  carrinho.push({
    id: id,
    nome: `Açaí ${tamanho.nome}`,
    preco: precoFinal,
    imagem: tamanho.imagem_url || 'imagens/acai-destaque.png',
    tipo: 'acai',
    quantidade: 1,
    detalhes: {
      tamanho: tamanho.nome,
      tamanho_id: tamanho.id,
      preco_tamanho: tamanho.preco,
      ingredientes: ingredientes.map(i => ({
        id: i.id,
        nome: i.nome,
        preco: i.preco,
        categoria_id: i.categoria ? i.categoria.id : null
      }))
    }
  });
  
  salvarCarrinho(carrinho);
  
  // Se foi edição, volta para o carrinho direto
  if (idExistente) {
    mostrarToast('Açaí atualizado!');
    setTimeout(() => window.location.href = 'carrinho.html', 800);
  } else {
    // Mostrar modal
    if (typeof mostrarModalConfirmacao === 'function') {
      mostrarModalConfirmacao(`Açaí ${tamanho.nome} adicionado!`);
    } else {
      mostrarToast(`Açaí ${tamanho.nome} adicionado ao carrinho!`);
    }
  }
}

// Alterar quantidade
function alterarQuantidade(id, delta) {
  const carrinho = getCarrinho();
  const item = carrinho.find(i => i.id === id);
  
  if (item) {
    item.quantidade += delta;
    if (item.quantidade <= 0) {
      return removerDoCarrinho(id);
    }
    salvarCarrinho(carrinho);
  }
}

// Remover item
function removerDoCarrinho(id) {
  let carrinho = getCarrinho();
  carrinho = carrinho.filter(item => item.id !== id);
  salvarCarrinho(carrinho);
}

// Limpar carrinho
function limparCarrinho() {
  localStorage.removeItem('carrinho');
  atualizarBadgeCarrinho();
  renderizarCarrinho();
}

// Calcular subtotal
function calcularSubtotal() {
  const carrinho = getCarrinho();
  return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

// Atualizar badge do carrinho
function atualizarBadgeCarrinho() {
  const carrinho = getCarrinho();
  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
  
  const badges = document.querySelectorAll('#carrinhoBadge, #bottomBadge');
  badges.forEach(badge => {
    if (badge) badge.textContent = totalItens;
  });
}

// Renderizar carrinho no offcanvas - ATUALIZADA
function renderizarCarrinho() {
  const container = document.getElementById('itensCarrinho');
  const vazio = document.getElementById('carrinhoVazio');
  const resumo = document.getElementById('resumoCarrinho');
  
  if (!container) return;
  
  const carrinho = getCarrinho();
  
  if (carrinho.length === 0) {
    container.innerHTML = '';
    if (vazio) vazio.classList.remove('d-none');
    if (resumo) resumo.classList.add('d-none');
    return;
  }
  
  if (vazio) vazio.classList.add('d-none');
  if (resumo) resumo.classList.remove('d-none');
  
  let html = '';
  carrinho.forEach(item => {
    const tipoNome = {
      'bolo': 'Bolo de pote',
      'acai': 'Açaí',
      'combo': 'Combo'
    }[item.tipo] || '';
    
    // Detalhes de ingredientes (para açaí)
    let detalhesHtml = '';
    let botaoEditar = '';
    
    if (item.tipo === 'acai' && item.detalhes) {
      if (item.detalhes.ingredientes && item.detalhes.ingredientes.length > 0) {
        const listaIng = item.detalhes.ingredientes.map(i => i.nome).join(', ');
        detalhesHtml = `<div class="item-carrinho-detalhes">${listaIng}</div>`;
      } else {
        detalhesHtml = `<div class="item-carrinho-detalhes">Sem ingredientes extras</div>`;
      }
      botaoEditar = `
        <button class="btn-editar-item" onclick="editarAcai('${item.id}')">
          <i class="bi bi-pencil"></i> Editar
        </button>
      `;
    }
    
    html += `
      <div class="item-carrinho">
        <img src="${item.imagem}" alt="${item.nome}">
        <div class="item-carrinho-info">
          <div class="item-carrinho-nome">${item.nome}</div>
          <div class="item-carrinho-tipo">${tipoNome}</div>
          ${detalhesHtml}
          <div class="item-carrinho-preco">${formatarPreco(item.preco)}</div>
          <div class="controle-quantidade">
            <button class="btn-qtd" onclick="alterarQuantidade('${item.id}', -1)">−</button>
            <span>${item.quantidade}</span>
            <button class="btn-qtd" onclick="alterarQuantidade('${item.id}', 1)">+</button>
            ${botaoEditar}
            <button class="btn-lixeira ms-auto" onclick="removerDoCarrinho('${item.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  const subtotal = document.getElementById('subtotalCarrinho');
  if (subtotal) subtotal.textContent = formatarPreco(calcularSubtotal());
}

// ============================================
// EDITAR AÇAÍ (salva no sessionStorage e redireciona)
// ============================================
function editarAcai(id) {
  const carrinho = getCarrinho();
  const item = carrinho.find(i => i.id === id);
  
  if (!item || item.tipo !== 'acai') {
    mostrarToast('Item não encontrado');
    return;
  }
  
  // Salvar o item em sessionStorage para carregar na página de açaí
  sessionStorage.setItem('acai_editando', JSON.stringify(item));
  
  // Redirecionar para a página de montar açaí
  window.location.href = 'acais.html?editar=' + id;
}

// Toast de notificação
function mostrarToast(mensagem) {
  let toast = document.getElementById('toastMensagem');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastMensagem';
    toast.style.cssText = `
      position: fixed;
      bottom: 90px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--rosa-principal);
      color: white;
      padding: 0.8rem 1.5rem;
      border-radius: 50px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      font-size: 0.9rem;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  
  toast.textContent = mensagem;
  toast.style.opacity = '1';
  
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 2500);
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
  atualizarBadgeCarrinho();
  renderizarCarrinho();
});