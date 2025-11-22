// グローバル変数
let currentLanguage = 'hiragana'; // hiragana or kanji
let currentTask = null;
let tasks = []; // JSONから読み込む
let gameState = {
    currentStep: 0,
    score: 0,
    errors: 0,
    startTime: null,
    timeLimit: 30,
    timer: null
};

// 言語テキスト
const texts = {
    mainTitle: { hiragana: 'マウスれんしゅう', kanji: 'マウス練習' },
    langText: { hiragana: 'かんじ', kanji: 'ひらがな' },
    selectTitle: { hiragana: 'れんしゅうをえらぼう', kanji: '練習を選ぼう' },
    timeLabel: { hiragana: 'のこりじかん', kanji: '残り時間' },
    scoreLabel: { hiragana: 'スコア', kanji: 'スコア' },
    backText: { hiragana: 'もどる', kanji: '戻る' },
    nextTaskText: { hiragana: 'つぎのれんしゅうへ', kanji: '次の練習へ' },
    retryText: { hiragana: 'もういちど', kanji: 'もう一度' },
    resultTitle: { hiragana: 'クリア!', kanji: 'クリア!' },
    hoverHint: { hiragana: 'つぎは{num}にマウスをかざしてね!', kanji: '次は{num}にマウスをかざしてね!' },
    clickHint: { hiragana: 'つぎは{num}をクリックしてね!', kanji: '次は{num}をクリックしてね!' },
    doubleclickHint: { hiragana: 'つぎは{num}をダブルクリックしてね!', kanji: '次は{num}をダブルクリックしてね!' },
    wrongOrder: { hiragana: 'じゅんばんがちがうよ!', kanji: '順番が違うよ!' },
    great: { hiragana: 'やったね!', kanji: 'やったね!' },
    needDoubleClick: { hiragana: 'もういちどクリック!', kanji: 'もう一度クリック!' },
    loading: { hiragana: 'よみこみちゅう...', kanji: '読み込み中...' },
    loadError: { hiragana: 'データのよみこみにしっぱいしました', kanji: 'データの読み込みに失敗しました' }
};

// JSONファイルから課題データを読み込む
async function loadTasks() {
    try {
        // GitHubのrawコンテンツURLを使用
        const response = await fetch('https://raw.githubusercontent.com/iteensetagayakaminoge/mouse_practice_json/main/stages.json');
        if (!response.ok) {
            throw new Error('Failed to load stages.json from GitHub');
        }
        const data = await response.json();
        tasks = data.tasks;
        console.log('Loaded tasks from GitHub:', tasks);
        return true;
    } catch (error) {
        console.error('Error loading tasks from GitHub:', error);
        // フォールバック: 基本的な課題データを使用
        tasks = [
            {
                taskId: 'hover_01',
                type: 'hover',
                difficulty: 1,
                title: {
                    hiragana: 'じゅんばんどおりマウスをかざそう',
                    kanji: '順番通りマウスをかざそう'
                },
                targets: [
                    { id: 1, x: 150, y: 150, radius: 60 },
                    { id: 2, x: 400, y: 200, radius: 60 },
                    { id: 3, x: 650, y: 150, radius: 60 },
                    { id: 4, x: 400, y: 350, radius: 60 },
                    { id: 5, x: 250, y: 300, radius: 60 }
                ],
                hoverDuration: 500,
                timeLimit: 45
            },
            {
                taskId: 'click_01',
                type: 'click',
                difficulty: 2,
                title: {
                    hiragana: 'じゅんばんどおりクリックしよう',
                    kanji: '順番通りクリックしよう'
                },
                targets: [
                    { id: 1, x: 200, y: 200, radius: 60 },
                    { id: 2, x: 500, y: 150, radius: 60 },
                    { id: 3, x: 700, y: 250, radius: 60 },
                    { id: 4, x: 350, y: 350, radius: 60 },
                    { id: 5, x: 550, y: 350, radius: 60 }
                ],
                timeLimit: 40
            },
            {
                taskId: 'doubleclick_01',
                type: 'doubleclick',
                difficulty: 3,
                title: {
                    hiragana: 'じゅんばんどおりダブルクリックしよう',
                    kanji: '順番通りダブルクリックしよう'
                },
                targets: [
                    { id: 1, x: 250, y: 250, radius: 70 },
                    { id: 2, x: 550, y: 250, radius: 70 },
                    { id: 3, x: 400, y: 350, radius: 70 }
                ],
                doubleClickInterval: 500,
                timeLimit: 50
            }
        ];
        return false;
    }
}

