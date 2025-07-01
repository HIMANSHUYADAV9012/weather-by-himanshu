// Add loading state variable
let isLoading = false;

async function getWeather(location = null) {
  const btn = document.getElementById("checkBtn");
  const input = document.getElementById("locationInput");
  const weatherContainer = document.getElementById("weatherInfo");

  // Show loading state immediately
  isLoading = true;
  showLoadingState(btn, weatherContainer);

  if (!location) location = input.value.trim();
  if (!location) {
    hideLoadingState(btn);
    alert("Yaar kuch toh likho! Sheher ka naam batao na 😊");
    isLoading = false;
    return;
  }

  try {
    const [weatherData, forecastData] = await Promise.all([
      fetchWeatherData(location),
      fetchForecastData(location),
    ]);

    const combinedData = {
      ...weatherData,
      forecast: forecastData.forecast,
    };

    displayWeatherData(combinedData, location);
    updateSearchHistory(location);
    
    // Update URL with location
    window.history.pushState({}, '', `?location=${encodeURIComponent(location)}`);
  } catch (err) {
    console.error("Weather fetch error:", err);
    showErrorState();
  } finally {
    hideLoadingState(btn);
    isLoading = false;
  }
}

function showLoadingState(btn, container) {
  container.innerHTML = `
        <div class="loading-state flex flex-col items-center justify-center py-12 animate-pulse">
            <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="mt-4 text-lg font-medium text-gray-700">Apki location fetch ho rahi hai...</p>
            <p class="text-sm text-gray-500">Thoda intezaar karein, hum jaldi hain!</p>
        </div>
    `;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
  }
}

function hideLoadingState(btn) {
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-cloud-sun mr-2"></i> Check Weather...🌡️';
  }
}

async function fetchWeatherData(location) {
  const res = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=e9c43fcf2e9c4868a3b71728252106&q=${location}&aqi=yes`
  );
  if (!res.ok) throw new Error("Weather API error");
  return await res.json();
}

async function fetchForecastData(location) {
  const res = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=e9c43fcf2e9c4868a3b71728252106&q=${location}&days=1&alerts=no`
  );
  if (!res.ok) throw new Error("Forecast API error");
  return await res.json();
}

