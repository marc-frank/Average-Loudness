let audioContext;
let analyser;
let dataArray;
let loudnessChart;
let currentLoudness = 0;
let averageLoudness = 0;
let totalLoudness = 0;
let sampleCount = 0;

const currentLoudnessElement = document.getElementById('current-loudness');
const averageLoudnessElement = document.getElementById('average-loudness');

async function initAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    } catch (err) {
        console.error('Error accessing microphone:', err);
    }
}

function getLoudness() {
    analyser.getByteFrequencyData(dataArray);
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    return sum / dataArray.length;
}

function updateLoudness() {
    currentLoudness = getLoudness();
    totalLoudness += currentLoudness;
    sampleCount++;
    averageLoudness = totalLoudness / sampleCount;

    currentLoudnessElement.textContent = currentLoudness.toFixed(1);
    averageLoudnessElement.textContent = averageLoudness.toFixed(1);

    loudnessChart.data.datasets[0].data.push(currentLoudness);
    loudnessChart.data.datasets[1].data.push(averageLoudness);
    if (loudnessChart.data.datasets[0].data.length > 50) {
        loudnessChart.data.datasets[0].data.shift();
        loudnessChart.data.datasets[1].data.shift();
    }
    loudnessChart.update();

    requestAnimationFrame(updateLoudness);
}

function initChart() {
    const ctx = document.getElementById('loudnessChart').getContext('2d');
    loudnessChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(50).fill(''),
            datasets: [{
                label: 'Current',
                data: [],
                borderColor: 'blue',
                fill: false
            }, {
                label: 'Average',
                data: [],
                borderColor: 'green',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 255
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

async function init() {
    await initAudio();
    initChart();
    updateLoudness();
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
