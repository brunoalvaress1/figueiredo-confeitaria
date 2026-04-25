// ============================================
// GERENCIAR INGREDIENTES
// ============================================

let todosIngredientes = [];
let ingredientesFiltrados = [];
let todasCategorias = [];
let imagemParaUploadIngrediente = null;
let ingredienteExcluindo = null;

document.addEventListener('DOMContentLoaded', async function() {
  const session = await verificarAutenticacao();
  if (!session) return;
  
  document.getElementById('sidebarContainer').innerHTML = criarSidebar('ingredientes');
  document.getElementById('topbarContainer').innerHTML = criarTopbar('Ingredientes', session.user.email);
  
  await carregarCategoriasFiltro();
  await carregarIngredientes();
});

// ============================================
// CARREGAR CATEGORIAS (para filtro e modal)
// ============================================
async function carregarCategoriasFiltro() {
  try {
    const { data, error } = await supabaseAdmin
      .from('acai_categorias')
      .select('*')
      .order('ordem', { ascending: true });
    
    if (error) throw error;
    todasCategorias = data || [];
    
    // Preencher select de filtro
    const selectFiltro = document.getElementById('filtroCategoria');
    const selectModal = document.getElementById('categoriaIngrediente');
    
    todasCategorias.forEach(cat => {
      // Filtro
      const optFiltro = document.createElement('option');
      optFiltro.value = cat.id;
      optFiltro.textContent = cat.nome;
      selectFiltro.appendChild(optFiltro);
      
      // Modal
      const optModal = document.createElement('option');
      optModal.value = cat.id;
      optModal.textContent = cat.nome;
      selectModal.appendChild(optModal);
    });
    
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

// ============================================
// CARREGAR INGREDIENTES DO BANCO
// ============================================
async function carregarIngredientes() {
  const container = document.getElementById('containerIngredientes');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('acai_ingredientes')
      .select(`
        *,
        categoria:acai_categorias(id, nome, icone)
      `)
      .order('ordem', { ascending: true });
    
    if (error) throw error;
    
    todosIngredientes = data || [];
    ingredientesFiltrados = [...todosIngredientes];
    renderizarIngredientes();
    
  } catch (error) {
    console.error('Erro:', error);
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-exclamation-circle"></i>
        <p>Erro ao carregar ingredientes.</p>
      </div>
    `;
  }
}

// ============================================
// RENDERIZAR TABELA
// ============================================
function renderizarIngredientes() {
  const container = document.getElementById('containerIngredientes');
  
  if (ingredientesFiltrados.length === 0) {
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-flower1"></i>
        <p>${todosIngredientes.length === 0 ? 'Nenhum ingrediente cadastrado.' : 'Nenhum ingrediente encontrado com esses filtros.'}</p>
        ${todosIngredientes.length === 0 ? '<button class="btn-admin mt-3" onclick="abrirModalIngrediente()"><i class="bi bi-plus-lg"></i> Adicionar o primeiro</button>' : ''}
      </div>
    `;
    return;
  }
  
  let html = `
    <div style="overflow-x: auto;">
      <table class="tabela-admin">
        <thead>
          <tr>
            <th style="width: 60px;">Imagem</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Ordem</th>
            <th>Status</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  ingredientesFiltrados.forEach(ing => {
    const imagem = ing.imagem_url || 'https://via.placeholder.com/50?text=?';
    const categoriaNome = ing.categoria?.nome || '<em style="color:#999">Sem categoria</em>';
    const categoriaIcone = ing.categoria?.icone || 'bi-circle';
    
    const precoTexto = parseFloat(ing.preco) > 0
      ? `<span style="color: var(--rosa-principal); font-weight: 600;">+${formatarPrecoAdmin(ing.preco)}</span>`
      : `<span style="color: #2D9F4F; font-weight: 600; font-size: 0.8rem;">GRÁTIS</span>`;
    
    html += `
      <tr>
        <td>
          <img src="${imagem}" class="thumb" alt="${ing.nome}" onerror="this.src='https://via.placeholder.com/50?text=?'">
        </td>
        <td>
          <div style="font-weight: 600;">${ing.nome}</div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="bi ${categoriaIcone}" style="color: var(--rosa-principal);"></i>
            ${categoriaNome}
          </div>
        </td>
        <td>${precoTexto}</td>
        <td>${ing.ordem || 0}</td>
                <td>
          <span class="badge-status ${ing.disponivel ? 'badge-ativo' : 'badge-inativo'}">
            ${ing.disponivel ? 'Disponível' : 'Indisponível'}
          </span>
        </td>
        <td>
          <div class="acoes">
            <label class="switch" title="${ing.disponivel ? 'Desativar' : 'Ativar'}">
              <input type="checkbox" ${ing.disponivel ? 'checked' : ''} onchange="toggleDisponivelIngrediente('${ing.id}', this.checked)">
              <span class="switch-slider"></span>
            </label>
            <button class="btn-admin secundario pequeno" onclick="editarIngrediente('${ing.id}')" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-admin perigo pequeno" onclick="confirmarExclusaoIngrediente('${ing.id}')" title="Excluir">
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
      Total: <strong>${ingredientesFiltrados.length}</strong> ${ingredientesFiltrados.length === 1 ? 'ingrediente' : 'ingredientes'}
    </div>
  `;
  
  container.innerHTML = html;
}

// ============================================
// FILTRAR INGREDIENTES
// ============================================
function filtrarIngredientes() {
  const termo = document.getElementById('filtroNome').value.toLowerCase();
  const categoria = document.getElementById('filtroCategoria').value;
  const status = document.getElementById('filtroStatus').value;
  
  ingredientesFiltrados = todosIngredientes.filter(ing => {
    // Filtro por nome
    const matchNome = !termo || ing.nome.toLowerCase().includes(termo);
    
    // Filtro por categoria
    let matchCategoria = true;
    if (categoria !== 'todas') {
      matchCategoria = ing.categoria?.id === categoria;
    }
    
    // Filtro por status
    let matchStatus = true;
    if (status === 'disponiveis') matchStatus = ing.disponivel === true;
    else if (status === 'indisponiveis') matchStatus = ing.disponivel === false;
    
    return matchNome && matchCategoria && matchStatus;
  });
  
  renderizarIngredientes();
}

// ============================================
// ABRIR MODAL (NOVO)
// ============================================
function abrirModalIngrediente() {
  // Se não tiver categorias, avisa
  if (todasCategorias.length === 0) {
    mostrarToastAdmin('Crie pelo menos uma categoria antes!', 'erro');
    setTimeout(() => {
      window.location.href = 'categorias.html';
    }, 2000);
    return;
  }
  
  document.getElementById('formIngrediente').reset();
  document.getElementById('ingredienteId').value = '';
  document.getElementById('disponivelIngrediente').checked = true;
  document.getElementById('precoIngrediente').value = 0;
  document.getElementById('ordemIngrediente').value = 0;
  document.getElementById('previewImagemIngrediente').style.display = 'none';
  imagemParaUploadIngrediente = null;
  
  document.getElementById('tituloModalIngrediente').innerHTML = '<i class="bi bi-plus-circle"></i> Novo Ingrediente';
  document.getElementById('modalIngrediente').classList.add('ativo');
}

// ============================================
// FECHAR MODAL
// ============================================
function fecharModalIngrediente() {
  document.getElementById('modalIngrediente').classList.remove('ativo');
  imagemParaUploadIngrediente = null;
}

// ============================================
// EDITAR INGREDIENTE
// ============================================
function editarIngrediente(id) {
  const ing = todosIngredientes.find(i => i.id === id);
  if (!ing) return;
  
  document.getElementById('ingredienteId').value = ing.id;
  document.getElementById('nomeIngrediente').value = ing.nome;
  document.getElementById('categoriaIngrediente').value = ing.categoria_id || '';
  document.getElementById('precoIngrediente').value = ing.preco || 0;
  document.getElementById('ordemIngrediente').value = ing.ordem || 0;
  document.getElementById('disponivelIngrediente').checked = ing.disponivel;
  
  // Mostrar imagem atual
  if (ing.imagem_url) {
    document.getElementById('previewImagemIngrediente').src = ing.imagem_url;
    document.getElementById('previewImagemIngrediente').style.display = 'block';
  } else {
    document.getElementById('previewImagemIngrediente').style.display = 'none';
  }
  
  imagemParaUploadIngrediente = null;
  
  document.getElementById('tituloModalIngrediente').innerHTML = '<i class="bi bi-pencil"></i> Editar Ingrediente';
  document.getElementById('modalIngrediente').classList.add('ativo');
}

// ============================================
// PREVIEW DA IMAGEM
// ============================================
function previewImagemIngrediente(event) {
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
  
  imagemParaUploadIngrediente = arquivo;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('previewImagemIngrediente');
    preview.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(arquivo);
}

// ============================================
// SALVAR INGREDIENTE
// ============================================
async function salvarIngrediente(event) {
  event.preventDefault();
  
  const btn = document.getElementById('btnSalvarIngrediente');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
  
  try {
    const id = document.getElementById('ingredienteId').value;
    const isEdicao = !!id;
    
    const dados = {
      nome: document.getElementById('nomeIngrediente').value.trim(),
      categoria_id: document.getElementById('categoriaIngrediente').value,
      preco: parseFloat(document.getElementById('precoIngrediente').value) || 0,
      ordem: parseInt(document.getElementById('ordemIngrediente').value) || 0,
      disponivel: document.getElementById('disponivelIngrediente').checked
    };
    
    // Upload da imagem se houver
    if (imagemParaUploadIngrediente) {
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando imagem...';
      
      if (isEdicao) {
        const ingAntigo = todosIngredientes.find(i => i.id === id);
        if (ingAntigo && ingAntigo.imagem_url) {
          await deletarImagem(ingAntigo.imagem_url, 'ingredientes');
        }
      }
      
      const urlImagem = await uploadImagem(imagemParaUploadIngrediente, 'ingredientes');
      if (urlImagem) {
        dados.imagem_url = urlImagem;
      }
    }
    
    if (isEdicao) {
      const { error } = await supabaseAdmin
        .from('acai_ingredientes')
        .update(dados)
        .eq('id', id);
      
      if (error) throw error;
      mostrarToastAdmin('Ingrediente atualizado!', 'sucesso');
    } else {
      const { error } = await supabaseAdmin
        .from('acai_ingredientes')
        .insert(dados);
      
      if (error) throw error;
      mostrarToastAdmin('Ingrediente adicionado!', 'sucesso');
    }
    
    fecharModalIngrediente();
    await carregarIngredientes();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao salvar: ' + error.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Salvar';
  }
}

// ============================================
// TOGGLE DISPONÍVEL (switch rápido)
// ============================================
async function toggleDisponivelIngrediente(id, novoStatus) {
  try {
    const { error } = await supabaseAdmin
      .from('acai_ingredientes')
      .update({ disponivel: novoStatus })
      .eq('id', id);
    
    if (error) throw error;
    
    const ing = todosIngredientes.find(i => i.id === id);
    if (ing) ing.disponivel = novoStatus;
    
    mostrarToastAdmin(
      `Ingrediente ${novoStatus ? 'disponibilizado' : 'indisponibilizado'}!`,
      'sucesso'
    );
    
    renderizarIngredientes();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao alterar status', 'erro');
    await carregarIngredientes();
  }
}

// ============================================
// CONFIRMAR EXCLUSÃO
// ============================================
function confirmarExclusaoIngrediente(id) {
  const ing = todosIngredientes.find(i => i.id === id);
  if (!ing) return;
  
  ingredienteExcluindo = ing;
  document.getElementById('nomeIngredienteExcluir').textContent = ing.nome;
  document.getElementById('btnConfirmarExcluir').onclick = executarExclusaoIngrediente;
  document.getElementById('modalExcluir').classList.add('ativo');
}

// ============================================
// FECHAR MODAL EXCLUIR
// ============================================
function fecharModalExcluir() {
  document.getElementById('modalExcluir').classList.remove('ativo');
  ingredienteExcluindo = null;
}

// ============================================
// EXECUTAR EXCLUSÃO
// ============================================
async function executarExclusaoIngrediente() {
  if (!ingredienteExcluindo) return;
  
  const btn = document.getElementById('btnConfirmarExcluir');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  
  try {
    // Deletar imagem do storage
    if (ingredienteExcluindo.imagem_url) {
      await deletarImagem(ingredienteExcluindo.imagem_url, 'ingredientes');
    }
    
    const { error } = await supabaseAdmin
      .from('acai_ingredientes')
      .delete()
      .eq('id', ingredienteExcluindo.id);
    
    if (error) throw error;
    
    mostrarToastAdmin('Ingrediente excluído!', 'sucesso');
    fecharModalExcluir();
    await carregarIngredientes();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao excluir ingrediente', 'erro');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash"></i> Excluir';
  }
}