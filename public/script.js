document.addEventListener('DOMContentLoaded', function() {
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

    let monitors = [];
    let chart;

    urlForm.addEventListener('submit', handleAddMonitor);
    statusFilter.addEventListener('change', updateDisplay);
    sortBy.addEventListener('change', updateDisplay);
    closeModal.addEventListener('click', () => detailModal.classList.add('hidden'));

    async function handleAddMonitor(e) {
        e.preventDefault();
        const url = urlInput.value.trim();
        const interval = parseInt(checkInterval.value);
        if (url) {
            await addMonitor(url, interval);
            urlInput.value = '';
            updateDisplay();
        }
    }

async function addMonitor(url, interval) {
    try {
        console.log('Sending request to add URL:', url);
        const response = await fetch('/api/add-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, interval }),
        });
        
        console.log('Response received:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Parsed response data:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        monitors.push({ ...data, url, interval });
        updateDisplay();
    } catch (error) {
        console.error('Error adding monitor:', error);
        alert(`URL 추가 중 오류가 발생했습니다: ${error.message}`);
    }
}

    function displayMonitor(monitor) {
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

    async function removeMonitor(url) {
        if (confirm(`정말로 "${url}" 모니터링을 삭제하시
