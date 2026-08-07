const VMEngine = (() => {
  'use strict';

  /* ========== 常量 ========== */
  let _pi = Math.PI, _e = Math.E, _phi = 1.618033988749895;

  function setConstants(pi, e, phi) {
    _pi = pi; _e = e; _phi = phi;
  }

  /* ========== 安全的数学表达式解析器 ========== */

  const TOK = {
    NUM: 'NUM', VAR: 'VAR', CONST: 'CONST', FUNC: 'FUNC',
    LPAREN: 'LPAREN', RPAREN: 'RPAREN',
    PLUS: 'PLUS', MINUS: 'MINUS', MUL: 'MUL', DIV: 'DIV', POW: 'POW',
    COMMA: 'COMMA', EOF: 'EOF'
  };

  const FUNC_NAMES = new Set(['sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'abs', 'pow', 'ceil', 'floor']);

  function tokenize(expr) {
    const tokens = [];
    let i = 0;
    const len = expr.length;

    while (i < len) {
      const ch = expr[i];

      if (/\s/.test(ch)) { i++; continue; }

      if (/\d/.test(ch) || (ch === '.' && i + 1 < len && /\d/.test(expr[i + 1]))) {
        let num = '';
        while (i < len && /[\d.]/.test(expr[i])) { num += expr[i]; i++; }
        const val = parseFloat(num);
        if (isNaN(val)) throw new Error('无效数字: ' + num);
        tokens.push({ type: TOK.NUM, value: val });
        continue;
      }

      if (/[a-zA-Z_]/.test(ch)) {
        let name = '';
        while (i < len && /[a-zA-Z0-9_]/.test(expr[i])) { name += expr[i]; i++; }
        if (FUNC_NAMES.has(name)) {
          tokens.push({ type: TOK.FUNC, value: name });
        } else if (name === 'pi' || name === 'e' || name === 'E' || name === 'phi') {
          tokens.push({ type: TOK.CONST, value: name });
        } else if (/^q[1-4]$/.test(name)) {
          tokens.push({ type: TOK.VAR, value: name });
        } else {
          throw new Error('未知标识符: ' + name);
        }
        continue;
      }

      switch (ch) {
        case '+': tokens.push({ type: TOK.PLUS }); break;
        case '-': tokens.push({ type: TOK.MINUS }); break;
        case '*': tokens.push({ type: TOK.MUL }); break;
        case '/': tokens.push({ type: TOK.DIV }); break;
        case '^': tokens.push({ type: TOK.POW }); break;
        case '(': tokens.push({ type: TOK.LPAREN }); break;
        case ')': tokens.push({ type: TOK.RPAREN }); break;
        case ',': tokens.push({ type: TOK.COMMA }); break;
        default: throw new Error('非法字符: ' + ch);
      }
      i++;
    }

    tokens.push({ type: TOK.EOF });
    return tokens;
  }

  class Parser {
    constructor(tokens) {
      this.tokens = tokens;
      this.pos = 0;
    }

    peek() { return this.tokens[this.pos]; }
    consume() { return this.tokens[this.pos++]; }
    expect(type) {
      const t = this.consume();
      if (t.type !== type) throw new Error('期望 ' + type + '，实际 ' + t.type);
      return t;
    }

    parse() {
      const ast = this.expr();
      if (this.peek().type !== TOK.EOF) {
        throw new Error('表达式末尾有意外token: ' + this.peek().type);
      }
      return ast;
    }

    expr() {
      let left = this.term();
      while (this.peek().type === TOK.PLUS || this.peek().type === TOK.MINUS) {
        const op = this.consume().type;
        const right = this.term();
        left = { type: 'binop', op, left, right };
      }
      return left;
    }

    term() {
      let left = this.factor();
      while (this.peek().type === TOK.MUL || this.peek().type === TOK.DIV) {
        const op = this.consume().type;
        const right = this.factor();
        left = { type: 'binop', op, left, right };
      }
      return left;
    }

    factor() {
      let left = this.unary();
      while (this.peek().type === TOK.POW) {
        this.consume();
        const right = this.unary();
        left = { type: 'binop', op: TOK.POW, left, right };
      }
      return left;
    }

    unary() {
      if (this.peek().type === TOK.MINUS) {
        this.consume();
        return { type: 'unary', op: TOK.MINUS, operand: this.primary() };
      }
      return this.primary();
    }

    primary() {
      const t = this.peek();

      if (t.type === TOK.NUM) {
        this.consume();
        return { type: 'num', value: t.value };
      }

      if (t.type === TOK.VAR) {
        this.consume();
        return { type: 'var', name: t.value };
      }

      if (t.type === TOK.CONST) {
        this.consume();
        return { type: 'const', name: t.value };
      }

      if (t.type === TOK.FUNC) {
        const funcName = t.value;
        this.consume();
        this.expect(TOK.LPAREN);

        if (funcName === 'pow') {
          const arg1 = this.expr();
          this.expect(TOK.COMMA);
          const arg2 = this.expr();
          this.expect(TOK.RPAREN);
          return { type: 'func2', name: 'pow', arg1, arg2 };
        } else {
          const arg = this.expr();
          this.expect(TOK.RPAREN);
          return { type: 'func', name: funcName, arg };
        }
      }

      if (t.type === TOK.LPAREN) {
        this.consume();
        const node = this.expr();
        this.expect(TOK.RPAREN);
        return node;
      }

      throw new Error('意外的token: ' + JSON.stringify(t));
    }
  }

  function evaluate(ast, vars) {
    switch (ast.type) {
      case 'num':
        return ast.value;
      case 'var':
        if (vars.hasOwnProperty(ast.name)) return vars[ast.name];
        throw new Error('未定义变量: ' + ast.name);
      case 'const': {
        switch (ast.name === 'E' ? 'e' : ast.name) {
          case 'pi': return _pi;
          case 'e': return _e;
          case 'phi': return _phi;
        }
        throw new Error('未知常量: ' + ast.name);
      }
      case 'unary':
        return -evaluate(ast.operand, vars);
      case 'binop': {
        const l = evaluate(ast.left, vars);
        const r = evaluate(ast.right, vars);
        switch (ast.op) {
          case TOK.PLUS: return l + r;
          case TOK.MINUS: return l - r;
          case TOK.MUL: return l * r;
          case TOK.DIV:
            if (r === 0) throw new Error('除零错误');
            return l / r;
          case TOK.POW:
            if (l < 0 && !Number.isInteger(r)) return NaN;
            return Math.pow(l, r);
        }
        throw new Error('未知运算符: ' + ast.op);
      }
      case 'func': {
        const a = evaluate(ast.arg, vars);
        switch (ast.name) {
          case 'sin': return Math.sin(a);
          case 'cos': return Math.cos(a);
          case 'tan': return Math.tan(a);
          case 'log': return Math.log(a);
          case 'exp': return Math.exp(a);
          case 'sqrt': return Math.sqrt(a);
          case 'abs': return Math.abs(a);
          case 'ceil': return Math.ceil(a);
          case 'floor': return Math.floor(a);
        }
        throw new Error('未知函数: ' + ast.name);
      }
      case 'func2': {
        if (ast.name === 'pow') {
          return Math.pow(evaluate(ast.arg1, vars), evaluate(ast.arg2, vars));
        }
        throw new Error('未知二元函数: ' + ast.name);
      }
      default:
        throw new Error('未知AST节点: ' + ast.type);
    }
  }

  // AST 缓存 —— 同一公式只解析一次
  let _cachedFormula = null;
  let _cachedAST = null;

  function safeEval(formula, vars) {
    const cleaned = formula
      .replace(/Math\./g, '')
      .replace(/π/g, 'pi')
      .replace(/×/g, '*')
      .replace(/÷/g, '/');

    // 拒绝明显危险字符
    if (/[{}[\]"'`;=<>!&|\\?#@$%]/.test(cleaned)) {
      throw new Error('公式包含非法字符，已拒绝执行。');
    }

    // 解析并缓存 AST
    if (cleaned !== _cachedFormula) {
      const tokens = tokenize(cleaned);
      const parser = new Parser(tokens);
      try {
        _cachedAST = parser.parse();
        _cachedFormula = cleaned;
      } catch (e) {
        throw new Error('公式语法错误：' + e.message);
      }
    }

    try {
      return evaluate(_cachedAST, vars);
    } catch (e) {
      throw new Error('公式求值错误：' + e.message);
    }
  }

  /* ========== 业务逻辑 ========== */

  function normalizeApproval(raw) {
    if (typeof raw !== 'number' || isNaN(raw)) return 0;
    return Math.max(0, Math.min(100, raw * 100));
  }

  function userCertainty(sliders) {
    const sum = sliders.reduce((s, q) => s + Math.abs(q - 0.5) * 2, 0);
    return sum / 4;
  }

  function finalConfidence(aiConf, sliders) {
    return aiConf * 0.7 + userCertainty(sliders) * 0.3;
  }

  function compute(sliders, formula, aiConf) {
    const vars = { q1: sliders[0], q2: sliders[1], q3: sliders[2], q4: sliders[3] };
    const raw = safeEval(formula, vars);
    return {
      approval: Math.round(normalizeApproval(raw) * 100) / 100,
      confidence: Math.round(finalConfidence(aiConf, sliders) * 1000) / 1000,
      raw: Math.round(raw * 1000) / 1000
    };
  }

  return { compute, safeEval, userCertainty, finalConfidence, normalizeApproval, setConstants };
})();
