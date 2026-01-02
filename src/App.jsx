import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, BarChart2, Settings, X, Play, RotateCcw, Home, User, Check, Zap, Target, ChevronLeft, ChevronRight } from 'lucide-react';

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
    return <span className={`mx-0.5 md:mx-1 ${textSize} font-semibold text-slate-100`}>{node.value}</span>;
  }
  if (node.type === 'fraction') {
    return (
      <span className="inline-flex flex-col items-center mx-1 md:mx-2 align-middle">
        <span className={`${fracSize} leading-tight px-1 text-slate-100 font-medium`}>{node.num}</span>
        <span className="w-full h-[2px] bg-teal-400/60 my-0.5"></span>
        <span className={`${fracSize} leading-tight px-1 text-slate-100 font-medium`}>{node.den}</span>
      </span>
    );
  }
  if (node.type === 'paren') {
    return (
      <span className="inline-flex items-center">
        <span className={`${textSize} text-slate-500 font-light mx-0.5`}>(</span>
        <MathRenderer node={node.content} size={size} />
        <span className={`${textSize} text-slate-500 font-light mx-0.5`}>)</span>
      </span>
    );
  }
  if (node.type === 'expr') {
    return (
      <span className="inline-flex items-center flex-wrap justify-center">
        <MathRenderer node={node.left} size={size} />
        <span className={`mx-1 md:mx-2 ${textSize} text-teal-400 font-bold`}>{node.op}</span>
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
  const baseStyles = "font-bold rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 select-none";
  const sizeStyles = "h-12 md:h-14 lg:h-16 text-lg md:text-xl lg:text-2xl";

  let colorStyles = "bg-slate-700/50 hover:bg-slate-600/50 text-slate-100 border border-slate-600/50";
  if (type === 'del') colorStyles = "bg-rose-900/30 hover:bg-rose-800/40 text-rose-400 border border-rose-500/30";
  else if (type === 'clr') colorStyles = "bg-rose-500 hover:bg-rose-600 text-white";
  else if (type === 'op') colorStyles = "bg-teal-600/50 hover:bg-teal-500/50 text-teal-300 border border-teal-500/30";
  else if (type === 'enter') colorStyles = "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30";

  return (
    <button onClick={() => onClick(char)} className={`${baseStyles} ${sizeStyles} ${colorStyles} ${className}`}>
      {char === 'DEL' ? <RotateCcw className="w-5 h-5 md:w-6 md:h-6" /> : char}
    </button>
  );
};

// --- 4. App Shell ---
const AppShell = ({ children }) => (
  <div className="min-h-screen w-full flex items-center justify-center p-0 md:p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
    <div className="w-full max-w-[430px] h-screen md:rounded-2xl overflow-hidden relative flex flex-col md:border md:border-slate-700/50 md:shadow-2xl md:shadow-black/50" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)' }}>
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
  const [slashing, setSlashing] = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const handleTap = () => {
    if (slashing) return;
    setSlashing(true);
    setTimeout(() => onLogin(), 600);
  };

  return (
    <div
      onClick={handleTap}
      className="flex-1 flex flex-col items-center justify-center p-10 md:p-12 relative overflow-hidden cursor-pointer select-none"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)' }}
    >
      {/* Slash Lines - Decorative */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="slashGradient1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor="#14b8a6" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#14b8a6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="slashGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {/* Main slash line */}
        <line
          x1="5" y1="95" x2="40" y2="60"
          stroke="url(#slashGradient1)"
          strokeWidth="0.3"
          className={`transition-all duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Secondary slash line */}
        <line
          x1="60" y1="40" x2="95" y2="5"
          stroke="url(#slashGradient2)"
          strokeWidth="0.2"
          className={`transition-all duration-700 delay-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </svg>

      {/* Slash Transition Effect */}
      <div
        className={`absolute inset-0 bg-white z-50 transition-all duration-500 ease-out ${
          slashing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          clipPath: slashing
            ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
            : 'polygon(100% 0, 100% 0, 0 100%, 0 100%)'
        }}
      />

      {/* Logo Section - flexboxで中央配置 */}
      <div className={`flex-1 flex flex-col items-center justify-center text-center z-10 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Z Logo with metallic effect */}
        <div className="relative inline-block mb-4">
          <div
            className="text-[140px] md:text-[180px] font-black leading-none tracking-tighter"
            style={{
              fontFamily: 'Georgia, serif',
              background: 'linear-gradient(135deg, #5eead4 0%, #14b8a6 25%, #0d9488 50%, #14b8a6 75%, #5eead4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 30px rgba(20, 184, 166, 0.4))',
            }}
          >
            Z
          </div>
          {/* Shine effect */}
          <div
            className="absolute inset-0 text-[140px] md:text-[180px] font-black leading-none tracking-tighter opacity-30"
            style={{
              fontFamily: 'Georgia, serif',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Z
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Zan
          <span className="text-lg md:text-xl font-normal text-teal-400/70 ml-3 tracking-widest">斬</span>
        </h1>

        <p className="mt-6 text-teal-300/80 text-sm md:text-base tracking-[0.3em] font-medium">
          難問を、斬る。
        </p>
      </div>

      {/* Tap to Start - 下部に固定（shrink-0で潰れ防止） */}
      <div className={`shrink-0 pb-16 z-10 transition-all duration-700 delay-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-teal-400/60 text-xs md:text-sm tracking-[0.4em] font-medium animate-pulse-slow text-center">
          TAP TO START
        </p>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow { animation: pulse-slow 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const HomeScreen = ({ onStart, userStats }) => {
  const [level, setLevel] = useState(5);

  const getLevelLabel = (l) => ["基礎","基礎","標準","標準","応用","応用","難関","難関","魔界","魔界"][l-1] || "魔界";

  const getLevelColor = (l) => {
    if (l <= 2) return { bg: 'from-emerald-500 to-green-600', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (l <= 4) return { bg: 'from-sky-500 to-blue-600', text: 'text-sky-400', border: 'border-sky-500/30' };
    if (l <= 6) return { bg: 'from-amber-500 to-orange-600', text: 'text-amber-400', border: 'border-amber-500/30' };
    if (l <= 8) return { bg: 'from-rose-500 to-red-600', text: 'text-rose-400', border: 'border-rose-500/30' };
    return { bg: 'from-purple-500 to-violet-700', text: 'text-purple-400', border: 'border-purple-500/30' };
  };

  const getLevelDesc = (l) => {
    if (l <= 2) return "分数・小数が混ざる基本問題";
    if (l <= 4) return "分数1〜2個を含む標準問題";
    if (l <= 6) return "答えが分数になる場合も";
    if (l <= 8) return "複雑な分数計算、小数も混合";
    return "地獄級。分数だらけ";
  };

  const colors = getLevelColor(level);

  const decreaseLevel = () => setLevel(l => Math.max(1, l - 1));
  const increaseLevel = () => setLevel(l => Math.min(10, l + 1));

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* Header - flexboxで配置（shrink-0で潰れ防止） */}
      <div className="shrink-0 px-6 py-6 flex justify-between items-center">
        <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <Settings className="text-slate-400 w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
          Zan
        </h1>
      </div>

      {/* 上部スペーサー - 1の比率 */}
      <div className="flex-1" />

      {/* Main Content - 固定サイズ */}
      <div className="shrink-0 px-8 md:px-12 lg:px-16">
        {/* Today's Stats */}
        <div className="text-center mb-6">
          <p className="text-slate-500 text-sm leading-relaxed">
            今日: <span className="text-teal-400 font-bold">{userStats.todayCount}</span> 問正解
          </p>
        </div>

        {/* Level Card - 内部余白拡大 */}
        <div className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-10 md:p-14 border ${colors.border} backdrop-blur-sm`}>
          {/* Level Number - 余白拡大 */}
          <div className="text-center mb-10">
            <div className={`text-7xl md:text-8xl font-black bg-gradient-to-br ${colors.bg} bg-clip-text text-transparent leading-none`}>
              Lv.{level}
            </div>
            <div className={`text-lg md:text-xl font-bold ${colors.text} mt-4 tracking-wider`}>
              {getLevelLabel(level)}
            </div>
          </div>

          {/* Left/Right Navigation - 余白拡大 */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={decreaseLevel}
              disabled={level <= 1}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                level <= 1
                  ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
              }`}
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            {/* Level Dots - 間隔拡大 */}
            <div className="flex gap-2.5">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i + 1 === level
                      ? `bg-gradient-to-br ${colors.bg} scale-125`
                      : i + 1 < level
                        ? 'bg-teal-500/50'
                        : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={increaseLevel}
              disabled={level >= 10}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                level >= 10
                  ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
              }`}
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </div>

          {/* Description - 行間拡大 */}
          <p className="text-sm md:text-base text-slate-400 text-center leading-loose">
            {getLevelDesc(level)}
          </p>
        </div>
      </div>

      {/* 下部スペーサー - 2の比率（上部の2倍）でボタンを中間に */}
      <div className="flex-[2]" />

      {/* Start Button - 中間位置に配置 */}
      <div className="shrink-0 px-8 pb-10">
        <button
          onClick={() => onStart(level)}
          className={`w-full py-5 md:py-6 rounded-2xl bg-gradient-to-r ${colors.bg} text-white text-xl font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all`}
          style={{ boxShadow: '0 10px 40px rgba(20, 184, 166, 0.3)' }}
        >
          <Zap className="w-6 h-6" fill="currentColor" />
          斬り込む
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
    <div className="flex-1 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="animate-spin w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col ${shake ? 'animate-shake' : ''}`} style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
      <Confetti active={showConfetti} />

      {/* Header - 余白拡大 */}
      <div className="px-5 py-4 md:px-6 md:py-5 flex justify-between items-center">
        <button onClick={onQuit} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center active:scale-95 transition-all hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>

        {/* Progress Diamonds - 間隔拡大 */}
        <div className="flex items-center gap-3">
          {[...Array(MAX_QUESTIONS)].map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rotate-45 transition-all duration-300 ${
                i < results.length
                  ? (results[i].isCorrect
                      ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                      : 'bg-rose-400 shadow-lg shadow-rose-400/50')
                  : i === results.length
                    ? 'bg-teal-400 scale-125 shadow-lg shadow-teal-400/50'
                    : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
          Lv.{level}
        </div>
      </div>

      {/* Problem Display - 余白拡大 */}
      <div className="flex-1 px-6 md:px-8 flex flex-col justify-center gap-8">
        <div className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border p-8 md:p-10 min-h-[160px] md:min-h-[200px] flex items-center justify-center transition-all duration-300
          ${feedback.status === 'correct' ? 'border-emerald-500/50 bg-emerald-900/30' :
            feedback.status === 'wrong' ? 'border-rose-500/50 bg-rose-900/30' :
            'border-slate-700/50'}`}>
          <div className="font-bold flex items-center flex-wrap justify-center gap-3">
            <MathRenderer node={problem.display} size="large" />
            <span className="mx-3 md:mx-5 text-2xl md:text-3xl text-slate-500">=</span>
            <span className="text-3xl md:text-4xl text-teal-400 font-black">?</span>
          </div>
        </div>

        {/* Feedback - 余白拡大 */}
        <div className="h-8 flex justify-center items-center">
          {feedback.status === 'correct' && (
            <span className="text-emerald-400 font-bold text-lg md:text-xl animate-bounce flex items-center gap-2">
              <Check className="w-5 h-5" /> {feedback.msg}
            </span>
          )}
          {feedback.status === 'wrong' && (
            <span className="text-rose-400 font-bold text-sm md:text-base">{feedback.msg}</span>
          )}
        </div>
      </div>

      {/* Input Display - 余白拡大 */}
      <div className="px-6 md:px-8 mb-4">
        <input
          type="text"
          readOnly
          value={input}
          placeholder="答えを入力"
          className={`w-full h-16 md:h-18 text-2xl md:text-3xl font-mono text-center rounded-xl border-2 outline-none transition-all duration-200
            ${feedback.status === 'correct' ? 'border-emerald-500 bg-emerald-900/30 text-emerald-400' :
              feedback.status === 'wrong' ? 'border-rose-500 bg-rose-900/30 text-rose-400' :
              'border-teal-500/50 bg-slate-800/50 text-white placeholder-slate-500'}`}
        />
      </div>

      {/* Keypad - 余白拡大 */}
      <div className="bg-slate-900/80 backdrop-blur-sm p-5 md:p-6 pt-6 md:pt-7 rounded-t-2xl border-t border-slate-700/50">
        <div className="grid grid-cols-4 gap-2.5 md:gap-3 max-w-md mx-auto">
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
        <div className="h-8 md:h-10" /> {/* Safe area spacer - 拡大 */}
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
  const [slashAnimated, setSlashAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
    if (score === 100) {
      setShowConfetti(true);
      setTimeout(() => setSlashAnimated(true), 300);
    }
  }, [score]);

  let rank = 'C', rankGradient = 'from-slate-400 to-slate-500', rankBorder = 'border-slate-600/30', rankGlow = '';
  if (score === 100) {
    rank = 'S';
    rankGradient = 'from-amber-400 via-yellow-300 to-amber-500';
    rankBorder = 'border-amber-500/50';
    rankGlow = 'shadow-2xl shadow-amber-500/30';
  } else if (score >= 80) {
    rank = 'A';
    rankGradient = 'from-sky-400 to-blue-500';
    rankBorder = 'border-sky-500/30';
    rankGlow = 'shadow-lg shadow-sky-500/20';
  } else if (score >= 60) {
    rank = 'B';
    rankGradient = 'from-orange-400 to-amber-500';
    rankBorder = 'border-orange-500/30';
  }

  return (
    <div className="flex-1 flex flex-col relative" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
      <Confetti active={showConfetti} />

      {/* Background Slash Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="resultSlash1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <line x1="5" y1="100" x2="35" y2="65" stroke="url(#resultSlash1)" strokeWidth="0.25" />
        <line x1="65" y1="35" x2="95" y2="0" stroke="url(#resultSlash1)" strokeWidth="0.25" />
        <line x1="0" y1="55" x2="20" y2="30" stroke="url(#resultSlash1)" strokeWidth="0.15" />
        <line x1="80" y1="70" x2="100" y2="45" stroke="url(#resultSlash1)" strokeWidth="0.15" />
      </svg>

      {/* S-Rank Slash Effect */}
      {score === 100 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={`absolute w-[200%] h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent transform -rotate-45 transition-all duration-700 ease-out ${
              slashAnimated ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
            }`}
            style={{ top: '30%', left: '-50%' }}
          />
          <div
            className={`absolute w-[200%] h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent transform -rotate-45 transition-all duration-700 ease-out delay-150 ${
              slashAnimated ? 'translate-x-0 opacity-80' : '-translate-x-full opacity-0'
            }`}
            style={{ top: '35%', left: '-50%' }}
          />
        </div>
      )}

      {/* Header Area - shrink-0で潰れ防止 */}
      <div className="shrink-0 flex flex-col items-center pt-12 pb-4 px-8 z-10">
        {/* Title */}
        <h2 className={`text-xl md:text-2xl font-black text-slate-300 mb-6 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          結果発表
        </h2>

        {/* Rank Badge */}
        <div className={`mb-6 flex flex-col items-center px-12 py-8 rounded-3xl bg-slate-800/60 backdrop-blur-sm border ${rankBorder} ${rankGlow} transition-all duration-700 delay-200 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <span className={`text-6xl md:text-7xl font-black leading-none bg-gradient-to-br ${rankGradient} bg-clip-text text-transparent`}>
            {rank}
          </span>
          <span className="text-sm font-bold text-slate-500 mt-3 tracking-widest">RANK</span>
        </div>

        {/* Score */}
        <div className={`text-center transition-all duration-500 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-4xl md:text-5xl font-black text-white">
            {score}<span className="text-lg font-normal text-slate-500 ml-1">点</span>
          </div>
          <div className="text-slate-400 text-sm mt-2 flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {correctCount} / {results.length} 正解
          </div>
        </div>
      </div>

      {/* Results List - flex-1で残りスペースを使用 */}
      <div className={`flex-1 w-full px-6 overflow-y-auto z-10 transition-all duration-500 delay-400 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
          <div className="flex flex-col gap-3">
            {results.map((r, i) => (
              <div key={i} className="relative flex justify-between items-center p-4 bg-slate-900/60 rounded-lg border border-slate-700/30 overflow-hidden">
                {/* 左端のアクセントライン */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${r.isCorrect ? 'bg-teal-500' : 'bg-rose-500/80'}`} />

                <div className="flex items-center gap-4 pl-3 overflow-hidden">
                  {/* 問題番号 */}
                  <span className="text-xs font-mono text-slate-500 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  {/* 計算式 */}
                  <div className="text-sm leading-relaxed"><MathRenderer node={r.display} /></div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  {r.isCorrect ? (
                    <span className="text-xs text-teal-400 font-medium">Correct</span>
                  ) : (
                    <span className="text-xs text-rose-400 bg-rose-500/20 px-2 py-1 rounded font-medium border border-rose-500/30">{r.correctAns}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons - shrink-0で潰れ防止 */}
      <div className={`shrink-0 w-full px-8 pb-10 pt-4 z-10 transition-all duration-500 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="space-y-4">
        <button
          onClick={onRetry}
          className="w-full py-5 md:py-6 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-xl shadow-teal-500/30 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-5 h-5" />
          もう一度挑戦
        </button>
        <button
          onClick={onHome}
          className="w-full py-5 md:py-6 rounded-2xl bg-slate-700/50 text-slate-300 font-bold active:scale-[0.98] transition-all text-lg hover:bg-slate-600/50 border border-slate-600/50"
        >
          ホームへ戻る
        </button>
        </div>
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
