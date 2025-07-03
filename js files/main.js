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
    `https://api.weatherapi.com/v1/forecast.json?key=e9c43fcf2e9c4868a3b71728252106&q=${location}&days=3&alerts=no`
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

  const mainContainer = document.getElementById("weatherInfo");
  mainContainer.innerHTML = "";

  // Weather Card
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
  mainContainer.appendChild(weatherContainer);

  // 📅 Dropdown + Hourly Forecast
  const hourlyContainer = document.createElement("div");
  hourlyContainer.className =
    "hourly-forecast-container mt-6 w-full max-w-3xl animate-fadeIn";
  hourlyContainer.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
         <h3 class="text-lg font-semibold">Hourly Forecast</h3>
         <select id="daySelector" class="ml-auto px-2 py-1 rounded bg-white shadow text-sm">
            ${data.forecast.forecastday
              .map((day, i) => {
                const options = {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                };
                const dateObj = new Date(day.date);
                const dateLabel = dateObj.toLocaleDateString("en-IN", options); // e.g., "Thu, 3 Jul"
                return `<option value="${i}">${dateLabel}</option>`;
              })
              .join("")}
         </select>
      </div>
      <div id="hourlyScroll" class="hourly-scroll-container flex overflow-x-auto pb-4 scrollbar-hide">
         ${generateHourlyForecast(data.forecast.forecastday[0].hour)}
      </div>
   `;
  mainContainer.appendChild(hourlyContainer);

  // 🔁 Change forecast on day change
  document.getElementById("daySelector").addEventListener("change", (e) => {
    const selectedDay = parseInt(e.target.value);
    const hourlyHTML = generateHourlyForecast(
      data.forecast.forecastday[selectedDay].hour
    );
    document.getElementById("hourlyScroll").innerHTML = hourlyHTML;
    renderForecastChart(data.forecast.forecastday[selectedDay].hour);
  });

  // Initial chart & animation
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
            </div>
        </div>

<div class="mt-6 flex justify-center relative z-20">  <!-- Added z-20 here -->
  <!-- Prevents flickering -->
  <button 
    onclick="shareWeather(
      '${data.location.name}',
      '${data.location.localtime}',
      '${sunrise}',
      '${sunset}',
      '${data.current.temp_c}',
      '${data.current.condition.text}',
      \`${activity.replace(/'/g, "\\'").replace(/`/g, "\\`")}\`,
      '${data.location.country}'
    )" 
    class="group relative z-30 overflow-hidden w-full max-w-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-blue-500 transition-all duration-300 ease-in-out transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
    style="backface-visibility: hidden;"
  >
    <!-- Animated background effect -->
    <span class="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
    
    <!-- Button content -->
    <span class="relative z-10 flex items-center justify-center gap-3 text-lg font-semibold tracking-wide">
      <i class="fas fa-share-alt text-xl transition-transform group-hover:rotate-12 duration-300"></i>
      Share Weather Report
      <i class="text-xl opacity-80">⛅</i>
    </span>
  </button>
</div>

    `;
}

function generateHourlyForecast(hourlyData, isToday = false) {
  const now = new Date();
  const currentHour = now.getHours();

  // Slice only if it's today
  const dataToShow = isToday ? hourlyData.slice(currentHour) : hourlyData;

  return dataToShow
    .map((hour, index) => {
      const time = new Date(hour.time);
      const hourVal = time.getHours();
      const hourString =
        hourVal === 0
          ? "12AM"
          : hourVal === 12
          ? "12PM"
          : hourVal > 12
          ? `${hourVal - 12}PM`
          : `${hourVal}AM`;

      const isCurrentHour = isToday && index === 0;

      return `
            <div class="hourly-item flex flex-col items-center px-3 py-2 ${
              isCurrentHour ? "bg-blue-50/30 rounded-lg" : ""
            }">
               <span class="text-xs font-medium">${
                 isToday && index === 0 ? "Now" : hourString
               }</span>
               <img src="${hour.condition.icon}" alt="${
        hour.condition.text
      }" class="w-8 h-8 my-1">
               <span class="text-sm font-bold">${hour.temp_c}°</span>
               <div class="rain-chance mt-1 flex flex-col items-center">
                  <span class="text-xs ${
                    hour.chance_of_rain > 0 ? "text-blue-600" : "text-gray-400"
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
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
        },
      },
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
      {
        timeout: 5000,
      }
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
