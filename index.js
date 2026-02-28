// --- DOM Elements ---
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const dropdownBtn = document.getElementById('dropdown-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const btnText = document.getElementById('btn-txt');

// Global variable to store fetched data for filtering
let currentWeatherData = null;

// --- 1. Dropdown Logic & Event Delegation ---
dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('hidden');
});

dropdownMenu.addEventListener('click', (e) => {
    const listitem = e.target.closest('li');
    if (listitem && currentWeatherData) {
        const selectedDate = listitem.getAttribute('data-date');
        const selectedDayName = listitem.innerText;

        // Update UI
        btnText.innerText = selectedDayName;
        dropdownMenu.classList.add('hidden');

        // Update the hourly sidebar based on the selected date
        updateHourlyDisplay(currentWeatherData, selectedDate);
    }
});

// Close dropdown when clicking outside
window.addEventListener('click', () => {
    dropdownMenu.classList.add('hidden');
});

// --- 2. Helper Functions ---

// Map WMO codes to local image paths
function getWeatherIcon(code) {
    if (code === 0) return 'assets/images/icon-sunny.webp';
    if (code >= 1 && code <= 3) return "assets/images/icon-partly-cloudy.webp";
    if (code >= 45 && code <= 48) return 'assets/images/icon-fog.webp';
    if (code >= 51 && code <= 67) return 'assets/images/icon-rain.webp';
    if (code >= 71 && code <= 77) return 'assets/images/icon-snow.webp';
    if (code >= 80 && code <= 82) return 'assets/images/icon-drizzle.webp';
    if (code >= 95) return 'assets/images/icon-storm.webp';
    return 'assets/images/icon-overcast.webp';
}

// Function to update the Hourly Sidebar
function updateHourlyDisplay(data, targetDate) {
    const hourlyContainer = document.getElementById('hourly-container');
    hourlyContainer.innerHTML = '';

    data.hourly.time.forEach((timeStr, index) => {
        // timeStr format is "YYYY-MM-DDTHH:mm"
        if (timeStr.split('T')[0] === targetDate) {
            const hour = timeStr.split('T')[1];
            const temp = data.hourly.temperature_2m[index];
            
            hourlyContainer.innerHTML += `
                <div class="flex justify-between items-center border border-slate-700 px-4 py-3 rounded-lg bg-slate-800 mb-2">
                    <span class="text-slate-300">${hour}</span>
                    <span class="font-bold text-xl">${temp}°</span>
                </div>`;
        }
    });
}

// --- 3. Main Weather Fetch Function ---
async function fetchWeather(lat, lon, cityName) {
    try {
        const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature,precipitation,wind_speed_10m&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
        
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // Save to global variable for the dropdown to use
        currentWeatherData = data;

        // Update Header
        document.getElementById("city-display").innerText = cityName;
        document.getElementById("current-date").innerText = new Date().toLocaleDateString("en-GB", {
            weekday: "long", year: "numeric", day: "numeric", month: "long"
        });

        // Reset Dropdown Button Text
        btnText.innerText = "Select Day";

        // Update Current Stats
        document.getElementById("current-temp").innerText = `${Math.round(data.current.temperature_2m)}°`;
        document.getElementById("feels-like").innerText = `${Math.round(data.current.apparent_temperature)}°C`;
        document.getElementById("humidity").innerText = `${data.current.relative_humidity_2m}%`;
        document.getElementById("wind-speed").innerText = `${data.current.wind_speed_10m}km/h`;
        document.getElementById("precip").innerText = `${data.current.precipitation}mm`;

        // Update Hourly Sidebar (Default to Today)
        const today = data.daily.time[0]; 
        updateHourlyDisplay(data, today);

        // Update Daily Cards & Dropdown List
        const dailyContainer = document.getElementById('daily-container');
        dailyContainer.innerHTML = '';
        dropdownMenu.innerHTML = '';

        for (let i = 0; i < data.daily.time.length; i++) {
            const dateValue = data.daily.time[i];
            const dateObj = new Date(dateValue);
            const fullDayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
            const shortDayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
            
            const max = Math.round(data.daily.temperature_2m_max[i]);
            const min = Math.round(data.daily.temperature_2m_min[i]);
            const icon = getWeatherIcon(data.daily.weather_code[i]);

            // Populate Bottom Cards
            dailyContainer.innerHTML += `
                <div class="flex-1 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col py-3 px-2 justify-between items-center min-w-[100px]">
                    <p class="text-slate-400 text-xs uppercase font-bold">${shortDayName}</p>
                    <img src="${icon}" alt="weather icon" class="w-12 h-12" />
                    <div class="text-center">
                        <p class="font-bold text-lg">${max}°</p>
                        <p class="text-slate-500 text-sm">${min}°</p>
                    </div>
                </div>`;

            // Populate Dropdown
            dropdownMenu.innerHTML += `
                <li data-date="${dateValue}" class="px-4 py-2 hover:bg-slate-700 cursor-pointer text-slate-200 transition-colors border-b border-slate-700/50 last:border-0">
                    ${fullDayName}
                </li>`;
        }
    } catch (err) {
        console.error("Weather fetch failed", err);
    }
}

// --- 4. Search Functionality ---
async function handleSearch() {
    const query = cityInput.value.trim();
    if (!query) return;

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
        const res = await fetch(geoUrl);
        const geoData = await res.json();

        if (geoData.results && geoData.results.length > 0) {
            const { latitude, longitude, name, country } = geoData.results[0];
            fetchWeather(latitude, longitude, `${name}, ${country}`);
        } else {
            alert("Location not found!");
        }
    } catch (err) {
        console.error("Search failed", err);
    }
}

// --- 5. Event Listeners ---
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') handleSearch(); 
});

// Initial Load
fetchWeather(17.384, 78.4564, "Hyderabad, India");