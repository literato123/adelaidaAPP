// main.js
import { audioManager } from './audio.js';
import { uiManager } from './ui.js';
import { recognitionManager } from './recognition.js';
import { responseManager, videoManager } from './utils.js';

// Globālie mainīgie
window.audioManager = audioManager;
window.uiManager = uiManager;
window.recognitionManager = recognitionManager;
window.responseManager = responseManager;
window.videoManager = videoManager;

// Inicializācija pēc DOM ielādes
document.addEventListener('DOMContentLoaded', async function() {
    // Sākt klausīšanos
    recognitionManager.startListening();
});