import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, BarChart2, Settings, X, Play, RotateCcw, Home, User, Check } from 'lucide-react';

// --- 1. Math Engine V5: 定番数字対応 ---
const gcd = (a, b) => b === 0 ? Math.abs(a) : gcd(b, a % b);

class Fraction {
  constructor(num, den = 1) {
    if (den === 0) throw new Error("Division by zero");
    const g = gcd(num, den);
    this.num = (den < 0 ? -num : num) / g;
    this.den = Math.abs(den) / g;
  }
  add(f) { return new Fraction(this.num * f.den + f.num * this.den, this.den * f.den); }
  sub(f) { return new Fraction(this.num * f.den - f.num * this.den, this.den * f.den); }
  mul(f) { return new Fraction(this.num * f.num, this.den * f.den); }
  div(f) { if (f.num === 0) throw new Error("Division by zero"); return new Fraction(this.num * f.den, this.den * f.num); }
  equals(f) { return this.num === f.num && this.den === f.den; }
  toFloat() { return this.num / this.den; }
  isTerminatingDecimal() {
    let d = this.den;
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    return d === 1;
  }
  toString() { return this.den === 1 ? `${this.num}` : `${this.num}/${this.den}`; }
}

// 定番の小数⇄分数
const DECIMAL_FRACTIONS = [
  { dec: 0.5, num: 1, den: 2 },
  { dec: 0.25, num: 1, den: 4 }, { dec: 0.75, num: 3, den: 4 },
  { dec: 0.2, num: 1, den: 5 }, { dec: 0.4, num: 2, den: 5 }, { dec: 0.6, num: 3, den: 5 }, { dec: 0.8, num: 4, den: 5 },
  { dec: 0.125, num: 1, den: 8 }, { dec: 0.375, num: 3, den: 8 }, { dec: 0.625, num: 5, den: 8 }, { dec: 0.875, num: 7, den: 8 },
];

// 便利な積
const USEFUL_PRODUCTS = [
  { a: 25, b: 4, result: 100 },
  { a: 125, b: 8, result: 1000 },
  { a: 12, b: 15, result: 180 },
  { a: 15, b: 6, result: 90 },
  { a: 24, b: 5, result: 120 },
];

// 平方数
const SQUARES = [
  { base: 11, sq: 121 }, { base: 12, sq: 144 }, { base: 13, sq: 169 },
  { base: 14, sq: 196 }, { base: 15, sq: 225 }, { base: 16, sq: 256 },
  { base: 17, sq: 289 }, { base: 18, sq: 324 }, { base: 19, sq: 361 },
];

// 3.14の倍数
const PI_MULTIPLES = [
  { n: 2, result: 6.28 }, { n: 3, result: 9.42 }, { n: 4, result: 12.56 },
  { n: 5, result: 15.7 }, { n: 6, result: 18.84 }, { n: 7, result: 21.98 },
  { n: 8, result: 25.12 }, { n: 9, result: 28.26 },
];

// 立方数
const CUBES = [
  { base: 2, cube: 8 }, { base: 3, cube: 27 }, { base: 4, cube: 64 },
  { base: 5, cube: 125 }, { base: 6, cube: 216 }, { base: 7, cube: 343 },
  { base: 8, cube: 512 }, { base: 9, cube: 729 },
];

