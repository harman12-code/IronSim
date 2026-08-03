// course.js - IronSim Course Manager

let courseData = null;

// Fetch course configuration from maryland.json
async function loadCourseData() {
    try {
        const response = await fetch('maryland.json');
        courseData = await response.json();
        console.log("Course loaded:", courseData.name);
    } catch (err) {
        console.warn("Could not load maryland.json directly, falling back to default route logic.");
    }
}

function updateCourseSection() {
    const d = ride.distance;
    let section = "Starting Line";
    let terrain = "Flat";
    let wind = "Variable";

    if (courseData && courseData.segments) {
        const currentSegment = courseData.segments.find(seg => d >= seg.start && d < seg.end);
        if (currentSegment) {
            section = currentSegment.name;
            terrain = currentSegment.elevation;
            wind = currentSegment.wind;
        } else if (d >= courseData.distanceMiles) {
            section = "Finish Line! 🏁";
            terrain = "Flat";
            wind = "Calm";
        }
    } else {
        // Hardcoded Fallback
        if (d >= 20 && d < 60) {
            section = "Blackwater Roads";
            terrain = "Rolling";
            wind = "Coastal";
        } else if (d >= 60 && d < 90) {
            section = "Eastern Shore";
            terrain = "Flat";
            wind = "Open Exposure";
        } else if (d >= 90 && d < 112) {
            section = "Return to Cambridge";
            terrain = "Flat";
            wind = "Variable";
        } else if (d >= 112) {
            section = "Finish Line! 🏁";
        }
    }

    const sectionEl = document.getElementById("section");
    const terrainEl = document.getElementById("terrain");
    const windEl = document.getElementById("wind");

    if (sectionEl) sectionEl.innerText = section;
    if (terrainEl) terrainEl.innerText = terrain;
    if (windEl) windEl.innerText = wind;
}

// Initialize load on startup
loadCourseData();
