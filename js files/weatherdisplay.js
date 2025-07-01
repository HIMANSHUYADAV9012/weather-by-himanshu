let currentAnimation = null;
let resizeObserver = null;

function loadWeatherAnimation(condition, isDay) {
    if (currentAnimation) {
        currentAnimation.destroy();
        currentAnimation = null;
    }

    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }

    let animationType = "default";
    condition = condition.toLowerCase();
    
    if (condition.includes("sun") || condition.includes("clear")) {
        animationType = "sunny";
    } else if (condition.includes("rain") || condition.includes("drizzle")) {
        animationType = "rainy";
    } else if (condition.includes("cloud")) {
        animationType = "cloudy";
    } else if (condition.includes("snow") || condition.includes("ice")) {
        animationType = "snowy";
    } else if (condition.includes("thunder") || condition.includes("storm")) {
        animationType = "thunder";
    } else if (condition.includes("fog") || condition.includes("mist")) {
        animationType = "fog";
    }

    let animationPath;
    if (typeof weatherAnimations[animationType] === 'object') {
        animationPath = isDay ? weatherAnimations[animationType].day : weatherAnimations[animationType].night;
    } else {
        animationPath = weatherAnimations[animationType];
    }

    const weatherCard = document.querySelector('.weather-card');
    if (!weatherCard) return;

    let container = document.getElementById("lottie-animation-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "lottie-animation-container";
        container.className = "lottie-animation";
        weatherCard.appendChild(container);
    }

    const updateAnimationSize = () => {
        container.style.width = weatherCard.offsetWidth + 'px';
        container.style.height = weatherCard.offsetHeight + 'px';
        if (currentAnimation) {
            currentAnimation.resize();
        }
    };

    updateAnimationSize();

    resizeObserver = new ResizeObserver(updateAnimationSize);
    resizeObserver.observe(weatherCard);

    currentAnimation = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: animationPath,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    });
}

function updateHistory() {
    const container = document.getElementById("history");
    container.innerHTML = searchHistory
        .map(
            (loc) =>
                `<button onclick="getWeather('${loc}')" class="px-3 py-1 bg-white/40 text-sm rounded-full shadow hover:bg-white/60 transition">${loc}</button>`
        )
        .join(" ");
}