// ============================================
// MONTE SEU AÇAÍ (com edição e categorias)
// ============================================

let tamanhoSelecionado = null;
let ingredientesSelecionados = [];
let maxIngredientes = 8;
let todosTamanhos = [];
let todosIngredientes = [];
let todasCategorias = [];
let idAcaiEditando = null; // Se estiver editando, guarda o ID

document.addEventListener('DOMContentLoaded', async function() {
  // Buscar configurações
  const config = await buscarConfiguracoes();
  maxIngredientes = parseInt(config.maximo_ingredientes_acai) || 8;
  document.getElementById('maxIngredientes').textContent = maxIngredientes;
  document.getElementById('tempoEstimado').textContent = config.tempo_entrega || '20 a 30 min';
  
  await carregarTamanhos();
  await carregarIngredientesPorCategoria();
  
  // Verificar se está em modo edição
  verificarModoEdicao();
});

// ============================================
// VERIFICAR SE ESTÁ EDITANDO UM AÇAÍ
// ============================================
function verificarModoEdicao() {
  const params = new URLSearchParams(window.location.search);
  const editarId = params.get('editar');
  
  if (!editarId) return;
  
  const acaiSalvo = sessionStorage.getItem('acai_editando');
  if (!acaiSalvo) return;
  
  const acai = JSON.parse(acaiSalvo);
  idAcaiEditando = editarId;
  
  // Selecionar o tamanho automaticamente
  if (acai.detalhes && acai.detalhes.tamanho_id) {
    const tamanho = todosTamanhos.find(t => t.id === acai.detalhes.tamanho_id);
    if (tamanho) selecionarTamanho(tamanho.id);
  }
  
  // Selecionar os ingredientes automaticamente
  if (acai.detalhes && acai.detalhes.ingredientes) {
    acai.detalhes.ingredientes.forEach(ing => {
      const ingCompleto = todosIngredientes.find(i => i.id === ing.id);
      if (ingCompleto) {
        ingredientesSelecionados.push(ingCompleto);
        const el = document.getElementById(`ing-${ing.id}`);
        if (el) el.classList.add('selecionado');
      }
    });
  }
  
  atualizarContadorCategorias();
  atualizarResumo();
  
  // Mostrar aviso de edição
  mostrarBannerEdicao();
  
  // Mudar texto do botão
  const btn = document.getElementById('btnAdicionarAcai');
  if (btn) {
    btn.innerHTML = 'SALVAR ALTERAÇÕES <i class="bi bi-check"></i>';
  }
  
  // Limpar sessionStorage
  sessionStorage.removeItem('acai_editando');
  
  // Scroll suave para o topo
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mostrar banner informando que está editando
function mostrarBannerEdicao() {
  const banner = document.createElement('div');
  banner.className = 'container mt-3';
  banner.innerHTML = `
    <div style="background: var(--rosa-claro); border-left: 4px solid var(--rosa-principal); padding: 1rem; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 1rem;">
      <i class="bi bi-pencil-square" style="color: var(--rosa-principal); font-size: 1.3rem;"></i>
      <div>
        <strong>Modo edição</strong><br>
        <small class="text-muted">Você está editando um açaí que já está no carrinho.</small>
      </div>
      <a href="carrinho.html" class="btn-voltar ms-auto" style="padding: 0.4rem 1rem;">
        <i class="bi bi-x"></i> Cancelar
      </a>
    </div>
  `;
  
  // Inserir após o breadcrumb
  const breadcrumb = document.querySelector('.breadcrumb-custom');
  if (breadcrumb) {
    breadcrumb.parentNode.insertBefore(banner, breadcrumb.nextSibling);
  }
}

// ============================================
// CARREGAR TAMANHOS
// ============================================
async function carregarTamanhos() {
  const container = document.getElementById('listaTamanhos');
  todosTamanhos = await buscarTamanhosAcai();
  
  if (todosTamanhos.length === 0) {
    container.innerHTML = '<div class="col-12 text-center py-4 text-muted">Nenhum tamanho disponível.</div>';
    return;
  }
  
  let html = '';
  todosTamanhos.forEach(t => {
    const imagem = t.imagem_url || 'imagens/acai-destaque.png';
    html += `
      <div class="col-md-4 mb-3">
        <div class="card-tamanho" onclick="selecionarTamanho('${t.id}')" id="tamanho-${t.id}">
          <img src="${imagem}" alt="${t.nome}">
          <div class="card-tamanho-info">
            <h5>${t.nome}</h5>
            <p>${t.descricao || ''}</p>
            <div class="preco">${formatarPreco(t.preco)}</div>
          </div>
          <div class="check-circle"><i class="bi bi-check"></i></div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ============================================
// CARREGAR INGREDIENTES POR CATEGORIA
// ============================================
// ============================================
// CARREGAR INGREDIENTES POR CATEGORIA
// ============================================
async function carregarIngredientesPorCategoria() {
  const container = document.getElementById('listaIngredientes');
  
  todasCategorias = await buscarCategoriasIngredientes();
  todosIngredientes = await buscarIngredientes();
  
  if (todosIngredientes.length === 0) {
    container.innerHTML = '<div class="col-12 text-center py-4 text-muted">Nenhum ingrediente disponível.</div>';
    return;
  }
  
  let html = '';
  
  // Loop pelas categorias
  todasCategorias.forEach(categoria => {
    // Filtrar ingredientes dessa categoria
    const ingredientesDaCategoria = todosIngredientes.filter(
      ing => ing.categoria && ing.categoria.id === categoria.id
    );
    
    // Se não tem ingredientes na categoria, pula
    if (ingredientesDaCategoria.length === 0) return;
    
    // ABRIR bloco da categoria (cabeçalho)
    html += `
      <div class="col-12 categoria-ingredientes">
        <div class="categoria-titulo">
          <div class="categoria-titulo-icone">
            <i class="bi ${categoria.icone || 'bi-circle'}"></i>
          </div>
          <h4>${categoria.nome}</h4>
          <span class="qtd-selecionado" id="qtd-${categoria.id}"></span>
        </div>
        <div class="row">
    `;
    
    // Loop pelos ingredientes dessa categoria
    ingredientesDaCategoria.forEach(i => {
      const imagem = i.imagem_url || 'https://via.placeholder.com/60';
      const precoHtml = i.preco > 0 
        ? `<span class="card-ingrediente-preco">+ ${formatarPreco(i.preco)}</span>`
        : `<span class="card-ingrediente-preco gratis">Grátis</span>`;
      
      html += `
        <div class="col-md-3 col-6">
          <div class="card-ingrediente" onclick="toggleIngrediente('${i.id}')" id="ing-${i.id}">
            <img src="${imagem}" alt="${i.nome}">
            <div class="card-ingrediente-info">
              <span class="card-ingrediente-nome">${i.nome}</span>
              ${precoHtml}
            </div>
            <div class="check-mini"><i class="bi bi-check"></i></div>
          </div>
        </div>
      `;
    });
    
    // FECHAR bloco da categoria
    html += `
        </div>
      </div>
    `;
  });
  
  // Ingredientes SEM categoria (fallback - vai pra seção "Outros")
  const semCategoria = todosIngredientes.filter(ing => !ing.categoria);
  if (semCategoria.length > 0) {
    html += `
      <div class="col-12 categoria-ingredientes">
        <div class="categoria-titulo">
          <div class="categoria-titulo-icone">
            <i class="bi bi-plus-circle"></i>
          </div>
          <h4>Outros</h4>
          <span class="qtd-selecionado"></span>
        </div>
        <div class="row">
    `;
    
    semCategoria.forEach(i => {
      const imagem = i.imagem_url || 'https://via.placeholder.com/60';
      const precoHtml = i.preco > 0 
        ? `<span class="card-ingrediente-preco">+ ${formatarPreco(i.preco)}</span>`
        : `<span class="card-ingrediente-preco gratis">Grátis</span>`;
      
      html += `
        <div class="col-md-3 col-6">
          <div class="card-ingrediente" onclick="toggleIngrediente('${i.id}')" id="ing-${i.id}">
            <img src="${imagem}" alt="${i.nome}">
            <div class="card-ingrediente-info">
              <span class="card-ingrediente-nome">${i.nome}</span>
              ${precoHtml}
            </div>
            <div class="check-mini"><i class="bi bi-check"></i></div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// ============================================
// SELECIONAR TAMANHO
// ============================================
function selecionarTamanho(id) {
  document.querySelectorAll('.card-tamanho').forEach(c => c.classList.remove('selecionado'));
  const card = document.getElementById(`tamanho-${id}`);
  if (card) card.classList.add('selecionado');
  
  tamanhoSelecionado = todosTamanhos.find(t => t.id === id);
  atualizarResumo();
}

// ============================================
// TOGGLE INGREDIENTE
// ============================================
function toggleIngrediente(id) {
  const ingrediente = todosIngredientes.find(i => i.id === id);
  const jaSelecionado = ingredientesSelecionados.find(i => i.id === id);
  
  if (jaSelecionado) {
    ingredientesSelecionados = ingredientesSelecionados.filter(i => i.id !== id);
    document.getElementById(`ing-${id}`).classList.remove('selecionado');
  } else {
    if (ingredientesSelecionados.length >= maxIngredientes) {
      mostrarToast(`Máximo de ${maxIngredientes} ingredientes!`);
      return;
    }
    ingredientesSelecionados.push(ingrediente);
    document.getElementById(`ing-${id}`).classList.add('selecionado');
  }
  
  atualizarContadorCategorias();
  atualizarResumo();
}

// ============================================
// CONTADOR POR CATEGORIA
// ============================================
function atualizarContadorCategorias() {
  todasCategorias.forEach(cat => {
    const qtd = ingredientesSelecionados.filter(
      i => i.categoria && i.categoria.id === cat.id
    ).length;
    
    const el = document.getElementById(`qtd-${cat.id}`);
    if (el) {
      el.textContent = qtd > 0 ? `${qtd} selecionado${qtd > 1 ? 's' : ''}` : '';
    }
  });
}

// ============================================
// CALCULAR TOTAL DO AÇAÍ
// ============================================
function calcularTotalAcai() {
  if (!tamanhoSelecionado) return 0;
  
  const precoTamanho = parseFloat(tamanhoSelecionado.preco);
  const precoIngredientes = ingredientesSelecionados.reduce(
    (total, ing) => total + parseFloat(ing.preco || 0),
    0
  );
  
  return precoTamanho + precoIngredientes;
}

// ============================================
// ATUALIZAR RESUMO
// ============================================
function atualizarResumo() {
  const resumoTamanho = document.getElementById('resumoTamanho');
  const resumoQtd = document.getElementById('resumoQtdIngredientes');
  const resumoIng = document.getElementById('resumoIngredientes');
  const resumoTotal = document.getElementById('resumoTotal');
  const btn = document.getElementById('btnAdicionarAcai');
  
  if (tamanhoSelecionado) {
    resumoTamanho.textContent = tamanhoSelecionado.nome;
    btn.disabled = false;
  } else {
    resumoTamanho.textContent = '-';
    btn.disabled = true;
  }
  
  resumoQtd.textContent = ingredientesSelecionados.length;
  
  if (ingredientesSelecionados.length > 0) {
    let htmlIng = '';
    ingredientesSelecionados.forEach(ing => {
      const preco = parseFloat(ing.preco);
      const precoText = preco > 0 
        ? `<span class="preco-extra">+${formatarPreco(preco)}</span>`
        : `<span class="text-muted" style="font-size: 0.75rem;">Grátis</span>`;
      htmlIng += `
        <div class="item-linha">
          <span>${ing.nome}</span>
          ${precoText}
        </div>
      `;
    });
    resumoIng.innerHTML = `<div class="lista-ingredientes-resumo">${htmlIng}</div>`;
  } else {
    resumoIng.innerHTML = '<span class="text-muted">Nenhum ingrediente selecionado</span>';
  }
  
  resumoTotal.textContent = formatarPreco(calcularTotalAcai());
}

// ============================================
// RESETAR FORMULÁRIO (usado pelo modal)
// ============================================
function resetarFormularioAcai() {
  tamanhoSelecionado = null;
  ingredientesSelecionados = [];
  idAcaiEditando = null;
  
  document.querySelectorAll('.card-tamanho, .card-ingrediente').forEach(c => c.classList.remove('selecionado'));
  atualizarContadorCategorias();
  atualizarResumo();
}

// ============================================
// ADICIONAR AO CARRINHO (ou salvar edição)
// ============================================
function adicionarAcaiAoCarrinho() {
  if (!tamanhoSelecionado) {
    mostrarToast('Escolha um tamanho!');
    return;
  }
  
  const precoFinal = calcularTotalAcai();
  
  // Se estiver editando, passa o ID antigo para substituir
  adicionarAcaiCarrinho(
    tamanhoSelecionado,
    ingredientesSelecionados,
    precoFinal,
    idAcaiEditando // se tiver ID, é edição
  );
  
  // Se NÃO for edição, reseta o formulário (modal vai aparecer)
  if (!idAcaiEditando) {
    resetarFormularioAcai();
  }
}