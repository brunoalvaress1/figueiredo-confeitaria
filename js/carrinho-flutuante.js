// ============================================
// CARRINHO FLUTUANTE (FAB)
// ============================================

// Criar o botão flutuante dinamicamente em todas as páginas
function criarCarrinhoFlutuante() {
  // Se já existe, não cria de novo
  if (document.getElementById('carrinhoFlutuante')) return;
  
  // Não exibe na página do carrinho
  if (window.location.pathname.includes('carrinho.html')) return;
  
  const botao = document.createElement('button');
  botao.id = 'carrinhoFlutuante';
  botao.className = 'carrinho-flutuante';
  botao.onclick = () => window.location.href = 'carrinho.html';
  botao.innerHTML = `
    <div class="icone-wrap">
      <i class="bi bi-bag-fill"></i>
      <span class="badge-qtd" id="flutuanteQtd">0</span>
    </div>
    <span>Ver Carrinho</span>
    <span class="valor-total" id="flutuanteTotal">R$ 0,00</span>
  `;
  
  document.body.appendChild(botao);
  atualizarCarrinhoFlutuante();
}

// Atualizar o botão flutuante
function atualizarCarrinhoFlutuante() {
  const botao = document.getElementById('carrinhoFlutuante');
  if (!botao) return;
  
  const carrinho = getCarrinho();
  const qtdTotal = carrinho.reduce((t, i) => t + i.quantidade, 0);
  const valorTotal = carrinho.reduce((t, i) => t + (i.preco * i.quantidade), 0);
  
  const qtdEl = document.getElementById('flutuanteQtd');
  const totalEl = document.getElementById('flutuanteTotal');
  
  if (qtdEl) qtdEl.textContent = qtdTotal;
  if (totalEl) totalEl.textContent = formatarPreco(valorTotal);
  
  // Mostra/esconde o botão
  if (qtdTotal > 0) {
    botao.classList.add('visivel');
    document.body.classList.add('tem-carrinho-flutuante');
  } else {
    botao.classList.remove('visivel');
    document.body.classList.remove('tem-carrinho-flutuante');
  }
}

// ============================================
// MODAL DE CONFIRMAÇÃO
// ============================================

// Criar o modal de confirmação (se não existir)
function criarModalConfirmacao() {
  if (document.getElementById('modalConfirmacao')) return;
  
  const modal = document.createElement('div');
  modal.id = 'modalConfirmacao';
  modal.className = 'modal-confirmacao';
  modal.innerHTML = `
    <div class="modal-confirmacao-caixa">
      <div class="modal-confirmacao-icone">
        <i class="bi bi-check-circle-fill"></i>
      </div>
      <h3 id="modalTituloConfirmacao">Adicionado ao carrinho!</h3>
      <p id="modalTextoConfirmacao">O que você deseja fazer agora?</p>
      <div class="modal-confirmacao-botoes">
        <button class="btn-grande" onclick="irParaCarrinho()">
          <i class="bi bi-bag-fill"></i> VER CARRINHO
        </button>
        <button class="btn-outline-rosa" onclick="continuarComprandoModal()" id="btnContinuarModal">
          <i class="bi bi-plus-circle"></i> ADICIONAR OUTRO
        </button>
        <button class="btn-voltar" onclick="fecharModalConfirmacao()" style="border: none; background: transparent;">
          Continuar navegando
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Fechar ao clicar fora
  modal.addEventListener('click', function(e) {
    if (e.target === modal) fecharModalConfirmacao();
  });
}

// Mostrar modal de confirmação
function mostrarModalConfirmacao(mensagemTitulo = null) {
  criarModalConfirmacao();
  const modal = document.getElementById('modalConfirmacao');
  const btn = document.getElementById('btnContinuarModal');
  const titulo = document.getElementById('modalTituloConfirmacao');
  
  // Se passou um título customizado
  if (mensagemTitulo) {
    titulo.textContent = mensagemTitulo;
  } else {
    titulo.textContent = 'Adicionado ao carrinho!';
  }
  
  // Ajustar texto do botão baseado na página atual
  const pagina = window.location.pathname;
  if (pagina.includes('acais.html')) {
    btn.innerHTML = '<i class="bi bi-plus-circle"></i> MONTAR OUTRO AÇAÍ';
  } else if (pagina.includes('bolos.html')) {
    btn.innerHTML = '<i class="bi bi-plus-circle"></i> VER MAIS BOLOS';
  } else if (pagina.includes('combos.html')) {
    btn.innerHTML = '<i class="bi bi-plus-circle"></i> VER MAIS COMBOS';
  } else {
    btn.innerHTML = '<i class="bi bi-plus-circle"></i> CONTINUAR COMPRANDO';
  }
  
  modal.classList.add('ativo');
}

// Fechar modal
function fecharModalConfirmacao() {
  const modal = document.getElementById('modalConfirmacao');
  if (modal) modal.classList.remove('ativo');
}

// Ir para o carrinho
function irParaCarrinho() {
  window.location.href = 'carrinho.html';
}

// Continuar comprando (do modal) - fica na mesma página
function continuarComprandoModal() {
  fecharModalConfirmacao();
  // Se for açaí, reseta o formulário
  if (typeof resetarFormularioAcai === 'function') {
    resetarFormularioAcai();
  }
  // Scroll pro topo da página
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  criarCarrinhoFlutuante();
});