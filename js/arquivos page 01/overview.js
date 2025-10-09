const supabaseUrl = 'https://chsjlvtedrujhhjvonqf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoc2psdnRlZHJ1amhoanZvbnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTU0NDIsImV4cCI6MjA3MjM5MTQ0Mn0.GH-e9I0_lPyqOEc8BYow1aNBMqMncQH7TnFPgH-2MyQ';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

async function checkSupabaseConnection() {
    const connectionStatus = document.getElementById('connectionStatus');
    try {
        const { data, error } = await supabase
            .from('indicators')
            .select('count', { count: 'exact', head: true });
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        connectionStatus.className = 'connection-status connected';
        connectionStatus.innerHTML = '<i class="fas fa-check-circle"></i> Conectado ao Supabase';
        
        setTimeout(() => {
            connectionStatus.style.display = 'none';
        }, 3000);
        
        return true;
    } catch (error) {
        console.error('Erro de conexão com Supabase:', error);
        connectionStatus.className = 'connection-status disconnected';
        connectionStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro de conexão';
        return false;
    }
}

async function loadActionPlansFromSupabase(filters = {}) {
    try {
        let query = supabase
            .from('action_plans')
            .select(`
                *,
                assignee:users(name),
                department:departments(name),
                status:action_plan_statuses(name),
                indicator:indicators(name)
            `);
        
        // Aplicar filtros se fornecidos
        if (filters.indicadores) {
            query = query.eq('indicator_id', filters.indicadores);
        }
        if (filters.responsavel) {
            query = query.eq('assignee_id', filters.responsavel);
        }
        if (filters.departamento) {
            query = query.eq('department_id', filters.departamento);
        }
        if (filters.ano) {
            // Filtrar por ano na data de criação
            const startDate = `${filters.ano}-01-01`;
            const endDate = `${filters.ano}-12-31`;
            query = query.gte('created_at', startDate).lte('created_at', endDate);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar planos de ação:', error);
        showToast('Erro ao carregar planos de ação do banco de dados', 4000);
        return [];
    }
}

async function saveActionPlanToSupabase(planData) {
    try {
        // Verificar se planData.status é um UUID (ID) ou um nome
        let statusId = planData.status;
        
        // Regex para validar UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        // Se não for um UUID, buscar o ID pelo nome
        if (!uuidRegex.test(planData.status)) {
            const { data: statusData } = await supabase
                .from('action_plan_statuses')
                .select('id')
                .eq('name', planData.status || 'Não iniciado')
                .single();
            
            statusId = statusData?.id;
        }

        const { data, error } = await supabase
            .from('action_plans')
            .insert([{
                title: planData.title,
                description: planData.description,
                start_date: planData.start_date,
                end_date: planData.end_date,
                assignee_id: planData.assignee_id,
                department_id: planData.department_id,
                status_id: statusId,
                indicator_id: planData.indicator_id,
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('Erro ao salvar plano de ação:', error);
        showToast('Erro ao salvar plano de ação no banco de dados', 4000);
        return null;
    }
}

async function updateActionPlanInSupabase(planId, planData) {
    try {
        const { data, error } = await supabase
            .from('action_plans')
            .update({
                title: planData.title,
                description: planData.description,
                start_date: planData.start_date,
                end_date: planData.end_date,
                assignee_id: planData.assignee_id,
                department_id: planData.department_id,
                status_id: planData.status_id,
                indicator_id: planData.indicator_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', planId)
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('Erro ao atualizar plano de ação:', error);
        showToast('Erro ao atualizar plano de ação no banco de dados', 4000);
        return null;
    }
}

async function deleteActionPlanFromSupabase(planId) {
    try {
        const { error } = await supabase
            .from('action_plans')
            .delete()
            .eq('id', planId);
        
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Erro ao deletar plano de ação:', error);
        showToast('Erro ao deletar plano de ação do banco de dados', 4000);
        return false;
    }
}

async function loadIndicatorsFromSupabase(departmentId = null) {
    try {
        let query = supabase
            .from("indicators")
            .select(`
                *,
                responsible:users(name),
                department:departments(name),
                indicator_type:indicator_types(name),
                indicator_scope:indicator_scopes(name),
                indicator_period:indicator_periods(name),
                indicator_status:indicator_statuses(name)
            `)
            .order("created_at", { ascending: false });

        if (departmentId) {
            query = query.eq("department_id", departmentId);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar indicadores:', error);
        showToast('Erro ao carregar indicadores do banco de dados', 4000);
        return [];
    }
}


async function saveIndicatorDataToSupabase(indicatorData) {
    try {
        const { data, error } = await supabase
            .from('indicator_data')
            .insert([{
                indicator_id: indicatorData.indicator_id,
                value_type_id: indicatorData.value_type_id,
                target_type_id: indicatorData.target_type_id,
                period_start_date: indicatorData.period_start_date,
                period_end_date: indicatorData.period_end_date,
                cycle_name: indicatorData.cycle_name,
                value: indicatorData.value,
                created_by: indicatorData.created_by,
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('Erro ao salvar dados de indicador:', error);
        showToast('Erro ao salvar dados de indicador no banco de dados', 4000);
        return null;
    }
}







const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const toggleIcon = document.getElementById('toggleIcon');

sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleIcon.className = 'ri-arrow-right-s-line';
    } else {
        toggleIcon.className = 'ri-arrow-left-s-line';
    }
});

const darkModeToggle = document.getElementById('darkmode-toggle');

darkModeToggle.addEventListener('change', function() {
    document.body.classList.toggle('dark');
    
    if (document.body.classList.contains('dark')) {
        document.querySelector('.darkmode-container span').textContent = 'Modo Claro';
    } else {
        document.querySelector('.darkmode-container span').textContent = 'Modo Escuro';
    }
    
    updateChart();
});

if (document.body.classList.contains('dark')) {
    darkModeToggle.checked = true;
    document.querySelector('.darkmode-container span').textContent = 'Modo Claro';
}

// Função para carregar dados do usuário autenticado
function loadAuthenticatedUser() {
    try {
        const authenticatedUserData = localStorage.getItem('authenticatedUser');
        if (authenticatedUserData) {
            const userData = JSON.parse(authenticatedUserData);
            console.log('Dados do usuário autenticado carregados:', userData);
            
            // Atualizar elementos do perfil na interface
            updateUserProfile(userData);
            
            return userData;
        } else {
            console.warn('Nenhum usuário autenticado encontrado no localStorage');
            return null;
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário autenticado:', error);
        return null;
    }
}

// Função para atualizar o perfil do usuário na interface
function updateUserProfile(userData) {
    try {
        // Atualizar avatar
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            const initials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            profileAvatar.textContent = initials;
        }
        
        // Atualizar nome do usuário
        const profileUserName = document.getElementById('profileUserName');
        if (profileUserName) {
            profileUserName.textContent = userData.name;
        }
        
        // Atualizar role do usuário (se disponível)
        const profileUserRole = document.getElementById('profileUserRole');
        if (profileUserRole) {
            profileUserRole.textContent = userData.role || 'Usuário';
        }
        
        console.log('Perfil do usuário atualizado na interface');
    } catch (error) {
        console.error('Erro ao atualizar perfil do usuário:', error);
    }
}

// Função para obter ID do usuário autenticado
async function getAuthenticatedUserId() {
    try {
        // Primeiro, tentar obter do localStorage
        const userId = localStorage.getItem('userId');
        if (userId) {
            return userId;
        }
        
        // Fallback: tentar obter do Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
            // Salvar no localStorage para próximas vezes
            localStorage.setItem('userId', user.id);
            return user.id;
        }
        
        console.warn('Nenhum usuário autenticado encontrado');
        return null;
    } catch (error) {
        console.error('Erro ao obter ID do usuário autenticado:', error);
        return null;
    }
}

// Função para verificar se o usuário é administrador
async function checkUserIsAdmin() {
    try {
        // Buscar o usuário logado
        const userEmail = localStorage.getItem('userEmail');
        
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

// Função para limpar dados do usuário (logout)
function clearUserData() {
    localStorage.removeItem('authenticatedUser');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('selectedDepartment');
    localStorage.removeItem('selectedDepartmentId');
    localStorage.removeItem('selectedDepartmentName');
    console.log('Dados do usuário limpos');
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

// Funcionalidades de navegação da sidebar
document.querySelectorAll('.sidebar-item').forEach((item, index) => {
    item.addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Remove a classe active de todos os itens
        document.querySelectorAll('.sidebar-item').forEach(i => {
            i.classList.remove('active');
        });
        
        // Adiciona a classe active ao item clicado
        this.classList.add('active');
        
        // Navegação baseada no índice do item
        const pages = [
            'overview.html',        // 0 - Início
            'plano-de-acao.html',   // 1 - Plano de Ação
            'indicadores.html',     // 2 - Indicadores
            'equipe',               // 3 - Equipe (página em desenvolvimento)
            'permissao.html'        // 4 - Permissões (requer admin)
        ];
        
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

const filtroIndicadores = document.getElementById('filtro-indicadores');
const filtroResponsavel = document.getElementById('filtro-responsavel');
const filtroDepartamento = document.getElementById('filtro-departamento');
const filtroAno = document.getElementById('filtro-ano');

let filtrosAtivos = {
    indicadores: '',
    responsavel: '',
    departamento: '',
    ano: ''
};

// Variável global para o modal do plano de ação
let actionPlanModal = null;

const dadosSimulados = {
    indicadores: {
        absenteismo: { valores: [8, 7, 9, 6, 5, 4, 6, 7, 5, 4, 3, 4], meta: 5 },
        rotatividade: { valores: [12, 11, 13, 10, 9, 8, 10, 11, 9, 8, 7, 8], meta: 10 },
        produtividade: { valores: [85, 87, 83, 89, 91, 93, 88, 86, 92, 94, 96, 95], meta: 90 },
        satisfacao: { valores: [7.2, 7.5, 7.1, 7.8, 8.0, 8.2, 7.9, 7.7, 8.1, 8.3, 8.5, 8.4], meta: 8.0 }
    },
    responsaveis: {
        joao: { nome: 'João Silva', departamento: 'rh' },
        maria: { nome: 'Maria Santos', departamento: 'ti' },
        carlos: { nome: 'Carlos Oliveira', departamento: 'vendas' },
        ana: { nome: 'Ana Costa', departamento: 'marketing' }
    },
    departamentos: {
        rh: { nome: 'Recursos Humanos', cor: '#A2314F' },
        ti: { nome: 'Tecnologia da Informação', cor: '#4A9FBC' },
        vendas: { nome: 'Vendas', cor: '#00D74F' },
        marketing: { nome: 'Marketing', cor: '#FF9800' },
        financeiro: { nome: 'Financeiro', cor: '#B21316' },
        operacoes: { nome: 'Operações', cor: '#0077FF' }
    }
};

filtroIndicadores.addEventListener('change', aplicarFiltros);
filtroResponsavel.addEventListener('change', aplicarFiltros);
filtroDepartamento.addEventListener('change', aplicarFiltros);
filtroAno.addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    console.log('=== APLICANDO FILTROS ===');
    
    filtrosAtivos.indicadores = filtroIndicadores.value;
    filtrosAtivos.responsavel = filtroResponsavel.value;
    filtrosAtivos.departamento = filtroDepartamento.value;
    filtrosAtivos.ano = filtroAno.value;

    console.log('Filtros aplicados:', filtrosAtivos);
    
    // Salvar indicador selecionado no localStorage
    localStorage.setItem('selectedIndicatorId', filtroIndicadores.value);
    
    // Se um indicador foi selecionado, garantir que o gráfico seja atualizado
    if (filtrosAtivos.indicadores && filtrosAtivos.indicadores !== '') {
        console.log('Indicador selecionado:', filtrosAtivos.indicadores);
        console.log('Forçando atualização do gráfico...');
    }
    
    atualizarGraficoComFiltros();
    
    // Atualizar gráfico YoY quando filtros mudarem
    updateYoYChart();
    
    mostrarNotificacaoFiltro();

    // Se o modal do plano de ação estiver aberto, recarregar os planos
    if (actionPlanModal && actionPlanModal.classList.contains("show")) {
        loadActionPlansToKanban();
    }
}

async function atualizarGraficoComFiltros() {
    let dadosParaGrafico = { ...chartData };
    
    const selectedIndicatorId = filtrosAtivos.indicadores;
    // Se não houver departamento no filtro, usar o departamento selecionado do localStorage
    const selectedDepartmentId = filtrosAtivos.departamento || localStorage.getItem("selectedDepartmentId");
    const selectedResponsibleId = filtrosAtivos.responsavel;
    // Se não houver ano especificado, usar o ano atual
    let selectedYear = filtrosAtivos.ano;
    if (!selectedYear || selectedYear === '' || selectedYear === 'null') {
        selectedYear = new Date().getFullYear().toString();
        console.log('Ano não especificado, usando ano atual:', selectedYear);
    }

    console.log("=== INICIANDO CARREGAMENTO DE DADOS ===");
    console.log("Filtros ativos:", filtrosAtivos);
    console.log("Departamento selecionado (localStorage ou filtro):", selectedDepartmentId);
    console.log("Tipo de visualização atual:", currentViewType);
    console.log("Ano selecionado:", selectedYear);

    const chartTitleElement = document.querySelector(".chart-title");
    if (chartTitleElement) {
        if (selectedIndicatorId) {
            const indicatorName = await getIndicatorNameById(selectedIndicatorId);
            chartTitleElement.textContent = indicatorName ? indicatorName : "Resumo geral dos indicadores";
        } else {
            chartTitleElement.textContent = "Resumo geral dos indicadores";
        }
    }

    let dataFromSupabase = [];
    try {
        console.log('=== CHAMANDO FUNÇÃO DE BUSCA ===');
        console.log('Parâmetros que serão enviados:', {
            indicatorId: selectedIndicatorId,
            departmentId: selectedDepartmentId,
            responsibleId: selectedResponsibleId,
            year: selectedYear,
            viewType: currentViewType
        });
        
        let fetchedData;
        if (currentViewType === 'mensal') {
            console.log('Chamando fetchMonthlyIndicatorData...');
            fetchedData = await fetchMonthlyIndicatorData(selectedIndicatorId, selectedDepartmentId, selectedResponsibleId, selectedYear);
            dataFromSupabase = fetchedData.monthlyData;
        } else if (currentViewType === 'ciclo') {
            console.log('Chamando fetchCycleIndicatorData...');
            fetchedData = await fetchCycleIndicatorData(selectedIndicatorId, selectedDepartmentId, selectedResponsibleId, selectedYear);
            dataFromSupabase = fetchedData.cycleData;
        }
        const totalData = fetchedData ? fetchedData.totalData : null;

        console.log('Dados obtidos do Supabase:', dataFromSupabase);
        console.log('Total de registros encontrados:', dataFromSupabase.length);

        // Se não encontrou dados, fazer uma consulta de teste simplificada
        if (dataFromSupabase.length === 0) {
            console.log('=== TESTE DE CONSULTA SIMPLIFICADA ===');
            
            // Teste 1: Buscar qualquer registro na view
            const { data: testData1, error: testError1 } = await supabase
                .from(currentViewType === 'mensal' ? 'vw_desempenho_indicadores' : 'vw_desempenho_indicadores_ciclo')
                .select('*')
;
            
            console.log('Teste 1 - Qualquer registro na view:', testData1?.length || 0, 'registros');
            if (testData1 && testData1.length > 0) {
                console.log('Exemplo de registro:', testData1[0]);
            }
            
            // Teste 2: Buscar apenas pelo indicador (sem outros filtros)
            if (selectedIndicatorId) {
                const { data: testData2, error: testError2 } = await supabase
                    .from(currentViewType === 'mensal' ? 'vw_desempenho_indicadores' : 'vw_desempenho_indicadores_ciclo')
                    .select('*')
                    .eq('id_indicador', selectedIndicatorId)
;
                
                console.log('Teste 2 - Apenas indicador:', testData2?.length || 0, 'registros');
                if (testData2 && testData2.length > 0) {
                    console.log('Exemplo com indicador:', testData2[0]);
                    // Se encontrou dados apenas com indicador, usar esses dados
                    dataFromSupabase = testData2;
                    console.log('✅ Usando dados encontrados apenas com filtro de indicador');
                }
            }
            
            // Teste 3: Buscar apenas pelo departamento (sem outros filtros)
            if (selectedDepartmentId && dataFromSupabase.length === 0) {
                const { data: testData3, error: testError3 } = await supabase
                    .from(currentViewType === 'mensal' ? 'vw_desempenho_indicadores' : 'vw_desempenho_indicadores_ciclo')
                    .select('*')
                    .eq('id_departamento', selectedDepartmentId)
;
                
                console.log('Teste 3 - Apenas departamento:', testData3?.length || 0, 'registros');
                if (testData3 && testData3.length > 0) {
                    console.log('Exemplo com departamento:', testData3[0]);
                    // Se encontrou dados apenas com departamento, usar esses dados
                    dataFromSupabase = testData3;
                    console.log('✅ Usando dados encontrados apenas com filtro de departamento');
                }
            }
            
            // Teste 4: Se ainda não encontrou, buscar dados do ano atual sem outros filtros
            if (dataFromSupabase.length === 0 && selectedYear) {
                console.log('Teste 4 - Tentando buscar dados do ano atual...');
                let query4 = supabase
                    .from(currentViewType === 'mensal' ? 'vw_desempenho_indicadores' : 'vw_desempenho_indicadores_ciclo')
                    .select('*');
                
                if (currentViewType === 'mensal') {
                    query4 = query4.eq('ano', parseInt(selectedYear));
                } else {
                    query4 = query4.gte('data_inicio', `${selectedYear}-01-01`);
                    query4 = query4.lte('data_inicio', `${selectedYear}-12-31`);
                }
                
                const { data: testData4, error: testError4 } = await query4;
                
                console.log('Teste 4 - Dados do ano:', testData4?.length || 0, 'registros');
                if (testData4 && testData4.length > 0) {
                    console.log('Exemplo do ano:', testData4[0]);
                    dataFromSupabase = testData4;
                    console.log('✅ Usando dados encontrados do ano atual');
                }
            }
        }

        // SEMPRE processar dados para garantir 12 períodos completos
        // Buscar o tipo de indicador para formatação
        let indicatorTypeName = null;
        if (selectedIndicatorId) {
            indicatorTypeName = await getIndicatorTypeNameByIndicatorId(selectedIndicatorId);
        }

        if (currentViewType === 'mensal') {
            console.log('Processando dados mensais...');
            
            // Definir todos os 12 meses do ano
            const allMonths = [
                { mes: 1, mes_abrev: 'Jan' },
                { mes: 2, mes_abrev: 'Fev' },
                { mes: 3, mes_abrev: 'Mar' },
                { mes: 4, mes_abrev: 'Abr' },
                { mes: 5, mes_abrev: 'Mai' },
                { mes: 6, mes_abrev: 'Jun' },
                { mes: 7, mes_abrev: 'Jul' },
                { mes: 8, mes_abrev: 'Ago' },
                { mes: 9, mes_abrev: 'Set' },
                { mes: 10, mes_abrev: 'Out' },
                { mes: 11, mes_abrev: 'Nov' },
                { mes: 12, mes_abrev: 'Dez' }
            ];
            
            // Criar um mapa dos dados existentes por mês
            const dataMap = {};
            if (dataFromSupabase && dataFromSupabase.length > 0) {
                dataFromSupabase.forEach(item => {
                    dataMap[item.mes] = item;
                });
                console.log('Dados do banco mapeados:', Object.keys(dataMap).length, 'meses');
            } else {
                console.log('Nenhum dado do banco, usando estrutura vazia');
            }
            
            // Gerar dados para todos os 12 meses
            const completeMonthlyData = allMonths.map(month => {
                const existingData = dataMap[month.mes];
                return {
                    mes: month.mes,
                    mes_abrev: month.mes_abrev,
                    valor_realizado: existingData ? existingData.valor_realizado : null,
                    desempenho: existingData ? existingData.desempenho : null,
                    cor: existingData ? existingData.cor : '#A2314F',
                    meta_minima: existingData ? existingData.meta_minima : null,
                    meta_maxima: existingData ? existingData.meta_maxima : null
                };
            });
            
            dadosParaGrafico.labels = completeMonthlyData.map(item => item.mes_abrev);
            dadosParaGrafico.realizedValues = completeMonthlyData.map(item => 
                item.valor_realizado !== null && item.valor_realizado !== undefined ? parseFloat(item.valor_realizado) : 0
            );
            dadosParaGrafico.growthValues = completeMonthlyData.map(item => 
                item.desempenho !== null && item.desempenho !== undefined ? parseFloat(item.desempenho) : null
            );
            dadosParaGrafico.values = dadosParaGrafico.realizedValues; // Para compatibilidade
            dadosParaGrafico.colors = completeMonthlyData.map(item => item.cor || '#A2314F');
            
            // Extrair meta_minima e meta_maxima dos dados individuais
            dadosParaGrafico.minMeta = completeMonthlyData.map(item => 
                item.meta_minima !== null && item.meta_minima !== undefined ? parseFloat(item.meta_minima) : null
            );
            dadosParaGrafico.maxMeta = completeMonthlyData.map(item => 
                item.meta_maxima !== null && item.meta_maxima !== undefined ? parseFloat(item.meta_maxima) : null
            );
            
            console.log('Dados mensais processados (12 meses SEMPRE):', {
                labels: dadosParaGrafico.labels,
                valores: dadosParaGrafico.realizedValues,
                metas_min: dadosParaGrafico.minMeta,
                metas_max: dadosParaGrafico.maxMeta
            });

            dadosParaGrafico.indicatorTypeName = indicatorTypeName || (totalData ? totalData.indicator_type_name : null);
            
        } else if (currentViewType === 'ciclo') {
            console.log('Processando dados de ciclo...');
            
            // Criar um mapa dos dados existentes por ciclo
            const dataMap = {};
            let maxCycle = 12; // Valor padrão mínimo
            
            if (dataFromSupabase && dataFromSupabase.length > 0) {
                dataFromSupabase.forEach(item => {
                    dataMap[item.ciclo] = item;
                    // Encontrar o maior número de ciclo nos dados
                    if (item.ciclo > maxCycle) {
                        maxCycle = item.ciclo;
                    }
                });
                console.log('Dados do banco mapeados:', Object.keys(dataMap).length, 'ciclos');
                console.log('Maior ciclo encontrado:', maxCycle);
            } else {
                console.log('Nenhum dado do banco, usando estrutura vazia');
            }
            
            // Gerar dinamicamente todos os ciclos baseado no maior ciclo encontrado
            const allCycles = [];
            for (let i = 1; i <= maxCycle; i++) {
                allCycles.push({ ciclo: i });
            }
            
            // Gerar dados para todos os ciclos encontrados
            const completeCycleData = allCycles.map(cycle => {
                const existingData = dataMap[cycle.ciclo];
                return {
                    ciclo: cycle.ciclo,
                    valor_realizado: existingData ? existingData.valor_realizado : null,
                    desempenho: existingData ? existingData.desempenho : null,
                    cor: existingData ? existingData.cor : '#A2314F',
                    meta_minima: existingData ? existingData.meta_minima : null,
                    meta_maxima: existingData ? existingData.meta_maxima : null
                };
            });
            
            dadosParaGrafico.labels = completeCycleData.map(item => `C${item.ciclo}`);
            dadosParaGrafico.realizedValues = completeCycleData.map(item => 
                item.valor_realizado !== null && item.valor_realizado !== undefined ? parseFloat(item.valor_realizado) : 0
            );
            dadosParaGrafico.growthValues = completeCycleData.map(item => 
                item.desempenho !== null && item.desempenho !== undefined ? parseFloat(item.desempenho) : null
            );
            dadosParaGrafico.values = dadosParaGrafico.realizedValues; // Para compatibilidade
            dadosParaGrafico.colors = completeCycleData.map(item => item.cor || '#A2314F');
            
            // Extrair meta_minima e meta_maxima dos dados individuais
            dadosParaGrafico.minMeta = completeCycleData.map(item => 
                item.meta_minima !== null && item.meta_minima !== undefined ? parseFloat(item.meta_minima) : null
            );
            dadosParaGrafico.maxMeta = completeCycleData.map(item => 
                item.meta_maxima !== null && item.meta_maxima !== undefined ? parseFloat(item.meta_maxima) : null
            );
            
            console.log(`Dados de ciclo processados (${maxCycle} ciclos):`, {
                labels: dadosParaGrafico.labels,
                valores: dadosParaGrafico.realizedValues,
                metas_min: dadosParaGrafico.minMeta,
                metas_max: dadosParaGrafico.maxMeta
            });
            
            dadosParaGrafico.indicatorTypeName = indicatorTypeName || (totalData ? totalData.indicator_type_name : null);
        }

        // Atualizar os dados do gráfico
        chartData = dadosParaGrafico;
        
        console.log('=== DADOS FINAIS PARA O GRÁFICO ===');
        console.log('Labels:', chartData.labels);
        console.log('Valores realizados:', chartData.realizedValues);
        console.log('Meta mínima:', chartData.minMeta);
        console.log('Meta máxima:', chartData.maxMeta);
        
        // Atualizar o gráfico
        updateChart();
        
    } catch (error) {
        console.error('Erro ao aplicar filtros ao gráfico:', error);
        showToast('Erro ao aplicar filtros ao gráfico', 4000);
    }
}

// Nova função para buscar tipo de indicador por ID
async function getIndicatorTypeNameByIndicatorId(indicatorId) {
    try {
        const { data, error } = await supabase
            .from('indicators')
            .select('indicator_type:indicator_types(name)')
            .eq('id', indicatorId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data && data.indicator_type ? data.indicator_type.name : null;
    } catch (error) {
        console.error('Erro ao buscar tipo de indicador por ID:', error);
        return null;
    }
}

function mostrarNotificacaoFiltro() {
    const filtrosAplicados = [];
    
    if (filtrosAtivos.indicadores) {
        const nomeIndicador = filtroIndicadores.options[filtroIndicadores.selectedIndex].text;
        filtrosAplicados.push(`Indicador: ${nomeIndicador}`);
    }
    
    if (filtrosAtivos.responsavel) {
        const nomeResponsavel = filtroResponsavel.options[filtroResponsavel.selectedIndex].text;
        filtrosAplicados.push(`Responsável: ${nomeResponsavel}`);
    }
    
    if (filtrosAtivos.departamento) {
        const nomeDepartamento = filtroDepartamento.options[filtroDepartamento.selectedIndex].text;
        filtrosAplicados.push(`Departamento: ${nomeDepartamento}`);
    }
    
    if (filtrosAtivos.ano) {
        filtrosAplicados.push(`Ano: ${filtrosAtivos.ano}`);
    }
    
    if (filtrosAplicados.length > 0) {
        showToast(`Filtros aplicados: ${filtrosAplicados.join(', ')}`, 5000);
    } else {
        showToast('Todos os filtros foram removidos.', 3000);
    }
}

function obterFiltrosAtivos() {
    return { ...filtrosAtivos };
}

const configIcon = document.getElementById('configIcon');
const configTooltip = document.getElementById('configTooltip');

configIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    configTooltip.classList.toggle('show');
});

document.addEventListener('click', function() {
    configTooltip.classList.remove('show');
});

configTooltip.addEventListener('click', function(e) {
    e.stopPropagation();
});

// Variáveis globais para o gráfico YoY
let yoyChartData = {
    labels: [],
    currentValues: [],
    previousValues: [],
    growthPercentages: [],
    indicatorTypeName: null
};

let yoyChart;

// Função para verificar se o indicador é do tipo moeda
async function isIndicatorCurrencyType(indicatorId) {
    try {
        const { data, error } = await supabase
            .from('indicators')
            .select('indicator_type:indicator_types(name)')
            .eq('id', indicatorId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        const typeName = data?.indicator_type?.name?.toLowerCase();
        return typeName === 'moeda' || typeName === 'currency' || typeName === 'dinheiro' || typeName === 'real' || typeName === 'reais';
    } catch (error) {
        console.error('Erro ao verificar tipo de indicador:', error);
        return false;
    }
}

// Função para atualizar o gráfico YoY
async function updateYoYChart() {
    const selectedIndicatorId = filtrosAtivos.indicadores;
    const selectedDepartmentId = filtrosAtivos.departamento;
    const selectedResponsibleId = filtrosAtivos.responsavel;
    const selectedYear = filtrosAtivos.ano || new Date().getFullYear();

    // Verificar se há indicador selecionado e se é do tipo moeda
    if (!selectedIndicatorId) {
        hideYoYChart();
        return;
    }

    const isCurrencyType = await isIndicatorCurrencyType(selectedIndicatorId);
    if (!isCurrencyType) {
        hideYoYChart();
        return;
    }

    // Buscar dados YoY
    let yoyData = [];
    try {
        if (currentViewType === 'mensal') {
            yoyData = await fetchYoYMonthlyData(selectedIndicatorId, selectedDepartmentId, selectedResponsibleId, selectedYear);
        } else if (currentViewType === 'ciclo') {
            yoyData = await fetchYoYCycleData(selectedIndicatorId, selectedDepartmentId, selectedResponsibleId, selectedYear);
        }

        if (yoyData.length === 0) {
            hideYoYChart();
            return;
        }

        // Preparar dados para o gráfico
        if (currentViewType === 'mensal') {
            yoyChartData.labels = yoyData.map(item => {
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                return monthNames[item.mes - 1] || `Mês ${item.mes}`;
            });
        } else {
            yoyChartData.labels = yoyData.map(item => `C${item.cycle}`);
        }

        yoyChartData.currentValues = yoyData.map(item => parseFloat(item.valor_atual) || 0);
        yoyChartData.previousValues = yoyData.map(item => parseFloat(item.valor_anterior) || 0);
        yoyChartData.growthPercentages = yoyData.map(item => parseFloat(item.percentual_crescimento) || 0);
        yoyChartData.indicatorTypeName = 'moeda'; // Sabemos que é moeda

        showYoYChart();
        renderYoYChart();

    } catch (error) {
        console.error('Erro ao atualizar gráfico YoY:', error);
        hideYoYChart();
    }
}

// Função para mostrar o gráfico YoY
function showYoYChart() {
    const yoyContainer = document.getElementById('yoy-chart-container');
    if (yoyContainer) {
        yoyContainer.style.display = 'block';
    }
}

// Função para esconder o gráfico YoY
function hideYoYChart() {
    const yoyContainer = document.getElementById('yoy-chart-container');
    if (yoyContainer) {
        yoyContainer.style.display = 'none';
    }
}

// Função para renderizar o gráfico YoY
function renderYoYChart() {
    const ctx = document.getElementById("yoyChart");
    if (!ctx) return;

    // Destruir gráfico existente se houver
    if (yoyChart) {
        yoyChart.destroy();
    }

    const isDarkMode = document.body.classList.contains('dark');
    const textColor = isDarkMode ? '#E2E8F0' : '#2D3748';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    yoyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: yoyChartData.labels,
            datasets: [
                {
                    label: 'Ano Atual',
                    data: yoyChartData.currentValues,
                    borderColor: '#A2314F',
                    backgroundColor: 'rgba(162, 49, 79, 0.1)',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: '#A2314F',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Ano Anterior',
                    data: yoyChartData.previousValues,
                    borderColor: '#94A3B8',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 4,
                    pointBackgroundColor: '#94A3B8',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                datalabels: {
                    formatter: function(value, context) {
                        const datasetIndex = context.datasetIndex;
                        const dataIndex = context.dataIndex;
                        if (datasetIndex === 0) { // Apenas para o dataset 'Ano Atual'
                            const growthValue = yoyChartData.growthPercentages[dataIndex];
                            if (growthValue !== null && growthValue !== undefined) {
                                return (growthValue > 0 ? '+' : '') + growthValue.toFixed(2) + '%';
                            }
                        }
                        return '';
                    },
                    color: function(context) {
                        const datasetIndex = context.datasetIndex;
                        const dataIndex = context.dataIndex;
                        if (datasetIndex === 0) {
                            const growthValue = yoyChartData.growthPercentages[dataIndex];
                            if (growthValue > 0) return '#00D74F'; // Verde
                            if (growthValue < 0) return '#B21316'; // Vermelho
                        }
                        return '#94A3B8'; // Cinza para 0 ou nulo
                    },
                    font: {
                        weight: 'bold',
                        size: 10
                    },
                    anchor: 'end',
                    align: 'end',
                    offset: 4
                },
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkMode ? '#E2E8F0' : '#2D3748',
                    bodyColor: isDarkMode ? '#E2E8F0' : '#2D3748',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const formattedValue = formatValue(value, yoyChartData.indicatorTypeName);
                            return label + ': ' + formattedValue;
                        },
                        afterBody: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const growthValue = yoyChartData.growthPercentages[dataIndex];
                            if (growthValue !== null && growthValue !== undefined) {
                                const formattedGrowth = (growthValue > 0 ? '+' : '') + growthValue.toFixed(2) + '%';
                                const growthColor = growthValue > 0 ? '🟢' : growthValue < 0 ? '🔴' : '⚪';
                                return [`${growthColor} Crescimento YoY: ${formattedGrowth}`];
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: gridColor,
                        display: true
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: gridColor,
                        display: true
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        callback: function(value) {
                            return formatValue(value, yoyChartData.indicatorTypeName);
                        }
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkMode ? '#E2E8F0' : '#2D3748',
                    bodyColor: isDarkMode ? '#E2E8F0' : '#2D3748',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const formattedValue = formatValue(value, yoyChartData.indicatorTypeName);
                            return label + ': ' + formattedValue;
                        },
                        afterBody: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const growthValue = yoyChartData.growthPercentages[dataIndex];
                            if (growthValue !== null && growthValue !== undefined) {
                                const formattedGrowth = (growthValue > 0 ? '+' : '') + growthValue.toFixed(2) + '%';
                                const growthColor = growthValue > 0 ? '🟢' : growthValue < 0 ? '🔴' : '⚪';
                                return [`${growthColor} Crescimento YoY: ${formattedGrowth}`];
                            }
                            return [];
                        }
                    }
                }
            }
        }
    });
}

let chartData = {
    labels: [],
    values: [],
    realizedValues: [],
    growthValues: [],
    minMeta: [],
    maxMeta: [],
    indicatorTypeName: null // Adicionado para armazenar o tipo do indicador
};

let currentViewType = 'mensal';

Chart.register(ChartDataLabels);

let performanceChart;

async function initChart() {
    // Sempre tentar carregar dados do Supabase primeiro
    if (chartData.values.length === 0 || chartData.labels.length === 0) {
        console.log('Carregando dados do banco de dados...');
        await atualizarGraficoComFiltros();
        return;
    }

    
    
    const ctx = document.getElementById("performanceChart").getContext("2d");
    
    const isDarkMode = document.body.classList.contains('dark');
    const textColor = isDarkMode ? '#E2E8F0' : '#2D3748';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    const datasets = [];
    
    // Dataset principal com valores realizados (barras)
    const realizedData = chartData.realizedValues || chartData.values || [];
    const barColors = chartData.colors || [];
    
        // Usar cores individuais se disponíveis, senão usar gradiente padrão
        let backgroundColor, borderColor;
        if (barColors.length > 0) {
            backgroundColor = barColors.map(colorStr => {
                if (colorStr.startsWith('linear-gradient')) {
                    // Extrair cores do linear-gradient
                    const match = colorStr.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
                    if (match) {
                        const angle = parseInt(match[1]);
                        const colorStops = match[2].split(',').map(s => s.trim());

                        // Criar gradiente no contexto do canvas
                        // Para simplificar, vamos criar um gradiente vertical. Ajustar conforme o ângulo se necessário.
                        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
                        
                        // Adicionar paradas de cor. Assumindo duas cores para simplificar.
                        if (colorStops.length >= 2) {
                            gradient.addColorStop(0, colorStops[0]);
                            gradient.addColorStop(1, colorStops[1]);
                        } else if (colorStops.length === 1) {
                            gradient.addColorStop(0, colorStops[0]);
                            gradient.addColorStop(1, colorStops[0]); // Cor única
                        }
                        return gradient;
                    }
                }
                return colorStr; // Retorna a cor como está se não for um gradiente
            });
            borderColor = barColors.map(colorStr => {
                if (colorStr.startsWith('linear-gradient')) {
                    const match = colorStr.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
                    if (match) {
                        const colorStops = match[2].split(',').map(s => s.trim());
                        return colorStops[0]; // Usar a primeira cor como borda
                    }
                }
                return colorStr; // Retorna a cor como está se não for um gradiente
            });
        } else {
            // Criar gradiente para as barras (fallback)
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            if (isDarkMode) {
                gradient.addColorStop(0, 'rgba(214, 122, 144, 0.8)');
                gradient.addColorStop(1, 'rgba(214, 122, 144, 0.3)');
            } else {
                gradient.addColorStop(0, 'rgba(162, 49, 79, 0.8)');
                gradient.addColorStop(1, 'rgba(162, 49, 79, 0.3)');
            }
            backgroundColor = gradient;
            borderColor = isDarkMode ? 'rgba(214, 122, 144, 1)' : 'rgba(162, 49, 79, 1)';
        }
    
    datasets.push({
        label: 'Valor Realizado',
        data: realizedData,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        type: 'bar',
        // Adicionar sombra
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.1)'
    });

    // Verificar se temos labels válidos
    const labels = chartData.labels || [];
    
    // Barra de total removida conforme solicitado
    
    // Linha de meta mínima (se não for null, undefined ou NaN)
    if (chartData.minMeta && chartData.minMeta.length > 0 && chartData.labels.length > 0) {
        const minMetaData = [...chartData.minMeta];
        datasets.push({
            label: 'Meta Mínima',
            data: minMetaData,
            type: 'line',
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderWidth: 3,
            borderDash: [10, 5],
            pointRadius: 6,
            pointBackgroundColor: '#FF9800',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 3,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#FF9800',
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 3,
            fill: false,
            tension: 0.4,
            order: 1
        });
    }
    
    // Linha de meta máxima (se não for null, undefined ou NaN)
    if (chartData.maxMeta && chartData.maxMeta.length > 0 && chartData.labels.length > 0) {
        const maxMetaData = [...chartData.maxMeta];
        datasets.push({
            label: 'Meta Máxima',
            data: maxMetaData,
            type: 'line',
            borderColor: '#00D74F',
            backgroundColor: 'rgba(0, 215, 79, 0.1)',
            borderWidth: 3,
            borderDash: [10, 5],
            pointRadius: 6,
            pointBackgroundColor: '#00D74F',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 3,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#00D74F',
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 3,
            fill: false,
            tension: 0.4,
            order: 2
        });
    }
    
    console.log("Total de datasets criados:", datasets.length);
    console.log("Datasets:", datasets);
    
    const config = {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart',
                animateRotate: true,
                animateScale: true
            },
            interaction: {
                mode: 'index',
                intersect: false,
                animationDuration: 200
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: gridColor,
                        display: true,
                        lineWidth: 1,
                        drawBorder: true,
                        drawOnChartArea: true,
                        drawTicks: true
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        padding: 10
                    },
                    border: {
                        color: gridColor,
                        width: 2
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: gridColor,
                        display: true,
                        lineWidth: 1,
                        drawBorder: true,
                        drawOnChartArea: true,
                        drawTicks: true
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        padding: 10,
                        callback: function(value, index, values) {
                            return formatValue(value, chartData.indicatorTypeName);
                        }
                    },
                    border: {
                        color: gridColor,
                        width: 2
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        padding: 20,
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkMode ? '#E2E8F0' : '#2D3748',
                    bodyColor: isDarkMode ? '#E2E8F0' : '#2D3748',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12,
                        weight: '500'
                    },
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const formattedValue = formatValue(value, chartData.indicatorTypeName);
                            return label + ': ' + formattedValue;
                        },
                        afterBody: function(context) {
                            if (context[0].dataset.label === 'Valor Realizado') {
                                const dataIndex = context[0].dataIndex;
                                const growthValue = chartData.growthValues && chartData.growthValues[dataIndex];
                                if (growthValue !== null && growthValue !== undefined) {
                                    const formattedGrowth = (growthValue > 0 ? '+' : '') + formatValue(growthValue, 'Percentual');
                                    return ['Desempenho: ' + formattedGrowth];
                                }
                            }
                            return [];
                        }
                    }
                },
                datalabels: {
                    // Rótulo para o Valor Realizado (dentro da barra)
                    labels: {
                        value: {
                            display: function(context) {
                                return context.dataset.label === 'Valor Realizado';
                            },
                            color: function(context) {
                                return isDarkMode ? '#FFFFFF' : '#2D3748';
                            },
                            anchor: 'center', // Posição do rótulo: no centro da barra
                            align: 'center', // Alinhamento do rótulo: centro da barra
                            offset: 0, // Sem offset
                            rotation: 90,
                            font: {
                                weight: 'bold',
                                size: 11
                            },
                            backgroundColor: function(context) {
                                return isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)';
                            },
                            borderColor: function(context) {
                                return isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
                            },
                            borderWidth: 1,
                            borderRadius: 4,
                            padding: 4,
                            formatter: function(value, context) {
                                const realizedValue = chartData.realizedValues[context.dataIndex];
                                if (realizedValue !== null && realizedValue !== undefined) {
                                    return formatValue(realizedValue, chartData.indicatorTypeName);
                                }
                                return null;
                            }
                        },
                        growth: {
                            // Rótulo para o Desempenho (acima da barra)
                            display: function(context) {
                                return context.dataset.label === 'Valor Realizado' && 
                                       chartData.growthValues && 
                                       chartData.growthValues[context.dataIndex] !== null && 
                                       chartData.growthValues[context.dataIndex] !== undefined;
                            },
                            color: function(context) {
                                const growthValue = chartData.growthValues[context.dataIndex];
                                return growthValue >= 0 ? '#00D74F' : '#B21316'; // Verde para positivo, Vermelho para negativo
                            },
                            anchor: 'end', // Acima da barra
                            align: 'end', // Alinha ao topo
                            offset: 15, // Offset maior para separar do valor realizado
                            font: {
                                weight: 'bold',
                                size: 10
                            },
                            backgroundColor: function(context) {
                                const growthValue = chartData.growthValues[context.dataIndex];
                                return growthValue >= 0 ? 'rgba(0, 215, 79, 0.1)' : 'rgba(178, 19, 22, 0.1)';
                            },
                            borderColor: function(context) {
                                const growthValue = chartData.growthValues[context.dataIndex];
                                return growthValue >= 0 ? '#00D74F' : '#B21316';
                            },
                            borderWidth: 1,
                            borderRadius: 4,
                            padding: 3,
                            formatter: function(value, context) {
                                const growthValue = chartData.growthValues[context.dataIndex];
                                if (growthValue !== null && growthValue !== undefined) {
                                    return (growthValue > 0 ? '+' : '') + formatValue(growthValue, 'Percentual'); // Assume que desempenho é sempre percentual
                                }
                                return null;
                            }
                        },
                        minMeta: {
                            // Rótulo para Meta Mínima (apenas no primeiro ponto)
                            display: function(context) {
                                return context.dataset.label === 'Meta Mínima' && context.dataIndex === 0;
                            },
                            color: '#FF9800',
                            anchor: 'start',
                            align: 'start',
                            offset: 10,
                            font: {
                                weight: 'bold',
                                size: 10
                            },
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            borderColor: '#FF9800',
                            borderWidth: 1,
                            borderRadius: 4,
                            padding: 3,
                            formatter: function(value, context) {
                                return 'Meta Min: ' + formatValue(value, chartData.indicatorTypeName);
                            }
                        },
                        maxMeta: {
                            // Rótulo para Meta Máxima (apenas no primeiro ponto)
                            display: function(context) {
                                return context.dataset.label === 'Meta Máxima' && context.dataIndex === 0;
                            },
                            color: '#00D74F',
                            anchor: 'start',
                            align: 'end',
                            offset: 10,
                            font: {
                                weight: 'bold',
                                size: 10
                            },
                            backgroundColor: 'rgba(0, 215, 79, 0.1)',
                            borderColor: '#00D74F',
                            borderWidth: 1,
                            borderRadius: 4,
                            padding: 3,
                            formatter: function(value, context) {
                                return 'Meta Max: ' + formatValue(value, chartData.indicatorTypeName);
                            }
                        },
                        // Rótulo de percentual de atingimento total removido
                    }
                }
            }
        }
    };
    
    // Destruir gráfico existente se houver
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Criar novo gráfico
    performanceChart = new Chart(ctx, config);
    
    console.log("Gráfico criado com sucesso");
}

