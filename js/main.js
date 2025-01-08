let map;
let statesStack = [];

let retryCount = 0;
const maxRetries = 2;
const retryStrings = ["What are locations related to ", "Can you show locations for ", "I need locations about "];

let infowindow;


let questionBox = document.getElementById("questionBox"); // Initialized outside functions

const darkTheme = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

 

const lightTheme = [
    { elementType: "geometry", stylers: [{ color: "#e6f7ff" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#005f73" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#0a9396" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#94d2bd" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#e9ffdb" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#eaf4f4" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#94d2bd" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#ee9b00" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#ffb703" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#ade8f4" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#005f73" }],
    },
];

let googleMapsApiKey;

// Fetch the Google Maps API key from the server
fetch('/getGoogleMapsApiKey')
    .then(response => response.json())
    .then(data => {
        console.log("Received Google Maps API key:", data.key);
        googleMapsApiKey = data.key;
        loadGoogleMapsScript();
    })
    .catch(err => console.error("Error fetching Google Maps API key:", err));

function loadGoogleMapsScript() {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?v=3.exp&key=${googleMapsApiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
}

function initMap() {
    console.log("Initializing Map...");
    const washingtonDC = { lat: 38.9072, lng: -77.0369 };
    map = new google.maps.Map(document.getElementById("map"), {
        center: washingtonDC,
        zoom: 6,
        mapTypeId: "terrain",
        styles: lightTheme,
    });

    infowindow = new google.maps.InfoWindow();

    document.getElementById("questionInput").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            askQuestion();
            event.preventDefault();
        }
    });
}

// Remaining functions remain the same...


function goBack() {
    if (statesStack.length === 0) return;

    const previousState = statesStack.pop();

    // Reset map state
    map.setCenter(previousState.center);
    map.setZoom(previousState.zoom);
    
    // Reset the displayed question, input value, and answer
    document.getElementById("displayedQuestion").innerText = previousState.displayedQuestion;
    document.getElementById("questionInput").value = previousState.inputValue;
    document.getElementById("answer").innerText = previousState.answerText;
    document.querySelector(".collapsible-content").innerHTML = previousState.locationsHTML;

    if (statesStack.length === 0) {
        document.getElementById("backButton").style.display = "none"; // Hide back button if no more states left
    }
}



function smoothZoom(targetZoom) {
    if (map.getZoom() < targetZoom) {
        const zoomListener = google.maps.event.addListener(
            map,
            "zoom_changed",
            function () {
                if (map.getZoom() < targetZoom) {
                    setTimeout(() => {
                        map.setZoom(map.getZoom() + 1);
                    }, 100);
                } else {
                    google.maps.event.removeListener(zoomListener);
                }
            }
        );

        setTimeout(() => {
            map.setZoom(map.getZoom() + 1);
        }, 100);
    }
}

