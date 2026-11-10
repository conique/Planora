/* Planora — js/core/06-login-ui.js
   Tela de login/cadastro.
   Trecho do antigo js/db.js, linhas 464–553. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* ---------- login ---------- */
function telaLogin(): Promise<SupabaseSessao> {
    return new Promise(res => {
        const o = document.createElement('div');
        o.className = 'lg-overlay lg-pagina';
        document.body.appendChild(o);
        document.documentElement.dataset.auth = 'login';
        const concluirLogin = res;
        res = sessao => { delete document.documentElement.dataset.auth; concluirLogin(sessao); };
        let modo = 'entrar', email = '', senha = '';
        const esc = (t: unknown) => String(t).replace(/[&<>"']/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const q = (s: string) => o.querySelector(s);
        const msg = (t: string, ok?: boolean) => { const m = q('.lg-msg'); m.textContent = t; m.className = 'lg-msg' + (ok ? ' ok' : ''); };
        const traduz = (e: SupabaseErro) => {
            const m = (e.message || '').toLowerCase();
            if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
            if (m.includes('rate limit') || e.status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
            if (m.includes('password')) return 'A senha precisa ter no mínimo 6 caracteres.';
            if (m.includes('invalid') && m.includes('email')) return 'Digite um e-mail válido.';
            return 'Não foi possível concluir: ' + e.message;
        };
        const ocupado = (btn: HTMLButtonElement, on: boolean, txt: string) => { btn.disabled = on; if (txt) btn.textContent = txt; };
        const entrar = async (btn: HTMLButtonElement, txtBtn: string) => {
            ocupado(btn, true, 'Entrando...');
            const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
            ocupado(btn, false, txtBtn);
            if (error) {
                if ((error.message || '').toLowerCase().includes('not confirmed')) { modo = 'confirmar'; return desenhar('Seu e-mail ainda não foi confirmado. Abra o link que enviamos.'); }
                return msg(traduz(error));
            }
            o.remove(); res(data.session);
        };

        function desenhar(aviso?: string) {
            if (modo === 'confirmar') {
                o.innerHTML = `<div class="lg-card">
                    <div class="lg-logo ok">✉</div><h2>Confira seu e-mail</h2>
                    <p class="lg-sub">Enviamos um link de confirmação para <strong>${esc(email)}</strong>.</p>
                    <ol class="lg-passos"><li>Abra o e-mail (olhe também o spam e a lixeira).</li><li>Clique no link de confirmação.</li><li>Volte aqui e toque em “Já confirmei”.</li></ol>
                    <p class="lg-msg" role="alert"></p>
                    <button class="lg-principal" id="lg-ja" type="button">Já confirmei, entrar</button>
                    <div class="lg-links"><button id="lg-reenviar" type="button">Reenviar e-mail</button><button id="lg-voltar" type="button">Voltar</button></div></div>`;
                if (aviso) msg(aviso);
                (q('#lg-ja') as HTMLElement).onclick = () => entrar((q('#lg-ja') as HTMLButtonElement), 'Já confirmei, entrar');
                (q('#lg-voltar') as HTMLElement).onclick = () => { modo = 'entrar'; desenhar(); };
                (q('#lg-reenviar') as HTMLElement).onclick = async () => {
                    const b = q('#lg-reenviar') as HTMLButtonElement;
                    b.disabled = true;
                    const { error } = await sb.auth.resend({ type: 'signup', email });
                    if (error) { b.disabled = false; return msg(traduz(error)); }
                    msg('E-mail reenviado. Confira sua caixa de entrada.', true);
                    let s = 60; const t = setInterval(() => { b.textContent = s > 0 ? `Reenviar em ${s--}s` : 'Reenviar e-mail'; if (s < 0) { clearInterval(t); b.disabled = false; } }, 1000);
                };
                return;
            }
            const criar = modo === 'criar', rot = criar ? 'Criar conta' : 'Entrar';
            o.innerHTML = `<div class="lg-card">
                <div class="lg-logo"><img src="assets/planora-logo.png" alt="Planora"></div>
                <h2>${criar ? 'Criar sua conta' : 'Bem-vindo de volta'}</h2>
                <p class="lg-sub">${criar ? 'Guarde seus projetos na nuvem e acesse de qualquer computador.' : 'Entre para acessar seus projetos em qualquer computador.'}</p>
                <div class="lg-abas"><button type="button" data-m="entrar" class="${criar ? '' : 'on'}">Entrar</button><button type="button" data-m="criar" class="${criar ? 'on' : ''}">Criar conta</button></div>
                <label>E-mail<input id="lg-email" type="email" autocomplete="username" placeholder="voce@empresa.com" value="${esc(email)}"></label>
                <label>Senha<input id="lg-senha" type="password" autocomplete="${criar ? 'new-password' : 'current-password'}" placeholder="Mínimo 6 caracteres"></label>
                ${criar ? '<label>Confirmar senha<input id="lg-senha2" type="password" autocomplete="new-password" placeholder="Repita a senha"></label>' : ''}
                <p class="lg-msg" role="alert"></p>
                <button class="lg-principal" id="lg-ok" type="button">${rot}</button></div>`;
            if (aviso) msg(aviso, true);
            o.querySelectorAll<HTMLElement>('.lg-abas button').forEach(b => b.onclick = () => { email = (q('#lg-email') as HTMLInputElement).value.trim(); modo = b.dataset.m; desenhar(); });
            const enviar = async () => {
                email = (q('#lg-email') as HTMLInputElement).value.trim(); senha = (q('#lg-senha') as HTMLInputElement).value;
                if (!email || !senha) return msg('Preencha e-mail e senha.');
                if (!criar) return entrar((q('#lg-ok') as HTMLButtonElement), rot);
                if (senha.length < 6) return msg('A senha precisa ter no mínimo 6 caracteres.');
                if (senha !== (q('#lg-senha2') as HTMLInputElement).value) return msg('As senhas não conferem.');
                const btn = q('#lg-ok'); ocupado((btn as HTMLButtonElement), true, 'Criando...');
                const { data, error } = await sb.auth.signUp({ email, password: senha });
                ocupado((btn as HTMLButtonElement), false, rot);
                if (error) return msg(traduz(error));
                if (data.session) { o.remove(); return res(data.session); }
                if (data.user && data.user.identities && data.user.identities.length === 0) { modo = 'entrar'; return desenhar('Este e-mail já tem conta. Digite sua senha para entrar.'); }
                modo = 'confirmar'; desenhar();
            };
            (q('#lg-ok') as HTMLElement).onclick = enviar;
            o.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); }));
            (q(criar || email ? '#lg-senha' : '#lg-email') as HTMLElement).focus();
        }
        desenhar();
    });
}
