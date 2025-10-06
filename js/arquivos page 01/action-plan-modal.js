// ============================================
// FUNCIONALIDADES DOS MODAIS DE PLANO DE AÇÃO
// ============================================

// Variáveis globais para os modais
// actionPlanModal já está declarada no overview.js
let newPlanPopup = null;

// Inicialização dos event listeners dos modais
function initializeActionPlanModals() {
    // Elementos dos modais
    actionPlanModal = document.getElementById('action-plan-modal');
    newPlanPopup = document.getElementById('new-plan-popup');
    
    // Botões para abrir modais
    const actionPlanBtn = document.getElementById('action-plan-btn');
    const newPlanBtn = document.getElementById('new-plan-btn');
    
    // Botões para fechar modais
    const closeActionPlanModal = document.getElementById('close-action-plan-modal');
    const closeNewPlanPopup = document.getElementById('close-new-plan-popup');
    
    // Botões de cancelar
    const cancelNewPlan = document.getElementById('cancel-new-plan');
    
    // Event listeners para abrir modais
    if (actionPlanBtn) {
        actionPlanBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            openActionPlanModal();
        });
    }
    
    if (newPlanBtn) {
        newPlanBtn.addEventListener('click', openNewPlanPopup);
    }
    
    // Event listeners para fechar modais
    if (closeActionPlanModal) {
        closeActionPlanModal.addEventListener('click', closeActionPlanModalHandler);
    }
    
    if (closeNewPlanPopup) {
        closeNewPlanPopup.addEventListener('click', closeNewPlanPopupHandler);
    }
    
    if (cancelNewPlan) {
        cancelNewPlan.addEventListener('click', closeNewPlanPopupHandler);
    }
    
    // Event listeners para fechar modal clicando fora
    if (actionPlanModal) {
        actionPlanModal.addEventListener('click', function(e) {
            if (e.target === actionPlanModal) {
                closeActionPlanModalHandler();
            }
        });
    }
    
    if (newPlanPopup) {
        newPlanPopup.addEventListener('click', function(e) {
            if (e.target === newPlanPopup) {
                closeNewPlanPopupHandler();
            }
        });
    }
    
    // Inicializar funcionalidades específicas dos modais
    initializeNewPlanForm();
}

// Funções para abrir modais
function openActionPlanModal() {
    if (actionPlanModal) {
        actionPlanModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        if (window.loadActionPlansToKanban) {
            window.loadActionPlansToKanban();
        } else {
            loadActionPlansKanban();
        }
    }
}

function openNewPlanPopup() {
    if (newPlanPopup) {
        newPlanPopup.classList.add('show');
        document.body.style.overflow = 'hidden';
        resetNewPlanForm();
    }
}

// Funções para fechar modais
function closeActionPlanModalHandler() {
    if (actionPlanModal) {
        actionPlanModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function closeNewPlanPopupHandler() {
    if (newPlanPopup) {
        newPlanPopup.classList.remove('show');
        document.body.style.overflow = 'auto';
        resetNewPlanForm();
    }
}

// Função para carregar planos no Kanban
async function loadActionPlansKanban() {
    const selectedIndicatorId = document.getElementById('filtro-indicadores')?.value;
    try {
        let plans = await loadActionPlansFromSupabase();

        if (selectedIndicatorId) {
            plans = plans.filter(plan => plan.indicator_id === selectedIndicatorId);
        }
        
        const columns = ['atrasado', 'nao-iniciado', 'em-progresso', 'concluido'];
        columns.forEach(status => {
            const column = document.getElementById(`kanban-${status}`);
            const count = document.getElementById(`count-${status}`);
            if (column) column.innerHTML = '';
            if (count) count.textContent = '0';
        });
        
        const plansByStatus = {
            'atrasado': [],
            'nao-iniciado': [],
            'em-progresso': [],
            'concluido': []
        };
        
        plans.forEach(plan => {
            plan.progress = calculatePlanProgress(plan);
            let status = plan.status?.name || 'Não iniciado';
            
            status = status
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/ /g, '-');
            
            if (plansByStatus[status]) {
                plansByStatus[status].push(plan);
            }
        });
        
        Object.keys(plansByStatus).forEach(status => {
            const column = document.getElementById(`kanban-${status}`);
            const count = document.getElementById(`count-${status}`);
            const plans = plansByStatus[status];
            
            if (count) count.textContent = plans.length.toString();
            
            if (column) {
                plans.forEach(plan => {
                    plan.progress = calculatePlanProgress(plan);
                    const card = createPlanCard(plan);
                    column.appendChild(card);
                });
            }
        });
        
    } catch (error) {
        console.error('Erro ao carregar planos no Kanban:', error);
        if (typeof showToast === 'function') {
            showToast('Erro ao carregar planos de ação', 4000);
        }
    }
}

function calculatePlanProgress(plan) {
    if (!plan.tasks || plan.tasks.length === 0) {
        return 0;
    }
    const completedTasks = plan.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / plan.tasks.length) * 100);
}

