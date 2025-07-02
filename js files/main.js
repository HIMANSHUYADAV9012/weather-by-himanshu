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

// ✅ UPDATED displayWeatherData to split weather & hourly forecast
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

// ❌ REMOVED hourly forecast block from here
function generateWeatherHTML(data, condition, emoji, isDay, sunrise, sunset) {
  const activity = getRandomActivity(condition, isDay);

  return `
        <div class="relative z-10">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold">🏙️ ${data.location.name}, ${
    data.location.region
  }</h2>
                    <p class="text-sm text-gray-700">🌏 ${
                      data.location.country
                    } | 🕰️ ${data.location.localtime}</p>
                    <p class="text-sm text-yellow-50">🌅 Sunrise: ${sunrise} | 🌇 Sunset: ${sunset}</p>
                </div>
                <img src="${
                  data.current.condition.icon
                }" alt="weather icon" class="w-16 h-16">
            </div>

            <div class="mt-4">
                <p class="text-xl font-semibold">${emoji} ${
    data.current.temp_c
  }°C - ${data.current.condition.text}</p>
                <p class="text-sm text-gray-800 mt-2">💨 Hawa: ${
                  data.current.wind_kph
                } kph (${data.current.wind_dir})</p>
                <p class="text-sm text-gray-800">💧 Nami: ${
                  data.current.humidity
                }% | 😅 Mehsoos: ${data.current.feelslike_c}°C</p>
                <p class="text-sm text-gray-800">☀️ UV: ${
                  data.current.uv
                } | 🏭 AQI: ${
    data.current.air_quality?.pm2_5?.toFixed(1) || "NA"
  }</p>
            </div>

            <div class="himanshu-bubble animate-fadeIn">
                <p class="font-bold text-blue-800">Himanshu Advice 🗣️ :</p>
                <p class="text-gray-800">${activity}</p>
            </div>

            <canvas id="forecastChart" class="mt-4 w-full" height="120"></canvas>

            <div class="mt-4 text-sm text-gray-600">
                <p>📊 Pressure: ${data.current.pressure_mb} mb</p>
                <p>👀 Visibility: ${data.current.vis_km} km | ☁️ Badal: ${
    data.current.cloud
  }%</p>
  
  <button id="shareBtn" class="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-2">
  <i class="fas fa-share-alt"></i> Share Weather 📤
</button>

            </div>
        </div>
    `;
}

function generateHourlyForecast(hourlyData) {
  const now = new Date();
  const currentHour = now.getHours();

  return hourlyData
    .slice(currentHour, currentHour + 24)
    .map((hour, index) => {
      const time = new Date(hour.time);
      const hourString =
        time.getHours() + (time.getHours() >= 12 ? "PM" : "AM");
      const isCurrentHour = index === 0;

      return `
                <div class="hourly-item flex flex-col items-center px-3 py-2 ${
                  isCurrentHour ? "bg-blue-50/30 rounded-lg" : ""
                }">
                    <span class="text-xs font-medium">${
                      index === 0 ? "Now" : hourString
                    }</span>
                    <img src="${hour.condition.icon}" alt="${
        hour.condition.text
      }" class="w-8 h-8 my-1">
                    <span class="text-sm font-bold">${hour.temp_c}°</span>
                    <div class="rain-chance mt-1 flex flex-col items-center">
                        <span class="text-xs ${
                          hour.chance_of_rain > 0
                            ? "text-blue-600"
                            : "text-gray-400"
                        }">
                            ${hour.chance_of_rain > 0 ? "☔" : ""} ${
        hour.chance_of_rain
      }%
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
  if (
    !isDay &&
    (condition.includes("clear") ||
      condition.includes("sun") ||
      condition.includes("cloud") ||
      condition.includes("thunder"))
  ) {
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

// ...rest of your code (autoSuggest, startVoice, etc.) remains unchanged

// Optimized auto-suggest with debounce
let debounceTimer;
function autoSuggest(query) {
  clearTimeout(debounceTimer);

  const suggestionsBox = document.getElementById("suggestions");
  if (!query || query.length < 2) {
    suggestionsBox.classList.add("hidden");
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/search.json?key=e9c43fcf2e9c4868a3b71728252106&q=${query}`
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      suggestionsBox.innerHTML = data.length
        ? data
            .map(
              (loc) =>
                `<div onclick="selectCity('${loc.name}, ${loc.region}')">
                        ${loc.name}, ${loc.region} (${loc.country})
                    </div>`
            )
            .join("")
        : '<div class="text-gray-500">No results found</div>';

      suggestionsBox.classList.toggle("hidden", data.length === 0);
    } catch (err) {
      suggestionsBox.classList.add("hidden");
    }
  }, 300);
}

// Optimized voice recognition
function startVoice() {
  if (isMusicPlaying) toggleMusic();

  const voiceBtn = document.getElementById("voiceBtn");
  voiceBtn.innerHTML = '<i class="fas fa-microphone animate-pulse-ring"></i>';
  voiceBtn.classList.add("animate-pulse-ring");

  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = "en-IN";
  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("locationInput").value = transcript;
    resetVoiceButton(voiceBtn);
    getWeather();
  };

  recognition.onerror = (event) => {
    console.error("Voice recognition error", event.error);
    resetVoiceButton(voiceBtn);
    alert("Voice recognition failed. Please try again.");
    if (isMusicPlaying) toggleMusic();
  };

  recognition.onend = () => {
    resetVoiceButton(voiceBtn);
    if (!document.getElementById("locationInput").value && isMusicPlaying) {
      toggleMusic();
    }
  };
}

function resetVoiceButton(btn) {
  btn.innerHTML = '<i class="fas fa-microphone"></i>';
  btn.classList.remove("animate-pulse-ring");
}

// Initialize with loading state
window.onload = () => {
  updateHistory();
  showInitialLoadingState();

  if (navigator.geolocation) {
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

// Event listeners with optimized delegation
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
document.addEventListener("click", async function (e) {
  if (e.target.closest("#shareBtn")) {
    try {
      const location = document.querySelector(".weather-card h2").textContent.trim();
      const localtime = document.querySelector(".weather-card p:nth-child(3)").textContent.trim();
      const temp = document.querySelector(".weather-card p.text-xl").textContent.trim();
      const wind = document.querySelector(".weather-card p:nth-of-type(2)").textContent.trim();
      const humidity = document.querySelector(".weather-card p:nth-of-type(3)").textContent.trim();
      const uv = document.querySelector(".weather-card p:nth-of-type(4)").textContent.trim();
      const sunData = document.querySelector(".weather-card p.text-yellow-50").textContent.trim();

      const shareText = `
🌤️ *Today's Weather Update* 🌤️

📍 *Location:* ${location}
🕰️ *Time:* ${localtime}
🌡️ *Temperature:* ${temp}
🌅 *${sunData}*
💨 *${wind}*
💧 *${humidity}*
☀️ *${uv}*

Check real-time weather on: 🌐 www.hawabaazi.com
      `.trim();

      if (navigator.share) {
        await navigator.share({
          title: "Weather Update - Hawabaazi",
          text: shareText,
          url: "https://www.hawabaazi.com",
        });
      } else {
        alert("Sharing is not supported on this browser.");
      }
    } catch (err) {
      console.error("Share failed:", err);
      alert("Kuch gadbad ho gaya share karne mein 😓");
    }
  }
});
