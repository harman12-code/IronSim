// immd.js - IRONMAN Maryland Video & Distance Sync Engine

let totalDistanceMiles = 0;
let lastFrameTime = performance.now();

function updateSimLoop() {
    const now = performance.now();
    const dtSeconds = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    const currentSpeedMPH = parseFloat(ride.speed) || 0;
    const videoEl = document.getElementById("simVideo");

    if (currentSpeedMPH > 0) {
        // Calculate incremental distance: Distance = Speed * Time
        const incrementMiles = (currentSpeedMPH / 3600) * dtSeconds;
        totalDistanceMiles += incrementMiles;

        // Update UI
        const distEl = document.getElementById("distance");
        const progEl = document.getElementById("courseProgress");
        if (distEl) distEl.innerText = totalDistanceMiles.toFixed(2);
        if (progEl) progEl.innerText = totalDistanceMiles.toFixed(2);

        // Control Video Playback: Match playback speed to rider's real pace (Base ~18 MPH)
        if (videoEl) {
            if (videoEl.paused) videoEl.play().catch(() => {});
            videoEl.playbackRate = Math.min(Math.max(currentSpeedMPH / 18.0, 0.25), 3.0);
        }
    } else {
        if (videoEl && !videoEl.paused) {
            videoEl.pause();
        }
    }

    requestAnimationFrame(updateSimLoop);
}

// Start simulation loop when window finishes loading
window.addEventListener("load", () => {
    requestAnimationFrame(updateSimLoop);
    if (typeof logMsg === "function") {
        logMsg("IRONMAN Maryland course loaded! Start pedaling to ride.");
    }
});