const parseFraction = (str) => {
  str = str.trim();
  if (!str) return null;
  try {
    if (str.includes('.')) {
      const val = parseFloat(str);
      const len = (str.split('.')[1] || '').length;
      const den = Math.pow(10, len);
      return new Fraction(Math.round(val * den), den);
    }
    if (str.includes('/')) {
      const [n, d] = str.split('/').map(Number);
      if (isNaN(n) || isNaN(d)) return null;
      return new Fraction(n, d);
    }
    const val = parseInt(str);
    return isNaN(val) ? null : new Fraction(val, 1);
  } catch { return null; }
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getDifficultyParams = (level) => {
  if (level <= 2) return {
    name: "基礎", terms: 3,
    minFrac: 0, maxFrac: 1, minDec: 0, maxDec: 1,
    denoms: [2, 3, 4, 5], maxNum: 12, decimalPlaces: 1,
    answerType: 'integer',
    useDecimalFractions: false, useProducts: false, useSquares: false, usePi: false, useCubes: false
  };
  if (level <= 4) return {
    name: "標準", terms: randomInt(3, 4),
    minFrac: 1, maxFrac: 2, minDec: 0, maxDec: 1,
    denoms: [2, 3, 4, 5, 6, 8], maxNum: 15, decimalPlaces: 1,
    answerType: 'integer',
    useDecimalFractions: true, useProducts: false, useSquares: false, usePi: false, useCubes: false
  };
  if (level <= 6) return {
    name: "応用", terms: randomInt(4, 5),
    minFrac: 2, maxFrac: 3, minDec: 0, maxDec: 1,
    denoms: [2, 3, 4, 5, 6, 8, 10, 12], maxNum: 20, decimalPlaces: 2,
    answerType: 'fraction',
    useDecimalFractions: true, useProducts: true, useSquares: true, usePi: false, useCubes: false
  };
  if (level <= 8) return {
    name: "難関", terms: randomInt(5, 6),
    minFrac: 3, maxFrac: 4, minDec: 1, maxDec: 2,
    denoms: [2, 3, 4, 5, 6, 8, 10, 12, 15], maxNum: 25, decimalPlaces: 2,
    answerType: 'fraction',
    useDecimalFractions: true, useProducts: true, useSquares: true, usePi: true, useCubes: false
  };
  return {
    name: "魔界", terms: randomInt(6, 7),
    minFrac: 4, maxFrac: 5, minDec: 1, maxDec: 2,
    denoms: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20], maxNum: 30, decimalPlaces: 2,
    answerType: 'fraction',
    useDecimalFractions: true, useProducts: true, useSquares: true, usePi: true, useCubes: true
  };
};

const generateInteger = (max) => new Fraction(randomInt(2, max), 1);

const generateFraction = (params) => {
  if (params.useDecimalFractions && Math.random() < 0.3) {
    const df = randomPick(DECIMAL_FRACTIONS);
    return new Fraction(df.num, df.den);
  }
  for (let i = 0; i < 30; i++) {
    const den = randomPick(params.denoms);
    const num = randomInt(1, Math.min(den * 2, params.maxNum));
    const f = new Fraction(num, den);
    if (f.den > 1) return f;
  }
  return new Fraction(1, 2);
};

const generateDecimal = (params) => {
  if (params.useDecimalFractions && Math.random() < 0.3) {
    const df = randomPick(DECIMAL_FRACTIONS);
    return { frac: new Fraction(df.num, df.den), asDecimal: true };
  }
  const multiplier = Math.pow(10, params.decimalPlaces);
  const value = randomInt(1, 9 * multiplier) / multiplier;
  return { frac: new Fraction(Math.round(value * multiplier), multiplier), asDecimal: true };
};

const toDisplay = (frac, forceDecimal = false) => {
  if (forceDecimal && frac.isTerminatingDecimal()) {
    const val = frac.toFloat();
    if (Number.isInteger(val)) return { type: 'integer', value: val.toString() };
    return { type: 'decimal', value: val.toString() };
  }
  if (frac.den === 1) return { type: 'integer', value: frac.num.toString() };
  return { type: 'fraction', num: frac.num, den: frac.den };
};

const calc = (n1, n2, op) => {
  switch (op) {
    case '+': return n1.add(n2);
    case '-': return n1.sub(n2);
    case '*': return n1.mul(n2);
    case '/': return n1.div(n2);
    default: return n1;
  }
};

const isTrivial = (v1, v2, op) => {
  const a = v1.toFloat(), b = v2.toFloat();
  if ((op === '*' || op === '/') && (a === 1 || b === 1)) return true;
  if ((op === '+' || op === '-') && (a === 0 || b === 0)) return true;
  if ((op === '/' || op === '-') && a === b) return true;
  if (op === '*' && (a === 0 || b === 0)) return true;
  return false;
};

