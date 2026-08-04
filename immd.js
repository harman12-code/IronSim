// immd.js - Auto-Routing Engine with OSM Road Snapping for IRONMAN Maryland

// Key waypoints through Cambridge & Blackwater Refuge
const waypoints = [
    [38.56475, -76.07258], // Start: Great Marsh Park
    [38.56312, -76.08050], // Hambrooks Ave
    [38.55821, -76.08214], // Trenton St
    [38.55112, -76.08412], // Bayly Rd
    [38.54101, -76.08903], // MD-343 (Hudson Rd)
    [38.52814, -76.09012], // MD-343 South
    [38.48120, -76.10120], // MD-16 South
    [38.45220, -76.10510], // Key Wallace Dr Entry
    [38.44100, -76.07120], // Blackwater Visitor Center
    [38.43200, -76.03150], // Egypt Rd Intersection
    [38.38110, -76.05110], // Golden Hill Rd (MD-335)
    [38.35120, -76.12150], // Decoursey Bridge Rd
    [38.40110, -76.15220], // Church Creek Turn
    [38.48210, -76.11820], // MD-16 Northbound
    [38.56475, -76.07258]  // Finish: Great Marsh Park
];

let map = null;
let riderMarker = null;
let tileLayers = {};
let currentLayer = null;
let snappedPath = [];
let totalDistanceMiles = 0;
let lastFrameTime = performance.now();
const OFFICIAL_COURSE_MILES = 112.0;

async function fetchSnappedRoads() {
    if (typeof logMsg === "function") logMsg("Snapping course to real road geometries via OpenStreetMap...");

    // Build OSRM Routing URL using real road networks
    const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/biking/${coordsStr}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            // Extract the high-density coordinate array that fits the exact road curves
            snappedPath = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            if (typeof logMsg === "function") logMsg(`Successfully loaded ${snappedPath.length} road-snapped coordinates!`);
        } else {
            snappedPath = waypoints;
        }
    } catch (e) {
        if (typeof logMsg === "function") logMsg("OSRM API fallback used.");
        snappedPath = waypoints;
    }

    drawCourse();
}

function initCourse() {
    const startPos = waypoints[0];

    map = L.map('map', {
        center: startPos,
        zoom: 18,
        zoomControl: false
    });

    tileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
    });

    tileLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    });

    currentLayer = tileLayers.satellite;
    currentLayer.addTo(map);

    fetchSnappedRoads();
}

function drawCourse() {
    if (snappedPath.length > 0) {
        L.polyline(snappedPath, {
            color: '#00ff88',
            weight: 5,
            opacity: 0.9
        }).addTo(map);

        const riderIcon = L.divIcon({
            className: 'custom-rider-icon',
            html: '<div style="background-color: #00ff88; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px #00ff88;"></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        riderMarker = L.marker(snappedPath[0], { icon: riderIcon }).addTo(map);
        requestAnimationFrame(updateSimLoop);
    }
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

    if (currentSpeedMPH > 0 && snappedPath.length > 0) {
        const incrementMiles = (currentSpeedMPH / 3600) * dtSeconds;
        totalDistanceMiles += incrementMiles;

        const distEl = document.getElementById("distance");
        const progEl = document.getElementById("courseProgress");
        if (distEl) distEl.innerText = totalDistanceMiles.toFixed(2);
        if (progEl) progEl.innerText = totalDistanceMiles.toFixed(2);

        const totalNodes = snappedPath.length;
        const progressPercent = Math.min(totalDistanceMiles / OFFICIAL_COURSE_MILES, 1.0);
        const currentPathProgress = progressPercent * (totalNodes - 1);

        const idx = Math.floor(currentPathProgress);
        const fraction = currentPathProgress - idx;
        const p1 = snappedPath[idx];
        const p2 = snappedPath[Math.min(idx + 1, totalNodes - 1)];

        const currentLat = p1[0] + (p2[0] - p1[0]) * fraction;
        const currentLng = p1[1] + (p2[1] - p1[1]) * fraction;
        const currentPos = [currentLat, currentLng];

        if (riderMarker) riderMarker.setLatLng(currentPos);
        if (map) map.panTo(currentPos, { animate: false });
    }

    requestAnimationFrame(updateSimLoop);
}

window.addEventListener("load", () => {
    initCourse();
});
