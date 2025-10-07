

/**
 * Funções para interação com as tabelas de metas e resultados no Supabase
 */

/**
 * Salva uma meta de período fixo no Supabase.
 * @param {object} goalData - Dados da meta.
 * @param {string} goalData.indicator_id - ID do indicador.
 * @param {string} [goalData.department_id] - ID do departamento (opcional).
 * @param {string} [goalData.responsible_id] - ID do responsável (opcional).
 * @param {string} goalData.period_type_id - ID do tipo de período (Mensal, Anual, etc.).
 * @param {number} goalData.year - Ano da meta.
 * @param {number} [goalData.month] - Mês da meta (1-12, opcional).
 * @param {string} [goalData.goal_type_id] - ID do tipo da meta (dias, %, moeda).
 * @param {number} goalData.goal_value - Valor planejado da meta.
 * @param {string} [goalData.updated_by] - ID do usuário que alterou.
 * @returns {Promise<object|null>} O objeto da meta salva ou null em caso de erro.
 */


async function saveFixedGoalToSupabase(goalData) {
    const departmentId = goalData.departmentId;
    const responsibleId = goalData.responsibleId;
    try {
        const { data, error } = await supabase
            .from("indicator_goals")
            .insert([
                {
                    indicator_id: goalData.indicator_id,
                    department_id: departmentId,
                    responsible_id: responsibleId,
                    period_type_id: goalData.period_type_id,
                    year: goalData.year,
                    month: goalData.month,
                    goal_type_id: goalData.goal_type_id,
                    goal_value: goalData.goal_value,
                    goal_limit_type: goalData.goalLimitType,
                    updated_by: goalData.updated_by,
                },
            ])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Erro ao salvar meta fixa:", error);
        showToast("Erro ao salvar meta fixa no banco de dados", 4000);
        return null;
    }
}

/**
 * Salva uma meta de ciclo personalizado no Supabase.
 * @param {object} goalData - Dados da meta de ciclo.
 * @param {string} goalData.indicator_id - ID do indicador.
 * @param {string} [goalData.department_id] - ID do departamento (opcional).
 * @param {string} [goalData.responsible_id] - ID do responsável (opcional).
 * @param {string} goalData.period_type_id - ID do tipo de período ('Ciclo').
 * @param {number} goalData.cycle - Número ou identificador do ciclo.
 * @param {string} goalData.start_date - Data de início do ciclo (formato 'YYYY-MM-DD').
 * @param {string} goalData.end_date - Data de fim do ciclo (formato 'YYYY-MM-DD').
 * @param {string} [goalData.goal_type_id] - ID do tipo da meta (dias, %, moeda).
 * @param {number} goalData.goal_value - Valor planejado da meta.
 * @param {string} [goalData.updated_by] - ID do usuário que alterou.
 * @returns {Promise<object|null>} O objeto da meta de ciclo salva ou null em caso de erro.
 */
async function saveCycleGoalToSupabase(goalData) {
    const departmentId = goalData.departmentId;
    const responsibleId = goalData.responsibleId;
    try {
        const { data, error } = await supabase
            .from("indicator_cycle_goals")
            .insert([
                {
                    indicator_id: goalData.indicator_id,
                    department_id: departmentId,
                    responsible_id: responsibleId,
                    period_type_id: goalData.period_type_id,
                    cycle: goalData.cycle,
                    start_date: goalData.start_date,
                    end_date: goalData.end_date,
                    goal_type_id: goalData.goal_type_id,
                    goal_value: goalData.goal_value,
                    goal_limit_type: goalData.goalLimitType,
                    updated_by: goalData.updated_by,
                },
            ])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Erro ao salvar meta de ciclo:", error);
        showToast("Erro ao salvar meta de ciclo no banco de dados", 4000);
        return null;
    }
}

/**
 * Salva um resultado de período fixo no Supabase.
 * @param {object} resultData - Dados do resultado.
 * @param {string} resultData.indicator_id - ID do indicador.
 * @param {string} [resultData.department_id] - ID do departamento (opcional).
 * @param {string} [resultData.responsible_id] - ID do responsável (opcional).
 * @param {string} resultData.period_type_id - ID do tipo de período (Mensal, Anual, etc.).
 * @param {number} resultData.year - Ano do resultado.
 * @param {number} [resultData.month] - Mês do resultado (1-12, opcional).
 * @param {number} resultData.result_value - Valor realizado.
 * @param {string} [resultData.updated_by] - ID do usuário que alterou.
 * @returns {Promise<object|null>} O objeto do resultado salvo ou null em caso de erro.
 */
