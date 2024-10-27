// Define the version number
const version = "1.0.0";

// Display the version number on the website when the page loads
window.onload = function () {
    const versionDisplay = document.getElementById('versionDisplay');
    if (versionDisplay) {
        versionDisplay.textContent = `Version: ${version}`;
    }
};

// Basic admin credentials
const adminUsername = 'admin';
const adminPassword = 'password';

// Data storage
let stations = loadStations();
let commodityTypes = loadCommodityTypes();
let markers = {}; // Store markers for each station
const commodityColors = {}; // Store colors for each commodity

// Persistence functions for stations
function saveStations() {
    const stationsToSave = {};
    Object.keys(stations).forEach(stationName => {
        const { lat, lon, commodities } = stations[stationName];
        stationsToSave[stationName] = { lat, lon, commodities };
    });

    localStorage.setItem('stations', JSON.stringify(stationsToSave));
}

function loadStations() {
    const savedStations = localStorage.getItem('stations');
    return savedStations ? JSON.parse(savedStations) : {};
}

// Persistence functions for commodity types
function saveCommodityTypes() {
    localStorage.setItem('commodityTypes', JSON.stringify(commodityTypes));
}

function loadCommodityTypes() {
    const savedTypes = localStorage.getItem('commodityTypes');
    return savedTypes ? JSON.parse(savedTypes) : [];
}

// Login function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === adminUsername && password === adminPassword) {
        localStorage.setItem('loggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        document.getElementById('error-message').textContent = 'Incorrect username or password';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('loggedIn');
    window.location.href = 'index.html';
}

// Check if admin is logged in when loading dashboard
if (window.location.pathname.includes('dashboard.html')) {
    if (!localStorage.getItem('loggedIn')) {
        window.location.href = 'index.html';
    }
}

// Initialize map only if on the dashboard page and the map element exists
let map;
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('map')) {
        map = L.map('map').setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Load saved stations and add markers for each station
        Object.keys(stations).forEach(stationName => {
            const station = stations[stationName];
            addMarkerToMap(stationName, station.lat, station.lon, station.commodities);
        });

        updateStationSelect();
        updateStationList();
        updateCommoditySelect();
        centerMapOnMarkers(); // Center map on initial markers
    }
});

// Function to generate a color palette with 30 unique colors
function generateColorPalette() {
    const colors = [];
    for (let i = 0; i < 30; i++) {
        colors.push(`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`);
    }
    return colors;
}

// Assign colors to commodities from the palette
const colorPalette = generateColorPalette();
function getColorForCommodity(commodity) {
    if (!commodityColors[commodity]) {
        commodityColors[commodity] = colorPalette[Object.keys(commodityColors).length % colorPalette.length];
    }
    return commodityColors[commodity];
}

// Function to update station dropdown
function updateStationSelect() {
    const stationSelect = document.getElementById('stationSelect');
    stationSelect.innerHTML = '<option value="">Select Station</option>';

    for (const station in stations) {
        const option = document.createElement('option');
        option.value = station;
        option.textContent = station;
        stationSelect.appendChild(option);
    }
}

// Function to update commodity dropdown
function updateCommoditySelect() {
    const commoditySelect = document.getElementById('commoditySelect');
    commoditySelect.innerHTML = '<option value="">Select Commodity</option>';

    commodityTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        commoditySelect.appendChild(option);
    });
}

// Function to center the map based on the bounds of all markers
function centerMapOnMarkers() {
    const markerBounds = L.latLngBounds([]);
    const markerList = Object.values(markers);

    markerList.forEach(marker => {
        markerBounds.extend(marker.getLatLng());
    });

    if (markerList.length === 1) {
        map.setView(markerList[0].getLatLng(), 8); // Zoom level for a single marker
    } else if (markerBounds.isValid()) {
        map.fitBounds(markerBounds);
    }
}

// Function to add a marker with a dynamic tooltip displaying commodities
function addMarkerToMap(stationName, lat, lon, commodities) {
    const markerKey = stationName;

    // Remove existing marker if it exists (to avoid duplicates)
    if (markers[markerKey]) {
        map.removeLayer(markers[markerKey]);
    }

    // Only add a marker if there are commodities
    const totalQuantity = Object.values(commodities).reduce((acc, qty) => acc + qty, 0);
    if (totalQuantity > 0) {
        const icon = L.divIcon({
            className: 'simple-icon',
            html: `<div style="width: 20px; height: 20px; background-color: #007bff; border-radius: 50%;"></div>`,
            iconSize: [20, 20]
        });

        const tooltipContent = formatCommoditiesTooltip(stationName, commodities);

        const marker = L.marker([lat, lon], { icon })
            .addTo(map)
            .bindTooltip(tooltipContent, { direction: "top", offset: [0, -10], className: 'commodity-tooltip' });

        markers[markerKey] = marker;
    }

    centerMapOnMarkers(); // Re-center map on markers after each update
}

