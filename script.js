// Select DOM elements
const currentLoudnessDisplay = document.getElementById('current-loudness');
const averageLoudnessDisplay = document.getElementById('average-loudness');
const intervalSelect = document.getElementById('interval');
const canvas = document.getElementById('loudness-graph');

// Set up CanvasJS for the graph
const ctx = canvas.getContext('2d');
let chart;

let audioContext;
let analyser;
let dataArray;
let bufferLength;

let loudnessHistory = [];
let interval = 10;

// Function to get microphone input
async function getMicrophoneInput() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        updateLoudness();
    } catch (err) {
        console.error('Error accessing microphone: ', err);
    }
}

// Function to calculate and update loudness
function updateLoudness() {
    analyser.getByteFrequencyData(dataArray);
    let values = 0;
    for (let i = 0; i < bufferLength; i++) {
        values += dataArray[i];
    }
    const average = values / bufferLength;
    const loudness = 20 * Math.log10(average);

    currentLoudnessDisplay.textContent = loudness.toFixed(2);

    loudnessHistory.push(loudness);
    if (loudnessHistory.length > interval * 10) {
        loudnessHistory.shift();
    }

    const avgLoudness = loudnessHistory.reduce((a, b) => a + b, 0) / loudnessHistory.length;
    averageLoudnessDisplay.textContent = avgLoudness.toFixed(2);

    updateGraph();
    requestAnimationFrame(updateLoudness);
}

// Function to update the graph
function updateGraph() {
    const data = {
        labels: loudnessHistory.map((_, i) => i),
        datasets: [
            {
                label: 'Current Loudness',
                data: loudnessHistory,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            },
            {
                label: 'Average Loudness',
                data: new Array(loudnessHistory.length).fill(averageLoudnessDisplay.textContent),
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                fill: false
            }
        ]
    };

    if (chart) {
        chart.data = data;
        chart.update();
    } else {
        chart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                scales: {
                    x: {
                        display: true
                    },
                    y: {
                        display: true
                    }
                }
            }
        });
    }
}

// Handle interval change
intervalSelect.addEventListener('change', (event) => {
    interval = parseInt(event.target.value, 10);
    loudnessHistory = [];
});

// Initialize the microphone input and graph
getMicrophoneInput();
