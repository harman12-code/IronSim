// IronSim Core Engine

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

    let selectedMode =
        document.getElementById("mode").value;

    ride.mode = selectedMode;

    console.log("Mode:", ride.mode);

}


function simulateRide() {

    if (!ride.running) {
        return;
    }

    // Simulated bike data
    if (ride.mode === "Training Mode") {

    ride.power = 200;

}

else if (ride.mode === "FTP Test") {

    ride.power = Math.floor(250 + Math.random() * 50);

}

else if (ride.mode === "Ghost Rider") {

    ride.power = Math.floor(220 + Math.random() * 40);

}

else {

    ride.power = Math.floor(180 + Math.random() * 80);

};
    ride.cadence = Math.floor(75 + Math.random() * 20);
    ride.speed = (18 + Math.random() * 5).toFixed(1);

    // Distance based on speed
    if (ride.mode === "Test Mode") {

    ride.distance += Number(ride.speed) / 3600 * 200;

} else {

    ride.distance += Number(ride.speed) / 3600;

}

    ride.seconds++;

    updateDisplay();
updateCourseSection();
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
    Math.min((ride.distance / ride.totalMiles) * 100, 100);

let raceDisplay = document.getElementById("racePercent");

if (raceDisplay) {
    raceDisplay.innerHTML =
        percent.toFixed(1) + "%";
}


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

}
function updateCourseSection() {

    let section = "Starting Line";
    let terrain = "Flat";
    let wind = "Variable";

    if (ride.distance >= 20 && ride.distance < 60) {

        section = "Blackwater Roads";
        terrain = "Rolling";
        wind = "Coastal";

    }

    else if (ride.distance >= 60 && ride.distance < 90) {

        section = "Eastern Shore";
        terrain = "Flat";
        wind = "Open Exposure";

    }

    else if (ride.distance >= 90) {

        section = "Return to Cambridge";
        terrain = "Flat";
        wind = "Variable";

    }


    document.getElementById("section").innerHTML = section;
    document.getElementById("terrain").innerHTML = terrain;
    document.getElementById("wind").innerHTML = wind;

}
