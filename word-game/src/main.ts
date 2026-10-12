import { Application } from 'pixi.js';
import { levels } from './data/levels';
import { SceneRenderer } from './scenes/SceneRenderer';
import type { GameState, Level, Question } from './types';
import orchardTreeUrl from '../树-removebg-preview.png';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

const app = new Application();
const scene = new SceneRenderer();
const state: GameState = {
  levelIndex: 0,
  questionIndex: 0,
  questions: [],
  unlocked: new Set(),
  completedLevels: new Set(),
  sound: true,
  score: 0,
  streak: 0,
};

let placed: Array<string | null> = [];
let checking = false;
let selectedPart: string | null = null;
let currentParts: string[] = [];
let advanceTimer: number | undefined;
let answerTimer: number | undefined;
let feedbackTimer: number | undefined;
let audioContext: AudioContext | undefined;
let classroomPlaced: Array<Array<string | null>> = [];
let classroomParts: string[][] = [];
let shopPlaced: Array<Array<string | null>> = [];
let shopParts: string[][] = [];
let shopAnimationTimer: number | undefined;

root.innerHTML = `
  <div class="game-shell" id="gameShell">
    <img class="scene-tree-image" src="${orchardTreeUrl}" alt="" aria-hidden="true">
    <div class="scene-canvas" id="sceneCanvas"></div>
    <main class="game-ui" id="gameUi">
      <div class="topbar">
        <button class="back-button" id="backButton" type="button">← 关卡地图</button>
        <button class="icon-button" id="soundButton" type="button" aria-label="切换声音">🔊</button>
      </div>
      <section class="classroom-board" id="classroomBoard" aria-label="学习用品识字黑板">
        <div class="classroom-board-header">
          <div>
            <span class="classroom-kicker">学习教室</span>
            <h1>黑板识字挑战</h1>
          </div>
          <div class="classroom-score" id="classroomScore">得分 0</div>
        </div>
        <p class="classroom-instruction">看图片，把部件拼成汉字</p>
        <div class="classroom-grid" id="classroomGrid"></div>
        <div class="classroom-progress" id="classroomProgress"></div>
      </section>
      <section class="shop-board" id="shopBoard" aria-label="快乐商店">
        <aside class="cart-panel">
          <div class="cart-heading">
            <span class="cart-icon">🛒</span>
            <div>
              <span class="classroom-kicker">购物任务</span>
              <h1>我的购物车</h1>
            </div>
          </div>
          <div class="cart-score" id="shopScore">得分 0</div>
          <div class="cart-items" id="cartItems"></div>
          <div class="cart-status" id="cartStatus">完成商品拼字，就能放进购物车</div>
        </aside>
        <section class="shop-shelf">
          <div class="shop-heading">
            <div>
              <span class="classroom-kicker">快乐商店</span>
              <h1>选商品，拼汉字</h1>
            </div>
            <span class="shop-progress" id="shopProgress"></span>
          </div>
          <div class="shop-product-grid" id="shopProductGrid"></div>
        </section>
      </section>
      <section class="question-card">
        <h1 class="question-char" id="questionChar"></h1>
        <div class="question-meta"><span class="pinyin" id="questionPinyin"></span><span id="questionMeaning"></span></div>
        <div class="progress" id="progress"></div>
      </section>
      <section class="play-area">
        <div class="build-box" id="buildBox"></div>
      </section>
      <p class="hint" id="hint"></p>
      <div class="success-toast" id="successToast">🎉 拼对了！真棒！</div>
      <section class="parts-card">
        <p class="parts-label">拖动部件，放进上方的格子</p>
        <div class="parts-list" id="partsList"></div>
      </section>
    </main>
    <section class="feedback" id="feedback">
      <div class="feedback-panel">
        <div class="feedback-icon" id="feedbackIcon">✨</div>
        <h2 class="feedback-title" id="feedbackTitle"></h2>
        <div class="feedback-word" id="feedbackWord"></div>
        <p class="feedback-meaning" id="feedbackMeaning"></p>
        <button class="primary-button" id="nextButton" type="button"></button>
      </div>
    </section>
    <section class="map-overlay show" id="mapOverlay">
      <div class="map-book">
        <h2 class="map-title">📖 汉字乐园</h2>
        <p class="map-sub">选择一个场景开始学习，所有关卡已开放</p>
        <div class="map-grid" id="mapGrid"></div>
      </div>
    </section>
  </div>
`;

