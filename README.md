# test1
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>초등학생 수행평가 관리</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f3f4f6;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        .drop-zone {
            border: 2px dashed #9ca3af;
            background-color: #e5e7eb;
            transition: all 0.3s ease;
        }
        .drop-zone-over {
            border-color: #1f2937;
            background-color: #d1d5db;
        }
        .image-preview-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
        }
        .image-preview-item {
            position: relative;
        }
        .delete-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background-color: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            padding: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .delete-btn:hover {
            background-color: rgba(255, 255, 255, 1);
        }
        .loading-spinner {
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-gray-100 p-8">

    <div class="container bg-white p-8 rounded-2xl shadow-xl space-y-8">
        <h1 class="text-4xl font-bold text-center text-gray-800 mb-6">초등학생 수행평가 관리 웹앱</h1>

        <!-- File Upload Section for Criteria -->
        <div class="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">평가 기준 및 성취기준 사진 업로드</h2>
            <div id="criteria-drop-zone" class="drop-zone flex flex-col items-center justify-center p-8 rounded-xl text-gray-500">
                <p class="text-lg font-medium">평가 기준 사진을 여기에 드래그하거나 클릭하여 업로드하세요</p>
                <p class="text-sm mt-1">(AI가 학생 답안을 평가할 때 참고합니다)</p>
                <input type="file" id="criteria-upload" class="hidden" accept="image/jpeg, image/png">
            </div>
            <div id="criteria-preview-container" class="image-preview-container mt-6"></div>
        </div>

        <!-- File Upload Section for Student Answer -->
        <div class="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">학생 답안지 사진 업로드</h2>
            <div id="answer-drop-zone" class="drop-zone flex flex-col items-center justify-center p-8 rounded-xl text-gray-500">
                <p class="text-lg font-medium">학생 답안지 사진을 여기에 드래그하거나 클릭하여 업로드하세요</p>
                <p class="text-sm mt-1">(JPEG, PNG 파일만 가능)</p>
                <input type="file" id="answer-upload" class="hidden" multiple accept="image/jpeg, image/png">
            </div>
            <div id="answer-preview-container" class="image-preview-container mt-6"></div>
        </div>

        <!-- Evaluation and Generation Section -->
        <div class="bg-green-50 p-6 rounded-xl border border-green-200">
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">평가 및 생활기록부 종합 의견 생성</h2>

            <div class="space-y-4">
                <div class="flex items-center space-x-4">
                    <label for="student-name" class="text-gray-600 font-medium">학생 이름:</label>
                    <input type="text" id="student-name" class="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="예) 김민지">
                </div>

                <div class="flex items-center space-x-4">
                    <label for="subject" class="text-gray-600 font-medium">과목:</label>
                    <input type="text" id="subject" class="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="예) 국어">
                </div>
            </div>

            <div class="mt-6 flex items-center justify-center space-x-4">
                <button id="generate-opinion-btn" class="bg-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span id="generate-btn-text">자동 채점 및 종합 의견 생성</span>
                    <div id="loading-spinner" class="hidden w-5 h-5 border-2 loading-spinner"></div>
                </button>
            </div>

            <div class="mt-8 relative" id="opinion-output-container">
                <h3 class="text-xl font-semibold text-gray-700 mb-2">생성된 종합 의견</h3>
                <div id="generated-opinion" class="min-h-[100px] p-4 bg-gray-50 rounded-xl border border-gray-200 whitespace-pre-wrap text-gray-800">
                    여기에 AI가 채점 및 평가를 기반으로 생성한 종합 의견이 표시됩니다.
                </div>
                <button id="copy-btn" class="absolute top-4 right-4 bg-gray-200 p-2 rounded-full shadow-md hover:bg-gray-300 transition duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>
            
        </div>

        <!-- Notification Message Box -->
        <div id="notification" class="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hidden">
            메시지
        </div>
    </div>

    <script>
        // DOM 요소 가져오기
        const criteriaDropZone = document.getElementById('criteria-drop-zone');
        const criteriaUpload = document.getElementById('criteria-upload');
        const criteriaPreviewContainer = document.getElementById('criteria-preview-container');
        const answerDropZone = document.getElementById('answer-drop-zone');
        const answerUpload = document.getElementById('answer-upload');
        const answerPreviewContainer = document.getElementById('answer-preview-container');
        const studentNameInput = document.getElementById('student-name');
        const subjectInput = document.getElementById('subject');
        const generateOpinionBtn = document.getElementById('generate-opinion-btn');
        const generateBtnText = document.getElementById('generate-btn-text');
        const loadingSpinner = document.getElementById('loading-spinner');
        const generatedOpinionDiv = document.getElementById('generated-opinion');
        const copyBtn = document.getElementById('copy-btn');
        const notification = document.getElementById('notification');

        // 파일 드래그 앤 드롭 이벤트 핸들러
        criteriaDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            criteriaDropZone.classList.add('drop-zone-over');
        });

        criteriaDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            criteriaDropZone.classList.remove('drop-zone-over');
        });

        criteriaDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            criteriaDropZone.classList.remove('drop-zone-over');
            const files = e.dataTransfer.files;
            handleFiles(files, criteriaPreviewContainer);
        });

        criteriaDropZone.addEventListener('click', () => {
            criteriaUpload.click();
        });

        criteriaUpload.addEventListener('change', (e) => {
            handleFiles(e.target.files, criteriaPreviewContainer);
        });

        answerDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            answerDropZone.classList.add('drop-zone-over');
        });

        answerDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            answerDropZone.classList.remove('drop-zone-over');
        });

        answerDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            answerDropZone.classList.remove('drop-zone-over');
            const files = e.dataTransfer.files;
            handleFiles(files, answerPreviewContainer);
        });

        answerDropZone.addEventListener('click', () => {
            answerUpload.click();
        });

        answerUpload.addEventListener('change', (e) => {
            handleFiles(e.target.files, answerPreviewContainer);
        });

        function handleFiles(files, container) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        createImagePreview(e.target.result, container);
                    };
                    reader.readAsDataURL(file);
                } else {
                    showNotification('이미지 파일만 업로드할 수 있습니다.');
                }
            });
        }

        function createImagePreview(imageDataUrl, container) {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item relative group';
            previewItem.innerHTML = `
                <img src="${imageDataUrl}" alt="uploaded image" class="rounded-lg shadow-md w-full h-auto object-cover">
                <button class="delete-btn opacity-0 group-hover:opacity-100 transition-opacity duration-200" title="삭제">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            `;
            container.appendChild(previewItem);

            previewItem.querySelector('.delete-btn').addEventListener('click', () => {
                previewItem.remove();
            });
        }

        // 알림 메시지 표시 함수
        function showNotification(message, duration = 3000) {
            notification.textContent = message;
            notification.classList.remove('hidden');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, duration);
        }

        // 종합 의견 생성 버튼 클릭 이벤트
        generateOpinionBtn.addEventListener('click', async () => {
            const studentName = studentNameInput.value.trim();
            const subject = subjectInput.value.trim();
            const criteriaImages = criteriaPreviewContainer.querySelectorAll('img');
            const answerImages = answerPreviewContainer.querySelectorAll('img');
            
            // 필수 입력값 및 이미지 확인
            if (!studentName || !subject || criteriaImages.length === 0 || answerImages.length === 0) {
                showNotification('학생 이름, 과목, 평가 기준 사진, 그리고 학생 답안지 사진을 모두 입력/업로드해주세요.');
                return;
            }

            // UI 상태 변경
            generateOpinionBtn.disabled = true;
            generateBtnText.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            generatedOpinionDiv.innerHTML = '<div class="text-center text-gray-400">자동 채점 및 종합 의견을 생성하는 중...</div>';
            
            // 프롬프트 수정: 등급을 먼저 명시하고 지정된 어미를 사용하도록 요청
            const prompt = `초등학교 교사로서 학생 '${studentName}'의 '${subject}' 과목 수행평가 종합 의견을 작성해 주세요. 첨부된 첫 번째 이미지는 채점 기준이고, 두 번째 이미지부터는 학생 답안지입니다. 채점 기준을 바탕으로 학생 답안지를 평가하고, '매우잘함', '잘함', '보통', '노력요함' 중 해당하는 평가 등급을 먼저 명시한 후, 성취기준에 맞춰 긍정적이고 성장 지향적인 문체로 500자 내외의 종합 의견을 생성해 주세요. 종합 의견의 어미는 '~함.' 또는 '~임.'으로 통일해 주세요. 예를 들어 '주장하는 글의 구조와 논리를 이해하여 자신의 의견을 체계적으로 조직하고 설득력 있게 제시함. 시의 비유적 표현을 활용하여 감정과 분위기를 풍부하게 전달하며 발표 활동에도 주도적으로 참여해 의사소통 능력을 키움.'과 같이 작성해 주세요.`;

            try {
                // 이미지를 base64로 변환
                const allImages = [...criteriaImages, ...answerImages];
                const imageParts = allImages.map(img => ({
                    inlineData: {
                        mimeType: "image/png", 
                        data: img.src.split(',')[1]
                    }
                }));

                // API 호출을 위한 payload 구성
                const payload = {
                    contents: [{
                        role: "user",
                        parts: [
                            { text: prompt },
                            ...imageParts
                        ]
                    }],
                };
                
                const apiKey = "AIzaSyCWpt1uxNSdV2B_QKV5B1G7Vd6osT3xCIc";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API 오류: ${errorData.error.message}`);
                }

                const result = await response.json();
                
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const opinionText = result.candidates[0].content.parts[0].text;
                    generatedOpinionDiv.textContent = opinionText;
                    showNotification('종합 의견 생성이 완료되었습니다!');
                } else {
                    generatedOpinionDiv.textContent = '종합 의견을 생성하지 못했습니다. 다시 시도해 주세요.';
                    showNotification('종합 의견 생성 실패');
                }

            } catch (error) {
                console.error('API 호출 중 오류 발생:', error);
                generatedOpinionDiv.textContent = '오류가 발생했습니다. 다시 시도해 주세요.';
                showNotification('API 호출 실패');
            } finally {
                // UI 상태 복원
                generateOpinionBtn.disabled = false;
                generateBtnText.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
            }
        });

        // 클립보드 복사 버튼 클릭 이벤트
        copyBtn.addEventListener('click', () => {
            const opinionText = generatedOpinionDiv.textContent;
            if (opinionText && opinionText.trim() !== '여기에 AI가 채점 및 평가를 기반으로 생성한 종합 의견이 표시됩니다.' && opinionText.trim() !== '자동 채점 및 종합 의견을 생성하는 중...' && opinionText.trim() !== '오류가 발생했습니다. 다시 시도해 주세요.') {
                try {
                    // 클립보드에 텍스트 복사
                    const textarea = document.createElement('textarea');
                    textarea.value = opinionText;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);

                    showNotification('종합 의견이 클립보드에 복사되었습니다!');
                } catch (err) {
                    showNotification('복사 중 오류가 발생했습니다.');
                }
            } else {
                showNotification('복사할 내용이 없습니다.');
            }
        });
    </script>

</body>
</html>
