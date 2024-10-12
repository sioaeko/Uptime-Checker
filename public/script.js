document.addEventListener('DOMContentLoaded', function () {
    const urlForm = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const monitorList = document.getElementById('monitorList');
    let monitors = [];
    let responseTimeChart;

    // WebSocket 설정
    const socket = new WebSocket(`ws://${window.location.hostname}:${window.location.port}`);

    socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('Received data from WebSocket:', data);
        updateMonitorStatus(data.url, data.status, data.responseTime);
    });

    socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
    });

    urlForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const url = urlInput.value.trim();
        if (url) {
            await addMonitor(url);
            urlInput.value = '';
        }
    });

    async function addMonitor(url) {
        try {
            const response = await fetch('/api/add-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Data:', data);
                monitors.push({ url, ...data });
                updateDisplay();
            }
        } catch (error) {
            console.error('Error adding monitor:', error);
        }
    }

    function updateMonitorStatus(url, status, responseTime) {
        const monitor = monitors.find(m => m.url === url);
        if (monitor) {
            monitor.status = status;
            monitor.responseTime = responseTime;
            updateDisplay();
        }
    }

    function updateDisplay() {
        monitorList.innerHTML = '';
        monitors.forEach(monitor => {
            const div = document.createElement('div');
            div.textContent = `${monitor.url} - ${monitor.status} (${monitor.responseTime} ms)`;
            monitorList.appendChild(div);
        });
        updateChart();
    }

    function updateChart() {
        const ctx = document.getElementById('responseTimeChart').getContext('2d');
        if (responseTimeChart) {
            responseTimeChart.data.labels = monitors.map(m => m.url);
            responseTimeChart.data.datasets[0].data = monitors.map(m => m.responseTime);
            responseTimeChart.update();
        } else {
            responseTimeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: monitors.map(m => m.url),
                    datasets: [{
                        label: 'Response Time (ms)',
                        data: monitors.map(m => m.responseTime),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Response Time (ms)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'URL'
                            }
                        }
                    }
                }
            });
        }
    }
});
