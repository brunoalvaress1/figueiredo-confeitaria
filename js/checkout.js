// ============================================
// CHECKOUT - Controle das etapas do pedido
// ============================================

// Ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
  carregarEtapa1();
  restaurarDadosSalvos();
});

// ============================================
// NAVEGAR ENTRE ETAPAS
// ============================================
function irParaEtapa(numero) {
  // Esconder todas
  for (let i = 1; i <= 5; i++) {
    const etapa = document.getElementById('etapa' + i);
    if (etapa) etapa.classList.add('d-none');
  }
  
  // Mostrar a atual
  const etapaAtual = document.getElementById('etapa' + numero);
  if (etapaAtual) etapaAtual.classList.remove('d-none');
  
  // Rolar pro topo
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Ações específicas de cada etapa
  if (numero === 1) carregarEtapa1();
  if (numero === 4) carregarResumo();
  if (numero === 5) gerarPreviaMensagem();
}

// ============================================
// ETAPA 1: CARRINHO
// ============================================
function carregarEtapa1() {
  const carrinho = obterCarrinho();
  const container = document.getElementById('itensCheckout');
  const vazio = document.getElementById('checkoutVazio');
  const rodape = document.getElementById('rodapeCarrinho');
  
  if (!carrinho || carrinho.length === 0) {
    container.innerHTML = '';
    vazio.classList.remove('d-none');
    rodape.style.display = 'none';
    return;
  }
  
  vazio.classList.add('d-none');
  rodape.style.display = 'block';
  
  let html = '';
  carrinho.forEach((item, index) => {
    const precoTotal = parseFloat(item.preco) * item.quantidade;
    
    let detalhesHtml = '';
    if (item.tipo === 'acai' && item.detalhes?.ingredientes?.length > 0) {
      const nomes = item.detalhes.ingredientes.map(i => i.nome).join(', ');
      detalhesHtml = `<div class="item-ingredientes">🍓 ${nomes}</div>`;
    }
    
        html += `
      <div class="item-checkout">
        <img src="${item.imagem || 'https://via.placeholder.com/60'}" alt="${item.nome}" onerror="this.src='https://via.placeholder.com/60'">
        <div class="item-checkout-info">
          <h5>${item.nome}</h5>
          ${detalhesHtml}
          <div class="item-checkout-controles">
            <button class="btn-qtd" onclick="alterarQuantidade(${index}, -1)">−</button>
            <span class="qtd">${item.quantidade}</span>
            <button class="btn-qtd" onclick="alterarQuantidade(${index}, 1)">+</button>
            <span class="preco-item">R$ ${precoTotal.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <button class="btn-remover" onclick="removerItem(${index})" title="Remover">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Atualizar subtotal
  const subtotal = carrinho.reduce((total, item) => total + (parseFloat(item.preco) * item.quantidade), 0);
  document.getElementById('subtotalEtapa1').textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
}

// ============================================
// ALTERAR QUANTIDADE
// ============================================
function alterarQuantidade(index, delta) {
  const carrinho = obterCarrinho();
  if (!carrinho[index]) return;
  
  carrinho[index].quantidade += delta;
  
  if (carrinho[index].quantidade <= 0) {
    carrinho.splice(index, 1);
  }
  
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  carregarEtapa1();
  
  if (typeof atualizarContadorCarrinho === 'function') {
    atualizarContadorCarrinho();
  }
}

// ============================================
// REMOVER ITEM
// ============================================
function removerItem(index) {
  if (!confirm('Remover este item do carrinho?')) return;
  
  const carrinho = obterCarrinho();
  carrinho.splice(index, 1);
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  carregarEtapa1();
  
  if (typeof atualizarContadorCarrinho === 'function') {
    atualizarContadorCarrinho();
  }
}

// ============================================
// CONTINUAR COMPRANDO
// ============================================
function continuarComprando() {
  window.location.href = 'index.html';
}

// ============================================
// OBTER CARRINHO
// ============================================
function obterCarrinho() {
  try {
    return JSON.parse(localStorage.getItem('carrinho') || '[]');
  } catch {
    return [];
  }
}

// ============================================
// ETAPA 2: ENDEREÇO
// ============================================
function selecionarLocal(elemento, tipo) {
  document.querySelectorAll('.opcao-local').forEach(o => o.classList.remove('selecionada'));
  elemento.classList.add('selecionada');
  elemento.querySelector('input[type="radio"]').checked = true;
}

function validarEndereco() {
  const nome = document.getElementById('nomeCliente').value.trim();
  const telefone = document.getElementById('telefoneCliente').value.trim();
  const endereco = document.getElementById('enderecoCompleto').value.trim();
  
  if (!nome) {
    alert('Por favor, informe seu nome.');
    document.getElementById('nomeCliente').focus();
    return;
  }
  
  if (!telefone) {
    alert('Por favor, informe seu telefone.');
    document.getElementById('telefoneCliente').focus();
    return;
  }
  
  if (!endereco) {
    alert('Por favor, informe o endereço completo.');
    document.getElementById('enderecoCompleto').focus();
    return;
  }
  
  // Salvar dados
  const dados = {
    cliente_nome: nome,
    cliente_telefone: telefone,
    tipo_local: document.querySelector('input[name="local"]:checked')?.value || 'Casa',
    nome_local: document.getElementById('nomeLocal').value.trim(),
    ponto_referencia: document.getElementById('pontoReferencia').value.trim(),
    endereco: endereco,
    observacoes: document.getElementById('observacoes').value.trim()
  };
  
  localStorage.setItem('dadosPedido', JSON.stringify(dados));
  irParaEtapa(3);
}

// ============================================
// ETAPA 3: PAGAMENTO (NOVA!)
// ============================================
function selecionarPagamento(forma) {
  // Marcar radio
  const radio = document.getElementById('pag_' + forma);
  if (radio) radio.checked = true;
  
  // Mostrar/esconder campo de troco
  const campoTroco = document.getElementById('campoTroco');
  if (campoTroco) {
    campoTroco.style.display = (forma === 'dinheiro') ? 'block' : 'none';
  }
  
  // Salvar imediatamente
  const dadosPedido = JSON.parse(localStorage.getItem('dadosPedido') || '{}');
  dadosPedido.forma_pagamento = forma;
  localStorage.setItem('dadosPedido', JSON.stringify(dadosPedido));
}

function validarPagamento() {
  const formaSelecionada = document.querySelector('input[name="formaPagamento"]:checked');
  
  if (!formaSelecionada) {
    alert('Por favor, selecione uma forma de pagamento.');
    return;
  }
  
  // Salvar dados de pagamento
  const dadosPedido = JSON.parse(localStorage.getItem('dadosPedido') || '{}');
  dadosPedido.forma_pagamento = formaSelecionada.value;
  
  // Se for dinheiro, pegar valor do troco
  if (formaSelecionada.value === 'dinheiro') {
    const valorTroco = document.getElementById('valorTroco').value;
    dadosPedido.troco = valorTroco ? parseFloat(valorTroco) : null;
  } else {
    dadosPedido.troco = null;
  }
  
  localStorage.setItem('dadosPedido', JSON.stringify(dadosPedido));
  irParaEtapa(4);
}

// ============================================
// RESTAURAR DADOS SALVOS (ao recarregar página)
// ============================================
function restaurarDadosSalvos() {
  try {
    const dados = JSON.parse(localStorage.getItem('dadosPedido') || '{}');
    
    // Endereço
    if (dados.cliente_nome) document.getElementById('nomeCliente').value = dados.cliente_nome;
    if (dados.cliente_telefone) document.getElementById('telefoneCliente').value = dados.cliente_telefone;
    if (dados.nome_local) document.getElementById('nomeLocal').value = dados.nome_local;
    if (dados.ponto_referencia) document.getElementById('pontoReferencia').value = dados.ponto_referencia;
    if (dados.endereco) document.getElementById('enderecoCompleto').value = dados.endereco;
    if (dados.observacoes) document.getElementById('observacoes').value = dados.observacoes;
    
    // Tipo de local
    if (dados.tipo_local) {
      const radio = document.querySelector(`input[name="local"][value="${dados.tipo_local}"]`);
      if (radio) {
        document.querySelectorAll('.opcao-local').forEach(o => o.classList.remove('selecionada'));
        radio.checked = true;
        radio.closest('.opcao-local').classList.add('selecionada');
      }
    }
    
    // Pagamento
    if (dados.forma_pagamento) {
      selecionarPagamento(dados.forma_pagamento);
      if (dados.troco && dados.forma_pagamento === 'dinheiro') {
        document.getElementById('valorTroco').value = dados.troco;
      }
    }
  } catch (e) {
    console.warn('Erro ao restaurar dados:', e);
  }
}

// ============================================
// ETAPA 4: RESUMO
// ============================================
function carregarResumo() {
  const carrinho = obterCarrinho();
  const dados = JSON.parse(localStorage.getItem('dadosPedido') || '{}');
  
  // Lista de itens
  let htmlItens = '';
  carrinho.forEach(item => {
    let detalhesTexto = '';
    if (item.tipo === 'acai' && item.detalhes?.ingredientes?.length > 0) {
      detalhesTexto = `<small class="d-block text-muted">🍓 ${item.detalhes.ingredientes.map(i => i.nome).join(', ')}</small>`;
    }
    
    htmlItens += `
      <div class="resumo-linha" style="padding: 0.5rem 0; border-bottom: 1px dashed var(--borda);">
        <div>
          <strong>${item.quantidade}x ${item.nome}</strong>
          ${detalhesTexto}
        </div>
        <span style="white-space: nowrap;">R$ ${(parseFloat(item.preco) * item.quantidade).toFixed(2).replace('.', ',')}</span>
      </div>
    `;
  });
  document.getElementById('itensResumo').innerHTML = htmlItens;
  
  // Totais
  const subtotal = carrinho.reduce((t, i) => t + (parseFloat(i.preco) * i.quantidade), 0);
  const taxaEntrega = 5.00; // Pode pegar das configurações depois
  const total = subtotal + taxaEntrega;
  
  document.getElementById('subtotalEtapa4').textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
  document.getElementById('taxaEntregaEtapa4').textContent = 'R$ ' + taxaEntrega.toFixed(2).replace('.', ',');
  document.getElementById('totalEtapa4').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
  
  // Endereço no resumo
  let enderecoHtml = `<strong>${dados.cliente_nome || ''}</strong> - ${dados.cliente_telefone || ''}<br>`;
  enderecoHtml += `<strong>${dados.tipo_local || 'Casa'}</strong>`;
  if (dados.nome_local) enderecoHtml += ` - ${dados.nome_local}`;
  enderecoHtml += `<br>${dados.endereco || ''}`;
  if (dados.ponto_referencia) enderecoHtml += `<br><small class="text-muted">📌 ${dados.ponto_referencia}</small>`;
  if (dados.observacoes) enderecoHtml += `<br><small class="text-muted">📝 ${dados.observacoes}</small>`;
  document.getElementById('enderecoResumo').innerHTML = enderecoHtml;
  
    // Pagamento no resumo
  const formas = {
    'pix': { icone: '💠', nome: 'PIX' },
    'dinheiro': { icone: '💵', nome: 'Dinheiro' },
    'cartao_credito': { icone: '💳', nome: 'Cartão de Crédito' },
    'cartao_debito': { icone: '💳', nome: 'Cartão de Débito' }
  };
  
  const forma = formas[dados.forma_pagamento] || { icone: '❓', nome: 'Não informado' };
  let pagamentoHtml = `${forma.icone} <strong>${forma.nome}</strong>`;
  
  if (dados.forma_pagamento === 'dinheiro' && dados.troco) {
    pagamentoHtml += `<br><small class="text-muted">💰 Troco para: R$ ${parseFloat(dados.troco).toFixed(2).replace('.', ',')}</small>`;
  }
  
  document.getElementById('pagamentoResumo').innerHTML = pagamentoHtml;
}

// ============================================
// ETAPA 5: GERAR MENSAGEM WHATSAPP
// ============================================
function gerarPreviaMensagem() {
  const mensagem = montarMensagemWhatsApp();
  document.getElementById('previaMensagem').innerHTML = mensagem.replace(/\n/g, '<br>');
}

function montarMensagemWhatsApp() {
  const carrinho = obterCarrinho();
  const dados = JSON.parse(localStorage.getItem('dadosPedido') || '{}');
  
  const subtotal = carrinho.reduce((t, i) => t + (parseFloat(i.preco) * i.quantidade), 0);
  const taxaEntrega = 5.00;
  const total = subtotal + taxaEntrega;
  
  let msg = '🛍️ *NOVO PEDIDO* 🛍️\n\n';
  msg += '👤 *Cliente:*\n';
  msg += `Nome: ${dados.cliente_nome || 'Não informado'}\n`;
  msg += `Telefone: ${dados.cliente_telefone || 'Não informado'}\n\n`;
  
  msg += '📍 *Local de entrega:*\n';
  msg += `${dados.tipo_local || 'Casa'}`;
  if (dados.nome_local) msg += ` - ${dados.nome_local}`;
  msg += `\n${dados.endereco || ''}\n`;
  if (dados.ponto_referencia) msg += `📌 Referência: ${dados.ponto_referencia}\n`;
  msg += '\n';
  
  msg += '🛒 *ITENS DO PEDIDO:*\n';
  carrinho.forEach(item => {
    const precoTotal = (parseFloat(item.preco) * item.quantidade).toFixed(2).replace('.', ',');
    msg += `\n• ${item.quantidade}x ${item.nome} - R$ ${precoTotal}`;
    
    if (item.tipo === 'acai' && item.detalhes?.ingredientes?.length > 0) {
      const nomes = item.detalhes.ingredientes.map(i => i.nome).join(', ');
      msg += `\n  🍓 Ingredientes: ${nomes}`;
    }
  });
  
  msg += '\n\n💰 *RESUMO FINANCEIRO:*\n';
  msg += `Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
  msg += `Taxa de entrega: R$ ${taxaEntrega.toFixed(2).replace('.', ',')}\n`;
  msg += `*TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;
  
  // Forma de pagamento
  const formas = {
    'pix': '💠 PIX',
    'dinheiro': '💵 Dinheiro',
    'cartao_credito': '💳 Cartão de Crédito',
    'cartao_debito': '💳 Cartão de Débito'
  };
  
  msg += '💳 *Forma de pagamento:*\n';
  msg += `${formas[dados.forma_pagamento] || 'Não informado'}\n`;
  
  if (dados.forma_pagamento === 'dinheiro' && dados.troco) {
    msg += `💰 Troco para: R$ ${parseFloat(dados.troco).toFixed(2).replace('.', ',')}\n`;
  }
  
  if (dados.observacoes) {
    msg += `\n📝 *Observações:*\n${dados.observacoes}\n`;
  }
  
  msg += '\n_Pedido feito pelo site_ ✨';
  
  return msg;
}

// ============================================
// ENVIAR PEDIDO VIA WHATSAPP
// ============================================
async function enviarWhatsApp() {
  try {
    // Salvar pedido no banco antes
    await salvarPedidoNoBanco();
    
    // Pegar WhatsApp das configurações
    let numeroWhats = '5519993014791'; // padrão
    try {
      if (typeof supabaseClient !== 'undefined') {
        const { data } = await supabaseClient
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'whatsapp')
          .single();
        if (data?.valor) numeroWhats = data.valor;
      }
    } catch (e) {
      console.warn('Usando WhatsApp padrão');
    }
    
    const mensagem = montarMensagemWhatsApp();
    const urlWhats = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;
    
    // Abrir WhatsApp
    window.open(urlWhats, '_blank');
    
    // Limpar carrinho após enviar
    setTimeout(() => {
      if (confirm('Pedido enviado! Deseja limpar o carrinho?')) {
        localStorage.removeItem('carrinho');
        localStorage.removeItem('dadosPedido');
        window.location.href = 'index.html';
      }
    }, 2000);
    
  } catch (error) {
    console.error('Erro ao enviar pedido:', error);
    alert('Erro ao processar pedido. Tente novamente.');
  }
}

// ============================================
// SALVAR PEDIDO NO BANCO (Supabase)
// ============================================
async function salvarPedidoNoBanco() {
  try {
    if (typeof supabaseClient === 'undefined') {
      console.warn('Supabase não configurado - pedido não será salvo no banco');
      return;
    }
    
    const carrinho = obterCarrinho();
    const dados = JSON.parse(localStorage.getItem('dadosPedido') || '{}');
    
    const subtotal = carrinho.reduce((t, i) => t + (parseFloat(i.preco) * i.quantidade), 0);
    const taxaEntrega = 5.00;
    const total = subtotal + taxaEntrega;
    
    // Montar objeto do pedido
    const pedido = {
      cliente_nome: dados.cliente_nome || null,
      cliente_telefone: dados.cliente_telefone || null,
      tipo_local: dados.tipo_local || null,
      endereco: dados.endereco || null,
      referencia: dados.ponto_referencia || null,
      escola_nome: dados.tipo_local === 'Escola' ? dados.nome_local : null,
      trabalho_nome: dados.tipo_local === 'Trabalho' ? dados.nome_local : null,
      itens: JSON.stringify(carrinho),
      subtotal: subtotal,
      taxa_entrega: taxaEntrega,
      total: total,
      forma_pagamento: dados.forma_pagamento || null,
      troco: dados.troco || null,
      observacoes: dados.observacoes || null,
      status: 'novo'
    };
    
    const { error } = await supabaseClient
      .from('pedidos')
      .insert(pedido);
    
    if (error) {
      console.error('Erro ao salvar pedido:', error);
    } else {
      console.log('✅ Pedido salvo no banco!');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}