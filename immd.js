// immd.js - High-Precision Turn-by-Turn GPS Engine for IRONMAN Maryland

// Turn-by-turn road coordinates for Cambridge & Blackwater Refuge
const immdRoadCoordinates = [
    // Transition 1: Great Marsh Park / Water St
    [38.56475, -76.07258],
    [38.56535, -76.07430], // Water St along waterfront
    [38.56580, -76.07680], // Water St curve
    [38.56520, -76.07820], // Turn onto Hambrooks Ave
    [38.56312, -76.08050], // Hambrooks Ave
    [38.56080, -76.08170], // Hambrooks Ave South
    [38.55821, -76.08214], // Turn onto Trenton St
    [38.55540, -76.08280], // Trenton St South
    [38.55112, -76.08412], // Turn onto Bayly Rd
    [38.54720, -76.08580], // Bayly Rd South
    [38.54350, -76.08720], // Turn onto MD-343 (Hudson Rd)
    [38.54101, -76.08903], // MD-343 Outbound
    [38.53320, -76.08980], // MD-343 South
    [38.52814, -76.09012], // MD-343 near Town Point Rd
    [38.52110, -76.09150], // MD-343 straightaway
    [38.50850, -76.09420], // MD-343 approaching MD-16
    [38.49812, -76.09650], // Junction MD-343 / MD-16
    [38.48120, -76.10120], // MD-16 South (Church Creek Rd)
    [38.46811, -76.10350], // MD-16 South
    [38.45920, -76.10420], // MD-16 near Church Creek town
    [38.45220, -76.10510], // Turn East onto Key Wallace Dr
    [38.45110, -76.09820], // Key Wallace Dr Eastbound
    [38.44812, -76.08812], // Key Wallace Dr (Refuge Entry)
    [38.44520, -76.07980], // Key Wallace Dr
    [38.44100, -76.07120], // Blackwater Visitor Center
    [38.43820, -76.06150], // Key Wallace Dr East
    [38.43512, -76.05210], // Key Wallace Dr East
    [38.43200, -76.03150], // Turn South onto Egypt Rd
    [38.42150, -76.03320], // Egypt Rd South
    [38.40812, -76.03980], // Turn West onto Golden Hill Rd (MD-335)
    [38.39520, -76.04450], // MD-335 South
    [38.38110, -76.05110], // MD-335 South
    [38.37120, -76.06820], // MD-335 West
    [38.36120, -76.08912], // Turn North onto Bestpitch Ferry Rd
    [38.35120, -76.12150], // Decoursey Bridge Rd / Maple Dam Rd
    [38.36540, -76.13210], // Maple Dam Rd North
    [38.37812, -76.14120], // Maple Dam Rd North
    [38.40110, -76.15220], // Church Creek Turn
    [38.42850, -76.14250], // MD-16 Northbound
    [38.44812, -76.13512], // MD-16 Northbound
    [38.48210, -76.11820], // MD-16 Northbound
    [38.50220, -76.11120], // MD-16 approaching Cambridge
    [38.53210, -76.09250], // Entering Cambridge city limits
    [38.54812, -76.08512], // Race St North
    [38.55820, -76.07820], // Hambrooks Ave North
    [38.56475, -76.07258]  // Finish: Great Marsh Park (T2)
];

// High-density sub-point interpolation along road curves
function interpolateRoad(coords, totalPoints = 8000) {
    let result = [];
    const segments = coords.length - 1;
    const ptsPerSegment = Math.floor(totalPoints / segments);

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

const denseRoadPath = interpolateRoad(immdRoadCoordinates, 8000);

let map = null;
let riderMarker = null;
let currentLayer = null;
let tileLayers = {};
let totalDistanceMiles = 0;
let lastFrameTime = performance.now();

// Official full-distance course total
const OFFICIAL_COURSE_MILES = 112.0;

function initCourse() {
    if (typeof logMsg === "function") logMsg("Loading Road-Aligned IMMD GPS Engine...");

    const startPos = denseRoadPath[0];

    map = L.map('map', {
        center: startPos,
        zoom: 18,
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

    // Green route polyline along asphalt
    L.polyline(denseRoadPath, {
        color: '#00ff88',
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1
    }).addTo(map);

    // Rider Icon
    const riderIcon = L.divIcon({
        className: 'custom-rider-icon',
        html: '<div style="background-color: #00ff88; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px #00ff88;"></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
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
        // Accumulate physical miles from indoor trainer
        const incrementMiles = (currentSpeedMPH / 3600) * dtSeconds;
        totalDistanceMiles += incrementMiles;

        // Update HUD
        const distEl = document.getElementById("distance");
        const progEl = document.getElementById("courseProgress");
        if (distEl) distEl.innerText = totalDistanceMiles.toFixed(2);
        if (progEl) progEl.innerText = totalDistanceMiles.toFixed(2);

        // Progress strictly mapped to 112.0 miles
        const totalNodes = denseRoadPath.length;
        const progressPercent = Math.min(totalDistanceMiles / OFFICIAL_COURSE_MILES, 1.0);
        const currentPathProgress = progressPercent * (totalNodes - 1);

        const idx = Math.floor(currentPathProgress);
        const fraction = currentPathProgress - idx;
        const p1 = denseRoadPath[idx];
        const p2 = denseRoadPath[Math.min(idx + 1, totalNodes - 1)];

        // Calculate smooth position on road line
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
