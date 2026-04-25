// ============================================
// CHECKOUT - 4 ETAPAS
// ============================================

let configLoja = {};
let localSelecionado = 'Escola';
let dadosEndereco = {};

document.addEventListener('DOMContentLoaded', async function() {
  configLoja = await buscarConfiguracoes();
  renderizarItensCheckout();
});

// Trocar entre etapas
function irParaEtapa(numero) {
  document.querySelectorAll('.checkout-container').forEach(c => c.classList.add('d-none'));
  document.getElementById(`etapa${numero}`).classList.remove('d-none');
  window.scrollTo(0, 0);
  
  if (numero === 3) renderizarResumoFinal();
  if (numero === 4) renderizarPreviaMensagem();
}

// Renderizar itens (etapa 1)
function renderizarItensCheckout() {
  const container = document.getElementById('itensCheckout');
  const vazio = document.getElementById('checkoutVazio');
  const rodape = document.getElementById('rodapeCarrinho');
  const carrinho = getCarrinho();
  
  if (carrinho.length === 0) {
    container.innerHTML = '';
    vazio.classList.remove('d-none');
    rodape.classList.add('d-none');
    return;
  }
  
  vazio.classList.add('d-none');
  rodape.classList.remove('d-none');
  
  let html = '';
  carrinho.forEach(item => {
    const tipoNome = { 'bolo': 'Bolo de pote', 'acai': 'Açaí', 'combo': 'Combo' }[item.tipo] || '';
    html += `
      <div class="item-carrinho">
        <img src="${item.imagem}" alt="${item.nome}">
        <div class="item-carrinho-info">
          <div class="item-carrinho-nome">${item.nome}</div>
          <div class="item-carrinho-tipo">${tipoNome}</div>
          <div class="item-carrinho-preco">${formatarPreco(item.preco)}</div>
          <div class="controle-quantidade">
            <button class="btn-qtd" onclick="alterarQtdCheckout('${item.id}', -1)">−</button>
            <span>${item.quantidade}</span>
            <button class="btn-qtd" onclick="alterarQtdCheckout('${item.id}', 1)">+</button>
            <button class="btn-lixeira ms-auto" onclick="removerItemCheckout('${item.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  document.getElementById('subtotalEtapa1').textContent = formatarPreco(calcularSubtotal());
}

function alterarQtdCheckout(id, delta) {
  alterarQuantidade(id, delta);
  renderizarItensCheckout();
}

function removerItemCheckout(id) {
  removerDoCarrinho(id);
  renderizarItensCheckout();
}

// Selecionar local
function selecionarLocal(elemento, nome) {
  document.querySelectorAll('.opcao-local').forEach(o => o.classList.remove('selecionada'));
  elemento.classList.add('selecionada');
  elemento.querySelector('input').checked = true;
  localSelecionado = nome;
}

// Validar endereço
function validarEndereco() {
  const nomeLocal = document.getElementById('nomeLocal').value.trim();
  const endereco = document.getElementById('enderecoCompleto').value.trim();
  
  if (!nomeLocal || !endereco) {
    mostrarToast('Preencha o nome do local e o endereço!');
    return;
  }
  
  dadosEndereco = {
    tipo: localSelecionado,
    nome_local: nomeLocal,
    ponto_referencia: document.getElementById('pontoReferencia').value.trim(),
    endereco_completo: endereco,
    observacoes: document.getElementById('observacoes').value.trim()
  };
  
  irParaEtapa(3);
}

// Renderizar resumo (etapa 3)
function renderizarResumoFinal() {
  const container = document.getElementById('itensResumo');
  const carrinho = getCarrinho();
  
  let html = '';
  carrinho.forEach(item => {
    const tipoNome = { 'bolo': 'Bolo de pote', 'acai': 'Açaí', 'combo': 'Combo' }[item.tipo] || '';
    html += `
      <div class="d-flex gap-3 mb-3 align-items-center">
        <img src="${item.imagem}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
        <div class="flex-grow-1">
          <div style="font-weight: 600; font-size: 0.9rem;">${item.nome}</div>
          <div style="font-size: 0.8rem; color: var(--texto-medio);">${tipoNome}</div>
        </div>
        <div class="text-end">
          <div style="color: var(--rosa-principal); font-weight: 600; font-size: 0.9rem;">${formatarPreco(item.preco)}</div>
          <small class="text-muted">x${item.quantidade}</small>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  const subtotal = calcularSubtotal();
  const taxa = parseFloat(configLoja.taxa_entrega || 5);
  const total = subtotal + taxa;
  
  document.getElementById('subtotalEtapa3').textContent = formatarPreco(subtotal);
  document.getElementById('taxaEntregaEtapa3').textContent = formatarPreco(taxa);
  document.getElementById('totalEtapa3').textContent = formatarPreco(total);
  
  document.getElementById('enderecoResumo').innerHTML = `
    <strong>${dadosEndereco.nome_local}</strong><br>
    ${dadosEndereco.endereco_completo}<br>
    ${dadosEndereco.observacoes ? dadosEndereco.observacoes : ''}
  `;
}

// Prévia da mensagem (etapa 4)
function renderizarPreviaMensagem() {
  const mensagem = montarMensagemWhatsApp();
  document.getElementById('previaMensagem').innerHTML = mensagem.replace(/\n/g, '<br>');
}

// Montar mensagem do WhatsApp (ATUALIZADA)
function montarMensagemWhatsApp() {
  const carrinho = getCarrinho();
  const subtotal = calcularSubtotal();
  const taxa = parseFloat(configLoja.taxa_entrega || 5);
  const total = subtotal + taxa;
  
  let msg = 'Olá! Gostaria de fazer um pedido:\n\n';
  msg += '🛒 *ITENS DO PEDIDO*\n';
  
  carrinho.forEach(item => {
    msg += `\n• ${item.quantidade}x ${item.nome} - ${formatarPreco(item.preco * item.quantidade)}\n`;
    
    // Se for açaí, detalhar tudo
    if (item.detalhes && item.detalhes.ingredientes) {
      if (item.detalhes.ingredientes.length > 0) {
        msg += `   _Ingredientes:_\n`;
        item.detalhes.ingredientes.forEach(ing => {
          const precoIng = parseFloat(ing.preco) > 0 
            ? ` (+${formatarPreco(ing.preco)})` 
            : '';
          msg += `   - ${ing.nome}${precoIng}\n`;
        });
      } else {
        msg += `   _Sem ingredientes extras_\n`;
      }
    }
  });
  
  msg += `\n💰 *RESUMO*\n`;
  msg += `Subtotal: ${formatarPreco(subtotal)}\n`;
  msg += `Taxa de entrega: ${formatarPreco(taxa)}\n`;
  msg += `*Total: ${formatarPreco(total)}*\n\n`;
  
  msg += `📍 *ENDEREÇO DE ENTREGA*\n`;
  msg += `${dadosEndereco.nome_local}\n`;
  msg += `${dadosEndereco.endereco_completo}\n`;
  if (dadosEndereco.ponto_referencia) {
    msg += `Ponto de referência: ${dadosEndereco.ponto_referencia}\n`;
  }
  if (dadosEndereco.observacoes) {
    msg += `Observação: ${dadosEndereco.observacoes}\n`;
  }
  
  msg += `\nAguardo confirmação, obrigado(a)! 💜`;
  
  return msg;
}

// Enviar WhatsApp
async function enviarWhatsApp() {
  const mensagem = montarMensagemWhatsApp();
  const numeroWhats = configLoja.whatsapp || '5519993014791';
  
  // Salvar pedido no banco (opcional)
  await salvarPedidoNoBanco();
  
  // Abrir WhatsApp
  const url = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
  
  // Limpar carrinho depois de 2 segundos
  setTimeout(() => {
    limparCarrinho();
    window.location.href = 'index.html';
  }, 2000);
}

// Salvar pedido no Supabase
async function salvarPedidoNoBanco() {
  try {
    const carrinho = getCarrinho();
    const subtotal = calcularSubtotal();
    const taxa = parseFloat(configLoja.taxa_entrega || 5);
    const total = subtotal + taxa;
    
    await supabaseClient.from('pedidos').insert({
      cliente_nome: dadosEndereco.nome_local,
      tipo_local: dadosEndereco.tipo,
      nome_local: dadosEndereco.nome_local,
      endereco_completo: dadosEndereco.endereco_completo,
      ponto_referencia: dadosEndereco.ponto_referencia,
      observacoes: dadosEndereco.observacoes,
      itens: carrinho,
      subtotal: subtotal,
      taxa_entrega: taxa,
      total: total,
      status: 'novo'
    });
  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
  }
}

// ============================================
// CONTINUAR COMPRANDO (botão do carrinho)
// ============================================
function continuarComprando() {
  const carrinho = getCarrinho();
  
  // Se o carrinho tiver apenas açaís, volta para a página de açaí
  // Se tiver bolos, volta para bolos
  // Caso misto ou vazio, volta pra home
  
  if (carrinho.length === 0) {
    window.location.href = 'index.html';
    return;
  }
  
  // Analisar o que tem no carrinho
  const temAcai = carrinho.some(i => i.tipo === 'acai');
  const temBolo = carrinho.some(i => i.tipo === 'bolo');
  const temCombo = carrinho.some(i => i.tipo === 'combo');
  
  // Verificar qual foi a ÚLTIMA página visitada (salva em sessionStorage)
  const ultimaPagina = sessionStorage.getItem('ultima_pagina_compra');
  
  if (ultimaPagina) {
    window.location.href = ultimaPagina;
    return;
  }
  
  // Se só tem uma categoria, vai pra ela
  if (temAcai && !temBolo && !temCombo) {
    window.location.href = 'acais.html';
  } else if (temBolo && !temAcai && !temCombo) {
    window.location.href = 'bolos.html';
  } else if (temCombo && !temAcai && !temBolo) {
    window.location.href = 'combos.html';
  } else {
    // Misto: volta pra home
    window.location.href = 'index.html';
  }
}