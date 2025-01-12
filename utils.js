// utils.js
class ResponseManager {
    constructor() {
        this.wakeWords = ['adelaida', 'ada', 'dj', 'adi'];
        this.greetings = [
           
            'Esmu šeit!',
            'Klausos!'
        ];
    }

    isWakeWord(text) {
        return this.wakeWords.some(word => 
            text.toLowerCase().includes(word.toLowerCase())
        );
    }

    getRandomGreeting() {
        return this.greetings[Math.floor(Math.random() * this.greetings.length)];
    }

    findResponse(text) {
        // Ja tas ir wake word
        if (text === 'wake_word') {
            return this.getRandomGreeting();
        }

        // Meklējam atbilstošo komandu audio menedžerī
        return window.audioManager.handleCommand(text);
    }
}

class VideoManager {
    constructor() {
        this.mainVideo = document.getElementById('mainVideo');
    }

    playVideo(path) {
        if (!this.mainVideo) {
            window.uiManager.updateSystemLog('Video elements nav atrasts');
            return;
        }

        this.mainVideo.src = path;
        this.mainVideo.load();
        this.mainVideo.play()
            .then(() => window.uiManager.updateSystemLog('Video atskaņošana sākta'))
            .catch(error => window.uiManager.updateSystemLog(`Kļūda: ${error.message}`));
    }

    stopVideo() {
        if (this.mainVideo) {
            this.mainVideo.pause();
            this.mainVideo.currentTime = 0;
        }
    }
}

export const responseManager = new ResponseManager();
export const videoManager = new VideoManager();