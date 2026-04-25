// ============================================
// SCRIPT PRINCIPAL DO SITE
// ============================================

// Quando a página carregar completamente
document.addEventListener('DOMContentLoaded', function() {
  carregarConfiguracoes();
  
  // Se estiver na home, carregar os bolos em destaque
  if (document.getElementById('listaBolosHome')) {
    carregarBolosHome();
  }
});

// ============================================
// CARREGAR CONFIGURAÇÕES DA LOJA
// ============================================
async function carregarConfiguracoes() {
  const config = await buscarConfiguracoes();
  
  // Instagram (navbar)
  const linkInstagram = document.getElementById('linkInstagram');
  const textoInstagram = document.getElementById('textoInstagram');
  if (linkInstagram && config.instagram_link) {
    linkInstagram.href = config.instagram_link;
  }
  if (textoInstagram && config.instagram) {
    textoInstagram.textContent = config.instagram;
  }
  
  // Botão "Fazer Pedido" abre WhatsApp
  const btnFazerPedido = document.getElementById('btnFazerPedido');
  if (btnFazerPedido && config.whatsapp) {
    const mensagem = encodeURIComponent('Olá! Gostaria de fazer um pedido.');
    btnFazerPedido.href = `https://wa.me/${config.whatsapp}?text=${mensagem}`;
    btnFazerPedido.target = '_blank';
  }
  
  // Footer
  const footerWhatsapp = document.getElementById('footerWhatsapp');
  if (footerWhatsapp && config.whatsapp_formatado) {
    footerWhatsapp.textContent = config.whatsapp_formatado;
  }
  
  const footerInstagram = document.getElementById('footerInstagram');
  if (footerInstagram && config.instagram) {
    footerInstagram.textContent = config.instagram;
  }
  
  const footerEndereco = document.getElementById('footerEndereco');
  if (footerEndereco && config.endereco) {
    footerEndereco.textContent = config.endereco;
  }
}

// ============================================
// CARREGAR BOLOS NA HOME
// ============================================
async function carregarBolosHome() {
  const container = document.getElementById('listaBolosHome');
  const bolos = await buscarBolosDestaque();
  
  if (bolos.length === 0) {
    container.innerHTML = '<div class="col-12 text-center py-4 text-muted">Nenhum bolo disponível no momento.</div>';
    return;
  }
  
  // Montar o HTML dos cards
  let html = '';
  bolos.forEach(bolo => {
    const imagem = bolo.imagem_url || 'imagens/bolo-placeholder.png';
    html += `
      <div class="col-6 col-md-3">
        <div class="card-produto">
          <img src="${imagem}" alt="${bolo.nome}" class="card-produto-imagem">
          <div class="card-produto-corpo">
            <h4 class="card-produto-nome">${bolo.nome}</h4>
            <p class="card-produto-descricao">${bolo.descricao || ''}</p>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}


// ============================================
// SALVAR ÚLTIMA PÁGINA DE COMPRA VISITADA
// ============================================
// Isso ajuda o botão "Continuar comprando" a voltar pra página certa

(function() {
  // Páginas que são consideradas "páginas de compra"
  const paginasDeCompra = ['acais.html', 'bolos.html', 'combos.html'];
  
  // Pega o nome da página atual
  const paginaAtual = window.location.pathname.split('/').pop();
  
  // Se estiver em uma página de compra, salva no sessionStorage
  if (paginasDeCompra.includes(paginaAtual)) {
    sessionStorage.setItem('ultima_pagina_compra', paginaAtual);
  }
})();