async function saveFixedResultToSupabase(resultData) {
    const departmentId = resultData.departmentId;
    const responsibleId = resultData.responsibleId;
    try {
        const { data, error } = await supabase
            .from("indicator_results")
            .insert([
                {
                    indicator_id: resultData.indicator_id,
                    department_id: departmentId,
                    responsible_id: responsibleId,
                    period_type_id: resultData.period_type_id,
                    year: resultData.year,
                    month: resultData.month,
                    result_value: resultData.result_value,
                    updated_by: resultData.updated_by,
                },
            ])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Erro ao salvar resultado fixo:", error);
        showToast("Erro ao salvar resultado fixo no banco de dados", 4000);
        return null;
    }
}

/**
 * Salva um resultado de ciclo personalizado no Supabase.
 * @param {object} resultData - Dados do resultado de ciclo.
 * @param {string} resultData.indicator_id - ID do indicador.
 * @param {string} [resultData.department_id] - ID do departamento (opcional).
 * @param {string} [resultData.responsible_id] - ID do responsável (opcional).
 * @param {string} resultData.period_type_id - ID do tipo de período ('Ciclo').
 * @param {number} resultData.cycle - Número ou identificador do ciclo.
 * @param {string} resultData.start_date - Data de início do ciclo (formato 'YYYY-MM-DD').
 * @param {string} resultData.end_date - Data de fim do ciclo (formato 'YYYY-MM-DD').
 * @param {number} resultData.result_value - Valor realizado.
 * @param {string} [resultData.updated_by] - ID do usuário que alterou.
 * @returns {Promise<object|null>} O objeto do resultado de ciclo salvo ou null em caso de erro.
 */
async function saveCycleResultToSupabase(resultData) {
    const departmentId = resultData.departmentId;
    const responsibleId = resultData.responsibleId;
    try {
        const { data, error } = await supabase
            .from("indicator_cycle_results")
            .insert([
                {
                    indicator_id: resultData.indicator_id,
                    department_id: departmentId,
                    responsible_id: responsibleId,
                    period_type_id: resultData.period_type_id,
                    cycle: resultData.cycle,
                    start_date: resultData.start_date,
                    end_date: resultData.end_date,
                    result_value: resultData.result_value,
                    updated_by: resultData.updated_by,
                },
            ])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Erro ao salvar resultado de ciclo:", error);
        showToast("Erro ao salvar resultado de ciclo no banco de dados", 4000);
        return null;
    }
}

// Funções auxiliares para buscar IDs de tabelas de lookup

/**
 * Busca o ID de um indicador pelo nome.
 * @param {string} indicatorName - Nome do indicador.
 * @returns {Promise<string|null>} O ID do indicador ou null se não encontrado.
 */
async function getIndicatorIdByName(indicatorName) {
    try {
        const { data, error } = await supabase
            .from("indicators")
            .select("id")
            .eq("name", indicatorName)
            .single();
        if (error && error.code !== "PGRST116") throw error; // Ignorar erro se tabela não existe, mas lançar outros
        return data ? data.id : null;
    } catch (error) {
        console.error("Erro ao buscar ID do indicador:", error);
        return null;
    }
}

/**
 * Busca o ID de um tipo de período pelo nome.
 * @param {string} periodName - Nome do tipo de período (ex: 'Mensal', 'Ciclo').
 * @returns {Promise<string|null>} O ID do tipo de período ou null se não encontrado.
 */
async function getPeriodTypeIdByName(periodName) {
    try {
        const { data, error } = await supabase
            .from("indicator_periods")
            .select("id")
            .eq("name", periodName)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data ? data.id : null;
    } catch (error) {
        console.error("Erro ao buscar ID do tipo de período:", error);
        return null;
    }
}

/**
 * Busca o ID de um tipo de meta pelo nome.
 * @param {string} goalTypeName - Nome do tipo de meta (ex: 'Dias', 'Percentual').
 * @returns {Promise<string|null>} O ID do tipo de meta ou null se não encontrado.
 */
