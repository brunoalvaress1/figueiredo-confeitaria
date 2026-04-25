// ============================================
// DASHBOARD (PAINEL PRINCIPAL)
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
  // Verificar se está logado
  const session = await verificarAutenticacao();
  if (!session) return;
  
  // Injetar sidebar e topbar
  document.getElementById('sidebarContainer').innerHTML = criarSidebar('painel');
  document.getElementById('topbarContainer').innerHTML = criarTopbar('Dashboard', session.user.email);
  
  // Mostrar data atual formatada
  exibirDataAtual();
  
  // Carregar dados
  carregarEstatisticas();
  carregarUltimosPedidos();
  verificarAvisos();
});

// ============================================
// EXIBIR DATA ATUAL
// ============================================
function exibirDataAtual() {
  const hoje = new Date();
  const opcoes = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const dataFormatada = hoje.toLocaleDateString('pt-BR', opcoes);
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  document.getElementById('dataAtual').textContent = dataCapitalizada;
}

// ============================================
// CARREGAR ESTATÍSTICAS
// ============================================
async function carregarEstatisticas() {
  try {
    // Contar bolos ativos
    const { count: bolosAtivos } = await supabaseAdmin
      .from('bolos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);
    
    document.getElementById('statBolos').textContent = bolosAtivos || 0;
    
    // Contar ingredientes disponíveis
    const { count: ingredientesAtivos } = await supabaseAdmin
      .from('acai_ingredientes')
      .select('*', { count: 'exact', head: true })
      .eq('disponivel', true);
    
    document.getElementById('statIngredientes').textContent = ingredientesAtivos || 0;
    
    // Contar combos ativos
    const { count: combosAtivos } = await supabaseAdmin
      .from('combos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);
    
    document.getElementById('statCombos').textContent = combosAtivos || 0;
    
    // Contar pedidos de hoje
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);
    
    const { count: pedidosHoje } = await supabaseAdmin
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioHoje.toISOString());
    
    document.getElementById('statPedidosHoje').textContent = pedidosHoje || 0;
    
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// ============================================
// CARREGAR ÚLTIMOS PEDIDOS
// ============================================
async function carregarUltimosPedidos() {
  const container = document.getElementById('listaUltimosPedidos');
  
  try {
    const { data: pedidos, error } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    if (!pedidos || pedidos.length === 0) {
      container.innerHTML = `
        <div class="vazio-admin">
          <i class="bi bi-bag"></i>
          <p>Nenhum pedido recebido ainda.</p>
        </div>
      `;
      return;
    }
    
    let html = `
      <div style="overflow-x: auto;">
        <table class="tabela-admin">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Local</th>
              <th>Total</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    pedidos.forEach(p => {
      const data = new Date(p.created_at);
      const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + 
                            data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const statusClass = {
        'novo': 'badge-destaque',
        'em_preparo': 'badge-ativo',
        'entregue': 'badge-ativo',
        'cancelado': 'badge-inativo'
      }[p.status] || 'badge-destaque';
      
      const statusLabel = {
        'novo': 'Novo',
        'em_preparo': 'Em preparo',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
      }[p.status] || p.status;
      
      html += `
        <tr>
          <td><strong>${p.cliente_nome || 'Não informado'}</strong></td>
          <td>${p.tipo_local || '-'}</td>
          <td style="color: var(--rosa-principal); font-weight: 600;">${formatarPrecoAdmin(p.total)}</td>
          <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
          <td style="font-size: 0.85rem; color: var(--texto-medio);">${dataFormatada}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-exclamation-circle"></i>
        <p>Erro ao carregar pedidos.</p>
      </div>
    `;
  }
}

// ============================================
// VERIFICAR AVISOS IMPORTANTES
// ============================================
async function verificarAvisos() {
  const avisos = [];
  
  try {
    // Verificar se tem ingredientes indisponíveis
    const { count: indisponiveis } = await supabaseAdmin
      .from('acai_ingredientes')
      .select('*', { count: 'exact', head: true })
      .eq('disponivel', false);
    
    if (indisponiveis > 0) {
      avisos.push({
        icone: 'bi-flower1',
        cor: '#F9A825',
        titulo: `${indisponiveis} ingrediente(s) indisponível(is)`,
        texto: 'Verifique o estoque e reative quando possível.',
        link: 'ingredientes.html'
      });
    }
    
    // Verificar se tem bolos sem imagem
    const { data: bolosSemImagem } = await supabaseAdmin
      .from('bolos')
      .select('id')
      .is('imagem_url', null)
      .eq('ativo', true);
    
    if (bolosSemImagem && bolosSemImagem.length > 0) {
      avisos.push({
        icone: 'bi-image',
        cor: '#F9A825',
        titulo: `${bolosSemImagem.length} bolo(s) sem imagem`,
        texto: 'Adicione imagens para melhorar a experiência do cliente.',
        link: 'bolos.html'
      });
    }
    
    // Verificar pedidos novos (pendentes)
    const { count: pedidosNovos } = await supabaseAdmin
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'novo');
    
    if (pedidosNovos > 0) {
      avisos.push({
        icone: 'bi-bag-heart-fill',
        cor: '#2D9F4F',
        titulo: `${pedidosNovos} pedido(s) novo(s)`,
        texto: 'Você tem pedidos aguardando atendimento!',
        link: 'pedidos.html'
      });
    }
    
        // Mostrar/esconder card de avisos
    if (avisos.length > 0) {
      const card = document.getElementById('cardAvisos');
      const lista = document.getElementById('listaAvisos');
      
      let html = '';
      avisos.forEach(aviso => {
        html += `
          <a href="${aviso.link}" style="text-decoration: none; color: inherit;">
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid var(--borda); border-radius: var(--radius-sm); margin-bottom: 0.8rem; transition: all 0.3s; cursor: pointer;" 
                 onmouseover="this.style.borderColor='var(--rosa-principal)'; this.style.transform='translateX(5px)';" 
                 onmouseout="this.style.borderColor='var(--borda)'; this.style.transform='translateX(0)';">
              <div style="width: 45px; height: 45px; border-radius: 50%; background: ${aviso.cor}20; color: ${aviso.cor}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
                <i class="bi ${aviso.icone}"></i>
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.2rem;">${aviso.titulo}</div>
                <div style="font-size: 0.85rem; color: var(--texto-medio);">${aviso.texto}</div>
              </div>
              <i class="bi bi-chevron-right" style="color: var(--texto-claro);"></i>
            </div>
          </a>
        `;
      });
      
      lista.innerHTML = html;
      card.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Erro ao verificar avisos:', error);
  }
}