// 初期化
async function init() {
    // ローディング表示
    const taskGrid = document.getElementById('taskGrid');
    taskGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; font-size: 20px;">${texts.loading[currentLanguage]}</div>`;
    
    // 課題データを読み込む
    const loaded = await loadTasks();
    
    // 画面を描画
    renderTaskSelector();
    loadProgress();
    
    if (!loaded) {
        console.warn('Using fallback task data');
    }
}

// 言語切り替え
function toggleLanguage() {
    currentLanguage = currentLanguage === 'hiragana' ? 'kanji' : 'hiragana';
    updateLanguage();
}

function updateLanguage() {
    // テキスト更新
    Object.keys(texts).forEach(key => {
        const element = document.getElementById(key);
        if (element && texts[key]) {
            element.textContent = texts[key][currentLanguage];
        }
    });

    // タスクタイトル更新
    if (currentTask) {
        document.getElementById('currentTaskTitle').textContent = currentTask.title[currentLanguage];
    }

    // タスクカード更新
    renderTaskSelector();
}

// タスク選択画面の描画
function renderTaskSelector() {
    const grid = document.getElementById('taskGrid');
    grid.innerHTML = '';

    tasks.forEach((task, index) => {
        const card = document.createElement('div');
        card.className = 'task-card';
        
        const progress = getTaskProgress(task.taskId);
        if (progress && progress.stars > 0) {
            card.classList.add('completed');
        }

        const stars = progress ? '⭐'.repeat(progress.stars) : '';
        const difficulty = '★'.repeat(task.difficulty) + '☆'.repeat(5 - task.difficulty);

        card.innerHTML = `
            <h3>${task.title[currentLanguage]}</h3>
            <div class="task-difficulty">${difficulty}</div>
            <div class="task-stars">${stars}</div>
        `;

        card.onclick = () => startTask(task);
        grid.appendChild(card);
    });
}

// タスク開始
function startTask(task) {
    currentTask = task;
    gameState = {
        currentStep: 0,
        score: 0,
        errors: 0,
        startTime: Date.now(),
        timeLimit: task.timeLimit,
        timer: null,
        lastClickTime: 0,
        clickCount: 0
    };

    document.getElementById('taskSelector').style.display = 'none';
    document.getElementById('gameArea').classList.add('active');
    document.getElementById('resultScreen').classList.remove('show');

    document.getElementById('currentTaskTitle').textContent = task.title[currentLanguage];
    document.getElementById('timeValue').textContent = task.timeLimit;
    
    // スコア表示をタスクタイプに応じて設定
    if (task.type === 'drag_horizontal' || task.type === 'drag_vertical') {
        document.getElementById('scoreValue').textContent = `0 / ${task.items.length}`;
    } else if (task.type === 'drag_curve' || task.type === 'trace') {
        document.getElementById('scoreValue').textContent = '0%';
    } else {
        document.getElementById('scoreValue').textContent = `0 / ${task.targets.length}`;
    }

    renderTask();
    startTimer();
    updateHint();
}

// タスク描画
function renderTask() {
    const container = document.getElementById('canvasContainer');
    container.innerHTML = '';

    if (currentTask.type === 'hover' || currentTask.type === 'click' || currentTask.type === 'doubleclick') {
        currentTask.targets.forEach((target, index) => {
            const targetEl = document.createElement('div');
            targetEl.className = 'target';
            targetEl.className += index === gameState.currentStep ? ' active' : ' inactive';
            targetEl.style.left = (target.x - target.radius) + 'px';
            targetEl.style.top = (target.y - target.radius) + 'px';
            targetEl.style.width = (target.radius * 2) + 'px';
            targetEl.style.height = (target.radius * 2) + 'px';
            targetEl.textContent = target.id;
            targetEl.dataset.targetId = target.id;

            if (currentTask.type === 'hover') {
                targetEl.addEventListener('mouseenter', () => handleHover(target.id, targetEl));
            } else if (currentTask.type === 'click') {
                targetEl.addEventListener('click', () => handleClick(target.id, targetEl));
            } else if (currentTask.type === 'doubleclick') {
                targetEl.addEventListener('click', () => handleDoubleClick(target.id, targetEl));
            }

            container.appendChild(targetEl);
        });
    } else if (currentTask.type === 'drag_horizontal' || currentTask.type === 'drag_vertical') {
        renderDragTask();
    } else if (currentTask.type === 'drag_curve') {
        renderCurveDragTask();
    } else if (currentTask.type === 'trace') {
        renderTraceTask();
    }
}

