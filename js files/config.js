// Weather activities loaded from JSON
let weatherActivities = {};

// Function to load weather activities
async function loadWeatherActivities() {
    try {
        const response = await fetch('weatherActivities.json');
        weatherActivities = await response.json();
        console.log('Weather activities loaded successfully');
    } catch (error) {
        console.error('Error loading weather activities:', error);
        // Fallback to some default activities if loading fails
        weatherActivities = {
            default: {
                day: ["Enjoy the weather!"],
                night: ["Have a good night!"]
            }
        };
    }
}

// Call the function to load activities when the script loads
loadWeatherActivities();

// Lottie animations for different weather conditions with day/night variants
const weatherAnimations = {
    sunny: {
        day: "animation/sunny.json",
        night: "animation/night.json"
    },
    rainy: {
        day: "animation/rain.json",
        night: "animation/rain.json"
    },
    cloudy: {
        day: "animation/nigt.json",
        night: "animation/night.json"
    },
    snowy: {
        day: "animation/snow.json",
        night: "animation/snow.json"
    },
    thunder: {
        day: "animation/thunder.json",
        night: "animation/night.json"
    },
    fog: {
        day: "animation/fog.json",
        night: "animation/fog.json"
    },
    default: {
        day: "animation/default.json",
        night: "animation/night.json"
    }
};

// Emoji mapping for weather conditions
const emojiMap = {
    sunny: "☀️",
    clear: "☀️",
    "partly cloudy": "⛅",
    cloudy: "☁️",
    overcast: "🌥️",
    mist: "🌫️",
    "patchy rain nearby": "🌦️",
    "light rain": "🌧️",
    "moderate rain": "🌧️",
    "heavy rain": "⛈️",
    thunderstorm: "🌩️",
    snow: "❄️",
    fog: "🌁",
    drizzle: "🌧️"
};

let searchHistory = JSON.parse(localStorage.getItem("weatherHistory")) || [];