// ===== Weather App (Upgraded) =====
// Made for your current HTML & CSS layout

const API_KEY = 'f14a962b738ce850ae61fa2e34a19f98'; 
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// DOM Elements
const currentDay = document.getElementById('currentDay');
const currentDate = document.getElementById('currentDate');
const locationName = document.getElementById('locationName');
const mainTemp = document.getElementById('mainTemp');
const mainCondition = document.getElementById('mainCondition');
const precipitation = document.getElementById('precipitation');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const changeLocationBtn = document.getElementById('changeLocationBtn');
const locationModal = document.getElementById('locationModal');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const cancelBtn = document.getElementById('cancelBtn');

let weatherData = {
  current: {},
  forecast: []
};

// ===== Initialization =====
function init() {
  updateDateTime();
  attachEventListeners();
  setInterval(updateDateTime, 60000);

  const savedCity = localStorage.getItem('savedCity');
  if (savedCity) {
    fetchWeatherData(savedCity);
  } else {
    getUserLocation();
  }
}
// ===== Geolocation =====
async function getUserLocation() {
  try {
    // Try IP-based lookup first
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();

    if (data && data.city) {
      console.log(`Detected city: ${data.city}`);
      await fetchWeatherData(data.city);
      return;
    }

    // Fallback: use browser geolocation if IP failed
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          await fetchWeatherByCoords(latitude, longitude);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          fetchWeatherData('Bishkek'); // fallback
        }
      );
    } else {
      fetchWeatherData('Bishkek');
    }
  } catch (err) {
    console.error('IP lookup failed:', err);
    fetchWeatherData('Bishkek');
  }
}


// ===== Fetch by City =====
async function fetchWeatherData(city) {
  try {
    const currentRes = await fetch(`${API_URL}?q=${city}&appid=${API_KEY}&units=metric`);
    if (!currentRes.ok) throw new Error('City not found');
    const currentData = await currentRes.json();

    const forecastRes = await fetch(`${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`);
    const forecastData = await forecastRes.json();

    updateWeatherData(currentData, forecastData);
    localStorage.setItem('savedCity', currentData.name);
  } catch (err) {
    alert('Error fetching weather: ' + err.message);
  }
}

// ===== Fetch by Coordinates =====
async function fetchWeatherByCoords(lat, lon) {
  try {
    const currentRes = await fetch(`${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const currentData = await currentRes.json();

    const forecastRes = await fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const forecastData = await forecastRes.json();

    updateWeatherData(currentData, forecastData);
    localStorage.setItem('savedCity', currentData.name);
  } catch (err) {
    alert('Error fetching location weather');
  }
}

// ===== Update Weather Data =====
function updateWeatherData(current, forecast) {
  weatherData.current = {
    city: current.name,
    country: current.sys.country,
    temp: Math.round(current.main.temp),
    condition: capitalizeFirstLetter(current.weather[0].main),
    precipitation: current.clouds.all || 0,
    humidity: current.main.humidity,
    wind: Math.round(current.wind.speed * 3.6)
  };

  weatherData.forecast = processForecastData(forecast.list);
  updateWeatherDisplay();
  updateForecastDisplay();
}

// ===== Date & Time =====
function updateDateTime() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  currentDay.textContent = days[now.getDay()];
  currentDate.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ===== Display Updates =====
function updateWeatherDisplay() {
  const c = weatherData.current;
  locationName.textContent = `${c.city}, ${c.country}`;
mainTemp.textContent = `${c.temp}\u00A0°C`;
  mainCondition.textContent = c.condition;
  precipitation.textContent = `${c.precipitation}%`;
  humidity.textContent = `${c.humidity}%`;
  wind.textContent = `${c.wind} km/h`;
  updateMainIcon(c.condition);
}

function updateForecastDisplay() {
  const forecastDays = document.querySelectorAll('.forecast-day');
  weatherData.forecast.forEach((f, i) => {
    if (forecastDays[i]) {
      forecastDays[i].querySelector('.day-name').textContent = f.day;
      forecastDays[i].querySelector('.forecast-temp').textContent = `${f.temp} °C`;
      updateForecastIcon(forecastDays[i].querySelector('.forecast-icon'), f.condition);
    }
  });
}

// ===== Forecast Data Parser =====
function processForecastData(list) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyMap = {};

  list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayName = days[date.getDay()];
    const hour = date.getHours();

    // Выбираем прогноз ближе к 12:00
    if (!dailyMap[dayName] || Math.abs(hour - 12) < Math.abs(dailyMap[dayName].hour - 12)) {
      dailyMap[dayName] = {
        day: dayName,
        temp: Math.round(item.main.temp),
        condition: item.weather[0].main,
        hour: hour
      };
    }
  });

  return Object.values(dailyMap).slice(1, 5); // 4 дня, начиная со следующего
}

// ===== Weather Icons =====
function updateMainIcon(condition) {
  const icon = document.querySelector('.weather-icon-large');
  const icons = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️'
  };
  icon.innerHTML = `<text x="12" y="16" text-anchor="middle" font-size="14">${icons[condition] || '☁️'}</text>`;
}

function updateForecastIcon(svgElem, condition) {
  const icons = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️'
  };
  svgElem.innerHTML = `<text x="12" y="16" text-anchor="middle" font-size="12">${icons[condition] || '☁️'}</text>`;
}

// ===== Modal & Search =====
function attachEventListeners() {
  changeLocationBtn.addEventListener('click', openModal);
  cancelBtn.addEventListener('click', closeModal);
  searchBtn.addEventListener('click', handleSearch);
  cityInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());

  locationModal.addEventListener('click', (e) => {
    if (e.target === locationModal) closeModal();
  });
}

function openModal() {
  locationModal.classList.add('active');
  cityInput.focus();
}

function closeModal() {
  locationModal.classList.remove('active');
  cityInput.value = '';
}

async function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) return alert('Enter a city name');
  await fetchWeatherData(city);
  closeModal();
}

// ===== Utility =====
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== Start App =====
document.addEventListener('DOMContentLoaded', init);