function updateChart() {
    if (performanceChart) {
        performanceChart.destroy();
    }
    initChart();
}

// Função de formatação atualizada para usar o tipo de indicador
function formatValue(value, indicatorType) {
    if (isNaN(value) || value === null || value === undefined) {
        return "";
    }
    const numValue = parseFloat(value);
    
    // Se não há tipo de indicador definido, usar formatação padrão
    if (!indicatorType) {
        return numValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    switch (indicatorType.toLowerCase()) {
        case "percentual":
        case "percentage":
        case "%":
            return `${numValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        case "moeda":
        case "currency":
        case "dinheiro":
        case "real":
        case "reais":
            return numValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        case "dias":
        case "day":
        case "days":
            return `${numValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} dias`;
        case "meses":
        case "month":
        case "months":
            return `${numValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} meses`;
        case "anos":
        case "year":
        case "years":
            return `${numValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} anos`;
        case "horas":
        case "hour":
        case "hours":
            return `${numValue.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} horas`;
        case "minutos":
        case "minute":
        case "minutes":
            return `${numValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} minutos`;
        case "quantidade":
        case "qty":
        case "qtd":
        case "unidade":
        case "unidades":
            return numValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
        default:
            return numValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function showToast(message, duration = 3000) {
    // Remove toast existente se houver
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Adicionar ao DOM
    document.body.appendChild(toast);
    
    // Mostrar toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remover toast após duração especificada
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Sistema de filtros minimalista
const filtroIcone = document.getElementById('filtro-icone');
const filtroTooltip = document.getElementById('filtro-tooltip');
const filtroOverlay = document.getElementById('filtro-overlay');
const filtroBadge = document.getElementById('filtro-badge');
const filtroAplicar = document.getElementById('filtro-aplicar');
const filtroLimpar = document.getElementById('filtro-limpar');

if (filtroIcone) {
    filtroIcone.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleFiltroTooltip();
    });
}

if (filtroOverlay) {
    filtroOverlay.addEventListener('click', function() {
        fecharFiltroTooltip();
    });
}

if (filtroAplicar) {
    filtroAplicar.addEventListener('click', function() {
        aplicarFiltrosMinimalista();
        fecharFiltroTooltip();
    });
}

if (filtroLimpar) {
    filtroLimpar.addEventListener('click', function() {
        limparFiltrosMinimalista();
        fecharFiltroTooltip();
    });
}

function toggleFiltroTooltip() {
    const isActive = filtroTooltip.classList.contains('active');
    
    if (isActive) {
        fecharFiltroTooltip();
    } else {
        abrirFiltroTooltip();
    }
}

function abrirFiltroTooltip() {
    filtroTooltip.classList.add('active');
    filtroOverlay.style.display = 'block';
    filtroIcone.classList.add('active');
}

function fecharFiltroTooltip() {
    filtroTooltip.classList.remove('active');
    filtroOverlay.style.display = 'none';
    filtroIcone.classList.remove('active');
}

function aplicarFiltrosMinimalista() {
    aplicarFiltros();
    
    atualizarFiltroBadge();
    
    showToast('Filtros aplicados com sucesso!');
}

function limparFiltrosMinimalista() {
    document.getElementById('filtro-indicadores').value = '';
    document.getElementById('filtro-responsavel').value = '';
    document.getElementById('filtro-departamento').value = '';
    document.getElementById('filtro-ano').value = '';
    
    aplicarFiltros();
    
    atualizarFiltroBadge();
    
    showToast('Filtros removidos com sucesso!');
}

function atualizarFiltroBadge() {
    let filtrosAtivosCount = 0;
    
    if (document.getElementById('filtro-indicadores').value) filtrosAtivosCount++;
    if (document.getElementById('filtro-responsavel').value) filtrosAtivosCount++;
    if (document.getElementById('filtro-departamento').value) filtrosAtivosCount++;
    if (document.getElementById('filtro-ano').value) filtrosAtivosCount++;
    
    if (filtrosAtivosCount > 0) {
        filtroBadge.textContent = filtrosAtivosCount;
        filtroBadge.style.display = 'flex';
    } else {
        filtroBadge.style.display = 'none';
    }
}

const addValueBtn = document.getElementById('add-value-btn');
const addValueModal = document.getElementById('add-value-modal');
const addValueCloseBtn = document.getElementById('close-add-value-modal');
const addValueForm = document.getElementById('add-value-form');
const cancelAddValueBtn = document.getElementById('cancel-add-value-btn');

const addValueIndicator = document.getElementById('add-value-indicator');
const addValueType = document.getElementById('add-value-type');
const periodType = document.getElementById('period-type');
const cycleField = document.getElementById('cycle-field');
const cycleSelect = document.getElementById('cycle-select');
const cycleDateRange = document.getElementById('cycle-date-range');
const monthField = document.getElementById('month-field');
const monthSelect = document.getElementById('month-select');
const yearField = document.getElementById('year-field');
const yearSelect = document.getElementById('year-select');
const metaTypeField = document.getElementById('meta-type-field');
const addValueStartDate = document.getElementById('add-value-start-date');
const addValueEndDate = document.getElementById('add-value-end-date');
const addValueValue = document.getElementById('add-value-value');

if (addValueBtn) {
    addValueBtn.addEventListener('click', openAddValueModal);
}

if (addValueCloseBtn) {
    addValueCloseBtn.addEventListener('click', closeAddValueModal);
}

if (cancelAddValueBtn) {
    cancelAddValueBtn.addEventListener('click', closeAddValueModal);
}

if (addValueForm) {
    addValueForm.addEventListener('submit', handleAddValueSubmit);
}

if (addValueType) {
    addValueType.addEventListener('change', function() {
        if (this.value === 'meta') {
            metaTypeField.style.display = 'block';
        } else {
            metaTypeField.style.display = 'none';
        }
    });
}

if (periodType) {
    periodType.addEventListener('change', function() {
        const selectedType = this.value;
        
        cycleField.style.display = 'none';
        cycleDateRange.style.display = 'none';
        monthField.style.display = 'none';
        yearField.style.display = 'none';
        
        if (selectedType === 'ciclo') {
            cycleField.style.display = 'block';
            cycleDateRange.style.display = 'block';
        } else if (selectedType === 'mensal') {
            monthField.style.display = 'block';
            yearField.style.display = 'block';
        }
    });
}

if (cycleSelect) {
    cycleSelect.addEventListener('change', function() {
        const selectedCycle = this.value;
        if (selectedCycle) {
            const cycleNumber = parseInt(selectedCycle.replace('C', ''));
            const currentYear = new Date().getFullYear();
            
            const startDate = new Date(currentYear, cycleNumber - 1, 1);
            const endDate = new Date(currentYear, cycleNumber, 0);
            
            addValueStartDate.value = startDate.toISOString().split('T')[0];
            addValueEndDate.value = endDate.toISOString().split('T')[0];
        }
    });
}

if (monthSelect && yearSelect) {
    function updateMonthlyDates() {
        const selectedMonth = monthSelect.value;
        const selectedYear = yearSelect.value;
        
        if (selectedMonth && selectedYear) {
            const startDate = new Date(selectedYear, selectedMonth - 1, 1);
            const endDate = new Date(selectedYear, selectedMonth, 0);
            
            addValueStartDate.value = startDate.toISOString().split('T')[0];
            addValueEndDate.value = endDate.toISOString().split('T')[0];
        }
    }
    
    monthSelect.addEventListener('change', updateMonthlyDates);
    yearSelect.addEventListener('change', updateMonthlyDates);
}

if (addValueModal) {
    addValueModal.addEventListener('click', function(e) {
        if (e.target === addValueModal) {
            closeAddValueModal();
        }
    });
}

async function openAddValueModal() {
    if (addValueModal) {
        addValueModal.classList.add("show");
        document.body.style.overflow = "hidden";
        
        if (addValueForm) {
            addValueForm.reset();
        }
        
        cycleField.style.display = "none";
        cycleDateRange.style.display = "none";
        monthField.style.display = "none";
        yearField.style.display = "none";
        metaTypeField.style.display = "none";

        await populateIndicatorsSelect();
        await populatePeriodTypesSelect();
        await populateGoalTypesRadioButtons();
        populateYearSelects();
        populateMonthSelect();
        populateCycleSelect();

        const periodTypeElement = document.getElementById("period-type");
        if (periodTypeElement) {
            if (periodTypeElement.options.length > 1) {
                periodTypeElement.value = periodTypeElement.options[1].value;
            }
            periodTypeElement.dispatchEvent(new Event("change"));
        }

        const monthSelectElement = document.getElementById("month-select");
        const yearSelectElement = document.getElementById("year-select");
        if (monthSelectElement && yearSelectElement) {
            monthSelectElement.dispatchEvent(new Event("change"));
            yearSelectElement.dispatchEvent(new Event("change"));
        }
    }
}

function closeAddValueModal() {
    if (addValueModal) {
        addValueModal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

async function handleAddValueSubmit(event) {
    event.preventDefault();
    
    if (!addValueIndicator.value) {
        showToast('Por favor, selecione um indicador.', 4000);
        return;
    }
    
    if (!addValueType.value) {
        showToast('Por favor, selecione o tipo de valor.', 4000);
        return;
    }
    
    if (!periodType.value) {
        showToast('Por favor, selecione o tipo de período.', 4000);
        return;
    }
    
    if (!addValueValueRaw.value) {
        showToast('Por favor, informe o valor.', 4000);
        return;
    }
    
    if (periodType.value === 'ciclo' && !cycleSelect.value) {
        showToast('Por favor, selecione o ciclo.', 4000);
        return;
    }
    
    if (periodType.value === 'mensal' && (!monthSelect.value || !yearSelect.value)) {
        showToast('Por favor, selecione o mês e o ano.', 4000);
        return;
    }
    
    const formData = {
        departmentId: getSelectedDepartmentId(),
        responsibleId: await getAuthenticatedUserId(),
        indicator: addValueIndicator.value,
        valueType: addValueType.value,
        periodType: periodType.value,
        value: parseFloat(addValueValueRaw.value),
        startDate: addValueStartDate.value,
        endDate: addValueEndDate.value
    };
    
    if (periodType.value === 'ciclo') {
        formData.cycle = cycleSelect.value;
    } else if (periodType.value === 'mensal') {
        formData.month = monthSelect.value;
        formData.year = yearSelect.value;
    }
    
    if (addValueType.value === 'meta') {
        const goalLimitTypeRadio = document.querySelector('input[name="goal-limit-type"]:checked');
        if (goalLimitTypeRadio) {
            formData.goalLimitType = goalLimitTypeRadio.value;
        } else {
            showToast('Por favor, selecione o tipo de limite da meta (Mínima/Máxima).', 4000);
            return;
        }
    }
    
    try {
        console.log("Dados a serem salvos:", formData);

        const indicatorId = await getIndicatorIdByName(formData.indicator);
        if (!indicatorId) {
            showToast("Indicador não encontrado.", 4000);
            return;
        }

        const periodTypeId = await getPeriodTypeIdByName(formData.periodType === 'ciclo' ? 'Ciclo' : formData.periodType.charAt(0).toUpperCase() + formData.periodType.slice(1));
        if (!periodTypeId) {
            showToast("Tipo de período não encontrado.", 4000);
            return;
        }

        let goalTypeId = null;
        if (formData.valueType === 'meta' && formData.metaType) {
            goalTypeId = await getGoalTypeIdByName(formData.metaType);
            if (!goalTypeId) {
                showToast("Tipo de meta não encontrado.", 4000);
                return;
            }
        }

        const departmentId = null;
        const responsibleId = null;
        const updatedBy = null;

        let saveSuccessful = false;

        if (formData.valueType === 'meta') {
            if (formData.periodType === 'ciclo') {
                const cycleGoalData = {
                    indicator_id: indicatorId,
                    department_id: departmentId,
                    responsible_id: responsibleId,
                    period_type_id: periodTypeId,
                    cycle: parseInt(formData.cycle.replace('C', '')),
                    start_date: formData.startDate,
                    end_date: formData.endDate,
                    goal_type_id: goalTypeId,
                    goal_value: formData.value,
                    updated_by: updatedBy,
                };
                const result = await saveCycleGoalToSupabase(cycleGoalData);
                saveSuccessful = !!result;
            } else {
                const fixedGoalData = {
                    indicator_id: indicatorId,
                    department_id: departmentId,
                    responsible_id: responsibleId,
                    period_type_id: periodTypeId,
                    year: parseInt(formData.year),
                    month: formData.month ? parseInt(formData.month) : null,
                    goal_type_id: goalTypeId,
                    goal_value: formData.value,
                    goalLimitType: formData.goalLimitType, // Adicionado
                    updated_by: updatedBy,
                };
                const result = await saveFixedGoalToSupabase(fixedGoalData);
                saveSuccessful = !!result;
            }
        } else if (formData.valueType === 'realizado') {
            if (formData.periodType === 'ciclo') {
                const cycleResultData = {
                    indicator_id: indicatorId,
                    department_id: departmentId,
                    responsible_id: responsibleId,
                    period_type_id: periodTypeId,
                    cycle: parseInt(formData.cycle.replace('C', '')),
                    start_date: formData.startDate,
                    end_date: formData.endDate,
                    result_value: formData.value,
                    updated_by: updatedBy,
                };
                const result = await saveCycleResultToSupabase(cycleResultData);
                saveSuccessful = !!result;
            } else {
                const fixedResultData = {
                    indicator_id: indicatorId,
                    department_id: departmentId,
                    responsible_id: responsibleId,
                    period_type_id: periodTypeId,
                    year: parseInt(formData.year),
                    month: formData.month ? parseInt(formData.month) : null,
                    result_value: formData.value,
                    updated_by: updatedBy,
                };
                const result = await saveFixedResultToSupabase(fixedResultData);
                saveSuccessful = !!result;
            }
        }

        if (saveSuccessful) {
            showToast("Meta/Realizado adicionado com sucesso!");
            closeAddValueModal();
            initChart();
        } else {
            showToast("Erro ao salvar dados. Tente novamente.", 4000);
        }
        
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showToast('Erro ao salvar dados. Tente novamente.', 4000);
    }
}

function loadSelectedDepartment() {
    try {
        // Priorizar selectedDepartmentName do localStorage (vindo de departamentos.html)
        const selectedDepartmentName = localStorage.getItem('selectedDepartmentName');
        const selectedDepartmentId = localStorage.getItem('selectedDepartmentId');
        
        if (selectedDepartmentName) {
            updateDepartmentTitle(selectedDepartmentName);
            console.log('Departamento carregado do localStorage:', selectedDepartmentName, 'ID:', selectedDepartmentId);
            return;
        }
        
        // Fallback: verificar formato antigo
        const savedDepartment = localStorage.getItem('selectedDepartment');
        if (savedDepartment) {
            const department = JSON.parse(savedDepartment);
            updateDepartmentTitle(department.name);
            return;
        }
        
        // Fallback: verificar URL
        const urlParams = new URLSearchParams(window.location.search);
        const departmentFromUrl = urlParams.get('department');
        if (departmentFromUrl) {
            const departmentName = decodeURIComponent(departmentFromUrl);
            updateDepartmentTitle(departmentName);
            
            localStorage.setItem('selectedDepartment', JSON.stringify({
                name: departmentName
            }));
            return;
        }
        
        updateDepartmentTitle('Departamento não selecionado');
        
    } catch (error) {
        console.error('Erro ao carregar departamento selecionado:', error);
        updateDepartmentTitle('Erro ao carregar departamento');
    }
}

function updateDepartmentTitle(departmentName) {
    const departmentTitle = document.getElementById('departmentTitle');
    if (departmentTitle) {
        departmentTitle.textContent = departmentName;
        
        departmentTitle.style.opacity = '0';
        setTimeout(() => {
            departmentTitle.style.opacity = '1';
        }, 100);
    }
}

function changeDepartment(departmentName) {
    localStorage.setItem('selectedDepartment', JSON.stringify({
        name: departmentName
    }));
    
    updateDepartmentTitle(departmentName);
    
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('department', encodeURIComponent(departmentName));
    window.history.replaceState({}, '', newUrl);
    
    initChart();
}

function goBackToDepartments() {
    window.location.href = 'departamentos.html';
}

// Função para carregar opções dos filtros dinamicamente
async function loadFilterOptions() {
    try {
        // Carregar indicadores
        const indicators = await loadIndicatorsForFilter();
        const indicatorsSelect = document.getElementById('filtro-indicadores');
        if (indicatorsSelect) {
            // Limpar opções existentes (exceto a primeira)
            while (indicatorsSelect.options.length > 1) {
                indicatorsSelect.remove(1);
            }
            
            indicators.forEach(indicator => {
                const option = document.createElement('option');
                option.value = indicator.id;
                option.textContent = indicator.name;
                indicatorsSelect.appendChild(option);
            });
        }

        // Carregar responsáveis
        const responsibles = await loadResponsiblesForFilter();
        const responsiblesSelect = document.getElementById('filtro-responsavel');
        if (responsiblesSelect) {
            // Limpar opções existentes (exceto a primeira)
            while (responsiblesSelect.options.length > 1) {
                responsiblesSelect.remove(1);
            }
            
            responsibles.forEach(responsible => {
                const option = document.createElement('option');
                option.value = responsible.id;
                option.textContent = responsible.name;
                responsiblesSelect.appendChild(option);
            });
        }

        // Carregar departamentos
        const departments = await loadDepartmentsForFilter();
        const departmentsSelect = document.getElementById('filtro-departamento');
        if (departmentsSelect) {
            // Limpar opções existentes (exceto a primeira)
            while (departmentsSelect.options.length > 1) {
                departmentsSelect.remove(1);
            }
            
            departments.forEach(department => {
                const option = document.createElement('option');
                option.value = department.id;
                option.textContent = department.name;
                departmentsSelect.appendChild(option);
            });
        }

        // Carregar anos
        const years = await loadYearsForFilter();
        const yearsSelect = document.getElementById('filtro-ano');
        if (yearsSelect) {
            // Limpar opções existentes (exceto a primeira)
            while (yearsSelect.options.length > 1) {
                yearsSelect.remove(1);
            }
            
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearsSelect.appendChild(option);
            });
        }

        console.log('Opções dos filtros carregadas com sucesso');
    } catch (error) {
        console.error('Erro ao carregar opções dos filtros:', error);
        showToast('Erro ao carregar opções dos filtros', 4000);
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    const sidebar = document.getElementById("sidebar");
    const toggleIcon = document.getElementById("toggleIcon");
    if (sidebar && toggleIcon) {
        sidebar.classList.add("collapsed");
        toggleIcon.className = "ri-arrow-right-s-line";
    }

    loadSelectedDepartment();
    
    await checkSupabaseConnection();
    
    // Carregar opções dos filtros dinamicamente
    await loadFilterOptions();
    
    // Aguardar um pouco para garantir que o departamento foi configurado
    setTimeout(() => {
        initChart();
    }, 100);
    
    atualizarFiltroBadge();
    
    document.querySelectorAll('.filtro-select').forEach(select => {
        select.addEventListener('change', function() {
            this.classList.add('changed');
            setTimeout(() => {
                this.classList.remove('changed');
            }, 300);
            
            atualizarFiltroBadge();
        });
    });

    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
        viewToggle.addEventListener('click', async function(event) {
            const target = event.target.closest('.view-toggle-btn');
            if (target) {
                document.querySelectorAll('.view-toggle-btn').forEach(btn => btn.classList.remove('active'));
                target.classList.add('active');
                currentViewType = target.dataset.view;
                await atualizarGraficoComFiltros();
                // Atualizar gráfico YoY quando mudar visualização
                await updateYoYChart();
            }
        });
    }

    // Modais de Plano de Ação
    const actionPlanBtn = document.getElementById("action-plan-btn");
    actionPlanModal = document.getElementById("action-plan-modal");
    const closeActionPlanModal = document.getElementById("close-action-plan-modal");

    const newPlanBtn = document.getElementById("new-plan-btn");
    const newPlanPopup = document.getElementById("new-plan-popup");
    const closeNewPlanPopup = document.getElementById("close-new-plan-popup");
    const newPlanForm = document.getElementById("new-plan-form");
    const cancelNewPlanBtn = document.getElementById("cancel-new-plan");

    if (actionPlanBtn) {
        actionPlanBtn.addEventListener("click", () => {
            actionPlanModal.classList.add("show");
            loadActionPlansToKanban(); // Função para carregar os planos no kanban
        });
    }

    if (closeActionPlanModal) {
        closeActionPlanModal.addEventListener("click", () => {
            actionPlanModal.classList.remove("show");
        });
    }

    if (newPlanBtn) {
        newPlanBtn.addEventListener("click", () => {
            newPlanPopup.classList.add("show");
            populateActionPlanAssignees(); // Popula responsáveis para o novo plano
            populateActionPlanDepartments(); // Popula departamentos para o novo plano
            populateActionPlanStatuses(); // Popula status para o novo plano
            populateActionPlanIndicators(); // Popula indicadores para o novo plano
        });
    }

    if (closeNewPlanPopup) {
        closeNewPlanPopup.addEventListener("click", () => {
            newPlanPopup.classList.remove("show");
        });
    }

    if (cancelNewPlanBtn) {
        cancelNewPlanBtn.addEventListener("click", () => {
            newPlanPopup.classList.remove("show");
        });
    }

    // Event listener do formulário será gerenciado pela nova implementação

    // Fechar modais clicando fora
    window.addEventListener("click", (event) => {
        if (event.target == actionPlanModal) {
            actionPlanModal.classList.remove("show");
        }
        if (event.target == newPlanPopup) {
            newPlanPopup.classList.remove("show");
        }
    });
});

document.addEventListener('click', function(e) {
    if (filtroIcone && filtroTooltip && !filtroIcone.contains(e.target) && !filtroTooltip.contains(e.target)) {
        fecharFiltroTooltip();
    }
});

if (filtroTooltip) {
    filtroTooltip.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

async function populateIndicatorsSelect() {
    const selectElement = document.getElementById('add-value-indicator');
    if (!selectElement) return;

    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    try {
        const indicators = await getAllIndicatorsWithTypes();
        indicators.forEach(indicator => {
            const option = document.createElement("option");
            option.value = indicator.name;
            option.textContent = indicator.name;
            if (indicator.indicator_type) {
                option.dataset.indicatorTypeName = indicator.indicator_type.name;
            }
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao popular indicadores:', error);
        showToast('Erro ao carregar indicadores para o modal.', 4000);
    }
}

async function populatePeriodTypesSelect() {
    const selectElement = document.getElementById('period-type');
    if (!selectElement) return;

    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    try {
        const { data, error } = await supabase
            .from('indicator_periods')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;

        data.forEach(periodType => {
            const option = document.createElement('option');
            option.value = periodType.name.toLowerCase();
            option.textContent = periodType.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao popular tipos de período:', error);
        showToast('Erro ao carregar tipos de período para o modal.', 4000);
    }
}

async function populateGoalTypesRadioButtons() {
    const metaTypeField = document.getElementById("meta-type-field");
    if (!metaTypeField) return;

    metaTypeField.innerHTML = '<label class="modal__label">Tipo da Meta</label>';

    const goalLimitTypes = [
        { value: "min", name: "Meta Mínima" },
        { value: "max", name: "Meta Máxima" }
    ];

    goalLimitTypes.forEach(type => {
        const radioDiv = document.createElement('div');
        radioDiv.classList.add('modal__radio-group');

        const input = document.createElement('input');
        input.type = 'radio';
        input.id = `meta-type-${type.value}`;
        input.name = 'goal-limit-type'; // Alterado para goal-limit-type
        input.value = type.value;
        input.classList.add('modal__radio-input');

        const label = document.createElement('label');
        label.htmlFor = `meta-type-${type.value}`;
        label.textContent = type.name;
        label.classList.add('modal__radio-label');

        radioDiv.appendChild(input);
        radioDiv.appendChild(label);
        metaTypeField.appendChild(radioDiv);
    });
}

function populateYearSelects() {
    const currentYear = new Date().getFullYear();
    const yearSelects = [document.getElementById('year-select')];

    yearSelects.forEach(selectElement => {
        if (!selectElement) return;

        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }

        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === currentYear) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        }
    });
}

function populateMonthSelect() {
    const selectElement = document.getElementById('month-select');
    if (!selectElement) return;

    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    const months = [
        { value: 1, name: 'Janeiro' }, { value: 2, name: 'Fevereiro' },
        { value: 3, name: 'Março' }, { value: 4, name: 'Abril' },
        { value: 5, name: 'Maio' }, { value: 6, name: 'Junho' },
        { value: 7, name: 'Julho' }, { value: 8, name: 'Agosto' },
        { value: 9, name: 'Setembro' }, { value: 10, name: 'Outubro' },
        { value: 11, name: 'Novembro' }, { value: 12, name: 'Dezembro' }
    ];

    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month.value;
        option.textContent = month.name;
        selectElement.appendChild(option);
    });
}

function populateCycleSelect() {
    const selectElement = document.getElementById('cycle-select');
    if (!selectElement) return;

    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    for (let i = 1; i <= 17; i++) { // Exemplo: 17 ciclos
        const option = document.createElement('option');
        option.value = `C${i}`;
        option.textContent = `Ciclo ${i}`;
        selectElement.appendChild(option);
    }
}

const addValueValueInput = document.getElementById("add-value-value-input");
const addValueValueRaw = document.getElementById("add-value-value-raw");
const addValueIndicatorTypeName = document.getElementById("add-value-indicator-type-name");
const formattedValueDisplay = document.getElementById("formatted-value-display");

if (addValueValueInput) {
    addValueValueInput.addEventListener("input", function() {
        let rawValue = this.value.replace(/[^0-9,.]/g, "");
        rawValue = rawValue.replace(".", "");
        rawValue = rawValue.replace(",", ".");

        const numericValue = parseFloat(rawValue);
        if (!isNaN(numericValue)) {
            addValueValueRaw.value = numericValue;
            const selectedIndicatorType = addValueIndicatorTypeName.value;
            formattedValueDisplay.textContent = formatValue(numericValue, selectedIndicatorType);
        } else {
            addValueValueRaw.value = "";
            formattedValueDisplay.textContent = "";
        }
    });

    addValueValueInput.addEventListener("blur", function() {
        const numericValue = parseFloat(addValueValueRaw.value);
        const selectedIndicatorType = addValueIndicatorTypeName.value;
        if (!isNaN(numericValue)) {
            this.value = formatValue(numericValue, selectedIndicatorType);
        } else {
            this.value = "";
        }
    });

    addValueValueInput.addEventListener("focus", function() {
        this.value = addValueValueRaw.value;
    });
}

if (addValueIndicator) {
    addValueIndicator.addEventListener("change", function() {
        const selectedOption = this.options[this.selectedIndex];
        const indicatorTypeName = selectedOption.dataset.indicatorTypeName || "";
        addValueIndicatorTypeName.value = indicatorTypeName;

        const currentValue = addValueValueRaw.value;
        if (currentValue) {
            addValueValueInput.value = formatValue(parseFloat(currentValue), indicatorTypeName);
            formattedValueDisplay.textContent = formatValue(parseFloat(currentValue), indicatorTypeName);
        } else {
            formattedValueDisplay.textContent = "";
        }
    });
}

async function fetchMonthlyIndicatorData(indicatorId, departmentId, responsibleId, year) {
    try {
        console.log('=== BUSCANDO DADOS MENSAIS ===');
        console.log('Parâmetros:', { indicatorId, departmentId, responsibleId, year });
        
        let query = supabase.from("vw_desempenho_indicadores").select("*");

        // Aplicar filtros apenas se os valores existirem
        if (indicatorId && indicatorId !== 'null' && indicatorId !== '') {
            query = query.eq("id_indicador", indicatorId);
            console.log('Filtro aplicado - Indicador:', indicatorId);
        }
        if (departmentId && departmentId !== 'null' && departmentId !== '') {
            query = query.eq("id_departamento", departmentId);
            console.log('Filtro aplicado - Departamento:', departmentId);
        }
        if (responsibleId && responsibleId !== 'null' && responsibleId !== '') {
            query = query.eq("id_responsavel", responsibleId);
            console.log('Filtro aplicado - Responsável:', responsibleId);
        }
        if (year && year !== 'null' && year !== '') {
            query = query.eq("ano", parseInt(year));
            console.log('Filtro aplicado - Ano:', year);
        }

        // Ordenar por ano e mês
        query = query.order("ano", { ascending: true }).order("mes", { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        console.log('Dados mensais encontrados:', data?.length || 0);
        if (data && data.length > 0) {
            console.log('Primeiro registro:', data[0]);
        }

        // Buscar informações adicionais do indicador se um indicador específico foi selecionado
        let totalData = null;
        if (indicatorId && indicatorId !== 'null' && indicatorId !== '') {
            const { data: indicatorInfo, error: indicatorError } = await supabase
                .from("vw_desempenho_indicadores")
                .select("indicator_type_name, indicator_scope_name")
                .eq("id_indicador", indicatorId)
                .limit(1)
                .single();
            
            if (indicatorError && indicatorError.code !== "PGRST116") {
                console.warn('Aviso ao buscar informações do indicador:', indicatorError);
            } else {
                totalData = indicatorInfo;
                console.log('Informações do indicador:', totalData);
            }
        }

        return { monthlyData: data || [], totalData: totalData };
    } catch (error) {
        console.error("Erro ao buscar dados mensais do indicador:", error);
        return { monthlyData: [], totalData: null };
    }
}

async function fetchCycleIndicatorData(indicatorId, departmentId, responsibleId, year) {
    try {
        console.log('=== BUSCANDO DADOS DE CICLO ===');
        console.log('Parâmetros:', { indicatorId, departmentId, responsibleId, year });
        
        let query = supabase.from("vw_desempenho_indicadores_ciclo").select("*");

        // Aplicar filtros apenas se os valores existirem
        if (indicatorId && indicatorId !== 'null' && indicatorId !== '') {
            query = query.eq("id_indicador", indicatorId);
            console.log('Filtro aplicado - Indicador:', indicatorId);
        }
        if (departmentId && departmentId !== 'null' && departmentId !== '') {
            query = query.eq("id_departamento", departmentId);
            console.log('Filtro aplicado - Departamento:', departmentId);
        }
        if (responsibleId && responsibleId !== 'null' && responsibleId !== '') {
            query = query.eq("id_responsavel", responsibleId);
            console.log('Filtro aplicado - Responsável:', responsibleId);
        }
        if (year && year !== 'null' && year !== '') {
            // Para ciclos, filtrar por ano baseado na data de início
            query = query.gte("data_inicio", `${year}-01-01`);
            query = query.lte("data_inicio", `${year}-12-31`);
            console.log('Filtro aplicado - Ano:', year);
        }

        // Ordenar por ciclo
        query = query.order("ciclo", { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        console.log('Dados de ciclo encontrados:', data?.length || 0);
        if (data && data.length > 0) {
            console.log('Primeiro registro:', data[0]);
        }

        // Buscar informações adicionais do indicador se um indicador específico foi selecionado
        let totalData = null;
        if (indicatorId && indicatorId !== 'null' && indicatorId !== '') {
            const { data: indicatorInfo, error: indicatorError } = await supabase
                .from("vw_desempenho_indicadores_ciclo")
                .select("indicator_type_name, indicator_scope_name")
                .eq("id_indicador", indicatorId)
                .limit(1)
                .single();
            
            if (indicatorError && indicatorError.code !== "PGRST116") {
                console.warn('Aviso ao buscar informações do indicador:', indicatorError);
            } else {
                totalData = indicatorInfo;
                console.log('Informações do indicador:', totalData);
            }
        }

        return { cycleData: data || [], totalData: totalData };
    } catch (error) {
        console.error("Erro ao buscar dados de ciclo do indicador:", error);
        return { cycleData: [], totalData: null };
    }
}

// Função para buscar dados comparativos YoY mensais
async function fetchYoYMonthlyData(indicatorId, departmentId, responsibleId, year) {
    try {
        let query = supabase.from("vw_comparativo_mensal").select("*");

        if (indicatorId) query = query.eq("indicator_id", indicatorId);
        if (departmentId) query = query.eq("department_id", departmentId);
        if (responsibleId) query = query.eq("responsible_id", responsibleId);
        if (year) query = query.eq("ano_atual", parseInt(year));

        query = query.order("mes", { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error("Erro ao buscar dados comparativos mensais YoY:", error);
        return [];
    }
}

// Função para buscar dados comparativos YoY de ciclos
async function fetchYoYCycleData(indicatorId, departmentId, responsibleId, year) {
    try {
        let query = supabase.from("vw_comparativo_ciclos").select("*");

        if (indicatorId) query = query.eq("indicator_id", indicatorId);
        if (departmentId) query = query.eq("department_id", departmentId);
        if (responsibleId) query = query.eq("responsible_id", responsibleId);
        if (year) query = query.eq("ano_atual", parseInt(year));

        query = query.order("cycle", { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error("Erro ao buscar dados comparativos de ciclos YoY:", error);
        return [];
    }
}

async function getAllIndicatorsWithTypes() {
    try {
        const { data, error } = await supabase
            .from("indicators")
            .select(`
                id, 
                name,
                indicator_type:indicator_types(name)
            `)

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Erro ao carregar indicadores com tipos:", error);
        return [];
    }
}


async function loadDepartmentsForFilter() {
    try {
        const { data, error } = await supabase
            .from("departments")
            .select("id, name")
            .order("name", { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Erro ao carregar departamentos para filtro:", error);
        return [];
    }
}

async function loadYearsForFilter() {
    try {
        const [goalsData, resultsData] = await Promise.all([
            supabase
                .from("indicator_goals")
                .select("year")
                .not("year", "is", null),
            supabase
                .from("indicator_results")
                .select("year")
                .not("year", "is", null)
        ]);

        const years = new Set();
        
        if (goalsData.data) {
            goalsData.data.forEach(item => {
                if (item.year) years.add(item.year);
            });
        }
        
        if (resultsData.data) {
            resultsData.data.forEach(item => {
                if (item.year) years.add(item.year);
            });
        }
        
        const sortedYears = Array.from(years).sort((a, b) => a - b);
        return sortedYears;
    } catch (error) {
        console.error("Erro ao carregar anos para filtro:", error);
        return [];
    }
}

function loadSelectedDepartment() {
    try {
        // Primeiro, tentar carregar do localStorage no formato JSON
        const selectedDepartmentData = localStorage.getItem('selectedDepartment');
        if (selectedDepartmentData) {
            const department = JSON.parse(selectedDepartmentData);
            console.log('Departamento selecionado carregado (JSON):', department);
            
            updateDepartmentTitle(department.name);
            applyDepartmentFilter(department.id);
            
            return department;
        }
        
        // Fallback 1: Tentar carregar das chaves individuais do localStorage
        const departmentId = localStorage.getItem('selectedDepartmentId');
        const departmentName = localStorage.getItem('selectedDepartmentName');
        
        if (departmentId && departmentName) {
            const department = {
                id: departmentId,
                name: departmentName
            };
            console.log('Departamento selecionado carregado (chaves individuais):', department);
            
            // Salvar no formato correto para próximas vezes
            localStorage.setItem('selectedDepartment', JSON.stringify(department));
            
            updateDepartmentTitle(department.name);
            applyDepartmentFilter(department.id);
            
            return department;
        }
        
        // Fallback 2: Tentar obter da URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlDepartmentId = urlParams.get('departmentId');
        
        if (urlDepartmentId) {
            console.log('ID do departamento encontrado na URL:', urlDepartmentId);
            
            // Criar objeto básico com ID da URL
            const department = {
                id: urlDepartmentId,
                name: `Departamento ${urlDepartmentId}` // Nome temporário
            };
            
            // Salvar no localStorage para próximas vezes
            localStorage.setItem('selectedDepartment', JSON.stringify(department));
            
            updateDepartmentTitle(department.name);
            applyDepartmentFilter(department.id);
            
            return department;
        }
        
        // Se nenhum método funcionou
        console.log('Nenhum departamento selecionado encontrado');
        updateDepartmentTitle('Departamento não selecionado');
        return null;
        
    } catch (error) {
        console.error('Erro ao carregar departamento selecionado:', error);
        updateDepartmentTitle('Erro ao carregar departamento');
        return null;
    }
}

function updateDepartmentTitle(departmentName) {
    const titleElement = document.getElementById('departmentTitle');
    if (titleElement) {
        titleElement.textContent = departmentName;
        
        titleElement.style.opacity = '0';
        setTimeout(() => {
            titleElement.style.opacity = '1';
        }, 100);
    }
}

function applyDepartmentFilter(departmentId) {
    try {
        console.log('Aplicando filtro de departamento:', departmentId);
        
        const departmentSelect = document.getElementById('filtro-departamento');
        if (departmentSelect) {
            departmentSelect.value = departmentId;
            
            filtrosAtivos.departamento = departmentId;
            
            // Carregar dados automaticamente para o departamento selecionado
            console.log('Carregando dados para o departamento:', departmentId);
            atualizarGraficoComFiltros();
        }
        
    } catch (error) {
        console.error('Erro ao aplicar filtro de departamento:', error);
    }
}

function goBackToDepartments() {
    // Limpar todos os dados do departamento selecionado
    localStorage.removeItem('selectedDepartment');
    localStorage.removeItem('selectedDepartmentId');
    localStorage.removeItem('selectedDepartmentName');
    
    console.log('Dados do departamento selecionado limpos');
    
    window.location.href = 'departamentos.html';
}

// Função para fazer logout completo
function logout() {
    clearUserData();
    window.location.href = '../index.htm';
}

async function loadDepartmentData(departmentId) {
    try {
        console.log('Carregando dados para departamento:', departmentId);
        
        const indicators = await loadIndicatorsByDepartment(departmentId);
        
        const goals = await loadGoalsByDepartment(departmentId);
        const results = await loadResultsByDepartment(departmentId);
        
        updateChartWithDepartmentData(indicators, goals, results);
        
        return { indicators, goals, results };
    } catch (error) {
        console.error('Erro ao carregar dados do departamento:', error);
        showToast('Erro ao carregar dados do departamento', 4000);
        return null;
    }
}

async function loadIndicatorsByDepartment(departmentId) {
    try {
        const { data, error } = await supabase
            .from('indicators')
            .select('*')
            .eq('department_id', departmentId);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar indicadores do departamento:', error);
        return [];
    }
}

async function loadGoalsByDepartment(departmentId) {
    try {
        const { data, error } = await supabase
            .from('indicator_goals')
            .select(`
                *,
                indicator:indicators(name, department_id)
            `)
            .eq('department_id', departmentId);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar metas do departamento:', error);
        return [];
    }
}

async function loadResultsByDepartment(departmentId) {
    try {
        const { data, error } = await supabase
            .from('indicator_results')
            .select(`
                *,
                indicator:indicators(name, department_id)
            `)
            .eq('department_id', departmentId);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar resultados do departamento:', error);
        return [];
    }
}

function updateChartWithDepartmentData(indicators, goals, results) {
    try {
        console.log('Atualizando gráfico com dados do departamento');
        
        initChart();
        
        showToast(`Dados carregados para o departamento selecionado`);
    } catch (error) {
        console.error('Erro ao atualizar gráfico:', error);
    }
}




// ============================================
// ANÁLISE DE CAUSA E CONSEQUÊNCIA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização dos editores de conteúdo
    const causeEditor = new ContentEditor('cause');
    const consequenceEditor = new ContentEditor('consequence');

    // Inicialização dos gerenciadores de anexos
    const causeAttachments = new AttachmentManager('cause');
    const consequenceAttachments = new AttachmentManager('consequence');
});

class ContentEditor {
    constructor(type) {
        this.type = type;
        this.init();
    }

    init() {
        const editBtn = document.getElementById(`edit${this.type.charAt(0).toUpperCase() + this.type.slice(1)}Btn`);
        const editor = document.getElementById(`${this.type}Editor`);
        const saveBtn = document.getElementById(`save${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`);
        const cancelBtn = document.getElementById(`cancel${this.type.charAt(0).toUpperCase() + this.type.slice(1)}Edit`);

        if(editBtn) {
            editBtn.addEventListener('click', () => this.startEdit());
        }
        if(saveBtn) {
            saveBtn.addEventListener('click', () => this.saveContent());
        }
        if(cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelEdit());
        }

        // Toolbar buttons
        if(editor) {
            editor.querySelectorAll('.toolbar-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.executeCommand(btn);
                });
            });
        }
    }

    startEdit() {
        const editor = document.getElementById(`${this.type}Editor`);
        const display = document.getElementById(`${this.type}Display`);
        const editorContent = editor.querySelector('.editor-content');

        if (!display.classList.contains('empty')) {
            editorContent.innerHTML = display.innerHTML;
        }

        display.style.display = 'none';
        editor.style.display = 'block';
        editorContent.focus();
    }

    saveContent() {
        const editor = document.getElementById(`${this.type}Editor`);
        const display = document.getElementById(`${this.type}Display`);
        const editorContent = editor.querySelector('.editor-content');

        const content = editorContent.innerHTML.trim();

        if (content) {
            display.innerHTML = content;
            display.classList.remove('empty');
        } else {
            display.classList.add('empty');
            const emptyContent = this.type === 'cause' 
                ? '<i class="ri-search-line"></i><p>Nenhuma causa identificada. Clique no botão de edição para adicionar.</p>'
                : '<i class="ri-arrow-right-line"></i><p>Nenhuma consequência identificada. Clique no botão de edição para adicionar.</p>';
            display.innerHTML = emptyContent;
        }

        this.cancelEdit();
        showToast(`${this.type === 'cause' ? 'Causas' : 'Consequências'} salvas com sucesso!`, 3000, 'success');
    }

    cancelEdit() {
        const editor = document.getElementById(`${this.type}Editor`);
        const display = document.getElementById(`${this.type}Display`);
        const editorContent = editor.querySelector('.editor-content');

        editor.style.display = 'none';
        display.style.display = 'block';
        editorContent.innerHTML = '';
    }

    executeCommand(btn) {
        const command = btn.dataset.command;
        const value = btn.dataset.value || null;

        if (command === 'hiliteColor') {
            document.execCommand('hiliteColor', false, value);
        } else {
            document.execCommand(command, false, value);
        }

        if (['bold', 'italic', 'underline'].includes(command)) {
            btn.classList.toggle('active');
        }
    }
}

class AttachmentManager {
    constructor(type) {
        this.type = type;
        this.attachments = [];
        this.init();
    }

    init() {
        const addBtn = document.getElementById(`add${this.type.charAt(0).toUpperCase() + this.type.slice(1)}Attachment`);
        if(addBtn) {
            addBtn.addEventListener('click', () => this.addAttachment());
        }
    }

    addAttachment() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                this.processFile(file);
            });
        };
        fileInput.click();
    }

    processFile(file) {
        const attachment = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: this.formatFileSize(file.size),
            type: this.getFileType(file),
            file: file,
            url: URL.createObjectURL(file),
        };

        this.attachments.push(attachment);
        this.renderAttachments();
        
        showToast(`Arquivo "${file.name}" adicionado com sucesso!`, 3000, 'success');
    }

    getFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
            return 'image';
        } else if (['pdf'].includes(extension)) {
            return 'pdf';
        } else if (['doc', 'docx'].includes(extension)) {
            return 'doc';
        } else if (['txt', 'md', 'csv'].includes(extension)) {
            return 'text';
        } else if (['xlsx', 'xls'].includes(extension)) {
            return 'excel';
        } else if (['pptx', 'ppt'].includes(extension)) {
            return 'powerpoint';
        }
        return 'default';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    renderAttachments() {
        const container = document.getElementById(`${this.type}Attachments`);
        
        if (this.attachments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="ri-attachment-line"></i>
                    <p>Nenhum anexo adicionado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.attachments.map(attachment => `
            <div class="attachment-item">
                <div class="attachment-icon ${attachment.type}">
                    <i class="${this.getFileIcon(attachment.type)}"></i>
                </div>
                <div class="attachment-info">
                    <div class="attachment-name" title="${attachment.name}">${attachment.name}</div>
                    <div class="attachment-size">${attachment.size}</div>
                </div>
                <div class="attachment-actions">
                    <button class="btn btn-ghost btn-icon btn-sm" 
                            onclick="event.stopPropagation(); this.closest('.attachment-manager').manager.removeAttachment('${attachment.id}')"
                            title="Remover">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Re-attach manager to the container for dynamic buttons
        container.manager = this;
    }

    getFileIcon(type) {
        const icons = {
            image: 'ri-image-line',
            pdf: 'ri-file-pdf-line',
            doc: 'ri-file-word-line',
            text: 'ri-file-text-line',
            excel: 'ri-file-excel-line',
            powerpoint: 'ri-file-ppt-line',
            default: 'ri-file-line'
        };
        return icons[type] || icons.default;
    }

    removeAttachment(id) {
        const index = this.attachments.findIndex(a => a.id == id);
        if (index > -1) {
            const attachment = this.attachments[index];
            URL.revokeObjectURL(attachment.url);
            this.attachments.splice(index, 1);
            this.renderAttachments();
            showToast(`Arquivo "${attachment.name}" removido!`, 3000, 'info');
        }
    }
}

async function populateActionPlanAssignees() {
    const selectElement = document.getElementById('plan-responsible');
    if (!selectElement) return;

    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;

        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao popular responsáveis do plano de ação:', error);
        showToast('Erro ao carregar responsáveis para o modal de plano de ação.', 4000);
    }
}

async function populateActionPlanDepartments() {
    const selectElement = document.getElementById("plan-department");
    if (!selectElement) return;

    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    try {
        const { data, error } = await supabase
            .from('departments')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;

        data.forEach(department => {
            const option = document.createElement('option');
            option.value = department.id;
            option.textContent = department.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao popular departamentos do plano de ação:', error);
        showToast('Erro ao carregar departamentos para o modal de plano de ação.', 4000);
    }
}

async function populateActionPlanStatuses() {
    const selectElement = document.getElementById("plan-status");
    if (!selectElement) return;

    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    try {
        const { data, error } = await supabase
            .from('action_plan_statuses')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;

        data.forEach(status => {
            const option = document.createElement('option');
            option.value = status.id;
            option.textContent = status.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao popular status do plano de ação:', error);
        showToast('Erro ao carregar status para o modal de plano de ação.', 4000);
    }
}



async function populateActionPlanIndicators() {
    const selectElement = document.getElementById('plan-indicator');
    if (!selectElement) return;

    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    try {
        const indicators = await getAllIndicatorsWithTypes(); // Reutiliza a função existente
        indicators.forEach(indicator => {
            const option = document.createElement('option');
            option.value = indicator.id;
            option.textContent = indicator.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao popular indicadores para o plano de ação:', error);
        showToast('Erro ao carregar indicadores para o modal de plano de ação.', 4000);
    }
}



async function loadActionPlansToKanban() {
    // Aplicar filtros ativos ao carregar planos de ação
    const actionPlans = await loadActionPlansFromSupabase(filtrosAtivos);
    
    // Limpar colunas existentes
    document.getElementById("kanban-atrasado").innerHTML = "";
    document.getElementById("kanban-nao-iniciado").innerHTML = "";
    document.getElementById("kanban-em-progresso").innerHTML = "";
    document.getElementById("kanban-concluido").innerHTML = "";

    // Resetar contadores
    const counts = {
        atrasado: 0,
        'nao-iniciado': 0,
        'em-progresso': 0,
        concluido: 0
    };

    actionPlans.forEach(plan => {
        const card = renderKanbanCard(plan);
        
        // Verificar se o status existe, caso contrário usar valor padrão
        const statusName = plan.status?.name || 'Não iniciado';
        
        // Normalizar: remover acentos, converter para lowercase e substituir espaços por hífens
        let statusKey = statusName
            .normalize('NFD')                    // Decompor caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '')     // Remover marcas diacríticas (acentos)
            .toLowerCase()                        // Converter para minúsculas
            .replace(/ /g, '-');                 // Substituir espaços por hífens
        
        console.log('Status original:', statusName);
        console.log('Status convertido:', statusKey);
        
        // Lógica para determinar se está atrasado
        const endDate = new Date(plan.end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Ignorar a hora para comparação

        if (statusKey !== 'concluido' && endDate < today) {
            statusKey = 'atrasado';
        }

        console.log('Status final:', statusKey);
        console.log('Elemento alvo:', `kanban-${statusKey}`);
        
        const targetElement = document.getElementById(`kanban-${statusKey}`);
        if (targetElement) {
            targetElement.appendChild(card);
            counts[statusKey]++;
        } else {
            console.error(`Elemento não encontrado: kanban-${statusKey}`);
        }
    });

    // Atualizar contadores
    document.getElementById("count-atrasado").textContent = counts.atrasado;
    document.getElementById("count-nao-iniciado").textContent = counts['nao-iniciado'];
    document.getElementById("count-em-progresso").textContent = counts['em-progresso'];
    document.getElementById("count-concluido").textContent = counts.concluido;
}

function renderKanbanCard(plan) {
    const card = document.createElement("div");
    card.classList.add("kanban-card");
    card.setAttribute("data-plan-id", plan.id);

    // Verificar se o status existe, caso contrário usar valor padrão
    const statusName = plan.status?.name || 'Não iniciado';
    
    // Normalizar status: remover acentos, converter para lowercase e substituir espaços por hífens
    const statusClass = statusName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/ /g, '-');
    let statusDisplay = statusName;

    const endDate = new Date(plan.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (statusClass !== 'concluido' && endDate < today) {
        card.classList.add('atrasado');
        statusDisplay = 'Atrasado';
    } else {
        card.classList.add(statusClass);
    }

    card.innerHTML = `
        <div class="card-header">
            <span class="card-status ${statusClass}">${statusDisplay}</span>
            <div class="card-actions">
                <button class="btn-icon edit-plan-btn" data-id="${plan.id}"><i class="ri-edit-line"></i></button>
                <button class="btn-icon delete-plan-btn" data-id="${plan.id}"><i class="ri-delete-bin-line"></i></button>
            </div>
        </div>
        <div class="card-title">${plan.title}</div>
        <div class="card-meta">
            <div class="meta-item"><i class="ri-bar-chart-line"></i> ${plan.indicator?.name || 'Sem indicador'}</div>
            <div class="meta-item"><i class="ri-user-line"></i> ${plan.assignee?.name || 'Sem responsável'}</div>
            <div class="meta-item"><i class="ri-building-line"></i> ${plan.department?.name || 'Sem departamento'}</div>
            <div class="meta-item"><i class="ri-calendar-line"></i> ${new Date(plan.start_date).toLocaleDateString()} - ${new Date(plan.end_date).toLocaleDateString()}</div>
        </div>
    `;

    return card;
}


// Nota: O gerenciamento dos modais (Plano de Ação e Causa/Consequência) 
// foi movido para o arquivo action-plan-modal.js

const periodTypeFilter = document.getElementById("period-type-filter");
const monthFilterGroup = document.getElementById("month-filter-group");
const cycleFilterGroup = document.getElementById("cycle-filter-group");

if (periodTypeFilter) {
    periodTypeFilter.addEventListener("change", () => {
        if (periodTypeFilter.value === "ciclo") {
            monthFilterGroup.style.display = "none";
            cycleFilterGroup.style.display = "block";
        } else {
            monthFilterGroup.style.display = "block";
            cycleFilterGroup.style.display = "none";
        }
    });
}


// Corrigir os IDs dos elementos para corresponder ao HTML
const editCauseBtn = document.getElementById('edit-cause-btn-modal');
const causeEditor = document.getElementById('cause-editor-modal');
const causeToolbar = document.getElementById('cause-toolbar-modal');

const editConsequenceBtn = document.getElementById('edit-consequence-btn-modal');
const consequenceEditor = document.getElementById('consequence-editor-modal');
const consequenceToolbar = document.getElementById('consequence-toolbar-modal');

if (editCauseBtn) {
    editCauseBtn.addEventListener('click', () => {
        const isEditable = causeEditor.getAttribute('contenteditable') === 'true';
        causeEditor.setAttribute('contenteditable', !isEditable);
        causeToolbar.style.display = !isEditable ? 'block' : 'none';
        
        // Atualizar o texto do botão
        const buttonText = editCauseBtn.querySelector('span') || editCauseBtn;
        if (!isEditable) {
            causeEditor.focus();
            if (buttonText.textContent) buttonText.textContent = 'Salvar';
        } else {
            // Salvar o conteúdo quando sair do modo de edição
            saveCauseConsequenceContent('cause', causeEditor.innerHTML);
            if (buttonText.textContent) buttonText.textContent = 'Editar';
        }
    });
}

if (editConsequenceBtn) {
    editConsequenceBtn.addEventListener('click', () => {
        const isEditable = consequenceEditor.getAttribute('contenteditable') === 'true';
        consequenceEditor.setAttribute('contenteditable', !isEditable);
        consequenceToolbar.style.display = !isEditable ? 'block' : 'none';
        
        // Atualizar o texto do botão
        const buttonText = editConsequenceBtn.querySelector('span') || editConsequenceBtn;
        if (!isEditable) {
            consequenceEditor.focus();
            if (buttonText.textContent) buttonText.textContent = 'Salvar';
        } else {
            // Salvar o conteúdo quando sair do modo de edição
            saveCauseConsequenceContent('consequence', consequenceEditor.innerHTML);
            if (buttonText.textContent) buttonText.textContent = 'Editar';
        }
    });
}

// Função para salvar conteúdo de causa e consequência
async function saveCauseConsequenceContent(type, content) {
    try {
        const departmentId = localStorage.getItem('selectedDepartmentId');
        const indicatorId = document.getElementById('indicator-select')?.value || localStorage.getItem('selectedIndicatorId');
        
        if (!departmentId) {
            showToast('Departamento não selecionado', 4000);
            return;
        }

        const periodType = document.getElementById('period-type-filter')?.value || 'mensal';
        const month = document.getElementById('month-filter')?.value;
        const cycle = document.getElementById('cycle-filter')?.value;
        const year = document.getElementById('year-filter')?.value || new Date().getFullYear();

        // Verificar se já existe um registro
        let query = supabase
            .from('cause_consequence')
            .select('*')
            .eq('department_id', departmentId)
            .eq('period_type', periodType)
            .eq('year', year)
            .eq('type', type);

        if (indicatorId) {
            query = query.eq('indicator_id', indicatorId);
        }

        if (periodType === 'mensal' && month) {
            query = query.eq('month', parseInt(month));
        } else if (periodType === 'ciclo' && cycle) {
            query = query.eq('cycle', cycle);
        }

        const { data: existingData, error: selectError } = await query;

        if (selectError) throw selectError;

        const recordData = {
            department_id: departmentId,
            indicator_id: indicatorId,
            period_type: periodType,
            month: periodType === 'mensal' ? parseInt(month) : null,
            cycle: periodType === 'ciclo' ? cycle : null,
            year: parseInt(year),
            type: type,
            content: content,
            updated_at: new Date().toISOString()
        };

        if (existingData && existingData.length > 0) {
            // Atualizar registro existente
            const { error: updateError } = await supabase
                .from('cause_consequence')
                .update(recordData)
                .eq('id', existingData[0].id);

            if (updateError) throw updateError;
        } else {
            // Criar novo registro
            recordData.created_at = new Date().toISOString();
            const { error: insertError } = await supabase
                .from('cause_consequence')
                .insert([recordData]);

            if (insertError) throw insertError;
        }

        showToast(`${type === 'cause' ? 'Causa' : 'Consequência'} salva com sucesso!`, 3000);
    } catch (error) {
        console.error('Erro ao salvar conteúdo:', error);
        showToast('Erro ao salvar conteúdo', 4000);
    }
}

// Add event listeners for toolbar buttons
document.querySelectorAll('.toolbar-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const command = button.getAttribute('data-command');
        const value = button.getAttribute('data-value') || null;
        document.execCommand(command, false, value);
    });
});




// Função para carregar conteúdo existente de causa e consequência
async function loadExistingCauseConsequenceContent() {
    try {
        const departmentId = localStorage.getItem('selectedDepartmentId');
        const indicatorId = document.getElementById('indicator-select')?.value || localStorage.getItem('selectedIndicatorId');
        
        if (!departmentId) return;

        const periodType = document.getElementById('period-type-filter')?.value || 'mensal';
        const month = document.getElementById('month-filter')?.value;
        const cycle = document.getElementById('cycle-filter')?.value;
        const year = document.getElementById('year-filter')?.value || new Date().getFullYear();

        let query = supabase
            .from('cause_consequence')
            .select('*')
            .eq('department_id', departmentId)
            .eq('period_type', periodType)
            .eq('year', year);

        if (indicatorId) {
            query = query.eq('indicator_id', indicatorId);
        }

        if (periodType === 'mensal' && month) {
            query = query.eq('month', parseInt(month));
        } else if (periodType === 'ciclo' && cycle) {
            query = query.eq('cycle', cycle);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Carregar conteúdo nos editores
        const causeEditor = document.getElementById('cause-editor-modal');
        const consequenceEditor = document.getElementById('consequence-editor-modal');

        if (data && data.length > 0) {
            const causeData = data.find(item => item.type === 'cause');
            const consequenceData = data.find(item => item.type === 'consequence');

            if (causeData && causeEditor) {
                causeEditor.innerHTML = causeData.content || '';
            }

            if (consequenceData && consequenceEditor) {
                consequenceEditor.innerHTML = consequenceData.content || '';
            }
        } else {
            // Limpar editores se não houver dados
            if (causeEditor) causeEditor.innerHTML = '';
            if (consequenceEditor) consequenceEditor.innerHTML = '';
        }

    } catch (error) {
        console.error('Erro ao carregar conteúdo existente:', error);
    }
}

// Adicionar event listeners para carregar conteúdo quando os filtros mudarem
document.getElementById('period-type-filter')?.addEventListener('change', loadExistingCauseConsequenceContent);
document.getElementById('month-filter')?.addEventListener('change', loadExistingCauseConsequenceContent);
document.getElementById('cycle-filter')?.addEventListener('change', loadExistingCauseConsequenceContent);
document.getElementById('year-filter')?.addEventListener('change', loadExistingCauseConsequenceContent);
document.getElementById('indicator-select')?.addEventListener('change', loadExistingCauseConsequenceContent);

const causeConsequenceForm = document.getElementById("cause-consequence-form");

if (causeConsequenceForm) {
    causeConsequenceForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const periodType = document.getElementById("period-type-filter").value;
        const month = document.getElementById("month-filter").value;
        const cycle = document.getElementById("cycle-filter").value;
        const year = document.getElementById("year-filter").value;

        const causeContent = document.getElementById("cause-editor-modal").innerHTML;
        const consequenceContent = document.getElementById("consequence-editor-modal").innerHTML;

        // Coletar anexos
        const attachments = causeConsequenceAttachments.getAttachments();

        // Exemplo de como você pode estruturar os dados para salvar
        const dataToSave = {
            periodType,
            month: periodType === "mes" ? month : null,
            cycle: periodType === "ciclo" ? cycle : null,
            year,
            cause: causeContent,
            consequence: consequenceContent,
            attachments
        };

        console.log("Dados a serem salvos:", dataToSave);

        // Chamar a função de salvamento no Supabase (se aplicável)
        // await saveCauseEffectToSupabase("cause", causeContent, attachments);
        // await saveCauseEffectToSupabase("consequence", consequenceContent, attachments);

        // Fechar o modal após salvar
        const causeConsequenceModal = document.getElementById("cause-consequence-modal");
        if (causeConsequenceModal) {
            causeConsequenceModal.classList.remove("show");
            document.body.style.overflow = "";
        }

        showToast("Causa e Consequência salvas com sucesso!", 3000);
    });
}



// Nota: O botão de cancelar é gerenciado pelo action-plan-modal.js



// Classe para gerenciar anexos no modal de causa e consequência
class CauseConsequenceAttachmentManager {
    constructor() {
        this.attachments = [];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/bmp',
            'image/svg+xml',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
        this.init();
    }

    init() {
        const addBtn = document.getElementById('add-attachment-btn');
        const fileInput = document.getElementById('attachment-input');

        if (addBtn && fileInput) {
            addBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
                e.target.value = ''; // Reset input
            });
        }

        this.updateDisplay();
    }

    handleFileSelection(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.addAttachment(file);
            }
        });
    }

    validateFile(file) {
        // Verificar tamanho
        if (file.size > this.maxFileSize) {
            showToast(`Arquivo "${file.name}" é muito grande. Tamanho máximo: 10MB`, 4000, 'error');
            return false;
        }

        // Verificar tipo
        if (!this.allowedTypes.includes(file.type)) {
            showToast(`Tipo de arquivo "${file.name}" não é permitido`, 4000, 'error');
            return false;
        }

        // Verificar se já existe
        if (this.attachments.some(att => att.name === file.name && att.size === file.size)) {
            showToast(`Arquivo "${file.name}" já foi adicionado`, 3000, 'warning');
            return false;
        }

        return true;
    }

    addAttachment(file) {
        const attachment = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: this.formatFileSize(file.size),
            type: this.getFileExtension(file.name),
            file: file,
            url: URL.createObjectURL(file)
        };

        this.attachments.push(attachment);
        this.updateDisplay();
        showToast(`Arquivo "${file.name}" adicionado com sucesso!`, 3000, 'success');
    }

    removeAttachment(id) {
        const index = this.attachments.findIndex(att => att.id === id);
        if (index > -1) {
            const attachment = this.attachments[index];
            URL.revokeObjectURL(attachment.url);
            this.attachments.splice(index, 1);
            this.updateDisplay();
            showToast(`Arquivo "${attachment.name}" removido!`, 3000, 'info');
        }
    }

    viewAttachment(id) {
        const attachment = this.attachments.find(att => att.id === id);
        if (attachment) {
            // Para imagens, abrir em nova aba
            if (attachment.type.match(/jpg|jpeg|png|gif|bmp|svg/i)) {
                window.open(attachment.url, '_blank');
            } else {
                // Para outros tipos, fazer download
                const link = document.createElement('a');
                link.href = attachment.url;
                link.download = attachment.name;
                link.click();
            }
        }
    }

    updateDisplay() {
        const attachmentsList = document.getElementById('attachments-list');
        const attachmentPlaceholder = document.getElementById('attachment-placeholder');
        const attachmentCount = document.getElementById('attachment-count');

        if (!attachmentsList || !attachmentPlaceholder || !attachmentCount) return;

        // Atualizar contador
        attachmentCount.textContent = `(${this.attachments.length})`;

        // Mostrar/ocultar placeholder
        if (this.attachments.length === 0) {
            attachmentPlaceholder.style.display = 'flex';
            attachmentsList.style.display = 'none';
        } else {
            attachmentPlaceholder.style.display = 'none';
            attachmentsList.style.display = 'grid';
        }

        // Renderizar anexos
        attachmentsList.innerHTML = this.attachments.map(attachment => `
            <div class="attachment-item" data-id="${attachment.id}">
                <div class="attachment-icon ${attachment.type}">
                    <i class="${this.getFileIcon(attachment.type)}"></i>
                </div>
                <div class="attachment-details">
                    <div class="attachment-name" title="${attachment.name}">${attachment.name}</div>
                    <div class="attachment-size">${attachment.size}</div>
                </div>
                <div class="attachment-actions">
                    <button class="attachment-action-btn view-attachment-btn" 
                            onclick="causeConsequenceAttachments.viewAttachment(${attachment.id})"
                            title="Visualizar/Baixar">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button class="attachment-action-btn remove-attachment-btn" 
                            onclick="causeConsequenceAttachments.removeAttachment(${attachment.id})"
                            title="Remover">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFileIcon(extension) {
        const icons = {
            pdf: 'ri-file-pdf-line',
            doc: 'ri-file-word-line',
            docx: 'ri-file-word-line',
            xls: 'ri-file-excel-line',
            xlsx: 'ri-file-excel-line',
            ppt: 'ri-slideshow-line',
            pptx: 'ri-slideshow-line',
            jpg: 'ri-image-line',
            jpeg: 'ri-image-line',
            png: 'ri-image-line',
            gif: 'ri-image-line',
            bmp: 'ri-image-line',
            svg: 'ri-image-line',
            txt: 'ri-file-text-line',
            zip: 'ri-file-zip-line',
            rar: 'ri-file-zip-line',
            default: 'ri-file-line'
        };
        return icons[extension.toLowerCase()] || icons.default;
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getAttachments() {
        return this.attachments.map(att => ({
            id: att.id,
            name: att.name,
            size: att.size,
            type: att.type,
            file: att.file
        }));
    }

    clearAttachments() {
        this.attachments.forEach(att => {
            URL.revokeObjectURL(att.url);
        });
        this.attachments = [];
        this.updateDisplay();
    }

    loadAttachments(attachments) {
        this.clearAttachments();
        // Implementar carregamento de anexos salvos se necessário
        this.updateDisplay();
    }
}

// Instanciar o gerenciador de anexos para causa e consequência
let causeConsequenceAttachments;

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que todos os elementos estejam prontos
    setTimeout(() => {
        causeConsequenceAttachments = new CauseConsequenceAttachmentManager();
    }, 100);
});

// Função para limpar anexos quando o modal for fechado
function clearCauseConsequenceAttachments() {
    if (causeConsequenceAttachments) {
        causeConsequenceAttachments.clearAttachments();
    }
}

// Adicionar event listener para limpar anexos quando o modal for fechado
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('cause-consequence-modal');
    const closeBtn = document.getElementById('close-cause-consequence-modal');
    const cancelBtn = document.getElementById('cancel-cause-consequence');

    if (closeBtn) {
        closeBtn.addEventListener('click', clearCauseConsequenceAttachments);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', clearCauseConsequenceAttachments);
    }

    // Limpar anexos quando clicar fora do modal
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                clearCauseConsequenceAttachments();
            }
        });
    }
});


// ============================================
// MODAL DE DETALHES DO PLANO DE AÇÃO
// ============================================

// Variáveis globais para o modal de detalhes
const planDetailsModal = document.getElementById('plan-details-modal');
const closePlanDetailsModal = document.getElementById('close-plan-details-modal');
const closePlanDetailsBtn = document.getElementById('close-plan-details-btn');

// Event listeners para fechar o modal
if (closePlanDetailsModal) {
    closePlanDetailsModal.addEventListener('click', closePlanDetailsModalHandler);
}

if (closePlanDetailsBtn) {
    closePlanDetailsBtn.addEventListener('click', closePlanDetailsModalHandler);
}

// Fechar modal ao clicar fora dele
if (planDetailsModal) {
    planDetailsModal.addEventListener('click', function(e) {
        if (e.target === planDetailsModal) {
            closePlanDetailsModalHandler();
        }
    });
}

// Função para fechar o modal de detalhes
function closePlanDetailsModalHandler() {
    if (planDetailsModal) {
        planDetailsModal.classList.remove('show');
    }
}

// Função para abrir o modal de detalhes com os dados do plano
async function openPlanDetailsModal(planId) {
    try {
        // Buscar dados completos do plano
        const planData = await getPlanDetailsFromSupabase(planId);
        
        if (!planData) {
            showToast('Erro ao carregar detalhes do plano', 4000);
            return;
        }

        // Preencher informações básicas
        populatePlanBasicInfo(planData);
        
        // Carregar e exibir tarefas
        await loadPlanTasks(planId);
        
        // Carregar e exibir anexos
        await loadPlanAttachments(planId);
        
        // Mostrar o modal
        planDetailsModal.classList.add('show');
        
    } catch (error) {
        console.error('Erro ao abrir modal de detalhes:', error);
        showToast('Erro ao carregar detalhes do plano', 4000);
    }
}

// Função para preencher informações básicas do plano
function populatePlanBasicInfo(planData) {
    // Título
    const titleElement = document.getElementById('plan-details-title');
    if (titleElement) {
        titleElement.textContent = planData.title || 'Sem título';
    }
    
    // Status
    const statusElement = document.getElementById('plan-details-status');
    if (statusElement) {
        const statusName = planData.status?.name || 'Não iniciado';
        statusElement.textContent = statusName;
        
        // Remover classes de status anteriores
        statusElement.className = 'plan-status-badge';
        
        // Adicionar classe baseada no status
        const statusClass = statusName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/ /g, '-');
        
        // Verificar se está atrasado
        const endDate = new Date(planData.end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (statusClass !== 'concluido' && endDate < today) {
            statusElement.classList.add('atrasado');
            statusElement.textContent = 'Atrasado';
        } else {
            statusElement.classList.add(statusClass);
        }
    }
    
    // Período
    const periodElement = document.getElementById('plan-details-period');
    if (periodElement) {
        const startDate = new Date(planData.start_date).toLocaleDateString('pt-BR');
        const endDate = new Date(planData.end_date).toLocaleDateString('pt-BR');
        periodElement.textContent = `${startDate} - ${endDate}`;
    }
    
    // Responsável
    const assigneeElement = document.getElementById('plan-details-assignee');
    if (assigneeElement) {
        assigneeElement.textContent = planData.assignee?.name || 'Sem responsável';
    }
    
    // Departamento
    const departmentElement = document.getElementById('plan-details-department');
    if (departmentElement) {
        departmentElement.textContent = planData.department?.name || 'Sem departamento';
    }
    
    // Indicador
    const indicatorElement = document.getElementById('plan-details-indicator');
    if (indicatorElement) {
        indicatorElement.textContent = planData.indicator?.name || 'Sem indicador';
    }
    
    // Descrição
    const descriptionElement = document.getElementById('plan-details-description');
    if (descriptionElement) {
        descriptionElement.textContent = planData.description || 'Sem descrição';
    }
}

// Função para carregar tarefas do plano
async function loadPlanTasks(planId) {
    try {
        const tasks = await getPlanTasksFromSupabase(planId);
        const tasksContainer = document.getElementById('plan-details-tasks');
        const progressText = document.getElementById('tasks-progress-text');
        const progressFill = document.getElementById('tasks-progress-fill');
        
        if (!tasksContainer) return;
        
        // Limpar container
        tasksContainer.innerHTML = '';
        
        if (!tasks || tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="no-tasks-message">
                    <i class="ri-task-line"></i>
                    <p>Nenhuma tarefa cadastrada</p>
                </div>
            `;
            
            if (progressText) progressText.textContent = '0 de 0 concluídas';
            if (progressFill) progressFill.style.width = '0%';
            return;
        }
        
        // Calcular progresso
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        // Atualizar indicadores de progresso
        if (progressText) {
            progressText.textContent = `${completedTasks} de ${totalTasks} concluídas`;
        }
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        // Renderizar tarefas
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });
        
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        const tasksContainer = document.getElementById('plan-details-tasks');
        if (tasksContainer) {
            tasksContainer.innerHTML = `
                <div class="no-tasks-message">
                    <i class="ri-error-warning-line"></i>
                    <p>Erro ao carregar tarefas</p>
                </div>
            `;
        }
    }
}