const sceneCanvas = get<HTMLDivElement>('sceneCanvas');
await app.init({ resizeTo: window, backgroundAlpha: 0, antialias: true });
sceneCanvas.appendChild(app.canvas);
app.stage.addChild(scene.root);
scene.resize(window.innerWidth, window.innerHeight);
app.ticker.add(() => scene.tick(app.ticker.deltaMS));
window.addEventListener('resize', () => scene.resize(window.innerWidth, window.innerHeight));

function get<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

function currentLevel(): Level {
  return levels[state.levelIndex];
}

function currentQuestion(): Question {
  return state.questions[state.questionIndex];
}

function startLevel(index: number): void {
  if (advanceTimer) window.clearTimeout(advanceTimer);
  if (answerTimer) window.clearTimeout(answerTimer);
  if (feedbackTimer) window.clearTimeout(feedbackTimer);
  if (shopAnimationTimer) window.clearTimeout(shopAnimationTimer);
  state.levelIndex = index;
  state.questionIndex = 0;
  const questionLimit = currentLevel().id === 'shop' ? 9 : 8;
  state.questions = [...currentLevel().questions].sort(() => Math.random() - 0.5).slice(0, questionLimit);
  state.unlocked.clear();
  state.score = 0;
  state.streak = 0;
  classroomPlaced = [];
  classroomParts = [];
  shopPlaced = [];
  shopParts = [];
  placed = [];
  checking = false;
  selectedPart = null;
  get('mapOverlay').classList.remove('show');
  get('gameShell').classList.toggle('orchard-scene', currentLevel().id === 'orchard');
  get('gameUi').classList.toggle('orchard-ui', currentLevel().id === 'orchard');
  get('gameUi').classList.toggle('classroom-ui', currentLevel().id === 'classroom');
  get('gameUi').classList.toggle('shop-ui', currentLevel().id === 'shop');
  scene.setLevel(currentLevel());
  renderQuestion();
}

function renderQuestion(): void {
  const question = currentQuestion();
  if (!question) return;
  if (currentLevel().id === 'classroom') {
    renderClassroomBoard();
    scene.showQuestion(question, state.questionIndex, state.unlocked, state.questions);
    return;
  }
  if (currentLevel().id === 'shop') {
    renderShopBoard();
    scene.showQuestion(question, state.questionIndex, state.unlocked, state.questions);
    return;
  }
  placed = question.parts.map(() => null);
  currentParts = [...question.parts].sort(() => Math.random() - 0.5);
  checking = false;
  selectedPart = null;
  get('questionChar').textContent = question.word;
  get('questionPinyin').textContent = question.wordPinyin;
  get('questionMeaning').textContent = `${question.fullWord} · ${question.fruitEmoji ?? question.fruit}`;
  get('progress').textContent = `${currentLevel().name} · 第 ${state.questionIndex + 1} / ${state.questions.length} 题`;
  get('hint').textContent = '拖动部件到上方格子，拼出汉字';
  renderBuildBox();
  renderParts();
  scene.showQuestion(question, state.questionIndex, state.unlocked, state.questions);
}

