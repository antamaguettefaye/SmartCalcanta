document.addEventListener('DOMContentLoaded', () => {
    // Sélecteurs
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    // Éléments DOM
    const calculator = $('#calculator');
    const displayMain = $('#display-main');
    const displayHistory = $('#display-history');
    const clearBtn = $('#clear-btn');
    const sidebar = $('#sidebar');
    const historyPanel = $('#history-panel');
    const overlay = $('#overlay');
    const memoryIndicator = $('#memory-indicator');
    const angleUnitIndicator = $('#angle-unit-indicator');
    const copyBtn = $('#copy-btn');
    const menuToggle = $('#menu-toggle');
    const historyToggle = $('#history-toggle');
    const themeSwitcher = $('#theme-switcher');
    const secondFnBtn = $('#second-fn-btn');

    // Constantes
    const MAX_INPUT_LENGTH = 16;
    const FONT_BREAKPOINT_MD = 9;
    const FONT_BREAKPOINT_SM = 12;

    // Variables d'état
    let mode;
    let state = {};
    let undoStack = [];
    let redoStack = [];

    // États initiaux
    const initialBasicState = {
        currentOperand: '0',
        previousOperand: '',
        operation: null,
        displayNeedsReset: false,
        lastOperation: null,
        lastOperand: null,
    };

    const initialScientificState = {
        expression: '0',
        angleUnit: 'deg',
        isSecondFunction: false,
        displayFormat: 'normal',
        isResultDisplayed: false,
    };

    let commonState = {
        memory: 0,
        history: [],
        lastAnswer: 0
    };

    // Sauvegarde et chargement de l'état
    const saveState = () => {
        try {
            localStorage.setItem(`calcState_${mode}`, JSON.stringify(state));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde de l'état", e);
        }
    };

    const saveCommonState = () => {
        try {
            localStorage.setItem('calcCommonState', JSON.stringify(commonState));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde de l'état commun", e);
        }
    };

    // Initialisation de l'application
    const initializeApp = () => {
        const savedTheme = localStorage.getItem('calcTheme') || 'dark';
        document.body.dataset.theme = savedTheme;

        mode = localStorage.getItem('calcLastMode') || 'scientific';

        try {
            const savedCommon = localStorage.getItem('calcCommonState');
            if (savedCommon) {
                commonState = JSON.parse(savedCommon);
            }
        } catch (e) {
            console.error("Erreur lors du chargement de l'état commun", e);
            commonState = { memory: 0, history: [], lastAnswer: 0 };
        }

        try {
            const savedModeState = localStorage.getItem(`calcState_${mode}`);
            if (savedModeState) {
                state = JSON.parse(savedModeState);
            } else {
                state = (mode === 'basic') ? { ...initialBasicState } : { ...initialScientificState };
            }
        } catch (e) {
            console.error(`Erreur lors du chargement de l'état ${mode}`, e);
            state = (mode === 'basic') ? { ...initialBasicState } : { ...initialScientificState };
        }

        setModeUI(mode);
        updateDisplay();
        updateHistoryPanel();
    };

    // Mise à jour de l'état
    const setState = newState => {
        state = { ...state, ...newState };
        updateDisplay();
    };

    const resetState = () => {
        const baseState = mode === 'basic' 
            ? { ...initialBasicState }
            : { ...initialScientificState, isSecondFunction: state.isSecondFunction, angleUnit: state.angleUnit, displayFormat: state.displayFormat };
        setState({ ...baseState });
        undoStack = [];
        redoStack = [];
        saveStateForUndo();
        saveState();
    };

    // Affichage
    const getScientificDisplayText = () => {
        let displayText = state.expression;
        try {
            if (!isNaN(displayText) && isFinite(displayText)) {
                displayText = formatNumber(displayText);
            }
        } catch (e) {}
        return displayText.replace(/\*/g, '×').replace(/\//g, '÷').replace(/ mod /g, ' mod ');
    };

    const updateDisplay = () => {
        if (mode === 'basic') {
            const { currentOperand, previousOperand, operation } = state;
            displayMain.textContent = formatNumber(currentOperand);
            const opSymbol = operation ? operation.replace('*', '×').replace('/', '÷') : '';
            displayHistory.textContent = previousOperand ? `${formatNumber(previousOperand)} ${opSymbol}` : '';

            if (!state.displayNeedsReset && currentOperand !== '0' && currentOperand !== 'Error') {
                clearBtn.textContent = 'C';
            } else {
                clearBtn.textContent = 'AC';
            }
        } else {
            displayMain.textContent = getScientificDisplayText();
            displayHistory.textContent = '';
            clearBtn.textContent = state.expression === '0' || state.expression === 'Error' ? 'AC' : 'C';
        }

        memoryIndicator.classList.toggle('active', commonState.memory !== 0);
        angleUnitIndicator.classList.toggle('active', mode === 'scientific');
        angleUnitIndicator.textContent = state.angleUnit ? state.angleUnit.toUpperCase() : 'DEG';

        updateFontSize();
        displayMain.scrollLeft = displayMain.scrollWidth;
    };

    const formatNumber = numStr => {
        if (numStr === 'Error' || numStr == null) return 'Error';
        
        let s = String(numStr);
        if (s.includes('Infinity') || s.includes('NaN')) return 'Error';

        if (mode === 'scientific' && state.displayFormat === 'sci') {
            try {
                return parseFloat(s).toExponential(9);
            } catch (e) {
                return 'Error';
            }
        }

        if (s.length > MAX_INPUT_LENGTH && !s.includes('e')) {
            try {
                return parseFloat(s).toExponential(9);
            } catch (e) {
                return 'Error';
            }
        }

        const [integerPart, decimalPart] = s.split('.');
        let formattedInteger;
        try {
            formattedInteger = parseFloat(integerPart || '0').toLocaleString('fr-FR', { maximumFractionDigits: 0 });
        } catch (e) {
            return 'Error';
        }

        return decimalPart != null ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    };

    const updateFontSize = () => {
        const len = displayMain.textContent.length;
        displayMain.className = 'display-main';
        if (len >= FONT_BREAKPOINT_SM) displayMain.classList.add('font-size-sm');
        else if (len >= FONT_BREAKPOINT_MD) displayMain.classList.add('font-size-md');
        else displayMain.classList.add('font-size-lg');
    };

    // Gestion des modes
    const setModeUI = targetMode => {
        calculator.classList.toggle('mode-scientific', targetMode === 'scientific');
        calculator.classList.toggle('mode-basic', targetMode === 'basic');

        $$('.mode-btn, #nav-list li[data-mode]').forEach(el => {
            const itemMode = el.dataset.mode;
            el.classList.toggle('active', itemMode === targetMode);
        });
    };

    const setMode = newMode => {
        if (mode === newMode) return;

        saveState();
        mode = newMode;
        localStorage.setItem('calcLastMode', mode);

        const savedStateJSON = localStorage.getItem(`calcState_${mode}`);
        try {
            state = savedStateJSON ? JSON.parse(savedStateJSON) :
                (mode === 'basic' ? { ...initialBasicState } : { ...initialScientificState });
        } catch (e) {
            console.error(`Erreur lors de l'analyse de l'état pour ${mode}`, e);
            state = (mode === 'basic') ? { ...initialBasicState } : { ...initialScientificState };
        }

        setModeUI(newMode);
        updateDisplay();
    };

    // Gestionnaire d'actions
    const handleAction = (action, value, e) => {
        if (action !== 'undo' && action !== 'redo') {
            saveStateForUndo();
        }

        const commonActions = {
            'memory-clear': memoryClear,
            'memory-recall': memoryRecall,
            'memory-add': memoryAdd,
            'memory-subtract': memorySubtract
        };

        if (commonActions[action]) {
            commonActions[action]();
        } else if (mode === 'basic') {
            handleBasicAction(action, value);
        } else {
            handleScientificAction(action, value, e);
        }

        updateDisplay();
        saveState();
    };

    // Mode basique
    const handleBasicAction = (action, value) => {
        const actions = {
            'number': appendNumber,
            'operator': chooseOperation,
            'decimal': appendDecimal,
            'clear': clearBasic,
            'calculate': calculateBasic,
            'negate': negate,
            'percent': percent,
            'backspace': backspaceBasic
        };
        if (actions[action]) actions[action](value);
    };

    const appendNumber = number => {
        if (state.currentOperand === 'Error') state.currentOperand = '0';
        if (state.currentOperand.replace(/[-.]/g, '').length >= MAX_INPUT_LENGTH) return;
        if (state.displayNeedsReset) {
            state.currentOperand = '0';
            state.displayNeedsReset = false;
        }
        state.currentOperand = state.currentOperand === '0' ? number : state.currentOperand + number;
    };

    const appendDecimal = () => {
        if (state.displayNeedsReset) {
            state.currentOperand = '0';
            state.displayNeedsReset = false;
        }
        if (!state.currentOperand.includes('.')) {
            state.currentOperand += '.';
        }
    };

    const chooseOperation = op => {
        if (state.currentOperand === 'Error') return;
        if (state.previousOperand !== '' && state.operation && !state.displayNeedsReset) {
            calculateBasic(false);
        }
        state.operation = op;
        state.previousOperand = state.currentOperand;
        state.displayNeedsReset = true;
    };

    const calculateBasic = (addToHistoryFlag = true) => {
        let result, prev, current, operationToUse = state.operation;

        if (operationToUse && state.previousOperand !== '') {
            prev = parseFloat(state.previousOperand);
            current = parseFloat(state.currentOperand);
        } else if (state.lastOperation && state.lastOperand !== null) {
            prev = parseFloat(state.currentOperand);
            current = parseFloat(state.lastOperand);
            operationToUse = state.lastOperation;
        } else {
            return;
        }

        if (isNaN(prev) || isNaN(current)) return;

        const expression = `${formatNumber(prev)} ${operationToUse.replace('*', '×').replace('/', '÷')} ${formatNumber(current)}`;

        switch (operationToUse) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/': result = current === 0 ? "Error" : prev / current; break;
            default: return;
        }

        if (result === "Error") {
            Object.assign(state, initialBasicState);
            state.currentOperand = 'Error';
            state.displayNeedsReset = true;
            return;
        }

        result = parseFloat(result.toPrecision(15));

        if (addToHistoryFlag) addToHistory(expression, result);

        commonState.lastAnswer = result;
        state.lastOperation = operationToUse;
        state.lastOperand = current.toString();
        state.currentOperand = result.toString();
        state.operation = null;
        state.previousOperand = '';
        state.displayNeedsReset = true;
    };

    const clearBasic = () => {
        if (clearBtn.textContent === 'C') {
            state.currentOperand = '0';
            state.displayNeedsReset = false;
        } else {
            Object.assign(state, initialBasicState);
        }
    };

    const negate = () => {
        if (state.currentOperand !== '0' && state.currentOperand !== 'Error') {
            state.currentOperand = (parseFloat(state.currentOperand) * -1).toString();
        }
    };

    const percent = () => {
        if (state.currentOperand === 'Error' || isNaN(state.currentOperand)) return;
        const currentNum = parseFloat(state.currentOperand);
        let result;

        if (state.operation && ['+', '-'].includes(state.operation) && state.previousOperand) {
            const prevNum = parseFloat(state.previousOperand);
            result = prevNum * currentNum / 100;
        } else {
            result = currentNum / 100;
        }

        state.currentOperand = result.toString();
        state.displayNeedsReset = true;
    };

    const backspaceBasic = () => {
        if (!state.displayNeedsReset && state.currentOperand !== 'Error') {
            state.currentOperand = state.currentOperand.slice(0, -1) || '0';
        }
    };

    // Mode scientifique
    const handleScientificAction = (action, value, e) => {
        const btn = e?.target.closest('[data-action]');
        const isSecondTrigger = state.isSecondFunction && (btn?.dataset.secondAction || btn?.dataset.secondValue);

        const primaryActions = {
            'number': appendToExpression,
            'decimal': appendToExpression,
            'operator': appendToExpression,
            'paren': appendToExpression,
            'sci-op': handleSciOp,
            'constant': handleConstant,
            'postfix-op': appendToExpression,
            'clear': clearScientific,
            'calculate': calculateScientific,
            'backspace': backspaceScientific,
            'toggle-2nd': toggleSecondFunction,
            'toggle-angle': toggleAngleUnit,
            'toggle-fe': toggleFE,
            'negate': negateScientific
        };

        if (isSecondTrigger) {
            const secondAction = btn.dataset.secondAction || action;
            const secondValue = btn.dataset.secondValue;

            const secondaryActions = {
                'y-root': () => appendToExpression('^(1/)'),
                'log-y': () => appendToExpression('log() / log()'),
                'rand': handleRand,
                'reciprocal': handleReciprocal,
                'sci-op': () => handleSciOp(secondValue)
            };

            (secondaryActions[secondValue] || secondaryActions[secondAction])();
        } else {
            if (primaryActions[action]) {
                primaryActions[action](value);
            }
        }

        if (isSecondTrigger && action !== 'toggle-2nd') {
            toggleSecondFunction();
        }
    };

    const appendToExpression = val => {
        if (state.expression === '0' && val === '.') {
            state.expression = '0.';
            return;
        }

        if (val === '.') {
            const lastNumMatch = state.expression.match(/[\d.]+$/);
            if (lastNumMatch && lastNumMatch[0].includes('.')) return;
        }

        if ((state.isResultDisplayed || state.expression === 'Error')) {
            if (!/[\s+\-*/^]/.test(val) || state.expression === 'Error') {
                state.expression = '';
            }
        }
        state.isResultDisplayed = false;

        if (state.expression === '0' && !/[.()*/^+-]/.test(val[0])) {
            state.expression = '';
        }

        const lastChar = state.expression.slice(-1);

        if (val === 'e') {
            if (/\d$/.test(lastChar) || lastChar === '.') {
                state.expression += 'e';
                return;
            }
        }

        if ((val === '+' || val === '-') && lastChar === 'e') {
            state.expression += val;
            return;
        }

        const endsWithCompletedValue = (/\d|\)$/.test(lastChar) || ['π', 'e'].includes(lastChar) || state.expression.endsWith('Ans'));
        const startsNewTerm = /^[a-z(π]/.test(val);

        if (state.expression.endsWith('Ans') && /^\d$/.test(val)) {
            state.expression += '*';
        } else if (endsWithCompletedValue && startsNewTerm) {
            state.expression += '*';
        } else if (lastChar === ')' && /\d/.test(val)) {
            state.expression += '*';
        }

        state.expression += val;
    };

    const negateScientific = () => {
        if (state.expression === '0' || state.expression === 'Error') return;

        if (state.isResultDisplayed || !isNaN(state.expression)) {
            state.expression = (parseFloat(state.expression) * -1).toString();
            state.isResultDisplayed = false;
            return;
        }

        if (state.expression.startsWith('-(') && state.expression.endsWith(')')) {
            state.expression = state.expression.substring(2, state.expression.length - 1);
        } else {
            state.expression = `-(${state.expression})`;
        }
    };

    const clearScientific = () => {
        state.isResultDisplayed = false;
        if (clearBtn.textContent === 'AC') {
            setState({
                ...initialScientificState,
                isSecondFunction: state.isSecondFunction,
                angleUnit: state.angleUnit,
                displayFormat: state.displayFormat
            });
        } else {
            state.expression = '0';
        }
    };

    const backspaceScientific = () => {
        state.isResultDisplayed = false;
        if (state.expression === 'Error') {
            state.expression = '0';
            return;
        }

        if (state.expression.endsWith(' mod ')) {
            state.expression = state.expression.slice(0, -5);
        } else if (state.expression.endsWith('Ans')) {
            state.expression = state.expression.slice(0, -3);
        } else {
            state.expression = state.expression.slice(0, -1);
        }

        if (state.expression === '') state.expression = '0';
    };

    const handleSciOp = func => {
        appendToExpression(`${func}(`);
    };

    const handleReciprocal = () => {
        if (state.expression !== '0' && state.expression !== 'Error') {
            state.expression = `1/(${state.expression})`;
        }
    };

    const handleRand = () => {
        appendToExpression(Math.random().toPrecision(15).toString());
    };

    const handleConstant = c => {
        appendToExpression(c);
    };

    const toggleSecondFunction = () => {
        state.isSecondFunction = !state.isSecondFunction;
        secondFnBtn.classList.toggle('active', state.isSecondFunction);

        $$('.scientific-keypad .keypad-btn[data-second-value]').forEach(btn => {
            btn.innerHTML = state.isSecondFunction ? btn.dataset.secondText : btn.getAttribute('data-original-text');
        });
    };

    const toggleAngleUnit = () => {
        const units = ['deg', 'rad', 'grad'];
        state.angleUnit = units[(units.indexOf(state.angleUnit) + 1) % units.length];
    };

    const toggleFE = () => {
        state.displayFormat = state.displayFormat === 'normal' ? 'sci' : 'normal';
    };

    const calculateScientific = () => {
        try {
            let expr = state.expression;
            const openParen = (expr.match(/\(/g) || []).length;
            const closeParen = (expr.match(/\)/g) || []).length;

            if (openParen > closeParen) {
                expr += ')'.repeat(openParen - closeParen);
            }

            const result = evaluateExpression(expr, state.angleUnit, commonState.lastAnswer);

            if (!isFinite(result)) throw new Error("Le résultat n'est pas fini");

            addToHistory(state.expression.replace(/\*/g, '×').replace(/\//g, '÷'), result);
            state.expression = result.toString();
            commonState.lastAnswer = result;
            state.isResultDisplayed = true;
        } catch (e) {
            console.error("Erreur de calcul:", e);
            state.expression = 'Error';
        }
    };

    // Évaluateur d'expressions
    const evaluateExpression = (expr, angleUnit, lastAnswer) => {
        const ops = {
            '+': { prec: 1, assoc: 'L' },
            '-': { prec: 1, assoc: 'L' },
            'mod': { prec: 2, assoc: 'L' },
            '*': { prec: 2, assoc: 'L' },
            '/': { prec: 2, assoc: 'L' },
            '^': { prec: 3, assoc: 'R' }
        };

        const postfixOps = ['!', '%'];
        const funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 
                       'asinh', 'acosh', 'atanh', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 
                       'log2', 'exp', 'ten-power', 'two-power', '_neg'];
        const constants = { 'π': Math.PI, 'e': Math.E, 'Ans': lastAnswer };

        expr = expr.replace(/ mod /g, ' mod ');

        const tokens = [];
        const tokenRegex = /(\d+\.?\d*(?:e[+\-]?\d+)?)|(Ans|π|e)|([a-z]+)|([+\-*/^()!%])/gi;
        let match;
        while ((match = tokenRegex.exec(expr)) !== null) {
            tokens.push(match[0]);
        }

        // Gestion du moins unaire
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '-' && (i === 0 || ['(', '+', '-', '*', '/', '^', 'mod'].includes(tokens[i - 1]))) {
                tokens[i] = '_neg';
            }
        }

        // Conversion en notation polonaise inversée (RPN)
        const rpn = [];
        const opStack = [];

        tokens.forEach(token => {
            if (!isNaN(token)) {
                rpn.push(parseFloat(token));
            } else if (constants[token] !== undefined) {
                rpn.push(constants[token]);
            } else if (funcs.includes(token)) {
                opStack.push(token);
            } else if (token === '(') {
                opStack.push(token);
            } else if (token === ')') {
                while (opStack.length && opStack[opStack.length - 1] !== '(') {
                    rpn.push(opStack.pop());
                }
                if (opStack[opStack.length - 1] === '(') opStack.pop();
                if (funcs.includes(opStack[opStack.length - 1])) {
                    rpn.push(opStack.pop());
                }
            } else if (postfixOps.includes(token)) {
                rpn.push(token);
            } else if (ops[token]) {
                const o1 = token;
                let o2 = opStack[opStack.length - 1];
                while (o2 && o2 !== '(' && 
                       (ops[o2].prec > ops[o1].prec || 
                        (ops[o2].prec === ops[o1].prec && ops[o1].assoc === 'L'))) {
                    rpn.push(opStack.pop());
                    o2 = opStack[opStack.length - 1];
                }
                opStack.push(o1);
            }
        });

        while (opStack.length) rpn.push(opStack.pop());

        // Évaluation de la RPN
        const evalStack = [];

        rpn.forEach(token => {
            if (typeof token === 'number') {
                evalStack.push(token);
            } else if (ops[token]) {
                const r = evalStack.pop(), l = evalStack.pop();
                if (l === undefined || r === undefined) throw new Error("Erreur de syntaxe : opérande manquant");

                switch (token) {
                    case '+': evalStack.push(l + r); break;
                    case '-': evalStack.push(l - r); break;
                    case '*': evalStack.push(l * r); break;
                    case '/': evalStack.push(l / r); break;
                    case '^': evalStack.push(Math.pow(l, r)); break;
                    case 'mod': evalStack.push(l % r); break;
                }
            } else if (postfixOps.includes(token)) {
                const n = evalStack.pop();
                if (n === undefined) throw new Error("Erreur de syntaxe : opérande manquant pour opérateur postfixe");

                if (token === '!') {
                    if (n < 0 || n > 170 || n !== Math.floor(n)) throw new Error('Factorielle invalide');
                    let f = 1;
                    for (let i = 2; i <= n; i++) f *= i;
                    evalStack.push(f);
                } else if (token === '%') {
                    evalStack.push(n / 100);
                }
            } else if (funcs.includes(token)) {
                const val = evalStack.pop();
                if (val === undefined) throw new Error("Erreur de syntaxe : argument manquant pour la fonction");

                let angle;
                if (angleUnit === 'deg') angle = val * Math.PI / 180;
                else if (angleUnit === 'grad') angle = val * Math.PI / 200;
                else angle = val;

                let result;
                switch (token) {
                    case '_neg': result = -val; break;
                    case 'sin': result = Math.sin(angle); break;
                    case 'cos': result = Math.cos(angle); break;
                    case 'tan': result = Math.tan(angle); break;
                    case 'asin':
                        result = Math.asin(val);
                        if (angleUnit === 'deg') result *= 180 / Math.PI;
                        else if (angleUnit === 'grad') result *= 200 / Math.PI;
                        break;
                    case 'acos':
                        result = Math.acos(val);
                        if (angleUnit === 'deg') result *= 180 / Math.PI;
                        else if (angleUnit === 'grad') result *= 200 / Math.PI;
                        break;
                    case 'atan':
                        result = Math.atan(val);
                        if (angleUnit === 'deg') result *= 180 / Math.PI;
                        else if (angleUnit === 'grad') result *= 200 / Math.PI;
                        break;
                    case 'sinh': result = Math.sinh(val); break;
                    case 'cosh': result = Math.cosh(val); break;
                    case 'tanh': result = Math.tanh(val); break;
                    case 'asinh': result = Math.asinh(val); break;
                    case 'acosh': result = Math.acosh(val); break;
                    case 'atanh': result = Math.atanh(val); break;
                    case 'log': result = Math.log10(val); break;
                    case 'ln': result = Math.log(val); break;
                    case 'log2': result = Math.log2(val); break;
                    case 'sqrt': result = Math.sqrt(val); break;
                    case 'cbrt': result = Math.cbrt(val); break;
                    case 'abs': result = Math.abs(val); break;
                    case 'exp': result = Math.exp(val); break;
                    case 'ten-power': result = Math.pow(10, val); break;
                    case 'two-power': result = Math.pow(2, val); break;
                }
                evalStack.push(result);
            }
        });

        if (evalStack.length !== 1) throw new Error("Erreur de syntaxe");
        return parseFloat(evalStack[0].toPrecision(15));
    };

    // Fonctions mémoire
    const memoryClear = () => {
        commonState.memory = 0;
        saveCommonState();
    };

    const memoryRecall = () => {
        if (mode === 'basic') {
            state.currentOperand = commonState.memory.toString();
            state.displayNeedsReset = true;
        } else {
            appendToExpression(commonState.memory.toString());
        }
    };

    const handleMemoryOperation = operation => {
        try {
            let num;
            let valToEval = mode === 'basic' ? state.currentOperand : state.expression;

            if (mode === 'scientific') {
                num = evaluateExpression(valToEval, state.angleUnit, commonState.lastAnswer);
            } else {
                const parsedNum = parseFloat(valToEval);
                if (!isNaN(parsedNum) && isFinite(parsedNum)) {
                    num = parsedNum;
                } else {
                    console.error("Opération mémoire échouée : nombre invalide");
                    return;
                }
            }

            if (isNaN(num) || !isFinite(num)) {
                console.error("Opération mémoire échouée : nombre ou expression invalide");
                return;
            }

            if (operation === 'add') commonState.memory += num;
            if (operation === 'subtract') commonState.memory -= num;

            if (mode === 'basic') state.displayNeedsReset = true;
            saveCommonState();
        } catch (e) {
            console.error("Erreur d'opération mémoire:", e);
        }
    };

    const memoryAdd = () => {
        handleMemoryOperation('add');
    };

    const memorySubtract = () => {
        handleMemoryOperation('subtract');
    };

    // Annuler/Rétablir
    const saveStateForUndo = () => {
        const stateToSave = {
            state: { ...state },
            commonState: { ...commonState },
            mode
        };

        const stateStr = JSON.stringify(stateToSave);
        if (undoStack.length > 0 && JSON.stringify(undoStack[undoStack.length - 1]) === stateStr) return;

        undoStack.push(stateToSave);
        if (undoStack.length > 50) undoStack.shift();
        redoStack = [];

        $('#undo-btn').disabled = undoStack.length < 2;
        $('#redo-btn').disabled = true;
    };

    const undo = () => {
        if (undoStack.length < 2) return;

        redoStack.push(undoStack.pop());
        const prevState = undoStack[undoStack.length - 1];

        mode = prevState.mode;
        state = prevState.state;
        Object.assign(commonState, prevState.commonState);

        setModeUI(mode);
        updateDisplay();
        updateHistoryPanel();

        $('#undo-btn').disabled = undoStack.length < 2;
        $('#redo-btn').disabled = false;
    };

    const redo = () => {
        if (redoStack.length === 0) return;

        const nextState = redoStack.pop();
        undoStack.push(nextState);

        mode = nextState.mode;
        state = nextState.state;
        Object.assign(commonState, nextState.commonState);

        setModeUI(mode);
        updateDisplay();
        updateHistoryPanel();

        $('#undo-btn').disabled = undoStack.length < 2;
        $('#redo-btn').disabled = redoStack.length === 0;
    };

    // Historique
    const addToHistory = (expression, result) => {
        commonState.history.unshift({
            expression,
            result: result.toString()
        });

        if (commonState.history.length > 100) commonState.history.pop();

        updateHistoryPanel();
        saveCommonState();
    };

    const updateHistoryPanel = () => {
        const list = $('#history-list');
        list.innerHTML = commonState.history.length === 0
            ? '<li style="text-align:center;color:var(--text-secondary-color);padding:2rem 1rem;">Aucun historique pour le moment</li>'
            : commonState.history.map(item => `
                <li class="history-item" data-result="${item.result}" tabindex="0">
                    <div class="history-expression">${item.expression} =</div>
                    <div class="history-result">${formatNumber(item.result)}</div>
                </li>
            `).join('');
    };

    // Gestion des panneaux
    const openPanel = panel => {
        panel.classList.add('open');
        if (panel === historyPanel) document.body.classList.add('history-open');
        if (panel === sidebar) document.body.classList.add('sidebar-open');

        if (window.innerWidth <= 767 || (window.innerWidth < 1200 && panel === historyPanel)) {
            overlay.classList.add('active');
        }

        if (panel === sidebar) {
            menuToggle.classList.add('open');
            menuToggle.setAttribute('aria-expanded', 'true');
        }
    };

    const closePanel = panel => {
        panel.classList.remove('open');
        if (panel === historyPanel) document.body.classList.remove('history-open');
        if (panel === sidebar) document.body.classList.remove('sidebar-open');

        if (!sidebar.classList.contains('open') && !historyPanel.classList.contains('open')) {
            overlay.classList.remove('active');
        }

        if (panel === sidebar) {
            menuToggle.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    };

    // Écouteurs d'événements
    document.body.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (btn) {
            const isSecond = state.isSecondFunction && (btn.dataset.secondAction || btn.dataset.secondValue);
            const action = isSecond ? btn.dataset.secondAction || btn.dataset.action : btn.dataset.action;
            const value = isSecond ? btn.dataset.secondValue : btn.dataset.value;
            handleAction(action, value, e);
        }
    });

    themeSwitcher.addEventListener('click', () => {
        const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        document.body.dataset.theme = newTheme;
        try {
            localStorage.setItem('calcTheme', newTheme);
        } catch (e) {
            console.error("Erreur lors de la sauvegarde du thème", e);
        }
    });

    menuToggle.addEventListener('click', () =>
        sidebar.classList.contains('open') ? closePanel(sidebar) : openPanel(sidebar)
    );

    historyToggle.addEventListener('click', () => openPanel(historyPanel));
    $('#close-history').addEventListener('click', () => closePanel(historyPanel));

    overlay.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) closePanel(sidebar);
        if (historyPanel.classList.contains('open')) closePanel(historyPanel);
    });

    $('#clear-history-btn').addEventListener('click', () => {
        if (confirm("Effacer tout l'historique ?")) {
            commonState.history = [];
            updateHistoryPanel();
            saveCommonState();
        }
    });

    $('#undo-btn').addEventListener('click', undo);
    $('#redo-btn').addEventListener('click', redo);

    $$('.mode-btn, #nav-list li[data-mode]').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            setMode(el.dataset.mode);
            if (sidebar.classList.contains('open')) closePanel(sidebar);
        });
    });

    copyBtn.addEventListener('click', () => {
        const textToCopy = displayMain.textContent;
        if (textToCopy === 'Error' || !navigator.clipboard) return;

        navigator.clipboard.writeText(textToCopy.replace(/,/g, '')).then(() => {
            const icon = copyBtn.querySelector('i');
            icon.classList.replace('fa-copy', 'fa-check');
            copyBtn.setAttribute('aria-label', 'Copié !');
            setTimeout(() => {
                icon.classList.replace('fa-check', 'fa-copy');
                copyBtn.setAttribute('aria-label', 'Copier le résultat');
            }, 1500);
        }).catch(() => {});
    });

    // Support clavier
    document.addEventListener('keydown', e => {
        const target = e.target;
        if (target.matches('input,select')) return;

        if (target.classList.contains('history-item') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            target.click();
            return;
        }

        const key = e.key.toLowerCase();
        let actionHandled = true;

        if (mode === 'scientific' && key === 'e') {
            e.preventDefault();
            handleAction('constant', 'e');
            return;
        }

        if (key >= '0' && key <= '9') {
            handleAction('number', key);
        } else if (key === '.' || key === ',') {
            handleAction('decimal', '.');
        } else if (['+', '-', '*', '/', '^', '%'].includes(key)) {
            handleAction(key === '%' ? (mode === 'basic' ? 'percent' : 'postfix-op') : 'operator', key);
        } else if (['(', ')'].includes(key)) {
            handleAction('paren', key);
        } else if (key === 'enter' || key === '=') {
            e.preventDefault();
            handleAction('calculate');
        } else if (key === 'escape') {
            handleAction('clear');
        } else if (key === 'backspace') {
            handleAction('backspace');
        } else if (key === 'p') {
            handleAction('constant', 'π');
        } else if (key === 'a') {
            handleAction('constant', 'Ans');
        } else if (e.ctrlKey && key === 'z') {
            e.preventDefault();
            undo();
        } else if (e.ctrlKey && (key === 'y' || (e.shiftKey && key === 'z'))) {
            e.preventDefault();
            redo();
        } else {
            actionHandled = false;
        }

        if (actionHandled) {
            e.preventDefault();
        }
    });

    // Responsive
    window.addEventListener('resize', () => {
        const sidebarOpen = sidebar.classList.contains('open');
        const historyOpen = historyPanel.classList.contains('open');

        if (window.innerWidth > 767 && !(window.innerWidth < 1200 && historyOpen)) {
            overlay.classList.remove('active');
        } else if (sidebarOpen || historyOpen) {
            overlay.classList.add('active');
        }
    });

    // Clic sur l'historique
    $('#history-list').addEventListener('click', e => {
        const item = e.target.closest('.history-item');
        if (!item) return;

        const resultStr = item.dataset.result;

        if (mode === 'basic') {
            state.currentOperand = resultStr;
            state.displayNeedsReset = true;
        } else {
            state.expression = resultStr;
            state.isResultDisplayed = true;
        }

        updateDisplay();
        closePanel(historyPanel);
    });

    // Sauvegarde des textes originaux pour le bouton 2nd
    $$('.scientific-keypad .keypad-btn[data-second-value]').forEach(btn => {
        btn.setAttribute('data-original-text', btn.innerHTML);
    });

    // Initialisation
    initializeApp();
    saveStateForUndo();
});