async function getGoalTypeIdByName(goalTypeName) {
    try {
        const { data, error } = await supabase
            .from("indicator_types")
            .select("id")
            .eq("name", goalTypeName)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data ? data.id : null;
    } catch (error) {
        console.error("Erro ao buscar ID do tipo de meta:", error);
        return null;
    }
}

/**
 * Busca o ID de um usuário pelo nome.
 * ATENÇÃO: Esta função assume que 'users' tem uma coluna 'name' e que os nomes são únicos.
 * Em um ambiente real, seria melhor usar o ID do usuário logado ou um mecanismo de busca mais robusto.
 * @param {string} userName - Nome do usuário.
 * @returns {Promise<string|null>} O ID do usuário ou null se não encontrado.
 */
async function getUserIdByName(userName) {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("id")
            .eq("name", userName)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data ? data.id : null;
    } catch (error) {
        console.error("Erro ao buscar ID do usuário:", error);
        return null;
    }
}

/**
 * Busca o ID de um departamento pelo nome.
 * ATENÇÃO: Esta função assume que 'departments' tem uma coluna 'name' e que os nomes são únicos.
 * @param {string} departmentName - Nome do departamento.
 * @returns {Promise<string|null>} O ID do departamento ou null se não encontrado.
 */
async function getDepartmentIdByName(departmentName) {
    try {
        const { data, error } = await supabase
            .from("departments")
            .select("id")
            .eq("name", departmentName)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data ? data.id : null;
    } catch (error) {
        console.error("Erro ao buscar ID do departamento:", error);
        return null;
    }
}

/**
 * Busca o tipo de indicador (name) de um indicador pelo nome do indicador.
 * @param {string} indicatorName - Nome do indicador.
 * @returns {Promise<string|null>} O nome do tipo de indicador ou null se não encontrado.
 */
async function getIndicatorTypeNameByIndicatorName(indicatorName) {
    try {
        const { data, error } = await supabase
            .from("indicators")
            .select("indicator_type:indicator_types(name)")
            .eq("name", indicatorName)
            .single();
        if (error && error.code !== "PGRST116") throw error; // Ignorar erro se tabela não existe, mas lançar outros
        return data && data.indicator_type ? data.indicator_type.name : null;
    } catch (error) {
        console.error("Erro ao buscar tipo de indicador pelo nome do indicador:", error);
        return null;
    }
}

/**
 * Busca todos os indicadores com seus tipos.
 * @returns {Promise<Array<object>>} Uma lista de objetos de indicador com seus IDs e nomes de tipo.
 */
async function getAllIndicatorsWithTypes() {
    try {
        const { data, error } = await supabase
            .from("indicators")
            .select("id, name, indicator_type:indicator_types(name)")
            .order("name", { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Erro ao carregar indicadores com tipos:", error);
        return [];
    }
}



/**
 * Obtém o ID do usuário autenticado do Supabase.
 * @returns {Promise<string|null>} O ID do usuário autenticado ou null se não houver usuário logado.
 */
async function getAuthenticatedUserId() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user ? user.id : null;
    } catch (error) {
        console.error("Erro ao obter usuário autenticado:", error);
        return null;
    }
}

/**
 * Obtém o ID do departamento selecionado do localStorage.
 * @returns {string|null} O ID do departamento ou null se não houver departamento selecionado.
 */
function getSelectedDepartmentId() {
    return localStorage.getItem("selectedDepartmentId");
}



// ============================================
// FUNÇÕES PARA CARREGAR DADOS DOS FILTROS DINAMICAMENTE
// ============================================

/**
 * Carrega todos os indicadores para popular o filtro dinamicamente.
 * @returns {Promise<Array<object>>} Lista de indicadores com id e name.
 */
async function loadIndicatorsForFilter() {
    try {
        // Obter o ID do departamento selecionado do localStorage
        const selectedDepartmentId = localStorage.getItem("selectedDepartmentId");
        
        // Construir a query base
        let query = supabase
            .from("indicators")
            .select("id, name");
        
        // Se houver departamento selecionado, filtrar por ele
        if (selectedDepartmentId) {
            query = query.eq("department_id", selectedDepartmentId);
        }
        
        // Ordenar por nome
        query = query.order("name", { ascending: true });
        
        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Erro ao carregar indicadores para filtro:", error);
        return [];
    }
}

/**
 * Carrega todos os responsáveis (usuários) para popular o filtro dinamicamente.
 * @returns {Promise<Array<object>>} Lista de usuários com id e name.
 */
