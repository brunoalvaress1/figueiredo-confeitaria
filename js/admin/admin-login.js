// ============================================
// LOGIN DO PAINEL ADMIN
// ============================================

// Ao carregar a página, verifica se já está logado
document.addEventListener('DOMContentLoaded', async function() {
  await jaEstaLogado();
});

// Função de login
async function fazerLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const btn = document.getElementById('btnEntrar');
  const alertaErro = document.getElementById('alertaErro');
  const alertaSucesso = document.getElementById('alertaSucesso');
  
  // Esconder alertas
  alertaErro.classList.remove('ativo');
  alertaSucesso.classList.remove('ativo');
  
  // Validar campos
  if (!email || !senha) {
    mostrarErroLogin('Preencha todos os campos.');
    return;
  }
  
  // Desabilitar botão
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Entrando...';
  
  try {
    // Fazer login no Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: email,
      password: senha
    });
    
    if (error) {
      // Tratar erros específicos
      if (error.message.includes('Invalid login credentials')) {
        mostrarErroLogin('E-mail ou senha incorretos.');
      } else if (error.message.includes('Email not confirmed')) {
        mostrarErroLogin('E-mail não confirmado. Verifique sua caixa de entrada.');
      } else {
        mostrarErroLogin('Erro ao fazer login: ' + error.message);
      }
      
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> ENTRAR';
      return;
    }
    
    // Login bem sucedido
    mostrarSucessoLogin('Login realizado! Redirecionando...');
    
    // Redirecionar após 1 segundo
    setTimeout(() => {
      window.location.href = 'painel.html';
    }, 1000);
    
  } catch (err) {
    mostrarErroLogin('Erro inesperado. Tente novamente.');
    console.error(err);
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> ENTRAR';
  }
}

// Esqueci minha senha
async function esqueciSenha(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  
  if (!email) {
    mostrarErroLogin('Digite seu e-mail no campo acima primeiro.');
    document.getElementById('email').focus();
    return;
  }
  
  if (!confirm(`Enviar link de recuperação de senha para ${email}?`)) return;
  
  try {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/admin/login.html'
    });
    
    if (error) {
      mostrarErroLogin('Erro ao enviar e-mail: ' + error.message);
    } else {
      mostrarSucessoLogin('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    }
  } catch (err) {
    mostrarErroLogin('Erro inesperado. Tente novamente.');
  }
}

// Mostrar mensagens
function mostrarErroLogin(mensagem) {
  const alerta = document.getElementById('alertaErro');
  alerta.textContent = mensagem;
  alerta.classList.add('ativo');
}

function mostrarSucessoLogin(mensagem) {
  const alerta = document.getElementById('alertaSucesso');
  alerta.textContent = mensagem;
  alerta.classList.add('ativo');
}