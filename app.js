const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const searchBtn = document.querySelector('#search-btn');
const statusMessage = document.querySelector('#status-message');
const currentWeather = document.querySelector('#current-weather');
const currentCity = document.querySelector('#current-city');
const currentTemp = document.querySelector('#current-temp');
const currentWind = document.querySelector('#current-wind');
const forecast = document.querySelector('#forecast');
const forecastCards = document.querySelector('#forecast-cards');
const recentSection = document.querySelector('#recent-section');
const recentList = document.querySelector('#recent-list');
function setStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('error', isError);
}

function renderCurrentWeather(data) {
    currentCity.textContent = data.city;
    currentTemp.textContent = `${Math.round(data.temperature)} °C`;
    currentWind.textContent = `风速: ${data.windspeed} km/h`;
    currentWeather.hidden = false;
}

function renderForecast(days) {
    forecastCards.innerHTML = '';
    if(days.length === 0) {
        forecast.hidden = true;
        return;
    }
    days.forEach(day => {
        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <div class="forecast-date">${day.date}</div>
            <div class="forecast-temp">
                <span class="max">${Math.round(day.max)}°</span>
                <span class="min">${Math.round(day.min)}°</span>
            </div>
            `;
        forecastCards.appendChild(item);
    }   );
    forecast.hidden = false;
}

function friendlyError(error){
    if(error instanceof TypeError)return '网络错误，请检查您的网络连接';
    return error.message || '发生未知错误，请稍后再试';
}
searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (!city) {
        setStatus('请输入城市名称', true);
        return;
    }
    searchBtn.disabled = true;
    setStatus('正在获取天气数据...');
    try{
        const location = await fetchWeatherData(city);
        console.log('坐标结果:', location);
        setStatus(`已找到 ${location.name} （纬度: ${location.latitude}, 经度: ${location.longitude}）`);
    } catch (error) {
        setStatus(friendlyError(error), true);
    } finally {
        searchBtn.disabled = false;
    }
});
async function fetchWeatherData(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`地理编码请求失败：HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error('未找到该城市的地理编码信息');
    }
    const result = data.results[0];
    return {
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
    };
}
