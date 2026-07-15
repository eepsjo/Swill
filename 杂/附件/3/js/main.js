const SBXApp = (() => {
  'use strict';

  const MOTTO = '人类永远着迷于两件事：看清自己的灵魂、预测他人的荒谬';

  let currentFormula = null;
  let currentResult = null;
  let currentSliders = [0.5, 0.5, 0.5, 0.5];

  function $(id) { return document.getElementById(id); }

  /* 安全绑定：仅当元素存在时绑定事件 */
  function bindIf(id, event, handler) {
    const el = $(id);
    if (el) el.addEventListener(event, handler);
  }

  function init() {
    setupMottoObserver();

    ['q1', 'q2', 'q3', 'q4'].forEach((id, i) => {
      const slider = $(id);
      const display = $(id + '_val');
      if (!slider || !display) return;
      slider.addEventListener('input', () => {
        const v = parseFloat(slider.value);
        display.textContent = v.toFixed(2);
        currentSliders[i] = v;
      });
    });

    bindIf('btn_ai_parse', 'click', handleAIParse);
    bindIf('btn_chart_toggle', 'click', toggleChartMode);
    bindIf('btn_toggle_settings', 'click', toggleSettings);
    bindIf('btn_close_settings', 'click', toggleSettings);
    bindIf('btn_save_key', 'click', handleSaveKey);
    bindIf('btn_advanced', 'click', () => { const el = $('advanced_modal'); if (el) el.classList.toggle('hidden'); });
    bindIf('btn_close_advanced', 'click', () => { const el = $('advanced_modal'); if (el) el.classList.add('hidden'); });
    bindIf('btn_save_advanced', 'click', () => { const el = $('advanced_modal'); if (el) el.classList.add('hidden'); });
    bindIf('btn_refresh', 'click', handleCompute);

    bindIf('adv_threshold', 'input', () => { const el = $('adv_threshold_val'); if (el) el.textContent = parseFloat($('adv_threshold').value).toFixed(2); });
    bindIf('adv_correlation', 'input', () => { const el = $('adv_correlation_val'); if (el) el.textContent = parseFloat($('adv_correlation').value).toFixed(2); });

    bindIf('sensitivity_dim', 'change', handleSensitivity);
    bindIf('sensitivity_dim_x', 'change', handleSensitivity);
    bindIf('sensitivity_dim_y', 'change', handleSensitivity);

    // 初始状态：3D 控件隐藏
    const dim3d = $('sensitivity_dim3d_ctrls');
    if (dim3d) dim3d.style.display = 'none';

    bindIf('pro_profile', 'click', () => applyProfile('pro'));
    bindIf('con_profile', 'click', () => applyProfile('con'));

    bindIf('btn_help', 'click', () => { const el = $('help_modal'); if (el) el.classList.toggle('hidden'); });
    bindIf('btn_close_help', 'click', () => { const el = $('help_modal'); if (el) el.classList.add('hidden'); });

    // 提供商切换 → 刷新模型列表
    bindIf('api_provider', 'change', onProviderChange);

    buildProviderUI();
    loadKeyConfig();

    bindIf('proposition', 'keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAIParse();
      }
    });
  }

  /* 初始化提供商下拉 */
  function buildProviderUI() {
    const sel = $('api_provider');
    if (!sel) return;
    sel.innerHTML = '';
    LLMParser.getProviders().forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  }

  /* 根据提供商填充模型下拉 */
  function populateModels(providerId) {
    const sel = $('api_model');
    if (!sel) return;
    sel.innerHTML = '';
    const provider = LLMParser.getProvider(providerId);
    provider.models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      sel.appendChild(opt);
    });
    const note = $('api_note');
    if (note) note.textContent = provider.note || '';
  }

  function onProviderChange() {
    populateModels($('api_provider').value);
  }

  let mottoPlayed = false;

  function setupMottoObserver() {
    const el = $('motto_header');
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !mottoPlayed) {
          mottoPlayed = true;
          observer.unobserve(el);
          animateMottoOnce();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(el);
  }

  function animateMottoOnce() {
    const el = $('motto_text');
    const cursor = $('motto_cursor');
    if (!el) return;
    let i = 0;
    function type() {
      if (i <= MOTTO.length) {
        el.textContent = MOTTO.substring(0, i);
        i++;
        setTimeout(type, 70);
      } else {

        if (cursor) cursor.classList.add('done');
      }
    }
    type();
  }

  function loadKeyConfig() {
    const cfg = LLMParser.getConfig();
    const providerSel = $('api_provider');
    if (providerSel) providerSel.value = cfg.providerId;
    populateModels(cfg.providerId);
    const modelSel = $('api_model');
    if (modelSel) modelSel.value = cfg.model;
    const keyInput = $('api_key');
    if (keyInput) keyInput.value = cfg.apiKey || '';
    updateKeyStatus();
  }

  function handleSaveKey() {
    const providerId = $('api_provider').value;
    const model = $('api_model').value;
    const apiKey = $('api_key').value.trim();
    LLMParser.saveConfig(providerId, model, apiKey);
    updateKeyStatus();
    toggleSettings();
  }

  function updateKeyStatus() {
    const has = LLMParser.hasKey();
    const badge = $('key_status');
    if (badge) {
      badge.textContent = has ? '已配置' : '未配置';
      badge.className = has ? 'key-badge ready' : 'key-badge missing';
    }
  }

  function toggleSettings() {
    $('settings_modal').classList.toggle('hidden');
  }

  function getAdvancedSettings() {
    return {
      threshold: parseFloat($('adv_threshold').value),
      correlation: parseFloat($('adv_correlation').value),
      pi: parseFloat($('adv_pi_val').value) || Math.PI,
      e: parseFloat($('adv_e_val').value) || Math.E,
      phi: parseFloat($('adv_phi_val').value) || 1.618
    };
  }

  async function handleAIParse() {
    const proposition = $('proposition').value.trim();
    if (!proposition) {
      showError('请输入一个社会、伦理或政治议题。');
      return;
    }

    if (!LLMParser.hasKey()) {
      showError('请先在设置中配置 API Key。');
      toggleSettings();
      return;
    }

    setLoading(true);
    clearError();
    hideResult();

    try {
      const parsed = await LLMParser.parse(proposition, null, getAdvancedSettings());
      const profiles = computeProfiles(parsed.formula);
      currentFormula = {
        formula: parsed.formula,
        ai_confidence: parsed.ai_confidence,
        meta_proposition: parsed.meta_proposition,
        pro_profile: profiles.pro,
        con_profile: profiles.con
      };

      showAnalysisResult(parsed, profiles);
        handleCompute();
    } catch (err) {
      showError('AI 解析失败：' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function showAnalysisResult(parsed, profiles) {
    $('meta_prop').textContent = parsed.meta_proposition || '';
    $('formula_code').textContent = parsed.formula;
    $('pro_profile').textContent = profiles.pro || '';
    $('con_profile').textContent = profiles.con || '';
    $('analysis_result').classList.remove('hidden');
    $('empty_hint').classList.add('hidden');
    const pie = $('pie_fill'); const pc = 2 * Math.PI * 16; pie.style.strokeDasharray = (pc * parsed.ai_confidence) + ' ' + pc;
  }

  function updateRing(conf) {
    const ring = $('ring_fill');
    const circumference = 2 * Math.PI * 52;
    const dash = circumference * conf;
    ring.style.strokeDasharray = dash + ' ' + circumference;
  }

  function updateApprovalColor(approval) {
    const el = $('result_approval');
    let color;
    if (approval < 5)       { color = '#cc3333'; }
    else if (approval < 25) { color = '#cc8833'; }
    else if (approval < 45) { color = '#cccc33'; }
    else if (approval <= 55){ color = '#ffffff'; }
    else if (approval <= 75){ color = '#33cc66'; }
    else if (approval <= 95){ color = '#33aacc'; }
    else                    { color = '#3366cc'; }
    el.style.color = color;
    $('ring_fill').style.stroke = color;
  }

  function applyProfile(type) {
    if (!currentFormula) return;
    const raw = type === 'pro' ? currentFormula.pro_profile : currentFormula.con_profile;
    if (!raw) return;
    const vals = {};
    raw.replace(/q(\d)=([\d.]+)/g, (_, k, v) => { vals['q' + k] = parseFloat(v); });
    if (!vals.q1) return;
    ['q1','q2','q3','q4'].forEach((id, i) => {
      const v = vals[id];
      $(id).value = v;
      $(id + '_val').textContent = v.toFixed(2);
      currentSliders[i] = v;
    });
    handleCompute();
  }

  function computeProfiles(formula) {
    const samples = 5000;
    let maxVals = null, minVals = null;
    let maxApp = -1, minApp = 101;
    for (let i = 0; i < samples; i++) {
      const q = [
        Math.random() * 0.98 + 0.01,
        Math.random() * 0.98 + 0.01,
        Math.random() * 0.98 + 0.01,
        Math.random() * 0.98 + 0.01
      ];
      const r = VMEngine.compute(q, formula, 0.9);
      if (r.approval > maxApp) { maxApp = r.approval; maxVals = [...q]; }
      if (r.approval < minApp) { minApp = r.approval; minVals = [...q]; }
    }
    const fmt = (v) => v.map((x, i) => 'q' + (i + 1) + '=' + x.toFixed(2)).join(', ');
    return { pro: fmt(maxVals), con: fmt(minVals) };
  }

  function handleCompute() {
    if (!currentFormula) {
      showError('请先解析命题获取推导公式，再执行立场分析。');
      return;
    }

    clearError();

    VMEngine.setConstants(getAdvancedSettings().pi, getAdvancedSettings().e, getAdvancedSettings().phi);
    const result = VMEngine.compute(currentSliders, currentFormula.formula, currentFormula.ai_confidence);
    currentResult = { ...result, formula: currentFormula.formula, ai_confidence: currentFormula.ai_confidence };

    $('result_approval').textContent = result.approval.toFixed(1) + '%';
    updateApprovalColor(result.approval);
    updateRing(result.confidence);

    handleSensitivity();
  }

  let chartMode3D = false;

  function toggleChartMode() {
    chartMode3D = !chartMode3D;
    $('btn_chart_toggle').textContent = chartMode3D ? '2D' : '3D';
    $('sensitivity_dim_ctrls').style.display = chartMode3D ? 'none' : '';
    $('sensitivity_dim3d_ctrls').style.display = chartMode3D ? '' : 'none';
    if (chartMode3D) ensureDifferentDims();
    handleSensitivity();
  }

  function ensureDifferentDims() {
    const x = parseInt($('sensitivity_dim_x').value);
    const y = parseInt($('sensitivity_dim_y').value);
    if (x === y) $('sensitivity_dim_y').value = (x + 1) % 4;
  }

  function handleSensitivity() {
    if (!currentResult) return;
    $('sensitivity_loading').classList.remove('hidden');
    requestAnimationFrame(() => {
      try {
        if (chartMode3D) { ensureDifferentDims(); handleSensitivity3D(); }
        else { handleSensitivity2D(); }
      } catch (err) { /* 静默处理图表渲染错误 */ }
      $('sensitivity_loading').classList.add('hidden');
    });
  }

  function handleSensitivity2D() {
    const dimIndex = parseInt($('sensitivity_dim').value);
    const data = SensitivityDetector.scan(currentSliders, currentResult.formula, currentResult.ai_confidence, dimIndex);
    SensitivityDetector.renderChart('sensitivity_chart', data, dimIndex);
  }

  function handleSensitivity3D() {
    const dimX = parseInt($('sensitivity_dim_x').value);
    const dimY = parseInt($('sensitivity_dim_y').value);
    const data = SensitivityDetector.scanSurface(currentSliders, currentResult.formula, currentResult.ai_confidence, dimX, dimY);
    SensitivityDetector.renderSurfaceChart('sensitivity_chart', data, dimX, dimY);
  }

  function setLoading(on) {
    $('loading').classList.toggle('hidden', !on);
    $('btn_ai_parse').disabled = on;
  }

  function showError(msg) {
    const el = $('error_msg');
    el.innerHTML = msg;
    el.classList.remove('hidden');
  }

  function clearError() {
    $('error_msg').classList.add('hidden');
  }

  function hideResult() {
    $('analysis_result').classList.add('hidden');
    $('empty_hint').classList.remove('hidden');
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init };
})();
