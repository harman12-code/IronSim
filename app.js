// app.js - IronSim Core Engine

const ride = {
    power: 0,
    cadence: 0,
    speed: 0,
    distance: 0,
    seconds: 0,
    running: false,
    course: "Ironman Maryland",
    totalMiles: 112,
    mode: "Race Mode"
};

function startRide() {
    ride.running = true;

    const modeEl = document.getElementById("mode");
    if (modeEl) {
        ride.mode = modeEl.value;
    }

    console.log("Ride started in mode:", ride.mode);
}

function simulateRide() {
    if (!ride.running) return;

    // Simulated power generation based on mode
    if (ride.mode === "Training Mode") {
        ride.power = 200;
    } else if (ride.mode === "FTP Test") {
        ride.power = Math.floor(250 + Math.random() * 50);
    } else if (ride.mode === "Ghost Rider") {
        ride.power = Math.floor(220 + Math.random() * 40);
    } else {
        ride.power = Math.floor(180 + Math.random() * 80);
    }

    ride.cadence = Math.floor(75 + Math.random() * 20);
    ride.speed = (18 + Math.random() * 5).toFixed(1);

    // Distance multiplier for fast testing
    if (ride.mode === "Test Mode") {
        ride.distance += (Number(ride.speed) / 3600) * 200;
    } else {
        ride.distance += Number(ride.speed) / 3600;
    }

    ride.seconds++;

    // Modular updates
    updateDisplay();
    if (typeof updateCourseSection === "function") updateCourseSection();
    if (typeof updateGhostRider === "function") updateGhostRider();
}

function updateDisplay() {
    const powerEl = document.getElementById("power");
    const cadenceEl = document.getElementById("cadence");
    const speedEl = document.getElementById("speed");
    const distanceEl = document.getElementById("distance");
    const mileEl = document.getElementById("mile");
    const finishEl = document.getElementById("finish");
    const timeEl = document.getElementById("time");
    const raceDisplay = document.getElementById("racePercent");
    const progressBar = document.getElementById("progress");

    if (powerEl) powerEl.innerText = ride.power;
    if (cadenceEl) cadenceEl.innerText = ride.cadence;
    if (speedEl) speedEl.innerText = ride.speed;
    if (distanceEl) distanceEl.innerText = ride.distance.toFixed(2);
    if (mileEl) mileEl.innerText = ride.distance.toFixed(1);

    // Progress percentage & Bar width
    const percent = Math.min((ride.distance / ride.totalMiles) * 100, 100);
    if (raceDisplay) raceDisplay.innerText = percent.toFixed(1) + "%";
    if (progressBar) {
        progressBar.style.width = percent + "%";
        progressBar.style.backgroundColor = "#3B82F6"; // Blue fill
    }

    // Finish time prediction (Minutes)
    if (Number(ride.speed) > 0) {
        const hours = ride.totalMiles / Number(ride.speed);
        const finishMinutes = Math.floor(hours * 60);
        if (finishEl) finishEl.innerText = finishMinutes + " min";
    }

    // Main Timer
    const minutes = Math.floor(ride.seconds / 60);
    const seconds = ride.seconds % 60;
    if (timeEl) {
        timeEl.innerText = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}

// Game Loop
setInterval(simulateRide, 1000);