function renderClassroomBoard(): void {
  if (classroomPlaced.length !== state.questions.length) {
    classroomPlaced = state.questions.map((question) => question.parts.map(() => null));
    classroomParts = state.questions.map((question) => [...question.parts].sort(() => Math.random() - 0.5));
  }
  const grid = get<HTMLDivElement>('classroomGrid');
  grid.innerHTML = '';
  state.questions.forEach((question, cardIndex) => {
    const card = document.createElement('article');
    const solved = state.unlocked.has(cardIndex);
    const active = cardIndex === state.unlocked.size;
    const locked = !solved && !active;
    card.className = `classroom-card${solved ? ' solved' : ''}${locked ? ' locked' : ''}${active ? ' active' : ''}`;
    card.dataset.cardIndex = String(cardIndex);
    const picture = question.word === '粉'
      ? '<span class="classroom-chalk" aria-label="白色粉笔"></span>'
      : `<span class="classroom-emoji">${question.fruitEmoji ?? question.fruit}</span>`;
    card.innerHTML = `
      <div class="classroom-picture" aria-label="${question.fullWord}">
        ${picture}
        <span class="classroom-word">${question.fullWord}</span>
      </div>
      <div class="classroom-slots${question.layout === 'vertical' ? ' vertical' : ''}" data-slots="${cardIndex}"></div>
      <div class="classroom-parts" data-parts="${cardIndex}"></div>
      ${locked ? '<span class="classroom-lock">🔒 请按顺序解锁</span>' : ''}
    `;
    const slots = card.querySelector<HTMLDivElement>('.classroom-slots');
    const parts = card.querySelector<HTMLDivElement>('.classroom-parts');
    if (!slots || !parts) return;
    question.parts.forEach((_, slotIndex) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = `classroom-slot${classroomPlaced[cardIndex][slotIndex] ? ' filled' : ''}`;
      slot.disabled = solved || locked;
      slot.textContent = classroomPlaced[cardIndex][slotIndex] ?? '';
      slot.addEventListener('dragover', (event) => {
        if (solved || locked || checking || classroomPlaced[cardIndex][slotIndex]) return;
        event.preventDefault();
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', (event) => {
        event.preventDefault();
        slot.classList.remove('drag-over');
        const part = event.dataTransfer?.getData('text/plain');
        if (part) placeClassroomPart(cardIndex, slotIndex, part);
      });
      slots.appendChild(slot);
    });
    classroomParts[cardIndex].forEach((part) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `classroom-part${classroomPlaced[cardIndex].includes(part) ? ' used' : ''}`;
      button.disabled = solved || locked;
      button.textContent = part;
      button.draggable = true;
      button.addEventListener('click', () => {
        const firstEmpty = classroomPlaced[cardIndex].findIndex((value) => !value);
        if (firstEmpty >= 0) placeClassroomPart(cardIndex, firstEmpty, part);
      });
      button.addEventListener('dragstart', (event) => {
        if (solved || locked || checking || classroomPlaced[cardIndex].includes(part)) {
          event.preventDefault();
          return;
        }
        event.dataTransfer?.setData('text/plain', part);
        button.classList.add('dragging');
      });
      button.addEventListener('dragend', () => button.classList.remove('dragging'));
      parts.appendChild(button);
    });
    grid.appendChild(card);
  });
  get('classroomScore').textContent = `得分 ${state.score}`;
  const solvedCount = state.unlocked.size;
  get('classroomProgress').textContent = `${solvedCount} / ${state.questions.length} 个学习用品已点亮`;
}

function placeClassroomPart(cardIndex: number, slotIndex: number, part: string): void {
  if (checking || state.unlocked.has(cardIndex) || cardIndex !== state.unlocked.size) return;
  const question = state.questions[cardIndex];
  const placedForCard = classroomPlaced[cardIndex];
  if (!question || placedForCard[slotIndex] || placedForCard.includes(part) || !question.parts.includes(part)) return;
  placedForCard[slotIndex] = part;
  renderClassroomBoard();
  if (placedForCard.length === question.parts.length && placedForCard.every(Boolean)) {
    window.setTimeout(() => checkClassroomAnswer(cardIndex), 180);
  }
}

