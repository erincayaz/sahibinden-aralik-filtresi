(function () {
  'use strict';

  const SR = globalThis.SahibindenRange;
  const BOX_CLASS = 'sre-box';
  const widgets = new Map(); // section → { box, model, state, error }

  function readOptions(section) {
    const seen = new Set();
    return [...document.querySelectorAll(`a.facetedCheckbox[data-section="${section}"]`)]
      .map((a) => ({ value: a.dataset.value, label: (a.title || a.textContent).trim() }))
      .filter((o) => o.value && !seen.has(o.value) && seen.add(o.value));
  }

  function el(tag, props = {}, children = []) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  }

  function rangeRow(label, stops, w, minKey, maxKey) {
    const makeSelect = (key) => {
      const select = el('select', { className: 'sre-select' }, stops.map((s) => new Option(s.label, String(s.key))));
      select.value = String(w.state[key]);
      select.addEventListener('change', () => {
        w.state[key] = Number(select.value);
        // min > max olmasın: diğer ucu da çek
        if (w.state[minKey] > w.state[maxKey]) w.state[key === minKey ? maxKey : minKey] = w.state[key];
        render(w);
      });
      return select;
    };
    return el('div', { className: 'sre-row' }, [
      el('span', { className: 'sre-row-label', textContent: label }),
      makeSelect(minKey),
      el('span', { textContent: '–' }),
      makeSelect(maxKey),
    ]);
  }

  function checkGroup(title, options, w) {
    return el('div', { className: 'sre-checks' }, [
      el('div', { className: 'sre-checks-title', textContent: title }),
      ...options.map((o) => {
        const value = String(o.value);
        const input = el('input', { type: 'checkbox', checked: w.state.checked.has(value) });
        input.addEventListener('change', () => {
          if (input.checked) w.state.checked.add(value);
          else w.state.checked.delete(value);
        });
        return el('label', {}, [input, o.label]);
      }),
    ]);
  }

  function render(w) {
    const { box, model, state } = w;
    const children = [];

    if (model.type === 'rooms') {
      children.push(rangeRow('Oda', model.roomStops, w, 'roomMin', 'roomMax'));
      children.push(rangeRow('Salon', model.salonStops, w, 'salonMin', 'salonMax'));
    } else {
      children.push(rangeRow('Aralık', model.stops, w, 'min', 'max'));
      const low = model.options.filter((o) => o.kind === 'low');
      if (low.length && state.min === model.stops[0].key) {
        children.push(checkGroup(`${model.stops[0].label}:`, low, w));
      }
      const free = model.options.filter((o) => o.kind === 'free');
      if (free.length) children.push(checkGroup('Ayrıca dahil et:', free, w));
    }

    if (w.error) children.push(el('div', { className: 'sre-error', textContent: w.error }));

    const apply = el('button', { type: 'button', className: 'sre-apply', textContent: 'Aralığı uygula' });
    apply.addEventListener('click', applyAll);
    children.push(apply);

    box.replaceChildren(...children);
  }

  function applyAll() {
    const values = {};
    for (const [section, w] of widgets) {
      if (!w.box.isConnected) continue;
      const selected = SR.selectValues(w.model, w.state);
      w.error = selected === null ? 'Bu aralıkta hiçbir seçenek yok.' : null;
      if (selected === null) return render(w);
      values[section] = selected;
    }
    location.assign(SR.buildSearchUrl(location.href, values));
  }

  function inject() {
    const params = new URL(location.href).searchParams;
    for (const facet of SR.FACETS) {
      const title = document.getElementById(`_cllpsID_${facet.section}`);
      const content = title && title.parentElement && title.parentElement.querySelector('dd.collapseContent');
      if (!content || content.querySelector(`.${BOX_CLASS}`)) continue;

      const options = readOptions(facet.section);
      if (!options.length) continue;

      const model = SR.buildModel(facet, options);
      const box = el('div', { className: BOX_CLASS });
      // Sitenin panel üzerindeki jQuery handler'larına ulaşmasın
      for (const type of ['click', 'mousedown', 'keydown']) box.addEventListener(type, (e) => e.stopPropagation());
      content.prepend(box);

      const w = { box, model, state: SR.initialState(model, params.getAll(facet.section)), error: null };
      widgets.set(facet.section, w);
      render(w);
    }
  }

  inject();

  // Sonuçlar AJAX ile geldiğinde panel yeniden çizilebilir
  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(inject, 150);
  }).observe(document.body, { childList: true, subtree: true });
})();