// Função para criar elemento de tarefa
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item-details';
    
    taskDiv.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'completed' : ''}" 
             data-task-id="${task.id}" 
             onclick="toggleTaskCompletion('${task.id}', ${!task.completed})">
        </div>
        <div class="task-text ${task.completed ? 'completed' : ''}">
            ${task.description}
        </div>
    `;
    
    return taskDiv;
}

// Função para alternar conclusão da tarefa
async function toggleTaskCompletion(taskId, completed) {
    try {
        const success = await updateTaskCompletionInSupabase(taskId, completed);
        
        if (success) {
            // Atualizar UI
            const checkbox = document.querySelector(`[data-task-id="${taskId}"]`);
            const taskText = checkbox?.nextElementSibling;
            
            if (checkbox && taskText) {
                if (completed) {
                    checkbox.classList.add('completed');
                    taskText.classList.add('completed');
                } else {
                    checkbox.classList.remove('completed');
                    taskText.classList.remove('completed');
                }
            }
            
            // Recalcular progresso
            await updateTasksProgress();
            
            showToast('Tarefa atualizada com sucesso', 3000);
        } else {
            showToast('Erro ao atualizar tarefa', 4000);
        }
    } catch (error) {
        console.error('Erro ao alternar conclusão da tarefa:', error);
        showToast('Erro ao atualizar tarefa', 4000);
    }
}

// Função para atualizar progresso das tarefas
async function updateTasksProgress() {
    const taskCheckboxes = document.querySelectorAll('.task-checkbox');
    const completedTasks = document.querySelectorAll('.task-checkbox.completed').length;
    const totalTasks = taskCheckboxes.length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const progressText = document.getElementById('tasks-progress-text');
    const progressFill = document.getElementById('tasks-progress-fill');
    
    if (progressText) {
        progressText.textContent = `${completedTasks} de ${totalTasks} concluídas`;
    }
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
}

// Função para carregar anexos do plano
async function loadPlanAttachments(planId) {
    try {
        const attachments = await getPlanAttachmentsFromSupabase(planId);
        const attachmentsContainer = document.getElementById('plan-details-attachments');
        const attachmentsSection = document.getElementById('plan-details-attachments-section');
        
        if (!attachmentsContainer || !attachmentsSection) return;
        
        // Limpar container
        attachmentsContainer.innerHTML = '';
        
        if (!attachments || attachments.length === 0) {
            attachmentsSection.style.display = 'none';
            return;
        }
        
        // Mostrar seção de anexos
        attachmentsSection.style.display = 'block';
        
        // Renderizar anexos
        attachments.forEach(attachment => {
            const attachmentElement = createAttachmentElement(attachment);
            attachmentsContainer.appendChild(attachmentElement);
        });
        
    } catch (error) {
        console.error('Erro ao carregar anexos:', error);
        const attachmentsSection = document.getElementById('plan-details-attachments-section');
        if (attachmentsSection) {
            attachmentsSection.style.display = 'none';
        }
    }
}

// Função para criar elemento de anexo
function createAttachmentElement(attachment) {
    const attachmentDiv = document.createElement('div');
    attachmentDiv.className = 'attachment-item-details';
    attachmentDiv.onclick = () => window.open(attachment.file_url, '_blank');
    
    // Determinar ícone baseado na extensão do arquivo
    const extension = attachment.file_name.split('.').pop().toLowerCase();
    let iconClass = 'ri-file-line';
    
    if (['pdf'].includes(extension)) {
        iconClass = 'ri-file-pdf-line';
    } else if (['doc', 'docx'].includes(extension)) {
        iconClass = 'ri-file-word-line';
    } else if (['xls', 'xlsx'].includes(extension)) {
        iconClass = 'ri-file-excel-line';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
        iconClass = 'ri-image-line';
    } else if (['zip', 'rar'].includes(extension)) {
        iconClass = 'ri-file-zip-line';
    }
    
    attachmentDiv.innerHTML = `
        <div class="attachment-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="attachment-info">
            <div class="attachment-name">${attachment.file_name}</div>
            <div class="attachment-size">Clique para abrir</div>
        </div>
    `;
    
    return attachmentDiv;
}

// Modificar a função renderKanbanCard para adicionar event listener de clique
function addClickEventToKanbanCards() {
    // Adicionar event listener para todos os cards do kanban
    document.addEventListener('click', function(e) {
        const kanbanCard = e.target.closest('.kanban-card');
        
        if (kanbanCard && !e.target.closest('.card-actions')) {
            const planId = kanbanCard.getAttribute('data-plan-id');
            if (planId) {
                openPlanDetailsModal(planId);
            }
        }
    });
}

// Inicializar event listeners quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    addClickEventToKanbanCards();
});

// ============================================
// FUNCIONALIDADE DE EDIÇÃO DE PLANOS
// ============================================

// Função para abrir modal de edição de plano
async function openEditPlanModal(planId) {
    try {
        // Buscar dados completos do plano
        const planData = await getPlanDetailsFromSupabase(planId);
        
        if (!planData) {
            showToast('Erro ao carregar dados do plano', 4000);
            return;
        }

        // Configurar modal para modo edição
        setupModalForEdit();
        
        // Preencher campos com dados existentes
        await populateEditForm(planData);
        
        // Carregar opções dos selects
        await loadEditFormOptions();
        
        // Carregar tarefas e anexos existentes
        await loadExistingTasks(planId);
        await loadExistingAttachments(planId);
        
        // Mostrar o modal
        const newPlanPopup = document.getElementById('new-plan-popup');
        if (newPlanPopup) {
            newPlanPopup.classList.add('show');
        }
        
    } catch (error) {
        console.error('Erro ao abrir modal de edição:', error);
        showToast('Erro ao carregar dados para edição', 4000);
    }
}

// Função para configurar modal para modo edição
function setupModalForEdit() {
    const modalTitle = document.getElementById('plan-modal-text');
    const modalIcon = document.getElementById('plan-modal-icon');
    const submitBtn = document.getElementById('submit-plan-btn');
    
    if (modalTitle) {
        modalTitle.textContent = 'Editar Plano de Ação';
    }
    
    if (modalIcon) {
        modalIcon.className = 'ri-edit-line';
    }
    
    if (submitBtn) {
        submitBtn.textContent = 'Atualizar';
    }
}

// Função para configurar modal para modo criação
function setupModalForCreate() {
    const modalTitle = document.getElementById('plan-modal-text');
    const modalIcon = document.getElementById('plan-modal-icon');
    const submitBtn = document.getElementById('submit-plan-btn');
    
    if (modalTitle) {
        modalTitle.textContent = 'Novo Plano de Ação';
    }
    
    if (modalIcon) {
        modalIcon.className = 'ri-add-line';
    }
    
    if (submitBtn) {
        submitBtn.textContent = 'Salvar';
    }
}

// Função para preencher formulário com dados existentes
async function populateEditForm(planData) {
    // Preencher campo oculto com ID
    const planIdField = document.getElementById('plan-id');
    if (planIdField) {
        planIdField.value = planData.id;
    }
    
    // Preencher campos básicos
    const titleField = document.getElementById('plan-title');
    if (titleField) {
        titleField.value = planData.title || '';
    }
    
    const descriptionField = document.getElementById('plan-description');
    if (descriptionField) {
        descriptionField.value = planData.description || '';
    }
    
    const startDateField = document.getElementById('plan-start-date');
    if (startDateField) {
        startDateField.value = planData.start_date || '';
    }
    
    const endDateField = document.getElementById('plan-end-date');
    if (endDateField) {
        endDateField.value = planData.end_date || '';
    }
    
    // Aguardar carregamento das opções antes de selecionar
    setTimeout(() => {
        // Selecionar responsável
        const responsibleField = document.getElementById('plan-responsible');
        if (responsibleField && planData.assignee_id) {
            responsibleField.value = planData.assignee_id;
        }
        
        // Selecionar departamento
        const departmentField = document.getElementById('plan-department');
        if (departmentField && planData.department_id) {
            departmentField.value = planData.department_id;
        }
        
        // Selecionar status
        const statusField = document.getElementById('plan-status');
        if (statusField && planData.status_id) {
            statusField.value = planData.status_id;
        }
        
        // Selecionar indicador
        const indicatorField = document.getElementById('plan-indicator');
        if (indicatorField && planData.indicator_id) {
            indicatorField.value = planData.indicator_id;
        }
    }, 500);
}

// Função para carregar opções dos selects no modo edição
async function loadEditFormOptions() {
    await Promise.all([
        populateActionPlanAssignees(),
        populateActionPlanDepartments(),
        populateActionPlanStatuses(),
        populateActionPlanIndicators()
    ]);
}

// Função para carregar tarefas existentes no formulário de edição
async function loadExistingTasks(planId) {
    try {
        console.log('Carregando tarefas para o plano:', planId);
        const tasks = await getPlanTasksFromSupabase(planId);
        console.log('Tarefas carregadas:', tasks);
        
        const tasksList = document.getElementById('tasks-list');
        
        if (!tasksList) {
            console.error('Elemento tasks-list não encontrado');
            return;
        }
        
        // Limpar lista existente
        tasksList.innerHTML = '';
        
        if (tasks && tasks.length > 0) {
            console.log('Adicionando', tasks.length, 'tarefas ao formulário');
            tasks.forEach((task, index) => {
                console.log(`Adicionando tarefa ${index + 1}:`, task);
                addTaskToEditForm(task.description, task.id, task.completed);
            });
        } else {
            console.log('Nenhuma tarefa encontrada para este plano');
        }
        
    } catch (error) {
        console.error('Erro ao carregar tarefas existentes:', error);
    }
}

// Função para carregar anexos existentes no formulário de edição
async function loadExistingAttachments(planId) {
    try {
        const attachments = await getPlanAttachmentsFromSupabase(planId);
        const attachmentsList = document.getElementById('plan-attachments-list');
        
        if (!attachmentsList) return;
        
        // Limpar lista existente
        attachmentsList.innerHTML = '';
        
        if (attachments && attachments.length > 0) {
            attachments.forEach(attachment => {
                addAttachmentToEditForm(attachment.file_name, attachment.file_url, attachment.id);
            });
        }
        
    } catch (error) {
        console.error('Erro ao carregar anexos existentes:', error);
    }
}

// Função para adicionar tarefa ao formulário de edição
function addTaskToEditForm(description, taskId = null, completed = false) {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;
    
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.innerHTML = `
        <div class="task-content">
            <input type="checkbox" class="task-checkbox" ${completed ? 'checked' : ''}>
            <input type="text" class="task-input" value="${description}" placeholder="Descrição da tarefa">
            <input type="hidden" class="task-id" value="${taskId || ''}">
        </div>
        <button type="button" class="remove-task-btn" onclick="removeTaskFromForm(this)">
            <i class="ri-delete-bin-line"></i>
        </button>
    `;
    
    tasksList.appendChild(taskDiv);
}

// Função para adicionar anexo ao formulário de edição
function addAttachmentToEditForm(fileName, fileUrl, attachmentId = null) {
    const attachmentsList = document.getElementById('plan-attachments-list');
    if (!attachmentsList) return;
    
    const attachmentDiv = document.createElement('div');
    attachmentDiv.className = 'attachment-item';
    attachmentDiv.innerHTML = `
        <div class="attachment-info">
            <i class="ri-file-line"></i>
            <span class="attachment-name">${fileName}</span>
            <input type="hidden" class="attachment-id" value="${attachmentId || ''}">
            <input type="hidden" class="attachment-url" value="${fileUrl}">
        </div>
        <button type="button" class="remove-attachment-btn" onclick="removeAttachmentFromForm(this)">
            <i class="ri-delete-bin-line"></i>
        </button>
    `;
    
    attachmentsList.appendChild(attachmentDiv);
}

// Função para remover tarefa do formulário
function removeTaskFromForm(button) {
    const taskItem = button.closest('.task-item');
    if (taskItem) {
        taskItem.remove();
    }
}

// Função para remover anexo do formulário
function removeAttachmentFromForm(button) {
    const attachmentItem = button.closest('.attachment-item');
    if (attachmentItem) {
        attachmentItem.remove();
    }
}

// Modificar o event listener do botão "Novo Plano" para configurar modo criação
document.addEventListener('DOMContentLoaded', function() {
    const newPlanBtn = document.getElementById('new-plan-btn');
    if (newPlanBtn) {
        newPlanBtn.addEventListener('click', function() {
            setupModalForCreate();
            
            // Limpar formulário
            const form = document.getElementById('new-plan-form');
            if (form) {
                form.reset();
            }
            
            // Limpar ID oculto
            const planIdField = document.getElementById('plan-id');
            if (planIdField) {
                planIdField.value = '';
            }
            
            // Limpar listas de tarefas e anexos
            const tasksList = document.getElementById('tasks-list');
            if (tasksList) {
                tasksList.innerHTML = '';
            }
            
            const attachmentsList = document.getElementById('plan-attachments-list');
            if (attachmentsList) {
                attachmentsList.innerHTML = '';
            }
        });
    }
    
    // Adicionar event listeners para botões de edição nos cards do kanban
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-plan-btn')) {
            e.stopPropagation(); // Evitar abrir o modal de detalhes
            const planId = e.target.closest('.edit-plan-btn').getAttribute('data-id');
            if (planId) {
                openEditPlanModal(planId);
            }
        }
        
        // Event listener para botão de edição no modal de detalhes
        if (e.target.closest('#edit-plan-details-btn')) {
            const planDetailsModal = document.getElementById('plan-details-modal');
            if (planDetailsModal && planDetailsModal.classList.contains('show')) {
                // Buscar o ID do plano atual (pode ser armazenado como atributo do modal)
                const planId = planDetailsModal.getAttribute('data-current-plan-id');
                if (planId) {
                    openEditPlanModal(planId);
                }
            }
        }
    });
});

// Modificar a função openPlanDetailsModal para armazenar o ID do plano
const originalOpenPlanDetailsModal = window.openPlanDetailsModal;
window.openPlanDetailsModal = async function(planId) {
    const planDetailsModal = document.getElementById('plan-details-modal');
    if (planDetailsModal) {
        planDetailsModal.setAttribute('data-current-plan-id', planId);
    }
    
    if (originalOpenPlanDetailsModal) {
        return await originalOpenPlanDetailsModal(planId);
    }
};

// ============================================
// GESTÃO DE TAREFAS E ANEXOS NO FORMULÁRIO
// ============================================

// Função para adicionar nova tarefa ao formulário
function addNewTaskToForm() {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;
    
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.innerHTML = `
        <div class="task-content">
            <input type="checkbox" class="task-checkbox">
            <input type="text" class="task-input" placeholder="Descrição da tarefa" required>
            <input type="hidden" class="task-id" value="">
        </div>
        <button type="button" class="remove-task-btn" onclick="removeTaskFromForm(this)">
            <i class="ri-delete-bin-line"></i>
        </button>
    `;
    
    tasksList.appendChild(taskDiv);
    
    // Focar no input da nova tarefa
    const taskInput = taskDiv.querySelector('.task-input');
    if (taskInput) {
        taskInput.focus();
    }
}

// Função para coletar dados das tarefas do formulário
function collectFormTasks() {
    const taskItems = document.querySelectorAll('.task-item');
    const tasks = [];
    
    taskItems.forEach(item => {
        const descriptionInput = item.querySelector('.task-input');
        const checkboxInput = item.querySelector('.task-checkbox');
        const idInput = item.querySelector('.task-id');
        
        if (descriptionInput && descriptionInput.value.trim()) {
            tasks.push({
                id: idInput ? idInput.value : '',
                description: descriptionInput.value.trim(),
                completed: checkboxInput ? checkboxInput.checked : false
            });
        }
    });
    
    return tasks;
}

// Função para coletar dados dos anexos do formulário
function collectFormAttachments() {
    const attachmentItems = document.querySelectorAll('.attachment-item');
    const attachments = [];
    
    attachmentItems.forEach(item => {
        const nameElement = item.querySelector('.attachment-name');
        const idInput = item.querySelector('.attachment-id');
        const urlInput = item.querySelector('.attachment-url');
        
        if (nameElement) {
            attachments.push({
                id: idInput ? idInput.value : '',
                fileName: nameElement.textContent,
                fileUrl: urlInput ? urlInput.value : ''
            });
        }
    });
    
    return attachments;
}

// Modificar a função de submit para incluir sincronização de tarefas e anexos
document.addEventListener('DOMContentLoaded', function() {
    const newPlanForm = document.getElementById('new-plan-form');
    if (newPlanForm) {
        // Remover event listener existente e adicionar novo
        const newForm = newPlanForm.cloneNode(true);
        newPlanForm.parentNode.replaceChild(newForm, newPlanForm);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const planId = document.getElementById('plan-id').value;
            const title = document.getElementById('plan-title').value?.trim();
            const description = document.getElementById('plan-description').value?.trim();
            const assigneeId = document.getElementById('plan-responsible').value;
            const departmentId = document.getElementById('plan-department').value;
            const status = document.getElementById('plan-status').value;
            const startDate = document.getElementById('plan-start-date').value;
            const endDate = document.getElementById('plan-end-date').value;
            const indicatorId = document.getElementById('plan-indicator').value || null;

            // Validação de campos obrigatórios
            if (!title) {
                showToast('Título é obrigatório', 3000, 'error');
                return;
            }
            
            if (!startDate) {
                showToast('Data de início é obrigatória', 3000, 'error');
                return;
            }
            
            if (!endDate) {
                showToast('Data final é obrigatória', 3000, 'error');
                return;
            }
            
            if (!assigneeId) {
                showToast('Responsável é obrigatório', 3000, 'error');
                return;
            }
            
            if (!departmentId) {
                showToast('Departamento é obrigatório', 3000, 'error');
                return;
            }
            
            if (!status) {
                showToast('Status é obrigatório', 3000, 'error');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                showToast('Data de início deve ser anterior à data final', 3000, 'error');
                return;
            }

            const planData = {
                title,
                description: description || '',
                assignee_id: assigneeId,
                department_id: departmentId,
                status,
                start_date: startDate,
                end_date: endDate,
                indicator_id: indicatorId
            };
            
            console.log('Dados do plano a serem salvos:', planData);

            let result;
            let successMessage;
            
            try {
                if (planId) {
                    // Modo edição
                    result = await updateActionPlanInSupabase(planId, planData);
                    successMessage = "Plano de Ação atualizado com sucesso!";
                    
                    if (result) {
                        // Sincronizar tarefas e anexos
                        const tasks = collectFormTasks();
                        const attachments = collectFormAttachments();
                        
                        await syncPlanTasks(planId, tasks);
                        await syncPlanAttachments(planId, attachments);
                    }
                } else {
                    // Modo criação
                    result = await saveActionPlanToSupabase(planData);
                    successMessage = "Plano de Ação salvo com sucesso!";
                    
                    if (result) {
                        // Salvar tarefas e anexos para novo plano
                        const tasks = collectFormTasks();
                        const attachments = collectFormAttachments();
                        
                        for (const task of tasks) {
                            await saveTaskToSupabase(result.id, task.description);
                        }
                        
                        for (const attachment of attachments) {
                            if (attachment.fileUrl) {
                                await saveAttachmentToSupabase(result.id, attachment.fileName, attachment.fileUrl);
                            }
                        }
                    }
                }

                if (result) {
                    showToast(successMessage, 3000, "success");
                    newForm.reset();
                    document.getElementById('plan-id').value = "";
                    
                    // Limpar listas
                    const tasksList = document.getElementById('tasks-list');
                    if (tasksList) tasksList.innerHTML = '';
                    
                    const attachmentsList = document.getElementById('plan-attachments-list');
                    if (attachmentsList) attachmentsList.innerHTML = '';
                    
                    // Fechar modais
                    const newPlanPopup = document.getElementById('new-plan-popup');
                    if (newPlanPopup) newPlanPopup.classList.remove('show');
                    
                    if (actionPlanModal) actionPlanModal.classList.remove('show');
                    
                    const planDetailsModal = document.getElementById('plan-details-modal');
                    if (planDetailsModal && planDetailsModal.classList.contains('show')) {
                        planDetailsModal.classList.remove('show');
                    }
                    
                    // Recarregar kanban
                    loadActionPlansToKanban();
                } else {
                    showToast("Erro ao salvar Plano de Ação.", 3000, "error");
                }
            } catch (error) {
                console.error('Erro ao processar formulário:', error);
                showToast("Erro ao processar formulário.", 3000, "error");
            }
        });
    }
    
    // Event listener para botão "Adicionar Tarefa"
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addNewTaskToForm);
    }
    
    // Event listener para upload de anexos
    const addAttachmentBtn = document.getElementById('add-plan-attachment-btn');
    const attachmentInput = document.getElementById('plan-attachment-input');
    
    if (addAttachmentBtn && attachmentInput) {
        addAttachmentBtn.addEventListener('click', () => {
            attachmentInput.click();
        });
        
        attachmentInput.addEventListener('change', handleAttachmentUpload);
    }
});

// Função para lidar com upload de anexos
function handleAttachmentUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
        // Simular upload (em produção, fazer upload real para servidor/storage)
        const fileUrl = URL.createObjectURL(file);
        addAttachmentToEditForm(file.name, fileUrl);
    });
    
    // Limpar input
    event.target.value = '';
}

// Função para validar formulário antes do submit
function validatePlanForm() {
    const title = document.getElementById('plan-title').value.trim();
    const startDate = document.getElementById('plan-start-date').value;
    const endDate = document.getElementById('plan-end-date').value;
    const assigneeId = document.getElementById('plan-responsible').value;
    const departmentId = document.getElementById('plan-department').value;
    const status = document.getElementById('plan-status').value;
    
    if (!title) {
        showToast('Título é obrigatório', 3000, 'error');
        return false;
    }
    
    if (!startDate) {
        showToast('Data de início é obrigatória', 3000, 'error');
        return false;
    }
    
    if (!endDate) {
        showToast('Data final é obrigatória', 3000, 'error');
        return false;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('Data de início deve ser anterior à data final', 3000, 'error');
        return false;
    }
    
    if (!assigneeId) {
        showToast('Responsável é obrigatório', 3000, 'error');
        return false;
    }
    
    if (!departmentId) {
        showToast('Departamento é obrigatório', 3000, 'error');
        return false;
    }
    
    if (!status) {
        showToast('Status é obrigatório', 3000, 'error');
        return false;
    }
    
    return true;
}

// Função para limpar formulário completamente
function clearPlanForm() {
    const form = document.getElementById('new-plan-form');
    if (form) {
        form.reset();
    }
    
    document.getElementById('plan-id').value = '';
    
    const tasksList = document.getElementById('tasks-list');
    if (tasksList) {
        tasksList.innerHTML = '';
    }
    
    const attachmentsList = document.getElementById('plan-attachments-list');
    if (attachmentsList) {
        attachmentsList.innerHTML = '';
    }
    
    setupModalForCreate();
}

// Event listener para botão cancelar
document.addEventListener('DOMContentLoaded', function() {
    const cancelBtn = document.getElementById('cancel-new-plan');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            clearPlanForm();
            const newPlanPopup = document.getElementById('new-plan-popup');
            if (newPlanPopup) {
                newPlanPopup.classList.remove('show');
            }
        });
    }
    
    const closeBtn = document.getElementById('close-new-plan-popup');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            clearPlanForm();
            const newPlanPopup = document.getElementById('new-plan-popup');
            if (newPlanPopup) {
                newPlanPopup.classList.remove('show');
            }
        });
    }
});

// ============================================
// FUNCIONALIDADES DO POP-UP DE CAUSA E CONSEQUÊNCIA
// ============================================

let currentEditingType = null;
let currentFiltersPopup = {
    periodo: 'mes',
    mes: new Date().getMonth() + 1,
    ciclo: 'C01',
    ano: new Date().getFullYear()
};
let attachmentsPopup = [];

// Função para inicializar o pop-up de Causa e Consequência
async function initializeCauseConsequencePopup() {
    console.log("Inicializando pop-up de Causa e Consequência.");
    await checkSupabaseConnectionPopup();
    setupDepartmentTitlePopup();
    await loadIndicatorsPopup();
    initializeFiltersPopup();
    setupEventListenersPopup();
}

async function checkSupabaseConnectionPopup() {
    const connectionStatus = document.getElementById('popupConnectionStatus');
    if (!connectionStatus) return;
    try {
        const { data, error } = await supabase
            .from('cause_consequence')
            .select('count', { count: 'exact', head: true });
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        connectionStatus.className = 'popup-connection-status connected';
        connectionStatus.innerHTML = '<i class="fas fa-check-circle"></i> Conectado ao Supabase';
        
        setTimeout(() => {
            connectionStatus.style.display = 'none';
        }, 3000);
        
        return true;
    } catch (error) {
        console.error('Erro de conexão com Supabase (Popup):', error);
        connectionStatus.className = 'popup-connection-status disconnected';
        connectionStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro de conexão';
        return false;
    }
}

function setupDepartmentTitlePopup() {
    const departmentTitle = document.getElementById('departmentTitlePopup');
    const selectedDepartment = localStorage.getItem('selectedDepartmentName');
    if (departmentTitle && selectedDepartment) {
        departmentTitle.textContent = selectedDepartment;
    } else if (departmentTitle) {
        departmentTitle.textContent = 'Departamento Geral';
    }
}

async function loadIndicatorsPopup() {
    const indicatorSelect = document.getElementById('popup-indicator-select');
    if (!indicatorSelect) return;

    try {
        const { data, error } = await supabase
            .from('indicators')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;

        indicatorSelect.innerHTML = '<option value="">Todos os Indicadores</option>';
        data.forEach(indicator => {
            const option = document.createElement('option');
            option.value = indicator.id;
            option.textContent = indicator.name;
            indicatorSelect.appendChild(option);
        });

        const storedIndicatorId = localStorage.getItem('selectedIndicatorId');
        if (storedIndicatorId) {
            indicatorSelect.value = storedIndicatorId;
        }
    } catch (error) {
        console.error('Erro ao carregar indicadores (Popup):', error);
        showToast('Erro ao carregar indicadores', 4000);
    }
}

function initializeFiltersPopup() {
    const currentDate = new Date();
    const popupPeriodoTipo = document.getElementById('popup-periodo-tipo');
    const popupMesSelect = document.getElementById('popup-mes-select');
    const popupCicloSelect = document.getElementById('popup-ciclo-select');
    const popupAnoSelect = document.getElementById('popup-ano-select');

    if (popupPeriodoTipo) popupPeriodoTipo.value = 'mes';
    if (popupMesSelect) popupMesSelect.value = currentDate.getMonth() + 1;
    if (popupCicloSelect) popupCicloSelect.value = 'C01';
    if (popupAnoSelect) popupAnoSelect.value = currentDate.getFullYear();

    const popupMesGroup = document.getElementById('popup-mes-group');
    const popupCicloGroup = document.getElementById('popup-ciclo-group');

    if (popupMesGroup) popupMesGroup.style.display = 'flex';
    if (popupCicloGroup) popupCicloGroup.style.display = 'none';

    currentFiltersPopup = {
        periodo: 'mes',
        mes: currentDate.getMonth() + 1,
        ciclo: 'C01',
        ano: currentDate.getFullYear()
    };
}

function setupEventListenersPopup() {
    const causeConsequenceBtn = document.getElementById('cause-consequence-btn');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupClose = document.getElementById('popup-close');

    if (causeConsequenceBtn) {
        causeConsequenceBtn.addEventListener('click', openCauseConsequencePopup);
    }

    if (popupClose) {
        popupClose.addEventListener('click', closeCauseConsequencePopup);
    }

    if (popupOverlay) {
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                closeCauseConsequencePopup();
            }
        });
    }

    const popupPeriodoTipo = document.getElementById('popup-periodo-tipo');
    if (popupPeriodoTipo) {
        popupPeriodoTipo.addEventListener('change', function() {
            currentFiltersPopup.periodo = this.value;
            const popupMesGroup = document.getElementById('popup-mes-group');
            const popupCicloGroup = document.getElementById('popup-ciclo-group');
            if (popupMesGroup) popupMesGroup.style.display = this.value === 'mes' ? 'flex' : 'none';
            if (popupCicloGroup) popupCicloGroup.style.display = this.value === 'ciclo' ? 'flex' : 'none';
        });
    }

    document.getElementById('popup-aplicar-filtros')?.addEventListener('click', applyFiltersPopup);
    document.getElementById('popup-limpar-filtros')?.addEventListener('click', clearFiltersPopup);
    document.getElementById('popup-indicator-select')?.addEventListener('change', applyFiltersPopup);

    document.getElementById('popup-edit-causa-btn')?.addEventListener('click', () => openEditorPopup('causa'));
    document.getElementById('popup-edit-consequencia-btn')?.addEventListener('click', () => openEditorPopup('consequencia'));

    document.getElementById('popup-upload-btn')?.addEventListener('click', () => document.getElementById('popup-file-input').click());
    document.getElementById('popup-file-input')?.addEventListener('change', handleFileUploadPopup);

    setupEditorModalPopup();
}

function openCauseConsequencePopup() {
    const popupOverlay = document.getElementById('popup-overlay');
    if (popupOverlay) {
        popupOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        // Carregar conteúdo existente quando o popup é aberto
        setTimeout(() => {
            loadContentPopup();
        }, 100);
    }
}

function closeCauseConsequencePopup() {
    const popupOverlay = document.getElementById('popup-overlay');
    if (popupOverlay) {
        popupOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function applyFiltersPopup() {
    currentFiltersPopup = {
        periodo: document.getElementById('popup-periodo-tipo').value,
        mes: parseInt(document.getElementById('popup-mes-select').value),
        ciclo: document.getElementById('popup-ciclo-select').value,
        ano: parseInt(document.getElementById('popup-ano-select').value)
    };
    const selectedIndicatorId = document.getElementById('popup-indicator-select').value;
    localStorage.setItem('selectedIndicatorId', selectedIndicatorId);

    loadContentPopup();
    showToast('Filtros aplicados com sucesso!', 3000);
}

function clearFiltersPopup() {
    initializeFiltersPopup();
    localStorage.removeItem('selectedIndicatorId');
    const popupIndicatorSelect = document.getElementById('popup-indicator-select');
    if (popupIndicatorSelect) popupIndicatorSelect.value = "";
    loadContentPopup();
    showToast('Filtros limpos!', 3000);
}

async function loadContentPopup() {
    try {
        const data = await loadCauseConsequenceDataPopup();
        displayContentPopup(data);
    } catch (error) {
        console.error('Erro ao carregar conteúdo (Popup):', error);
        showToast('Erro ao carregar conteúdo', 4000);
    }
}

async function loadCauseConsequenceDataPopup() {
    try {
        let query = supabase
            .from('cause_consequence')
            .select('*')
            .eq('period_type', currentFiltersPopup.periodo)
            .eq('year', currentFiltersPopup.ano)
            .eq(currentFiltersPopup.periodo === 'mes' ? 'month' : 'cycle', 
                currentFiltersPopup.periodo === 'mes' ? currentFiltersPopup.mes : currentFiltersPopup.ciclo)
            .order('created_at', { ascending: false });

        const indicatorId = localStorage.getItem('selectedIndicatorId');
        if (indicatorId && indicatorId !== 'null' && indicatorId !== '') {
            query = query.eq('indicator_id', indicatorId);
        }

        const departmentId = localStorage.getItem('selectedDepartmentId');
        if (departmentId && departmentId !== 'null' && departmentId !== '') {
            query = query.eq('department_id', departmentId);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Erro ao carregar dados de causa e consequência do Supabase (Popup):", error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Erro ao carregar dados (Popup):', error);
        return [];
    }
}

function displayContentPopup(data) {
    const causaContent = document.getElementById('popup-causa-content');
    const consequenciaContent = document.getElementById('popup-consequencia-content');
    const anexosContent = document.getElementById('popup-anexos-content');

    const causaData = data.find(item => item.type === 'causa');
    const consequenciaData = data.find(item => item.type === 'consequencia');
    
    let allAttachments = [];
    data.forEach(item => {
        if (item.attachments && Array.isArray(item.attachments)) {
            allAttachments = allAttachments.concat(item.attachments);
        }
    });

    if (causaContent) {
        causaContent.innerHTML = causaData?.content ? `<div class="popup-content-display">${causaData.content}</div>` : `
            <div class="popup-empty-state">
                <i class="ri-file-text-line"></i>
                <p>Por favor adicione a Causa</p>
            </div>`;
    }

    if (consequenciaContent) {
        consequenciaContent.innerHTML = consequenciaData?.content ? `<div class="popup-content-display">${consequenciaData.content}</div>` : `
            <div class="popup-empty-state">
                <i class="ri-file-text-line"></i>
                <p>Por favor adicione a Consequência</p>
            </div>`;
    }

    if (anexosContent) {
        if (allAttachments.length > 0) {
            anexosContent.innerHTML = `
                <div class="popup-attachments-grid">
                    ${allAttachments.map(attachment => `
                        <div class="popup-attachment-item">
                            <div class="popup-attachment-icon"><i class="${getFileIconPopup(attachment.name)}"></i></div>
                            <div class="popup-attachment-name" title="${attachment.name}">${attachment.name}</div>
                            <div class="popup-attachment-size">${formatFileSizePopup(attachment.size || 0)}</div>
                            <div class="popup-attachment-actions">
                                <button class="popup-attachment-btn popup-download-btn" onclick="downloadAttachmentPopup('${attachment.url}', '${attachment.name}')"><i class="ri-download-line"></i></button>
                                <button class="popup-attachment-btn popup-delete-btn" onclick="deleteAttachmentWrapperPopup('${attachment.url}')"><i class="ri-delete-bin-line"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        } else {
            anexosContent.innerHTML = `
                <div class="popup-empty-state">
                    <i class="ri-folder-open-line"></i>
                    <p>Nenhum anexo adicionado</p>
                    <small>Tipos permitidos: PDF, JPG, PNG (até 150 MB)</small>
                </div>`;
        }
    }
}

function getFileIconPopup(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'ri-file-pdf-line',
        'jpg': 'ri-image-line',
        'jpeg': 'ri-image-line',
        'png': 'ri-image-line',
    };
    return iconMap[extension] || 'ri-file-line';
}

function formatFileSizePopup(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadAttachmentPopup(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function deleteAttachmentWrapperPopup(fileUrl) {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) {
        return;
    }

    try {
        const fileName = fileUrl.split('/').pop();
        const { error: deleteError } = await supabase.storage.from('cause_consequence_files').remove([fileName]);
        if (deleteError) throw deleteError;

        const data = await loadCauseConsequenceDataPopup();
        for (const record of data) {
            if (record.attachments && record.attachments.some(att => att.url === fileUrl)) {
                const updatedAttachments = record.attachments.filter(att => att.url !== fileUrl);
                const { error: updateError } = await supabase
                    .from('cause_consequence')
                    .update({ attachments: updatedAttachments })
                    .eq('id', record.id);
                if (updateError) throw updateError;
            }
        }

        showToast('Anexo excluído com sucesso!', 3000);
        loadContentPopup();
    } catch (error) {
        console.error('Erro ao excluir anexo (Popup):', error);
        showToast('Erro ao excluir anexo', 4000);
    }
}

async function handleFileUploadPopup(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    const departmentId = localStorage.getItem('selectedDepartmentId');
    const indicatorId = localStorage.getItem('selectedIndicatorId');

    if (!departmentId || !indicatorId) {
        showToast('Selecione um departamento e um indicador antes de fazer upload.', 5000);
        return;
    }

    for (const file of files) {
        if (file.size > 150 * 1024 * 1024) { // 150 MB
            showToast(`O arquivo ${file.name} excede o limite de 150 MB.`, 5000);
            continue;
        }

        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        const filePath = `${departmentId}/${indicatorId}/${fileName}`;

        try {
            const { data, error } = await supabase.storage
                .from('cause_consequence_files')
                .upload(filePath, file);

            if (error) throw error;

            const publicUrl = supabase.storage.from('cause_consequence_files').getPublicUrl(filePath).data.publicUrl;

            const newAttachment = {
                name: file.name,
                url: publicUrl,
                size: file.size,
                type: file.type
            };

            let existingRecord = (await loadCauseConsequenceDataPopup()).find(item => item.type === 'attachment_list');

            if (existingRecord) {
                const updatedAttachments = [...(existingRecord.attachments || []), newAttachment];
                await supabase
                    .from('cause_consequence')
                    .update({ attachments: updatedAttachments })
                    .eq('id', existingRecord.id);
            } else {
                await supabase
                    .from('cause_consequence')
                    .insert({
                        department_id: departmentId,
                        indicator_id: indicatorId,
                        period_type: currentFiltersPopup.periodo,
                        month: currentFiltersPopup.mes,
                        cycle: currentFiltersPopup.ciclo,
                        year: currentFiltersPopup.ano,
                        type: 'attachment_list',
                        content: '',
                        attachments: [newAttachment]
                    });
            }

            showToast(`Arquivo ${file.name} enviado com sucesso!`, 3000);
            loadContentPopup();
        } catch (error) {
            console.error('Erro ao fazer upload do arquivo (Popup):', error);
            showToast('Erro ao fazer upload do arquivo', 4000);
        }
    }
}

function setupEditorModalPopup() {
    const editorModal = document.getElementById('popup-editor-modal');
    const closeEditorBtn = document.getElementById('popup-close-editor-modal');
    const cancelEditorBtn = document.getElementById('popup-cancel-editor');
    const saveEditorBtn = document.getElementById('popup-save-editor');
    const boldBtn = document.getElementById('popup-bold-btn');
    const listBtn = document.getElementById('popup-list-btn');
    const highlightBtn = document.getElementById('popup-highlight-btn');
    const colorOptions = document.getElementById('popup-color-options');
    const colorPicker = document.getElementById('popup-color-picker');
    const editorContent = document.getElementById('popup-editor-content');

    if (closeEditorBtn) closeEditorBtn.addEventListener('click', closeEditorPopup);
    if (cancelEditorBtn) cancelEditorBtn.addEventListener('click', closeEditorPopup);
    if (saveEditorBtn) saveEditorBtn.addEventListener('click', saveContentPopup);

    if (boldBtn) {
        boldBtn.addEventListener('click', () => {
            document.execCommand('bold', false, null);
            boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        });
    }

    if (listBtn) {
        listBtn.addEventListener('click', () => {
            document.execCommand('insertUnorderedList', false, null);
            listBtn.classList.toggle('active', document.queryCommandState('insertUnorderedList'));
        });
    }

    if (highlightBtn) {
        highlightBtn.addEventListener('click', () => {
            colorOptions.classList.toggle('show');
        });
    }

    document.querySelectorAll('.popup-color-option').forEach(option => {
        option.addEventListener('click', function() {
            const color = this.dataset.color;
            if (color === 'transparent') {
                document.execCommand('removeFormat', false, 'backcolor');
            } else {
                document.execCommand('hiliteColor', false, color);
            }
            colorOptions.classList.remove('show');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.popup-color-picker-container')) {
            colorOptions.classList.remove('show');
        }
    });

    if (editorContent) {
        editorContent.addEventListener('input', () => {
            if (boldBtn) boldBtn.classList.toggle('active', document.queryCommandState('bold'));
            if (listBtn) listBtn.classList.toggle('active', document.queryCommandState('insertUnorderedList'));
        });
    }
}

function openEditorPopup(type) {
    currentEditingType = type;
    const editorModal = document.getElementById('popup-editor-modal');
    const editorTitle = document.getElementById('popup-editor-modal-title');
    const editorContent = document.getElementById('popup-editor-content');

    if (editorTitle) {
        editorTitle.textContent = `Editar ${type === 'causa' ? 'Causa' : 'Consequência'}`;
    }

    if (editorContent) {
        const existingContent = type === 'causa' 
            ? document.querySelector('#popup-causa-content .popup-content-display')?.innerHTML || ''
            : document.querySelector('#popup-consequencia-content .popup-content-display')?.innerHTML || '';
        
        editorContent.innerHTML = existingContent;
        editorContent.focus();
    }

    if (editorModal) {
        editorModal.classList.add('show');
    }
}

function closeEditorPopup() {
    const editorModal = document.getElementById('popup-editor-modal');
    const colorOptions = document.getElementById('popup-color-options');
    
    if (editorModal) {
        editorModal.classList.remove('show');
    }
    
    if (colorOptions) {
        colorOptions.classList.remove('show');
    }
    
    currentEditingType = null;
}

async function saveContentPopup() {
    if (!currentEditingType) return;

    const editorContent = document.getElementById('popup-editor-content');
    const content = editorContent ? editorContent.innerHTML : '';

    try {
        await saveCauseConsequenceToSupabasePopup(currentEditingType, content, []);
        showToast(`${currentEditingType === 'causa' ? 'Causa' : 'Consequência'} salva com sucesso!`, 3000);
        closeEditorPopup();
        loadContentPopup();
    } catch (error) {
        console.error('Erro ao salvar conteúdo (Popup):', error);
        showToast('Erro ao salvar conteúdo', 4000);
    }
}

async function saveCauseConsequenceToSupabasePopup(type, content, attachments) {
    const departmentId = localStorage.getItem('selectedDepartmentId');
    const indicatorId = localStorage.getItem('selectedIndicatorId');

    if (!departmentId || !indicatorId) {
        showToast('Selecione um departamento e um indicador antes de salvar.', 5000);
        return;
    }

    const existingRecord = (await loadCauseConsequenceDataPopup()).find(item => item.type === type);

    if (existingRecord) {
        const { error } = await supabase
            .from('cause_consequence')
            .update({ content: content, attachments: attachments })
            .eq('id', existingRecord.id);
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('cause_consequence')
            .insert({
                department_id: departmentId,
                indicator_id: indicatorId,
                period_type: currentFiltersPopup.periodo,
                month: currentFiltersPopup.mes,
                cycle: currentFiltersPopup.ciclo,
                year: currentFiltersPopup.ano,
                type: type,
                content: content,
                attachments: attachments
            });
        if (error) throw error;
    }
}

// Adicionar a inicialização do pop-up de Causa e Consequência ao DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeCauseConsequencePopup);

// Inicializar dados do usuário quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados do usuário autenticado
    loadAuthenticatedUser();
    
    // Verificar se há usuário autenticado, caso contrário redirecionar para login
    const authenticatedUser = localStorage.getItem('authenticatedUser');
    if (!authenticatedUser) {
        console.warn('Usuário não autenticado, redirecionando para login');
        // Opcional: redirecionar para página de login
        // window.location.href = '../index.htm';
    }
});