const generateSpecialProblem = (params) => {
  if (params.usePi && Math.random() < 0.2) {
    const pi = randomPick(PI_MULTIPLES);
    const extra = randomInt(-5, 10);
    const answer = new Fraction(Math.round((pi.result + extra) * 100), 100);
    return {
      display: {
        type: 'expr',
        left: { type: 'expr', left: { type: 'decimal', value: '3.14' }, op: '×', right: { type: 'integer', value: pi.n.toString() } },
        op: extra >= 0 ? '+' : '−',
        right: { type: 'integer', value: Math.abs(extra).toString() }
      },
      answer
    };
  }
  if (params.useSquares && Math.random() < 0.15) {
    const sq = randomPick(SQUARES);
    const op = Math.random() < 0.5 ? '+' : '-';
    const extra = randomInt(1, 20);
    const result = op === '+' ? sq.sq + extra : sq.sq - extra;
    if (result > 0) {
      return {
        display: {
          type: 'expr',
          left: { type: 'expr', left: { type: 'integer', value: sq.base.toString() }, op: '×', right: { type: 'integer', value: sq.base.toString() } },
          op: op === '+' ? '+' : '−',
          right: { type: 'integer', value: extra.toString() }
        },
        answer: new Fraction(result, 1)
      };
    }
  }
  if (params.useCubes && Math.random() < 0.15) {
    const cb = randomPick(CUBES);
    const divisor = randomPick([2, 4, 8].filter(d => cb.cube % d === 0));
    if (divisor) {
      return {
        display: {
          type: 'expr',
          left: {
            type: 'expr',
            left: { type: 'expr', left: { type: 'integer', value: cb.base.toString() }, op: '×', right: { type: 'integer', value: cb.base.toString() } },
            op: '×',
            right: { type: 'integer', value: cb.base.toString() }
          },
          op: '÷',
          right: { type: 'integer', value: divisor.toString() }
        },
        answer: new Fraction(cb.cube / divisor, 1)
      };
    }
  }
  if (params.useProducts && Math.random() < 0.15) {
    const prod = randomPick(USEFUL_PRODUCTS);
    const divisor = randomPick([2, 4, 5, 10].filter(d => prod.result % d === 0));
    if (divisor) {
      return {
        display: {
          type: 'expr',
          left: { type: 'expr', left: { type: 'integer', value: prod.a.toString() }, op: '×', right: { type: 'integer', value: prod.b.toString() } },
          op: '÷',
          right: { type: 'integer', value: divisor.toString() }
        },
        answer: new Fraction(prod.result / divisor, 1)
      };
    }
  }
  return null;
};

const createExpression = (params) => {
  const numFracs = randomInt(params.minFrac, params.maxFrac);
  const numDecs = randomInt(params.minDec, params.maxDec);
  const numInts = Math.max(0, params.terms - numFracs - numDecs);
  const nodes = [];

  for (let i = 0; i < numFracs; i++) {
    const val = generateFraction(params);
    nodes.push({ val, display: toDisplay(val), priority: 0 });
  }
  for (let i = 0; i < numDecs; i++) {
    const { frac, asDecimal } = generateDecimal(params);
    nodes.push({ val: frac, display: toDisplay(frac, asDecimal), priority: 0 });
  }
  for (let i = 0; i < numInts; i++) {
    const val = generateInteger(params.maxNum);
    nodes.push({ val, display: toDisplay(val), priority: 0 });
  }

  for (let i = nodes.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
  }

  const ops = ['+', '-', '*', '/'];
  const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  let attempts = 0;
  while (nodes.length > 1 && attempts < 200) {
    attempts++;
    const idx = randomInt(0, nodes.length - 2);
    const n1 = nodes[idx], n2 = nodes[idx + 1];
    let op = ops[randomInt(0, 3)];

    if (op === '/' && n2.val.num === 0) continue;
    if (isTrivial(n1.val, n2.val, op)) continue;

    let newVal;
    try { newVal = calc(n1.val, n2.val, op); } catch { continue; }

    const midVal = Math.abs(newVal.toFloat());
    if (midVal > 500 || (midVal < 0.001 && newVal.num !== 0)) continue;

    const currentPriority = (op === '*' || op === '/') ? 2 : 1;
    let d1 = n1.display, d2 = n2.display;
    const needP1 = n1.priority > 0 && n1.priority < currentPriority;
    const needP2 = n2.priority > 0 && (n2.priority < currentPriority || (op === '-' || op === '/'));

    nodes.splice(idx, 2, {
      val: newVal,
      display: {
        type: 'expr',
        left: needP1 ? { type: 'paren', content: d1 } : d1,
        op: opSymbols[op],
        right: needP2 ? { type: 'paren', content: d2 } : d2
      },
      priority: currentPriority
    });
  }

  if (nodes.length !== 1) throw new Error("Failed");
  return { display: nodes[0].display, answer: nodes[0].val };
};

