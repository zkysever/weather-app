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
            <div class="forecast-desc">${day.desc || ''}</div>
            `;
        forecastCards.appendChild(item);
    });
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
        setStatus('正在获取天气信息...');
        const weather = await fetchWeather(location.latitude, location.longitude);
        renderCurrentWeather({
            city: location.name,
            temperature: weather.current.temperature_2m,
            windspeed: weather.current.wind_speed_10m,
        });
        const days = weather.daily.time.map((date, index) => ({
            date:['今天', '明天', '后天'][index] || date.slice(5),
            max: weather.daily.temperature_2m_max[index],
            min: weather.daily.temperature_2m_min[index],
            desc: weatherText(weather.daily.weather_code[index]),
        }));
        renderForecast(days);
        setStatus(`天气数据获取成功: ${location.name}`);
    }   catch(error){
        setStatus(friendlyError(error), true);
    }   finally{
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
async function fetchWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}`+
    `&current=temperature_2m,wind_speed_10m,weather_code`+
    `&daily=temperature_2m_max,temperature_2m_min,weather_code`+
    `&timezone=auto&forecast_days=3`;
    const response = await fetch(url);
    if(!response.ok){
        throw new Error(`天气数据请求失败：HTTP ${response.status}`);
    }
    const data = await response.json();
    if(!data.current || !data.daily){
        throw new Error('天气数据格式异常，请稍后再试');
    }
    return data;
}
const WEATHER_TEXT = {
  0: '晴', 1: '晴间多云', 2: '多云', 3: '阴',
  45: '雾', 48: '雾凇',
  51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨',
  56: '冻雨', 57: '冻雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  66: '冻雨', 67: '冻雨',
  71: '小雪', 73: '中雪', 75: '大雪',
  77: '雪粒',
  80: '阵雨', 81: '阵雨', 82: '强阵雨',
  85: '阵雪', 86: '强阵雪',
  95: '雷阵雨', 96: '雷阵雨伴冰雹', 99: '强雷暴伴冰雹',
};
const weatherText = (code) => WEATHER_TEXT[code] ?? '未知';
