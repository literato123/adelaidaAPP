//recognition.js
class RecognitionManager {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.isWakeWordActivated = false;
        this.autoRestart = true;
        
        this.commands = {
            wakeWords: ['adelaida', 'ada', 'dj', 'adi'],
            controls: {
                stop: ['stop', 'apstāties', 'beidz', 'beigt', 'pietiek', 'pārtrauc', 'apturi'],
                pause: ['pauze', 'pauzt', 'nopauzē', 'nopauzēt', 'pagaidi'],
                resume: ['turpini', 'turpināt', 'atsākt', 'atsāc']
            }
        };

        this.setupSpeechRecognition();
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('Pārlūks neatbalsta runas atpazīšanu');
            window.uiManager.updateSystemLog('Pārlūks neatbalsta runas atpazīšanu');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'lv-LV';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            document.querySelector('.mic-btn').classList.add('active');
            window.uiManager.updateStatusText('Klausos...');
        };

        this.recognition.onend = () => {
            // Vienmēr restartējam, bet ar pauzi
            if (this.isListening) {
                setTimeout(() => {
                    try {
                        this.recognition.start();
                    } catch (error) {
                        console.error('Kļūda restartējot klausīšanos:', error);
                    }
                }, 300);
            }
        };

        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            if (!result.isFinal) return;

            const text = result[0].transcript.toLowerCase();
            console.log('Atpazīts teksts:', text);

            // Vispirms pārbaudām kontroles komandas - tās strādā vienmēr
            if (this.checkControlCommands(text)) {
                return;
            }
            
            // Pārbaudām wake word
            if (!this.isWakeWordActivated) {
                if (this.commands.wakeWords.some(word => text.includes(word))) {
                    this.isWakeWordActivated = true;
                    window.uiManager.updateStatusText('Aktivizēts - klausos...');
                    window.uiManager.updateChatLog(`Jūs: ${text}`);
                    const response = window.responseManager.findResponse('wake_word');
                    if (response) {
                        window.uiManager.handleResponse(response);
                    }
                }
                return;
            }

            // Apstrādājam pārējās komandas
            window.uiManager.updateChatLog(`Jūs: ${text}`);
            const response = window.audioManager.handleCommand(text);
            
            if (response) {
                this.isWakeWordActivated = false;
                window.uiManager.updateStatusText('Gaidu aktivizāciju...');
                window.uiManager.handleResponse(response);
            }
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'no-speech') return; // Ignorējam no-speech kļūdu
            
            console.error('Runas atpazīšanas kļūda:', event.error);
            window.uiManager.updateSystemLog(`Runas atpazīšanas kļūda: ${event.error}`);
            
            if (event.error === 'not-allowed') {
                window.uiManager.updateSystemLog('Lūdzu, atļaujiet piekļuvi mikrofonam');
                this.stopListening();
            }
        };
    }

    checkControlCommands(text) {
        // Stop komandas
        if (this.commands.controls.stop.some(cmd => text.includes(cmd))) {
            window.audioManager.stopPlayback();
            window.uiManager.updateChatLog(`Jūs: ${text}`);
            window.uiManager.handleResponse("Mūzikas atskaņošana ir apturēta");
            return true;
        }

        // Pause komandas
        if (this.commands.controls.pause.some(cmd => text.includes(cmd))) {
            window.audioManager.pausePlayback();
            window.uiManager.updateChatLog(`Jūs: ${text}`);
            window.uiManager.handleResponse("Mūzika nopauzēta");
            return true;
        }

        // Resume komandas
        if (this.commands.controls.resume.some(cmd => text.includes(cmd))) {
            window.audioManager.resumePlayback();
            window.uiManager.updateChatLog(`Jūs: ${text}`);
            window.uiManager.handleResponse("Turpinu atskaņošanu");
            return true;
        }

        return false;
    }

    async startListening() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            this.isListening = true;
            this.recognition.start();
        } catch (error) {
            console.error('Mikrofonam nav piekļuves:', error);
            window.uiManager.updateSystemLog(`Mikrofonam nav piekļuves: ${error.message}`);
        }
    }

    stopListening() {
        this.isListening = false;
        document.querySelector('.mic-btn').classList.remove('active');
        window.uiManager.updateStatusText('Gaidīšanas režīmā');
        if (this.recognition) {
            try {
                this.recognition.abort();
            } catch (error) {
                console.error('Kļūda apturot klausīšanos:', error);
            }
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
}

export const recognitionManager = new RecognitionManager();