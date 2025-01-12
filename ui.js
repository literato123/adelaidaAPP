// ui.js
class UIManager {
    constructor() {
        this.setupTabSwitching();
        this.setupEventListeners();
        this.startClock();
    }

    setupEventListeners() {
        document.querySelector('.mic-btn').addEventListener('click', () => {
            window.recognitionManager.toggleListening();
        });
        
        const stopButton = document.querySelector('.input-section span:nth-child(3)');
        stopButton.addEventListener('click', () => {
            window.audioManager.stopPlayback();
            this.handleResponse("Mūzikas atskaņošana ir apturēta");
        });
        
        document.querySelector('.input-section span:last-child')
            .addEventListener('click', this.handleSendButton.bind(this));
        
        document.getElementById('textInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleTextInput(e.target.value);
                e.target.value = '';
            }
        });
    }

    setupTabSwitching() {
        const tabs = document.querySelectorAll('.tab');
        const chatLog = document.getElementById('chatLog');
        const systemLog = document.getElementById('systemLog');

        tabs[0].addEventListener('click', () => {
            tabs[0].classList.add('active');
            tabs[1].classList.remove('active');
            chatLog.style.display = 'block';
            systemLog.style.display = 'none';
        });

        tabs[1].addEventListener('click', () => {
            tabs[1].classList.add('active');
            tabs[0].classList.remove('active');
            systemLog.style.display = 'block';
            chatLog.style.display = 'none';
        });
    }

    handleTextInput(text) {
        if (!text.trim()) return;
        
        console.log('Teksta ievade:', text);
        this.updateChatLog(`Jūs: ${text}`);
    
        // Wake word apstrāde
        const wakeWord = window.responseManager.responses.wake_word;
        if (wakeWord.questions.some(q => text.toLowerCase().includes(q.toLowerCase()))) {
            const answer = wakeWord.answers[Math.floor(Math.random() * wakeWord.answers.length)];
            this.updateChatLog(`Asistents: ${answer}`);
            
            // Atskaņojam wake word audio
            if (wakeWord.audio_path) {
                window.audioManager.playFragment(wakeWord.audio_path);
            }
            return;
        }
    
        // Pārējo komandu apstrāde
        const audioResponse = window.audioManager.handleCommand(text);
        if (audioResponse) {
            this.updateChatLog(`Asistents: ${audioResponse}`);
        }
    }

    handleSendButton() {
        const textInput = document.getElementById('textInput');
        this.handleTextInput(textInput.value);
        textInput.value = '';
    }

    updateChatLog(message) {
        const chatLog = document.getElementById('chatLog');
        const time = new Date().toLocaleTimeString();
        chatLog.innerHTML += `\n[${time}] ${message}`;
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    updateSystemLog(message) {
        const systemLog = document.getElementById('systemLog');
        const time = new Date().toLocaleTimeString();
        systemLog.innerHTML += `\n[${time}] ${message}`;
        systemLog.scrollTop = systemLog.scrollHeight;
    }

    updateStatusText(text) {
        document.getElementById('statusText').textContent = text;
    }

    startClock() {
        setInterval(this.updateClock.bind(this), 1000);
        this.updateClock();
    }

    updateClock() {
        const now = new Date();
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();

        const secondDegrees = ((seconds / 60) * 360);
        const minuteDegrees = ((minutes + seconds/60) / 60) * 360;
        const hourDegrees = ((hours % 12 + minutes/60) / 12) * 360;

        document.querySelector('.second-hand').style.transform = 
            `translateX(-50%) rotate(${secondDegrees}deg)`;
        document.querySelector('.minute-hand').style.transform = 
            `translateX(-50%) rotate(${minuteDegrees}deg)`;
        document.querySelector('.hour-hand').style.transform = 
            `translateX(-50%) rotate(${hourDegrees}deg)`;
    }

    async handleResponse(response) {
        console.log('Atbilde:', response);
        this.updateChatLog(`Asistents: ${response}`);

        if (response === "Mūzikas atskaņošana ir apturēta") {
            window.audioManager.stopPlayback();
            return;
        }
        if (response === "Mūzika nopauzēta") {
            window.audioManager.pausePlayback();
            return;
        }
        if (response.includes("Sagatavojamies")) {
            return;
        }
        // Pievienojam wake_word audio pārbaudi
        if (window.responseManager.responses && 
            window.responseManager.responses.wake_word && 
            this.isWakeWordResponse(response)) {
            const audioPath = window.responseManager.responses.wake_word.audio_path;
            if (audioPath) {
                window.audioManager.playFragment(audioPath);
            }
            return;
        }

        if (window.responseManager.responses) {
            const videoPath = window.responseManager.responses.video_paths?.[response];
            if (videoPath) {
                window.videoManager.playVideo(videoPath);
            }

            const audioPath = window.responseManager.responses.music_paths?.[response];
            if (audioPath) {
                window.audioManager.playAudio(audioPath);
            }
        }
    }

    isWakeWordResponse(response) {
        return window.responseManager.responses.wake_word.answers.includes(response);
    }
}

export const uiManager = new UIManager();