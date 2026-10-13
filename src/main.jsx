import './index.css';

/*
 * TechFlow Dashboard — JavaScript puro (sem React)
 * Responsável por: tema (Light/Dark/System + localStorage), sidebar mobile,
 * dropdown do usuário, modal + validação do formulário, busca e filtros.
 */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;

  /* =========================================================
   * 1. TEMA — Light | Dark | System
   * ======================================================= */
  const THEME_KEY = 'techflow-theme';
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const themeButtons = $$('[data-theme-option]');

  const ACTIVE_THEME = ['bg-white', 'text-brand-700', 'shadow-sm', 'dark:bg-slate-900', 'dark:text-brand-300'];
  const INACTIVE_THEME = ['text-slate-500', 'hover:text-slate-900', 'dark:text-slate-400', 'dark:hover:text-white'];

  function getThemePreference() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
    } catch (e) {
      return 'system';
    }
  }

  function applyTheme(pref) {
    const isDark = pref === 'dark' || (pref === 'system' && systemDark.matches);
    root.classList.toggle('dark', isDark);

    themeButtons.forEach((btn) => {
      const active = btn.dataset.themeOption === pref;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.remove(...(active ? INACTIVE_THEME : ACTIVE_THEME));
      btn.classList.add(...(active ? ACTIVE_THEME : INACTIVE_THEME));
    });
  }

  function setTheme(pref) {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) { /* ignora */ }
    applyTheme(pref);
  }

  themeButtons.forEach((btn) => btn.addEventListener('click', () => setTheme(btn.dataset.themeOption)));

  // No modo System, acompanha a troca de tema do sistema operacional em tempo real
  systemDark.addEventListener('change', () => {
    if (getThemePreference() === 'system') applyTheme('system');
  });

  applyTheme(getThemePreference());

  /* =========================================================
   * 2. SIDEBAR — abrir/fechar no mobile
   * ======================================================= */
  const sidebar = $('#sidebar');
  const overlay = $('#sidebar-overlay');
  const openBtn = $('#sidebar-open');
  const closeBtn = $('#sidebar-close');
  const desktop = window.matchMedia('(min-width: 1024px)');
  let sidebarOpen = false;

  function openSidebar() {
    sidebarOpen = true;
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0', 'shadow-2xl');
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
    closeBtn.focus();
  }

  function closeSidebar(returnFocus = true) {
    if (!sidebarOpen) return;
    sidebarOpen = false;
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0', 'shadow-2xl');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
    if (returnFocus && !desktop.matches) openBtn.focus();
  }

  openBtn.addEventListener('click', () => (sidebarOpen ? closeSidebar() : openSidebar()));
  closeBtn.addEventListener('click', () => closeSidebar());
  overlay.addEventListener('click', () => closeSidebar());

  // Ao chegar no desktop, a sidebar fica fixa: limpa o estado do menu mobile
  desktop.addEventListener('change', (e) => { if (e.matches) closeSidebar(false); });

  // Link ativo + fecha o menu ao navegar no mobile
  $$('[data-nav]').forEach((link) => {
    link.addEventListener('click', () => {
      $$('[data-nav]').forEach((l) => l.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'page');
      if (!desktop.matches) closeSidebar(false);
    });
  });
  $$('#team-list a').forEach((a) => a.addEventListener('click', () => { if (!desktop.matches) closeSidebar(false); }));

  /* =========================================================
   * 3. DROPDOWN DO USUÁRIO
   * ======================================================= */
  const userBtn = $('#user-menu-button');
  const dropdown = $('#user-dropdown');
  const chevron = $('#user-chevron');
  let dropdownOpen = false;

  function setDropdown(open) {
    dropdownOpen = open;
    userBtn.setAttribute('aria-expanded', String(open));
    dropdown.classList.toggle('opacity-0', !open);
    dropdown.classList.toggle('scale-95', !open);
    dropdown.classList.toggle('-translate-y-1', !open);
    dropdown.classList.toggle('pointer-events-none', !open);
    dropdown.classList.toggle('opacity-100', open);
    dropdown.classList.toggle('scale-100', open);
    dropdown.classList.toggle('translate-y-0', open);
    chevron.classList.toggle('rotate-180', open);
    if (open) {
      const first = dropdown.querySelector('[role="menuitem"]:not([disabled])');
      if (first) first.focus({ preventScroll: true });
    }
  }

  userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setDropdown(!dropdownOpen);
  });

  // Fecha ao clicar fora
  document.addEventListener('click', (e) => {
    if (dropdownOpen && !$('#user-menu').contains(e.target)) setDropdown(false);
  });

  // Navegação por setas dentro do menu
  dropdown.addEventListener('keydown', (e) => {
    const items = $$('[role="menuitem"]:not([disabled])', dropdown);
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });

  $$('a[role="menuitem"]', dropdown).forEach((item) => item.addEventListener('click', (e) => {
    e.preventDefault();
    setDropdown(false);
    showToast(`"${item.textContent.trim()}" é apenas demonstrativo.`, 'info');
  }));

  /* =========================================================
   * 4. INDICADORES (KPIs) — calculados a partir dos cards
   * ======================================================= */
  const grid = $('#projects-grid');

  function animateCount(el, to) {
    const from = Number(el.dataset.value || 0);
    el.dataset.value = to;
    const start = performance.now();
    const duration = 700;
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function updateKpis() {
    const projects = $$('[data-project]', grid);
    const active = projects.filter((p) => p.dataset.status !== 'concluido').length;
    const done = projects.filter((p) => p.dataset.status === 'concluido').length;
    const tasks = projects.reduce((sum, p) => sum + Number(p.dataset.pending || 0), 0);
    const teams = $$('[data-team]').length;

    animateCount($('#kpi-active'), active);
    animateCount($('#kpi-done'), done);
    animateCount($('#kpi-tasks'), tasks);
    animateCount($('#kpi-teams'), teams);
    $('#nav-project-count').textContent = projects.length;
  }

  /* Checklist do card "Automação de Relatórios" (peer-checked + progresso) */
  $$('[data-project]').forEach((card) => {
    const checks = $$('[data-task]', card);
    if (!checks.length) return;
    const label = $('[data-checklist-progress]', card);
    const bar = $('[data-checklist-bar]', card);
    const refresh = () => {
      const done = checks.filter((c) => c.checked).length;
      label.textContent = `${done}/${checks.length}`;
      bar.style.width = `${(done / checks.length) * 100}%`;
      bar.classList.remove('w-1/2');
    };
    checks.forEach((c) => c.addEventListener('change', refresh));
    refresh();
  });

  /* =========================================================
   * 5. BUSCA + FILTRO POR STATUS
   * ======================================================= */
  const search = $('#search');
  const emptyState = $('#projects-empty');
  const newCard = $('#new-project-card');
  const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function applyFilters() {
    const term = normalize(search.value.trim());
    const status = ($('input[name="status-filter"]:checked') || {}).value || 'all';
    let visible = 0;

    $$('[data-project]', grid).forEach((card) => {
      const matchesStatus = status === 'all' || card.dataset.status === status;
      const matchesTerm = !term || normalize(card.textContent).includes(term);
      const show = matchesStatus && matchesTerm;
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });

    const filtering = term || status !== 'all';
    newCard.classList.toggle('hidden', Boolean(filtering));
    emptyState.classList.toggle('hidden', visible > 0);
    emptyState.classList.toggle('flex', visible === 0);
    $('#projects-visible').textContent = visible;
  }

  search.addEventListener('input', applyFilters);
  $$('input[name="status-filter"]').forEach((r) => r.addEventListener('change', applyFilters));

  // Atalho Ctrl/⌘ + K para focar a busca
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      search.focus();
      search.select();
    }
  });

  /* =========================================================
   * 6. MODAL "NOVO PROJETO"
   * ======================================================= */
  const modal = $('#project-modal');
  const backdrop = $('#modal-backdrop');
  const panel = $('#modal-panel');
  const form = $('#project-form');
  let lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    setDropdown(false);
    closeSidebar(false);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('no-scroll');
    // força o reflow para a transição acontecer
    void panel.offsetWidth;
    backdrop.classList.replace('opacity-0', 'opacity-100');
    panel.classList.remove('opacity-0', 'translate-y-8', 'sm:translate-y-4', 'sm:scale-95');
    panel.classList.add('opacity-100', 'translate-y-0', 'sm:scale-100');
    setTimeout(() => $('#nome').focus(), 150);
  }

  function closeModal(force = false) {
    if (modal.classList.contains('hidden')) return;
    if (force !== true && submitBtn.disabled) return; // não fecha durante o envio
    backdrop.classList.replace('opacity-100', 'opacity-0');
    panel.classList.add('opacity-0', 'translate-y-8', 'sm:translate-y-4', 'sm:scale-95');
    panel.classList.remove('opacity-100', 'translate-y-0', 'sm:scale-100');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.classList.remove('no-scroll');
      resetForm();
      if (lastFocused) lastFocused.focus();
    }, 280);
  }

  $$('[data-open-modal]').forEach((b) => b.addEventListener('click', openModal));
  $$('[data-close-modal]').forEach((b) => b.addEventListener('click', () => closeModal()));

  // Mantém o foco do teclado dentro do modal
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = $$('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])', panel)
      .filter((el) => el.offsetParent !== null);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // ESC fecha o que estiver aberto (modal > dropdown > sidebar)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modal.classList.contains('hidden')) closeModal();
    else if (dropdownOpen) { setDropdown(false); userBtn.focus(); }
    else if (sidebarOpen) closeSidebar();
  });

  /* =========================================================
   * 7. VALIDAÇÃO VISUAL DO FORMULÁRIO
   * ======================================================= */
  const ICON_OK = '<svg class="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICON_ERR = '<svg class="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';

  const STATE_CLASSES = {
    error: ['border-rose-500!', 'focus:ring-rose-500/20!', 'bg-rose-50/60', 'dark:bg-rose-500/5'],
    success: ['border-emerald-500!', 'focus:ring-emerald-500/20!'],
  };

  const todayISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  $('#prazo').min = todayISO();

  const rules = {
    nome(v) {
      v = v.trim();
      if (!v) return 'Informe o nome do projeto.';
      if (v.length < 3) return 'O nome precisa ter pelo menos 3 caracteres.';
      const exists = $$('[data-title]', grid).some((t) => normalize(t.textContent) === normalize(v));
      if (exists) return 'Já existe um projeto com esse nome.';
      return '';
    },
    responsavel: (v) => (v ? '' : 'Selecione o responsável.'),
    categoria: (v) => (v ? '' : 'Selecione uma categoria.'),
    prioridade: (v) => (v ? '' : 'Escolha a prioridade.'),
    prazo(v) {
      if (!v) return 'Defina o prazo de entrega.';
      if (v < todayISO()) return 'O prazo não pode estar no passado.';
      return '';
    },
    descricao(v) {
      v = v.trim();
      if (!v) return 'Descreva o projeto.';
      if (v.length < 10) return `Escreva pelo menos 10 caracteres (faltam ${10 - v.length}).`;
      return '';
    },
  };

  const successText = {
    nome: 'Nome disponível.',
    responsavel: 'Responsável definido.',
    categoria: 'Categoria selecionada.',
    prioridade: 'Prioridade definida.',
    prazo: 'Prazo válido.',
    descricao: 'Descrição ok.',
  };

  const touched = new Set();

  function getValue(name) {
    if (name === 'prioridade') {
      const checked = form.querySelector('input[name="prioridade"]:checked');
      return checked ? checked.value : '';
    }
    return form.elements[name].value;
  }

  function setFieldState(name, state, message) {
    const field = form.querySelector(`[data-field="${name}"]`);
    const control = name === 'prioridade' ? $('.priority-group', field) : form.elements[name];
    const msg = $('[data-message]', field);
    const icon = $('[data-icon]', field);

    control.classList.remove(...STATE_CLASSES.error, ...STATE_CLASSES.success);
    if (name === 'prioridade') control.classList.remove('ring-2', 'ring-rose-500', 'ring-offset-2', 'dark:ring-offset-slate-900');
    msg.classList.add('hidden');
    msg.classList.remove('text-rose-600', 'dark:text-rose-400', 'text-emerald-600', 'dark:text-emerald-400');
    if (icon) icon.innerHTML = '';

    if (name !== 'prioridade') control.setAttribute('aria-invalid', String(state === 'error'));

    if (state === 'error') {
      if (name === 'prioridade') control.classList.add('ring-2', 'ring-rose-500', 'ring-offset-2', 'dark:ring-offset-slate-900');
      else control.classList.add(...STATE_CLASSES.error);
      msg.textContent = message;
      msg.classList.remove('hidden');
      msg.classList.add('text-rose-600', 'dark:text-rose-400');
      if (icon) icon.innerHTML = ICON_ERR;
    } else if (state === 'success') {
      if (name !== 'prioridade') control.classList.add(...STATE_CLASSES.success);
      msg.textContent = successText[name];
      msg.classList.remove('hidden');
      msg.classList.add('text-emerald-600', 'dark:text-emerald-400');
      if (icon) icon.innerHTML = ICON_OK;
    }
  }

  function validateField(name) {
    const error = rules[name](getValue(name));
    setFieldState(name, error ? 'error' : 'success', error);
    // Esconde o alerta geral assim que todos os campos ficam válidos
    const alertBox = document.getElementById('form-alert');
    if (!error && alertBox && !alertBox.classList.contains('hidden')
        && Object.keys(rules).every((n) => !rules[n](getValue(n)))) {
      alertBox.classList.add('hidden');
      alertBox.classList.remove('flex');
    }
    return !error;
  }

  // Valida ao sair do campo e, depois de tocado, a cada digitação
  Object.keys(rules).forEach((name) => {
    const els = name === 'prioridade' ? $$('input[name="prioridade"]', form) : [form.elements[name]];
    els.forEach((el) => {
      el.addEventListener('blur', () => { touched.add(name); validateField(name); });
      el.addEventListener('input', () => { if (touched.has(name)) validateField(name); });
      el.addEventListener('change', () => { touched.add(name); validateField(name); });
    });
  });

  const descricao = $('#descricao');
  const counter = $('#descricao-count');
  descricao.addEventListener('input', () => {
    const n = descricao.value.length;
    counter.textContent = `${n}/300`;
    counter.classList.toggle('text-amber-500', n >= 270);
  });

  const formAlert = $('#form-alert');
  const submitBtn = $('#submit-btn');

  function setSubmitting(on) {
    submitBtn.disabled = on;
    $('#submit-spinner').classList.toggle('hidden', !on);
    $('#submit-label').textContent = on ? 'Salvando...' : 'Salvar projeto';
    $$('.form-control, input[name="prioridade"], [data-close-modal]', modal).forEach((el) => { el.disabled = on; });
  }

  function resetForm() {
    form.reset();
    touched.clear();
    Object.keys(rules).forEach((name) => setFieldState(name, 'idle'));
    formAlert.classList.add('hidden');
    formAlert.classList.remove('flex');
    counter.textContent = '0/300';
    setSubmitting(false);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const names = Object.keys(rules);
    names.forEach((n) => touched.add(n));
    const invalid = names.filter((n) => !validateField(n));

    if (invalid.length) {
      $('#form-alert-text').textContent = invalid.length === 1
        ? 'Corrija o campo destacado para continuar.'
        : `Corrija os ${invalid.length} campos destacados para continuar.`;
      formAlert.classList.remove('hidden');
      formAlert.classList.add('flex');
      panel.classList.remove('tf-shake');
      void panel.offsetWidth;
      panel.classList.add('tf-shake');
      const firstInvalid = invalid[0] === 'prioridade'
        ? form.querySelector('input[name="prioridade"]')
        : form.elements[invalid[0]];
      firstInvalid.focus();
      return;
    }

    formAlert.classList.add('hidden');
    formAlert.classList.remove('flex');

    const data = Object.fromEntries(names.map((n) => [n, getValue(n).trim()]));

    // Simula uma requisição (não há banco de dados)
    setSubmitting(true);
    setTimeout(() => {
      addProjectCard(data);
      showToast(`Projeto "${data.nome}" criado com sucesso!`, 'success');
      closeModal(true);
    }, 900);
  });

  /* =========================================================
   * 8. CRIAÇÃO DO CARD DO NOVO PROJETO
   * ======================================================= */
  const CATEGORY_STYLE = {
    'Desenvolvimento': 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
    'Mobile': 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    'Design': 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    'Infraestrutura': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    'Marketing': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    'Dados & IA': 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  };
  const PRIORITY_STYLE = {
    'Baixa': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    'Média': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    'Alta': 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  };

  const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formatDate = (iso) => iso.split('-').reverse().join('/');

  function addProjectCard({ nome, responsavel, categoria, prioridade, prazo, descricao: desc }) {
    const card = document.createElement('article');
    card.dataset.project = '';
    card.dataset.status = 'andamento';
    card.dataset.pending = '1';
    card.className = 'project-card tf-pop group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40';
    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_STYLE[categoria] || CATEGORY_STYLE.Desenvolvimento}">${escapeHTML(categoria)}</span>
        <span class="rounded-full px-2 py-1 text-[11px] font-semibold ${PRIORITY_STYLE[prioridade]}">${escapeHTML(prioridade)}</span>
      </div>
      <div class="mt-4 flex items-center gap-2">
        <h3 data-title class="font-bold text-slate-900 dark:text-white">${escapeHTML(nome)}</h3>
        <span class="rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Novo</span>
      </div>
      <p class="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">${escapeHTML(desc)}</p>
      <div class="mt-auto pt-5">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400"><span>Em andamento</span><span>0%</span></div>
        <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-full w-0 rounded-full bg-brand-500"></div></div>
        <div class="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span data-responsible class="font-medium text-slate-700 dark:text-slate-300">${escapeHTML(responsavel)}</span>
          <time datetime="${prazo}">${formatDate(prazo)}</time>
        </div>
      </div>`;

    grid.insertBefore(card, newCard);
    addActivity(responsavel, nome);
    updateKpis();
    applyFilters();
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function addActivity(person, project) {
    const initials = person.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    const li = document.createElement('li');
    li.className = 'group relative flex gap-4 pb-6 last:pb-0 animate-fade-up';
    li.innerHTML = `
      <span class="absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px bg-slate-200 group-last:hidden dark:bg-slate-800"></span>
      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-300">${escapeHTML(initials)}</span>
      <div class="min-w-0 flex-1">
        <p class="text-sm text-slate-700 dark:text-slate-300"><span class="font-semibold text-slate-900 dark:text-white">${escapeHTML(person)}</span> assumiu o projeto <span class="font-semibold">${escapeHTML(project)}</span></p>
        <p class="mt-0.5 text-xs text-slate-400">agora mesmo</p>
      </div>`;
    $('#activity-feed').prepend(li);
  }

  /* =========================================================
   * 9. TOASTS (feedback)
   * ======================================================= */
  function showToast(message, type = 'success') {
    const colors = type === 'success'
      ? 'bg-emerald-600 text-white'
      : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.className = `pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl translate-y-4 opacity-0 transition-all duration-300 ease-out ${colors}`;
    toast.innerHTML = `${type === 'success' ? ICON_OK.replace('text-emerald-500', 'text-white') : ''}<span>${escapeHTML(message)}</span>`;
    $('#toast-region').appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-y-4', 'opacity-0'));
    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /* =========================================================
   * INICIALIZAÇÃO
   * ======================================================= */
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#today').textContent = today.charAt(0).toUpperCase() + today.slice(1);

  updateKpis();
  applyFilters();
})();