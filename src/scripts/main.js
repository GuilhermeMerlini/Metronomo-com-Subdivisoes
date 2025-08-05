import { AudioEngine } from './AudioEngine.js';
import { UI } from './UI.js';

document.addEventListener('DOMContentLoaded', function() {
    // --- 1. CAPTURA DE TODOS OS ELEMENTOS DO DOM ---
    const elements = {
        startButton: document.getElementById('startButton'),
        stopButton: document.getElementById('stopButton'),
        beatVisualizer: document.getElementById('beatVisualizer'),
        bpmInput: document.getElementById('bpmInput'),
        bpmSlider: document.getElementById('bpmSlider'),
        tapButton: document.getElementById('tapButton'),
        compassSelect: document.getElementById('compassSelect'),
        subdivisionSelect: document.getElementById('subdivisionSelect'),
        accentCheckbox: document.getElementById('accentCheckbox'),
        accentVolumeSlider: document.getElementById('accentVolume'),
        normalVolumeSlider: document.getElementById('normalVolume'),
        subdivisionVolumeSlider: document.getElementById('subdivisionVolume'),
        accentVolumeValue: document.getElementById('accentVolumeValue'),
        normalVolumeValue: document.getElementById('normalVolumeValue'),
        subdivisionVolumeValue: document.getElementById('subdivisionVolumeValue'),
        toggleButton: document.getElementById('toggleVolumes'),
        volumeControls: document.getElementById('volumeControls'),
        mixerArrow: document.getElementById('mixerArrow'),
    };

    let areSoundsLoaded = false;

    // --- 2. FUNÇÕES DE INICIALIZAÇÃO E HELPERS ---
    
    /**
     * Carrega as configurações de volume salvas no localStorage e as aplica.
     */
    function loadAndApplySettings() {
        const volumeSettings = {
            'accentVolume': { slider: elements.accentVolumeSlider, type: 'accent' },
            'normalVolume': { slider: elements.normalVolumeSlider, type: 'normal' },
            'subdivisionVolume': { slider: elements.subdivisionVolumeSlider, type: 'subdivision' }
        };

        for (const key in volumeSettings) {
            const savedValue = localStorage.getItem(key);
            if (savedValue !== null) {
                const setting = volumeSettings[key];
                setting.slider.value = savedValue;
                // Atualiza tanto a UI quanto a Audio Engine
                UI.updateVolumeDisplay(setting.type, savedValue);
                //AudioEngine.setVolume(setting.type, savedValue);
            }
        }
    }

    /**
     * Função principal para iniciar o metrônomo.
     */
    async function handleStart() {
        if (AudioEngine.isPlaying()) return;

        // A AudioContext só pode ser iniciada após uma interação do usuário.
        // Fazemos a inicialização e o carregamento dos sons no primeiro clique.
        if (!areSoundsLoaded) {
            elements.startButton.textContent = "CARREGANDO...";
            await AudioEngine.init(); // Inicializa o AudioContext

            AudioEngine.setVolume('accent', elements.accentVolumeSlider.value);
            AudioEngine.setVolume('normal', elements.normalVolumeSlider.value);
            AudioEngine.setVolume('subdivision', elements.subdivisionVolumeSlider.value);

            await AudioEngine.loadAllSounds();
            areSoundsLoaded = true;
            elements.startButton.textContent = "INICIAR";
        }
        
        AudioEngine.start(UI.getSettings());
    }

    // --- 3. CONFIGURAÇÃO DOS EVENT LISTENERS ---

    // Controles Principais
    elements.startButton.addEventListener('click', handleStart);
    elements.stopButton.addEventListener('click', AudioEngine.stop);

    // Controles de BPM e Ritmo
    elements.bpmSlider.addEventListener('input', () => {
        const newBPM = elements.bpmSlider.value;
        UI.updateBpmDisplay(newBPM);
        AudioEngine.updateBPM(newBPM);
    });

    elements.bpmInput.addEventListener('input', () => {
        const newBPM = elements.bpmInput.value;
        UI.updateBpmDisplay(newBPM);
        AudioEngine.updateBPM(newBPM);
    });

    elements.subdivisionSelect.addEventListener('change', function() {
        const newSubdivision = elements.subdivisionSelect.value;
        AudioEngine.updateSubdivision(newSubdivision);
    });

    elements.accentCheckbox.addEventListener('change', function() {
        const isChecked = this.checked;
        AudioEngine.setAccent(isChecked);
    });

    elements.compassSelect.addEventListener('change', function() {
        const beats = parseInt(this.value.split('/')[0], 10);
        AudioEngine.updateBeatsPerMeasure(beats);
    });

    elements.bpmInput.addEventListener('blur', function() {
        const min = parseInt(this.min, 10);
        const max = parseInt(this.max, 10);
        let value = parseInt(this.value, 10);
        if (isNaN(value)) value = min;
        if (value < min) value = min;
        if (value > max) value = max;
        UI.updateBpmDisplay(value);
    });

    elements.compassSelect.addEventListener('change', function() {
        const beats = parseInt(this.value.split('/')[0], 10);
        UI.drawBeatVisualizer(beats);
    });

    // Controles de Volume
    elements.accentVolumeSlider.addEventListener('input', function() {
        AudioEngine.setVolume('accent', this.value);
        UI.updateVolumeDisplay('accent', this.value);
        localStorage.setItem('accentVolume', this.value);
    });
    elements.normalVolumeSlider.addEventListener('input', function() {
        AudioEngine.setVolume('normal', this.value);
        UI.updateVolumeDisplay('normal', this.value);
        localStorage.setItem('normalVolume', this.value);
    });
    elements.subdivisionVolumeSlider.addEventListener('input', function() {
        AudioEngine.setVolume('subdivision', this.value);
        UI.updateVolumeDisplay('subdivision', this.value);
        localStorage.setItem('subdivisionVolume', this.value);
    });

    // Outros Controles da UI
    elements.toggleButton.addEventListener('click', UI.toggleVolumePanel);

    // Tap Tempo
    let tapTimeStamps = [];
    const tapTimeOut = 2000;
    elements.tapButton.addEventListener('click', function() {
        const now = performance.now();
        if (tapTimeStamps.length > 0 && (now - tapTimeStamps[tapTimeStamps.length - 1]) > tapTimeOut) {
            tapTimeStamps = [];
        }
        tapTimeStamps.push(now);
        if (tapTimeStamps.length > 5) tapTimeStamps = tapTimeStamps.slice(-5);
        
        if (tapTimeStamps.length > 1) {
            const intervals = [];
            for (let i = 1; i < tapTimeStamps.length; i++) {
                intervals.push(tapTimeStamps[i] - tapTimeStamps[i - 1]);
            }
            const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            if (averageInterval > 0) {
                let bpm = Math.round(60000 / averageInterval);
                const min = parseInt(elements.bpmInput.min, 10);
                const max = parseInt(elements.bpmInput.max, 10);
                if (bpm < min) bpm = min;
                if (bpm > max) bpm = max;
                UI.updateBpmDisplay(bpm);
            }
        }
    });

    // Atalhos de Teclado
    window.addEventListener('keydown', function(event) {
        // Evita que os atalhos funcionem enquanto o usuário digita no campo de BPM
        if (document.activeElement === elements.bpmInput) return;

        if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault(); // Impede o comportamento padrão (ex: rolar a página)
            AudioEngine.isPlaying() ? AudioEngine.stop() : handleStart();
        }
        if (event.key === 'ArrowUp' || event.key === 'w') {
            const newValue = Math.min(parseInt(elements.bpmInput.value, 10) + 1, parseInt(elements.bpmInput.max, 10));
            UI.updateBpmDisplay(newValue);
            AudioEngine.updateBPM(newValue);
        } else if (event.key === 'ArrowDown' || event.key === 's') {
            const newValue = Math.max(parseInt(elements.bpmInput.value, 10) - 1, parseInt(elements.bpmInput.min, 10));
            UI.updateBpmDisplay(newValue);
            AudioEngine.updateBPM(newValue);
        }
    });

    // --- 4. INICIALIZAÇÃO DA APLICAÇÃO ---

    // Passa os elementos para o módulo da UI
    UI.init(elements);

    // Configura o callback que conecta a AudioEngine à UI
    AudioEngine.setOnBeatCallback((beatInMeasure, time) => {
        const audioContext = AudioEngine.getAudioContext(); // Expõe o audioContext para o cálculo de delay
        if (!audioContext) return;
        
        const delay = (time - audioContext.currentTime) * 1000;
        setTimeout(() => {
            UI.updateActiveBeat(beatInMeasure);
        }, delay);
    });

    // Carrega as configurações salvas e desenha o visualizador inicial
    loadAndApplySettings();
    UI.drawBeatVisualizer(UI.getSettings().beatsPerMeasure);
});