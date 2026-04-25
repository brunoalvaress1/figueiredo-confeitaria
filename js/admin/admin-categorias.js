// ============================================
// GERENCIAR CATEGORIAS DE INGREDIENTES
// ============================================

let todasCategorias = [];
let categoriaExcluindo = null;

document.addEventListener('DOMContentLoaded', async function() {
  const session = await verificarAutenticacao();
  if (!session) return;
  
  document.getElementById('sidebarContainer').innerHTML = criarSidebar('categorias');
  document.getElementById('topbarContainer').innerHTML = criarTopbar('Categorias', session.user.email);
  
  await carregarCategorias();
});

// ============================================
// CARREGAR CATEGORIAS
// ============================================
async function carregarCategorias() {
  const container = document.getElementById('containerCategorias');
  
  try {
    // Buscar categorias com contagem de ingredientes
    const { data, error } = await supabaseAdmin
      .from('acai_categorias')
      .select(`
        *,
        ingredientes:acai_ingredientes(count)
      `)
      .order('ordem', { ascending: true });
    
    if (error) throw error;
    
    todasCategorias = data || [];
    renderizarCategorias();
    
  } catch (error) {
    console.error('Erro:', error);
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-exclamation-circle"></i>
        <p>Erro ao carregar categorias.</p>
      </div>
    `;
  }
}

// ============================================
// RENDERIZAR CATEGORIAS
// ============================================
function renderizarCategorias() {
  const container = document.getElementById('containerCategorias');
  
  if (todasCategorias.length === 0) {
    container.innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-tags"></i>
        <p>Nenhuma categoria cadastrada.</p>
        <button class="btn-admin mt-3" onclick="abrirModalCategoria()">
          <i class="bi bi-plus-lg"></i> Criar primeira categoria
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
            <th style="width: 60px;">Ícone</th>
            <th>Nome</th>
            <th>Slug</th>
            <th>Ingredientes</th>
            <th>Ordem</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Loop pelas categorias - MONTA CADA LINHA DA TABELA
  todasCategorias.forEach(cat => {
    const qtdIngredientes = cat.ingredientes?.[0]?.count || 0;
    
    html += `
      <tr>
        <td>
          <div style="width: 40px; height: 40px; background: var(--rosa-claro); color: var(--rosa-principal); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            <i class="bi ${cat.icone || 'bi-circle'}"></i>
          </div>
        </td>
        <td>
          <div style="font-weight: 600;">${cat.nome}</div>
        </td>
        <td>
          <code style="background: var(--cinza-fundo); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${cat.slug}</code>
        </td>
        <td>
          <span class="badge-status ${qtdIngredientes > 0 ? 'badge-ativo' : 'badge-inativo'}">
            ${qtdIngredientes} ${qtdIngredientes === 1 ? 'ingrediente' : 'ingredientes'}
          </span>
        </td>
        <td>${cat.ordem || 0}</td>
        <td>
          <div class="acoes">
            <button class="btn-admin secundario pequeno" onclick="editarCategoria('${cat.id}')" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-admin perigo pequeno" onclick="confirmarExclusaoCategoria('${cat.id}')" title="Excluir">
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
      Total: <strong>${todasCategorias.length}</strong> ${todasCategorias.length === 1 ? 'categoria' : 'categorias'}
    </div>
  `;
  
  container.innerHTML = html;
}

// ============================================
// GERAR SLUG AUTOMÁTICO
// ============================================
function gerarSlug() {
  const nome = document.getElementById('nomeCategoria').value;
  const slug = document.getElementById('slugCategoria');
  
  // Só gera se o campo slug estiver vazio
  if (slug.value) return;
  
  const novoSlug = nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Espaços vira hífen
    .replace(/-+/g, '-') // Múltiplos hífens vira um
    .trim();
  
  slug.value = novoSlug;
}

// ============================================
// ABRIR MODAL (NOVA)
// ============================================
function abrirModalCategoria() {
  document.getElementById('formCategoria').reset();
  document.getElementById('categoriaId').value = '';
  document.getElementById('ordemCategoria').value = todasCategorias.length;
  document.getElementById('tituloModalCategoria').innerHTML = '<i class="bi bi-plus-circle"></i> Nova Categoria';
  document.getElementById('modalCategoria').classList.add('ativo');
}

// ============================================
// FECHAR MODAL
// ============================================
function fecharModalCategoria() {
  document.getElementById('modalCategoria').classList.remove('ativo');
}

// ============================================
// EDITAR CATEGORIA
// ============================================
function editarCategoria(id) {
  const cat = todasCategorias.find(c => c.id === id);
  if (!cat) return;
  
  document.getElementById('categoriaId').value = cat.id;
  document.getElementById('nomeCategoria').value = cat.nome;
  document.getElementById('slugCategoria').value = cat.slug;
  document.getElementById('iconeCategoria').value = cat.icone || '';
  document.getElementById('ordemCategoria').value = cat.ordem || 0;
  
  document.getElementById('tituloModalCategoria').innerHTML = '<i class="bi bi-pencil"></i> Editar Categoria';
  document.getElementById('modalCategoria').classList.add('ativo');
}

// ============================================
// SALVAR CATEGORIA
// ============================================
async function salvarCategoria(event) {
  event.preventDefault();
  
  const btn = document.getElementById('btnSalvarCategoria');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
  
  try {
    const id = document.getElementById('categoriaId').value;
    const isEdicao = !!id;
    
    const dados = {
      nome: document.getElementById('nomeCategoria').value.trim(),
      slug: document.getElementById('slugCategoria').value.trim().toLowerCase(),
      icone: document.getElementById('iconeCategoria').value.trim() || null,
      ordem: parseInt(document.getElementById('ordemCategoria').value) || 0
    };
    
    // Validar slug
    if (!/^[a-z0-9-]+$/.test(dados.slug)) {
      mostrarToastAdmin('O slug deve conter apenas letras minúsculas, números e hífens', 'erro');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Salvar';
      return;
    }
    
    if (isEdicao) {
      const { error } = await supabaseAdmin
        .from('acai_categorias')
        .update(dados)
        .eq('id', id);
      
      if (error) throw error;
      mostrarToastAdmin('Categoria atualizada!', 'sucesso');
    } else {
      const { error } = await supabaseAdmin
        .from('acai_categorias')
        .insert(dados);
      
      if (error) throw error;
      mostrarToastAdmin('Categoria criada!', 'sucesso');
    }
    
    fecharModalCategoria();
    await carregarCategorias();
    
  } catch (error) {
    console.error('Erro:', error);
    if (error.message.includes('duplicate key')) {
      mostrarToastAdmin('Já existe uma categoria com esse slug!', 'erro');
    } else {
      mostrarToastAdmin('Erro ao salvar: ' + error.message, 'erro');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Salvar';
  }
}

// ============================================
// CONFIRMAR EXCLUSÃO
// ============================================
function confirmarExclusaoCategoria(id) {
  const cat = todasCategorias.find(c => c.id === id);
  if (!cat) return;
  
  categoriaExcluindo = cat;
  const qtdIngredientes = cat.ingredientes?.[0]?.count || 0;
  
  const texto = qtdIngredientes > 0
    ? `<strong style="color: #DC3545;">Atenção!</strong> Esta categoria possui <strong>${qtdIngredientes} ingrediente(s)</strong>. Ao excluir, os ingredientes ficarão sem categoria.`
    : `A categoria <strong>${cat.nome}</strong> será removida permanentemente.`;
  
  document.getElementById('textoExcluirCategoria').innerHTML = texto;
  document.getElementById('btnConfirmarExcluir').onclick = executarExclusaoCategoria;
  document.getElementById('modalExcluir').classList.add('ativo');
}

// ============================================
// FECHAR MODAL EXCLUIR
// ============================================
function fecharModalExcluir() {
  document.getElementById('modalExcluir').classList.remove('ativo');
  categoriaExcluindo = null;
}

// ============================================
// EXECUTAR EXCLUSÃO
// ============================================
async function executarExclusaoCategoria() {
  if (!categoriaExcluindo) return;
  
  const btn = document.getElementById('btnConfirmarExcluir');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  
  try {
    const { error } = await supabaseAdmin
      .from('acai_categorias')
      .delete()
      .eq('id', categoriaExcluindo.id);
    
    if (error) throw error;
    
    mostrarToastAdmin('Categoria excluída!', 'sucesso');
    fecharModalExcluir();
    await carregarCategorias();
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao excluir categoria', 'erro');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash"></i> Excluir';
  }
}

