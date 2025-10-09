

const queryCache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

// Variável para armazenar o estado atual dos filtros
export let currentFilters = {
    periodo: 'mes',
    mes: new Date().getMonth() + 1,
    ciclo: 'C01',
    ano: new Date().getFullYear(),
    indicatorId: null,
    departmentId: null
};

// Função para inicializar os filtros com valores padrão ou do localStorage
export function initializeFilters() {
    const currentDate = new Date();
    currentFilters.periodo = 'mes';
    currentFilters.mes = currentDate.getMonth() + 1;
    currentFilters.ciclo = 'C01';
    currentFilters.ano = currentDate.getFullYear();
    currentFilters.indicatorId = localStorage.getItem('selectedIndicatorId') || null;
    currentFilters.departmentId = localStorage.getItem('selectedDepartmentId') || null;
}

// Função para atualizar os filtros
export function updateFilters(newFilters) {
    Object.assign(currentFilters, newFilters);
    if (newFilters.indicatorId !== undefined) {
        if (newFilters.indicatorId) {
            localStorage.setItem('selectedIndicatorId', newFilters.indicatorId);
        } else {
            localStorage.removeItem('selectedIndicatorId');
        }
    }
    if (newFilters.departmentId !== undefined) {
        if (newFilters.departmentId) {
            localStorage.setItem('selectedDepartmentId', newFilters.departmentId);
        } else {
            localStorage.removeItem('selectedDepartmentId');
        }
    }
}

// Função genérica para carregar dados do Supabase com base nos filtros
export async function loadSupabaseData(tableName, filters = currentFilters) {
    const cacheKey = `${tableName}-${JSON.stringify(filters)}`;
    const cachedData = queryCache.get(cacheKey);

    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION_MS)) {
        console.log(`Cache hit for ${tableName} with filters:`, filters);
        return cachedData.data;
    }
    console.log(`Cache miss for ${tableName} with filters:`, filters);
    try {
        let query = supabase
            .from(tableName)
            .select('*');

        // Aplicar filtros comuns
        if (filters.periodo) {
            query = query.eq('period_type', filters.periodo);
        }
        if (filters.ano) {
            query = query.eq('year', filters.ano);
        }
        if (filters.periodo === 'mes' && filters.mes) {
            query = query.eq('month', filters.mes);
        } else if (filters.periodo === 'ciclo' && filters.ciclo) {
            query = query.eq('cycle', filters.ciclo);
        }
        if (filters.indicatorId) {
            query = query.eq('indicator_id', filters.indicatorId);
        }
        if (filters.departmentId) {
            query = query.eq('department_id', filters.departmentId);
        }

        // Adicionar ordenação padrão
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error(`Erro ao carregar dados da tabela ${tableName}:`, error);
            throw error;
        }

        queryCache.set(cacheKey, { data: data || [], timestamp: Date.now() });
        return data || [];
    } catch (error) {
        console.error(`Erro ao carregar dados do Supabase para ${tableName}:`, error);
        return [];
    }
}

// Função para exibir toasts (pode ser movida para um arquivo de UI utils se houver mais)
export function showToast(message, duration = 3000, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        const newToastContainer = document.createElement('div');
        newToastContainer.id = 'toast-container';
        document.body.appendChild(newToastContainer);
        // Adicionar estilos básicos para o toast container
        newToastContainer.style.position = 'fixed';
        newToastContainer.style.bottom = '20px';
        newToastContainer.style.right = '20px';
        newToastContainer.style.zIndex = '9999';
        newToastContainer.style.display = 'flex';
        newToastContainer.style.flexDirection = 'column-reverse';
        newToastContainer.style.gap = '10px';
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Adicionar estilos básicos para o toast
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
    toast.style.transform = 'translateY(20px)';

    if (type === 'info') {
        toast.style.backgroundColor = '#4A9FBC'; // Cor info
    } else if (type === 'success') {
        toast.style.backgroundColor = '#00D74F'; // Cor success
    } else if (type === 'error') {
        toast.style.backgroundColor = '#B21316'; // Cor danger
    } else if (type === 'warning') {
        toast.style.backgroundColor = '#FF9800'; // Cor warning
    }

    document.getElementById('toast-container').appendChild(toast);

    // Animar entrada
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 100);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

