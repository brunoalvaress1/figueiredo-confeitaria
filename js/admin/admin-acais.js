// ============================================
// GERENCIAR TAMANHOS DE AÇAÍ
// ============================================

let todosTamanhos = [];
let imagemParaUploadTamanho = null;
let tamanhoExcluindo = null;

document.addEventListener('DOMContentLoaded', async function() {
  const session = await verificarAutenticacao();
  if (!session) return;
  
  document.getElementById('sidebarContainer').innerHTML = criarSidebar('acais');
  document.getElementById('topbarContainer').innerHTML = criarTopbar('Tamanhos de Açaí', session.user.email);
  
  await carregarTamanhos();
});

// ============================================
// CARREGAR TAMANHOS
// ============================================
async function carregarTamanhos() {
  const container = document.getElementById('containerTamanhos');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('acai_tamanhos')
      .select('*')
      .order('ordem', { ascending: true });
    
    if (error) throw error;
    
    todosTamanhos = data || [];
    renderizarTamanhos();
    
  } catch (error) {
    console.error('Erro:', error);
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-exclamation-circle"></i>
        <p>Erro ao carregar tamanhos.</p>
      </div>
    `;
  }
}

// ============================================
// RENDERIZAR TABELA
// ============================================
function renderizarTamanhos() {
  const container = document.getElementById('containerTamanhos');
  
  if (todosTamanhos.length === 0) {
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-cup-straw"></i>
        <p>Nenhum tamanho cadastrado ainda.</p>
        <button class="btn-admin mt-3" onclick="abrirModalTamanho()">
          <i class="bi bi-plus-lg"></i> Adicionar o primeiro tamanho
        </button>
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
            <th>Preço base</th>
            <th>Ordem</th>
            <th>Status</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  todosTamanhos.forEach(tam => {
    const imagem = tam.imagem_url || 'https://via.placeholder.com/50?text=?';
    
        html += `
      <tr>
        <td>
          <img src="${imagem}" class="thumb" alt="${tam.nome}" onerror="this.src='https://via.placeholder.com/50?text=?'">
        </td>
        <td>
          <div style="font-weight: 600; font-size: 1rem;">${tam.nome}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem; color: var(--texto-medio);">
            ${tam.descricao || '<em style="color:#999">Sem descrição</em>'}
          </div>
        </td>
        <td style="color: var(--rosa-principal); font-weight: 600; font-size: 1rem;">${formatarPrecoAdmin(tam.preco)}</td>
        <td>${tam.ordem || 0}</td>
        <td>
          <span class="badge-status ${tam.ativo ? 'badge-ativo' : 'badge-inativo'}">
            ${tam.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <div class="acoes">
            <label class="switch" title="${tam.ativo ? 'Desativar' : 'Ativar'}">
              <input type="checkbox" ${tam.ativo ? 'checked' : ''} onchange="toggleAtivoTamanho('${tam.id}', this.checked)">
              <span class="switch-slider"></span>
            </label>
            <button class="btn-admin secundario pequeno" onclick="editarTamanho('${tam.id}')" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-admin perigo pequeno" onclick="confirmarExclusaoTamanho('${tam.id}')" title="Excluir">
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
      Total: <strong>${todosTamanhos.length}</strong> ${todosTamanhos.length === 1 ? 'tamanho' : 'tamanhos'}
    </div>
  `;
  
  container.innerHTML = html;
}

// ============================================
// ABRIR MODAL (NOVO)
// ============================================
function abrirModalTamanho() {
  document.getElementById('formTamanho').reset();
  document.getElementById('tamanhoId').value = '';
  document.getElementById('ativoTamanho').checked = true;
  document.getElementById('ordemTamanho').value = todosTamanhos.length;
  document.getElementById('previewImagemTamanho').style.display = 'none';
  imagemParaUploadTamanho = null;
  
  document.getElementById('tituloModalTamanho').innerHTML = '<i class="bi bi-plus-circle"></i> Novo Tamanho';
  document.getElementById('modalTamanho').classList.add('ativo');
}

// ============================================
// FECHAR MODAL
// ============================================
function fecharModalTamanho() {
  document.getElementById('modalTamanho').classList.remove('ativo');
  imagemParaUploadTamanho = null;
}

// ============================================
// EDITAR TAMANHO
// ============================================
function editarTamanho(id) {
  const tam = todosTamanhos.find(t => t.id === id);
  if (!tam) return;
  
  document.getElementById('tamanhoId').value = tam.id;
  document.getElementById('nomeTamanho').value = tam.nome;
  document.getElementById('descricaoTamanho').value = tam.descricao || '';
  document.getElementById('precoTamanho').value = tam.preco;
  document.getElementById('ordemTamanho').value = tam.ordem || 0;
  document.getElementById('ativoTamanho').checked = tam.ativo;
  
  if (tam.imagem_url) {
    document.getElementById('previewImagemTamanho').src = tam.imagem_url;
    document.getElementById('previewImagemTamanho').style.display = 'block';
  } else {
    document.getElementById('previewImagemTamanho').style.display = 'none';
  }
  
  imagemParaUploadTamanho = null;
  
  document.getElementById('tituloModalTamanho').innerHTML = '<i class="bi bi-pencil"></i> Editar Tamanho';
  document.getElementById('modalTamanho').classList.add('ativo');
}

// ============================================
// PREVIEW DA IMAGEM
// ============================================
function previewImagemTamanho(event) {
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
  
  imagemParaUploadTamanho = arquivo;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('previewImagemTamanho');
    preview.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(arquivo);
}

// ============================================
// SALVAR TAMANHO
// ============================================
async function salvarTamanho(event) {
  event.preventDefault();
  
  const btn = document.getElementById('btnSalvarTamanho');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
  
  try {
    const id = document.getElementById('tamanhoId').value;
    const isEdicao = !!id;
    
    const dados = {
      nome: document.getElementById('nomeTamanho').value.trim(),
      descricao: document.getElementById('descricaoTamanho').value.trim() || null,
      preco: parseFloat(document.getElementById('precoTamanho').value),
      ordem: parseInt(document.getElementById('ordemTamanho').value) || 0,
      ativo: document.getElementById('ativoTamanho').checked
    };
    
    // Upload da imagem
    if (imagemParaUploadTamanho) {
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando imagem...';
      
      if (isEdicao) {
        const tamAntigo = todosTamanhos.find(t => t.id === id);
        if (tamAntigo && tamAntigo.imagem_url) {
          await deletarImagem(tamAntigo.imagem_url, 'acai');
        }
      }
      
      const urlImagem = await uploadImagem(imagemParaUploadTamanho, 'acai');
      if (urlImagem) {
        dados.imagem_url = urlImagem;
      }
    }
    
    if (isEdicao) {
      const { error } = await supabaseAdmin
        .from('acai_tamanhos')
        .update(dados)
        .eq('id', id);
      
      if (error) throw error;
      mostrarToastAdmin('Tamanho atualizado!', 'sucesso');
    } else {
      const { error } = await supabaseAdmin
        .from('acai_tamanhos')
        .insert(dados);
      
      if (error) throw error;
      mostrarToastAdmin('Tamanho adicionado!', 'sucesso');
    }
    
    fecharModalTamanho();
    await carregarTamanhos();
    
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
async function toggleAtivoTamanho(id, novoStatus) {
  try {
    const { error } = await supabaseAdmin
      .from('acai_tamanhos')
      .update({ ativo: novoStatus })
      .eq('id', id);
    
    if (error) throw error;
    
    const tam = todosTamanhos.find(t => t.id === id);
    if (tam) tam.ativo = novoStatus;
    
    mostrarToastAdmin(
      `Tamanho ${novoStatus ? 'ativado' : 'desativado'}!`,
      'sucesso'
    );
    
    renderizarTamanhos();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao alterar status', 'erro');
    await carregarTamanhos();
  }
}

// ============================================
// CONFIRMAR EXCLUSÃO
// ============================================
function confirmarExclusaoTamanho(id) {
  const tam = todosTamanhos.find(t => t.id === id);
  if (!tam) return;
  
  tamanhoExcluindo = tam;
  document.getElementById('nomeTamanhoExcluir').textContent = tam.nome;
  document.getElementById('btnConfirmarExcluir').onclick = executarExclusaoTamanho;
  document.getElementById('modalExcluir').classList.add('ativo');
}

// ============================================
// FECHAR MODAL EXCLUIR
// ============================================
function fecharModalExcluir() {
  document.getElementById('modalExcluir').classList.remove('ativo');
  tamanhoExcluindo = null;
}

// ============================================
// EXECUTAR EXCLUSÃO
// ============================================
async function executarExclusaoTamanho() {
  if (!tamanhoExcluindo) return;
  
  const btn = document.getElementById('btnConfirmarExcluir');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  
  try {
    // Deletar imagem do storage
    if (tamanhoExcluindo.imagem_url) {
      await deletarImagem(tamanhoExcluindo.imagem_url, 'acai');
    }
    
    const { error } = await supabaseAdmin
      .from('acai_tamanhos')
      .delete()
      .eq('id', tamanhoExcluindo.id);
    
    if (error) throw error;
    
    mostrarToastAdmin('Tamanho excluído!', 'sucesso');
    fecharModalExcluir();
    await carregarTamanhos();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao excluir', 'erro');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash"></i> Excluir';
  }
}