function checkClassroomAnswer(cardIndex: number): void {
  if (checking || state.unlocked.has(cardIndex)) return;
  const question = state.questions[cardIndex];
  const placedForCard = classroomPlaced[cardIndex];
  const card = document.querySelector<HTMLElement>(`.classroom-card[data-card-index="${cardIndex}"]`);
  if (!question || !card) return;
  checking = true;
  const correct = placedForCard.every((part, index) => part === question.parts[index]);
  card.querySelectorAll<HTMLButtonElement>('.classroom-slot').forEach((slot, index) => {
    slot.classList.add(placedForCard[index] === question.parts[index] ? 'correct' : 'wrong');
  });
  if (correct) {
    state.unlocked.add(cardIndex);
    state.streak += 1;
    state.score += 10 + (state.streak % 3 === 0 ? 5 : 0);
    scene.playCorrect(question, cardIndex);
    playTone(523, .14);
    speak(question.fullWord);
    get('hint').textContent = `答对了！${question.word} 是 ${question.fullWord}`;
    showClassroomToast(state.streak % 3 === 0 ? '连对三题，奖励 +5 分！' : '+10 分！');
    checking = false;
    renderClassroomBoard();
    if (state.unlocked.size === state.questions.length) {
      window.setTimeout(showClassroomComplete, 700);
    }
  } else {
    state.streak = 0;
    playTone(294, .18, 'triangle', .13);
    get('hint').textContent = '顺序还不对，再试一次';
    window.setTimeout(() => {
      classroomPlaced[cardIndex] = placedForCard.map((part, index) => part === question.parts[index] ? part : null);
      checking = false;
      renderClassroomBoard();
    }, 700);
  }
}

function showClassroomToast(message: string): void {
  const toast = get('successToast');
  toast.textContent = `🎉 ${message}`;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
}

function showClassroomComplete(): void {
  const feedback = get('feedback');
  get('feedbackIcon').textContent = '🏆';
  get('feedbackTitle').textContent = '识字挑战完成！';
  get('feedbackWord').textContent = `${state.score} 分`;
  get('feedbackMeaning').textContent = state.score >= 90 ? '你是识字小能手！' : '继续练习，你会越来越棒！';
  get('nextButton').textContent = '返回地图';
  feedback.classList.add('show');
}

function renderShopBoard(): void {
  if (shopPlaced.length !== state.questions.length) {
    shopPlaced = state.questions.map((question) => question.parts.map(() => null));
    shopParts = state.questions.map((question) => [...question.parts].sort(() => Math.random() - 0.5));
  }
  const grid = get<HTMLDivElement>('shopProductGrid');
  const cart = get<HTMLDivElement>('cartItems');
  grid.innerHTML = '';
  cart.innerHTML = '';
  state.questions.forEach((question, productIndex) => {
    const solved = state.unlocked.has(productIndex);
    const active = productIndex === state.unlocked.size;
    const locked = !solved && !active;
    const card = document.createElement('article');
    card.className = `shop-product${solved ? ' solved' : ''}${active ? ' active' : ''}${locked ? ' locked' : ''}`;
    card.dataset.productIndex = String(productIndex);
    card.innerHTML = `
      <div class="shop-product-image"><span>${question.fruitEmoji ?? question.fruit}</span><strong>${question.fullWord}</strong></div>
      <div class="shop-slots${question.layout === 'vertical' ? ' vertical' : ''}"></div>
      <div class="shop-parts"></div>
      ${locked ? '<small class="shop-lock">🔒 等待前一个商品</small>' : ''}
    `;
    const slots = card.querySelector<HTMLDivElement>('.shop-slots');
    const parts = card.querySelector<HTMLDivElement>('.shop-parts');
    if (!slots || !parts) return;
    question.parts.forEach((_, slotIndex) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.disabled = solved || locked;
      slot.className = `shop-slot${shopPlaced[productIndex][slotIndex] ? ' filled' : ''}`;
      slot.textContent = shopPlaced[productIndex][slotIndex] ?? '';
      slot.addEventListener('dragover', (event) => {
        if (solved || locked || checking || shopPlaced[productIndex][slotIndex]) return;
        event.preventDefault();
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', (event) => {
        event.preventDefault();
        slot.classList.remove('drag-over');
        const part = event.dataTransfer?.getData('text/plain');
        if (part) placeShopPart(productIndex, slotIndex, part);
      });
      slots.appendChild(slot);
    });
    shopParts[productIndex].forEach((part) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = solved || locked;
      button.className = `shop-part${shopPlaced[productIndex].includes(part) ? ' used' : ''}`;
      button.textContent = part;
      button.draggable = true;
      button.addEventListener('click', () => {
        const firstEmpty = shopPlaced[productIndex].findIndex((value) => !value);
        if (firstEmpty >= 0) placeShopPart(productIndex, firstEmpty, part);
      });
      button.addEventListener('dragstart', (event) => {
        if (solved || locked || checking || shopPlaced[productIndex].includes(part)) {
          event.preventDefault();
          return;
        }
        event.dataTransfer?.setData('text/plain', part);
        button.classList.add('dragging');
      });
      button.addEventListener('dragend', () => button.classList.remove('dragging'));
      parts.appendChild(button);
    });
    grid.appendChild(card);
    if (solved) {
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `<span>${question.fruitEmoji ?? question.fruit}</span><small>${question.word}</small>`;
      cart.appendChild(cartItem);
    }
  });
  get('shopScore').textContent = `得分 ${state.score}`;
  get('shopProgress').textContent = `${state.unlocked.size} / ${state.questions.length}`;
  get('cartStatus').textContent = state.unlocked.size === state.questions.length
    ? '购物完成！购物车装满啦！'
    : `还差 ${state.questions.length - state.unlocked.size} 件商品`;
}

