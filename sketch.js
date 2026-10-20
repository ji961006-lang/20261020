// 定義題庫陣列，包含題目、6個選項、正確答案的索引
let questions = [
  {
    question: "請問下列哪一個函式是用來設定 p5.js 的畫布大小？",
    options: ["background()", "createCanvas()", "fill()", "rect()", "ellipse()", "size()"],
    correct: 1 // 正確答案是 createCanvas()，索引為 1
  },
  {
    question: "在 p5.js 中，哪一個內建函式會每秒重複執行多次，通常用於繪製動畫？",
    options: ["setup()", "preload()", "draw()", "mouseClicked()", "windowResized()", "loop()"],
    correct: 2 // 正確答案是 draw()，索引為 2
  },
  {
    question: "請問用來設定圖形『填滿顏色』的 p5.js 函式為何？",
    options: ["stroke()", "color()", "fill()", "tint()", "background()", "blend()"],
    correct: 2 // 正確答案是 fill()，索引為 2
  }
];

let currentQuestionIndex = 0; // 記錄目前進行到第幾題
let score = 0; // 記錄玩家得分
let isQuizFinished = false; // 判斷測驗是否已經結束

let draggableOptions = []; // 儲存下方文字選項物件的陣列
let targetZone = {}; // 放置答案的目標區域物件
let draggedItem = null; // 目前正在被滑鼠拖曳的選項
let feedbackMessage = ""; // 答題後的即時回饋訊息
let feedbackTimer = 0; // 控制回饋訊息顯示時間的計時器

// setup 函式在網頁載入時執行一次，用於初始化設定
function setup() {
  // 建立一個佔滿整個瀏覽器視窗的畫布
  createCanvas(windowWidth, windowHeight);
  // 設定文字對齊方式為置中與垂直置中
  textAlign(CENTER, CENTER);
  // 初始化第一道題目與其對應的拖曳選項
  initQuestion(currentQuestionIndex);
}

// draw 函式每秒執行約 60 次，負責畫面持續刷新與繪製
function draw() {
  // 設定畫布背景顏色為深灰色
  background(30);

  // 繪製上方的動態視覺區塊（取代 GIF 檔案，避免讀取不到而卡住）
  drawHeaderAnimation();

  // 若測驗尚未結束，繪製題目與互動介面
  if (!isQuizFinished) {
    drawQuizInterface();
  } else {
    // 若測驗結束，顯示結算畫面
    drawResultScreen();
  }
}

// 初始化指定索引的題目與選項位置
function initQuestion(index) {
  draggableOptions = []; // 清空上一題的選項
  feedbackMessage = ""; // 清空回饋訊息

  let currentQ = questions[index]; // 取得當前題目物件
  let totalOptions = currentQ.options.length; // 選項總數（此處為6個）

  // 計算下方選項的排版參數（支援響應式，自動計算間距）
  let spacingX = width / (totalOptions + 1); // 每個選項在水平方向的平均間距

  for (let i = 0; i < totalOptions; i++) {
    // 建立每個選項的物件資料
    let opt = {
      text: currentQ.options[i], // 選項文字
      index: i, // 選項原本的索引
      // 初始位置設定在畫布下方區塊，平均橫向排列
      x: spacingX * (i + 1),
      y: height * 0.82,
      baseX: spacingX * (i + 1), // 記錄原始X座標以便重置
      baseY: height * 0.82, // 記錄原始Y座標
      w: 140, // 選項方塊寬度
      h: 50,  // 選項方塊高度
      isDragging: false // 是否正在被拖曳的旗標
    };
    draggableOptions.push(opt); // 將選項加入陣列
  }

  // 設定上方放置答案的目標區域（Drop Zone）
  targetZone = {
    x: width / 2 - 160,
    y: height * 0.55,
    w: 320,
    h: 80
  };
}

// 繪製上方動態視覺區塊（用程式碼動態繪製，確保不會發生載入失敗）
function drawHeaderAnimation() {
  // 繪製上方標題文字
  fill(255);
  textSize(24);
  text("p5.js 互動式拖曳題測驗系統", width / 2, 35);

  // 繪製一個帶有動態發光與轉動效果的圖形來代替 GIF 動畫
  let boxSize = 80;
  let boxX = width / 2;
  let boxY = 95;

  push();
  translate(boxX, boxY);
  // 讓矩形隨著時間緩慢旋轉，製造動態效果
  rotate(frameCount * 0.02);
  
  noFill();
  stroke(100, 200, 255);
  strokeWeight(3);
  rectMode(CENTER);
  rect(0, 0, boxSize, boxSize, 10);
  pop();

  // 裝飾用小圓圈
  fill(255, 204, 0);
  noStroke();
  ellipse(width / 2, boxY, 15, 15);
}

