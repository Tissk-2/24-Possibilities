// UI Management
function showView(viewName) {
    const views = document.querySelectorAll('.view-section');
    let activeViews = Array.from(views).filter(v => v.classList.contains('view-visible'));
    
    if (activeViews.length > 0) {
        activeViews.forEach(v => v.classList.remove('view-visible'));
        setTimeout(() => {
            activeViews.forEach(v => v.classList.remove('view-active'));
            showNewView(viewName);
        }, 300);
    } else {
        showNewView(viewName);
    }

    if (viewName === 'game') {
        document.getElementById('app-header').style.display = 'block';
    } else {
        document.getElementById('app-header').style.display = 'none';
    }
}

function showNewView(viewName) {
    const newView = document.getElementById(`view-${viewName}`);
    if (newView) {
        newView.classList.add('view-active');
        setTimeout(() => {
            newView.classList.add('view-visible');
        }, 20);
    }
}

function showToast(msg, type='error') {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => { t.remove(); }, 3000);
}

// State
let state = {
    streak: 0,
    numbers: [],
    equationTokens: [], // Array of objects {type: 'num'|'op'|'paren', val: str, id: num_id}
    startTime: 0,
    timerInt: null,
    currentSolution: null
};



// Formatting
function formatTime(ms) {
    let s = Math.floor(ms / 1000);
    let m = Math.floor(s / 60);
    s = s % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTimer() {
    if (state.startTime > 0) {
        let elapsed = Date.now() - state.startTime;
        document.getElementById('mobile-time').innerText = formatTime(elapsed);
    }
}

function updateStreak(s) {
    state.streak = s;
    document.getElementById('mobile-streak').innerText = s;
}

// Math Solver
function solve24(arr) {
    if (arr.length === 1) {
        return Math.abs(arr[0].val - 24) < 1e-6 ? arr[0].expr : null;
    }
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
            if (i === j) continue;
            let next = [];
            for (let k = 0; k < arr.length; k++) {
                if (k !== i && k !== j) next.push(arr[k]);
            }
            let a = arr[i], b = arr[j];
            let ops = [
                {val: a.val + b.val, expr: `(${a.expr}+${b.expr})`},
                {val: a.val - b.val, expr: `(${a.expr}-${b.expr})`},
                {val: b.val - a.val, expr: `(${b.expr}-${a.expr})`},
                {val: a.val * b.val, expr: `(${a.expr}*${b.expr})`}
            ];
            if (Math.abs(b.val) > 1e-6) ops.push({val: a.val / b.val, expr: `(${a.expr}/${b.expr})`});
            if (Math.abs(a.val) > 1e-6) ops.push({val: b.val / a.val, expr: `(${b.expr}/${a.expr})`});
            
            for (let op of ops) {
                next.push(op);
                let res = solve24(next);
                if (res) return res;
                next.pop();
            }
        }
    }
    return null;
}

function generateHand() {
    while (true) {
        let nums = [];
        let solveArr = [];
        for (let i = 0; i < 4; i++) {
            let n = Math.floor(Math.random() * 9) + 1; // 1 to 9
            nums.push(n);
            solveArr.push({val: n, expr: n.toString()});
        }
        let solution = solve24(solveArr);
        if (solution) {
            return { numbers: nums, solution: solution };
        }
    }
}

// Game Loop
function startGame() {
    let hand = generateHand();
    state.numbers = hand.numbers.map((val, idx) => ({id: idx, val, used: false}));
    state.currentSolution = hand.solution;
    state.equationTokens = [];
    state.startTime = Date.now();
    
    if (state.timerInt) clearInterval(state.timerInt);
    state.timerInt = setInterval(updateTimer, 1000);
    
    renderBoard();
    showView('game');
}

function renderBoard() {
    // Numbers
    const cards = document.getElementById('number-cards');
    cards.innerHTML = '';
    state.numbers.forEach(n => {
        const btn = document.createElement('button');
        btn.className = `bg-white border border-app-border rounded-xl aspect-[4/3] flex items-center justify-center hover:bg-app-bg shadow-sm transition-all ${n.used ? 'used-card' : 'active:scale-95 cursor-pointer'}`;
        btn.innerHTML = `<span class="font-mono text-app-text text-3xl font-bold">${n.val}</span>`;
        if (!n.used) {
            btn.onclick = () => addNum(n.id);
        }
        cards.appendChild(btn);
    });
    
    // Equation
    const display = document.getElementById('equation-display');
    display.innerHTML = state.equationTokens.map(t => {
        let txt = t.val;
        if (txt === '*') txt = '×';
        if (txt === '/') txt = '÷';
        return txt;
    }).join(' ');

    // Live Result
    const liveResult = document.getElementById('live-result');
    if (state.equationTokens.length > 0) {
        const eqStr = state.equationTokens.map(t => t.val).join('');
        let balance = 0;
        let validParens = true;
        for(let t of state.equationTokens) {
            if(t.val === '(') balance++;
            if(t.val === ')') balance--;
            if(balance < 0) validParens = false;
        }
        
        const last = state.equationTokens[state.equationTokens.length - 1];
        if (last && (last.type === 'num' || last.val === ')') && validParens && balance === 0) {
            try {
                const result = new Function('return ' + eqStr)();
                if (Number.isFinite(result)) {
                    let fmtRes = Math.abs(result % 1) < 1e-6 ? Math.round(result) : parseFloat(result.toFixed(2));
                    liveResult.innerText = `= ${fmtRes}`;
                } else {
                    liveResult.innerText = '';
                }
            } catch (e) {
                liveResult.innerText = '';
            }
        } else {
            liveResult.innerText = '';
        }
    } else {
        liveResult.innerText = '';
    }
}