function displayWeatherData(data, location) {
  const condition = data.current.condition.text.toLowerCase();
  const emoji = emojiMap[condition] || "🌈";

  const currentTime = data.location.localtime;
  const sunrise = data.forecast.forecastday[0].astro.sunrise;
  const sunset = data.forecast.forecastday[0].astro.sunset;

  const isDay = isDayTime(currentTime, sunrise, sunset);
  const theme = getTheme(condition, isDay);

  document.body.className =
    theme +
    " min-h-screen flex flex-col items-center justify-center px-4 py-10 transition-all duration-500 font-sans";

  // Weather card
  const weatherHTML = generateWeatherHTML(
    data,
    condition,
    emoji,
    isDay,
    sunrise,
    sunset
  );
  const weatherContainer = document.createElement("div");
  weatherContainer.className =
    "weather-card bg-white/30 backdrop-blur-md rounded-2xl p-6 shadow-xl w-full max-w-md animate-fadeIn text-gray-900 relative";
  weatherContainer.innerHTML = weatherHTML;

  // Hourly forecast card (separate)
  const hourlyContainer = document.createElement("div");
  hourlyContainer.className =
    "hourly-forecast-container mt-6 w-full max-w-3xl animate-fadeIn";
  hourlyContainer.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Hourly Forecast</h3>
        <div class="hourly-scroll-container flex overflow-x-auto pb-4 scrollbar-hide">
            ${generateHourlyForecast(data.forecast.forecastday[0].hour)}
        </div>
    `;

  const mainContainer = document.getElementById("weatherInfo");
  mainContainer.innerHTML = "";
  mainContainer.appendChild(weatherContainer);
  mainContainer.appendChild(hourlyContainer);

  loadWeatherAnimation(condition, isDay);
  playWeatherMusic(condition);
  renderForecastChart(data.forecast.forecastday[0].hour);
}

function generateWeatherHTML(data, condition, emoji, isDay, sunrise, sunset) {
  const activity = getRandomActivity(condition, isDay);
  const shareText = `Check out the weather in ${data.location.name}: ${data.current.temp_c}°C and ${data.current.condition.text}`;
  const shareUrl = window.location.href;

  return `
        <div class="relative z-10">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold">🏙️ ${data.location.name}, ${data.location.region}</h2>
                    <p class="text-sm text-gray-700">🌏 ${data.location.country} | 🕰️ ${data.location.localtime}</p>
                    <p class="text-sm text-yellow-50">🌅 Sunrise: ${sunrise} | 🌇 Sunset: ${sunset}</p>
                </div>
                <img src="${data.current.condition.icon}" alt="weather icon" class="w-16 h-16">
            </div>

            <div class="mt-4">
                <p class="text-xl font-semibold">${emoji} ${data.current.temp_c}°C - ${data.current.condition.text}</p>
                <p class="text-sm text-gray-800 mt-2">💨 Hawa: ${data.current.wind_kph} kph (${data.current.wind_dir})</p>
                <p class="text-sm text-gray-800">💧 Nami: ${data.current.humidity}% | 😅 Mehsoos: ${data.current.feelslike_c}°C</p>
                <p class="text-sm text-gray-800">☀️ UV: ${data.current.uv} | 🏭 AQI: ${data.current.air_quality?.pm2_5?.toFixed(1) || "NA"}</p>
            </div>

            <!-- Share button with dropdown -->
            <div class="share-container relative mt-4">
                <button onclick="toggleShareOptions()" class="share-button bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm flex items-center justify-center w-full">
                    <i class="fas fa-share-alt mr-2"></i> Share Weather
                </button>
                
                <div id="shareOptions" class="share-options hidden absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg p-2 z-20 border border-gray-200">
                    <button onclick="shareOnTwitter('${shareText}', '${shareUrl}')" class="w-full text-left px-3 py-2 hover:bg-blue-50 rounded flex items-center">
                        <i class="fab fa-twitter text-blue-400 mr-2"></i> Twitter
                    </button>
                    <button onclick="shareOnWhatsApp('${shareText}', '${shareUrl}')" class="w-full text-left px-3 py-2 hover:bg-green-50 rounded flex items-center">
                        <i class="fab fa-whatsapp text-green-500 mr-2"></i> WhatsApp
                    </button>
                    <button onclick="shareOnFacebook('${shareUrl}')" class="w-full text-left px-3 py-2 hover:bg-blue-50 rounded flex items-center">
                        <i class="fab fa-facebook text-blue-600 mr-2"></i> Facebook
                    </button>
                    <button onclick="downloadWeatherCard()" class="w-full text-left px-3 py-2 hover:bg-pink-50 rounded flex items-center">
                        <i class="fab fa-instagram text-pink-500 mr-2"></i> Instagram
                    </button>
                    <button onclick="copyShareLink('${shareUrl}')" class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center">
                        <i class="fas fa-link text-gray-500 mr-2"></i> Copy Link
                    </button>
                </div>
            </div>

            <div class="himanshu-bubble animate-fadeIn">
                <p class="font-bold text-blue-800">Himanshu Advice 🗣️ :</p>
                <p class="text-gray-800">${activity}</p>
            </div>

            <canvas id="forecastChart" class="mt-4 w-full" height="120"></canvas>

            <div class="mt-4 text-sm text-gray-600">
                <p>📊 Pressure: ${data.current.pressure_mb} mb</p>
                <p>👀 Visibility: ${data.current.vis_km} km | ☁️ Badal: ${data.current.cloud}%</p>
            </div>
        </div>
    `;
}

// Share functions
function toggleShareOptions() {
    const shareOptions = document.getElementById('shareOptions');
    shareOptions.classList.toggle('hidden');
    
    // Close when clicking outside
    document.addEventListener('click', function closeShareOptions(e) {
        if (!e.target.closest('.share-container')) {
            shareOptions.classList.add('hidden');
            document.removeEventListener('click', closeShareOptions);
        }
    });
}

function shareOnTwitter(text, url) {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'width=550,height=420');
}

function shareOnWhatsApp(text, url) {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  window.open(whatsappUrl, '_blank');
}

function shareOnFacebook(url) {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(facebookUrl, '_blank', 'width=550,height=400');
}

function copyShareLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('Link copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy: ', err);
    alert('Failed to copy link. Please try again.');
  });
}

function downloadWeatherCard() {
  const weatherCard = document.querySelector('.weather-card');
  html2canvas(weatherCard).then(canvas => {
    const link = document.createElement('a');
    link.download = `weather-${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

function generateHourlyForecast(hourlyData) {
  const now = new Date();
  const currentHour = now.getHours();

  return hourlyData
    .slice(currentHour, currentHour + 24)
    .map((hour, index) => {
      const time = new Date(hour.time);
      const hourString = time.getHours() + (time.getHours() >= 12 ? "PM" : "AM");
      const isCurrentHour = index === 0;

      return `
                <div class="hourly-item flex flex-col items-center px-3 py-2 ${isCurrentHour ? "bg-blue-50/30 rounded-lg" : ""}">
                    <span class="text-xs font-medium">${index === 0 ? "Now" : hourString}</span>
                    <img src="${hour.condition.icon}" alt="${hour.condition.text}" class="w-8 h-8 my-1">
                    <span class="text-sm font-bold">${hour.temp_c}°</span>
                    <div class="rain-chance mt-1 flex flex-col items-center">
                        <span class="text-xs ${hour.chance_of_rain > 0 ? "text-blue-600" : "text-gray-400"}">
                            ${hour.chance_of_rain > 0 ? "☔" : ""} ${hour.chance_of_rain}%
                        </span>
                    </div>
                </div>
            `;
    })
    .join("");
}

function showErrorState() {
  document.getElementById("weatherInfo").innerHTML = `
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded animate-fadeIn" role="alert">
        <p class="font-bold">Oops! Kuch toh gadbad hai</p>
        <p>Yaar location sahi se likho na, nahi mil raha. Koi aur jagah try karo!</p>
    </div>
    `;
}

function renderForecastChart(hourlyData) {
  const labels = hourlyData.map((h) => h.time.split(" ")[1]);
  const temps = hourlyData.map((h) => h.temp_c);

  const ctx = document.getElementById("forecastChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "hourly temperature..🌡️ (°C)",
          data: temps,
          borderColor: "#2563eb",
          backgroundColor: "#93c5fd",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: false } },
    },
  });
}