const generateProblem = (level) => {
  const params = getDifficultyParams(level);
  const special = generateSpecialProblem(params);
  if (special) return special;

  for (let i = 0; i < 500; i++) {
    try {
      const { display, answer } = createExpression(params);
      const absVal = Math.abs(answer.toFloat());

      if (answer.num < 0) continue;
      if (absVal > 200 || absVal === 0) continue;
      if (Math.abs(answer.num) > 300) continue;

      if (params.answerType === 'integer') {
        if (answer.den !== 1) continue;
      } else {
        if (answer.den > 20) continue;
      }

      return { display, answer };
    } catch { continue; }
  }
  return { display: { type: 'integer', value: '2' }, answer: new Fraction(2, 1) };
};

// --- 2. Math Renderer ---
const MathRenderer = ({ node }) => {
  if (!node) return null;

  if (node.type === 'integer' || node.type === 'decimal') {
    return <span className="mx-0.5 text-gray-800">{node.value}</span>;
  }
  if (node.type === 'fraction') {
    return (
      <span className="inline-flex flex-col items-center mx-1 align-middle">
        <span className="text-sm leading-tight px-0.5 text-gray-800">{node.num}</span>
        <span className="w-full h-0.5 bg-gray-700 my-px"></span>
        <span className="text-sm leading-tight px-0.5 text-gray-800">{node.den}</span>
      </span>
    );
  }
  if (node.type === 'paren') {
    return (
      <span className="inline-flex items-center">
        <span className="text-xl text-gray-400 font-light mx-0.5">(</span>
        <MathRenderer node={node.content} />
        <span className="text-xl text-gray-400 font-light mx-0.5">)</span>
      </span>
    );
  }
  if (node.type === 'expr') {
    return (
      <span className="inline-flex items-center flex-wrap justify-center">
        <MathRenderer node={node.left} />
        <span className="mx-1 text-lg text-gray-700">{node.op}</span>
        <MathRenderer node={node.right} />
      </span>
    );
  }
  return null;
};

// --- 3. UI Components ---
const Confetti = ({ active }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(60)].map((_, i) => (
        <div key={i} className="absolute animate-fall" style={{
          left: `${Math.random() * 100}%`, top: '-20px',
          animationDelay: `${Math.random() * 0.5}s`, animationDuration: `${1 + Math.random()}s`
        }}>
          <div className="w-3 h-3 rotate-45" style={{
            backgroundColor: ['#4ECDC4', '#FF8A80', '#FFA726', '#4CAF50', '#FFD700'][Math.floor(Math.random() * 5)]
          }} />
        </div>
      ))}
      <style>{`@keyframes fall { to { transform: translateY(100vh) rotate(720deg); opacity: 0; } } .animate-fall { animation: fall 1.5s ease-out forwards; }`}</style>
    </div>
  );
};

const KeyBtn = ({ char, onClick, type = 'default' }) => {
  let bg = "bg-white hover:bg-slate-50", text = "text-slate-700";
  if (type === 'del') { bg = "bg-pink-100 hover:bg-pink-200"; text = "text-red-700"; }
  else if (type === 'clr') { bg = "bg-red-400 hover:bg-red-500"; text = "text-white"; }
  else if (type === 'op') { bg = "bg-teal-400 hover:bg-teal-500"; text = "text-white"; }
  else if (type === 'enter') { bg = "bg-green-500 hover:bg-green-600"; text = "text-white"; }
  return (
    <button onClick={() => onClick(char)}
      className={`${bg} ${text} text-xl font-bold rounded-lg shadow-sm h-14 flex items-center justify-center transition-all active:scale-95`}>
      {char === 'DEL' ? <RotateCcw size={20} /> : char}
    </button>
  );
};

