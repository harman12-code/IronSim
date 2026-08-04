// immd.js - Leaflet GPS Course Engine for IRONMAN Maryland

// IMMD Course Waypoints (Cambridge Start -> Blackwater Wildlife Refuge Loop)
const immdWaypoints = [
    [38.5631, -76.0788], // Great Marsh Park / Cambridge
    [38.5211, -76.0915], // MD-343 South
    [38.4812, -76.1012], // Approaching Blackwater
    [38.4522, -76.1051], // Key Wallace Dr Entry
    [38.4410, -76.0712], // Blackwater Visitor Center
    [38.4320, -76.0315], // Key Wallace East
    [38.3811, -76.0511], // Golden Hill Rd South
    [38.3512, -76.1215], // Decoursey Bridge Rd
    [38.4011, -76.1522], // Church Creek Turn
    [38.5022, -76.1112], // Return north to Cambridge
    [38.5631, -76.0788]  // Finish Loop
];

let map = null;
let riderMarker = null;
let currentLayer = null;
let tileLayers = {};
let currentPointIndex = 0;
let totalDistanceMiles = 0;
let lastFrameTime = performance.now();
let distanceAccumulator = 0;

function initCourse() {
    if (typeof logMsg === "function") logMsg("Loading Leaflet Open-Source Satellite Engine...");

    const startPos = immdWaypoints[0];

    // Initialize Map centered on Cambridge, MD
    map = L.map('map', {
        center: startPos,
        zoom: 14,
        zoomControl: false
    });

    // Define Free Tile Providers
    tileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });

    tileLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    });

    tileLayers.topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; OpenStreetMap'
    });

    // Default to Satellite
    currentLayer = tileLayers.satellite;
    currentLayer.addTo(map);

    // Draw IMMD Course Route Polyline (Bright Neon Green)
    L.polyline(immdWaypoints, {
        color: '#00ff88',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1
    }).addTo(map);

    // Rider Avatar Marker (Neon Cycling Circle)
    const riderIcon = L.divIcon({
        className: 'custom-rider-icon',
        html: '<div style="background-color: #00ff88; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px #00ff88;"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    riderMarker = L.marker(startPos, { icon: riderIcon }).addTo(map);

    requestAnimationFrame(updateSimLoop);
}

function changeMapStyle(styleKey) {
    if (map && tileLayers[styleKey]) {
        map.removeLayer(currentLayer);
        currentLayer = tileLayers[styleKey];
        currentLayer.addTo(map);
    }
}

function updateSimLoop() {
    const now = performance.now();
    const dtSeconds = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    const currentSpeedMPH = parseFloat(ride.speed) || 0;

    if (currentSpeedMPH > 0) {
        const incrementMiles = (currentSpeedMPH / 3600) * dtSeconds;
        totalDistanceMiles += incrementMiles;
        distanceAccumulator += incrementMiles;

        // Update UI counters
        const distEl = document.getElementById("distance");
        const progEl = document.getElementById("courseProgress");
        if (distEl) distEl.innerText = totalDistanceMiles.toFixed(2);
        if (progEl) progEl.innerText = totalDistanceMiles.toFixed(2);

        // Advance rider along path every ~0.01 miles
        if (distanceAccumulator >= 0.01) {
            distanceAccumulator = 0;
            currentPointIndex = (currentPointIndex + 1) % immdWaypoints.length;
            const nextPos = immdWaypoints[currentPointIndex];

            if (riderMarker) {
                riderMarker.setLatLng(nextPos);
            }
            if (map) {
                map.panTo(nextPos, { animate: true, duration: 0.5 });
            }
        }
    }

    requestAnimationFrame(updateSimLoop);
}

window.addEventListener("load", () => {
    initCourse();
});