function addNum(id) {
    let n = state.numbers.find(x => x.id === id);
    if (!n || n.used) return;
    
    // Check if valid
    const last = state.equationTokens[state.equationTokens.length - 1];
    if (last && (last.type === 'num' || last.val === ')')) {
        showToast("Cannot place a number here");
        return;
    }
    
    n.used = true;
    state.equationTokens.push({type: 'num', val: n.val, id: n.id});
    renderBoard();
}

function addOp(op) {
    const last = state.equationTokens[state.equationTokens.length - 1];
    if (!last || last.type === 'op' || last.val === '(') {
        showToast("Cannot place an operator here");
        return;
    }
    state.equationTokens.push({type: 'op', val: op});
    renderBoard();
}

function addParen(p) {
    const last = state.equationTokens[state.equationTokens.length - 1];
    if (p === '(') {
        if (last && (last.type === 'num' || last.val === ')')) {
            showToast("Cannot place '(' here");
            return;
        }
    } else {
        if (!last || last.type === 'op' || last.val === '(') {
            showToast("Cannot place ')' here");
            return;
        }
    }
    state.equationTokens.push({type: 'paren', val: p});
    renderBoard();
}

function undo() {
    if (state.equationTokens.length === 0) return;
    const popped = state.equationTokens.pop();
    if (popped.type === 'num') {
        let n = state.numbers.find(x => x.id === popped.id);
        n.used = false;
    }
    renderBoard();
}

function clearEq() {
    state.equationTokens = [];
    state.numbers.forEach(n => n.used = false);
    renderBoard();
}

function useHint() {
    const modal = document.getElementById('confirm-modal');
    const content = document.getElementById('confirm-modal-content');
    modal.classList.remove('hidden');
    // slight delay to allow display block to apply before opacity transition
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    const content = document.getElementById('confirm-modal-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function showTutorial() {
    const modal = document.getElementById('tutorial-modal');
    const content = document.getElementById('tutorial-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
}

function closeTutorial() {
    const modal = document.getElementById('tutorial-modal');
    const content = document.getElementById('tutorial-modal-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function setTutorialLang(lang) {
    const enBtn = document.getElementById('lang-en');
    const idBtn = document.getElementById('lang-id');
    const enContent = document.getElementById('tutorial-en');
    const idContent = document.getElementById('tutorial-id');
    const title = document.getElementById('tutorial-title');
    const closeBtn = document.getElementById('tutorial-btn');

    if (lang === 'en') {
        enBtn.className = 'px-3 py-1 rounded-md text-xs font-bold transition-all bg-white shadow-sm text-app-primary';
        idBtn.className = 'px-3 py-1 rounded-md text-xs font-bold transition-all text-app-subtext hover:text-app-primary';
        enContent.classList.remove('hidden');
        idContent.classList.add('hidden');
        title.innerText = 'How to Play';
        closeBtn.innerText = 'Got it!';
    } else {
        idBtn.className = 'px-3 py-1 rounded-md text-xs font-bold transition-all bg-white shadow-sm text-app-primary';
        enBtn.className = 'px-3 py-1 rounded-md text-xs font-bold transition-all text-app-subtext hover:text-app-primary';
        idContent.classList.remove('hidden');
        enContent.classList.add('hidden');
        title.innerText = 'Cara Bermain';
        closeBtn.innerText = 'Mengerti!';
    }
}

function executeHint() {
    closeConfirmModal();
    clearInterval(state.timerInt);
    
    updateStreak(0);
    
    // Show solution
    document.getElementById('equation-display').innerHTML = state.currentSolution.replace(/\*/g, '×').replace(/\//g, '÷');
    
    showToast("Here is one solution!", "success");
    setTimeout(startGame, 3000);
}

function submitEq() {
    // Must use all numbers
    if (state.numbers.some(n => !n.used)) {
        showToast("You must use all four numbers!");
        return;
    }
    
    const eqStr = state.equationTokens.map(t => t.val).join('');
    
    try {
        // Safe eval since eqStr is built internally from valid math tokens only
        const result = new Function('return ' + eqStr)();
        
        if (Math.abs(result - 24) < 1e-6) {
            clearInterval(state.timerInt);
            updateStreak(state.streak + 1);
            showToast("Correct!", "success");
            setTimeout(startGame, 2000);
        } else {
            showToast(`Incorrect. Result is ${result}`);
            
            // End of streak
            if (state.streak > 0) {
                updateStreak(0);
            }
        }
    } catch (e) {
        showToast("Invalid equation syntax!");
    }
}