function getTheme(condition, isDay) {
  if (!isDay && (condition.includes("clear") || condition.includes("sun") || condition.includes("cloud") || condition.includes("thunder"))) {
    return "theme-night";
  }
  return getThemeFromCondition(condition);
}

function updateSearchHistory(location) {
  if (!location || searchHistory.includes(location)) return;

  searchHistory.unshift(location);
  if (searchHistory.length > 5) searchHistory.pop();
  localStorage.setItem("weatherHistory", JSON.stringify(searchHistory));
  updateHistory();
}

// Initialize with loading state
window.onload = () => {
  updateHistory();
  showInitialLoadingState();

  // Check for location in URL
  const urlParams = new URLSearchParams(window.location.search);
  const locationParam = urlParams.get('location');

  if (locationParam) {
    getWeather(locationParam);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        await getWeather(`${lat},${lon}`);
      },
      () => {
        getWeather("jaithra");
      },
      { timeout: 5000 }
    );
  } else {
    getWeather("jaithra");
  }
};

function showInitialLoadingState() {
  const container = document.getElementById("weatherInfo");
  container.innerHTML = `
        <div class="initial-loading flex flex-col items-center justify-center py-12">
            <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="mt-4 text-lg font-medium text-gray-700">Apka location detect kiya ja raha hai...</p>
            <p class="text-sm text-gray-500">3 second mein result aa jayega</p>
        </div>
    `;
}

// Event listeners
document.addEventListener("click", (e) => {
  if (!e.target.closest("#locationInput, #suggestions")) {
    document.getElementById("suggestions").classList.add("hidden");
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
function selectCity(city) {
  document.getElementById("locationInput").value = city;
  document.getElementById("suggestions").classList.add("hidden");
  getWeather(city);
}