// ドラッグ&ドロップ課題の描画
function renderDragTask() {
    const container = document.getElementById('canvasContainer');
    
    currentTask.items.forEach((item, index) => {
        // ドロップゾーン
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.style.left = item.targetX + 'px';
        dropZone.style.top = item.targetY + 'px';
        dropZone.style.width = item.targetWidth + 'px';
        dropZone.style.height = item.targetHeight + 'px';
        dropZone.dataset.itemId = item.id;
        container.appendChild(dropZone);

        // ドラッグ可能なアイテム
        const draggable = document.createElement('div');
        draggable.className = 'draggable';
        draggable.style.left = item.startX + 'px';
        draggable.style.top = item.startY + 'px';
        draggable.textContent = item.icon;
        draggable.dataset.itemId = item.id;
        draggable.draggable = true;

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        draggable.addEventListener('mousedown', (e) => {
            isDragging = true;
            draggable.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;
            const rect = draggable.getBoundingClientRect();
            initialLeft = rect.left - container.getBoundingClientRect().left;
            initialTop = rect.top - container.getBoundingClientRect().top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            draggable.style.left = (initialLeft + deltaX) + 'px';
            draggable.style.top = (initialTop + deltaY) + 'px';

            // ドロップゾーンとの重なりチェック
            const dragRect = draggable.getBoundingClientRect();
            const dropZones = container.querySelectorAll('.drop-zone');
            dropZones.forEach(zone => {
                const zoneRect = zone.getBoundingClientRect();
                const isOverlapping = !(dragRect.right < zoneRect.left || 
                                        dragRect.left > zoneRect.right || 
                                        dragRect.bottom < zoneRect.top || 
                                        dragRect.top > zoneRect.bottom);
                
                if (isOverlapping && zone.dataset.itemId === draggable.dataset.itemId) {
                    zone.classList.add('active');
                } else {
                    zone.classList.remove('active');
                }
            });
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            draggable.classList.remove('dragging');

            // ドロップ判定
            const dragRect = draggable.getBoundingClientRect();
            const targetZone = container.querySelector(`.drop-zone[data-item-id="${draggable.dataset.itemId}"]`);
            const zoneRect = targetZone.getBoundingClientRect();
            
            const isOverlapping = !(dragRect.right < zoneRect.left || 
                                    dragRect.left > zoneRect.right || 
                                    dragRect.bottom < zoneRect.top || 
                                    dragRect.top > zoneRect.bottom);

            if (isOverlapping) {
                // 成功
                draggable.style.left = item.targetX + (item.targetWidth - 80) / 2 + 'px';
                draggable.style.top = item.targetY + (item.targetHeight - 80) / 2 + 'px';
                targetZone.classList.add('completed');
                targetZone.classList.remove('active');
                draggable.style.cursor = 'default';
                draggable.removeEventListener('mousedown', () => {});
                
                gameState.score++;
                showFeedback(texts.great[currentLanguage], 'success');
                createParticles(draggable);
                updateProgress();

                if (gameState.score >= currentTask.items.length) {
                    setTimeout(() => completeTask(), 500);
                }
            } else {
                // 失敗 - 元の位置に戻す
                draggable.style.left = item.startX + 'px';
                draggable.style.top = item.startY + 'px';
                gameState.errors++;
                targetZone.classList.remove('active');
            }
        });

        container.appendChild(draggable);
    });
}

