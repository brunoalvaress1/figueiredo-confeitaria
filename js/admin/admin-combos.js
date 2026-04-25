// ============================================
// GERENCIAR COMBOS
// ============================================

let todosCombos = [];
let combosFiltrados = [];
let imagemParaUploadCombo = null;
let comboExcluindo = null;

document.addEventListener('DOMContentLoaded', async function() {
  const session = await verificarAutenticacao();
  if (!session) return;
  
  document.getElementById('sidebarContainer').innerHTML = criarSidebar('combos');
  document.getElementById('topbarContainer').innerHTML = criarTopbar('Combos', session.user.email);
  
  await carregarCombos();
});

// ============================================
// CARREGAR COMBOS
// ============================================
async function carregarCombos() {
  const container = document.getElementById('containerCombos');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('combos')
      .select('*')
      .order('ordem', { ascending: true });
    
    if (error) throw error;
    
    todosCombos = data || [];
    combosFiltrados = [...todosCombos];
    renderizarCombos();
    
    } catch (error) {
    console.error('Erro:', error);
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-exclamation-circle"></i>
        <p>Erro ao carregar combos.</p>
      </div>
    `;
  }
}

// ============================================
// RENDERIZAR TABELA
// ============================================
function renderizarCombos() {
  const container = document.getElementById('containerCombos');
  
  if (combosFiltrados.length === 0) {
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-gift"></i>
        <p>${todosCombos.length === 0 ? 'Nenhum combo cadastrado.' : 'Nenhum combo encontrado com esses filtros.'}</p>
        ${todosCombos.length === 0 ? '<button class="btn-admin mt-3" onclick="abrirModalCombo()"><i class="bi bi-plus-lg"></i> Adicionar primeiro combo</button>' : ''}
      </div>
    `;
    return;
  }
  
  let html = `
    <div style="overflow-x: auto;">
      <table class="tabela-admin">
        <thead>
          <tr>
            <th style="width: 70px;">Imagem</th>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Preço</th>
            <th>Desconto</th>
            <th>Status</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  combosFiltrados.forEach(combo => {
    const imagem = combo.imagem_url || 'https://via.placeholder.com/50?text=?';
    
    // Calcular desconto
    let descontoHtml = '';
    if (combo.preco_original && parseFloat(combo.preco_original) > parseFloat(combo.preco)) {
      const economia = parseFloat(combo.preco_original) - parseFloat(combo.preco);
      const porcentagem = Math.round((economia / parseFloat(combo.preco_original)) * 100);
      descontoHtml = `
        <div>
          <span style="background: #2D9F4F; color: white; padding: 0.2rem 0.6rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700;">-${porcentagem}%</span>
          <div style="font-size: 0.75rem; color: var(--texto-claro); margin-top: 0.2rem;">
            Economiza ${formatarPrecoAdmin(economia)}
          </div>
        </div>
      `;
    } else {
      descontoHtml = `<span style="color: var(--texto-claro); font-size: 0.85rem;">Sem desconto</span>`;
    }
    
    // Preço com riscado
    let precoHtml = '';
    if (combo.preco_original && parseFloat(combo.preco_original) > parseFloat(combo.preco)) {
      precoHtml = `
        <div>
          <div style="text-decoration: line-through; color: var(--texto-claro); font-size: 0.8rem;">
            ${formatarPrecoAdmin(combo.preco_original)}
          </div>
          <div style="color: var(--rosa-principal); font-weight: 700; font-size: 1rem;">
            ${formatarPrecoAdmin(combo.preco)}
          </div>
        </div>
      `;
    } else {
      precoHtml = `<span style="color: var(--rosa-principal); font-weight: 600;">${formatarPrecoAdmin(combo.preco)}</span>`;
    }
    
    html += `
      <tr>
        <td>
          <img src="${imagem}" class="thumb" alt="${combo.nome}" onerror="this.src='https://via.placeholder.com/50?text=?'">
        </td>
        <td>
          <div style="font-weight: 600;">${combo.nome}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem; color: var(--texto-medio); max-width: 250px;">
            ${combo.descricao ? (combo.descricao.length > 80 ? combo.descricao.substring(0, 80) + '...' : combo.descricao) : '<em style="color:#999">Sem descrição</em>'}
          </div>
        </td>
        <td>${precoHtml}</td>
        <td>${descontoHtml}</td>
        <td>
          <span class="badge-status ${combo.ativo ? 'badge-ativo' : 'badge-inativo'}">
            ${combo.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <div class="acoes">
            <label class="switch" title="${combo.ativo ? 'Desativar' : 'Ativar'}">
              <input type="checkbox" ${combo.ativo ? 'checked' : ''} onchange="toggleAtivoCombo('${combo.id}', this.checked)">
              <span class="switch-slider"></span>
            </label>
            <button class="btn-admin secundario pequeno" onclick="editarCombo('${combo.id}')" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-admin perigo pequeno" onclick="confirmarExclusaoCombo('${combo.id}')" title="Excluir">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
    <div style="margin-top: 1rem; color: var(--texto-claro); font-size: 0.85rem;">
      Total: <strong>${combosFiltrados.length}</strong> ${combosFiltrados.length === 1 ? 'combo' : 'combos'}
    </div>
  `;
  
  container.innerHTML = html;
}

// ============================================
// FILTRAR COMBOS
// ============================================
function filtrarCombos() {
  const termo = document.getElementById('filtroNome').value.toLowerCase();
  const status = document.getElementById('filtroStatus').value;
  
  combosFiltrados = todosCombos.filter(combo => {
    const matchNome = !termo || 
                     combo.nome.toLowerCase().includes(termo) ||
                     (combo.descricao && combo.descricao.toLowerCase().includes(termo));
    
    let matchStatus = true;
    if (status === 'ativos') matchStatus = combo.ativo === true;
    else if (status === 'inativos') matchStatus = combo.ativo === false;
    
    return matchNome && matchStatus;
  });
  
  renderizarCombos();
}

// ============================================
// CALCULAR DESCONTO (preview em tempo real no modal)
// ============================================
function calcularDesconto() {
  const precoOriginal = parseFloat(document.getElementById('precoOriginalCombo').value) || 0;
  const precoPromo = parseFloat(document.getElementById('precoCombo').value) || 0;
  const preview = document.getElementById('previewDesconto');
  
  if (precoOriginal > 0 && precoPromo > 0 && precoOriginal > precoPromo) {
    const economia = precoOriginal - precoPromo;
    const porcentagem = Math.round((economia / precoOriginal) * 100);
    
    document.getElementById('textoDesconto').textContent = formatarPrecoAdmin(economia);
    document.getElementById('porcentagemDesconto').textContent = `(${porcentagem}% de desconto)`;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

// ============================================
// ABRIR MODAL (NOVO)
// ============================================
function abrirModalCombo() {
  document.getElementById('formCombo').reset();
  document.getElementById('comboId').value = '';
  document.getElementById('ativoCombo').checked = true;
  document.getElementById('ordemCombo').value = todosCombos.length;
  document.getElementById('previewImagemCombo').style.display = 'none';
  document.getElementById('previewDesconto').style.display = 'none';
  imagemParaUploadCombo = null;
  
  document.getElementById('tituloModalCombo').innerHTML = '<i class="bi bi-plus-circle"></i> Novo Combo';
  document.getElementById('modalCombo').classList.add('ativo');
}

// ============================================
// FECHAR MODAL
// ============================================
function fecharModalCombo() {
  document.getElementById('modalCombo').classList.remove('ativo');
  imagemParaUploadCombo = null;
}

// ============================================
// EDITAR COMBO
// ============================================
function editarCombo(id) {
  const combo = todosCombos.find(c => c.id === id);
  if (!combo) return;
  
  document.getElementById('comboId').value = combo.id;
  document.getElementById('nomeCombo').value = combo.nome;
  document.getElementById('descricaoCombo').value = combo.descricao || '';
  document.getElementById('precoOriginalCombo').value = combo.preco_original || '';
  document.getElementById('precoCombo').value = combo.preco;
  document.getElementById('ordemCombo').value = combo.ordem || 0;
  document.getElementById('ativoCombo').checked = combo.ativo;
  
  if (combo.imagem_url) {
    document.getElementById('previewImagemCombo').src = combo.imagem_url;
    document.getElementById('previewImagemCombo').style.display = 'block';
  } else {
    document.getElementById('previewImagemCombo').style.display = 'none';
  }
  
  imagemParaUploadCombo = null;
  
  calcularDesconto();
  
  document.getElementById('tituloModalCombo').innerHTML = '<i class="bi bi-pencil"></i> Editar Combo';
  document.getElementById('modalCombo').classList.add('ativo');
}

// ============================================
// PREVIEW DA IMAGEM
// ============================================
function previewImagemCombo(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;
  
  if (arquivo.size > 2 * 1024 * 1024) {
    mostrarToastAdmin('A imagem deve ter no máximo 2MB', 'erro');
    event.target.value = '';
    return;
  }
  
  if (!arquivo.type.startsWith('image/')) {
    mostrarToastAdmin('Apenas imagens são permitidas', 'erro');
    event.target.value = '';
    return;
  }
  
  imagemParaUploadCombo = arquivo;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('previewImagemCombo');
    preview.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(arquivo);
}

// ============================================
// SALVAR COMBO
// ============================================
async function salvarCombo(event) {
  event.preventDefault();
  
  const btn = document.getElementById('btnSalvarCombo');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
  
  try {
    const id = document.getElementById('comboId').value;
    const isEdicao = !!id;
    
    const precoOriginal = parseFloat(document.getElementById('precoOriginalCombo').value) || null;
    const precoPromo = parseFloat(document.getElementById('precoCombo').value);
    
    // Validação: preço original deve ser maior que promocional
    if (precoOriginal && precoOriginal <= precoPromo) {
      mostrarToastAdmin('O preço original deve ser MAIOR que o preço promocional!', 'erro');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Salvar';
      return;
    }
    
    const dados = {
      nome: document.getElementById('nomeCombo').value.trim(),
      descricao: document.getElementById('descricaoCombo').value.trim() || null,
      preco: precoPromo,
      preco_original: precoOriginal,
      ordem: parseInt(document.getElementById('ordemCombo').value) || 0,
      ativo: document.getElementById('ativoCombo').checked
    };
    
    // Upload da imagem
    if (imagemParaUploadCombo) {
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando imagem...';
      
      if (isEdicao) {
        const comboAntigo = todosCombos.find(c => c.id === id);
        if (comboAntigo && comboAntigo.imagem_url) {
          await deletarImagem(comboAntigo.imagem_url, 'combos');
        }
      }
      
      const urlImagem = await uploadImagem(imagemParaUploadCombo, 'combos');
      if (urlImagem) {
        dados.imagem_url = urlImagem;
      }
    }
    
    if (isEdicao) {
      const { error } = await supabaseAdmin
        .from('combos')
        .update(dados)
        .eq('id', id);
      
      if (error) throw error;
      mostrarToastAdmin('Combo atualizado!', 'sucesso');
    } else {
      const { error } = await supabaseAdmin
        .from('combos')
        .insert(dados);
      
      if (error) throw error;
      mostrarToastAdmin('Combo adicionado!', 'sucesso');
    }
    
    fecharModalCombo();
    await carregarCombos();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao salvar: ' + error.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Salvar';
  }
}

// ============================================
// TOGGLE ATIVO/INATIVO
// ============================================
async function toggleAtivoCombo(id, novoStatus) {
  try {
    const { error } = await supabaseAdmin
      .from('combos')
      .update({ ativo: novoStatus })
      .eq('id', id);
    
    if (error) throw error;
    
    const combo = todosCombos.find(c => c.id === id);
    if (combo) combo.ativo = novoStatus;
    
    mostrarToastAdmin(
      `Combo ${novoStatus ? 'ativado' : 'desativado'}!`,
      'sucesso'
    );
    
    renderizarCombos();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao alterar status', 'erro');
    await carregarCombos();
  }
}

// ============================================
// CONFIRMAR EXCLUSÃO
// ============================================
function confirmarExclusaoCombo(id) {
  const combo = todosCombos.find(c => c.id === id);
  if (!combo) return;
  
  comboExcluindo = combo;
  document.getElementById('nomeComboExcluir').textContent = combo.nome;
  document.getElementById('btnConfirmarExcluir').onclick = executarExclusaoCombo;
  document.getElementById('modalExcluir').classList.add('ativo');
}

// ============================================
// FECHAR MODAL EXCLUIR
// ============================================
function fecharModalExcluir() {
  document.getElementById('modalExcluir').classList.remove('ativo');
  comboExcluindo = null;
}

// ============================================
// EXECUTAR EXCLUSÃO
// ============================================
async function executarExclusaoCombo() {
  if (!comboExcluindo) return;
  
  const btn = document.getElementById('btnConfirmarExcluir');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  
  try {
    // Deletar imagem do storage
    if (comboExcluindo.imagem_url) {
      await deletarImagem(comboExcluindo.imagem_url, 'combos');
    }
    
    const { error } = await supabaseAdmin
      .from('combos')
      .delete()
      .eq('id', comboExcluindo.id);
    
    if (error) throw error;
    
    mostrarToastAdmin('Combo excluído!', 'sucesso');
    fecharModalExcluir();
    await carregarCombos();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao excluir combo', 'erro');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash"></i> Excluir';
  }
}