// Helper function to format commodities for the tooltip, including the station name
function formatCommoditiesTooltip(stationName, commodities) {
    let tooltipContent = `<b>${stationName}</b><br>`;
    tooltipContent += Object.entries(commodities)
        .map(([commodity, quantity]) => {
            const color = getColorForCommodity(commodity);
            return `<div style="display: flex; align-items: center;">
                        <div style="width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 5px;"></div>
                        ${commodity}: ${quantity}
                    </div>`;
        })
        .join("");
    return tooltipContent;
}

// Function to add a deployment station without saving the marker
function addDeploymentStation() {
    const stationName = document.getElementById('stationName').value;
    const lat = parseFloat(document.getElementById('stationLat').value);
    const lon = parseFloat(document.getElementById('stationLon').value);

    if (!stationName || isNaN(lat) || isNaN(lon)) {
        alert("Please provide valid station name and coordinates.");
        return;
    }

    if (stations[stationName]) {
        alert("A station with this name already exists.");
        return;
    }

    stations[stationName] = { lat, lon, commodities: {} };

    saveStations();
    updateStationSelect();
    updateStationList();
    centerMapOnMarkers();

    document.getElementById('stationName').value = '';
    document.getElementById('stationLat').value = '';
    document.getElementById('stationLon').value = '';
}

// Function to add a new commodity type
function addCommodityType() {
    const newType = document.getElementById('newCommodityType').value;
    if (!newType) {
        alert("Please enter a valid commodity type.");
        return;
    }

    if (!commodityTypes.includes(newType)) {
        commodityTypes.push(newType);
        saveCommodityTypes();
        updateCommoditySelect();
    }

    document.getElementById('newCommodityType').value = '';
}

// Function to add or subtract a commodity quantity at a station
function updateCommodityQuantity(isAdding) {
    const stationName = document.getElementById('stationSelect').value;
    const commodityType = document.getElementById('commoditySelect').value;
    const quantity = parseInt(document.getElementById('commodityQuantity').value);

    if (!stationName || !commodityType || isNaN(quantity) || quantity <= 0) {
        alert("Please select a station, a commodity type, and provide a valid quantity.");
        return;
    }

    if (!stations[stationName].commodities[commodityType]) {
        stations[stationName].commodities[commodityType] = 0;
    }
    stations[stationName].commodities[commodityType] += isAdding ? quantity : -quantity;
    if (stations[stationName].commodities[commodityType] < 0) {
        stations[stationName].commodities[commodityType] = 0;
    }
    saveStations();

    addMarkerToMap(stationName, stations[stationName].lat, stations[stationName].lon, stations[stationName].commodities);
    updateStationList();
    centerMapOnMarkers();

    document.getElementById('commoditySelect').value = '';
    document.getElementById('commodityQuantity').value = 1;
}

// Function to update station list display
function updateStationList() {
    const stationList = document.getElementById('stationList');
    
    // Check if stationList exists
    if (!stationList) {
        console.error("Station list element not found in the DOM.");
        return; // Exit the function if the element is missing
    }

    stationList.innerHTML = ''; // Clear the list

    for (const stationName in stations) {
        const station = stations[stationName];
        
        // Station title with latitude and longitude
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${stationName}</strong> (Lat: ${station.lat}, Lon: ${station.lon})`;
        
        // Commodities list
        const commoditiesList = document.createElement('ul');
        commoditiesList.style.listStyleType = 'none'; // Remove bullets for commodities list

        for (const commodity in station.commodities) {
            const quantity = station.commodities[commodity];
            const commodityItem = document.createElement('li');
            commodityItem.innerHTML = `<span>${commodity}: ${quantity}</span>`;

            // Add and Subtract buttons for each commodity
            const increaseButton = document.createElement('button');
            increaseButton.textContent = "+";
            increaseButton.className = "add-button";
            increaseButton.onclick = () => changeQuantity(stationName, commodity, 1);

            const decreaseButton = document.createElement('button');
            decreaseButton.textContent = "-";
            decreaseButton.className = "subtract-button";
            decreaseButton.onclick = () => changeQuantity(stationName, commodity, -1);

            // Add buttons to commodity item
            commodityItem.appendChild(increaseButton);
            commodityItem.appendChild(decreaseButton);

            // Append commodity item to commodities list
            commoditiesList.appendChild(commodityItem);
        }

        // Append commodities list to station item
        listItem.appendChild(commoditiesList);
        stationList.appendChild(listItem);
    }
}


// Function to change the quantity of a commodity
function changeQuantity(stationName, commodity, amount) {
    const newQuantity = (stations[stationName].commodities[commodity] || 0) + amount;

    if (newQuantity > 0) {
        stations[stationName].commodities[commodity] = newQuantity;
    } else {
        delete stations[stationName].commodities[commodity];
    }

    saveStations();

    if (Object.keys(stations[stationName].commodities).length === 0) {
        delete markers[stationName]; // Remove marker if no commodities remain
    }

    addMarkerToMap(
        stationName,
        stations[stationName].lat,
        stations[stationName].lon,
        stations[stationName].commodities
    );

    updateStationList();
    centerMapOnMarkers();
}