// --- 4. Screens ---
const SplashScreen = ({ onLogin }) => (
  <div className="h-full flex flex-col items-center justify-center bg-white p-6 relative overflow-hidden">
    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#4ECDC4_1px,transparent_1px)] bg-[length:20px_20px]" />
    <div className="mb-12 text-center animate-fade-in">
      <div className="text-9xl font-black text-teal-400 tracking-tighter" style={{ fontFamily: 'serif' }}>Z</div>
      <h1 className="text-4xl font-bold text-slate-800 -mt-4">Zan<span className="text-sm font-normal ml-2 text-slate-500">斬</span></h1>
      <p className="mt-4 text-slate-500 text-sm tracking-widest">難問を、斬る。</p>
    </div>
    <div className="w-full max-w-xs z-10">
      <button onClick={onLogin} className="w-full py-4 rounded-full bg-teal-400 text-white font-bold shadow-lg shadow-teal-400/30 active:scale-98 transition-transform">
        はじめる
      </button>
    </div>
    <style>{`.animate-fade-in { animation: fadeIn 0.8s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
  </div>
);

const HomeScreen = ({ onStart, userStats }) => {
  const [level, setLevel] = useState(5);
  const getLevelLabel = (l) => ["基礎","基礎","標準","標準","応用","応用","難関","難関","魔界","魔界"][l-1] || "魔界";
  const getLevelColor = (l) => {
    if (l <= 2) return "bg-emerald-100 text-emerald-700";
    if (l <= 4) return "bg-blue-100 text-blue-700";
    if (l <= 6) return "bg-amber-100 text-amber-700";
    if (l <= 8) return "bg-red-100 text-red-700";
    return "bg-purple-100 text-purple-700";
  };
  const getLevelDesc = (l) => {
    if (l <= 2) return "分数・小数が混ざる基本問題";
    if (l <= 4) return "分数1〜2個を含む標準問題";
    if (l <= 6) return "答えが分数になる場合も";
    if (l <= 8) return "複雑な分数計算、小数も混合";
    return "地獄級。分数だらけ";
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-5 flex justify-between items-center bg-white shadow-sm">
        <Settings className="text-slate-400" size={22} />
        <h1 className="text-lg font-bold text-teal-500">Zan</h1>
        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
          <User size={18} className="text-slate-500" />
        </div>
      </div>
      <div className="p-5 flex-1 overflow-y-auto">
        <div className="bg-white p-5 rounded-2xl shadow-sm mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-500">今日の正解数</span>
          </div>
          <div className="text-3xl font-black text-slate-800 mb-2">{userStats.todayCount}<span className="text-base font-normal text-slate-400 ml-1">問</span></div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-teal-400 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, userStats.todayCount * 5)}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-3xl font-black text-teal-500">Lv.{level}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(level)}`}>{getLevelLabel(level)}</span>
          </div>
          <input type="range" min="1" max="10" value={level} onChange={(e) => setLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-400" />
          <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
            <span>1</span><span>5</span><span>10</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">{getLevelDesc(level)}</p>
        </div>

        <button onClick={() => onStart(level)}
          className="w-full py-5 rounded-2xl bg-teal-400 text-white text-xl font-bold shadow-lg shadow-teal-400/40 flex items-center justify-center gap-3 active:scale-98 transition-transform">
          <Play fill="currentColor" size={24} /> スタート
        </button>
      </div>
      <div className="bg-white border-t border-slate-100 p-3 flex justify-around">
        <div className="flex flex-col items-center text-teal-500"><Home size={22} /><span className="text-[10px] font-bold mt-0.5">ホーム</span></div>
        <div className="flex flex-col items-center text-slate-300"><BarChart2 size={22} /><span className="text-[10px] font-bold mt-0.5">統計</span></div>
        <div className="flex flex-col items-center text-slate-300"><Trophy size={22} /><span className="text-[10px] font-bold mt-0.5">実績</span></div>
      </div>
    </div>
  );
};

