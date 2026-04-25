// ============================================
// CONFIGURAÇÃO DO ADMIN
// ============================================

// ⚠️ Mesmas credenciais do supabase-config.js
const ADMIN_SUPABASE_URL = 'https://phdkrjqpvgheiififwhx.supabase.co';
const ADMIN_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZGtyanFwdmdoZWlpZmlmd2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDMzMzcsImV4cCI6MjA5MjYxOTMzN30.qTo_rzO6GUHd16MArk996cmcxF7RFXtxpu3BP6gt-Yc';

// Criar cliente do Supabase
const supabaseAdmin = supabase.createClient(ADMIN_SUPABASE_URL, ADMIN_SUPABASE_ANON_KEY);

// ============================================
// VERIFICAÇÃO DE LOGIN
// ============================================

// Verificar se o usuário está logado
async function verificarAutenticacao() {
  const { data: { session } } = await supabaseAdmin.auth.getSession();
  
  if (!session) {
    // Se não está logado, redireciona pro login
    window.location.href = 'login.html';
    return null;
  }
  
  return session;
}

// Verificar se JÁ está logado (usado na página de login)
async function jaEstaLogado() {
  const { data: { session } } = await supabaseAdmin.auth.getSession();
  
  if (session) {
    // Se já está logado, redireciona pro painel
    window.location.href = 'painel.html';
    return true;
  }
  
  return false;
}

// Fazer logout
async function fazerLogout() {
  await supabaseAdmin.auth.signOut();
  window.location.href = 'login.html';
}

// ============================================
// HELPERS GERAIS
// ============================================

// Formatar preço
function formatarPrecoAdmin(valor) {
  return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}

// Toast de notificação
function mostrarToastAdmin(mensagem, tipo = 'sucesso') {
  const toast = document.createElement('div');
  toast.className = `toast-admin ${tipo}`;
  
  const icone = tipo === 'sucesso' ? 'bi-check-circle-fill' : 
                tipo === 'erro' ? 'bi-x-circle-fill' : 
                'bi-info-circle-fill';
  
  toast.innerHTML = `<i class="bi ${icone}"></i> <span>${mensagem}</span>`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Upload de imagem para o Supabase Storage
async function uploadImagem(arquivo, bucket) {
  if (!arquivo) return null;
  
  const extensao = arquivo.name.split('.').pop();
  const nomeArquivo = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extensao}`;
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(nomeArquivo, arquivo);
  
  if (error) {
    console.error('Erro ao fazer upload:', error);
    mostrarToastAdmin('Erro ao enviar imagem', 'erro');
    return null;
  }
  
  // Retornar URL pública
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(nomeArquivo);
  
  return publicUrl;
}

// Deletar imagem do Storage (usado quando excluir produto)
async function deletarImagem(url, bucket) {
  if (!url) return;
  
  try {
    // Extrair nome do arquivo da URL
    const nomeArquivo = url.split('/').pop();
    await supabaseAdmin.storage.from(bucket).remove([nomeArquivo]);
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
  }
}

// Criar sidebar (reutilizável em todas as páginas admin)
function criarSidebar(paginaAtiva = '') {
  return `
    <aside class="admin-sidebar" id="sidebar">
      <div class="admin-sidebar-header">
        <img src="../imagens/logo.png" alt="Figueiredo Confeitaria" onerror="this.style.display='none'">
        <h3>Figueiredo</h3>
        <p>Painel Admin</p>
      </div>
      
      <ul class="admin-menu">
        <li>
          <a href="painel.html" class="${paginaAtiva === 'painel' ? 'ativo' : ''}">
            <i class="bi bi-grid-fill"></i> Dashboard
          </a>
        </li>
        
        <li class="admin-menu-divisor">Produtos</li>
        <li>
          <a href="bolos.html" class="${paginaAtiva === 'bolos' ? 'ativo' : ''}">
            <i class="bi bi-cake2"></i> Bolos de Pote
          </a>
        </li>
        <li>
          <a href="acais.html" class="${paginaAtiva === 'acais' ? 'ativo' : ''}">
            <i class="bi bi-cup-straw"></i> Tamanhos de Açaí
          </a>
        </li>
        <li>
          <a href="ingredientes.html" class="${paginaAtiva === 'ingredientes' ? 'ativo' : ''}">
            <i class="bi bi-flower1"></i> Ingredientes
          </a>
        </li>
        <li>
          <a href="categorias.html" class="${paginaAtiva === 'categorias' ? 'ativo' : ''}">
            <i class="bi bi-tags-fill"></i> Categorias
          </a>
        </li>
        <li>
          <a href="combos.html" class="${paginaAtiva === 'combos' ? 'ativo' : ''}">
            <i class="bi bi-gift-fill"></i> Combos
          </a>
        </li>
        
        <li class="admin-menu-divisor">Vendas</li>
        <li>
          <a href="pedidos.html" class="${paginaAtiva === 'pedidos' ? 'ativo' : ''}">
            <i class="bi bi-bag-fill"></i> Pedidos
          </a>
        </li>
        
        <li class="admin-menu-divisor">Sistema</li>
        <li>
          <a href="configuracoes.html" class="${paginaAtiva === 'configuracoes' ? 'ativo' : ''}">
            <i class="bi bi-gear-fill"></i> Configurações
          </a>
        </li>
        <li>
          <a href="../index.html" target="_blank">
            <i class="bi bi-box-arrow-up-right"></i> Ver site
          </a>
        </li>
      </ul>
      
      <div class="admin-sidebar-footer">
        <button class="btn-logout" onclick="fazerLogout()">
          <i class="bi bi-box-arrow-right"></i> Sair
        </button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
  `;
}

// Criar topbar
function criarTopbar(titulo, emailUsuario = '') {
  return `
    <div class="admin-topbar">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="btn-menu-mobile" onclick="toggleSidebar()">
          <i class="bi bi-list"></i>
        </button>
        <h1>${titulo}</h1>
      </div>
      <div class="usuario-info">
        <div class="usuario-avatar">
          <i class="bi bi-person-fill"></i>
        </div>
        <div>
          <div style="font-size: 0.85rem; font-weight: 500;">Administradora</div>
          <div style="font-size: 0.75rem; color: var(--texto-claro);">${emailUsuario}</div>
        </div>
      </div>
    </div>
  `;
}

// Toggle sidebar mobile
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('ativa');
  if (overlay) overlay.classList.toggle('ativo');
}