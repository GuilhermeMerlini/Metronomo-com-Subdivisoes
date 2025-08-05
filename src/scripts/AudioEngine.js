// src/scripts/AudioEngine.js

// --- Módulo da Engine de Áudio ---

// O estado interno da nossa engine. Tudo que precisa ser guardado e modificado.
const state = {
    isPlaying: false,
    bpm: 120,
    beatsPerMeasure: 4,
    subdivision: 1,
    accentEnabled: true,
    audioContext: null,
    schedulerTimerID: null,
    nextNoteTime: 0.0,
    currentBeatInMeasure: 1,
    currentSubdivisionInBeat: 1,
    onBeatCallback: () => {}, // Callback para a animação visual
};

// Nós de áudio que usaremos
const nodes = {
    accentGain: null,
    normalGain: null,
    subdivisionGain: null,
};

// Buffers com os dados dos sons carregados
const buffers = {
    accent: null,
    normal: null,
    subdivision: null,
};

// Constantes de agendamento
const scheduleAheadTime = 0.1;    // segundos
const schedulerFrequency = 25.0;  // milissegundos

/**
 * Inicializa a AudioContext e os GainNodes.
 * Deve ser chamado uma vez, de preferência após uma interação do usuário.
 */
function init() {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    nodes.accentGain = state.audioContext.createGain();
    nodes.normalGain = state.audioContext.createGain();
    nodes.subdivisionGain = state.audioContext.createGain();

    nodes.accentGain.connect(state.audioContext.destination);
    nodes.normalGain.connect(state.audioContext.destination);
    nodes.subdivisionGain.connect(state.audioContext.destination);
}

/**
 * Carrega um único arquivo de som.
 * @param {string} url - O caminho para o arquivo de som.
 * @returns {Promise<AudioBuffer>}
 */
async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await state.audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Carrega todos os sons necessários para o metrônomo.
 */
async function loadAllSounds() {
    try {
        [buffers.accent, buffers.normal, buffers.subdivision] = await Promise.all([
            loadSound('sounds/acento.wav'),
            loadSound('sounds/normal.wav'),
            loadSound('sounds/sub.wav').catch(() => null) // Permite que o som de subdivisão falhe graciosamente
        ]);
        console.log("Áudios carregados com sucesso.");
    } catch (error) {
        console.error("Erro ao carregar os áudios:", error);
    }
}

/**
 * Agenda uma única nota para tocar em um tempo futuro preciso.
 * @param {number} time - O tempo exato do audioContext para a nota tocar.
 */
function scheduleNote(time) {
    let bufferToPlay;
    let gainNodeToUse;

    // Lógica para decidir qual som e qual volume usar
    if (state.currentSubdivisionInBeat === 1) { // Pulso principal
        if (state.accentEnabled && state.currentBeatInMeasure === 1) {
            bufferToPlay = buffers.accent;
            gainNodeToUse = nodes.accentGain;
        } else {
            bufferToPlay = buffers.normal;
            gainNodeToUse = nodes.normalGain;
        }
        // Dispara o callback para a UI atualizar o visualizador
        if (state.onBeatCallback) {
            state.onBeatCallback(state.currentBeatInMeasure, time);
        }
    } else { // Subdivisão
        bufferToPlay = buffers.subdivision || buffers.normal; // Usa som de sub ou normal se o de sub não existir
        gainNodeToUse = nodes.subdivisionGain;
    }

    if (!bufferToPlay) return;

    const source = state.audioContext.createBufferSource();
    source.buffer = bufferToPlay;
    source.connect(gainNodeToUse);
    source.start(time);
}

/**
 * Avança o estado do metrônomo para a próxima nota (subdivisão).
 */
function advanceNote() {
    const secondsPerBeat = 60.0 / state.bpm;
    const secondsPerSubdivision = secondsPerBeat / state.subdivision;

    state.nextNoteTime += secondsPerSubdivision;

    state.currentSubdivisionInBeat++;
    if (state.currentSubdivisionInBeat > state.subdivision) {
        state.currentSubdivisionInBeat = 1;
        state.currentBeatInMeasure++;
        if (state.currentBeatInMeasure > state.beatsPerMeasure) {
            state.currentBeatInMeasure = 1;
        }
    }
}

/**
 * O loop principal que agenda as notas em avanço.
 */
function scheduler() {
    while (state.nextNoteTime < state.audioContext.currentTime + scheduleAheadTime) {
        scheduleNote(state.nextNoteTime);
        advanceNote();
    }
}

/**
 * Inicia o metrônomo com as configurações fornecidas.
 * @param {object} settings - As configurações da UI.
 */
function start(settings) {
    if (state.isPlaying) return;
    if (!state.audioContext) {
        init();
    }
    
    // Garante que o audio context seja resumido (necessário em alguns navegadores)
    if (state.audioContext.state === 'suspended') {
        state.audioContext.resume();
    }
    
    state.isPlaying = true;

    // Atualiza o estado da engine com as configurações da UI
    state.bpm = settings.bpm;
    state.beatsPerMeasure = settings.beatsPerMeasure;
    state.subdivision = settings.subdivision;
    state.accentEnabled = settings.accentEnabled;
    
    // Reseta os contadores
    state.currentBeatInMeasure = 1;
    state.currentSubdivisionInBeat = 1;
    state.nextNoteTime = state.audioContext.currentTime + 0.1; // Começa em 100ms

    // Inicia o loop do agendador
    state.schedulerTimerID = setInterval(scheduler, schedulerFrequency);
}

/**
 * Para o metrônomo.
 */
function stop() {
    state.isPlaying = false;
    clearInterval(state.schedulerTimerID);
}

/**
 * Define o volume de um canal de áudio.
 * @param {'accent' | 'normal' | 'subdivision'} type - O canal a ser alterado.
 * @param {number} value - O novo volume (0-100).
 */
function setVolume(type, value) {
    if (!nodes[`${type}Gain`]) return;
    const gainValue = parseFloat(value) / 100;
    nodes[`${type}Gain`].gain.linearRampToValueAtTime(gainValue, state.audioContext.currentTime + 0.05);
}

/**
 * Define a função de callback a ser chamada a cada batida principal.
 * @param {function} callback - A função a ser chamada. Ex: (beatNumber, time) => { ... }
 */
function setOnBeatCallback(callback) {
    state.onBeatCallback = callback;
}

/**
 * Retorna a instância do AudioContext para cálculos de tempo externos.
 * @returns {AudioContext}
 */
function getAudioContext() {
    return state.audioContext;
}

/**
 * Atualiza o BPM do metrônomo.
 * @param {number} newBPM - O novo valor de BPM.
 */
function updateBPM(newBPM) {
    state.bpm = newBPM;
}

/** * Atualiza a subdivisão do metrônomo.
 * @param {number} newSubdivision - O novo valor de subdivisão.
 */
function updateSubdivision(newSubdivision) {
    state.subdivision = newSubdivision;
}

function setAccent(isChecked) {
    state.accentEnabled = isChecked;
}

function updateBeatsPerMeasure(newBeats) {
    state.beatsPerMeasure = newBeats;
}

// --- API Pública do Módulo ---
// Exportamos apenas as funções que o main.js precisa para controlar a engine.
export const AudioEngine = {
    init,
    loadAllSounds,
    start,
    stop,
    setVolume,
    setOnBeatCallback,
    // Expõe o estado 'isPlaying' de forma segura (somente leitura)
    isPlaying: () => state.isPlaying,
    getAudioContext,
    updateBPM,
    updateSubdivision,
    setAccent,
    updateBeatsPerMeasure
};