document.addEventListener('DOMContentLoaded', function() {
    const urlForm = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const monitorList = document.getElementById('monitorList');

    urlForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // 폼의 기본 제출 동작을 막습니다.
        const url = urlInput.value.trim();
        if (url) {
            await addMonitor(url);
            urlInput.value = ''; // 입력 필드를 비웁니다.
        }
    });

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

        // 로딩 메시지 제거
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

    // 주기적으로 상태 업데이트
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
    }, 60000); // 1분마다 업데이트

    // 초기 로딩 상태 표시
    if (monitorList.children.length === 0) {
        monitorList.innerHTML = '<div class="loading">모니터링할 URL을 추가해주세요.</div>';
    }
});
