
import { currentFilters, initializeFilters, updateFilters, showToast, loadSupabaseData, getGlobalFilters } from './utils.js';


let currentEditingType = null;

let attachments = [];

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOMContentLoaded event fired.");
    await initializePage();
    setupEventListeners();
});

async function initializePage() {
    try {
        await checkSupabaseConnection();
        setupDepartmentTitle();
        await loadIndicators();
        initializeFiltersAndUI();
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
    }
}

async function checkSupabaseConnection() {
    const connectionStatus = document.getElementById('connectionStatus');
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
        console.error('Erro de conexão com Supabase:', error);
        connectionStatus.className = 'popup-connection-status disconnected';
        connectionStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro de conexão';
        return false;
    }
}

function setupDepartmentTitle() {
    const departmentTitle = document.getElementById('departmentTitle');
    const selectedDepartment = localStorage.getItem('selectedDepartmentName');
    if (departmentTitle && selectedDepartment) {
        departmentTitle.textContent = selectedDepartment;
    } else if (departmentTitle) {
        departmentTitle.textContent = 'Departamento Geral';
    }
}

async function loadIndicators() {
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
        console.error('Erro ao carregar indicadores:', error);
        showToast('Erro ao carregar indicadores', 4000);
    }
}

function initializeFiltersAndUI() {
    initializeFilters(); // Chama a função importada
    const globalFilters = getGlobalFilters(); // Obtém os filtros globais

    // Aplica os filtros globais aos filtros do popup
    document.getElementById("popup-indicator-select").value = globalFilters.indicadores;
    // Os filtros de período (mes, ciclo, ano) do popup devem ser preenchidos com base nos filtros globais
    // No entanto, o filtro global não tem 'periodo' (mes/ciclo), então vamos usar o padrão ou o que já está em currentFilters
    document.getElementById("popup-periodo-tipo").value = currentFilters.periodo;
    document.getElementById("popup-mes-select").value = currentFilters.mes;
    document.getElementById("popup-ciclo-select").value = currentFilters.ciclo;
    document.getElementById("popup-ano-select").value = globalFilters.ano || currentFilters.ano;

    // Atualiza a visibilidade dos campos de mês/ciclo com base no tipo de período do popup
    document.getElementById("popup-mes-group").style.display = currentFilters.periodo === "mes" ? "flex" : "none";
    document.getElementById("popup-ciclo-group").style.display = currentFilters.periodo === "ciclo" ? "flex" : "none";

    // Atualiza os filtros internos do popup com os valores globais para consistência
    updateFilters({
        indicatorId: globalFilters.indicadores,
        ano: globalFilters.ano || currentFilters.ano
    });
}

function setupEventListeners() {
    // Event listeners para o pop-up principal
    const causeConsequenceBtn = document.getElementById('cause-consequence-btn');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupClose = document.getElementById('popup-close');

    if (causeConsequenceBtn) {
        causeConsequenceBtn.addEventListener('click', openPopup);
    }

    if (popupClose) {
        popupClose.addEventListener('click', closePopup);
    }

    if (popupOverlay) {
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                closePopup();
            }
        });
    }

    // Event listeners para filtros
    document.getElementById('popup-periodo-tipo')?.addEventListener('change', function() {
        currentFilters.periodo = this.value;
        document.getElementById('popup-mes-group').style.display = this.value === 'mes' ? 'flex' : 'none';
        document.getElementById('popup-ciclo-group').style.display = this.value === 'ciclo' ? 'flex' : 'none';
    });

    document.getElementById('popup-aplicar-filtros')?.addEventListener('click', applyFilters);
    document.getElementById('popup-limpar-filtros')?.addEventListener('click', clearFilters);
    document.getElementById('popup-indicator-select')?.addEventListener('change', applyFilters);

    // Event listeners para edição
    document.getElementById('popup-edit-causa-btn')?.addEventListener('click', () => openEditor('causa'));
    document.getElementById('popup-edit-consequencia-btn')?.addEventListener('click', () => openEditor('consequencia'));

    // Event listeners para upload
    document.getElementById('popup-upload-btn')?.addEventListener('click', () => document.getElementById('popup-file-input').click());
    document.getElementById('popup-file-input')?.addEventListener('change', handleFileUpload);

    // Event listeners para o modal do editor
    setupEditorModal();

    // Event listener para modo escuro (se existir)
    const darkModeToggle = document.getElementById('darkmode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark');
        });
    }
}