// 曲線ドラッグ課題の描画
function renderCurveDragTask() {
    const container = document.getElementById('canvasContainer');
    
    // Canvas要素を作成
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    
    // パスを描画
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = currentTask.path.pathWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    const points = currentTask.path.points;
    ctx.moveTo(points[0].x, points[0].y);
    
    if (currentTask.path.type === 'bezier') {
        for (let i = 1; i < points.length - 2; i += 3) {
            ctx.bezierCurveTo(
                points[i].x, points[i].y,
                points[i+1].x, points[i+1].y,
                points[i+2].x, points[i+2].y
            );
        }
    }
    ctx.stroke();

    // ドラッグ可能なアイコン
    const draggable = document.createElement('div');
    draggable.className = 'draggable';
    draggable.style.left = currentTask.startX + 'px';
    draggable.style.top = currentTask.startY + 'px';
    draggable.textContent = currentTask.icon;
    draggable.style.cursor = 'move';

    let isDragging = false;
    let pathDeviations = [];

    draggable.addEventListener('mousedown', (e) => {
        isDragging = true;
        draggable.classList.add('dragging');
        pathDeviations = [];
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const containerRect = container.getBoundingClientRect();
        const x = e.clientX - containerRect.left - 40;
        const y = e.clientY - containerRect.top - 40;
        
        draggable.style.left = x + 'px';
        draggable.style.top = y + 'px';

        // パスからの距離を計算
        const distance = getDistanceToPath(x + 40, y + 40, points);
        pathDeviations.push(distance);

        // パスから外れたら警告
        if (distance > currentTask.path.pathWidth / 2) {
            ctx.strokeStyle = 'rgba(244, 67, 54, 0.5)';
        } else {
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
        }
        
        // 軌跡を描画
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + 40, y + 40, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        draggable.classList.remove('dragging');

        // 最終位置の確認
        const containerRect = container.getBoundingClientRect();
        const finalX = e.clientX - containerRect.left;
        const finalY = e.clientY - containerRect.top;
        const lastPoint = points[points.length - 1];
        const distanceToEnd = Math.sqrt(Math.pow(finalX - lastPoint.x, 2) + Math.pow(finalY - lastPoint.y, 2));

        if (distanceToEnd < 50) {
            // 成功
            const avgDeviation = pathDeviations.reduce((a, b) => a + b, 0) / pathDeviations.length;
            const accuracy = Math.max(0, 100 - (avgDeviation / currentTask.path.pathWidth * 100));
            
            gameState.score = Math.round(accuracy);
            showFeedback(texts.great[currentLanguage], 'success');
            createParticles(draggable);
            
            setTimeout(() => completeTask(), 1000);
        } else {
            gameState.errors++;
            showFeedback(texts.wrongOrder[currentLanguage], 'error');
        }
    });

    container.appendChild(draggable);
}

// パスまでの距離を計算
function getDistanceToPath(x, y, points) {
    let minDistance = Infinity;
    
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
        minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
}

