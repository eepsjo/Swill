const SensitivityDetector = (() => {
  'use strict';

  const STEP = 0.01;
  const STEP_3D = 0.05;
  const FRACTURE_THRESHOLD = 20;

  const DIM_NAMES = [
    'q1 边界公理',
    'q2 序位公理',
    'q3 归因公理',
    'q4 时间公理'
  ];

  function scan(baseSliders, formula, aiConf, dimIndex) {
    const x = [];
    const y = [];
    const fractures = [];

    for (let v = 0; v <= 1.0 + STEP / 2; v += STEP) {
      const vRounded = Math.round(v * 100) / 100;
      const sliders = [...baseSliders];
      sliders[dimIndex] = vRounded;
      const result = VMEngine.compute(sliders, formula, aiConf);
      x.push(vRounded);
      y.push(result.approval);
    }

    for (let i = 1; i < y.length; i++) {
      const jump = Math.abs(y[i] - y[i - 1]);
      if (jump > FRACTURE_THRESHOLD) {
        fractures.push({
          x: x[i],
          prevY: y[i - 1],
          currY: y[i],
          jump: Math.round(jump * 10) / 10
        });
      }
    }

    return { x, y, fractures };
  }

  function scanSurface(baseSliders, formula, aiConf, dimX, dimY) {
    const xs = [];
    const ys = [];
    const zs = [];

    for (let vy = 0; vy <= 1.0 + STEP_3D / 2; vy += STEP_3D) {
      const vyRounded = Math.round(vy * 100) / 100;
      ys.push(vyRounded);
      const row = [];
      for (let vx = 0; vx <= 1.0 + STEP_3D / 2; vx += STEP_3D) {
        const vxRounded = Math.round(vx * 100) / 100;
        if (vy === 0) xs.push(vxRounded);
        const sliders = [...baseSliders];
        sliders[dimX] = vxRounded;
        sliders[dimY] = vyRounded;
        const result = VMEngine.compute(sliders, formula, aiConf);
        row.push(result.approval);
      }
      zs.push(row);
    }

    return { xs, ys, zs };
  }

  function renderChart(containerId, data, dimLabel) {
    const dimName = DIM_NAMES[dimLabel] || '';

    const traceLine = {
      x: data.x,
      y: data.y,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#ffffff', width: 2 },
      hovertemplate: '%{x:.2f}<br>%{y:.1f}%<extra></extra>'
    };

    const traces = [traceLine];

    if (data.fractures.length > 0) {
      const fx = data.fractures.map(f => f.x);
      const fy = data.fractures.map(f => f.currY);
      traces.push({
        x: fx,
        y: fy,
        type: 'scatter',
        mode: 'markers',
        marker: { color: '#888888', size: 10, symbol: 'x', line: { color: '#ffffff', width: 1 } },
        hovertemplate: '%{x:.2f}<br>%{y:.1f}%<extra></extra>'
      });
    }

    const layout = makeLayout2D();
    Plotly.newPlot(containerId, traces, layout, { responsive: true, displayModeBar: false });
  }

  function renderSurfaceChart(containerId, data, dimX, dimY) {
    const trace = {
      x: data.xs,
      y: data.ys,
      z: data.zs,
      type: 'surface',
      colorscale: [
        [0, '#111111'],
        [0.5, '#555555'],
        [1, '#ffffff']
      ],
      contours: {
        z: { show: true, usecolormap: false, color: '#444444', width: 1 }
      },
      hovertemplate: `${DIM_NAMES[dimX]}: %{x:.2f}<br>${DIM_NAMES[dimY]}: %{y:.2f}<br>认可度: %{z:.1f}%<extra></extra>`
    };

    const layout = {
      title: {
        text: '',
        font: { color: '#cccccc', size: 14, family: 'VT323, monospace' }
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      scene: {
        xaxis: { title: { text: DIM_NAMES[dimX], font: { color: '#aaaaaa' } }, color: '#888888', range: [0, 1], gridcolor: 'rgba(255,255,255,0.06)' },
        yaxis: { title: { text: DIM_NAMES[dimY], font: { color: '#aaaaaa' } }, color: '#888888', range: [0, 1], gridcolor: 'rgba(255,255,255,0.06)' },
        zaxis: { title: { text: '认可度 (%)', font: { color: '#aaaaaa' } }, color: '#888888', range: [0, 100], gridcolor: 'rgba(255,255,255,0.06)' },
        bgcolor: 'rgba(0,0,0,0)',
        aspectmode: 'cube'
      },
      font: { color: '#888888', family: 'VT323, monospace' },
      margin: { l: 0, r: 0, t: 5, b: 0 }
    };

    Plotly.newPlot(containerId, [trace], layout, { responsive: true, displayModeBar: false });
  }

  function makeLayout2D() {
    return {
      title: { text: '' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15,15,15,1)',
      font: { color: '#888888', family: 'VT323, monospace' },
      xaxis: {
        title: { text: '滑块值', font: { color: '#aaaaaa' } },
        range: [0, 1],
        gridcolor: 'rgba(255,255,255,0.06)',
        zerolinecolor: 'rgba(255,255,255,0.1)',
        color: '#888888'
      },
      yaxis: {
        title: { text: '认可度 (%)', font: { color: '#aaaaaa' } },
        range: [0, 100],
        gridcolor: 'rgba(255,255,255,0.06)',
        zerolinecolor: 'rgba(255,255,255,0.1)',
        color: '#888888'
      },
      margin: { l: 50, r: 10, t: 10, b: 40 },
      showlegend: false
    };
  }

  return { scan, scanSurface, renderChart, renderSurfaceChart, DIM_NAMES, STEP, FRACTURE_THRESHOLD };
})();
