function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

function filterLocationsWithinRadius(targetLat, targetLon, stations, radius) {
    available_locations = {}
    for(stationName in stations) {
        const distance = haversineDistance(targetLat, targetLon, stations[stationName]["lat"], stations[stationName]["lon"]);
        if(distance <= radius) {
            // addMarkerToMap(
            //     stationName,
            //     stations[stationName].lat,
            //     stations[stationName].lon,
            //     commodity,
            //     newQuantity
            // );
            available_locations[stationName] = stations[stationName]
        }
        else {
            removeMarker(stationName)
        }
    }
    return available_locations
}

// Usage
const targetLat = 2; // Target latitude
const targetLon = 2; // Target longitude
const radius = 160; // 

async function removeMarker(stationName) {
    // Check if the marker exists in the markers object
    console.log("Test")
    for (let key in markers) {
        console.log(`Key: "${key}"`); // Logs each key to see if any oddities are present
    }
    const marker = await markers[stationName]
    if (marker) {
        map.removeLayer(markers[stationName]); // Remove the marker from the map
        delete markers[stationName]; // Remove the marker from the markers object
        console.log(`Marker for station '${stationName}' removed.`);
    } else {
        console.log(`No marker found for station '${stationName}'.`);
    }
}

console.log(markers)
removeMarker("TestingStation")

// console.log(filterLocationsWithinRadius(targetLat,targetLon,stations,radius), "test")
updateStationList()
