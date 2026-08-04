// immd.js - Smooth 3D & High-Density Route Tracking Engine for IRONMAN Maryland

// High-Density IMMD Route Array (Start -> Blackwater Loop -> Finish)
const rawKeyPoints = [
    [38.56310, -76.07880], // Start: Great Marsh Park / Cambridge
    [38.55820, -76.08210], // Hambrooks Blvd
    [38.54100, -76.08900], // Race St
    [38.52110, -76.09150], // MD-343 South
    [38.48120, -76.10120], // MD-16 South
    [38.45220, -76.10510], // Key Wallace Dr Entry
    [38.44100, -76.07120], // Blackwater Visitor Center
    [38.43200, -76.03150], // Key Wallace East
    [38.38110, -76.05110], // Golden Hill Rd South
    [38.35120, -76.12150], // Decoursey Bridge Rd
    [38.40110, -76.15220], // Church Creek Turn
    [38.50220, -76.11120], // MD-16 North
    [38.56310, -76.07880]  // Finish: Great Marsh Park
];

// Generate dense intermediate points so the rider glides smoothly
function generateSmoothRoute(points, stepsPerSegment = 50) {
    let densePath = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        for (let step = 0; step < stepsPerSegment; step++) {
            const t = step / stepsPerSegment;
            const lat = p1[0] + (p2[0] - p1[0]) * t;
            const lng = p1[1] + (p2[1] - p1[1]) * t;
            densePath.push([lat, lng]);
        }
    }
    densePath.push(points[points.length - 1]);
    return densePath;
}

const immdWaypoints = generateSmoothRoute(rawKeyPoints, 100);

let map = null;
let riderMarker = null;
let currentLayer = null;
let tileLayers = {};
let currentPathProgress = 0; // Float index for smooth interpolation
let totalDistanceMiles = 0;
let lastFrameTime = performance.now();

function initCourse() {
    if (typeof logMsg === "function") logMsg("Initializing Smooth 3D Satellite Course Tracking...");

    const startPos = immdWaypoints[0];

    // Initialize Map with smooth animation enabled
    map = L.map('map', {
        center: startPos,
        zoom: 17, // Closer Zwift-style chase camera view
        zoomControl: false,
        fadeAnimation: true,
        markerZoomAnimation: true
    });

    // High-Resolution Esri World Imagery (Satellite)
    tileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
    });

    tileLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    });

    currentLayer = tileLayers.satellite;
    currentLayer.addTo(map);

    // Draw the IMMD Course Route Polyline
    L.polyline(immdWaypoints, {
        color: '#00ff88',
        weight: 6,
        opacity: 0.9,
        smoothFactor: 1
    }).addTo(map);

    // Glowing Rider Avatar
    const riderIcon = L.divIcon({
        className: 'custom-rider-icon',
        html: '<div style="background-color: #00ff88; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 15px #00ff88;"></div>',
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
        // Calculate incremental distance: Distance = Speed * Time
        const incrementMiles = (currentSpeedMPH / 3600) * dtSeconds;
        totalDistanceMiles += incrementMiles;

        // Update UI HUD
        const distEl = document.getElementById("distance");
        const progEl = document.getElementById("courseProgress");
        if (distEl) distEl.innerText = totalDistanceMiles.toFixed(2);
        if (progEl) progEl.innerText = totalDistanceMiles.toFixed(2);

        // Advance smooth index (Scale based on total route length ~112 miles)
        const totalPoints = immdWaypoints.length;
        const speedFactor = (currentSpeedMPH / 112.0) * 0.8; 
        currentPathProgress += speedFactor * dtSeconds * 10;

        if (currentPathProgress >= totalPoints - 1) {
            currentPathProgress = totalPoints - 1; // Course complete!
        }

        // Interpolate position between path coordinates
        const idx = Math.floor(currentPathProgress);
        const fraction = currentPathProgress - idx;
        const p1 = immdWaypoints[idx];
        const p2 = immdWaypoints[Math.min(idx + 1, totalPoints - 1)];

        const interpolatedLat = p1[0] + (p2[0] - p1[0]) * fraction;
        const interpolatedLng = p1[1] + (p2[1] - p1[1]) * fraction;
        const currentPos = [interpolatedLat, interpolatedLng];

        // Smoothly glide marker and camera without jumping
        if (riderMarker) {
            riderMarker.setLatLng(currentPos);
        }
        if (map) {
            map.panTo(currentPos, { animate: false }); // Smooth continuous panning
        }
    }

    requestAnimationFrame(updateSimLoop);
}

window.addEventListener("load", () => {
    initCourse();
});
