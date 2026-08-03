// app.js - IronSim Core Engine & Bluetooth Data Integration

const ride = {
    power: 0,
    cadence: 0,
    speed: 0,
    distance: 0,
    seconds: 0,
    grade: 0.0,
    running: false,
    isBluetoothConnected: false,
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
    if (power <= 0) return "0.0";
    let baseSpeed = Math.sqrt(power) * 1.35; 
    let gradeModifier = grade * 1.2;
    let calculatedSpeed = baseSpeed - gradeModifier;
    return Math.max(0.0, Math.min(45.0, calculatedSpeed)).toFixed(1);
}

function simulateRide() {
    if (!ride.running) return;

    // Fetch grade from course engine
    if (typeof getCurrentGrade === "function") {
        ride.grade = getCurrentGrade(ride.distance);
    }

    // Only generate simulated power if not using live Bluetooth stream or in Test Mode
    if (!ride.isBluetoothConnected) {
        if (ride.mode === "Training Mode") {
            ride.power = 200;
        } else if (ride.mode === "FTP Test") {
            ride.power = Math.floor(240 + Math.random() * 40);
        } else if (ride.mode === "Ghost Rider") {
            ride.power = Math.floor(210 + Math.random() * 30);
        } else if (ride.mode === "Test Mode") {
            ride.power = Math.floor(180 + Math.random() * 60);
        }
        
        if (ride.power > 0 && ride.cadence === 0) {
            ride.cadence = Math.floor(78 + Math.random() * 16);
        }
    }

    // Always calculate real-world physical speed from live Watts + Grade
    if (ride.power > 0) {
        ride.speed = calculatePhysicsSpeed(ride.power, ride.grade);
    } else {
        ride.speed = "0.0";
    }

    // Distance accumulator
    if (ride.mode === "Test Mode") {
        ride.distance += (Number(ride.speed) / 3600) * 150;
    } else {
        ride.distance += Number(ride.speed) / 3600;
    }

    ride.seconds++;

    // UI Updates
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
    } else if (finishEl) {
        finishEl.innerText = "Pedal to calculate";
    }

    const minutes = Math.floor(ride.seconds / 60);
    const seconds = ride.seconds % 60;
    if (timeEl) {
        timeEl.innerText = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}

setInterval(simulateRide, 1000);
