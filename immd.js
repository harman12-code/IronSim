// immd.js - High-Precision GPS Engine for IRONMAN Maryland

// Official IMMD Road-Snapped Route (Cambridge -> MD-343 -> Key Wallace Dr -> Blackwater Loop -> Cambridge)
const immdRoadCoordinates = [
    [38.56475, -76.07258], // Start: Great Marsh Park (T1 / Swim Outlet)
    [38.56312, -76.07881], // Hambrooks Blvd
    [38.55821, -76.08214], // Trenton St
    [38.55112, -76.08412], // Bayly Rd
    [38.54101, -76.08903], // Race St / Washington St
    [38.52814, -76.09012], // MD-343 / Hudson Rd Junction
    [38.52110, -76.09150], // MD-343 South
    [38.49812, -76.09650], // MD-343 passing Town Point
    [38.48120, -76.10120], // MD-16 / Church Creek Rd Junction
    [38.46811, -76.10350], // MD-16 South towards Blackwater
    [38.45220, -76.10510], // Key Wallace Dr Entry
    [38.44812, -76.08812], // Key Wallace Dr (Refuge Border)
    [38.44100, -76.07120], // Blackwater Wildlife Refuge Visitor Center
    [38.43512, -76.05210], // Key Wallace Dr East
    [38.43200, -76.03150], // Egypt Rd Intersection
    [38.40812, -76.03980], // Golden Hill Rd (MD-335) South
    [38.38110, -76.05110], // Golden Hill Rd
    [38.36120, -76.08912], // Bestpitch Ferry Rd Junction
    [38.35120, -76.12150], // Decoursey Bridge Rd
    [38.37812, -76.14120], // Key Wallace Dr West Loop
    [38.40110, -76.15220], // Church Creek Turn
    [38.44812, -76.13512], // MD-16 Northbound
    [38.50220, -76.11120], // Return route north to Cambridge
    [38.54812, -76.08512], // Entering Cambridge city limits
    [38.56475, -76.07258]  // Finish: Great Marsh Park (T2)
];

// Linear Interpolation to generate thousands of ultra-fine sub-points along every curve
function interpolateRoad(coords, targetPoints = 3000) {
    let result = [];
    const segments = coords.length - 1;
    const ptsPerSegment = Math.floor(targetPoints / segments);

    for (let i = 0; i < segments; i++) {
        const start = coords[i];
        const end = coords[i + 1];
        for (let j = 0; j < ptsPerSegment; j++) {
            const t = j / ptsPerSegment;
            const lat = start[0] + (end[0] - start[0]) * t;
            const lng = start[1] + (end[1] - start[1]) * t;
            result.push([lat, lng]);
        }
    }
    result.push(coords[coords.length - 1]);
    return result;
}

const denseRoadPath = interpolateRoad(immdRoadCoordinates, 5000);

let map = null;
let riderMarker = null;
let currentLayer = null;
let tileLayers = {};
let currentPathProgress = 0;
let totalDistanceMiles = 0;
let lastFrameTime = performance.now();

// Total official course distance
const OFFICIAL_COURSE_MILES = 112.0;

function initCourse() {
    if (typeof logMsg === "function") logMsg("Loading Road-Snapped IRONMAN Maryland GPS Engine...");

    const startPos = denseRoadPath[0];

    map = L.map('map', {
        center: startPos,
        zoom: 18, // High-zoom view locked directly onto the asphalt
        zoomControl: false,
        fadeAnimation: true,
        markerZoomAnimation: true
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

    // Draw the green course line on the asphalt
    L.polyline(denseRoadPath, {
        color: '#00ff88',
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1
    }).addTo(map);

    // Rider Avatar
    const riderIcon = L.divIcon({
        className: 'custom-rider-icon',
        html: '<div style="background-color: #00ff88; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px #00ff88;"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
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
        // Accurately accumulate true physical mileage: Distance = Speed * Time
        const incrementMiles = (currentSpeedMPH / 3600) * dtSeconds;
        totalDistanceMiles += incrementMiles;

        // Update HUD
        const distEl = document.getElementById("distance");
        const progEl = document.getElementById("courseProgress");
        if (distEl) distEl.innerText = totalDistanceMiles.toFixed(2);
        if (progEl) progEl.innerText = totalDistanceMiles.toFixed(2);

        // Progress along array exactly proportional to 112.0 total miles
        const totalNodes = denseRoadPath.length;
        const progressPercent = Math.min(totalDistanceMiles / OFFICIAL_COURSE_MILES, 1.0);
        currentPathProgress = progressPercent * (totalNodes - 1);

        const idx = Math.floor(currentPathProgress);
        const fraction = currentPathProgress - idx;
        const p1 = denseRoadPath[idx];
        const p2 = denseRoadPath[Math.min(idx + 1, totalNodes - 1)];

        // Smooth position calculation along the road center
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
