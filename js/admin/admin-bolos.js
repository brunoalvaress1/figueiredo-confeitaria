// ============================================
// GERENCIAR BOLOS (CRUD)
// ============================================

let todosBolos = [];
let bolosFiltrados = [];
let imagemParaUpload = null;
let boloExcluindo = null;

document.addEventListener('DOMContentLoaded', async function() {
  const session = await verificarAutenticacao();
  if (!session) return;
  
  // Injetar sidebar e topbar
  document.getElementById('sidebarContainer').innerHTML = criarSidebar('bolos');
  document.getElementById('topbarContainer').innerHTML = criarTopbar('Bolos de Pote', session.user.email);
  
  // Carregar bolos
  await carregarBolos();
});

// ============================================
// CARREGAR BOLOS DO BANCO
// ============================================
async function carregarBolos() {
  const container = document.getElementById('containerBolos');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('bolos')
      .select('*')
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    todosBolos = data || [];
    bolosFiltrados = [...todosBolos];
    renderizarBolos();
    
  } catch (error) {
    console.error('Erro:', error);
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-exclamation-circle"></i>
        <p>Erro ao carregar bolos. Tente recarregar a página.</p>
      </div>
    `;
  }
}

// ============================================
// RENDERIZAR TABELA DE BOLOS
// ============================================
function renderizarBolos() {
  const container = document.getElementById('containerBolos');
  
  if (bolosFiltrados.length === 0) {
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-cake2"></i>
        <p>${todosBolos.length === 0 ? 'Nenhum bolo cadastrado ainda.' : 'Nenhum bolo encontrado com esses filtros.'}</p>
        ${todosBolos.length === 0 ? '<button class="btn-admin mt-3" onclick="abrirModalBolo()"><i class="bi bi-plus-lg"></i> Adicionar o primeiro bolo</button>' : ''}
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
            <th>Preço</th>
            <th>Ordem</th>
            <th>Status</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  bolosFiltrados.forEach(bolo => {
    const imagem = bolo.imagem_url || 'https://via.placeholder.com/50?text=?';
    
    let statusBadges = '';
    if (bolo.ativo) {
      statusBadges += '<span class="badge-status badge-ativo">Ativo</span> ';
    } else {
      statusBadges += '<span class="badge-status badge-inativo">Inativo</span> ';
    }
    if (bolo.destaque) {
      statusBadges += '<span class="badge-status badge-destaque">★ Destaque</span>';
    }
    
    html += `
      <tr>
        <td>
          <img src="${imagem}" class="thumb" alt="${bolo.nome}" onerror="this.src='https://via.placeholder.com/50?text=?'">
        </td>
        <td>
          <div style="font-weight: 600;">${bolo.nome}</div>
          <div style="font-size: 0.8rem; color: var(--texto-claro); margin-top: 0.2rem;">
            ${bolo.descricao ? bolo.descricao.substring(0, 50) + (bolo.descricao.length > 50 ? '...' : '') : '<em>Sem descrição</em>'}
          </div>
        </td>
        <td style="color: var(--rosa-principal); font-weight: 600;">${formatarPrecoAdmin(bolo.preco)}</td>
        <td>${bolo.ordem || 0}</td>
        <td>${statusBadges}</td>
        <td>
          <div class="acoes">
            <label class="switch" title="${bolo.ativo ? 'Desativar' : 'Ativar'}">
              <input type="checkbox" ${bolo.ativo ? 'checked' : ''} onchange="toggleAtivoBolo('${bolo.id}', this.checked)">
              <span class="switch-slider"></span>
            </label>
            <button class="btn-admin secundario pequeno" onclick="editarBolo('${bolo.id}')" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-admin perigo pequeno" onclick="confirmarExclusaoBolo('${bolo.id}')" title="Excluir">
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
      Total: <strong>${bolosFiltrados.length}</strong> ${bolosFiltrados.length === 1 ? 'bolo' : 'bolos'}
    </div>
  `;
  
  container.innerHTML = html;
}

// ============================================
// FILTRAR BOLOS
// ============================================
function filtrarBolos() {
  const termo = document.getElementById('filtroNome').value.toLowerCase();
  const status = document.getElementById('filtroStatus').value;
  
  bolosFiltrados = todosBolos.filter(bolo => {
    // Filtro por nome
    const matchNome = !termo || bolo.nome.toLowerCase().includes(termo) || 
                      (bolo.descricao && bolo.descricao.toLowerCase().includes(termo));
    
    // Filtro por status
    let matchStatus = true;
    if (status === 'ativos') matchStatus = bolo.ativo === true;
    else if (status === 'inativos') matchStatus = bolo.ativo === false;
    else if (status === 'destaque') matchStatus = bolo.destaque === true;
    
    return matchNome && matchStatus;
  });
  
  renderizarBolos();
}

// ============================================
// ABRIR MODAL (ADICIONAR NOVO)
// ============================================
function abrirModalBolo() {
  // Resetar formulário
  document.getElementById('formBolo').reset();
  document.getElementById('boloId').value = '';
  document.getElementById('ativoBolo').checked = true;
  document.getElementById('destaqueBolo').checked = false;
  document.getElementById('ordemBolo').value = 0;
  document.getElementById('previewImagemBolo').style.display = 'none';
  document.getElementById('previewImagemBolo').src = '';
  imagemParaUpload = null;
  
  // Mudar título
  document.getElementById('tituloModalBolo').innerHTML = '<i class="bi bi-plus-circle"></i> Adicionar Bolo';
  
  // Abrir modal
  document.getElementById('modalBolo').classList.add('ativo');
}

// ============================================
// FECHAR MODAL
// ============================================
function fecharModalBolo() {
  document.getElementById('modalBolo').classList.remove('ativo');
  imagemParaUpload = null;
}

// ============================================
// EDITAR BOLO
// ============================================
function editarBolo(id) {
  const bolo = todosBolos.find(b => b.id === id);
  if (!bolo) return;
  
  // Preencher formulário
  document.getElementById('boloId').value = bolo.id;
  document.getElementById('nomeBolo').value = bolo.nome;
  document.getElementById('descricaoBolo').value = bolo.descricao || '';
  document.getElementById('precoBolo').value = bolo.preco;
  document.getElementById('ordemBolo').value = bolo.ordem || 0;
  document.getElementById('ativoBolo').checked = bolo.ativo;
  document.getElementById('destaqueBolo').checked = bolo.destaque;
  
  // Mostrar imagem atual se tiver
  if (bolo.imagem_url) {
    document.getElementById('previewImagemBolo').src = bolo.imagem_url;
    document.getElementById('previewImagemBolo').style.display = 'block';
  } else {
    document.getElementById('previewImagemBolo').style.display = 'none';
  }
  
  imagemParaUpload = null;
  
  // Mudar título
  document.getElementById('tituloModalBolo').innerHTML = '<i class="bi bi-pencil"></i> Editar Bolo';
  
  // Abrir modal
  document.getElementById('modalBolo').classList.add('ativo');
}

// ============================================
// PREVIEW DA IMAGEM (antes do upload)
// ============================================
function previewImagem(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;
  
  // Validar tamanho (máx 2MB)
  if (arquivo.size > 2 * 1024 * 1024) {
    mostrarToastAdmin('A imagem deve ter no máximo 2MB', 'erro');
    event.target.value = '';
    return;
  }
  
  // Validar tipo
  if (!arquivo.type.startsWith('image/')) {
    mostrarToastAdmin('Apenas imagens são permitidas', 'erro');
    event.target.value = '';
    return;
  }
  
  imagemParaUpload = arquivo;
  
  // Mostrar preview
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('previewImagemBolo');
    preview.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(arquivo);
}

// ============================================
// SALVAR BOLO (CRIAR OU ATUALIZAR)
// ============================================
async function salvarBolo(event) {
  event.preventDefault();
  
  const btn = document.getElementById('btnSalvarBolo');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
  
  try {
    const id = document.getElementById('boloId').value;
    const isEdicao = !!id;
    
    // Dados do formulário
    const dados = {
      nome: document.getElementById('nomeBolo').value.trim(),
      descricao: document.getElementById('descricaoBolo').value.trim() || null,
      preco: parseFloat(document.getElementById('precoBolo').value),
      ordem: parseInt(document.getElementById('ordemBolo').value) || 0,
      ativo: document.getElementById('ativoBolo').checked,
      destaque: document.getElementById('destaqueBolo').checked
    };
    
    // Se tem nova imagem, faz upload
    if (imagemParaUpload) {
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando imagem...';
      
      // Se for edição e já tinha imagem, deletar a antiga
      if (isEdicao) {
        const boloAntigo = todosBolos.find(b => b.id === id);
        if (boloAntigo && boloAntigo.imagem_url) {
          await deletarImagem(boloAntigo.imagem_url, 'bolos');
        }
      }
      
      const urlImagem = await uploadImagem(imagemParaUpload, 'bolos');
      if (urlImagem) {
        dados.imagem_url = urlImagem;
      }
    }
    
    // Atualizar ou inserir
    if (isEdicao) {
      dados.updated_at = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from('bolos')
        .update(dados)
        .eq('id', id);
      
      if (error) throw error;
      mostrarToastAdmin('Bolo atualizado com sucesso!', 'sucesso');
    } else {
      const { error } = await supabaseAdmin
        .from('bolos')
        .insert(dados);
      
      if (error) throw error;
      mostrarToastAdmin('Bolo adicionado com sucesso!', 'sucesso');
    }
    
    // Fechar modal e recarregar
    fecharModalBolo();
    await carregarBolos();
    
  } catch (error) {
    console.error('Erro ao salvar:', error);
    mostrarToastAdmin('Erro ao salvar bolo: ' + error.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Salvar';
  }
}

// ============================================
// TOGGLE ATIVO/INATIVO (switch rápido)
// ============================================
async function toggleAtivoBolo(id, novoStatus) {
  try {
    const { error } = await supabaseAdmin
      .from('bolos')
      .update({ 
        ativo: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    
    // Atualizar localmente
    const bolo = todosBolos.find(b => b.id === id);
    if (bolo) bolo.ativo = novoStatus;
    
    mostrarToastAdmin(
      `Bolo ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`,
      'sucesso'
    );
    
    // Re-renderizar para atualizar badges
    renderizarBolos();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao alterar status', 'erro');
    // Reverter o switch em caso de erro
    await carregarBolos();
  }
}

// ============================================
// CONFIRMAR EXCLUSÃO
// ============================================
function confirmarExclusaoBolo(id) {
  const bolo = todosBolos.find(b => b.id === id);
  if (!bolo) return;
  
  boloExcluindo = bolo;
  document.getElementById('nomeBoloExcluir').textContent = bolo.nome;
  document.getElementById('btnConfirmarExcluir').onclick = executarExclusaoBolo;
  document.getElementById('modalExcluir').classList.add('ativo');
}

// ============================================
// FECHAR MODAL EXCLUIR
// ============================================
function fecharModalExcluir() {
  document.getElementById('modalExcluir').classList.remove('ativo');
  boloExcluindo = null;
}

// ============================================
// EXECUTAR EXCLUSÃO
// ============================================
async function executarExclusaoBolo() {
  if (!boloExcluindo) return;
  
  const btn = document.getElementById('btnConfirmarExcluir');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Excluindo...';
  
  try {
    // Deletar imagem do storage se existir
    if (boloExcluindo.imagem_url) {
      await deletarImagem(boloExcluindo.imagem_url, 'bolos');
    }
    
    // Deletar do banco
    const { error } = await supabaseAdmin
      .from('bolos')
      .delete()
      .eq('id', boloExcluindo.id);
    
    if (error) throw error;
    
    mostrarToastAdmin('Bolo excluído com sucesso!', 'sucesso');
    fecharModalExcluir();
    await carregarBolos();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao excluir bolo', 'erro');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash"></i> Excluir';
  }
}