const DrillScreen = ({ level, onFinishSet, onQuit }) => {
  const [problem, setProblem] = useState(null);
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState({ status: null, msg: '' });
  const [shake, setShake] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const MAX_QUESTIONS = 5;

  const nextProblem = useCallback(() => {
    setProblem(generateProblem(level));
    setInput('');
    setFeedback({ status: null, msg: '' });
  }, [level]);

  useEffect(() => { nextProblem(); }, [nextProblem]);

  const handleInput = (char) => {
    if (feedback.status) return;
    if (char === 'DEL') setInput(prev => prev.slice(0, -1));
    else if (char === 'CLR') setInput('');
    else if (char === '判定') checkAnswer();
    else setInput(prev => prev + char);
  };

  const checkAnswer = () => {
    if (!input || !problem) return;
    const userVal = parseFraction(input);
    const isCorrect = userVal && userVal.equals(problem.answer);
    if (isCorrect) {
      setFeedback({ status: 'correct', msg: '正解！🎉' });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    } else {
      const ans = problem.answer;
      let ansStr = ans.toString();
      if (ans.den !== 1 && ans.isTerminatingDecimal()) {
        ansStr = `${ans.toFloat()} (=${ans.toString()})`;
      }
      setFeedback({ status: 'wrong', msg: `残念… 正解: ${ansStr}` });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    const newResults = [...results, { display: problem.display, userAns: input, correctAns: problem.answer.toString(), isCorrect }];
    setResults(newResults);
    setTimeout(() => {
      if (newResults.length >= MAX_QUESTIONS) onFinishSet(newResults);
      else nextProblem();
    }, isCorrect ? 1200 : 2500);
  };

  if (!problem) return <div className="h-full flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full"></div></div>;

  return (
    <div className={`h-full flex flex-col bg-slate-50 ${shake ? 'animate-shake' : ''}`}>
      <Confetti active={showConfetti} />
      <div className="p-4 flex justify-between items-center">
        <button onClick={onQuit} className="p-2 rounded-full bg-slate-200 text-slate-500 active:scale-95"><X size={20} /></button>
        <div className="flex items-center gap-2">
          {[...Array(MAX_QUESTIONS)].map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < results.length ? (results[i].isCorrect ? 'bg-green-400' : 'bg-red-400') : i === results.length ? 'bg-teal-400 scale-125' : 'bg-slate-200'}`} />
          ))}
        </div>
        <div className="bg-teal-400 text-white px-2.5 py-1 rounded-lg text-xs font-bold">Lv.{level}</div>
      </div>
      <div className="flex-1 px-4 flex flex-col justify-center">
        <div className={`bg-white rounded-3xl shadow-sm border-2 p-5 min-h-36 flex items-center justify-center transition-all
          ${feedback.status === 'correct' ? 'border-green-400 bg-green-50' : feedback.status === 'wrong' ? 'border-red-400 bg-red-50' : 'border-slate-100'}`}>
          <div className="text-lg font-bold flex items-center flex-wrap justify-center gap-1">
            <MathRenderer node={problem.display} />
            <span className="mx-2 text-xl text-gray-600">=</span>
            <span className="text-2xl text-teal-500 font-black">?</span>
          </div>
        </div>
        <div className="mt-3 h-7 flex justify-center items-center">
          {feedback.status === 'correct' && <span className="text-green-500 font-bold text-base animate-bounce">{feedback.msg}</span>}
          {feedback.status === 'wrong' && <span className="text-red-500 font-bold text-sm">{feedback.msg}</span>}
        </div>
      </div>
      <div className="px-4 mb-3">
        <input type="text" readOnly value={input} placeholder="答えを入力（例: 7 または 1/2 または 0.5）"
          className={`w-full h-14 text-2xl font-mono text-center rounded-xl border-2 outline-none bg-white transition-colors
            ${feedback.status === 'correct' ? 'border-green-500 text-green-600' : feedback.status === 'wrong' ? 'border-red-500 text-red-600' : 'border-teal-400 text-slate-700'}`} />
      </div>
      <div className="bg-white p-3 pb-6 rounded-t-3xl shadow-lg">
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
          {['7','8','9'].map(n => <KeyBtn key={n} char={n} onClick={handleInput} />)}
          <KeyBtn char="DEL" type="del" onClick={handleInput} />
          {['4','5','6'].map(n => <KeyBtn key={n} char={n} onClick={handleInput} />)}
          <KeyBtn char="CLR" type="clr" onClick={handleInput} />
          {['1','2','3'].map(n => <KeyBtn key={n} char={n} onClick={handleInput} />)}
          <KeyBtn char="/" type="op" onClick={handleInput} />
          <KeyBtn char="0" onClick={handleInput} />
          <KeyBtn char="." onClick={handleInput} />
          <KeyBtn char="-" onClick={handleInput} />
          <KeyBtn char="判定" type="enter" onClick={handleInput} />
        </div>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} } .animate-shake{animation:shake 0.4s ease-in-out}`}</style>
    </div>
  );
};

