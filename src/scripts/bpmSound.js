document.addEventListener('DOMContentLoaded', function() {
    // --- Configuração da Web Audio API ---
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const accentGainNode = audioContext.createGain();
    const normalGainNode = audioContext.createGain();
    const subdivisionGainNode = audioContext.createGain();

    let accentBuffer, normalBuffer, subdivisionBuffer;
    let isPlaying = false;
    let nextNoteTime = 0.0;
    let timerID;


    accentGainNode.connect(audioContext.destination);
    normalGainNode.connect(audioContext.destination);
    subdivisionGainNode.connect(audioContext.destination);

    // --- Constantes de Agendamento ---
    const scheduleAheadTime = 0.1;
    const schedulerFrequency = 25.0;

    // --- Carregamento dos Áudios ---
    async function loadSound(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    }
    // Carrega os três sons
    loadSound('sounds/acento.wav').then(buffer => accentBuffer = buffer).catch(e => console.error("Não foi possível carregar acento.wav"));
    loadSound('sounds/normal.wav').then(buffer => normalBuffer = buffer).catch(e => console.error("Não foi possível carregar normal.wav"));
    loadSound('sounds/sub.wav').then(buffer => subdivisionBuffer = buffer).catch(e => console.log("Nota: sub.wav não encontrado, usando normal.wav para subdivisões."));


    // --- Elementos do DOM ---
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const bpmInput = document.getElementById('bpmInput');
    const bpmSlider = document.getElementById('bpmSlider');
    const subdivisionSelect = document.getElementById('subdivisionSelect');
    const accentCheckbox = document.getElementById('accentCheckbox');
    const accentVolumeSlider = document.getElementById('accentVolume');
    const normalVolumeSlider = document.getElementById('normalVolume');
    const subdivisionVolumeSlider = document.getElementById('subdivisionVolume');
    const accentVolumeValue = document.getElementById('accentVolumeValue');
    const normalVolumeValue = document.getElementById('normalVolumeValue');
    const subdivisionVolumeValue = document.getElementById('subdivisionVolumeValue');
    const toggleButton = document.getElementById('toggleVolumes');
    const volumeControls = document.getElementById('volumeControls');
    const mixerArrow = document.getElementById('mixerArrow');

    // --- Event Listeners ---
    bpmSlider.addEventListener('input', function() { bpmInput.value = this.value; });
    bpmInput.addEventListener('input', function() { bpmSlider.value = this.value; });
    startButton.addEventListener('click', startMetronome);
    stopButton.addEventListener('click', stopMetronome);

    bpmInput.addEventListener('blur', function() {
        const min = parseInt(this.min, 10);
        const max = parseInt(this.max, 10);
        let value = parseInt(this.value, 10);

        if (isNaN(value)) {
            value = min;
        }

        if (value < min) {
            value = min;
        }
        if (value > max) {
            value = max;
        }
        
        this.value = value;
        bpmSlider.value = value;
    });

    accentVolumeSlider.addEventListener('input', function() {
        const newVolume = this.value / 100;
        accentGainNode.gain.linearRampToValueAtTime(newVolume, audioContext.currentTime + 0.05);
        accentVolumeValue.textContent = this.value; 
        localStorage.setItem('accentVolume', this.value);
    });
    normalVolumeSlider.addEventListener('input', function() {
        const newVolume = this.value / 100;
        normalGainNode.gain.linearRampToValueAtTime(newVolume, audioContext.currentTime + 0.05);
        normalVolumeValue.textContent = this.value; 
        localStorage.setItem('normalVolume', this.value);
    });
    subdivisionVolumeSlider.addEventListener('input', function() {
        const newVolume = this.value / 100;
        subdivisionGainNode.gain.linearRampToValueAtTime(newVolume, audioContext.currentTime + 0.05);
        subdivisionVolumeValue.textContent = this.value; 
        localStorage.setItem('subdivisionVolume', this.value);
    });

    toggleButton.addEventListener('click', () => {
        volumeControls.classList.toggle('hidden');
        mixerArrow.style.transform = volumeControls.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // FUNÇÃO DE AGENDAMENTO
    function scheduleNote(beatInMeasure, subdivisionInBeat, time) {
        let bufferToPlay;
        let gainNodeToUse;

        // É a primeira nota da batida (o pulso principal)?
        if (subdivisionInBeat === 1) {
            if (accentCheckbox.checked && beatInMeasure === 1) {
                bufferToPlay = (beatInMeasure === 1) ? accentBuffer : normalBuffer;
                gainNodeToUse = accentGainNode;
            } else {
                bufferToPlay = normalBuffer;
                gainNodeToUse = normalGainNode;
            }
        } else {
            // É uma nota de subdivisão (off-beat)
            bufferToPlay = subdivisionBuffer || normalBuffer;
            gainNodeToUse = subdivisionGainNode;
        }

        if (!bufferToPlay) return;

        const source = audioContext.createBufferSource();
        source.buffer = bufferToPlay;
        source.connect(gainNodeToUse);
        source.start(time);
    }
    
    // --- Variáveis de estado da batida ---
    let currentBeatInMeasure;
    let currentSubdivisionInBeat;

    // LÓGICA DE AVANÇO
    function advanceNote() {
        const subdivision = parseInt(subdivisionSelect.value, 10);
        const secondsPerBeat = 60.0 / parseInt(bpmInput.value, 10);
        const secondsPerSubdivision = secondsPerBeat / subdivision;

        // Avança o tempo para a próxima nota de SUBDIVISÃO
        nextNoteTime += secondsPerSubdivision;

        // Incrementa o contador da subdivisão
        currentSubdivisionInBeat++;
        if (currentSubdivisionInBeat > subdivision) {
            currentSubdivisionInBeat = 1;
            // Quando a subdivisão "zera", incrementamos a batida principal
            currentBeatInMeasure++;
            if (currentBeatInMeasure > 4) {
                currentBeatInMeasure = 1;
            }
        }
    }

    function scheduler() {
        while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
            scheduleNote(currentBeatInMeasure, currentSubdivisionInBeat, nextNoteTime);
            advanceNote();
        }
    }

    function startMetronome() {
        if (isPlaying) return;
        if (!accentBuffer || !normalBuffer) {
            console.error("Áudios principais não carregados. Não é possível iniciar.");
            return;
        }

        isPlaying = true;
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // Reseta os contadores ao iniciar
        currentBeatInMeasure = 1;
        currentSubdivisionInBeat = 1;
        nextNoteTime = audioContext.currentTime + 0.1;

        timerID = setInterval(scheduler, schedulerFrequency);
    }

    function stopMetronome() {
        isPlaying = false;
        clearInterval(timerID);
    }

    function loadVolumeSettings() {
        const settings = {
            'accentVolume': { slider: accentVolumeSlider, gainNode: accentGainNode, display: accentVolumeValue },
            'normalVolume': { slider: normalVolumeSlider, gainNode: normalGainNode, display: normalVolumeValue },
            'subdivisionVolume': { slider: subdivisionVolumeSlider, gainNode: subdivisionGainNode, display: subdivisionVolumeValue }
        };

        for (const key in settings) {
            const savedValue = localStorage.getItem(key);
            if (savedValue !== null) { // Verifica se um valor foi salvo anteriormente
                const setting = settings[key];
                const savedNumericValue = parseFloat(savedValue);

                // Aplica o valor salvo
                setting.slider.value = savedNumericValue;
                setting.display.textContent = savedNumericValue;
                setting.gainNode.gain.value = savedNumericValue / 100;
            }
        }
    };

    loadVolumeSettings();
});