function openPopup() {
    const popupOverlay = document.getElementById('popup-overlay');
    if (popupOverlay) {
        popupOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        loadContent();
    }
}

function closePopup() {
    const popupOverlay = document.getElementById('popup-overlay');
    if (popupOverlay) {
        popupOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function applyFilters() {
    updateFilters({
        periodo: document.getElementById("popup-periodo-tipo").value,
        mes: parseInt(document.getElementById("popup-mes-select").value),
        ciclo: document.getElementById("popup-ciclo-select").value,
        ano: parseInt(document.getElementById("popup-ano-select").value),
        indicatorId: document.getElementById("popup-indicator-select").value
    });
    loadContent();
    showToast("Filtros aplicados com sucesso!", 3000);
}

function clearFilters() {
    updateFilters({
        periodo: "mes",
        mes: new Date().getMonth() + 1,
        ciclo: "C01",
        ano: new Date().getFullYear(),
        indicatorId: null
    });
    document.getElementById("popup-indicator-select").value = "";
    initializeFiltersAndUI(); // Atualiza a UI dos filtros
    loadContent();
    showToast("Filtros limpos!", 3000);
}

async function loadContent() {
    try {
        const data = await loadCauseConsequenceData();
        displayContent(data);
    } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        showToast('Erro ao carregar conteúdo', 4000);
    }
}

async function loadCauseConsequenceData() {
    return await loadSupabaseData("cause_consequence");
}

function displayContent(data) {
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

    causaContent.innerHTML = causaData?.content ? `<div class="popup-content-display">${causaData.content}</div>` : `
        <div class="popup-empty-state">
            <i class="ri-file-text-line"></i>
            <p>Nenhuma Causa adicionada.</p>
            <button class="btn-add-content" onclick="openEditor(\'causa\')">
                <i class="ri-add-line"></i> Adicionar Causa
            </button>
        </div>`;

    consequenciaContent.innerHTML = consequenciaData?.content ? `<div class="popup-content-display">${consequenciaData.content}</div>` : `
        <div class="popup-empty-state">
            <i class="ri-file-text-line"></i>
            <p>Nenhuma Consequência adicionada.</p>
            <button class="btn-add-content" onclick="openEditor(\'consequencia\')">
                <i class="ri-add-line"></i> Adicionar Consequência
            </button>
        </div>`;

    if (allAttachments.length > 0) {
        anexosContent.innerHTML = `
            <div class="popup-attachments-grid">
                ${allAttachments.map(attachment => `
                    <div class="popup-attachment-item">
                        <div class="popup-attachment-icon"><i class="${getFileIcon(attachment.name)}"></i></div>
                        <div class="popup-attachment-name" title="${attachment.name}">${attachment.name}</div>
                        <div class="popup-attachment-size">${formatFileSize(attachment.size || 0)}</div>
                        <div class="popup-attachment-actions">
                            <button class="popup-attachment-btn popup-download-btn" onclick="downloadAttachment(\'${attachment.url}\', \'${attachment.name}\')"><i class="ri-download-line"></i></button>
                            <button class="popup-attachment-btn popup-view-btn" onclick="viewAttachment(\'${attachment.url}\', \'${attachment.type}\')"><i class="ri-eye-line"></i></button>
                            <button class="popup-attachment-btn popup-delete-btn" onclick="deleteAttachmentWrapper(\'${attachment.url}\')"><i class="ri-delete-bin-line"></i></button>
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

function getFileIcon(filename) {
    if (!filename) return 'ri-file-line'; // Retorna um ícone genérico se o nome do arquivo for nulo ou indefinido
    const extension = typeof filename === 'string' ? filename.split(".").pop().toLowerCase() : '';
    const iconMap = {
        'pdf': 'ri-file-pdf-line',
        'jpg': 'ri-image-line',
        'jpeg': 'ri-image-line',
        'png': 'ri-image-line',
    };
    return iconMap[extension] || 'ri-file-line';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadAttachment(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function deleteAttachmentWrapper(fileUrl) {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) {
        return;
    }

    try {
        const fileName = fileUrl.split('/').pop();
        const { error: deleteError } = await supabase.storage.from('cause_consequence_files').remove([fileName]);
        if (deleteError) throw deleteError;

        const data = await loadCauseConsequenceData();
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
        loadContent();
    } catch (error) {
        console.error('Erro ao excluir anexo:', error);
        showToast('Erro ao excluir anexo', 4000);
    }
}

async function handleFileUpload(event) {
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

            // Encontrar ou criar o registro de anexo no banco de dados
            let existingRecord = (await loadCauseConsequenceData()).find(item => 
                item.type === 'attachment_list' &&
                item.department_id === departmentId &&
                item.indicator_id === indicatorId &&
                item.period_type === currentFilters.periodo &&
                item.year === currentFilters.ano &&
                (currentFilters.periodo === 'mes' ? item.month === currentFilters.mes : item.cycle === currentFilters.ciclo)
            );

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
                        period_type: currentFilters.periodo,
                        month: currentFilters.mes,
                        cycle: currentFilters.ciclo,
                        year: currentFilters.ano,
                        type: 'attachment_list',
                        content: '', // Conteúdo vazio para o tipo anexo
                        attachments: [newAttachment]
                    });
            }

            showToast(`Arquivo ${file.name} enviado com sucesso!`, 3000);
            loadContent();
        } catch (error) {
            console.error('Erro ao fazer upload do arquivo:', error);
            showToast(`Erro ao enviar ${file.name}: ${error.message}`, 5000);
        }
    }
}

