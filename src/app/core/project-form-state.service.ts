/* Planora — js/pages/cards/02-minimizar-e-formulario.js
   Minimizar cards, abrir/fechar formulário e ajuste de textarea/legendas.
   Trecho do antigo bloco <script id="app-script"> de cards.html, linhas 146–276. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
        function aplicarMinimizacao(box: HTMLElement, minimizado: boolean, animar: boolean) {
            const conteudo = box.querySelector('[id^="card-conteudo-"]') as HTMLElement;
            box.classList.toggle('minimizado', minimizado);
            if (conteudo) {
                if (minimizado) {
                    const d = conteudo.getAttribute('ondblclick');
                    if (d) { conteudo.dataset.dbl = d; conteudo.removeAttribute('ondblclick'); }
                    conteudo.style.cursor = 'default';
                    conteudo.removeAttribute('title');
                } else if (conteudo.dataset.dbl) {
                    conteudo.setAttribute('ondblclick', conteudo.dataset.dbl);
                    conteudo.style.cursor = 'pointer';
                    conteudo.title = 'Duplo clique para editar';
                }
            }
            const b = box.querySelector('.btn-min-card') as HTMLElement;
            if (b) {
                b.innerHTML = minimizado ? ICONE_QUADRADO : ICONE_MENOS;
                b.title = minimizado ? 'Expandir card' : 'Minimizar card';
                b.setAttribute('aria-label', b.title);
                b.setAttribute('aria-expanded', String(!minimizado));
            }
            if (animar) { box.classList.remove('anim-min'); void box.offsetWidth; box.classList.add('anim-min'); }
        }

        function sincronizarMinimizar() {
            document.querySelectorAll('#feed-timeline .timeline-item').forEach(item => {
                const box = item.querySelector('.timeline-card');
                if (!box) return;
                const card = projetoAtual.cards[Number(box.id.replace('card-box-', ''))];
                const b = box.querySelector('.btn-min-card') as HTMLElement;
                if (!card || !b) return;
                b.onclick = () => {
                    if (box.querySelector('.btn-enviar-card')) return;   // card em edição
                    const novo = !box.classList.contains('minimizado');
                    card.minimizado = novo;
                    db[projetoId] = projetoAtual;
                    salvarBancoDeDados(db);
                    aplicarMinimizacao((box as HTMLElement), novo, true);
                };
                aplicarMinimizacao((box as HTMLElement), !!card.minimizado, false);
            });
        }

        /* Lápis: se o card estiver minimizado, expande e abre a edição. */
        function editarCardPeloLapis(index: number) {
            const box = document.getElementById(`card-box-${index}`);
            if (!box || box.querySelector('.btn-enviar-card')) return;
            if (box.classList.contains('minimizado')) {
                projetoAtual.cards[index].minimizado = false;
                db[projetoId] = projetoAtual;
                salvarBancoDeDados(db);
                aplicarMinimizacao(box, false, false);
            }
            ativarEdicaoCard(index);
        }

        /* Formulário de novo card: abre pelo botão "+" ao lado do primeiro card.
           Em projetos sem cards ele fica sempre aberto. */
        let formularioAberto = false;

        function abrirFecharFormulario(abrir: boolean, focar?: boolean) {
            const form = document.getElementById('form-novo-card');
            formularioAberto = abrir;
            if (abrir) {
                form.hidden = false;
                form.classList.remove('fechando', 'entrando');
                void form.offsetWidth;
                form.classList.add('entrando');
                if (focar) setTimeout(() => document.getElementById('inputTituloCard').focus(), 120);
            } else {
                form.classList.remove('entrando');
                form.classList.add('fechando');
                setTimeout(() => {
                    if (!formularioAberto) { form.hidden = true; form.classList.remove('fechando'); }
                }, 220);
            }
            const b = document.querySelector('.btn-mais-card') as HTMLElement;
            const primeiro = document.querySelector('#feed-timeline .timeline-item');
            const destino = abrir ? form : primeiro;
            if (b && destino) {
                destino.appendChild(b);
                b.classList.toggle('aberto', abrir);
                b.title = abrir ? 'Fechar novo card' : 'Novo card';
                b.setAttribute('aria-label', b.title);
                b.setAttribute('aria-expanded', String(abrir));
            }
        }

        function sincronizarFormulario() {
            const form = document.getElementById('form-novo-card');
            const primeiro = document.querySelector('#feed-timeline .timeline-item');
            if (!primeiro) {                       // sem cards: formulário sempre visível
                formularioAberto = true;
                form.hidden = false;
                form.classList.remove('fechando', 'entrando');
                return;
            }
            if (!form.classList.contains('fechando')) form.hidden = !formularioAberto;
            let b = document.querySelector('.btn-mais-card') as HTMLButtonElement;
            if (!b) {
                b = document.createElement('button');
                b.type = 'button';
                b.className = 'btn-mais-card';
                b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>';
                b.onclick = () => abrirFecharFormulario(!formularioAberto, true);
            }
            b.classList.toggle('aberto', formularioAberto);
            b.title = formularioAberto ? 'Fechar novo card' : 'Novo card';
            b.setAttribute('aria-label', b.title);
            b.setAttribute('aria-expanded', String(formularioAberto));
            (formularioAberto ? form : primeiro).appendChild(b);
        }

        /* Campos de legenda crescem junto com o texto (Enter pula linha). */
        function ajustarAlturaTextarea(campo: HTMLTextAreaElement) {
            if (!campo) return;
            campo.style.height = 'auto';
            campo.style.height = campo.scrollHeight + 2 + 'px';
        }
        function ajustarTodasLegendas() {
            document.querySelectorAll('textarea.input-legenda-card').forEach(ajustarAlturaTextarea);
        }
        document.addEventListener('input', e => {
            if ((e.target as HTMLElement).matches && (e.target as HTMLElement).matches('textarea.input-legenda-card')) ajustarAlturaTextarea((e.target as HTMLTextAreaElement));
        });
        document.addEventListener('focusin', e => {
            if ((e.target as HTMLElement).matches && (e.target as HTMLElement).matches('textarea.input-legenda-card')) ajustarAlturaTextarea((e.target as HTMLTextAreaElement));
        });
        window.addEventListener('resize', ajustarTodasLegendas);