function placeShopPart(productIndex: number, slotIndex: number, part: string): void {
  if (checking || state.unlocked.has(productIndex) || productIndex !== state.unlocked.size) return;
  const question = state.questions[productIndex];
  const placedForProduct = shopPlaced[productIndex];
  if (!question || placedForProduct[slotIndex] || placedForProduct.includes(part) || !question.parts.includes(part)) return;
  placedForProduct[slotIndex] = part;
  renderShopBoard();
  if (placedForProduct.length === question.parts.length && placedForProduct.every(Boolean)) {
    window.setTimeout(() => checkShopAnswer(productIndex), 180);
  }
}

function checkShopAnswer(productIndex: number): void {
  if (checking || state.unlocked.has(productIndex)) return;
  const question = state.questions[productIndex];
  const placedForProduct = shopPlaced[productIndex];
  const card = document.querySelector<HTMLElement>(`.shop-product[data-product-index="${productIndex}"]`);
  if (!question || !card) return;
  checking = true;
  const correct = placedForProduct.every((part, index) => part === question.parts[index]);
  card.querySelectorAll<HTMLButtonElement>('.shop-slot').forEach((slot, index) => {
    slot.classList.add(placedForProduct[index] === question.parts[index] ? 'correct' : 'wrong');
  });
  if (correct) {
    state.unlocked.add(productIndex);
    state.streak += 1;
    state.score += 10 + (state.streak % 3 === 0 ? 5 : 0);
    scene.playCorrect(question, productIndex);
    playTone(523, .14);
    speak(question.fullWord);
    showShopToast(state.streak % 3 === 0 ? '连买三件，奖励 +5 分！' : '商品已放入购物车！');
    animateShopItemToCart(productIndex, question, () => {
      if (get('mapOverlay').classList.contains('show')) return;
      checking = false;
      renderShopBoard();
      if (state.unlocked.size === state.questions.length) {
        window.setTimeout(showShopComplete, 500);
      }
    });
  } else {
    state.streak = 0;
    playTone(294, .18, 'triangle', .13);
    get('cartStatus').textContent = '部件顺序还不对，再试一次';
    window.setTimeout(() => {
      shopPlaced[productIndex] = placedForProduct.map((part, index) => part === question.parts[index] ? part : null);
      checking = false;
      renderShopBoard();
    }, 700);
  }
}

