import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, BarChart2, Settings, X, Play, RotateCcw, Home, User, Check, Zap, Target } from 'lucide-react';

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
const MathRenderer = ({ node, size = 'normal' }) => {
  if (!node) return null;

  const textSize = size === 'large' ? 'text-xl md:text-2xl' : 'text-base md:text-lg';
  const fracSize = size === 'large' ? 'text-base md:text-lg' : 'text-sm md:text-base';

  if (node.type === 'integer' || node.type === 'decimal') {
    return <span className={`mx-0.5 md:mx-1 ${textSize} font-semibold text-slate-800`}>{node.value}</span>;
  }
  if (node.type === 'fraction') {
    return (
      <span className="inline-flex flex-col items-center mx-1 md:mx-2 align-middle">
        <span className={`${fracSize} leading-tight px-1 text-slate-800 font-medium`}>{node.num}</span>
        <span className="w-full h-[2px] bg-slate-600 my-0.5"></span>
        <span className={`${fracSize} leading-tight px-1 text-slate-800 font-medium`}>{node.den}</span>
      </span>
    );
  }
  if (node.type === 'paren') {
    return (
      <span className="inline-flex items-center">
        <span className={`${textSize} text-slate-400 font-light mx-0.5`}>(</span>
        <MathRenderer node={node.content} size={size} />
        <span className={`${textSize} text-slate-400 font-light mx-0.5`}>)</span>
      </span>
    );
  }
  if (node.type === 'expr') {
    return (
      <span className="inline-flex items-center flex-wrap justify-center">
        <MathRenderer node={node.left} size={size} />
        <span className={`mx-1 md:mx-2 ${textSize} text-teal-600 font-bold`}>{node.op}</span>
        <MathRenderer node={node.right} size={size} />
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
      {[...Array(80)].map((_, i) => (
        <div key={i} className="absolute animate-fall" style={{
          left: `${Math.random() * 100}%`, top: '-20px',
          animationDelay: `${Math.random() * 0.8}s`, animationDuration: `${1.5 + Math.random()}s`
        }}>
          <div className="w-2 h-2 md:w-3 md:h-3 rotate-45" style={{
            backgroundColor: ['#14b8a6', '#f43f5e', '#f59e0b', '#22c55e', '#eab308', '#8b5cf6'][Math.floor(Math.random() * 6)]
          }} />
        </div>
      ))}
      <style>{`@keyframes fall { to { transform: translateY(100vh) rotate(720deg); opacity: 0; } } .animate-fall { animation: fall 2s ease-out forwards; }`}</style>
    </div>
  );
};

const KeyBtn = ({ char, onClick, type = 'default', className = '' }) => {
  const baseStyles = "font-bold rounded-xl shadow-sm flex items-center justify-center transition-all duration-150 active:scale-95 select-none";
  const sizeStyles = "h-12 md:h-14 lg:h-16 text-lg md:text-xl lg:text-2xl";

  let colorStyles = "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200";
  if (type === 'del') colorStyles = "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200";
  else if (type === 'clr') colorStyles = "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25";
  else if (type === 'op') colorStyles = "bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/25";
  else if (type === 'enter') colorStyles = "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30";

  return (
    <button onClick={() => onClick(char)} className={`${baseStyles} ${sizeStyles} ${colorStyles} ${className}`}>
      {char === 'DEL' ? <RotateCcw className="w-5 h-5 md:w-6 md:h-6" /> : char}
    </button>
  );
};

// --- 4. App Shell ---
const AppShell = ({ children }) => (
  <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50 flex items-center justify-center p-0 md:p-4 lg:p-8">
    <div className="w-full max-w-lg lg:max-w-xl min-h-screen md:min-h-0 md:h-auto md:max-h-[900px] md:rounded-3xl bg-white md:shadow-2xl md:shadow-slate-300/50 overflow-hidden relative flex flex-col">
      {children}
    </div>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
      * { font-family: 'Noto Sans JP', sans-serif; }
    `}</style>
  </div>
);

// --- 5. Screens ---
const SplashScreen = ({ onLogin }) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white via-teal-50/30 to-slate-50 p-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2314b8a6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-teal-400/10 animate-float-slow" />
      <div className="absolute bottom-32 right-8 w-16 h-16 rounded-full bg-amber-400/10 animate-float-medium" />
      <div className="absolute top-40 right-16 w-12 h-12 rounded-full bg-rose-400/10 animate-float-fast" />

      {/* Logo */}
      <div className={`text-center transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative inline-block mb-6">
          <div className="text-[140px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 leading-none tracking-tighter"
               style={{ fontFamily: 'Georgia, serif', textShadow: '0 4px 30px rgba(20, 184, 166, 0.3)' }}>
            Z
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent rounded-full" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
          Zan
          <span className="text-lg md:text-xl font-normal text-slate-400 ml-3 tracking-widest">斬</span>
        </h1>

        <p className="mt-6 text-slate-500 text-sm md:text-base tracking-[0.3em] font-medium">
          難問を、斬る。
        </p>
      </div>

      {/* CTA Button */}
      <div className={`w-full max-w-xs mt-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <button
          onClick={onLogin}
          className="w-full py-4 md:py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-lg font-bold shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
        >
          <Play fill="currentColor" className="w-5 h-5" />
          はじめる
        </button>
      </div>

      <style>{`
        @keyframes float-slow { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(5deg); } }
        @keyframes float-medium { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-15px) rotate(-5deg); } }
        @keyframes float-fast { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const HomeScreen = ({ onStart, userStats }) => {
  const [level, setLevel] = useState(5);
  const getLevelLabel = (l) => ["基礎","基礎","標準","標準","応用","応用","難関","難関","魔界","魔界"][l-1] || "魔界";
  const getLevelColor = (l) => {
    if (l <= 2) return "from-emerald-400 to-green-500";
    if (l <= 4) return "from-sky-400 to-blue-500";
    if (l <= 6) return "from-amber-400 to-orange-500";
    if (l <= 8) return "from-rose-400 to-red-500";
    return "from-purple-400 to-violet-600";
  };
  const getLevelBadge = (l) => {
    if (l <= 2) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (l <= 4) return "bg-sky-100 text-sky-700 border-sky-200";
    if (l <= 6) return "bg-amber-100 text-amber-700 border-amber-200";
    if (l <= 8) return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-purple-100 text-purple-700 border-purple-200";
  };
  const getLevelDesc = (l) => {
    if (l <= 2) return "分数・小数が混ざる基本問題";
    if (l <= 4) return "分数1〜2個を含む標準問題";
    if (l <= 6) return "答えが分数になる場合も";
    if (l <= 8) return "複雑な分数計算、小数も混合";
    return "地獄級。分数だらけ";
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-5 py-4 md:px-6 md:py-5 flex justify-between items-center bg-white border-b border-slate-100">
        <button className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
          <Settings className="text-slate-500 w-5 h-5" />
        </button>
        <h1 className="text-xl font-black bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">Zan</h1>
        <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <User className="text-slate-500 w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5">
        {/* Today's Progress */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-600">今日の正解数</span>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-5xl md:text-6xl font-black text-slate-800">{userStats.todayCount}</span>
            <span className="text-lg font-medium text-slate-400 mb-2">問</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                 style={{ width: `${Math.min(100, userStats.todayCount * 5)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">目標: 20問</p>
        </div>

        {/* Level Selector */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className={`text-5xl md:text-6xl font-black bg-gradient-to-r ${getLevelColor(level)} bg-clip-text text-transparent`}>
                Lv.{level}
              </div>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getLevelBadge(level)}`}>
              {getLevelLabel(level)}
            </span>
          </div>

          {/* Custom Slider */}
          <div className="relative mb-4">
            <input
              type="range"
              min="1"
              max="10"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer relative z-10"
              style={{
                background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${(level - 1) * 11.1}%, #e2e8f0 ${(level - 1) * 11.1}%, #e2e8f0 100%)`
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400 font-mono mb-4">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>

          <p className="text-sm text-slate-500 text-center bg-slate-50 rounded-xl py-3 px-4">{getLevelDesc(level)}</p>
        </div>

        {/* Start Button */}
        <button
          onClick={() => onStart(level)}
          className="w-full py-5 md:py-6 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xl font-bold shadow-xl shadow-teal-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:shadow-2xl hover:shadow-teal-500/40"
        >
          <Zap className="w-6 h-6" fill="currentColor" />
          スタート
        </button>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-slate-100 px-6 py-3 md:py-4 flex justify-around">
        <button className="flex flex-col items-center gap-1 text-teal-500">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">ホーム</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-300 hover:text-slate-400 transition-colors">
          <BarChart2 className="w-6 h-6" />
          <span className="text-[10px] font-bold">統計</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-300 hover:text-slate-400 transition-colors">
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold">実績</span>
        </button>
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
      setFeedback({ status: 'correct', msg: '正解！' });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    } else {
      const ans = problem.answer;
      let ansStr = ans.toString();
      if (ans.den !== 1 && ans.isTerminatingDecimal()) {
        ansStr = `${ans.toFloat()} (=${ans.toString()})`;
      }
      setFeedback({ status: 'wrong', msg: `正解: ${ansStr}` });
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

  if (!problem) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="animate-spin w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col bg-slate-50 ${shake ? 'animate-shake' : ''}`}>
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="p-4 md:p-5 flex justify-between items-center">
        <button onClick={onQuit} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center active:scale-95 transition-transform shadow-sm">
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-2 md:gap-3">
          {[...Array(MAX_QUESTIONS)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 ${
                i < results.length
                  ? (results[i].isCorrect ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-rose-400 shadow-lg shadow-rose-400/50')
                  : i === results.length
                    ? 'bg-teal-400 scale-125 shadow-lg shadow-teal-400/50'
                    : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20">
          Lv.{level}
        </div>
      </div>

      {/* Problem Display */}
      <div className="flex-1 px-4 md:px-6 flex flex-col justify-center">
        <div className={`bg-white rounded-3xl shadow-lg border-2 p-6 md:p-8 min-h-[160px] md:min-h-[200px] flex items-center justify-center transition-all duration-300
          ${feedback.status === 'correct' ? 'border-emerald-400 bg-emerald-50 shadow-emerald-100' :
            feedback.status === 'wrong' ? 'border-rose-400 bg-rose-50 shadow-rose-100' :
            'border-slate-100 shadow-slate-100'}`}>
          <div className="font-bold flex items-center flex-wrap justify-center gap-2">
            <MathRenderer node={problem.display} size="large" />
            <span className="mx-2 md:mx-4 text-2xl md:text-3xl text-slate-400">=</span>
            <span className="text-3xl md:text-4xl text-teal-500 font-black">?</span>
          </div>
        </div>

        {/* Feedback */}
        <div className="mt-4 h-8 flex justify-center items-center">
          {feedback.status === 'correct' && (
            <span className="text-emerald-500 font-bold text-lg md:text-xl animate-bounce flex items-center gap-2">
              <Check className="w-5 h-5" /> {feedback.msg}
            </span>
          )}
          {feedback.status === 'wrong' && (
            <span className="text-rose-500 font-bold text-sm md:text-base">{feedback.msg}</span>
          )}
        </div>
      </div>

      {/* Input Display */}
      <div className="px-4 md:px-6 mb-3">
        <input
          type="text"
          readOnly
          value={input}
          placeholder="答えを入力"
          className={`w-full h-14 md:h-16 text-2xl md:text-3xl font-mono text-center rounded-2xl border-2 outline-none bg-white transition-all duration-200
            ${feedback.status === 'correct' ? 'border-emerald-500 text-emerald-600' :
              feedback.status === 'wrong' ? 'border-rose-500 text-rose-600' :
              'border-teal-400 text-slate-700 focus:shadow-lg focus:shadow-teal-500/10'}`}
        />
      </div>

      {/* Keypad */}
      <div className="bg-white p-4 md:p-5 pt-5 md:pt-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100">
        <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-md mx-auto">
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
        <div className="h-6 md:h-8" /> {/* Safe area spacer */}
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

const ResultScreen = ({ results, onHome, onRetry }) => {
  const correctCount = results.filter(r => r.isCorrect).length;
  const score = Math.round((correctCount / results.length) * 100);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
    if (score === 100) setShowConfetti(true);
  }, [score]);

  let rank = 'C', rankGradient = 'from-slate-300 to-slate-400', rankBg = 'bg-slate-100';
  if (score === 100) { rank = 'S'; rankGradient = 'from-amber-400 via-yellow-400 to-amber-500'; rankBg = 'bg-gradient-to-br from-amber-50 to-yellow-50'; }
  else if (score >= 80) { rank = 'A'; rankGradient = 'from-sky-400 to-blue-500'; rankBg = 'bg-sky-50'; }
  else if (score >= 60) { rank = 'B'; rankGradient = 'from-orange-400 to-amber-500'; rankBg = 'bg-orange-50'; }

  return (
    <div className="flex-1 bg-white flex flex-col items-center p-6 md:p-8 overflow-y-auto">
      <Confetti active={showConfetti} />

      <h2 className={`text-xl md:text-2xl font-black text-slate-700 mb-6 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        結果発表
      </h2>

      {/* Rank Badge */}
      <div className={`mb-6 flex flex-col items-center p-8 md:p-10 rounded-3xl ${rankBg} shadow-lg transition-all duration-700 delay-200 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <span className={`text-7xl md:text-8xl font-black leading-none bg-gradient-to-br ${rankGradient} bg-clip-text text-transparent`}
              style={{ textShadow: score === 100 ? '0 4px 20px rgba(251, 191, 36, 0.3)' : 'none' }}>
          {rank}
        </span>
        <span className="text-sm font-bold text-slate-400 mt-2 tracking-widest">RANK</span>
      </div>

      {/* Score */}
      <div className={`text-center mb-6 transition-all duration-500 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-5xl md:text-6xl font-black text-slate-800">
          {score}<span className="text-xl font-normal text-slate-400 ml-1">点</span>
        </div>
        <div className="text-slate-500 text-base mt-2 flex items-center justify-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          {correctCount} / {results.length} 正解
        </div>
      </div>

      {/* Results List */}
      <div className={`w-full bg-slate-50 rounded-2xl p-4 mb-6 max-h-48 overflow-y-auto transition-all duration-500 delay-400 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        {results.map((r, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${r.isCorrect ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                {r.isCorrect ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-rose-500" />}
              </div>
              <div className="text-sm"><MathRenderer node={r.display} /></div>
            </div>
            {!r.isCorrect && <span className="text-xs text-rose-600 bg-rose-100 px-3 py-1 rounded-lg shrink-0 ml-2 font-medium">{r.correctAns}</span>}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className={`w-full space-y-3 mt-auto transition-all duration-500 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <button
          onClick={onRetry}
          className="w-full py-4 md:py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-xl shadow-teal-500/30 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          もう一度挑戦
        </button>
        <button
          onClick={onHome}
          className="w-full py-4 md:py-5 rounded-2xl bg-slate-100 text-slate-600 font-bold active:scale-[0.98] transition-all text-lg hover:bg-slate-200"
        >
          ホームへ戻る
        </button>
      </div>
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
    <AppShell>
      {screen === 'splash' && <SplashScreen onLogin={goHome} />}
      {screen === 'home' && <HomeScreen onStart={startDrill} userStats={userStats} />}
      {screen === 'drill' && <DrillScreen level={currentLevel} onFinishSet={finishSet} onQuit={goHome} />}
      {screen === 'result' && <ResultScreen results={lastResults} onHome={goHome} onRetry={() => startDrill(currentLevel)} />}
    </AppShell>
  );
}
