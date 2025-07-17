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

  // Hourly Forecast Cards Instead of Dropdown
  const hourlyContainer = document.createElement("div");
  hourlyContainer.className =
    "hourly-forecast-container mt-6 w-full max-w-3xl animate-fadeIn";

  // Day Tabs
  const dayTabs = data.forecast.forecastday
    .map((day, i) => {
      const dateObj = new Date(day.date);
      const dateLabel = dateObj.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      return `
        <button 
          class="day-tab px-3 py-2 rounded-xl text-sm bg-white/20 hover:bg-white/40 backdrop-blur text-gray-900 transition-all" 
          data-day-index="${i}"
        >
          ${dateLabel}
        </button>`;
    })
    .join("");

  // Initial Hourly Forecast
  const hourlyHTML = generateHourlyForecast(
    data.forecast.forecastday[0].hour,
    0,
    currentTime
  );

  hourlyContainer.innerHTML = `
    <div class="mb-3 flex gap-2 overflow-x-auto">${dayTabs}</div>
    <div id="hourlyScroll" class="hourly-scroll-container flex overflow-x-auto pb-4 scrollbar-hide">
      ${hourlyHTML}
    </div>
  `;

  mainContainer.appendChild(hourlyContainer);

  // Event Listener for Each Tab
  setTimeout(() => {
    document.querySelectorAll(".day-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const selectedDay = parseInt(btn.getAttribute("data-day-index"));
        const hourlyHTML = generateHourlyForecast(
          data.forecast.forecastday[selectedDay].hour,
          selectedDay,
          currentTime
        );
        document.getElementById("hourlyScroll").innerHTML = hourlyHTML;
        renderForecastChart(data.forecast.forecastday[selectedDay].hour);
      });
    });
  }, 100);

  // Animations & Chart
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

function generateHourlyForecast(
  hourlyData,
  dayIndex = 0,
  currentTime,
  selectedDayIndex
) {
  const now = new Date(currentTime);
  const currentHour = now.getHours();

  // Filter data based on current time if it's today
  const dataToShow =
    dayIndex === 0
      ? hourlyData.filter((hour) => {
          const hourVal = new Date(hour.time).getHours();
          return hourVal >= currentHour;
        })
      : hourlyData;

  const isSelected = dayIndex === selectedDayIndex;
  const selectionIndicator = isSelected
    ? `before:content-[''] before:absolute before:-top-1 before:left-1/2 before:-translate-x-1/2 before:w-2 before:h-2 before:bg-blue-500 before:rounded-full`
    : "";

  const shortLabel =
    dayIndex === 0
      ? "Today"
      : dayIndex === 1
      ? "Tomorrow"
      : new Date(hourlyData[0].time).toLocaleDateString("en-US", {
          weekday: "short",
        });

  return `
    <div class="relative mb-6">
      <div class="hourly-header mb-3 flex justify-between items-center px-2">
        <h3 class="text-sm font-semibold text-gray-700">
          ${shortLabel}
        </h3>

        <button class="day-selector relative flex items-center gap-1
          ${
            isSelected
              ? "bg-gradient-to-r from-blue-100 via-white to-blue-100 border border-blue-300 text-blue-800 font-semibold shadow-md scale-[1.03]"
              : "bg-white border border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-700"
          }
          text-xs px-3 py-1 rounded-full transition-all duration-300 ease-in-out"
          data-day-index="${dayIndex}">
          ${isSelected ? `<span class="text-blue-600 text-sm">📅</span>` : ""}
          ${shortLabel}
        </button>
      </div>

      <div class="hourly-container relative ${selectionIndicator}">
        <div class="flex overflow-x-auto pb-4 scrollbar-hide space-x-1 px-2">
          ${dataToShow
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

              const isNow = dayIndex === 0 && index === 0;
              const isDayTime = hour.is_day === 1;
              const highlightClass = isNow
                ? "bg-gradient-to-b from-blue-100/40 to-blue-50/20 shadow-sm"
                : "";
              const timeClass = isNow
                ? "font-bold text-blue-700"
                : "text-gray-700";
              const tempClass = isNow
                ? "text-blue-800"
                : isDayTime
                ? "text-gray-900"
                : "text-gray-800";
              const borderClass = isNow
                ? "border border-blue-200"
                : "border border-transparent";

              return `
                <div class="hourly-item flex flex-col items-center px-3 py-3 rounded-xl transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white/30 ${highlightClass} ${borderClass} min-w-[60px]">
                  <span class="text-xs ${timeClass} transition-colors duration-200">${
                isNow ? "Now" : hourString
              }</span>
                  <img src="${hour.condition.icon}" alt="${
                hour.condition.text
              }" class="w-9 h-9 my-1 transition-transform duration-300 hover:scale-110">
                  <span class="text-sm font-semibold ${tempClass}">${
                hour.temp_c
              }°</span>
                  <div class="rain-chance mt-1 flex flex-col items-center">
                    <span class="text-xs ${
                      hour.chance_of_rain > 0
                        ? "text-blue-600 font-medium"
                        : "text-gray-500"
                    } transition-colors duration-200">
                      ${
                        hour.chance_of_rain > 0
                          ? `<span class="inline-block animate-bounce">☔</span>`
                          : `<span class="opacity-70">💧</span>`
                      } 
                      ${hour.chance_of_rain}%
                    </span>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    </div>
  `;
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
