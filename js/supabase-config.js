// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================
// Aqui fica a conexão entre o site e o banco de dados

// ⚠️ SUBSTITUA pelos dados do SEU projeto Supabase:
// (Settings > API no painel do Supabase)
const SUPABASE_URL = 'https://phdkrjqpvgheiififwhx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZGtyanFwdmdoZWlpZmlmd2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDMzMzcsImV4cCI6MjA5MjYxOTMzN30.qTo_rzO6GUHd16MArk996cmcxF7RFXtxpu3BP6gt-Yc';

// Criar cliente do Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FUNÇÕES AUXILIARES PARA BUSCAR DADOS
// ============================================

// Buscar todos os bolos ativos
async function buscarBolos() {
  const { data, error } = await supabaseClient
    .from('bolos')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar bolos:', error);
    return [];
  }
  return data;
}

// Buscar bolos em destaque (aparece na home)
async function buscarBolosDestaque() {
  const { data, error } = await supabaseClient
    .from('bolos')
    .select('*')
    .eq('ativo', true)
    .eq('destaque', true)
    .order('ordem', { ascending: true })
    .limit(4);
  
  if (error) {
    console.error('Erro ao buscar bolos destaque:', error);
    return [];
  }
  return data;
}

// Buscar tamanhos de açaí
async function buscarTamanhosAcai() {
  const { data, error } = await supabaseClient
    .from('acai_tamanhos')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar tamanhos:', error);
    return [];
  }
  return data;
}

// Buscar categorias de ingredientes
async function buscarCategoriasIngredientes() {
  const { data, error } = await supabaseClient
    .from('acai_categorias')
    .select('*')
    .order('ordem', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
  return data;
}

// Buscar ingredientes disponíveis (com categoria e preço)
async function buscarIngredientes() {
  const { data, error } = await supabaseClient
    .from('acai_ingredientes')
    .select(`
      *,
      categoria:acai_categorias(id, nome, slug, icone, ordem)
    `)
    .eq('disponivel', true)
    .order('ordem', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar ingredientes:', error);
    return [];
  }
  return data;
}

// Buscar combos ativos
async function buscarCombos() {
  const { data, error } = await supabaseClient
    .from('combos')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar combos:', error);
    return [];
  }
  return data;
}

// Buscar configurações da loja
async function buscarConfiguracoes() {
  const { data, error } = await supabaseClient
    .from('configuracoes')
    .select('chave, valor');
  
  if (error) {
    console.error('Erro ao buscar configurações:', error);
    return {};
  }
  
  // Transformar em objeto: { whatsapp: '5592...', instagram: '@...' }
  const config = {};
  data.forEach(item => {
    config[item.chave] = item.valor;
  });
  return config;
}

// Formatar preço (13.00 → R$ 13,00)
function formatarPreco(valor) {
  return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}