function animateShopItemToCart(productIndex: number, question: Question, onComplete: () => void): void {
  const source = document.querySelector<HTMLElement>(`.shop-product[data-product-index="${productIndex}"] .shop-product-image > span`);
  const cart = get('cartItems');
  if (!source) {
    onComplete();
    return;
  }
  const sourceRect = source.getBoundingClientRect();
  const cartRect = cart.getBoundingClientRect();
  const flying = document.createElement('span');
  flying.className = 'shop-flying-item';
  flying.textContent = question.fruitEmoji ?? question.fruit;
  flying.setAttribute('aria-hidden', 'true');
  flying.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
  flying.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
  flying.style.setProperty('--shop-fly-x', `${cartRect.left + cartRect.width / 2 - sourceRect.left - sourceRect.width / 2}px`);
  flying.style.setProperty('--shop-fly-y', `${cartRect.top + Math.min(60, cartRect.height * .35) - sourceRect.top - sourceRect.height / 2}px`);
  document.body.appendChild(flying);
  requestAnimationFrame(() => flying.classList.add('fly'));
  shopAnimationTimer = window.setTimeout(() => {
    shopAnimationTimer = undefined;
    flying.remove();
    cart.classList.remove('cart-catching');
    void cart.offsetWidth;
    cart.classList.add('cart-catching');
    onComplete();
  }, 900);
}

function showShopToast(message: string): void {
  const toast = get('successToast');
  toast.textContent = `🛒 ${message}`;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
}

function showShopComplete(): void {
  get('feedbackIcon').textContent = '🛒';
  get('feedbackTitle').textContent = '购物任务完成！';
  get('feedbackWord').textContent = `${state.score} 分`;
  get('feedbackMeaning').textContent = '购物车已经装满啦！';
  get('nextButton').textContent = '返回地图';
  get('feedback').classList.add('show');
}

function renderBuildBox(): void {
  const box = get<HTMLDivElement>('buildBox');
  box.className = `build-box${currentQuestion().layout === 'vertical' ? ' vertical' : ''}`;
  box.innerHTML = '';
  placed.forEach((part, index) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `build-slot${part ? ' filled' : ''}`;
    slot.dataset.index = String(index);
    slot.textContent = part ?? '';
    slot.addEventListener('dragover', (event) => {
      if (checking || part) return;
      event.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', (event) => {
      event.preventDefault();
      slot.classList.remove('drag-over');
      const draggedPart = event.dataTransfer?.getData('text/plain') || selectedPart;
      if (draggedPart) placePart(index, draggedPart);
    });
    slot.addEventListener('click', () => placeSelected(index));
    box.appendChild(slot);
  });
}

function renderParts(): void {
  const list = get<HTMLDivElement>('partsList');
  list.innerHTML = '';
  currentParts.forEach((part, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `part${placed.includes(part) ? ' used' : ''}`;
    button.textContent = part;
    button.draggable = true;
    button.dataset.partIndex = String(index);
    button.addEventListener('click', () => {
      if (!placed.includes(part)) selectedPart = part;
      get('hint').textContent = `已选择「${part}」，请选择上方格子`;
    });
    button.addEventListener('dragstart', (event) => {
      if (placed.includes(part) || checking) {
        event.preventDefault();
        return;
      }
      selectedPart = part;
      playTone(880, .05);
      button.classList.add('dragging');
      event.dataTransfer?.setData('text/plain', part);
    });
    button.addEventListener('dragend', () => {
      button.classList.remove('dragging');
      document.querySelectorAll('.drag-over').forEach((element) => element.classList.remove('drag-over'));
      selectedPart = null;
    });
    list.appendChild(button);
  });
}

function placeSelected(slotIndex: number): void {
  if (selectedPart) placePart(slotIndex, selectedPart);
}

function placePart(slotIndex: number, part: string): void {
  if (checking || placed[slotIndex] || placed.includes(part) || !currentQuestion().parts.includes(part)) return;
  placed[slotIndex] = part;
  selectedPart = null;
  renderBuildBox();
  renderParts();
  if (placed.every(Boolean)) answerTimer = window.setTimeout(checkAnswer, 250);
}

function checkAnswer(): void {
  if (checking) return;
  answerTimer = undefined;
  checking = true;
  const question = currentQuestion();
  const correct = placed.every((part, index) => part === question.parts[index]);
  document.querySelectorAll<HTMLButtonElement>('.build-slot').forEach((slot, index) => {
    slot.classList.add(placed[index] === question.parts[index] ? 'correct' : 'wrong');
  });
  if (correct) completeQuestion();
  else {
    playTone(294, .18, 'triangle', .13);
    get('hint').textContent = '顺序还不对，再试一次';
    window.setTimeout(() => {
      placed = placed.map((part, index) => part === question.parts[index] ? part : null);
      checking = false;
      renderBuildBox();
      renderParts();
      get('hint').textContent = '拖动部件到上方格子，拼出汉字';
    }, 700);
  }
}

