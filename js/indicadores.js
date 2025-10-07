

        // Função para verificar se o usuário é administrador
        async function checkUserIsAdmin() {
            try {
                // Buscar o usuário logado (você pode adaptar isso conforme sua lógica de autenticação)
                const userEmail = localStorage.getItem('userEmail'); // Ou outra forma de obter o email do usuário logado
                
                if (!userEmail) {
                    console.warn('Email do usuário não encontrado');
                    return false;
                }
                
                const { data, error } = await supabase
                    .from('users')
                    .select('access_level')
                    .eq('email', userEmail)
                    .single();
                
                if (error) {
                    console.error('Erro ao verificar nível de acesso:', error);
                    return false;
                }
                
                return data && data.access_level === 'administrador';
            } catch (error) {
                console.error('Erro ao verificar se usuário é admin:', error);
                return false;
            }
        }

        // Função para mostrar popup de página em desenvolvimento
        function showDevelopmentPopup() {
            // Criar overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            // Criar popup
            const popup = document.createElement('div');
            popup.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                text-align: center;
                animation: slideDown 0.3s ease-out;
            `;
            
            popup.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <i class="ri-tools-fill" style="font-size: 48px; color: #FFA500;"></i>
                </div>
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 22px; font-weight: 600;">Página em desenvolvimento</h3>
                <p style="margin: 0 0 25px 0; color: #666; font-size: 15px; line-height: 1.6;">
                    Assim que a página for liberada você será notificado(a)
                </p>
                <button id="closeDevPopup" style="
                    background: #A2314F;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Entendi
                </button>
            `;
            
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
            
            // Adicionar animação
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideDown {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
            
            // Fechar popup
            const closeBtn = document.getElementById('closeDevPopup');
            closeBtn.addEventListener('click', () => {
                overlay.remove();
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
            
            // Hover effect no botão
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = '#8A2842';
                closeBtn.style.transform = 'scale(1.05)';
            });
            
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = '#A2314F';
                closeBtn.style.transform = 'scale(1)';
            });
        }

        // Função para mostrar popup de acesso negado
        function showAccessDeniedPopup() {
            // Criar overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            // Criar popup
            const popup = document.createElement('div');
            popup.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                text-align: center;
                animation: slideDown 0.3s ease-out;
            `;
            
            popup.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <i class="ri-error-warning-fill" style="font-size: 48px; color: #DC3545;"></i>
                </div>
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 22px; font-weight: 600;">Advertência do sistema</h3>
                <p style="margin: 0 0 25px 0; color: #666; font-size: 15px; line-height: 1.6;">
                    Você não tem permissão para acessar esta área.
                </p>
                <button id="closeAccessDeniedPopup" style="
                    background: #DC3545;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Entendi
                </button>
            `;
            
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
            
            // Fechar popup
            const closeBtn = document.getElementById('closeAccessDeniedPopup');
            closeBtn.addEventListener('click', () => {
                overlay.remove();
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
            
            // Hover effect no botão
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = '#BB2D3B';
                closeBtn.style.transform = 'scale(1.05)';
            });
            
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = '#DC3545';
                closeBtn.style.transform = 'scale(1)';
            });
        }

        // Função para configurar os event listeners do menu
        function setupMenuNavigation() {
            const menuItems = document.querySelectorAll('.sidebar-item');
            
            menuItems.forEach((item, index) => {
                item.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    // Remove a classe active de todos os itens
                    menuItems.forEach(i => {
                        i.classList.remove('active');
                    });
                    
                    // Adiciona a classe active ao item clicado
                    this.classList.add('active');
                    
                    // Lógica específica para cada item
                    if (index === 0) {
                        // Início - redireciona para overview.html
                        setTimeout(() => {
                            window.location.href = 'overview.html';
                        }, 150);
                    } else if (index === 1) {
                        // Plano de Ação - redireciona para plano-de-acao.html
                        setTimeout(() => {
                            window.location.href = 'plano-de-acao.html';
                        }, 150);
                    } else if (index === 2) {
                        // Indicadores - redireciona para indicadores.html
                        setTimeout(() => {
                            window.location.href = 'indicadores.html';
                        }, 150);
                    } else if (index === 3) {
                        // Equipe - mostra popup de página em desenvolvimento
                        showDevelopmentPopup();
                    } else if (index === 4) {
                        // Permissões - verifica se é admin antes de redirecionar
                        const isAdmin = await checkUserIsAdmin();
                        if (isAdmin) {
                            setTimeout(() => {
                                window.location.href = 'permissao.html';
                            }, 150);
                        } else {
                            showAccessDeniedPopup();
                        }
                    }
                });
                
                // Adiciona efeito de ripple ao clicar
                item.addEventListener('mousedown', function(e) {
                    const ripple = document.createElement('span');
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.cssText = `
                        position: absolute;
                        width: ${size}px;
                        height: ${size}px;
                        left: ${x}px;
                        top: ${y}px;
                        background: rgba(255, 255, 255, 0.3);
                        border-radius: 50%;
                        transform: scale(0);
                        animation: ripple 0.6s linear;
                        pointer-events: none;
                        z-index: 0;
                    `;
                    
                    this.style.position = 'relative';
                    this.appendChild(ripple);
                    
                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                });
            });
        }

        // Adiciona o CSS para a animação do ripple
        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);

        // Inicializar navegação quando o DOM estiver carregado
        document.addEventListener('DOMContentLoaded', function() {
            setupMenuNavigation();
        });

        // Global variables
        let indicators = [];
        let filteredIndicators = [];
        let users = [];
        let departments = [];
        let indicatorTypes = [];
        let indicatorScopes = [];
        let indicatorPeriods = [];
        let indicatorStatuses = [];
        let isEditMode = false;

        // Cache para otimização do popup de edição
        let indicatorCache = new Map();

        // Supabase Client
        const SUPABASE_URL = "https://chsjlvtedrujhhjvonqf.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoc2psdnRlZHJ1amhoanZvbnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTU0NDIsImV4cCI6MjA3MjM5MTQ0Mn0.GH-e9I0_lPyqOEc8BYow1aNBMqMncQH7TnFPgH-2MyQ";
        const { createClient } = window.supabase;
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // DOM Elements
        const sidebar = document.getElementById("sidebar");
        const collapseToggle = document.getElementById("collapseToggle");
        const collapseIcon = document.getElementById("collapseIcon");
        const darkmodeToggle = document.getElementById("darkmode-toggle");
        const departmentTitle = document.getElementById("departmentTitle");
        const filterResponsavel = document.getElementById("filterResponsavel");
        const filterIndicador = document.getElementById("filterIndicador");
        const filterDepartamento = document.getElementById("filterDepartamento");
        const clearFilters = document.getElementById("clearFilters");
        const addIndicatorBtn = document.getElementById("addIndicatorBtn");
        const indicatorModal = document.getElementById("indicatorModal");
        const modalClose = document.getElementById("modalClose");
        const indicatorForm = document.getElementById("indicatorForm");
        const cancelBtn = document.getElementById("cancelBtn");
        const saveBtn = document.getElementById("saveBtn");
        const saveButtonText = document.getElementById("saveButtonText");
        const saveButtonSpinner = document.getElementById("saveButtonSpinner");
        const indicatorsTableBody = document.getElementById("indicatorsTableBody");
        const toastContainer = document.getElementById("toastContainer");

        // Initialize the application
        async function init() {
            try {
                showLoadingState();
                await loadReferenceData();
                await loadIndicators();
                setupEventListeners();
                populateFilters();
                populateFormSelects();
                renderIndicators();
                hideLoadingState();
                
                // Inicializar sidebar colapsada
                initializeSidebarState();
            } catch (error) {
                console.error("Erro ao inicializar aplicação:", error);
                showToast("Erro ao carregar dados. Verifique sua conexão.", "error");
                hideLoadingState();
            }
        }

        // Inicializar estado da sidebar
        function initializeSidebarState() {
            // A sidebar já inicia colapsada no HTML, apenas ajustar o ícone
            collapseIcon.classList.remove("ri-arrow-left-s-line");
            collapseIcon.classList.add("ri-arrow-right-s-line");
            collapseToggle.setAttribute("aria-label", "Expandir menu lateral");
        }

        // Show/hide loading state
        function showLoadingState() {
            // You can add a loading spinner here
        }

        function hideLoadingState() {
            // Hide loading spinner here
        }

        // Load reference data from Supabase - VERSÃO CORRIGIDA COM FALLBACK
        async function loadReferenceData() {
            try {
                // Carregamento paralelo para melhor performance
                const [usersRes, departmentsRes, typesRes, scopesRes, periodsRes, statusesRes] = await Promise.all([
                    supabase.from("users").select("id, name"),
                    supabase.from("departments").select("id, name"),
                    supabase.from("indicator_types").select("id, name"),
                    supabase.from("indicator_scopes").select("id, name"),
                    supabase.from("indicator_periods").select("id, name"),
                    supabase.from("indicator_statuses").select("id, name")
                ]);

                if (usersRes.error) throw usersRes.error;
                if (departmentsRes.error) throw departmentsRes.error;
                if (typesRes.error) throw typesRes.error;
                if (scopesRes.error) throw scopesRes.error;
                if (periodsRes.error) throw periodsRes.error;
                if (statusesRes.error) throw statusesRes.error;

                users = usersRes.data || [];
                departments = departmentsRes.data || [];
                indicatorTypes = typesRes.data || [];
                indicatorScopes = scopesRes.data || [];
                indicatorPeriods = periodsRes.data || [];
                indicatorStatuses = statusesRes.data || [];

                // Se algum array estiver vazio, usar dados mock
                if (users.length === 0 || departments.length === 0 || indicatorTypes.length === 0 || 
                    indicatorScopes.length === 0 || indicatorPeriods.length === 0 || indicatorStatuses.length === 0) {
                    console.log("Dados de referência incompletos, usando dados mock...");
                    loadMockReferenceData();
                }

            } catch (error) {
                console.error("Erro ao carregar dados de referência:", error);
                console.log("Erro no Supabase, usando dados mock de referência...");
                loadMockReferenceData();
                throw error;
            }
        }

        // Carregar dados mock de referência
        function loadMockReferenceData() {
            if (users.length === 0) {
                users = [
                    { id: 1, name: "Ricardo Costa" },
                    { id: 2, name: "Maria Silva" },
                    { id: 3, name: "João Santos" },
                    { id: 4, name: "Ana Oliveira" }
                ];
            }

            if (departments.length === 0) {
                departments = [
                    { id: 1, name: "Atendimento ao Cliente" },
                    { id: 2, name: "Suporte Técnico" },
                    { id: 3, name: "Vendas" },
                    { id: 4, name: "Marketing" },
                    { id: 5, name: "Recursos Humanos" }
                ];
            }

            if (indicatorTypes.length === 0) {
                indicatorTypes = [
                    { id: 1, name: "Qualidade" },
                    { id: 2, name: "Eficiência" },
                    { id: 3, name: "Resultado" },
                    { id: 4, name: "Processo" }
                ];
            }

            if (indicatorScopes.length === 0) {
                indicatorScopes = [
                    { id: 1, name: "Departamental" },
                    { id: 2, name: "Organizacional" },
                    { id: 3, name: "Regional" },
                    { id: 4, name: "Nacional" }
                ];
            }

            if (indicatorPeriods.length === 0) {
                indicatorPeriods = [
                    { id: 1, name: "Mensal" },
                    { id: 2, name: "Semanal" },
                    { id: 3, name: "Trimestral" },
                    { id: 4, name: "Anual" }
                ];
            }

            if (indicatorStatuses.length === 0) {
                indicatorStatuses = [
                    { id: 1, name: "Ativo" },
                    { id: 2, name: "Pendente" },
                    { id: 3, name: "Inativo" }
                ];
            }
        }

        // Load indicators from Supabase - VERSÃO CORRIGIDA COM FALLBACK E FILTRO POR DEPARTAMENTO
        async function loadIndicators() {
            try {
                // Obter o ID do departamento selecionado do localStorage
                const selectedDepartmentId = localStorage.getItem("selectedDepartmentId");
                
                console.log("Departamento selecionado:", selectedDepartmentId);
                
                // Construir a query base
                let query = supabase
                    .from("indicators")
                    .select(`
                        id,
                        name,
                        description,
                        created_at,
                        responsible_id,
                        department_id,
                        indicator_type_id,
                        indicator_scope_id,
                        indicator_period_id,
                        indicator_status_id,
                        users!responsible_id(id, name),
                        departments!department_id(id, name),
                        indicator_types!indicator_type_id(id, name),
                        indicator_scopes!indicator_scope_id(id, name),
                        indicator_periods!indicator_period_id(id, name),
                        indicator_statuses!indicator_status_id(id, name)
                    `);
                
                // Se houver departamento selecionado, filtrar por ele
                if (selectedDepartmentId) {
                    query = query.eq("department_id", selectedDepartmentId);
                }
                
                // Ordenar por data de criação
                query = query.order("created_at", { ascending: false });
                
                const { data, error } = await query;

                if (error) throw error;

                indicators = data || [];
                
                // Se não há dados do Supabase, usar dados mock para desenvolvimento
                if (indicators.length === 0) {
                    console.log("Nenhum dado encontrado no Supabase, usando dados mock...");
                    indicators = getMockIndicators();
                    
                    // Filtrar dados mock pelo departamento se necessário
                    if (selectedDepartmentId) {
                        indicators = indicators.filter(ind => 
                            ind.department_id == selectedDepartmentId || 
                            ind.department_id === selectedDepartmentId
                        );
                    }
                }
                
                filteredIndicators = [...indicators];
                
                // Atualizar cache para edição rápida
                updateIndicatorCache();
                
                console.log("Indicadores carregados:", indicators.length);
                
                // Atualizar o título do departamento na página
                updateDepartmentTitle();
                
            } catch (error) {
                console.error("Erro ao carregar indicadores:", error);
                
                // Em caso de erro, usar dados mock
                console.log("Erro no Supabase, usando dados mock...");
                indicators = getMockIndicators();
                
                // Filtrar dados mock pelo departamento se necessário
                const selectedDepartmentId = localStorage.getItem("selectedDepartmentId");
                if (selectedDepartmentId) {
                    indicators = indicators.filter(ind => 
                        ind.department_id == selectedDepartmentId || 
                        ind.department_id === selectedDepartmentId
                    );
                }
                
                filteredIndicators = [...indicators];
                updateIndicatorCache();
                
                showToast("Usando dados de exemplo (erro de conexão).", "warning");
            }
        }
        
        // Atualizar o título do departamento na página
        function updateDepartmentTitle() {
            const departmentTitle = document.getElementById("departmentTitle");
            const selectedDepartmentName = localStorage.getItem("selectedDepartmentName");
            
            if (departmentTitle && selectedDepartmentName) {
                departmentTitle.textContent = selectedDepartmentName;
            } else if (departmentTitle) {
                departmentTitle.textContent = "Todos os Departamentos";
            }
        }

        // Dados mock para desenvolvimento e fallback
        function getMockIndicators() {
            return [
                {
                    id: 1,
                    name: "Taxa de Satisfação do Cliente",
                    description: "Mede o nível de satisfação dos clientes com nossos serviços",
                    created_at: "2024-01-15T10:30:00Z",
                    responsible_id: 1,
                    department_id: 1,
                    indicator_type_id: 1,
                    indicator_scope_id: 1,
                    indicator_period_id: 1,
                    indicator_status_id: 1,
                    users: { id: 1, name: "Ricardo Costa" },
                    departments: { id: 1, name: "Atendimento ao Cliente" },
                    indicator_types: { id: 1, name: "Qualidade" },
                    indicator_scopes: { id: 1, name: "Departamental" },
                    indicator_periods: { id: 1, name: "Mensal" },
                    indicator_statuses: { id: 1, name: "Ativo" }
                },
                {
                    id: 2,
                    name: "Tempo Médio de Resposta",
                    description: "Tempo médio para responder às solicitações dos clientes",
                    created_at: "2024-01-10T14:20:00Z",
                    responsible_id: 2,
                    department_id: 2,
                    indicator_type_id: 2,
                    indicator_scope_id: 2,
                    indicator_period_id: 2,
                    indicator_status_id: 1,
                    users: { id: 2, name: "Maria Silva" },
                    departments: { id: 2, name: "Suporte Técnico" },
                    indicator_types: { id: 2, name: "Eficiência" },
                    indicator_scopes: { id: 2, name: "Organizacional" },
                    indicator_periods: { id: 2, name: "Semanal" },
                    indicator_statuses: { id: 1, name: "Ativo" }
                },
                {
                    id: 3,
                    name: "Taxa de Conversão de Vendas",
                    description: "Percentual de leads que se convertem em vendas efetivas",
                    created_at: "2024-01-05T09:15:00Z",
                    responsible_id: 3,
                    department_id: 3,
                    indicator_type_id: 3,
                    indicator_scope_id: 1,
                    indicator_period_id: 1,
                    indicator_status_id: 2,
                    users: { id: 3, name: "João Santos" },
                    departments: { id: 3, name: "Vendas" },
                    indicator_types: { id: 3, name: "Resultado" },
                    indicator_scopes: { id: 1, name: "Departamental" },
                    indicator_periods: { id: 1, name: "Mensal" },
                    indicator_statuses: { id: 2, name: "Pendente" }
                }
            ];
        }

        // Atualizar cache dos indicadores para edição rápida
        function updateIndicatorCache() {
            indicatorCache.clear();
            indicators.forEach(indicator => {
                indicatorCache.set(indicator.id, indicator);
            });
        }

        // Set up event listeners
        function setupEventListeners() {
            // Sidebar toggle
            collapseToggle.addEventListener("click", toggleSidebar);
            
            // Dark mode toggle
            darkmodeToggle.addEventListener("change", toggleDarkMode);
            
            // Modal controls
            addIndicatorBtn.addEventListener("click", () => openModal());
            modalClose.addEventListener("click", closeModal);
            cancelBtn.addEventListener("click", closeModal);
            indicatorForm.addEventListener("submit", handleFormSubmit);
            
            // Filters
            filterResponsavel.addEventListener("change", applyFilters);
            filterIndicador.addEventListener("change", applyFilters);
            filterDepartamento.addEventListener("change", () => {
                updateDepartmentTitle();
                applyFilters();
            });
            clearFilters.addEventListener("click", clearAllFilters);
            
            // Keyboard navigation
            document.addEventListener("keydown", handleKeyboardNavigation);
            
            // Check for saved dark mode preference
            if (localStorage.getItem("darkMode") === "true") {
                document.body.classList.add("dark");
                darkmodeToggle.checked = true;
            }
        }

        // Handle keyboard navigation
        function handleKeyboardNavigation(e) {
            if (e.key === "Escape" && indicatorModal.classList.contains("show")) {
                closeModal();
            }
        }

        // Toggle sidebar collapse - ATUALIZADO PARA ESTADO INICIAL COLAPSADO
        function toggleSidebar() {
            sidebar.classList.toggle("collapsed");
            
            if (sidebar.classList.contains("collapsed")) {
                collapseIcon.classList.remove("ri-arrow-left-s-line");
                collapseIcon.classList.add("ri-arrow-right-s-line");
                collapseToggle.setAttribute("aria-label", "Expandir menu lateral");
            } else {
                collapseIcon.classList.remove("ri-arrow-right-s-line");
                collapseIcon.classList.add("ri-arrow-left-s-line");
                collapseToggle.setAttribute("aria-label", "Recolher menu lateral");
            }
        }

        // Toggle dark mode
        function toggleDarkMode() {
            document.body.classList.toggle("dark");
            localStorage.setItem("darkMode", document.body.classList.contains("dark"));
        }

        // Populate filter dropdowns
        function populateFilters() {
            const responsaveis = [...new Set(indicators.map(ind => ind.users?.name).filter(Boolean))];
            const indicadorNames = [...new Set(indicators.map(ind => ind.name))];
            const departamentos = [...new Set(indicators.map(ind => ind.departments?.name).filter(Boolean))];

            populateSelect(filterResponsavel, responsaveis);
            populateSelect(filterIndicador, indicadorNames);
            populateSelect(filterDepartamento, departamentos);
        }

        // Populate form select elements
        function populateFormSelects() {
            populateSelectWithData(document.getElementById("indicatorResponsible"), users, "name", "id");
            populateSelectWithData(document.getElementById("indicatorDepartment"), departments, "name", "id");
            populateSelectWithData(document.getElementById("indicatorType"), indicatorTypes, "name", "id");
            populateSelectWithData(document.getElementById("indicatorScope"), indicatorScopes, "name", "id");
            populateSelectWithData(document.getElementById("indicatorPeriod"), indicatorPeriods, "name", "id");
            populateSelectWithData(document.getElementById("indicatorStatus"), indicatorStatuses, "name", "id");
        }

        // Helper function to populate select with simple array
        function populateSelect(selectElement, options) {
            // Keep the first option (placeholder)
            const firstOption = selectElement.options[0];
            selectElement.innerHTML = "";
            selectElement.appendChild(firstOption);
            
            options.forEach(option => {
                const optionElement = document.createElement("option");
                optionElement.value = option;
                optionElement.textContent = option;
                selectElement.appendChild(optionElement);
            });
        }

        // Helper function to populate select with data objects
        function populateSelectWithData(selectElement, data, textField, valueField) {
            // Keep the first option (placeholder)
            const firstOption = selectElement.options[0];
            selectElement.innerHTML = "";
            selectElement.appendChild(firstOption);
            
            data.forEach(item => {
                const option = document.createElement("option");
                option.value = item[valueField];
                option.textContent = item[textField];
                selectElement.appendChild(option);
            });
        }

        // Apply filters
        function applyFilters() {
            const responsavelFilter = filterResponsavel.value;
            const indicadorFilter = filterIndicador.value;
            const departamentoFilter = filterDepartamento.value;

            filteredIndicators = indicators.filter(indicator => {
                const matchesResponsavel = !responsavelFilter || indicator.users?.name === responsavelFilter;
                const matchesIndicador = !indicadorFilter || indicator.name === indicadorFilter;
                const matchesDepartamento = !departamentoFilter || indicator.departments?.name === departamentoFilter;
                
                return matchesResponsavel && matchesIndicador && matchesDepartamento;
            });

            renderIndicators();
        }

        // Update department title
        function updateDepartmentTitle() {
            const selectedDepartment = filterDepartamento.value;
            departmentTitle.textContent = selectedDepartment || "Todos os Departamentos";
        }

        // Clear all filters
        function clearAllFilters() {
            filterResponsavel.value = "";
            filterIndicador.value = "";
            filterDepartamento.value = "";
            updateDepartmentTitle();
            applyFilters();
        }

        // Render indicators table
        function renderIndicators() {
            indicatorsTableBody.innerHTML = "";

            if (filteredIndicators.length === 0) {
                indicatorsTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-light); opacity: 0.7;">
                            <i class="ri-inbox-line" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                            Nenhum indicador encontrado
                        </td>
                    </tr>
                `;
                return;
            }

            filteredIndicators.forEach(indicator => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${indicator.users?.name || "Não definido"}</td>
                    <td>${indicator.name}</td>
                    <td>${indicator.departments?.name || "Não definido"}</td>
                    <td>${formatDate(indicator.created_at)}</td>
                    <td>
                        <span class="status-badge status-${getStatusClass(indicator.indicator_statuses?.name)}">
                            ${indicator.indicator_statuses?.name || "Não definido"}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" onclick="editIndicator(\'${indicator.id}\')" aria-label="Editar indicador ${indicator.name}">
                                <i class="ri-edit-line" aria-hidden="true"></i>
                                Editar
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteIndicator(${indicator.id})" aria-label="Excluir indicador ${indicator.name}">
                                <i class="ri-delete-bin-line" aria-hidden="true"></i>
                                Excluir
                            </button>
                        </div>
                    </td>
                `;
                indicatorsTableBody.appendChild(row);
            });
        }

        // Format date
        function formatDate(dateString) {
            if (!dateString) return "Não definido";
            const date = new Date(dateString);
            return date.toLocaleDateString("pt-BR");
        }

        // Get status class for styling
        function getStatusClass(status) {
            if (!status) return "pendente";
            const statusLower = status.toLowerCase();
            if (statusLower.includes("ativo")) return "ativo";
            if (statusLower.includes("inativo")) return "inativo";
            return "pendente";
        }

        // Open modal - OTIMIZADO
        function openModal(indicator = null) {
            isEditMode = !!indicator;
            
            // Reset form
            indicatorForm.reset();
            document.getElementById("indicatorId").value = "";
            
            // Update modal title
            document.getElementById("modalTitle").textContent = isEditMode ? "Editar Indicador" : "Novo Indicador";
            saveButtonText.textContent = isEditMode ? "Salvar Alterações" : "Salvar Indicador";
            
            // Populate form if editing - USANDO CACHE PARA VELOCIDADE
            if (indicator) {
                populateFormFast(indicator);
            }
            
            // Show modal with animation
            indicatorModal.style.display = "flex";
            setTimeout(() => {
                indicatorModal.classList.add("show");
            }, 10);
            
            // Focus first input
            setTimeout(() => {
                document.getElementById("indicatorName").focus();
            }, 300);
        }

        // Close modal
        function closeModal() {
            indicatorModal.classList.remove("show");
            setTimeout(() => {
                indicatorModal.style.display = "none";
                indicatorForm.reset();
                clearFormErrors();
            }, 300);
        }

        // Populate form with indicator data - VERSÃO OTIMIZADA
        function populateFormFast(indicator) {
            // Usar dados já carregados em memória para velocidade máxima
            document.getElementById("indicatorId").value = indicator.id;
            document.getElementById("indicatorName").value = indicator.name || "";
            document.getElementById("indicatorResponsible").value = indicator.responsible_id || "";
            document.getElementById("indicatorDepartment").value = indicator.department_id || "";
            document.getElementById("indicatorType").value = indicator.indicator_type_id || "";
            document.getElementById("indicatorScope").value = indicator.indicator_scope_id || "";
            document.getElementById("indicatorPeriod").value = indicator.indicator_period_id || "";
            document.getElementById("indicatorStatus").value = indicator.indicator_status_id || "";
            document.getElementById("indicatorDescription").value = indicator.description || "";
        }

        // Handle form submission
        async function handleFormSubmit(e) {
            e.preventDefault();
            
            if (!validateForm()) {
                return;
            }
            
            try {
                // Show loading state
                saveBtn.disabled = true;
                saveButtonText.style.display = "none";
                saveButtonSpinner.style.display = "inline-block";
                
                const indicatorData = {
                    name: document.getElementById("indicatorName").value.trim(),
                    responsible_id: document.getElementById("indicatorResponsible").value || null,
                    department_id: document.getElementById("indicatorDepartment").value || null,
                    indicator_type_id: document.getElementById("indicatorType").value,
                    indicator_scope_id: document.getElementById("indicatorScope").value,
                    indicator_period_id: document.getElementById("indicatorPeriod").value,
                    indicator_status_id: document.getElementById("indicatorStatus").value,
                    description: document.getElementById("indicatorDescription").value.trim() || null
                };

                const indicatorId = document.getElementById("indicatorId").value;

                if (indicatorId) {
                    // Edit existing indicator
                    const { error } = await supabase
                        .from("indicators")
                        .update(indicatorData)
                        .eq("id", indicatorId);

                    if (error) throw error;
                    showToast("Indicador atualizado com sucesso!", "success");
                } else {
                    // Add new indicator
                    const { error } = await supabase
                        .from("indicators")
                        .insert([indicatorData]);

                    if (error) throw error;
                    showToast("Indicador criado com sucesso!", "success");
                }

                await loadIndicators();
                populateFilters();
                applyFilters();
                closeModal();

            } catch (error) {
                console.error("Erro ao salvar indicador:", error);
                showToast("Erro ao salvar indicador. Tente novamente.", "error");
            } finally {
                // Hide loading state
                saveBtn.disabled = false;
                saveButtonText.style.display = "inline";
                saveButtonSpinner.style.display = "none";
            }
        }

        // Validate form
        function validateForm() {
            clearFormErrors();
            let isValid = true;

            const requiredFields = [
                { id: "indicatorName", message: "Nome do indicador é obrigatório" },
                { id: "indicatorResponsible", message: "Responsável é obrigatório" },
                { id: "indicatorDepartment", message: "Departamento é obrigatório" },
                { id: "indicatorType", message: "Tipo de meta é obrigatório" },
                { id: "indicatorScope", message: "Alcance é obrigatório" },
                { id: "indicatorPeriod", "message": "Período é obrigatório" },
                { id: "indicatorStatus", message: "Status é obrigatório" }
            ];

            requiredFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (!element.value.trim()) {
                    showFieldError(field.id, field.message);
                    isValid = false;
                }
            });

            return isValid;
        }

        // Show field error
        function showFieldError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(fieldId + "-error");
            
            field.style.borderColor = "var(--danger)";
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.remove("sr-only");
                errorElement.style.color = "var(--danger)";
                errorElement.style.fontSize = "12px";
                errorElement.style.marginTop = "4px";
            }
        }

        // Clear form errors
        function clearFormErrors() {
            const fields = ["indicatorName", "indicatorResponsible", "indicatorDepartment", "indicatorType", "indicatorScope", "indicatorPeriod", "indicatorStatus"];
            
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                const errorElement = document.getElementById(fieldId + "-error");
                
                field.style.borderColor = "";
                if (errorElement) {
                    errorElement.textContent = "";
                    errorElement.classList.add("sr-only");
                }
            });
        }

        // Edit indicator - VERSÃO CORRIGIDA E ROBUSTA
        function editIndicator(id) {
            console.log("Valor de indicator.id antes de ser usado:", id);
            try {
                console.log("editIndicator chamado com ID:", id);
            } catch (error) {
                console.error("Erro ao executar editIndicator:", error);
            }
            console.log("Cache size:", indicatorCache.size);
            console.log("Indicators array length:", indicators.length);
            
            // Converter ID para número se necessário
            const numericId = parseInt(id);
            
            // Tentar cache primeiro
            let indicator = indicatorCache.get(numericId) || indicatorCache.get(id);
            
            // Fallback para busca na lista principal
            if (!indicator) {
                indicator = indicators.find(ind => ind.id === numericId || ind.id === id);
            }
            
            // Se ainda não encontrou, tentar busca mais ampla
            if (!indicator) {
                indicator = indicators.find(ind => ind.id == id); // Comparação não estrita
            }
            
            console.log("Indicator encontrado:", indicator);
            
            if (indicator) {
                openModal(indicator);
            } else {
                console.error("Indicador não encontrado. ID:", id, "Type:", typeof id);
                console.log("Available indicators:", indicators.map(ind => ({ id: ind.id, name: ind.name })));
                
                // Tentar recarregar dados e tentar novamente
                loadIndicators().then(() => {
                    const retryIndicator = indicators.find(ind => ind.id == id);
                    if (retryIndicator) {
                        openModal(retryIndicator);
                    } else {
                        showToast("Indicador não encontrado. Tente recarregar a página.", "error");
                    }
                }).catch(error => {
                    console.error("Erro ao recarregar indicadores:", error);
                    showToast("Erro ao carregar dados do indicador.", "error");
                });
            }
        }

        // Delete indicator
        async function deleteIndicator(id) {
            const indicator = indicatorCache.get(id) || indicators.find(ind => ind.id === id);
            const indicatorName = indicator ? indicator.name : "este indicador";
            
            if (confirm(`Tem certeza que deseja excluir "${indicatorName}"? Esta ação não pode ser desfeita.`)) {
                try {
                    const { error } = await supabase
                        .from("indicators")
                        .delete()
                        .eq("id", id);

                    if (error) throw error;

                    await loadIndicators();
                    populateFilters();
                    applyFilters();
                    showToast("Indicador excluído com sucesso!", "success");

                } catch (error) {
                    console.error("Erro ao excluir indicador:", error);
                    showToast("Erro ao excluir indicador. Tente novamente.", "error");
                }
            }
        }

        // Show toast notification
        function showToast(message, type = "info") {
            const toast = document.createElement("div");
            toast.className = `toast ${type}`;
            toast.setAttribute("role", "alert");
            toast.innerHTML = `
                <i class="ri-${type === "success" ? "check" : type === "error" ? "close" : "information"}-line" aria-hidden="true"></i>
                ${message}
            `;
            
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 4000);
        }

        // Close modal when clicking outside
        window.addEventListener("click", (e) => {
            if (e.target === indicatorModal) {
                closeModal();
            }
        });

        // Initialize the application when DOM is loaded
        document.addEventListener("DOMContentLoaded", init);