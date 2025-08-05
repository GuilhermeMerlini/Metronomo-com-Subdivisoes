// src/scripts/UI.js

// --- Módulo de Interface do Usuário (UI) ---

// Objeto para guardar as referências aos elementos do DOM
// Isso evita que o módulo precise fazer querySelector o tempo todo
let elements = {};

/**
 * Inicializa o módulo da UI, guardando as referências aos elementos do DOM.
 * @param {object} domElements - Um objeto contendo todos os elementos da página.
 */
function init(domElements) {
    elements = domElements;
}

/**
 * Desenha os círculos do visualizador de batidas.
 * @param {number} beatsPerMeasure - O número de círculos a serem desenhados.
 */
function drawBeatVisualizer(beatsPerMeasure) {
    if (!elements.beatVisualizer) return;
    elements.beatVisualizer.innerHTML = ''; // Limpa os círculos antigos
    for (let i = 0; i < beatsPerMeasure; i++) {
        const circleSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-8">
                <circle cx="12" cy="12" r="10" class="fill-gray-600 transition-colors duration-100" data-beat-index="${i + 1}" />
            </svg>
        `;
        elements.beatVisualizer.innerHTML += circleSvg;
    }
}

/**
 * "Acende" o círculo correspondente à batida atual.
 * @param {number} beatInMeasure - O número da batida atual (1-indexed).
 */
function updateActiveBeat(beatInMeasure) {
    if (!elements.beatVisualizer) return;
    // Reseta todos os círculos para o estado inativo
    elements.beatVisualizer.querySelectorAll('circle[data-beat-index]').forEach(circle => {
        circle.classList.remove('fill-cyan-500');
        circle.classList.add('fill-gray-600');
    });
    
    // Ativa o círculo correto
    const activeCircle = elements.beatVisualizer.querySelector(`circle[data-beat-index="${beatInMeasure}"]`);
    if (activeCircle) {
        activeCircle.classList.remove('fill-gray-600');
        activeCircle.classList.add('fill-cyan-500');
    }
}

/**
 * Atualiza o display de BPM (input e slider).
 * @param {number} bpm - O novo valor de BPM.
 */
function updateBpmDisplay(bpm) {
    if (elements.bpmInput) elements.bpmInput.value = bpm;
    if (elements.bpmSlider) elements.bpmSlider.value = bpm;
}

/**
 * Atualiza o número de um dos displays de volume.
 * @param {'accent' | 'normal' | 'subdivision'} type - O tipo de volume.
 * @param {number} value - O novo valor (0-100).
 */
function updateVolumeDisplay(type, value) {
    const displayElement = elements[`${type}VolumeValue`];
    if (displayElement) {
        displayElement.textContent = value;
    }
}

/**
 * Mostra ou esconde o painel de volumes.
 */
function toggleVolumePanel() {
    if (!elements.volumeControls || !elements.mixerArrow) return;
    const isHidden = elements.volumeControls.classList.toggle('hidden');
    elements.mixerArrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
}

/**
 * Lê todos os valores de configuração atuais da interface.
 * @returns {object} Um objeto com todas as configurações.
 */
function getSettings() {
    return {
        bpm: parseInt(elements.bpmInput.value, 10),
        beatsPerMeasure: parseInt(elements.compassSelect.value.split('/')[0], 10),
        subdivision: parseInt(elements.subdivisionSelect.value, 10),
        accentEnabled: elements.accentCheckbox.checked
    };
}


// --- API Pública do Módulo ---
// Exportamos as funções que o main.js precisa para interagir com a UI.
export const UI = {
    init,
    drawBeatVisualizer,
    updateActiveBeat,
    updateBpmDisplay,
    updateVolumeDisplay,
    toggleVolumePanel,
    getSettings,
};