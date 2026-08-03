// IronSim Core Engine

const ride = {
    power: 0,
    cadence: 0,
    speed: 0,
    distance: 0,
    seconds: 0,
    running: false,
    course: "Ironman Maryland",
    totalMiles: 112
};


function startRide() {
    ride.running = true;
}


function simulateRide() {

    if (!ride.running) {
        return;
    }

    // Simulated bike data
    ride.power = Math.floor(180 + Math.random() * 80);
    ride.cadence = Math.floor(75 + Math.random() * 20);
    ride.speed = (18 + Math.random() * 5).toFixed(1);

    // Distance based on speed
    ride.distance += Number(ride.speed) / 3600;

    ride.seconds++;

    updateDisplay();
}


function updateDisplay() {

    document.getElementById("power").innerHTML =
        ride.power;

    document.getElementById("cadence").innerHTML =
        ride.cadence;

    document.getElementById("speed").innerHTML =
        ride.speed;

    document.getElementById("distance").innerHTML =
        ride.distance.toFixed(2);


    // Mile marker
    document.getElementById("mile").innerHTML =
        ride.distance.toFixed(1);


    // Progress bar
    let percent =
        (ride.distance / ride.totalMiles) * 100;

    document.getElementById("progress").style.width =
        percent + "%";


    // Finish prediction
    let hours =
        ride.totalMiles / ride.speed;

    let finishMinutes =
        Math.floor(hours * 60);

    document.getElementById("finish").innerHTML =
    finishMinutes + " min";


    // Timer
    let minutes =
        Math.floor(ride.seconds / 60);

    let seconds =
        ride.seconds % 60;

    document.getElementById("time").innerHTML =
        minutes + ":" + seconds.toString().padStart(2,"0");
}


setInterval(simulateRide,1000);
