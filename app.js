// app.js - IronSim Core Engine & Physics

const ride = {
    power: 0,
    cadence: 0,
    speed: 0,
    distance: 0,
    seconds: 0,
    grade: 0.0,
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

function calculatePhysicsSpeed(power, grade) {
    // Base flat speed estimate from watts
    let baseSpeed = Math.sqrt(power) * 1.35; 
    
    // Grade resistance penalty/boost (-1.2 mph per +1% grade)
    let gradeModifier = grade * 1.2;
    let calculatedSpeed = baseSpeed - gradeModifier;

    // Keep realistic limits (min 4 mph, max 45 mph)
    return Math.max(4.0, Math.min(45.0, calculatedSpeed)).toFixed(1);
}

function simulateRide() {
    if (!ride.running) return;

    // Get live grade from course engine
    if (typeof getCurrentGrade === "function") {
        ride.grade = getCurrentGrade(ride.distance);
    }

    // Simulated power generation
    if (ride.mode === "Training Mode") {
        ride.power = 200;
    } else if (ride.mode === "FTP Test") {
        ride.power = Math.floor(240 + Math.random() * 40);
    } else if (ride.mode === "Ghost Rider") {
        ride.power = Math.floor(210 + Math.random() * 30);
    } else {
        ride.power = Math.floor(180 + Math.random() * 60);
    }

    ride.cadence = Math.floor(78 + Math.random() * 16);
    ride.speed = calculatePhysicsSpeed(ride.power, ride.grade);

    // Distance multiplier for testing
    if (ride.mode === "Test Mode") {
        ride.distance += (Number(ride.speed) / 3600) * 150;
    } else {
        ride.distance += Number(ride.speed) / 3600;
    }

    ride.seconds++;

    // Modular updates
    updateDisplay();
    if (typeof updateCourseSection === "function") updateCourseSection();
    if (typeof updateGhostRider === "function") updateGhostRider();
    if (typeof drawElevationProfile === "function") drawElevationProfile();
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

    const percent = Math.min((ride.distance / ride.totalMiles) * 100, 100);
    if (raceDisplay) raceDisplay.innerText = percent.toFixed(1) + "%";
    if (progressBar) {
        progressBar.style.width = percent + "%";
        progressBar.style.backgroundColor = "#3B82F6";
    }

    if (Number(ride.speed) > 0) {
        const hours = (ride.totalMiles - ride.distance) / Number(ride.speed);
        const finishMinutes = Math.floor(hours * 60);
        if (finishEl) finishEl.innerText = finishMinutes + " min remaining";
    }

    const minutes = Math.floor(ride.seconds / 60);
    const seconds = ride.seconds % 60;
    if (timeEl) {
        timeEl.innerText = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}

setInterval(simulateRide, 1000);