function toggleCollapse() {
    const content = document.querySelector(".collapsible-content");
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

function drawTimeline(startYear, endYear, highlights = []) {
    const canvas = document.getElementById('timeline');
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    // Timeline parameters
    const padding = 50; // Padding on either side
    const years = endYear - startYear + 1;
    const step = (width - padding * 2) / years;

    // Draw the base timeline
    ctx.strokeStyle = '#005f73';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.stroke();

    // Draw year markers and labels
    for (let i = 0; i <= years; i++) {
        const x = padding + i * step;
        ctx.beginPath();
        ctx.moveTo(x, height / 2 - 10);
        ctx.lineTo(x, height / 2 + 10);
        ctx.stroke();

        // Draw year labels
        ctx.fillStyle = '#005f73';
        ctx.textAlign = 'center';
        ctx.font = '12px Arial';
        ctx.fillText(startYear + i, x, height / 2 + 25);
    }

    // Highlight events
    highlights.forEach(event => {
        const { year, label } = event;
        const x = padding + (year - startYear) * step;

        // Draw marker
        ctx.fillStyle = '#ee9b00';
        ctx.beginPath();
        ctx.arc(x, height / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw label
        ctx.fillStyle = '#005f73';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, height / 2 - 15);
    });
}




async function askQuestion() {
    console.log("Question:", document.getElementById("questionInput").value); // Debug log
    retryCount = 0;
    const washingtonDC = { lat: 38.9072, lng: -77.0369 };
    map.setCenter(washingtonDC);
    map.setZoom(6);
    let question = document.getElementById("questionInput").value;
    const answerBox = document.getElementById("answer");

    statesStack.push({
        center: map.getCenter(),
        zoom: map.getZoom(),
        displayedQuestion: document.getElementById("displayedQuestion").innerText,
        inputValue: document.getElementById("questionInput").value,
        answerText: document.getElementById("answer").innerText,
        locationsHTML: document.querySelector(".collapsible-content").innerHTML
    });

    while (retryCount < maxRetries) {
        let response;
        try {
            response = await fetchQuestion(question);
            const jsonDataStart = response.answer.indexOf("data:") + 5;
            const possibleJson = response.answer.substring(jsonDataStart).trim();

            if (jsonDataStart > 4 && (possibleJson.startsWith('{') || possibleJson.startsWith('['))) {
                const lastChar = possibleJson[possibleJson.length - 1];
                if (lastChar === '}' || lastChar === ']') {
                    processResponse(response, jsonDataStart);
                    console.log("Retried:", retryCount, "times");
                    break;
                }
            }

            retryCount++;
            question = retryStrings[retryCount] + document.getElementById("questionInput").value;
            console.log("Retrying... Attempt:", retryCount);

        } catch (error) {
            answerBox.innerText = "An error occurred: " + error.toString();
            return;
        }
    }

    if (retryCount === maxRetries) {
        answerBox.innerText = "Sorry, no location data found after " + retryCount + " attempts.";
        console.log("Retried:", retryCount, "times without success");
    }

    if (statesStack.length > 0) {
        document.getElementById("backButton").style.display = "block";
    }
}




async function fetchQuestion(question) {
    const response = await fetch("/ask", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: question }),
    });
    console.log(response.json);
    return await response.json();
}

function processResponse(data, jsonDataStart) {
    const jsonData = data.answer.slice(jsonDataStart).trim();
    const beforeJsonData = data.answer.slice(0, jsonDataStart - 5).trim();
    let coordinates;

    try {
        coordinates = JSON.parse(jsonData);
    } catch (error) {
        document.getElementById("answer").innerText = data.answer;
        return;
    }

    let locations = [];
    if (Array.isArray(coordinates)) {
        locations = coordinates.map((location) => ({
            name: location.name,
            lat: Number(location.latitude),
            lng: Number(location.longitude),
        }));
    }

    const bounds = new google.maps.LatLngBounds();
    const infowindow = new google.maps.InfoWindow(); // Initiate an InfoWindow

    if (locations.length > 0) {
        const locationsContainer = document.querySelector(".collapsible-content");
        locationsContainer.innerHTML = ""; // Clear previous locations

        locations.forEach((location, index) => {
            const locationDiv = document.createElement("div");
            locationDiv.classList.add("location-item");
            locationDiv.textContent = `${location.name}: Lat ${location.lat}, Lng ${location.lng}`;

            locationDiv.addEventListener("click", function () {
                map.panTo({
                    lat: location.lat,
                    lng: location.lng,
                });
                smoothZoom(12);
            });

            locationsContainer.appendChild(locationDiv);

            // Create a marker for each location
            const marker = new google.maps.Marker({
                position: location,
                map: map,
                title: location.name,
            });

            // Add click event to marker for pan
            marker.addListener('click', function () {
                map.panTo(marker.getPosition());
                smoothZoom(12);
            });

            // Attach a click event to the marker to show the InfoWindow
            google.maps.event.addListener(marker, 'click', function() {
                infowindow.setContent(location.name);
                infowindow.open(map, marker);
            });

            bounds.extend(marker.position);
        });

        if (locations.length === 1) {
            map.setZoom(12); // If there's only one location, set a predefined zoom level
            map.setCenter(locations[0]); // Center the map on the single location
        } else {
            map.fitBounds(bounds); // For multiple locations, fit the map to the bounds of those locations
        }

        document.querySelector(".collapsible-btn").style.display = "block"; // Show the collapsible section
        
        const colors = ["#00FF00", "#66FF33", "#CCFF66", "#FFFF99", "#FFFF00"];
        locations.forEach((latLng, index) => {
            if (index < locations.length - 1) {
                const path = new google.maps.Polyline({
                    path: [latLng, locations[index + 1]],
                    geodesic: true,
                    strokeColor: colors[Math.min(index, colors.length - 1)],
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                });
                path.setMap(map);
            }
        });
        document.getElementById("answer").innerText = beforeJsonData;
    } else {
        document.getElementById("answer").innerText = data.answer;
    }
}