// 点から線分までの距離
function distanceToLineSegment(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// 図形なぞり課題の描画
function renderTraceTask() {
    const container = document.getElementById('canvasContainer');
    
    // Canvas要素を作成
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    
    // 図形を描画
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = currentTask.shape.lineWidth;
    ctx.beginPath();
    
    const shape = currentTask.shape;
    
    if (shape.type === 'circle') {
        ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
    } else if (shape.type === 'square') {
        ctx.rect(shape.x, shape.y, shape.size, shape.size);
    } else if (shape.type === 'triangle') {
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.lineTo(shape.x3, shape.y3);
        ctx.closePath();
    } else if (shape.type === 'star') {
        drawStar(ctx, shape.centerX, shape.centerY, shape.points, shape.outerRadius, shape.innerRadius);
    }
    
    ctx.stroke();

    let isDrawing = false;
    let drawnPoints = [];

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        drawnPoints = [];
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawnPoints.push({x, y});
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawnPoints.push({x, y});

        // ユーザーの軌跡を描画
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (drawnPoints.length > 1) {
            ctx.beginPath();
            ctx.moveTo(drawnPoints[drawnPoints.length - 2].x, drawnPoints[drawnPoints.length - 2].y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;

        // 一致率を計算
        const matchRate = calculateShapeMatch(drawnPoints, shape);
        gameState.score = Math.round(matchRate);
        
        document.getElementById('scoreValue').textContent = `${gameState.score}%`;
        
        if (matchRate >= 60) {
            showFeedback(texts.great[currentLanguage], 'success');
            updateProgress();
            setTimeout(() => completeTask(), 1000);
        } else {
            showFeedback(`${Math.round(matchRate)}% - ${texts.wrongOrder[currentLanguage]}`, 'error');
            gameState.errors++;
            
            // キャンバスをクリアして図形を再描画
            setTimeout(() => {
                drawnPoints = [];
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = currentTask.shape.lineWidth;
                ctx.beginPath();
                
                if (shape.type === 'circle') {
                    ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                } else if (shape.type === 'square') {
                    ctx.rect(shape.x, shape.y, shape.size, shape.size);
                } else if (shape.type === 'star') {
                    drawStar(ctx, shape.centerX, shape.centerY, shape.points, shape.outerRadius, shape.innerRadius);
                }
                
                ctx.stroke();
            }, 1500);
        }
    });
}

// 星を描画
function drawStar(ctx, cx, cy, points, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / points;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < points; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}

// 図形の一致率を計算
function calculateShapeMatch(drawnPoints, shape) {
    if (drawnPoints.length < 10) return 0;

    let matchCount = 0;
    const threshold = shape.lineWidth * 3;

    drawnPoints.forEach(point => {
        let distance = Infinity;
        
        if (shape.type === 'circle') {
            const dx = point.x - shape.centerX;
            const dy = point.y - shape.centerY;
            const distFromCenter = Math.sqrt(dx * dx + dy * dy);
            distance = Math.abs(distFromCenter - shape.radius);
        } else if (shape.type === 'square') {
            // 四角形の4辺への最短距離を計算
            const x = shape.x;
            const y = shape.y;
            const size = shape.size;
            
            const d1 = Math.abs(point.y - y); // 上辺
            const d2 = Math.abs(point.y - (y + size)); // 下辺
            const d3 = Math.abs(point.x - x); // 左辺
            const d4 = Math.abs(point.x - (x + size)); // 右辺
            
            // 四角形の範囲内かチェック
            if (point.x >= x && point.x <= x + size && point.y >= y && point.y <= y + size) {
                distance = Math.min(d1, d2, d3, d4);
            }
        } else if (shape.type === 'star') {
            // 星形の中心からの距離で簡易判定
            const dx = point.x - shape.centerX;
            const dy = point.y - shape.centerY;
            const distFromCenter = Math.sqrt(dx * dx + dy * dy);
            
            // 星形は外半径と内半径の間に収まっているかチェック
            if (distFromCenter >= shape.innerRadius - threshold && 
                distFromCenter <= shape.outerRadius + threshold) {
                distance = 0; // 簡易判定
            }
        }

        if (distance < threshold) {
            matchCount++;
        }
    });

    return (matchCount / drawnPoints.length) * 100;
}

// ホバー処理
function handleHover(targetId, element) {
    const expectedId = currentTask.targets[gameState.currentStep].id;

    if (targetId === expectedId) {
        let hoverTimer = setTimeout(() => {
            gameState.currentStep++;
            gameState.score++;
            element.className = 'target completed';
            showFeedback(texts.great[currentLanguage], 'success');
            createParticles(element);
            updateProgress();

            if (gameState.currentStep < currentTask.targets.length) {
                const nextTarget = document.querySelector(`[data-target-id="${currentTask.targets[gameState.currentStep].id}"]`);
                if (nextTarget) {
                    nextTarget.className = 'target active';
                }
                updateHint();
            } else {
                completeTask();
            }
        }, currentTask.hoverDuration);

        element.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimer);
        }, { once: true });
    }
}

// クリック処理
function handleClick(targetId, element) {
    const expectedId = currentTask.targets[gameState.currentStep].id;

    if (targetId === expectedId) {
        gameState.currentStep++;
        gameState.score++;
        element.className = 'target completed';
        showFeedback(texts.great[currentLanguage], 'success');
        createParticles(element);
        updateProgress();

        if (gameState.currentStep < currentTask.targets.length) {
            const nextTarget = document.querySelector(`[data-target-id="${currentTask.targets[gameState.currentStep].id}"]`);
            if (nextTarget) {
                nextTarget.className = 'target active';
            }
            updateHint();
        } else {
            completeTask();
        }
    } else {
        gameState.errors++;
        showFeedback(texts.wrongOrder[currentLanguage], 'error');
    }
}

