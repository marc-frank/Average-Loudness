let audioContext;
let analyser;
let dataArray;
let loudnessChart;
let currentLoudness = 0;
let loudnessHistory = [];
let averageInterval = 10; // Default to 10 seconds

const currentLoudnessElement = document.getElementById('current-loudness');
const averageLoudnessElement = document.getElementById('average-loudness');
const averageIntervalSelect = document.getElementById('averageInterval');

async function initAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Float32Array(bufferLength);
    } catch (err) {
        console.error('Error accessing microphone:', err);
    }
}

function getLoudnessInDecibels() {
    analyser.getFloatFrequencyData(dataArray);
    const sum = dataArray.reduce((acc, val) => acc + Math.pow(10, val / 10), 0);
    const rms = Math.sqrt(sum / dataArray.length);
    return 20 * Math.log10(rms) + 100; // Adding 100 to shift the range to positive values
}

function updateLoudness() {
    currentLoudness = getLoudnessInDecibels();
    const now = Date.now();
    
    // Add new data point
    loudnessHistory.push({ time: now, value: currentLoudness });

    // Remove old data points
    const cutoffTime = now - averageInterval * 1000;
    loudnessHistory = loudnessHistory.filter(point => point.time >= cutoffTime);

    // Calculate running average
    let runningSum = 0;
    for (let i = 0; i < loudnessHistory.length; i++) {
        runningSum += loudnessHistory[i].value;
        loudnessHistory[i].average = runningSum / (i + 1);
    }

    const currentAverage = loudnessHistory[loudnessHistory.length - 1].average;

    currentLoudnessElement.textContent = currentLoudness.toFixed(1);
    averageLoudnessElement.textContent = currentAverage.toFixed(1);

    updateChart();

    requestAnimationFrame(updateLoudness);
}

function updateChart() {
    const now = Date.now();
    const labels = loudnessHistory.map(point => (point.time - now) / 1000);
    
    loudnessChart.data.labels = labels;
    loudnessChart.data.datasets[0].data = loudnessHistory.map(point => point.value);
    loudnessChart.data.datasets[1].data = loudnessHistory.map(point => point.average);

    loudnessChart.options.scales.x.min = -averageInterval;
    loudnessChart.options.scales.x.max = 0;

    loudnessChart.update();
}

function initChart() {
    const ctx = document.getElementById('loudnessChart').getContext('2d');
    loudnessChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Current',
                data: [],
                borderColor: 'blue',
                backgroundColor: Utils.transparentize(Utils.CHART_COLORS.blue, 0.5),
                fill: false,
                tension: 0.25,
                radius: 0
            }, {
                label: 'Average',
                data: [],
                borderColor: 'green',
                backgroundColor: Utils.transparentize(Utils.CHART_COLORS.green, 0.5),
                fill: false,
                tension: 0.25,
                radius: 0
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Seconds ago'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Loudness (dB)'
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function handleIntervalChange() {
    averageInterval = parseInt(averageIntervalSelect.value);
    loudnessHistory = []; // Reset history when interval changes
}

async function init() {
    await initAudio();
    initChart();
    updateLoudness();
    averageIntervalSelect.addEventListener('change', handleIntervalChange);
}

init();

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