// 繪製測驗主介面（題目、目標放置區、文字選項）
function drawQuizInterface() {
  // 繪製進度文字
  fill(200);
  textSize(16);
  text(`第 ${currentQuestionIndex + 1} 題 / 共 ${questions.length} 題`, width / 2, 175);

  // 繪製題目面板背景
  fill(50, 50, 70);
  noStroke();
  rectMode(CENTER);
  rect(width / 2, height * 0.38, width * 0.7, 70, 10);

  // 繪製題目文字
  fill(255);
  textSize(20);
  rectMode(CORNER); // 恢復預設模式
  text(questions[currentQuestionIndex].question, width / 2 - width * 0.33, height * 0.38 - 25, width * 0.66, 50);

  // 繪製答案放置目標區（Drop Zone）
  stroke(255, 204, 0);
  strokeWeight(3);
  // 如果有選項正在靠近或懸停，變更背景色提示
  if (draggedItem && isOverTarget(draggedItem)) {
    fill(70, 90, 50);
  } else {
    fill(40, 40, 60);
  }
  rect(targetZone.x, targetZone.y, targetZone.w, targetZone.h, 10);

  // 目標區提示文字
  noStroke();
  fill(200, 200, 100);
  textSize(16);
  text("請將正確答案拖曳至此框內", targetZone.x + targetZone.w / 2, targetZone.y + targetZone.h / 2);

  // 迴圈繪製下方 6 個拖曳選項
  for (let i = 0; i < draggableOptions.length; i++) {
    let opt = draggableOptions[i];

    // 如果選項正在被拖曳，跟隨滑鼠座標移動
    if (opt.isDragging) {
      opt.x = mouseX - opt.w / 2;
      opt.y = mouseY - opt.h / 2;
    }

    // 繪製選項卡片外框與背景
    stroke(100, 150, 255);
    strokeWeight(1);
    // 滑鼠懸停時改變顏色提供互動回饋
    if (isMouseOver(opt)) {
      fill(70, 130, 220);
    } else {
      fill(50, 80, 120);
    }
    rect(opt.x, opt.y, opt.w, opt.h, 8);

    // 繪製選項文字
    noStroke();
    fill(255);
    textSize(15);
    text(opt.text, opt.x + opt.w / 2, opt.y + opt.h / 2);
  }

  // 顯示即時回饋訊息（答對或答錯提示）
  if (feedbackMessage !== "") {
    fill(255, 100, 100);
    if (feedbackMessage.includes("正確")) {
      fill(100, 255, 100);
    }
    textSize(22);
    text(feedbackMessage, width / 2, height * 0.70);
    
    // 計時自動跳轉下一題
    if (millis() > feedbackTimer) {
      feedbackMessage = "";
      currentQuestionIndex++;
      if (currentQuestionIndex >= questions.length) {
        isQuizFinished = true; // 題目做完，進入結算畫面
      } else {
        initQuestion(currentQuestionIndex); // 載入下一題
      }
    }
  }
}

// 繪製測驗結束後的結算畫面
function drawResultScreen() {
  fill(50, 50, 80);
  stroke(100, 200, 255);
  strokeWeight(2);
  rectMode(CENTER);
  rect(width / 2, height / 2, 450, 250, 15);

  noStroke();
  fill(255);
  textSize(28);
  text("測驗結束！", width / 2, height / 2 - 60);

  textSize(20);
  text(`您的最終得分：${score} / ${questions.length}`, width / 2, height / 2 - 10);

  // 繪製重新開始按鈕
  fill(70, 180, 100);
  rect(width / 2 - 90, height / 2 + 40, 180, 45, 8);
  fill(255);
  textSize(16);
  text("再玩一次", width / 2, height / 2 + 62);
  rectMode(CORNER); // 恢復預設
}

// 滑鼠按下事件：當使用者點擊畫面時觸發
function mousePressed() {
  // 如果測驗已結束，點擊「再玩一次」按鈕重新開始
  if (isQuizFinished) {
    let btnX = width / 2 - 90;
    let btnY = height / 2 + 40;
    let btnW = 180;
    let btnH = 45;
    if (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
      currentQuestionIndex = 0;
      score = 0;
      isQuizFinished = false;
      initQuestion(currentQuestionIndex);
    }
    return;
  }

  // 如果目前已經顯示回饋訊息，鎖定滑鼠避免重複點擊
  if (feedbackMessage !== "") return;

  // 檢查是否點擊了任何一個下方選項
  for (let i = 0; i < draggableOptions.length; i++) {
    let opt = draggableOptions[i];
    if (isMouseOver(opt)) {
      opt.isDragging = true; // 標記該選項為拖曳中
      draggedItem = opt;     // 記錄當前被拖曳的物件
      break;
    }
  }
}

// 滑鼠放開事件：當使用者鬆開滑鼠時觸發
function mouseReleased() {
  if (draggedItem) {
    draggedItem.isDragging = false; // 取消拖曳狀態

    // 檢查是否放在目標答案區塊內
    if (isOverTarget(draggedItem)) {
      let currentQ = questions[currentQuestionIndex];
      
      // 判斷放下的選項是否為正確答案
      if (draggedItem.index === currentQ.correct) {
        feedbackMessage = "答對了！太棒了！";
        score++; // 分數加一
      } else {
        feedbackMessage = `答錯了！正確答案是：${currentQ.options[currentQ.correct]}`;
      }
      // 設定 1.8 秒後自動進入下一題
      feedbackTimer = millis() + 1800;
    } else {
      // 如果沒有放在目標區內，將選項滑回原位
      draggedItem.x = draggedItem.baseX;
      draggedItem.y = draggedItem.baseY;
    }

    draggedItem = null; // 清空當前拖曳物件記錄
  }
}

// 輔助函式：檢查滑鼠是否在指定選項範圍內
function isMouseOver(opt) {
  return mouseX >= opt.x && mouseX <= opt.x + opt.w && mouseY >= opt.y && mouseY <= opt.y + opt.h;
}

// 輔助函式：檢查選項是否被拖曳放置在目標答案區域內
function isOverTarget(opt) {
  let optCenterX = opt.x + opt.w / 2;
  let optCenterY = opt.y + opt.h / 2;
  return (
    optCenterX >= targetZone.x &&
    optCenterX <= targetZone.x + targetZone.w &&
    optCenterY >= targetZone.y &&
    optCenterY <= targetZone.y + targetZone.h
  );
}

// 視窗大小改變事件：支援響應式網頁，當瀏覽器視窗大小改變時自動調整畫布與元件位置
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!isQuizFinished) {
    initQuestion(currentQuestionIndex); // 重新計算當前題目的排版與座標
  }
}