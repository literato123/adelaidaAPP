// audio.js
class AudioManager {
    constructor() {
        this.currentKadril = null;
        this.mainAudio = document.getElementById('mainAudio');
        this.mainVideo = document.getElementById('mainVideo');
        this.isPlaying = false;
        this.isPaused = false;
        
        // Definējam vadības komandas
        this.controlCommands = {
            stop: ['stop', 'apstāties', 'beidz', 'beigt', 'pietiek', 'pārtrauc', 'apturi'],
            pause: ['pauze', 'pauzt', 'nopauzē', 'nopauzēt', 'pagaidi'],
            resume: ['turpini', 'turpināt', 'atsākt', 'atsāc']
        };
        
        // Definējam wake word audio atbildes
        this.wakeWords = {
            'ada': 'MUSIC/voice_responses/greetings/seit.mp3',
            'adi': 'AUDIO/responses/adi_response.mp3',
            'adelaida': 'MUSIC/voice_responses/greetings/palidzet.mp3'
        };

        // Definējam deju struktūru
        this.kadrils = {
            'rusiņš': {
                name: 'Atskaņoju rusiņu',
                fragments: {
                    'sākums': 'MUSIC/kadrilas/ada/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/ada/parts/vidus.mp3',
                    'beigas': 'MUSIC/kadrilas/ada/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/rusins/rusinsfull.mp3',
                    'video': 'VIDEO/kadrilas/rusins/rusins.mp4'
                },
                keywords: ['rusiņš', 'rusiņu', 'russu']
            },
            'padespaņs': {
                name: 'Atskaņoju...',
                fragments: {
                    'sākums': 'MUSIC/kadrilas/adi/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/adi/parts/vidus.mp3', 
                    'beigas': 'MUSIC/kadrilas/adi/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/berlins/padespans/Padespaanfull.mp3',
                    'video': 'VIDEO/kadrilas/padespans/padespans.mp4'
                },
                keywords: ['padespaņs', 'spainis', 'bada spains']
            },
            // Pārējās dejas...
        };

        // Pievienojam event listener audio beigām
        this.mainAudio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.isPaused = false;
            window.uiManager.updateSystemLog('Atskaņošana pabeigta');
        });
    }

    handleCommand(command) {
        command = command.toLowerCase().trim();

        // Pārbaudam wake words un atskaņojam atbildes
        if (Object.keys(this.wakeWords).includes(command)) {
            this.playFragment(this.wakeWords[command]);
            return null;
        }
        
        // Pārbaudam vadības komandas
        if (this.controlCommands.stop.some(cmd => command.includes(cmd))) {
            this.stopPlayback();
            return 'Apturēju atskaņošanu';
        }

        if (this.controlCommands.pause.some(cmd => command.includes(cmd))) {
            this.pausePlayback();
            return 'Nopauzēju atskaņošanu';
        }

        if (this.controlCommands.resume.some(cmd => command.includes(cmd))) {
            this.resumePlayback();
            return 'Turpinu atskaņošanu';
        }

        // Vispirms pārbaudam, vai tiek mainīta deja
        for (const [kadrilKey, kadril] of Object.entries(this.kadrils)) {
            if (kadril.keywords.some(keyword => command.includes(keyword))) {
                this.currentKadril = kadrilKey;
                
                // Pārbaudam vai prasīts video
                if (command.includes('video')) {
                    this.playVideo(kadril.fragments.video);
                    return `Rādu ${kadril.name} video`;
                }
                
                // Ja pieminēta pilnā deja
                if (command.includes('pilno') || command.includes('visu')) {
                    this.playFragment(kadril.fragments.pilnā);
                    return `Atskaņoju ${kadril.name} pilnībā`;
                }

                // Meklējam fragmentu
                for (const [fragmentKey, fragmentPath] of Object.entries(kadril.fragments)) {
                    if (command.includes(fragmentKey) && fragmentKey !== 'video') {
                        this.playFragment(fragmentPath);
                        return `Atskaņoju ${kadril.name} - ${fragmentKey}`;
                    }
                }

                // Ja fragments nav norādīts, atskaņojam pilno
                this.playFragment(kadril.fragments.pilnā);
                return `Atskaņoju ${kadril.name}`;
            }
        }

        // Ja ir aktīva deja, meklējam tikai fragmentu
        if (this.currentKadril) {
            const currentKadrilData = this.kadrils[this.currentKadril];
            for (const [fragmentKey, fragmentPath] of Object.entries(currentKadrilData.fragments)) {
                if (command.includes(fragmentKey) && fragmentKey !== 'video') {
                    this.playFragment(fragmentPath);
                    return `Atskaņoju ${currentKadrilData.name} - ${fragmentKey}`;
                }
            }
        }

        return null;
    }

    async playFragment(fragmentPath) {
        try {
            if (!this.mainAudio) {
                throw new Error('Audio elements nav atrasts');
            }

            // Ja kaut kas jau spēlē, vispirms apstādinām
            if (this.isPlaying) {
                this.stopPlayback();
            }

            this.mainAudio.src = fragmentPath;
            await this.mainAudio.load();
            await this.mainAudio.play();
            this.isPlaying = true;
            this.isPaused = false;
            window.uiManager.updateSystemLog(`Atskaņoju: ${fragmentPath}`);

            // Pievienojam mobilās kontroles
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: fragmentPath.split('/').pop(),
                    artist: 'Voice Assistant',
                    album: 'Dance Music'
                });

                navigator.mediaSession.setActionHandler('play', () => this.resumePlayback());
                navigator.mediaSession.setActionHandler('pause', () => this.pausePlayback());
                navigator.mediaSession.setActionHandler('stop', () => this.stopPlayback());
            }
        } catch (error) {
            console.error('Kļūda atskaņojot:', error);
            window.uiManager.updateSystemLog(`Kļūda atskaņojot: ${error.message}`);
        }
    }

    async playVideo(videoPath) {
        try {
            if (!this.mainVideo) {
                throw new Error('Video elements nav atrasts');
            }

            // Apstādinām audio, ja tas spēlē
            if (this.isPlaying) {
                this.stopPlayback();
            }

            this.mainVideo.src = videoPath;
            await this.mainVideo.load();
            await this.mainVideo.play();
            window.uiManager.updateSystemLog(`Rādu video: ${videoPath}`);

            // Ieslēdzam screen wake lock priekš video
            if ('wakeLock' in navigator) {
                try {
                    await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.log('Wake Lock error:', err);
                }
            }
        } catch (error) {
            console.error('Kļūda rādot video:', error);
            window.uiManager.updateSystemLog(`Kļūda rādot video: ${error.message}`);
        }
    }

    stopPlayback() {
        if (this.mainAudio) {
            this.mainAudio.pause();
            this.mainAudio.currentTime = 0;
            this.isPlaying = false;
            this.isPaused = false;
            window.uiManager.updateSystemLog('Atskaņošana apturēta');
        }
        if (this.mainVideo) {
            this.mainVideo.pause();
            this.mainVideo.currentTime = 0;
            window.uiManager.updateSystemLog('Video apturēts');
        }
    }

    pausePlayback() {
        if (this.mainAudio && !this.isPaused && this.isPlaying) {
            this.mainAudio.pause();
            this.isPaused = true;
            this.isPlaying = false;
            window.uiManager.updateSystemLog('Atskaņošana nopauzēta');
        }
        if (this.mainVideo) {
            this.mainVideo.pause();
            window.uiManager.updateSystemLog('Video nopauzēts');
        }
    }

    resumePlayback() {
        if (this.mainAudio && this.isPaused) {
            this.mainAudio.play()
                .then(() => {
                    this.isPaused = false;
                    this.isPlaying = true;
                    window.uiManager.updateSystemLog('Atskaņošana turpināta');
                })
                .catch(error => window.uiManager.updateSystemLog(`Kļūda turpinot: ${error.message}`));
        }
        if (this.mainVideo) {
            this.mainVideo.play()
                .then(() => window.uiManager.updateSystemLog('Video turpināts'))
                .catch(error => window.uiManager.updateSystemLog(`Kļūda turpinot video: ${error.message}`));
        }
    }
}

export const audioManager = new AudioManager();