// ダブルクリック処理
function handleDoubleClick(targetId, element) {
    const expectedId = currentTask.targets[gameState.currentStep].id;
    const now = Date.now();

    if (targetId !== expectedId) {
        gameState.errors++;
        showFeedback(texts.wrongOrder[currentLanguage], 'error');
        return;
    }

    if (now - gameState.lastClickTime < currentTask.doubleClickInterval && gameState.clickCount === 1) {
        // ダブルクリック成功
        gameState.currentStep++;
        gameState.score++;
        gameState.clickCount = 0;
        element.className = 'target completed';
        showFeedback(texts.great[currentLanguage], 'success');
        createParticles(element);
        updateProgress();

        if (gameState.currentStep < currentTask.targets.length) {
            const nextTarget = document.querySelector(`[data-target-id="${currentTask.targets[gameState.currentStep].id}"]`);
            if (nextTarget) {
                nextTarget.className = 'target active';
            }
            updateHint();
        } else {
            completeTask();
        }
    } else {
        // 1回目のクリック
        gameState.clickCount = 1;
        gameState.lastClickTime = now;
        showFeedback(texts.needDoubleClick[currentLanguage], 'success');
    }
}

// タイマー開始
function startTimer() {
    gameState.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const remaining = Math.max(0, gameState.timeLimit - elapsed);
        document.getElementById('timeValue').textContent = remaining;

        if (remaining === 0) {
            clearInterval(gameState.timer);
            completeTask();
        }
    }, 1000);
}

// 進捗更新
function updateProgress() {
    if (currentTask.type === 'drag_horizontal' || currentTask.type === 'drag_vertical') {
        const progress = (gameState.score / currentTask.items.length) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('scoreValue').textContent = `${gameState.score} / ${currentTask.items.length}`;
    } else if (currentTask.type === 'drag_curve' || currentTask.type === 'trace') {
        const progress = gameState.score;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('scoreValue').textContent = `${gameState.score}%`;
    } else {
        const progress = (gameState.score / currentTask.targets.length) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('scoreValue').textContent = `${gameState.score} / ${currentTask.targets.length}`;
    }
}

// ヒント更新
function updateHint() {
    const hintArea = document.getElementById('hintArea');
    
    if (currentTask.type === 'hover' || currentTask.type === 'click' || currentTask.type === 'doubleclick') {
        if (gameState.currentStep < currentTask.targets.length) {
            const nextNum = currentTask.targets[gameState.currentStep].id;
            let hintKey = currentTask.type + 'Hint';
            let hint = texts[hintKey][currentLanguage].replace('{num}', nextNum);
            hintArea.textContent = hint;
        }
    } else if (currentTask.type === 'drag_horizontal' || currentTask.type === 'drag_vertical') {
        const remaining = currentTask.items.length - gameState.score;
        hintArea.textContent = currentLanguage === 'hiragana' 
            ? `のこり${remaining}こをドラッグしよう!` 
            : `残り${remaining}個をドラッグしよう!`;
    } else if (currentTask.type === 'drag_curve') {
        hintArea.textContent = currentLanguage === 'hiragana'
            ? 'せんにそってドラッグしてね!'
            : '線に沿ってドラッグしてね!';
    } else if (currentTask.type === 'trace') {
        hintArea.textContent = currentLanguage === 'hiragana'
            ? 'ずけいをマウスでなぞってね!'
            : '図形をマウスでなぞってね!';
    }
}