function createPlanCard(plan) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    
    const progress = plan.progress || 0;
    const progressColor = getProgressColor(progress);
    
    card.innerHTML = `
        <div class="kanban-card-header">
            <h4>${plan.title}</h4>
            <div class="kanban-card-actions">
                <button class="card-action-btn" onclick="editPlan(${plan.id})">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="card-action-btn" onclick="deletePlan(${plan.id})">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        </div>
        <div class="kanban-card-body">
            <p class="kanban-card-description">${plan.description || 'Sem descrição'}</p>
            <div class="kanban-card-meta">
                <div class="card-meta-item">
                    <i class="ri-user-line"></i>
                    <span class="card-assignee">${plan.assignee?.name || 'Não atribuído'}</span>
                </div>
                <div class="card-meta-item">
                    <i class="ri-calendar-line"></i>
                    <span class="card-date">${formatDate(plan.end_date)}</span>
                </div>
            </div>
            <div class="kanban-card-progress">
                <div class="progress-header">
                    <span class="progress-label">Progresso das Tarefas</span>
                    <span class="progress-percentage">${progress}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress}%; background-color: ${progressColor};"></div>
                </div>
                <div class="progress-info">
                    <span class="tasks-count">${getTasksCountText(plan)}</span>
                </div>
            </div>
        </div>
    `;
    return card;
}

function getProgressColor(progress) {
    if (progress === 0) return '#E2E8F0';
    if (progress < 30) return '#EF4444';
    if (progress < 70) return '#F59E0B';
    return '#10B981';
}

function getTasksCountText(plan) {
    if (!plan.tasks || plan.tasks.length === 0) {
        return 'Nenhuma tarefa';
    }
    
    const totalTasks = plan.tasks.length;
    const completedTasks = plan.tasks.filter(task => task.completed).length;
    
    return `${completedTasks} de ${totalTasks} tarefas concluídas`;
}

function initializeNewPlanForm() {
    const form = document.getElementById('new-plan-form');
    const periodTypeSelect = document.getElementById('period-type');
    const monthField = document.getElementById('month-field');
    const cycleField = document.getElementById('cycle-field');
    const addTaskBtn = document.getElementById('add-task-btn');
    const addAttachmentBtn = document.getElementById('add-plan-attachment-btn');
    const attachmentInput = document.getElementById('plan-attachment-input');
    
    if (form) {
        form.addEventListener('submit', handleNewPlanSubmit);
    }
    
    if (periodTypeSelect) {
        periodTypeSelect.addEventListener('change', function() {
            const value = this.value;
            if (monthField && cycleField) {
                if (value === 'mensal') {
                    monthField.style.display = 'block';
                    cycleField.style.display = 'none';
                } else if (value === 'ciclo') {
                    monthField.style.display = 'none';
                    cycleField.style.display = 'block';
                } else {
                    monthField.style.display = 'none';
                    cycleField.style.display = 'none';
                }
            }
        });
    }
    
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addNewTask);
    }
    
    if (addAttachmentBtn) {
        addAttachmentBtn.addEventListener('click', function() {
            if (attachmentInput) {
                attachmentInput.click();
            }
        });
    }
    
    if (attachmentInput) {
        attachmentInput.addEventListener('change', handleAttachmentUpload);
    }
}

document.addEventListener('DOMContentLoaded', initializeActionPlanModals);




async function handleNewPlanSubmit(event) {
    event.preventDefault();
    console.log('Formulário de novo plano submetido!');
    // Lógica para salvar o novo plano aqui
    closeNewPlanPopupHandler();
}

function resetNewPlanForm() {
    const form = document.getElementById('new-plan-form');
    if (form) {
        form.reset();
    }
    // Limpar tarefas e anexos se houver
    const tasksContainer = document.getElementById('new-plan-tasks-container');
    if (tasksContainer) tasksContainer.innerHTML = '';
    const attachmentsContainer = document.getElementById('new-plan-attachments-list');
    if (attachmentsContainer) attachmentsContainer.innerHTML = '';
}

function addNewTask() {
    const tasksContainer = document.getElementById('new-plan-tasks-container');
    if (tasksContainer) {
        const taskCount = tasksContainer.children.length + 1;
        const newTaskHtml = `
            <div class="new-plan-task-item">
                <input type="text" placeholder="Descrição da Tarefa ${taskCount}" required>
                <button type="button" class="remove-task-btn"><i class="ri-delete-bin-line"></i></button>
            </div>
        `;
        tasksContainer.insertAdjacentHTML('beforeend', newTaskHtml);
        tasksContainer.querySelector('.remove-task-btn:last-child').addEventListener('click', function() {
            this.closest('.new-plan-task-item').remove();
        });
    }
}

function handleAttachmentUpload(event) {
    const files = event.target.files;
    const attachmentsList = document.getElementById('new-plan-attachments-list');
    if (attachmentsList) {
        for (const file of files) {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'new-plan-attachment-item';
            attachmentItem.innerHTML = `
                <span>${file.name}</span>
                <button type="button" class="remove-attachment-btn"><i class="ri-close-line"></i></button>
            `;
            attachmentsList.appendChild(attachmentItem);
            attachmentItem.querySelector('.remove-attachment-btn').addEventListener('click', function() {
                attachmentItem.remove();
            });
        }
    }
}

