// immd.js - IRONMAN Maryland Street View & GPS Navigation Engine

// Key GPS route waypoints along the IMMD bike course (Cambridge & Blackwater Refuge)
const immdWaypoints = [
    { lat: 38.5631, lng: -76.0788 }, // Cambridge / Great Marsh Start
    { lat: 38.5211, lng: -76.0915 }, // Route 343 South
    { lat: 38.4522, lng: -76.1051 }, // Key Wallace Dr Entry
    { lat: 38.4410, lng: -76.0712 }, // Blackwater Visitor Center
    { lat: 38.4320, lng: -76.0315 }, // Key Wallace East
    { lat: 38.3811, lng: -76.0511 }, // Golden Hill Rd South
    { lat: 38.3512, lng: -76.1215 }  // Decoursey Bridge Rd
];

let panorama = null;
let map = null;
let currentPointIndex = 0;
let totalDistanceMiles = 0;
let lastFrameTime = performance.now();
let distanceAccumulator = 0;

function initCourse() {
    if (typeof logMsg === "function") logMsg("Initializing Google Street View engine...");

    const startPos = immdWaypoints[0];

    // Initialize Street View Panorama
    panorama = new google.maps.StreetViewPanorama(
        document.getElementById('streetView'),
        {
            position: startPos,
            pov: { heading: 180, pitch: 0 },
            zoom: 1,
            disableDefaultUI: true,
            showRoadLabels: false
        }
    );

    // Initialize Overhead Satellite Map View
    map = new google.maps.Map(document.getElementById('mapView'), {
        center: startPos,
        zoom: 14,
        mapTypeId: 'satellite'
    });

    requestAnimationFrame(updateSimLoop);
}

function computeHeading(p1, p2) {
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
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

        // Advance Street View image roughly every ~0.02 miles (~100 feet)
        if (distanceAccumulator >= 0.02) {
            distanceAccumulator = 0;
            currentPointIndex = (currentPointIndex + 1) % immdWaypoints.length;
            
            const nextPos = immdWaypoints[currentPointIndex];
            const prevPos = immdWaypoints[(currentPointIndex - 1 + immdWaypoints.length) % immdWaypoints.length];
            const headingAngle = computeHeading(prevPos, nextPos);

            if (panorama) {
                panorama.setPosition(nextPos);
                panorama.setPov({ heading: headingAngle, pitch: 0 });
            }
            if (map) {
                map.setCenter(nextPos);
            }
        }
    }

    requestAnimationFrame(updateSimLoop);
}

// Fallback init trigger
window.addEventListener("load", () => {
    if (window.google && window.google.maps) {
        initCourse();
    }
});
