const apiKey = "0c878e6f1959beca52294b966961aff3";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

const searchBox = document.getElementById("input");
const searchBtn = document.getElementById("btn");
const weatherContainer = document.getElementById("weatherContainer");
const noData = document.getElementById("noData");
const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");

let currentUnit = "celsius";
let currentData = null;
let forecastData = null;

// Set current date
function setCurrentDate() {
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "short", day: "numeric" };
  document.getElementById("date").textContent = now.toLocaleDateString("en-US", options);
}

// Update unit toggle UI
function updateUnitButtons() {
  if (currentUnit === "celsius") {
    celsiusBtn.classList.add("active");
    fahrenheitBtn.classList.remove("active");
  } else {
    fahrenheitBtn.classList.add("active");
    celsiusBtn.classList.remove("active");
  }
}

// Convert temp
function convertTemperature(temp) {
  return currentUnit === "celsius" ? temp : (temp * 9) / 5 + 32;
}

// Update current temperature display
function updateTemperatureDisplay() {
  if (currentData) {
    const temp = convertTemperature(currentData.main.temp);
    document.getElementById("temp").textContent = `${Math.round(temp)}°${currentUnit === "celsius" ? "C" : "F"}`;
  }
  if (forecastData) {
    renderForecast(forecastData);
  }
}

// Pick correct icon
function getWeatherIcon(condition, isDay = true) {
  const iconMap = {
    Clear: isDay ? "https://cdn-icons-png.flaticon.com/512/3222/3222800.png" : "https://cdn-icons-png.flaticon.com/512/3222/3222691.png",
    Clouds: "https://cdn-icons-png.flaticon.com/512/414/414927.png",
    Rain: "https://cdn-icons-png.flaticon.com/512/1163/1163657.png",
    Drizzle: "https://cdn-icons-png.flaticon.com/512/3076/3076129.png",
    Thunderstorm: "https://cdn-icons-png.flaticon.com/512/1146/1146860.png",
    Snow: "https://cdn-icons-png.flaticon.com/512/642/642102.png",
    Mist: "https://cdn-icons-png.flaticon.com/512/4005/4005901.png",
    Fog: "https://cdn-icons-png.flaticon.com/512/1197/1197102.png",
    Haze: "https://cdn-icons-png.flaticon.com/512/4005/4005901.png",
    Smoke: "https://cdn-icons-png.flaticon.com/512/4821/4821953.png",
    Dust: "https://cdn-icons-png.flaticon.com/512/4275/4275497.png",
    Sand: "https://cdn-icons-png.flaticon.com/512/4275/4275497.png",
    Ash: "https://cdn-icons-png.flaticon.com/512/1779/1779940.png",
    Squall: "https://cdn-icons-png.flaticon.com/512/4150/4150897.png",
    Tornado: "https://cdn-icons-png.flaticon.com/512/4814/4814268.png",
  };

  return iconMap[condition] || "https://cdn-icons-png.flaticon.com/512/414/414927.png";
}

// Fetch weather
async function checkWeather(city) {
  try {
    // Loading state
    noData.classList.remove("hidden");
    noData.innerHTML = `
      <div class="flex justify-center mb-6">
        <i class="fa-solid fa-spinner fa-spin text-5xl text-white"></i>
      </div>
      <h2 class="text-xl font-semibold text-white">Loading weather data...</h2>
    `;

    const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
    if (!response.ok) throw new Error("City not found");

    const data = await response.json();
    currentData = data;

    // Update current weather
    document.getElementById("city").textContent = data.name;
    document.getElementById("description").textContent = data.weather[0].description;
    document.getElementById("humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;
    document.getElementById("visibility").textContent = `${(data.visibility / 1000).toFixed(1)} km`;

    // Wind: m/s → km/h
    document.getElementById("wind").textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;

    // Temperature
    updateTemperatureDisplay();

    // Weather icon
    const weatherIconElement = document.getElementById("weatherIcon");
    weatherIconElement.src = getWeatherIcon(data.weather[0].main, true);
    weatherIconElement.alt = data.weather[0].description;

    // Get forecast
    await getForecast(city);

    // Show weather, hide no data
    weatherContainer.classList.remove("hidden");
    noData.classList.add("hidden");
  } catch (error) {
    console.error("Error fetching weather:", error);
    noData.classList.remove("hidden");
    noData.innerHTML = `
      <div class="flex justify-center mb-6">
        <i class="fa-solid fa-triangle-exclamation text-5xl text-yellow-400"></i>
      </div>
      <h2 class="text-xl font-semibold text-white mb-2">City Not Found</h2>
      <p class="text-white/70">Please check the city name and try again</p>
    `;
    weatherContainer.classList.add("hidden");
  }
}

// Fetch 5-day forecast
async function getForecast(city) {
  try {
    const response = await fetch(forecastApiUrl + city + `&appid=${apiKey}`);
    const data = await response.json();
    forecastData = data; // Save for re-render on unit change
    renderForecast(data);
  } catch (error) {
    console.error("Error fetching forecast:", error);
  }
}

// Render forecast cards
function renderForecast(data) {
  const forecastContainer = document.getElementById("forecast");
  forecastContainer.innerHTML = "";

  // Pick one reading per day (prefer 12:00 PM)
  const forecastsByDate = {};
  data.list.forEach(item => {
    const [date, time] = item.dt_txt.split(" ");
    if (time === "12:00:00" || !forecastsByDate[date]) {
      forecastsByDate[date] = item;
    }
  });

  const forecastDates = Object.keys(forecastsByDate).slice(0, 5);

  forecastDates.forEach(date => {
    const forecast = forecastsByDate[date];
    const forecastDate = new Date(date);
    const dayName = forecastDate.toLocaleDateString("en-US", { weekday: "short" });

    const temp = convertTemperature(forecast.main.temp);

    const forecastElement = document.createElement("div");
    forecastElement.className = "bg-white/10 rounded-2xl p-3 text-center";
    forecastElement.innerHTML = `
      <p class="text-white font-medium">${dayName}</p>
      <img src="${getWeatherIcon(forecast.weather[0].main)}" alt="${forecast.weather[0].description}" class="w-10 h-10 mx-auto my-2">
      <p class="text-white font-semibold">${Math.round(temp)}°${currentUnit === "celsius" ? "C" : "F"}</p>
      <p class="text-white/70 text-sm capitalize">${forecast.weather[0].description}</p>
    `;

    forecastContainer.appendChild(forecastElement);
  });
}

// Search events
searchBtn.addEventListener("click", () => {
  if (searchBox.value.trim()) checkWeather(searchBox.value.trim());
});

searchBox.addEventListener("keyup", e => {
  if (e.key === "Enter" && searchBox.value.trim()) {
    checkWeather(searchBox.value.trim());
  }
});

// Unit toggle events
celsiusBtn.addEventListener("click", () => {
  currentUnit = "celsius";
  updateUnitButtons();
  updateTemperatureDisplay();
});

fahrenheitBtn.addEventListener("click", () => {
  currentUnit = "fahrenheit";
  updateUnitButtons();
  updateTemperatureDisplay();
});

// Location support
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            searchBox.value = data[0].name;
            checkWeather(data[0].name);
          }
        })
        .catch(err => console.error("Location error:", err));
    });
  }
}
document.getElementById("btn").addEventListener("click", getLocation);

// Init
setCurrentDate();
updateUnitButtons();
