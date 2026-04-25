// ============================================
// GERENCIAR CONFIGURAÇÕES DA LOJA
// ============================================

let configuracoesOriginais = {};

// Lista de todas as chaves de configuração
const CHAVES_CONFIG = [
  'whatsapp',
  'whatsapp_formatado',
  'instagram',
  'instagram_link',
  'endereco',
  'taxa_entrega',
  'tempo_entrega',
  'valor_minimo',
  'max_ingredientes',
  'texto_acai',
  'msg_whatsapp',
  'slogan',
  'aviso_home'
];

document.addEventListener('DOMContentLoaded', async function() {
  const session = await verificarAutenticacao();
  if (!session) return;
  
  document.getElementById('sidebarContainer').innerHTML = criarSidebar('configuracoes');
  document.getElementById('topbarContainer').innerHTML = criarTopbar('Configurações', session.user.email);
  
  await carregarConfiguracoes();
});

// ============================================
// CARREGAR CONFIGURAÇÕES DO BANCO
// ============================================
async function carregarConfiguracoes() {
  try {
    const { data, error } = await supabaseAdmin
      .from('configuracoes')
      .select('*');
    
    if (error) throw error;
    
    // Converter array em objeto {chave: valor}
    const config = {};
    (data || []).forEach(item => {
      config[item.chave] = item.valor;
    });
    
    configuracoesOriginais = { ...config };
    
        // Preencher campos do formulário
    CHAVES_CONFIG.forEach(chave => {
      const input = document.getElementById(chave);
      if (input) {
        input.value = config[chave] || '';
      }
    });
    
    // Esconder loading e mostrar conteúdo
    document.getElementById('loadingConfig').style.display = 'none';
    document.getElementById('conteudoConfig').style.display = 'block';
    
  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('loadingConfig').innerHTML = `
      <div class="vazio-admin">
        <i class="bi bi-exclamation-circle"></i>
        <p>Erro ao carregar configurações.</p>
        <button class="btn-admin mt-3" onclick="carregarConfiguracoes()">
          <i class="bi bi-arrow-clockwise"></i> Tentar novamente
        </button>
      </div>
    `;
  }
}

// ============================================
// MUDAR DE TAB
// ============================================
function mudarTab(nomeTab) {
  // Remover ativo de todas as tabs
  document.querySelectorAll('.tab-config').forEach(tab => {
    tab.classList.remove('ativa');
  });
  document.querySelectorAll('.tab-conteudo').forEach(conteudo => {
    conteudo.classList.remove('ativa');
  });
  
  // Adicionar ativo na tab clicada
  event.target.closest('.tab-config').classList.add('ativa');
  document.getElementById(`tab-${nomeTab}`).classList.add('ativa');
}

// ============================================
// SALVAR CONFIGURAÇÕES
// ============================================
async function salvarConfiguracoes() {
  const btn = document.getElementById('btnSalvarConfig');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
  
  try {
    // Validações básicas
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const whatsappFormatado = document.getElementById('whatsapp_formatado').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    const endereco = document.getElementById('endereco').value.trim();
    
    if (!whatsapp || !whatsappFormatado) {
      mostrarToastAdmin('WhatsApp é obrigatório!', 'erro');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> SALVAR ALTERAÇÕES';
      // Voltar para a tab de contato
      document.querySelectorAll('.tab-config').forEach(t => t.classList.remove('ativa'));
      document.querySelectorAll('.tab-conteudo').forEach(t => t.classList.remove('ativa'));
      document.querySelectorAll('.tab-config')[0].classList.add('ativa');
      document.getElementById('tab-contato').classList.add('ativa');
      return;
    }
    
    // Validar que o número de WhatsApp contém apenas dígitos
    if (!/^\d+$/.test(whatsapp)) {
      mostrarToastAdmin('O WhatsApp deve conter apenas números!', 'erro');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> SALVAR ALTERAÇÕES';
      return;
    }
    
    // Validar que começa com 55 (Brasil)
    if (!whatsapp.startsWith('55')) {
      mostrarToastAdmin('O WhatsApp deve começar com 55 (código do Brasil)!', 'erro');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> SALVAR ALTERAÇÕES';
      return;
    }
    
    if (!instagram) {
      mostrarToastAdmin('Instagram é obrigatório!', 'erro');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> SALVAR ALTERAÇÕES';
      return;
    }
    
    if (!endereco) {
      mostrarToastAdmin('Endereço é obrigatório!', 'erro');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> SALVAR ALTERAÇÕES';
      return;
    }
    
    // Coletar todos os valores dos campos
    const atualizacoes = [];
    
    for (const chave of CHAVES_CONFIG) {
      const input = document.getElementById(chave);
      if (!input) continue;
      
      const valorNovo = input.value.trim();
      const valorOriginal = configuracoesOriginais[chave] || '';
      
      // Só atualizar se o valor mudou
      if (valorNovo !== valorOriginal) {
        atualizacoes.push({
          chave: chave,
          valorNovo: valorNovo
        });
      }
    }
    
    // Se não houver alterações
    if (atualizacoes.length === 0) {
      mostrarToastAdmin('Nenhuma alteração para salvar.', 'info');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> SALVAR ALTERAÇÕES';
      return;
    }
    
    // Atualizar cada configuração
    for (const item of atualizacoes) {
      // Tentar atualizar primeiro (se existir)
      const { data: existente } = await supabaseAdmin
        .from('configuracoes')
        .select('id')
        .eq('chave', item.chave)
        .maybeSingle();
      
      if (existente) {
        // Atualizar
        const { error } = await supabaseAdmin
          .from('configuracoes')
          .update({ valor: item.valorNovo })
          .eq('chave', item.chave);
        
        if (error) throw error;
      } else {
        // Inserir novo
        const { error } = await supabaseAdmin
          .from('configuracoes')
          .insert({ chave: item.chave, valor: item.valorNovo });
        
        if (error) throw error;
      }
    }
    
    // Atualizar cache local
    atualizacoes.forEach(item => {
      configuracoesOriginais[item.chave] = item.valorNovo;
    });
    
    mostrarToastAdmin(
      `${atualizacoes.length} configuração(ões) atualizada(s) com sucesso!`, 
      'sucesso'
    );
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarToastAdmin('Erro ao salvar: ' + error.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> SALVAR ALTERAÇÕES';
  }
}

// ============================================
// AVISAR SE SAIR SEM SALVAR
// ============================================
window.addEventListener('beforeunload', function(e) {
  let temAlteracoes = false;
  
  for (const chave of CHAVES_CONFIG) {
    const input = document.getElementById(chave);
    if (!input) continue;
    
    const valorAtual = input.value.trim();
    const valorOriginal = configuracoesOriginais[chave] || '';
    
    if (valorAtual !== valorOriginal) {
      temAlteracoes = true;
      break;
    }
  }
  
  if (temAlteracoes) {
    e.preventDefault();
    e.returnValue = '';
  }
});