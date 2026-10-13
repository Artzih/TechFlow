INTERGRANTES

Arthur Kazuo
rm572043

João Fernando
rm572144

## Tecnologias utilizadas
 
- **HTML5** — estrutura semântica (`header`, `aside`, `main`, `section`, `article`) e atributos de acessibilidade (ARIA)
- **Tailwind CSS 4** — todo o layout e estilo, instalado via npm com o plugin `@tailwindcss/vite`; dark mode por classe (`@custom-variant dark`) e tema próprio (`@theme`) em `src/index.css`
- **JavaScript puro** (`src/main.jsx`) — sem React nem outras bibliotecas
- **Vite** — servidor de desenvolvimento e build
## Como executar
 
Pré-requisito: [Node.js](https://nodejs.org) instalado.
 
```bash
npm install
npm run dev
```
 
Abra o endereço mostrado no terminal (normalmente http://localhost:5173).
Para gerar a versão final: `npm run build` (saída na pasta `dist/`).
 
## Arquivos principais
 
| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | estrutura do dashboard, modal e classes do Tailwind |
| `src/index.css` | importação do Tailwind, tema (cores, fonte), dark mode e estilos complementares |
| `src/main.jsx` | JavaScript puro: tema, sidebar, dropdown, validação, busca e filtros |
| `vite.config.js` | Vite com o plugin do Tailwind |
 
## Principais recursos implementados
 
### Dashboard (desktop e mobile)
- **Navbar** fixa com campo de pesquisa, seletor de tema, notificações e informações do usuário
- **Sidebar** fixa no desktop (`lg:`) e menu deslizante com overlay no mobile
- **4 cards de indicadores**: Projetos ativos, Projetos concluídos, Tarefas pendentes e Equipes — os valores são calculados pelo JavaScript a partir dos cards e animados
- **Grid de projetos** com 6 cards de tamanhos diferentes usando `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`, `col-span-2`, `row-span-2` e `grid-flow-dense`
- Feed de atividade recente e carga das equipes
### Modal "Novo projeto"
- Campos: Nome, Responsável, Categoria, Prioridade, Prazo e Descrição
- **Validação visual com JavaScript**: borda, ícone e mensagem de **erro** (vermelho) ou **sucesso** (verde) por campo, alerta geral e animação de "tremida" quando há erros
- Regras: nome com 3+ caracteres e sem duplicidade, selects obrigatórios, prioridade obrigatória, prazo não pode estar no passado, descrição com 10 a 300 caracteres (com contador)
- Botão de envio fica **desabilitado** com spinner durante o "salvamento" simulado
- Ao salvar, o projeto aparece no grid, os indicadores são atualizados e um toast confirma — **sem banco de dados**
- Fecha com o botão X, Cancelar, clique fora ou tecla `Esc`; o foco do teclado fica preso dentro do modal
### Interações e estados
- Dropdown do usuário (abre/fecha com clique, fecha ao clicar fora, `Esc` e navegação por setas)
- Menu mobile da Sidebar (botão hambúrguer, overlay, `Esc`)
- `hover:`, `focus:` / `focus-visible:`, `active:` e `disabled:` (botão Exportar, item "Integrações", upgrade e envio do formulário)
- `group-hover:` nos cards de indicadores, cards de projeto, links da sidebar e notificações
- `peer-checked:` nos filtros de status, nas opções de prioridade e no checklist do card "Automação de Relatórios"
- Transições com `transition`, `transition-all`, `duration-*` e `ease-*`
- Busca em tempo real (atalho `Ctrl + K`) combinada com filtro por status e estado vazio
### Tema Light | Dark | System
- Usa a variante `dark:` do Tailwind com a classe `dark` no `<html>`
- Alterado via JavaScript e salvo no **localStorage** (`techflow-theme`)
- No modo **System**, segue `prefers-color-scheme` e reage na hora quando o sistema troca de tema
- Um script no `<head>` aplica o tema antes da renderização para evitar o "flash" de tema errado
### Responsividade (Mobile-First)
Classes base pensadas para o celular e ampliadas com `sm:`, `md:`, `lg:`, `xl:` e `2xl:` — testado em celular (390px), tablet (820px) e desktop (1440px).
 
## Link do GitHub
 
https://github.com/Artzih/techflow
 
## Dificuldades encontradas
 
- O projeto começou como um template React + Vite; mantivemos o Vite, mas trocamos o React por JavaScript puro e adicionamos o Tailwind CSS 4.
- Configurar o `dark:` do Tailwind 4 para funcionar por classe (e não só pela preferência do sistema), usando `@custom-variant`.
- Montar o grid com cards de tamanhos diferentes sem deixar buracos em todos os breakpoints — resolvido com `grid-flow-dense` e um card "Adicionar projeto" para completar a grade.
- Fazer o modo **System** reagir à mudança de tema do sistema operacional e evitar o "flash" do tema claro ao recarregar a página.
- Validar o grupo de rádio da prioridade, que não tem uma borda própria como os inputs, para exibir o estado de erro.
- Controlar as transições de abrir/fechar (sidebar, dropdown e modal) alternando classes do Tailwind via JavaScript.