async function loadResponsiblesForFilter() {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("id, name")
            .order("name", { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Erro ao carregar responsáveis para filtro:", error);
        return [];
    }
}

/**
 * Carrega todos os departamentos para popular o filtro dinamicamente.
 * @returns {Promise<Array<object>>} Lista de departamentos com id e name.
 */
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

/**
 * Carrega todos os anos únicos dos dados de indicadores para popular o filtro dinamicamente.
 * @returns {Promise<Array<number>>} Lista de anos únicos ordenados.
 */
async function loadYearsForFilter() {
    try {
        // Buscar anos únicos das tabelas de metas e resultados
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
        
        // Adicionar anos das metas
        if (goalsData.data) {
            goalsData.data.forEach(item => {
                if (item.year) years.add(item.year);
            });
        }
        
        // Adicionar anos dos resultados
        if (resultsData.data) {
            resultsData.data.forEach(item => {
                if (item.year) years.add(item.year);
            });
        }

        // Converter para array e ordenar
        return Array.from(years).sort((a, b) => b - a); // Ordem decrescente (mais recente primeiro)
    } catch (error) {
        console.error("Erro ao carregar anos para filtro:", error);
        return [];
    }
}



/**
 * Busca o nome de um indicador pelo ID.
 * @param {string} indicatorId - ID do indicador.
 * @returns {Promise<string|null>} O nome do indicador ou null se não encontrado.
 */
async function getIndicatorNameById(indicatorId) {
    try {
        const { data, error } = await supabase
            .from("indicators")
            .select("name")
            .eq("id", indicatorId)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data ? data.name : null;
    } catch (error) {
        console.error("Erro ao buscar nome do indicador pelo ID:", error);
        return null;
    }
}



/**
 * Busca o nome do tipo de indicador pelo ID do indicador.
 * @param {string} indicatorId - ID do indicador.
 * @returns {Promise<string|null>} O nome do tipo de indicador ou null se não encontrado.
 */
async function getIndicatorTypeNameById(indicatorId) {
    try {
        const { data, error } = await supabase
            .from("indicators")
            .select("indicator_type:indicator_types(name)")
            .eq("id", indicatorId)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data && data.indicator_type ? data.indicator_type.name : null;
    } catch (error) {
        console.error("Erro ao buscar tipo de indicador pelo ID do indicador:", error);
        return null;
    }
}



/**
 * Busca o nome de um indicador pelo ID.
 * @param {string} indicatorId - ID do indicador.
 * @returns {Promise<string|null>} O nome do indicador ou null se não encontrado.
 */
async function getIndicatorNameById(indicatorId) {
    try {
        const { data, error } = await supabase
            .from("indicators")
            .select("name")
            .eq("id", indicatorId)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data ? data.name : null;
    } catch (error) {
        console.error("Erro ao buscar nome do indicador:", error);
        return null;
    }
}


/**
 * Busca o nome do tipo de indicador pelo ID.
 * @param {string} indicatorTypeId - ID do tipo de indicador.
 * @returns {Promise<string|null>} O nome do tipo de indicador ou null se não encontrado.
 */
async function getIndicatorTypeById(indicatorTypeId) {
    try {
        const { data, error } = await supabase
            .from("indicator_types")
            .select("name")
            .eq("id", indicatorTypeId)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data ? data.name : null;
    } catch (error) {
        console.error("Erro ao buscar nome do tipo de indicador:", error);
        return null;
    }
}



/**
 * Faz upload de um arquivo para o bucket do Supabase.
 * @param {File} file - O objeto File a ser enviado.
 * @param {string} fileName - O nome do arquivo no bucket.
 * @returns {Promise<string>} A URL pública do arquivo enviado.
 */
/**
 * Faz upload de um arquivo para o bucket do Supabase.
 * @param {File} file - O objeto File a ser enviado.
 * @param {string} fileName - O nome do arquivo no bucket.
 * @returns {Promise<string>} A URL pública do arquivo enviado.
 */



// ============================================
// FUNÇÕES PARA MODAL DE DETALHES DO PLANO
// ============================================

/**
 * Busca detalhes completos de um plano de ação específico
 * @param {string} planId - ID do plano de ação
 * @returns {Promise<object|null>} Dados completos do plano ou null em caso de erro
 */
async function getPlanDetailsFromSupabase(planId) {
    try {
        const { data, error } = await supabase
            .from('action_plans')
            .select(`
                *,
                assignee:users(id, name),
                department:departments(id, name),
                status:action_plan_statuses(id, name),
                indicator:indicators(id, name)
            `)
            .eq('id', planId)
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Erro ao buscar detalhes do plano:', error);
        return null;
    }
}

/**
 * Busca todas as tarefas de um plano de ação específico
 * @param {string} planId - ID do plano de ação
 * @returns {Promise<Array|null>} Lista de tarefas ou null em caso de erro
 */
async function getPlanTasksFromSupabase(planId) {
    try {
        const { data, error } = await supabase
            .from('action_plan_tasks')
            .select('*')
            .eq('action_plan_id', planId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar tarefas do plano:', error);
        return null;
    }
}

/**
 * Busca todos os anexos de um plano de ação específico
 * @param {string} planId - ID do plano de ação
 * @returns {Promise<Array|null>} Lista de anexos ou null em caso de erro
 */
async function getPlanAttachmentsFromSupabase(planId) {
    try {
        const { data, error } = await supabase
            .from('action_plan_attachments')
            .select('*')
            .eq('action_plan_id', planId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar anexos do plano:', error);
        return null;
    }
}

/**
 * Atualiza o status de conclusão de uma tarefa
 * @param {string} taskId - ID da tarefa
 * @param {boolean} completed - Status de conclusão
 * @returns {Promise<boolean>} True se a atualização foi bem-sucedida, false caso contrário
 */
async function updateTaskCompletionInSupabase(taskId, completed) {
    try {
        const { error } = await supabase
            .from('action_plan_tasks')
            .update({ 
                completed: completed,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId);
        
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Erro ao atualizar conclusão da tarefa:', error);
        return false;
    }
}

/**
 * Salva uma nova tarefa para um plano de ação
 * @param {string} planId - ID do plano de ação
 * @param {string} description - Descrição da tarefa
 * @returns {Promise<object|null>} Dados da tarefa criada ou null em caso de erro
 */
async function saveTaskToSupabase(planId, description) {
    try {
        const { data, error } = await supabase
            .from('action_plan_tasks')
            .insert([{
                action_plan_id: planId,
                description: description,
                completed: false,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
        return null;
    }
}

/**
 * Remove uma tarefa do banco de dados
 * @param {string} taskId - ID da tarefa
 * @returns {Promise<boolean>} True se a remoção foi bem-sucedida, false caso contrário
 */
async function deleteTaskFromSupabase(taskId) {
    try {
        const { error } = await supabase
            .from('action_plan_tasks')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        return false;
    }
}

/**
 * Salva um novo anexo para um plano de ação
 * @param {string} planId - ID do plano de ação
 * @param {string} fileName - Nome do arquivo
 * @param {string} fileUrl - URL do arquivo
 * @returns {Promise<object|null>} Dados do anexo criado ou null em caso de erro
 */
async function saveAttachmentToSupabase(planId, fileName, fileUrl) {
    try {
        const { data, error } = await supabase
            .from('action_plan_attachments')
            .insert([{
                action_plan_id: planId,
                file_name: fileName,
                file_url: fileUrl,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Erro ao salvar anexo:', error);
        return null;
    }
}

/**
 * Remove um anexo do banco de dados
 * @param {string} attachmentId - ID do anexo
 * @returns {Promise<boolean>} True se a remoção foi bem-sucedida, false caso contrário
 */
async function deleteAttachmentFromSupabase(attachmentId) {
    try {
        const { error } = await supabase
            .from('action_plan_attachments')
            .delete()
            .eq('id', attachmentId);
        
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Erro ao deletar anexo:', error);
        return false;
    }
}

// ============================================
// FUNÇÕES PARA EDIÇÃO DE PLANOS DE AÇÃO
// ============================================

/**
 * Atualiza um plano de ação existente no Supabase
 * @param {string} planId - ID do plano de ação
 * @param {object} planData - Dados atualizados do plano
 * @returns {Promise<object|null>} Dados do plano atualizado ou null em caso de erro
 */
async function updateActionPlanInSupabase(planId, planData) {
    try {
        // Converter status para ID se necessário
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
            .update({
                title: planData.title,
                description: planData.description,
                start_date: planData.start_date,
                end_date: planData.end_date,
                assignee_id: planData.assignee_id,
                department_id: planData.department_id,
                status_id: statusId,
                indicator_id: planData.indicator_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', planId)
            .select(`
                *,
                assignee:users(name),
                department:departments(name),
                status:action_plan_statuses(name),
                indicator:indicators(name)
            `);
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('Erro ao atualizar plano de ação:', error);
        return null;
    }
}

/**
 * Atualiza uma tarefa existente
 * @param {string} taskId - ID da tarefa
 * @param {string} description - Nova descrição da tarefa
 * @param {boolean} completed - Status de conclusão
 * @returns {Promise<boolean>} True se a atualização foi bem-sucedida
 */
async function updateTaskInSupabase(taskId, description, completed) {
    try {
        const { error } = await supabase
            .from('action_plan_tasks')
            .update({
                description: description,
                completed: completed,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId);
        
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        return false;
    }
}

/**
 * Sincroniza tarefas de um plano (adiciona novas, atualiza existentes, remove deletadas)
 * @param {string} planId - ID do plano de ação
 * @param {Array} tasks - Array de tarefas do formulário
 * @returns {Promise<boolean>} True se a sincronização foi bem-sucedida
 */
async function syncPlanTasks(planId, tasks) {
    try {
        // Buscar tarefas existentes no banco
        const existingTasks = await getPlanTasksFromSupabase(planId);
        const existingTaskIds = existingTasks.map(task => task.id);
        
        // Processar tarefas do formulário
        const formTaskIds = [];
        
        for (const task of tasks) {
            if (task.id && task.id !== '') {
                // Tarefa existente - atualizar
                formTaskIds.push(task.id);
                await updateTaskInSupabase(task.id, task.description, task.completed);
            } else {
                // Nova tarefa - criar
                const newTask = await saveTaskToSupabase(planId, task.description);
                if (newTask) {
                    formTaskIds.push(newTask.id);
                }
            }
        }
        
        // Remover tarefas que não estão mais no formulário
        const tasksToDelete = existingTaskIds.filter(id => !formTaskIds.includes(id));
        for (const taskId of tasksToDelete) {
            await deleteTaskFromSupabase(taskId);
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao sincronizar tarefas:', error);
        return false;
    }
}

/**
 * Sincroniza anexos de um plano (adiciona novos, remove deletados)
 * @param {string} planId - ID do plano de ação
 * @param {Array} attachments - Array de anexos do formulário
 * @returns {Promise<boolean>} True se a sincronização foi bem-sucedida
 */
async function syncPlanAttachments(planId, attachments) {
    try {
        // Buscar anexos existentes no banco
        const existingAttachments = await getPlanAttachmentsFromSupabase(planId);
        const existingAttachmentIds = existingAttachments.map(att => att.id);
        
        // Processar anexos do formulário
        const formAttachmentIds = [];
        
        for (const attachment of attachments) {
            if (attachment.id && attachment.id !== '') {
                // Anexo existente - manter
                formAttachmentIds.push(attachment.id);
            } else {
                // Novo anexo - criar
                const newAttachment = await saveAttachmentToSupabase(
                    planId, 
                    attachment.fileName, 
                    attachment.fileUrl
                );
                if (newAttachment) {
                    formAttachmentIds.push(newAttachment.id);
                }
            }
        }
        
        // Remover anexos que não estão mais no formulário
        const attachmentsToDelete = existingAttachmentIds.filter(id => !formAttachmentIds.includes(id));
        for (const attachmentId of attachmentsToDelete) {
            await deleteAttachmentFromSupabase(attachmentId);
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao sincronizar anexos:', error);
        return false;
    }
}

/**
 * Busca todos os usuários para popular o select de responsáveis
 * @returns {Promise<Array>} Lista de usuários
 */
async function getAllUsersFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

/**
 * Busca todos os departamentos para popular o select
 * @returns {Promise<Array>} Lista de departamentos
 */
async function getAllDepartmentsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('departments')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
        return [];
    }
}

/**
 * Busca todos os status de planos de ação para popular o select
 * @returns {Promise<Array>} Lista de status
 */
async function getAllActionPlanStatusesFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('action_plan_statuses')
            .select('id, name')
            .order('ordem', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar status de planos:', error);
        return [];
    }
}

/**
 * Busca todos os indicadores para popular o select
 * @returns {Promise<Array>} Lista de indicadores
 */
async function getAllIndicatorsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('indicators')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar indicadores:', error);
        return [];
    }
}
