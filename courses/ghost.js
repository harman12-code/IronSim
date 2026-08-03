// ghost.js - IronSim Ghost Rider Engine

const ghost = {
    distance: 0,
    targetPaceMph: 20.5, // Default target pace (mph)
    timeAheadSeconds: 0
};

function updateGhostRider() {
    if (ride.mode !== "Ghost Rider" || !ride.running) return;

    // Ghost moves at a constant pace (convert mph to miles per second)
    ghost.distance += (ghost.targetPaceMph / 3600);

    // Calculate distance gap
    const distanceDiff = ride.distance - ghost.distance;
    ghost.timeAheadSeconds = (distanceDiff / (ride.speed / 3600)) || 0;

    const ghostEl = document.getElementById("ghostStatus");
    if (ghostEl) {
        if (distanceDiff >= 0) {
            ghostEl.innerText = `Ahead of Ghost by ${distanceDiff.toFixed(2)} mi`;
            ghostEl.style.color = "#10B981"; // Green
        } else {
            ghostEl.innerText = `Behind Ghost by ${Math.abs(distanceDiff).toFixed(2)} mi`;
            ghostEl.style.color = "#EF4444"; // Red
        }
    }
}