// ============================================
// EDITOR DE TEXTO RICO
// ============================================

function setupEditorModal() {
    const editorModal = document.getElementById('popup-editor-modal');
    const closeEditorModal = document.getElementById('popup-close-editor-modal');
    const cancelEditor = document.getElementById('popup-cancel-editor');
    const saveEditor = document.getElementById('popup-save-editor');

    if (closeEditorModal) {
        closeEditorModal.addEventListener('click', closeEditor);
    }

    if (cancelEditor) {
        cancelEditor.addEventListener('click', closeEditor);
    }

    if (saveEditor) {
        saveEditor.addEventListener('click', saveContent);
    }

    if (editorModal) {
        editorModal.addEventListener('click', (e) => {
            if (e.target === editorModal) {
                closeEditor();
            }
        });
    }

    // Configurar toolbar do editor
    setupEditorToolbar();
}

function setupEditorToolbar() {
    const boldBtn = document.getElementById('popup-bold-btn');
    const listBtn = document.getElementById('popup-list-btn');
    const highlightBtn = document.getElementById('popup-highlight-btn');
    const colorOptions = document.getElementById('popup-color-options');

    if (boldBtn) {
        boldBtn.addEventListener('click', () => {
            document.execCommand('bold', false, null);
            boldBtn.classList.toggle('active');
        });
    }

    if (listBtn) {
        listBtn.addEventListener('click', () => {
            document.execCommand('insertUnorderedList', false, null);
            listBtn.classList.toggle('active');
        });
    }

    if (highlightBtn) {
        highlightBtn.addEventListener('click', () => {
            colorOptions.classList.toggle('show');
        });
    }

    // Configurar opções de cor
    const colorOptionElements = document.querySelectorAll('.popup-color-option');
    colorOptionElements.forEach(option => {
        option.addEventListener('click', () => {
            const color = option.getAttribute('data-color');
            if (color === 'transparent') {
                document.execCommand('removeFormat', false, null);
            } else {
                document.execCommand('hiliteColor', false, color);
            }
            colorOptions.classList.remove('show');
        });
    });

    // Fechar opções de cor ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.popup-color-picker-container')) {
            colorOptions.classList.remove('show');
        }
    });
}