const ResultScreen = ({ results, onHome, onRetry }) => {
  const correctCount = results.filter(r => r.isCorrect).length;
  const score = Math.round((correctCount / results.length) * 100);
  const [showConfetti, setShowConfetti] = useState(false);
  let rank = 'C', rankColor = 'text-slate-400', rankBg = 'bg-slate-100';
  if (score === 100) { rank = 'S'; rankColor = 'text-yellow-500'; rankBg = 'bg-gradient-to-br from-yellow-50 to-amber-100'; }
  else if (score >= 80) { rank = 'A'; rankColor = 'text-sky-500'; rankBg = 'bg-sky-50'; }
  else if (score >= 60) { rank = 'B'; rankColor = 'text-orange-500'; rankBg = 'bg-orange-50'; }
  useEffect(() => { if (score === 100) setShowConfetti(true); }, [score]);

  return (
    <div className="h-full bg-white flex flex-col items-center p-5 pt-8">
      <Confetti active={showConfetti} />
      <h2 className="text-lg font-bold text-slate-700 mb-4">結果発表</h2>
      <div className={`mb-5 flex flex-col items-center p-6 rounded-3xl ${rankBg} animate-bounce-in shadow-sm`}>
        <span className={`text-6xl font-black leading-none ${rankColor}`}>{rank}</span>
        <span className="text-sm font-bold text-slate-400 mt-1">RANK</span>
      </div>
      <div className="text-center mb-5">
        <div className="text-4xl font-black text-slate-800">{score}<span className="text-base font-normal ml-1">点</span></div>
        <div className="text-slate-500 text-sm mt-1">{correctCount} / {results.length} 正解</div>
      </div>
      <div className="w-full bg-slate-50 rounded-xl p-3 mb-5 max-h-40 overflow-y-auto">
        {results.map((r, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2 overflow-hidden">
              {r.isCorrect ? <Check size={16} className="text-green-500 shrink-0" /> : <X size={16} className="text-red-500 shrink-0" />}
              <div className="text-xs scale-90 origin-left"><MathRenderer node={r.display} /></div>
            </div>
            {!r.isCorrect && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded shrink-0 ml-2">{r.correctAns}</span>}
          </div>
        ))}
      </div>
      <div className="w-full space-y-2 mt-auto mb-3">
        <button onClick={onRetry} className="w-full py-4 rounded-xl bg-teal-400 text-white font-bold shadow-lg active:scale-98 transition-transform">もう一度挑戦</button>
        <button onClick={onHome} className="w-full py-4 rounded-xl bg-slate-200 text-slate-600 font-bold active:scale-98 transition-transform">ホームへ戻る</button>
      </div>
      <style>{`.animate-bounce-in{animation:bounceIn 0.6s cubic-bezier(0.68,-0.55,0.265,1.55)}@keyframes bounceIn{from{transform:scale(0) rotate(-180deg)}to{transform:scale(1) rotate(0)}}`}</style>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [screen, setScreen] = useState('splash');
  const [currentLevel, setCurrentLevel] = useState(5);
  const [lastResults, setLastResults] = useState([]);
  const [userStats, setUserStats] = useState({ todayCount: 0 });

  const goHome = () => setScreen('home');
  const startDrill = (lvl) => { setCurrentLevel(lvl); setScreen('drill'); };
  const finishSet = (results) => {
    setLastResults(results);
    setUserStats(prev => ({ ...prev, todayCount: prev.todayCount + results.filter(r => r.isCorrect).length }));
    setScreen('result');
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-100 shadow-2xl overflow-hidden relative font-sans text-slate-800">
      {screen === 'splash' && <SplashScreen onLogin={goHome} />}
      {screen === 'home' && <HomeScreen onStart={startDrill} userStats={userStats} />}
      {screen === 'drill' && <DrillScreen level={currentLevel} onFinishSet={finishSet} onQuit={goHome} />}
      {screen === 'result' && <ResultScreen results={lastResults} onHome={goHome} onRetry={() => startDrill(currentLevel)} />}
    </div>
  );
}