function completeQuestion(): void {
  const question = currentQuestion();
  playTone(523, .14);
  window.setTimeout(() => playTone(659, .18), 100);
  window.setTimeout(() => playTone(784, .22), 220);
  state.unlocked.add(state.questionIndex);
  scene.playCorrect(question, state.questionIndex);
  const toast = get('successToast');
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  get('hint').textContent = '拼对了！听一听这个字，再看它的词语';
  const levelAtAnswer = state.levelIndex;
  const questionAtAnswer = state.questionIndex;
  feedbackTimer = window.setTimeout(() => {
    feedbackTimer = undefined;
    if (state.levelIndex !== levelAtAnswer || state.questionIndex !== questionAtAnswer) return;
    get('feedbackIcon').textContent = question.fruitEmoji ?? question.fruit;
    get('feedbackTitle').textContent = state.questionIndex === state.questions.length - 1 ? '这一关完成啦！' : '拼对了！';
    get('feedbackWord').textContent = question.fullWord;
    get('feedbackMeaning').textContent = `${question.word} · ${question.fullPinyin}`;
    get('nextButton').textContent = state.questionIndex === state.questions.length - 1 ? '返回地图' : '下一题';
    get('feedback').classList.add('show');
    speak(question.fullWord);
    advanceTimer = window.setTimeout(() => {
      if (checking) nextQuestion();
    }, 2000);
  }, 900);
}

function nextQuestion(): void {
  if (answerTimer) {
    window.clearTimeout(answerTimer);
    answerTimer = undefined;
  }
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = undefined;
  }
  if (advanceTimer) {
    window.clearTimeout(advanceTimer);
    advanceTimer = undefined;
  }
  get('feedback').classList.remove('show');
  if (currentLevel().id === 'classroom') {
    state.completedLevels.add(state.levelIndex);
    openMap();
    return;
  }
  if (currentLevel().id === 'shop') {
    state.completedLevels.add(state.levelIndex);
    openMap();
    return;
  }
  if (state.questionIndex === state.questions.length - 1) {
    state.completedLevels.add(state.levelIndex);
    scene.playComplete();
    advanceTimer = window.setTimeout(() => {
      advanceTimer = undefined;
      openMap();
    }, 1200);
    return;
  }
  state.questionIndex += 1;
  renderQuestion();
}

function openMap(): void {
  if (advanceTimer) {
    window.clearTimeout(advanceTimer);
    advanceTimer = undefined;
  }
  if (answerTimer) {
    window.clearTimeout(answerTimer);
    answerTimer = undefined;
  }
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = undefined;
  }
  checking = false;
  scene.cancelAnimations();
  get('feedback').classList.remove('show');
  renderMap();
  get('mapOverlay').classList.add('show');
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = .1): void {
  if (!state.sound) return;
  audioContext ??= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration);
}

function renderMap(): void {
  const grid = get<HTMLDivElement>('mapGrid');
  grid.innerHTML = '';
  levels.forEach((level, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'map-card';
    card.innerHTML = `<div class="map-icon">${level.icon}</div><div class="map-name">${level.name}</div><div class="map-desc">${level.description}</div><span class="map-badge">${state.completedLevels.has(index) ? '⭐ 已完成' : '▶ 开始学习'}</span>`;
    card.addEventListener('click', () => startLevel(index));
    grid.appendChild(card);
  });
}

function speak(text: string): void {
  if (!state.sound || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.82;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

get('nextButton').addEventListener('click', nextQuestion);
get('backButton').addEventListener('click', openMap);
get('soundButton').addEventListener('click', () => {
  state.sound = !state.sound;
  get('soundButton').textContent = state.sound ? '🔊' : '🔇';
});

renderMap();
