document.addEventListener('DOMContentLoaded', function() {
    const urlForm = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const addButton = document.getElementById('addButton');
    const monitorList = document.getElementById('monitorList');

    addButton.addEventListener('click', handleAddMonitor);
    urlForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleAddMonitor();
    });

    function handleAddMonitor() {
        const url = urlInput.value.trim();
        if (url) {
            addMonitor(url);
            urlInput.value = '';
        }
    }

    async function addMonitor(url) {
        try {
            const response = await fetch('/api/add-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            displayMonitor(url, data);
        } catch (error) {
            console.error('Error adding monitor:', error);
            alert(`URL 추가 중 오류가 발생했습니다: ${error.message}`);
        }
    }

    function displayMonitor(url, data) {
        const existingCard = document.getElementById(`monitor-${encodeURIComponent(url)}`);
        
        if (existingCard) {
            updateCardContent(existingCard, url, data);
        } else {
            const card = document.createElement('div');
            card.className = 'monitor-card';
            card.id = `monitor-${encodeURIComponent(url)}`;
            
            updateCardContent(card, url, data);
            monitorList.prepend(card);
        }

        const loadingMessage = monitorList.querySelector('.loading');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    function updateCardContent(card, url, data) {
        console.log('Updating card content:', url, data);
        let sslInfo = 'N/A';
        let sslClass = '';
        
        if (data.ssl && data.ssl.expiresAt) {
            console.log('SSL info available:', data.ssl);
            const expirationDate = new Date(data.ssl.expiresAt);
            const now = new Date();
            const diffTime = expirationDate - now;
            const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (isNaN(daysUntilExpiration) || daysUntilExpiration < 0) {
                sslInfo = '만료됨';
                sslClass = 'danger';
            } else {
                sslInfo = `${daysUntilExpiration}일`;
                if (daysUntilExpiration <= 7) {
                    sslClass = 'danger';
                } else if (daysUntilExpiration <= 30) {
                    sslClass = 'warning';
                }
            }
        } else if (!url.startsWith('https://')) {
            sslInfo = '해당 없음';
        } else {
            console.log('SSL info not available');
            sslInfo = '확인 불가';
            sslClass = 'warning';
        }

        card.innerHTML = `
            <h2>${url}</h2>
            <span class="status ${data.status === 'up' ? 'up' : 'down'}">
                ${data.status === 'up' ? '<i class="fas fa-check-circle"></i> 정상' : '<i class="fas fa-exclamation-circle"></i> 다운'}
            </span>
            <div class="monitor-info">
                <p class="response-time"><i class="fas fa-clock"></i> 응답 시간: ${data.responseTime}ms</p>
                <p class="ssl-info ${sslClass}"><i class="fas fa-lock"></i> SSL 인증서 만료까지: ${sslInfo}</p>
                <p class="down-history"><i class="fas fa-history"></i> 최근 다운 기록: ${data.downHistory.length > 0 ? new Date(data.downHistory[data.downHistory.length - 1]).toLocaleString() : '없음'}</p>
            </div>
            <button class="delete-btn" onclick="removeMonitor('${url}')"><i class="fas fa-trash"></i></button>
        `;
    }

    window.removeMonitor = async function(url) {
        if (confirm(`정말로 "${url}" 모니터링을 삭제하시겠습니까?`)) {
            try {
                const response = await fetch(`/api/remove-url?url=${encodeURIComponent(url)}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if (data.success) {
                    document.getElementById(`monitor-${encodeURIComponent(url)}`).remove();
                    if (monitorList.querySelectorAll('.monitor-card').length === 0) {
                        monitorList.innerHTML = '<div class="loading">모니터링할 URL을 추가해주세요.</div>';
                    }
                } else {
                    alert('URL 삭제 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('Error removing monitor:', error);
                alert('URL 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    setInterval(async () => {
        const cards = document.querySelectorAll('.monitor-card');
        for (let card of cards) {
            const url = card.querySelector('h2').textContent;
            try {
                const response = await fetch(`/api/check-status?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                updateCardContent(card, url, data);
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }
    }, 60000);

    if (monitorList.children.length === 0) {
        monitorList.innerHTML = '<div class="loading">모니터링할 URL을 추가해주세요.</div>';
    }
});

// 다크 모드 토글
document.getElementById('toggleTheme').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// 응답 시간 차트 생성
function createResponseTimeChart(data) {
    const ctx = document.getElementById('responseTimeChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Response Time (ms)',
                data: data.responseTimes,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 차트 데이터 업데이트 (예시)
function updateChartData() {
    // 실제로는 서버에서 데이터를 가져와야 합니다
    const data = {
        labels: ['1h ago', '45m ago', '30m ago', '15m ago', 'Now'],
        responseTimes: [250, 275, 200, 225, 240]
    };
    createResponseTimeChart(data);
}

updateChartData();
