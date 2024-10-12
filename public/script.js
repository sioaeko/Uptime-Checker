document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    const urlForm = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const checkInterval = document.getElementById('checkInterval');
    const monitorList = document.getElementById('monitorList');
    const statusFilter = document.getElementById('statusFilter');
    const sortBy = document.getElementById('sortBy');
    const detailModal = document.getElementById('detailModal');
    const closeModal = document.getElementById('closeModal');
    const totalMonitors = document.getElementById('totalMonitors');
    const upMonitors = document.getElementById('upMonitors');
    const downMonitors = document.getElementById('downMonitors');
    const avgResponseTime = document.getElementById('avgResponseTime');

    console.log('Elements retrieved:', { urlForm, urlInput, checkInterval, monitorList, statusFilter, sortBy, detailModal, closeModal, totalMonitors, upMonitors, downMonitors, avgResponseTime });

    let monitors = [];

    urlForm.addEventListener('submit', handleAddMonitor);
    statusFilter.addEventListener('change', updateDisplay);
    sortBy.addEventListener('change', updateDisplay);
    closeModal.addEventListener('click', () => detailModal.classList.add('hidden'));

    console.log('Event listeners added');

    async function handleAddMonitor(e) {
        e.preventDefault();
        console.log('Form submitted');
        const url = urlInput.value.trim();
        const interval = parseInt(checkInterval.value);
        console.log('URL:', url, 'Interval:', interval);
        if (url) {
            await addMonitor(url, interval);
            urlInput.value = '';
            updateDisplay();
        }
    }

    async function addMonitor(url, interval) {
        try {
            console.log('Attempting to add monitor:', url, interval);
            const response = await fetch('/api/add-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, interval }),
            });
            
            console.log('Response:', response);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Data:', data);
            
            monitors.push({ ...data, url, interval });
            updateDisplay();
        } catch (error) {
            console.error('Error adding monitor:', error);
            alert(`URL 추가 중 오류가 발생했습니다: ${error.message}`);
        }
    }

    function displayMonitor(monitor) {
        console.log('Displaying monitor:', monitor);
        const monitorItem = document.createElement('div');
        monitorItem.className = 'monitor-card px-6 py-4 flex justify-between items-center';
        monitorItem.innerHTML = `
            <div>
                <h3 class="text-lg font-semibold">${monitor.url}</h3>
                <p class="text-sm text-gray-500">응답 시간: ${monitor.responseTime}ms</p>
            </div>
            <div class="flex items-center">
                <span class="status-badge ${monitor.status === 'up' ? 'up' : 'down'}">
                    ${monitor.status === 'up' ? '정상' : '다운'}
                </span>
                <button class="ml-4 text-indigo-600 hover:text-indigo-900" onclick="showDetails('${monitor.url}')">
                    상세 정보
                </button>
                <button class="ml-4 text-red-600 hover:text-red-900" onclick="removeMonitor('${monitor.url}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        monitorList.appendChild(monitorItem);
    }

    window.removeMonitor = async function(url) {
        if (confirm(`정말로 "${url}" 모니터링을 삭제하시겠습니까?`)) {
            try {
                console.log('Attempting to remove monitor:', url);
                const response = await fetch(`/api/remove-url?url=${encodeURIComponent(url)}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                console.log('Remove response:', data);
                if (data.success) {
                    monitors = monitors.filter(m => m.url !== url);
                    updateDisplay();
                } else {
                    throw new Error(data.message || 'URL 삭제 실패');
                }
            } catch (error) {
                console.error('Error removing monitor:', error);
                alert('URL 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    window.showDetails = function(url) {
        console.log('Showing details for:', url);
        const monitor = monitors.find(m => m.url === url);
        if (monitor) {
            const modalContent = document.getElementById('modalContent');
            modalContent.innerHTML = `
                <p><strong>URL:</strong> ${monitor.url}</p>
                <p><strong>상태:</strong> ${monitor.status === 'up' ? '정상' : '다운'}</p>
                <p><strong>응답 시간:</strong> ${monitor.responseTime}ms</p>
                <p><strong>마지막 체크:</strong> ${new Date(monitor.lastChecked).toLocaleString()}</p>
                <p><strong>SSL 정보:</strong> ${monitor.ssl.valid ? '유효' : '무효'} (만료: ${new Date(monitor.ssl.expiresAt).toLocaleString()})</p>
            `;
            detailModal.classList.remove('hidden');
        }
    };

    function updateDisplay() {
        console.log('Updating display');
        monitorList.innerHTML = '';
        const filteredMonitors = filterMonitors(monitors);
        const sortedMonitors = sortMonitors(filteredMonitors);
        sortedMonitors.forEach(monitor => displayMonitor(monitor));
        updateStatistics();
        updateChart();
    }

    function filterMonitors(monitors) {
        const filter = statusFilter.value;
        return monitors.filter(monitor => {
            if (filter === 'all') return true;
            return monitor.status === filter;
        });
    }

    function sortMonitors(monitors) {
        const sort = sortBy.value;
        return monitors.sort((a, b) => {
            switch (sort) {
                case 'status':
                    return a.status.localeCompare(b.status);
                case 'responseTime':
                    return a.responseTime - b.responseTime;
                case 'sslExpiry':
                    return new Date(a.ssl.expiresAt) - new Date(b.ssl.expiresAt);
                default:
                    return 0;
            }
        });
    }

    function updateStatistics() {
        console.log('Updating statistics');
        totalMonitors.textContent = monitors.length;
        upMonitors.textContent = monitors.filter(m => m.status === 'up').length;
        downMonitors.textContent = monitors.filter(m => m.status === 'down').length;
        const avgTime = monitors.reduce((sum, m) => sum + m.responseTime, 0) / monitors.length;
        avgResponseTime.textContent = avgTime.toFixed(2) + ' ms';
    }

    function updateChart() {
        console.log('Updating chart');
        // 차트 업데이트 로직을 여기에 구현하세요
    }

    // 주기적으로 상태 업데이트
    setInterval(async () => {
        console.log('Periodic status update');
        for (let monitor of monitors) {
            try {
                const response = await fetch(`/api/check-status?url=${encodeURIComponent(monitor.url)}`);
                const data = await response.json();
                Object.assign(monitor, data);
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }
        updateDisplay();
    }, 60000);

    // 초기 디스플레이 업데이트
    updateDisplay();
});