// フィードバック表示
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type} show`;
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 1000);
}

// パーティクル生成
function createParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = '✨';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.fontSize = Math.random() * 20 + 10 + 'px';
        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
    }
}

// タスク完了
function completeTask() {
    clearInterval(gameState.timer);

    const elapsed = (Date.now() - gameState.startTime) / 1000;
    let totalScore = 0;

    if (currentTask.type === 'drag_horizontal' || currentTask.type === 'drag_vertical') {
        // ドラッグ&ドロップ課題のスコア計算
        const timeScore = Math.max(0, 100 - (elapsed / currentTask.timeLimit) * 100);
        const accuracyScore = (gameState.score / currentTask.items.length) * 100;
        const errorPenalty = gameState.errors * 10;
        totalScore = Math.max(0, Math.round(timeScore * 0.4 + accuracyScore * 0.6 - errorPenalty));
    } else if (currentTask.type === 'drag_curve' || currentTask.type === 'trace') {
        // 曲線ドラッグ・図形なぞり課題のスコア計算
        const timeScore = Math.max(0, 100 - (elapsed / currentTask.timeLimit) * 100);
        const accuracyScore = gameState.score; // 既に0-100で計算済み
        const errorPenalty = gameState.errors * 10;
        totalScore = Math.max(0, Math.round(timeScore * 0.3 + accuracyScore * 0.7 - errorPenalty));
    } else {
        // ホバー・クリック・ダブルクリック課題のスコア計算
        const timeScore = Math.max(0, 100 - (elapsed / currentTask.timeLimit) * 100);
        const accuracyScore = (gameState.score / currentTask.targets.length) * 100;
        const errorPenalty = gameState.errors * 10;
        totalScore = Math.max(0, Math.round(timeScore * 0.4 + accuracyScore * 0.6 - errorPenalty));
    }

    let stars = 0;
    if (totalScore >= 90) stars = 5;
    else if (totalScore >= 70) stars = 4;
    else if (totalScore >= 50) stars = 3;
    else if (totalScore >= 30) stars = 2;
    else stars = 1;

    saveTaskProgress(currentTask.taskId, {
        score: totalScore,
        stars: stars,
        time: elapsed,
        errors: gameState.errors,
        completedAt: new Date().toISOString()
    });

    showResult(totalScore, stars, elapsed);
}

// 結果表示
function showResult(score, stars, time) {
    document.getElementById('gameArea').classList.remove('active');
    document.getElementById('resultScreen').classList.add('show');

    const messages = {
        5: { hiragana: 'パーフェクト!', kanji: 'パーフェクト!' },
        4: { hiragana: 'すごいね!', kanji: 'すごいね!' },
        3: { hiragana: 'がんばったね!', kanji: 'がんばったね!' },
        2: { hiragana: 'もうすこし!', kanji: 'もう少し!' },
        1: { hiragana: 'れんしゅうしてみよう', kanji: '練習してみよう' }
    };

    document.getElementById('resultTitle').textContent = messages[stars][currentLanguage];
    document.getElementById('resultStars').textContent = '⭐'.repeat(stars);

    const details = `
        <div class="result-item">
            <span class="result-label">${currentLanguage === 'hiragana' ? 'スコア' : 'スコア'}</span>
            <span class="result-value">${score}${currentLanguage === 'hiragana' ? 'てん' : '点'}</span>
        </div>
        <div class="result-item">
            <span class="result-label">${currentLanguage === 'hiragana' ? 'かかったじかん' : 'かかった時間'}</span>
            <span class="result-value">${time.toFixed(1)}${currentLanguage === 'hiragana' ? 'びょう' : '秒'}</span>
        </div>
        <div class="result-item">
            <span class="result-label">${currentLanguage === 'hiragana' ? 'まちがえたかず' : '間違えた数'}</span>
            <span class="result-value">${gameState.errors}${currentLanguage === 'hiragana' ? 'かい' : '回'}</span>
        </div>
    `;

    document.getElementById('resultDetails').innerHTML = details;
}

// メニューに戻る
function backToMenu() {
    document.getElementById('taskSelector').style.display = 'block';
    document.getElementById('gameArea').classList.remove('active');
    document.getElementById('resultScreen').classList.remove('show');
    renderTaskSelector();
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
}

// タスクやり直し
function retryTask() {
    if (currentTask) {
        startTask(currentTask);
    }
}

// 進捗保存
function saveTaskProgress(taskId, progress) {
    const saved = JSON.parse(localStorage.getItem('mouseProgress') || '{}');
    if (!saved[taskId] || saved[taskId].stars < progress.stars) {
        saved[taskId] = progress;
        localStorage.setItem('mouseProgress', JSON.stringify(saved));
    }
}

// 進捗取得
function getTaskProgress(taskId) {
    const saved = JSON.parse(localStorage.getItem('mouseProgress') || '{}');
    return saved[taskId] || null;
}

// 進捗読み込み
function loadProgress() {
    const saved = JSON.parse(localStorage.getItem('mouseProgress') || '{}');
    console.log('Loaded progress:', saved);
}

// ページ読み込み時に初期化
window.onload = init;
