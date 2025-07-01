let audioContext;
let audioElement;
let isMusicPlaying = false;
let currentTrack = "";
let audioInitialized = false;

function initAudio() {
    if (audioInitialized) return;

    audioElement = new Audio();
    audioElement.loop = true;
    audioElement.preload = "auto";

    audioElement.addEventListener('error', () => {
        console.error("Audio loading error:", audioElement.error);
    });

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(audioContext.destination);
    } catch (e) {
        console.error("AudioContext failed:", e);
        return;
    }

    const handleUserInteraction = () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log("AudioContext resumed successfully");
            }).catch(e => {
                console.error("AudioContext resume failed:", e);
            });
        }
    };

    const interactionEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
    interactionEvents.forEach(event => {
        document.addEventListener(event, handleUserInteraction, { once: true });
    });

    audioInitialized = true;
}

function playWeatherMusic(condition) {
    if (!audioInitialized) initAudio();

    let musicFile;
    let musicName;

    if (condition.includes("sun") || condition.includes("clear")) {
        musicFile = "sounds/sunny.mp3";
        musicName = "☀️ Sunny Day Music";
    } else if (condition.includes("rain") || condition.includes("drizzle")) {
        musicFile = "sounds/rain.mp3";
        musicName = "🌧️ Rainy Day Music";
    } else if (condition.includes("cloud")) {
        musicFile = "sounds/cloudy.mp3";
        musicName = "☁️ Cloudy Day Music";
    } else if (condition.includes("cold") || condition.includes("snow")) {
        musicFile = "sounds/cold.mp3";
        musicName = "❄️ Cold Day Music";
    } else {
        musicFile = "sounds/default.mp3";
        musicName = "🌈 Weather Music";
    }

    if (currentTrack !== musicFile) {
        currentTrack = musicFile;
        audioElement.src = musicFile;
        document.getElementById("musicInfo").textContent = musicName;

        const playAudioWithRetry = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    audioElement.play().then(() => {
                        isMusicPlaying = true;
                        updateMusicControls();
                    }).catch(playError => {
                        console.log("Playback failed, will retry:", playError);
                        scheduleRetry();
                    });
                }).catch(resumeError => {
                    console.log("AudioContext resume failed:", resumeError);
                    scheduleRetry();
                });
            } else {
                audioElement.play().then(() => {
                    isMusicPlaying = true;
                    updateMusicControls();
                }).catch(playError => {
                    console.log("Playback failed, will retry:", playError);
                    scheduleRetry();
                });
            }
        };

        const scheduleRetry = () => {
            setTimeout(() => {
                if (!isMusicPlaying) {
                    playAudioWithRetry();
                }
            }, 500);
        };

        playAudioWithRetry();
    } else if (isMusicPlaying) {
        document.getElementById("musicPlayer").style.display = "flex";
    }
}

function toggleMusic() {
    if (!audioInitialized) initAudio();

    const updateControls = () => {
        document.getElementById("musicControl").innerHTML =
            isMusicPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    };

    if (isMusicPlaying) {
        audioElement.pause();
        isMusicPlaying = false;
        updateControls();
    } else {
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                audioElement.play().then(() => {
                    isMusicPlaying = true;
                    updateControls();
                }).catch(playError => {
                    console.log("Play failed after resume:", playError);
                    isMusicPlaying = false;
                    updateControls();
                });
            }).catch(resumeError => {
                console.log("Resume failed:", resumeError);
                isMusicPlaying = false;
                updateControls();
            });
        } else {
            audioElement.play().then(() => {
                isMusicPlaying = true;
                updateControls();
            }).catch(playError => {
                console.log("Direct play failed:", playError);
                isMusicPlaying = false;
                updateControls();
            });
        }
    }
}