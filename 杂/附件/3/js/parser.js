const LLMParser = (() => {
  'use strict';

  /* ========== AI 提供商配置 ========== */
  const PROVIDERS = [
    {
      id: 'deepseek',
      name: 'DeepSeek',
      baseURL: 'https://api.deepseek.com/v1',
      models: [
        { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash (无思考)', noThinking: { thinking: { type: 'disabled' } } }
      ],
      note: 'deepseek-chat / deepseek-reasoner 已于 2026/07/24 弃用，统一使用 deepseek-v4-flash 并强制关闭思考。'
    },
    {
      id: 'openai',
      name: 'OpenAI',
      baseURL: 'https://api.openai.com/v1',
      models: [
        { id: 'gpt-4o', name: 'GPT-4o', noThinking: null },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', noThinking: null },
        { id: 'gpt-4.1', name: 'GPT-4.1', noThinking: null },
        { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', noThinking: null },
        { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', noThinking: null }
      ],
      note: 'GPT 标准模型默认不启用思维链，直接输出。o 系列推理模型已排除。'
    },
    {
      id: 'groq',
      name: 'Groq',
      baseURL: 'https://api.groq.com/openai/v1',
      models: [
        { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', noThinking: null },
        { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B', noThinking: null }
      ],
      note: 'Groq 提供高速推理，模型默认无思维链。'
    },
    {
      id: 'xai',
      name: 'xAI (Grok)',
      baseURL: 'https://api.x.ai/v1',
      models: [
        { id: 'grok-3-beta', name: 'Grok 3 Beta', noThinking: null }
      ],
      note: 'Grok 标准模式无思维链输出。'
    },
    {
      id: 'qwen',
      name: '通义千问 (Qwen)',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      models: [
        { id: 'qwen-turbo', name: 'Qwen Turbo', noThinking: null },
        { id: 'qwen-plus', name: 'Qwen Plus', noThinking: null },
        { id: 'qwen-max', name: 'Qwen Max', noThinking: null }
      ],
      note: '通义千问标准模型默认无思维链。需在阿里云 DashScope 申请 API Key。'
    },
    {
      id: 'zhipu',
      name: '智谱 AI (GLM)',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      models: [
        { id: 'glm-4-flash', name: 'GLM-4 Flash', noThinking: null },
        { id: 'glm-4-air', name: 'GLM-4 Air', noThinking: null },
        { id: 'glm-4', name: 'GLM-4', noThinking: null }
      ],
      note: 'GLM 标准模型默认无思维链输出。'
    },
    {
      id: 'siliconflow',
      name: '硅基流动 (SiliconFlow)',
      baseURL: 'https://api.siliconflow.cn/v1',
      models: [
        { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3 (硅基)', noThinking: null },
        { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek-R1 (硅基 · 无思考)', noThinking: { thinking: { type: 'disabled' } } }
      ],
      note: '硅基流动托管的 DeepSeek-R1 已配置无思考模式。'
    }
  ];

  /* ========== 会话内存配置（不持久化，刷新即清空） ========== */
  let _providerId = 'deepseek';
  let _model = 'deepseek-v4-flash';
  let _apiKey = '';

  const SYSTEM_PROMPT = `【重要：直接输出 JSON，禁止任何推理或 Markdown。】

你是一台哲学公式编译器。根据用户的议题，输出一个 JSON：

{"formula":"数学公式","ai_confidence":0.92,"meta_proposition":"15字以内本质陈述"}

变量 q1-q4 取值 0~1：
q1: 0=个体神圣, 1=集体至上
q2: 0=绝对平权, 1=天然阶层
q3: 0=环境决定, 1=自由意志
q4: 0=保守存量, 1=激进增量

公式规则：乘法=AND, (1-q)=NOT。可用 sin/cos/tan/log/exp/sqrt/abs, pow 等、q^2/q^3 幂次、常数 pi/e/φ、交叉项。禁用希腊字母。

示例：
"对高收入群体征收高额遗产税"
{"formula":"0.65*q1^2*(1-q2)+0.25*q1*(1-q3)+0.1*(1-q4)","ai_confidence":0.92,"meta_proposition":"财富应被社会重新分配"}`;

  /* ========== 配置管理（仅会话内存） ========== */

  function getConfig() {
    return { providerId: _providerId, model: _model, apiKey: _apiKey };
  }

  function saveConfig(providerId, model, apiKey) {
    _providerId = providerId;
    _model = model;
    if (apiKey !== undefined) _apiKey = apiKey;
  }

  function hasKey() {
    return !!_apiKey;
  }

  function getProvider(providerId) {
    return PROVIDERS.find(p => p.id === providerId) || PROVIDERS[0];
  }

  function getModelInfo(providerId, modelId) {
    const provider = getProvider(providerId);
    return provider.models.find(m => m.id === modelId) || provider.models[0];
  }

  function getProviders() {
    return PROVIDERS;
  }

  /* ========== 复杂度计算 ========== */

  function calcComplexity(text) {
    const t = text.trim();
    const unique = new Set(t).size;
    return t.length * (0.5 + unique / Math.max(t.length, 1) * 0.5);
  }

  /* ========== API 调用 ========== */

  async function callOpenAICompatible(proposition, apiKey, providerId, modelId, advanced) {
    const provider = getProvider(providerId);
    const modelInfo = getModelInfo(providerId, modelId);

    let url = provider.baseURL.replace(/\/+$/, '');
    if (!url.endsWith('/chat/completions')) {
      url += '/chat/completions';
    }

    const adv = advanced || { threshold: 0.5, correlation: 0.7, pi: Math.PI, e: Math.E, phi: 1.618 };
    const rawComplexity = calcComplexity(proposition);
    const normComplexity = Math.tanh(rawComplexity / 30);
    const effective = adv.threshold + adv.correlation * (normComplexity - adv.threshold);
    const hint = effective < 0.25 ? '【复杂度：低，使用线性公式】'
      : effective < 0.6 ? '【复杂度：中，使用幂次和交叉项】'
      : '【复杂度：高，使用 sin/cos/log/exp/sqrt 等高级函数】';
    const constHint = '【可用常数：π=' + adv.pi.toFixed(4) + ' e=' + adv.e.toFixed(4) + ' φ=' + adv.phi.toFixed(4) + '】';
    const userMsg = hint + constHint + ' ' + proposition;

    const body = {
      model: modelId,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg }
      ],
      temperature: 0,
      max_tokens: 400
    };

    // 合并提供商特定的无思考参数
    if (modelInfo.noThinking) {
      Object.assign(body, modelInfo.noThinking);
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      let errMsg = 'HTTP ' + resp.status;
      try {
        const err = await resp.json();
        errMsg += ': ' + (err.error?.message || err.message || JSON.stringify(err).substring(0, 200));
      } catch (e) {
        errMsg += ': ' + resp.statusText;
      }
      throw new Error('API 错误：' + errMsg);
    }

    const data = await resp.json();
    const choice = data.choices && data.choices[0] || {};
    const msg = choice.message || {};
    const raw = (msg.content || '').trim();
    if (!raw) {
      throw new Error('AI 返回了空内容。请检查模型名称是否正确。响应：' + JSON.stringify(data).substring(0, 200));
    }
    return parseResponse(raw);
  }

  function parseResponse(raw) {
    let cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
    const matches = [...cleaned.matchAll(/\{[\s\S]*?\}/g)];
    if (matches.length === 0) {
      const lastBrace = cleaned.lastIndexOf('{');
      if (lastBrace >= 0) {
        throw new Error('AI 返回被截断（token 不足），请重试。末尾：' + cleaned.substring(lastBrace, lastBrace + 500));
      }
      throw new Error('AI 返回格式异常，无法提取 JSON：' + raw.substring(0, 150));
    }
    const parsed = JSON.parse(matches[matches.length - 1][0]);
    if (!parsed.formula || typeof parsed.ai_confidence !== 'number') {
      throw new Error('AI 返回缺少必要字段：' + JSON.stringify(parsed));
    }
    return {
      formula: parsed.formula,
      ai_confidence: parsed.ai_confidence,
      meta_proposition: parsed.meta_proposition || ''
    };
  }

  async function parse(proposition, config, advanced) {
    const cfg = config || getConfig();
    if (!cfg.apiKey) throw new Error('请先设置 API Key');
    return await callOpenAICompatible(proposition, cfg.apiKey, cfg.providerId, cfg.model, advanced);
  }

  return {
    parse, getConfig, saveConfig, hasKey,
    getProvider, getModelInfo, getProviders,
    SYSTEM_PROMPT, PROVIDERS
  };
})();
