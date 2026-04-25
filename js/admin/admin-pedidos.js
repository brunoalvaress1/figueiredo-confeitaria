// ============================================
// GERENCIAR PEDIDOS
// ============================================

let todosPedidos = [];
let pedidosFiltrados = [];
let pedidoAtualDetalhes = null;

document.addEventListener('DOMContentLoaded', async function() {
  const session = await verificarAutenticacao();
  if (!session) return;
  
  document.getElementById('sidebarContainer').innerHTML = criarSidebar('pedidos');
  document.getElementById('topbarContainer').innerHTML = criarTopbar('Pedidos', session.user.email);
  
  await carregarPedidos();
  
  // Auto-atualizar a cada 30 segundos (para pegar novos pedidos)
  setInterval(carregarPedidos, 30000);
});

// ============================================
// CARREGAR PEDIDOS
// ============================================
async function carregarPedidos() {
  try {
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    todosPedidos = data || [];
    
    atualizarEstatisticas();
    filtrarPedidos();
    
  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('containerPedidos').innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-exclamation-circle"></i>
        <p>Erro ao carregar pedidos.</p>
      </div>
    `;
  }
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================
function atualizarEstatisticas() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const pedidosHoje = todosPedidos.filter(p => {
    const dataPedido = new Date(p.created_at);
    dataPedido.setHours(0, 0, 0, 0);
    return dataPedido.getTime() === hoje.getTime();
  });
  
  const novos = todosPedidos.filter(p => p.status === 'novo').length;
  const emPreparo = todosPedidos.filter(p => p.status === 'em_preparo').length;
  const entreguesHoje = pedidosHoje.filter(p => p.status === 'entregue').length;
  
  const faturamentoHoje = pedidosHoje
    .filter(p => p.status === 'entregue')
    .reduce((total, p) => total + parseFloat(p.total || 0), 0);
  
  document.getElementById('statNovos').textContent = novos;
  document.getElementById('statPreparo').textContent = emPreparo;
  document.getElementById('statEntregues').textContent = entreguesHoje;
  document.getElementById('statFaturamento').textContent = formatarPrecoAdmin(faturamentoHoje);
}

// ============================================
// FILTRAR PEDIDOS
// ============================================
function filtrarPedidos() {
  const busca = document.getElementById('filtroBusca').value.toLowerCase();
  const status = document.getElementById('filtroStatus').value;
  const periodo = document.getElementById('filtroPeriodo').value;
  
  const agora = new Date();
  let dataLimite = null;
  
  if (periodo === 'hoje') {
    dataLimite = new Date();
    dataLimite.setHours(0, 0, 0, 0);
  } else if (periodo === '7dias') {
    dataLimite = new Date();
    dataLimite.setDate(agora.getDate() - 7);
  } else if (periodo === '30dias') {
    dataLimite = new Date();
    dataLimite.setDate(agora.getDate() - 30);
  }
  
  pedidosFiltrados = todosPedidos.filter(p => {
    // Busca (nome ou telefone)
    const matchBusca = !busca ||
                       (p.cliente_nome && p.cliente_nome.toLowerCase().includes(busca)) ||
                       (p.cliente_telefone && p.cliente_telefone.toLowerCase().includes(busca));
    
    // Status
    const matchStatus = status === 'todos' || p.status === status;
    
    // Período
    let matchPeriodo = true;
    if (dataLimite) {
      const dataPedido = new Date(p.created_at);
      matchPeriodo = dataPedido >= dataLimite;
    }
    
    return matchBusca && matchStatus && matchPeriodo;
  });
  
  renderizarPedidos();
}

// ============================================
// RENDERIZAR LISTA DE PEDIDOS
// ============================================
function renderizarPedidos() {
  const container = document.getElementById('containerPedidos');
  
  if (pedidosFiltrados.length === 0) {
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-bag"></i>
        <p>${todosPedidos.length === 0 ? 'Nenhum pedido recebido ainda.' : 'Nenhum pedido encontrado com esses filtros.'}</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  pedidosFiltrados.forEach((pedido, index) => {
    const dataObj = new Date(pedido.created_at);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' às ' + 
                          dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const numeroPedido = `#${String(todosPedidos.length - todosPedidos.indexOf(pedido)).padStart(4, '0')}`;
    
    const statusClass = pedido.status === 'novo' ? 'novo' :
                        pedido.status === 'em_preparo' ? 'em-preparo' :
                        pedido.status === 'entregue' ? 'entregue' :
                        pedido.status === 'cancelado' ? 'cancelado' : '';
    
    const selectStatusClass = pedido.status === 'novo' ? 'novo' :
                              pedido.status === 'em_preparo' ? 'em_preparo' :
                              pedido.status === 'entregue' ? 'entregue' :
                              pedido.status === 'cancelado' ? 'cancelado' : '';
    
    // Detalhes do local
    let localInfo = '';
    if (pedido.tipo_local === 'casa') {
      localInfo = `<i class="bi bi-house-fill"></i> Casa - ${pedido.endereco || 'Não informado'}`;
    } else if (pedido.tipo_local === 'escola') {
      localInfo = `<i class="bi bi-book"></i> Escola${pedido.escola_nome ? ' - ' + pedido.escola_nome : ''}`;
    } else if (pedido.tipo_local === 'trabalho') {
      localInfo = `<i class="bi bi-briefcase"></i> Trabalho${pedido.trabalho_nome ? ' - ' + pedido.trabalho_nome : ''}`;
    }
    
    // Quantidade de itens
    let qtdItens = 0;
    try {
      const itens = typeof pedido.itens === 'string' ? JSON.parse(pedido.itens) : pedido.itens;
      qtdItens = itens?.length || 0;
    } catch(e) {}
    
    html += `
      <div class="pedido-card ${statusClass}">
        <div class="pedido-header">
          <div>
            <h4 class="pedido-numero">${numeroPedido}</h4>
            <div class="pedido-data">${dataFormatada}</div>
          </div>
          <div style="text-align: right;">
            <div class="pedido-total">${formatarPrecoAdmin(pedido.total)}</div>
            <div style="font-size: 0.8rem; color: var(--texto-claro);">${qtdItens} ${qtdItens === 1 ? 'item' : 'itens'}</div>
          </div>
        </div>
        
        <div class="pedido-info-grid">
          <div class="pedido-info-item">
            <div class="label">👤 Cliente</div>
            <div class="valor"><strong>${pedido.cliente_nome || 'Não informado'}</strong></div>
          </div>
          <div class="pedido-info-item">
            <div class="label">📱 Telefone</div>
            <div class="valor">${pedido.cliente_telefone || 'Não informado'}</div>
          </div>
          <div class="pedido-info-item">
            <div class="label">📍 Entrega</div>
            <div class="valor">${localInfo}</div>
          </div>
          <div class="pedido-info-item">
            <div class="label">💳 Pagamento</div>
            <div class="valor">${formatarPagamento(pedido.forma_pagamento, pedido.troco)}</div>
          </div>
        </div>
        
        <div class="pedido-acoes">
          <select class="select-status ${selectStatusClass}" onchange="alterarStatus('${pedido.id}', this.value)">
            <option value="novo" ${pedido.status === 'novo' ? 'selected' : ''}>🔔 Novo</option>
            <option value="em_preparo" ${pedido.status === 'em_preparo' ? 'selected' : ''}>👨‍🍳 Em preparo</option>
            <option value="entregue" ${pedido.status === 'entregue' ? 'selected' : ''}>✅ Entregue</option>
            <option value="cancelado" ${pedido.status === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
          </select>
          
          <button class="btn-admin secundario pequeno" onclick="abrirDetalhesPedido('${pedido.id}')">
            <i class="bi bi-eye"></i> Ver detalhes
          </button>
          
          ${pedido.cliente_telefone ? `
            <button class="btn-admin pequeno" style="background: #25D366;" onclick="falarComCliente('${pedido.cliente_telefone}', '${pedido.cliente_nome || 'Cliente'}', '${numeroPedido}')">
              <i class="bi bi-whatsapp"></i> WhatsApp
            </button>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  html += `
    <div style="margin-top: 1rem; color: var(--texto-claro); font-size: 0.85rem; text-align: center;">
      Total: <strong>${pedidosFiltrados.length}</strong> ${pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
    </div>
  `;
  
  container.innerHTML = html;
}

// ============================================
// FORMATAR FORMA DE PAGAMENTO
// ============================================
function formatarPagamento(forma, troco) {
  if (!forma) return 'Não informado';
  
  const formas = {
    'dinheiro': `💵 Dinheiro${troco ? ' (troco p/ ' + formatarPrecoAdmin(troco) + ')' : ''}`,
    'pix': '💠 PIX',
    'cartao_credito': '💳 Cartão de crédito',
    'cartao_debito': '💳 Cartão de débito'
  };
  
  return formas[forma] || forma;
}

// ============================================
// ALTERAR STATUS DO PEDIDO
// ============================================
async function alterarStatus(id, novoStatus) {
  try {
    const { error } = await supabaseAdmin
      .from('pedidos')
      .update({ 
        status: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    
    // Atualizar localmente
    const pedido = todosPedidos.find(p => p.id === id);
    if (pedido) pedido.status = novoStatus;
    
    const labels = {
      'novo': 'Novo',
      'em_preparo': 'Em preparo',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado'
    };
    
    mostrarToastAdmin(`Status alterado para: ${labels[novoStatus]}`, 'sucesso');
    
    atualizarEstatisticas();
    renderizarPedidos();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao alterar status', 'erro');
    await carregarPedidos();
  }
}

// ============================================
// ABRIR DETALHES DO PEDIDO
// ============================================
function abrirDetalhesPedido(id) {
  const pedido = todosPedidos.find(p => p.id === id);
  if (!pedido) return;
  
  pedidoAtualDetalhes = pedido;
  
  // Parse dos itens (pode vir como string JSON)
  let itens = [];
  try {
    itens = typeof pedido.itens === 'string' ? JSON.parse(pedido.itens) : (pedido.itens || []);
  } catch(e) {
    itens = [];
  }
  
  const dataObj = new Date(pedido.created_at);
  const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' às ' + 
                        dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  const numeroPedido = `#${String(todosPedidos.length - todosPedidos.indexOf(pedido)).padStart(4, '0')}`;
  
  // Informações do local
  let localHtml = '';
  if (pedido.tipo_local === 'casa') {
    localHtml = `
      <div><strong>🏠 Endereço:</strong> ${pedido.endereco || 'Não informado'}</div>
      ${pedido.referencia ? `<div style="margin-top: 0.3rem;"><strong>📌 Ponto de referência:</strong> ${pedido.referencia}</div>` : ''}
    `;
  } else if (pedido.tipo_local === 'escola') {
    localHtml = `
      <div><strong>🏫 Escola:</strong> ${pedido.escola_nome || 'Não informada'}</div>
      ${pedido.escola_sala ? `<div style="margin-top: 0.3rem;"><strong>🚪 Sala:</strong> ${pedido.escola_sala}</div>` : ''}
    `;
  } else if (pedido.tipo_local === 'trabalho') {
    localHtml = `
      <div><strong>💼 Trabalho:</strong> ${pedido.trabalho_nome || 'Não informado'}</div>
      ${pedido.trabalho_setor ? `<div style="margin-top: 0.3rem;"><strong>🏢 Setor:</strong> ${pedido.trabalho_setor}</div>` : ''}
    `;
  }
  
  // Lista de itens
  let itensHtml = '';
  itens.forEach(item => {
    let ingredientesTexto = '';
    if (item.tipo === 'acai' && item.detalhes && item.detalhes.ingredientes && item.detalhes.ingredientes.length > 0) {
      ingredientesTexto = item.detalhes.ingredientes.map(i => i.nome).join(', ');
    }
    
    itensHtml += `
      <div class="detalhe-item-pedido">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
          <div style="flex: 1;">
            <div class="nome">${item.quantidade}x ${item.nome}</div>
            ${ingredientesTexto ? `<div class="ingredientes">Ingredientes: ${ingredientesTexto}</div>` : ''}
            ${item.tipo === 'bolo' ? '<div style="font-size: 0.75rem; color: var(--texto-claro); margin-top: 0.3rem;">🧁 Bolo de pote</div>' : ''}
            ${item.tipo === 'acai' ? '<div style="font-size: 0.75rem; color: var(--texto-claro); margin-top: 0.3rem;">🍧 Açaí personalizado</div>' : ''}
            ${item.tipo === 'combo' ? '<div style="font-size: 0.75rem; color: var(--texto-claro); margin-top: 0.3rem;">🎁 Combo especial</div>' : ''}
          </div>
          <div class="preco">
            ${formatarPrecoAdmin(item.preco * item.quantidade)}
          </div>
        </div>
      </div>
    `;
  });
  
  if (itensHtml === '') {
    itensHtml = '<div style="color: var(--texto-claro); text-align: center; padding: 1rem;">Sem itens registrados</div>';
  }
  
  // Subtotal e taxa
  const subtotal = parseFloat(pedido.subtotal || 0);
  const taxaEntrega = parseFloat(pedido.taxa_entrega || 0);
  const total = parseFloat(pedido.total || 0);
  
  const conteudo = `
    <!-- Número e data -->
    <div style="background: var(--rosa-claro); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem; text-align: center;">
      <div style="color: var(--rosa-principal); font-weight: 700; font-size: 1.3rem;">${numeroPedido}</div>
      <div style="color: var(--texto-medio); font-size: 0.85rem; margin-top: 0.2rem;">${dataFormatada}</div>
      <div style="margin-top: 0.6rem;">
        <span class="badge-status ${pedido.status === 'novo' ? 'badge-destaque' : pedido.status === 'cancelado' ? 'badge-inativo' : 'badge-ativo'}">
          ${pedido.status === 'novo' ? '🔔 Novo' : 
            pedido.status === 'em_preparo' ? '👨‍🍳 Em preparo' :
            pedido.status === 'entregue' ? '✅ Entregue' : '❌ Cancelado'}
        </span>
      </div>
    </div>
    
    <!-- Cliente -->
    <div style="margin-bottom: 1.5rem;">
      <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--rosa-principal);">
        <i class="bi bi-person-fill"></i> Cliente
      </h4>
      <div style="background: var(--cinza-fundo); padding: 0.8rem 1rem; border-radius: var(--radius-sm); font-size: 0.9rem;">
        <div><strong>Nome:</strong> ${pedido.cliente_nome || 'Não informado'}</div>
        ${pedido.cliente_telefone ? `<div style="margin-top: 0.3rem;"><strong>Telefone:</strong> ${pedido.cliente_telefone}</div>` : ''}
      </div>
    </div>
    
    <!-- Local de entrega -->
    <div style="margin-bottom: 1.5rem;">
      <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--rosa-principal);">
        <i class="bi bi-geo-alt-fill"></i> Local de Entrega
      </h4>
      <div style="background: var(--cinza-fundo); padding: 0.8rem 1rem; border-radius: var(--radius-sm); font-size: 0.9rem;">
        ${localHtml}
      </div>
    </div>
    
    <!-- Itens -->
    <div style="margin-bottom: 1.5rem;">
      <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--rosa-principal);">
        <i class="bi bi-basket-fill"></i> Itens do Pedido
      </h4>
      ${itensHtml}
    </div>
    
    <!-- Pagamento -->
    <div style="margin-bottom: 1.5rem;">
      <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--rosa-principal);">
        <i class="bi bi-credit-card-fill"></i> Pagamento
      </h4>
      <div style="background: var(--cinza-fundo); padding: 0.8rem 1rem; border-radius: var(--radius-sm); font-size: 0.9rem;">
        <div>${formatarPagamento(pedido.forma_pagamento, pedido.troco)}</div>
      </div>
    </div>
    
    <!-- Observações -->
    ${pedido.observacoes ? `
      <div style="margin-bottom: 1.5rem;">
        <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--rosa-principal);">
          <i class="bi bi-chat-left-text-fill"></i> Observações
        </h4>
        <div style="background: #FFF8E1; padding: 0.8rem 1rem; border-radius: var(--radius-sm); font-size: 0.9rem; border-left: 3px solid #F9A825;">
          ${pedido.observacoes}
        </div>
      </div>
    ` : ''}
    
        <!-- Resumo financeiro -->
    <div style="background: var(--rosa-claro); padding: 1rem 1.5rem; border-radius: var(--radius-sm); margin-top: 1rem;">
      <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; font-size: 0.9rem;">
        <span>Subtotal:</span>
        <span>${formatarPrecoAdmin(subtotal)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; font-size: 0.9rem;">
        <span>Taxa de entrega:</span>
        <span>${taxaEntrega > 0 ? formatarPrecoAdmin(taxaEntrega) : 'Grátis'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 0.6rem 0 0; margin-top: 0.5rem; border-top: 1px dashed var(--rosa-medio); font-size: 1.1rem; font-weight: 700; color: var(--rosa-principal);">
        <span>TOTAL:</span>
        <span>${formatarPrecoAdmin(total)}</span>
      </div>
    </div>
  `;
  
  document.getElementById('conteudoDetalhes').innerHTML = conteudo;
  document.getElementById('tituloDetalhes').innerHTML = `<i class="bi bi-bag"></i> Pedido ${numeroPedido}`;
  
  // Configurar botão de WhatsApp
  const btnWhats = document.getElementById('btnWhatsAppCliente');
  if (pedido.cliente_telefone) {
    btnWhats.style.display = 'inline-flex';
    btnWhats.onclick = () => falarComCliente(pedido.cliente_telefone, pedido.cliente_nome, numeroPedido);
  } else {
    btnWhats.style.display = 'none';
  }
  
  document.getElementById('modalDetalhes').classList.add('ativo');
}

// ============================================
// FECHAR MODAL DETALHES
// ============================================
function fecharModalDetalhes() {
  document.getElementById('modalDetalhes').classList.remove('ativo');
  pedidoAtualDetalhes = null;
}

// ============================================
// FALAR COM CLIENTE VIA WHATSAPP
// ============================================
function falarComCliente(telefone, nome, numeroPedido) {
  // Limpar telefone (só números)
  let tel = String(telefone).replace(/\D/g, '');
  
  // Se não começar com 55, adiciona
  if (!tel.startsWith('55')) {
    tel = '55' + tel;
  }
  
  const nomeCliente = nome || 'Cliente';
  const mensagem = encodeURIComponent(
    `Olá ${nomeCliente}! 👋\n\nAqui é da *Figueiredo Confeitaria*.\n\nEstou entrando em contato sobre o seu pedido ${numeroPedido}.`
  );
  
  window.open(`https://wa.me/${tel}?text=${mensagem}`, '_blank');
}