function openEditor(type) {
    currentEditingType = type;
    const editorModal = document.getElementById('popup-editor-modal');
    const editorTitle = document.getElementById('popup-editor-modal-title');
    const editorContent = document.getElementById('popup-editor-content');

    if (editorTitle) {
        editorTitle.textContent = `Editar ${type === 'causa' ? 'Causa' : 'Consequência'}`;
    }

    if (editorContent) {
        // Carregar conteúdo existente
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

function closeEditor() {
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

async function saveContent() {
    const saveButton = document.getElementById("popup-save-editor-btn");
    if (!saveButton) {
        console.error("Botão de salvar não encontrado.");
        return;
    }
    const originalButtonHtml = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = `<i class="ri-loader-4-line spin"></i> Salvando...`;

    if (!currentEditingType) return;

    const editorContent = document.getElementById("popup-editor-content");
    const content = editorContent.innerHTML.trim();

    if (content === '') {
        showToast("O conteúdo não pode estar vazio.", 3000, "error");
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonHtml;
        return;
    }

    try {
        const existingRecord = (await loadCauseConsequenceData()).find(item => item.type === currentEditingType);
        const existingAttachments = existingRecord ? existingRecord.attachments : [];
        await saveCauseConsequenceToSupabase(currentEditingType, content, existingAttachments);
        showToast(`${currentEditingType === 'causa' ? 'Causa' : 'Consequência'} salva com sucesso!`, 3000);
    } catch (error) {
        console.error(`Erro ao salvar ${currentEditingType}:`, error);
        showToast(`Erro ao salvar ${currentEditingType}`, 4000);
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonHtml;
    }
    closeEditor();
    loadContent();
}

async function saveCauseConsequenceToSupabase(type, content, attachments) {
    const departmentId = localStorage.getItem('selectedDepartmentId');
    const indicatorId = localStorage.getItem('selectedIndicatorId');

    if (!departmentId || !indicatorId) {
        showToast('Selecione um departamento e um indicador antes de salvar.', 5000);
        return;
    }

    const existingRecord = (await loadCauseConsequenceData()).find(item => 
        item.type === type &&
        item.department_id === departmentId &&
        item.indicator_id === indicatorId &&
        item.period_type === currentFilters.periodo &&
        item.year === currentFilters.ano &&
        (currentFilters.periodo === 'mes' ? item.month === currentFilters.mes : item.cycle === currentFilters.ciclo)
    );

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
                period_type: currentFilters.periodo,
                month: currentFilters.mes,
                cycle: currentFilters.ciclo,
                year: currentFilters.ano,
                type: type,
                content: content,
                attachments: attachments
            });
        if (error) throw error;
    }
}


// Função para voltar para a página de departamentos (se existir)
function goBackToDepartments() {
    console.log('Navegar de volta para a página de departamentos');
    showToast('Funcionalidade de "Alterar Departamento" não implementada neste exemplo.', 3000);
}


function viewAttachment(url, type) {
    const fileExtension = url.split(".").pop().toLowerCase();
    if (type.startsWith("image/") || ["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
        // Para imagens, abrir em um modal simples ou nova aba
        window.open(url, "_blank");
    } else if (type === "application/pdf" || fileExtension === "pdf") {
        // Para PDFs, abrir em uma nova aba
        window.open(url, "_blank");
    } else {
        showToast("Este tipo de arquivo não pode ser visualizado diretamente.", 3000);
    }
}

