/*
 * Saf mantık: DOM'a dokunmaz, Node'da test edilebilir.
 * Content script'te globalThis.SahibindenRange olarak, Node'da module.exports olarak kullanılır.
 *
 * Seçenek türleri (kind):
 *   'range' → min/max aralığına göre seçilir
 *   'low'   → en alt durakta toplanan özel seçenekler (ör. "0 (Yapım Aşamasında)", Bodrum, Zemin);
 *             yalnızca min en alt duraktayken checkbox olarak gösterilir
 *   'free'  → hiçbir aralığa oturmayan seçenekler (ör. Çatı Katı); her zaman ayrı checkbox
 */
(function (root) {
  'use strict';

  const norm = (s) => String(s).toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();

  function parseNumeric(t) {
    let m;
    if ((m = t.match(/^(\d+)\s*-\s*(\d+)/))) return { key: +m[1], stopLabel: `${m[1]}-${m[2]}`, kind: 'range' };
    if ((m = t.match(/^(\d+)\s*ve üzeri/))) return { key: +m[1], stopLabel: `${m[1]}+`, kind: 'range' };
    if ((m = t.match(/^(\d+)$/))) return { key: +m[1], stopLabel: m[1], kind: 'range' };
    return null;
  }

  function parseBuildingAge(label) {
    const t = norm(label);
    if (/^0\b/.test(t)) return { key: 0, stopLabel: '0', kind: 'low' };
    return parseNumeric(t) || { key: null, kind: 'free' };
  }

  function parseTotalFloors(label) {
    return parseNumeric(norm(label)) || { key: null, kind: 'free' };
  }

  const BELOW_FIRST_FLOOR = ['kot', 'bodrum', 'zemin', 'bahçe', 'giriş'];

  function parseFloor(label) {
    const t = norm(label);
    const numeric = parseNumeric(t);
    if (numeric) return numeric;
    if (BELOW_FIRST_FLOOR.some((w) => t.includes(w))) return { key: 0, stopLabel: '0 ve altı', kind: 'low' };
    return { key: null, kind: 'free' };
  }

  function parseRoom(label) {
    const t = norm(label);
    let m;
    if ((m = t.match(/(\d+(?:\.\d+)?)\s*\+\s*(\d+)/))) return { rooms: +m[1], salons: +m[2] };
    // "10 Üzeri": salon bilgisi yok, her salon aralığıyla eşleşir
    if ((m = t.match(/^(\d+)\s*üzeri/))) return { rooms: +m[1] + 0.5, salons: null, roomLabel: `${m[1]}+` };
    return { rooms: null, salons: null };
  }

  const FACETS = [
    { section: 'a812', title: 'Bina Yaşı', type: 'range', parse: parseBuildingAge },
    { section: 'a20', title: 'Oda Sayısı', type: 'rooms' },
    { section: 'a810', title: 'Kat Sayısı', type: 'range', parse: parseTotalFloors },
    { section: 'a811', title: 'Bulunduğu Kat', type: 'range', parse: parseFloor },
  ];

  const sortedStops = (entries) =>
    [...new Map(entries)].sort((a, b) => a[0] - b[0]).map(([key, label]) => ({ key, label }));

  // rawOptions: [{ value, label }] — sayfadaki sırayla
  function buildModel(facet, rawOptions) {
    if (facet.type === 'rooms') {
      const options = rawOptions.map((o) => ({ ...o, ...parseRoom(o.label) }));
      const parsed = options.filter((o) => o.rooms !== null);
      return {
        type: 'rooms',
        options,
        roomStops: sortedStops(parsed.map((o) => [o.rooms, o.roomLabel || String(o.rooms)]).reverse()),
        salonStops: sortedStops(parsed.filter((o) => o.salons !== null).map((o) => [o.salons, String(o.salons)])),
      };
    }
    const options = rawOptions.map((o) => ({ ...o, ...facet.parse(o.label) }));
    const ranked = options.filter((o) => o.key !== null);
    // Map aynı key'de sonuncuyu tutar; ilk görünen etiketi korumak için ters çevir
    return { type: 'range', options, stops: sortedStops(ranked.map((o) => [o.key, o.stopLabel]).reverse()) };
  }

  const bounds = (nums, stops) =>
    nums.length ? [Math.min(...nums), Math.max(...nums)] : [stops[0].key, stops[stops.length - 1].key];

  // selectedValues: URL'deki bu section'a ait value'lar
  function initialState(model, selectedValues) {
    const sel = new Set(selectedValues.map(String));
    const picked = model.options.filter((o) => sel.has(String(o.value)));

    if (model.type === 'rooms') {
      const [roomMin, roomMax] = bounds(picked.filter((o) => o.rooms !== null).map((o) => o.rooms), model.roomStops);
      const [salonMin, salonMax] = bounds(picked.filter((o) => o.salons !== null).map((o) => o.salons), model.salonStops);
      return { roomMin, roomMax, salonMin, salonMax };
    }

    const [min, max] = bounds(picked.filter((o) => o.kind === 'range').map((o) => o.key), model.stops);
    const none = sel.size === 0;
    const lowest = model.stops[0].key;
    const checked = new Set(
      model.options
        .filter((o) => {
          if (o.kind === 'range') return false;
          if (none || sel.has(String(o.value))) return true;
          // min en altta değilse low seçenekler görünmez; en alta çekilince işaretli gelsinler
          return o.kind === 'low' && !picked.some((p) => p.kind === 'low') && min > lowest;
        })
        .map((o) => String(o.value)),
    );
    return { min, max, checked };
  }

  // Dönüş: [] → filtre yok (hepsi seçili), null → hiçbir seçenek eşleşmedi, aksi halde value listesi
  function selectValues(model, state) {
    let chosen;
    if (model.type === 'rooms') {
      chosen = model.options.filter(
        (o) =>
          o.rooms !== null &&
          o.rooms >= state.roomMin &&
          o.rooms <= state.roomMax &&
          (o.salons === null || (o.salons >= state.salonMin && o.salons <= state.salonMax)),
      );
    } else {
      chosen = model.options.filter((o) => {
        if (o.kind === 'free') return state.checked.has(String(o.value));
        if (o.key < state.min || o.key > state.max) return false;
        return o.kind === 'range' || state.checked.has(String(o.value));
      });
    }
    if (chosen.length === 0) return null;
    if (chosen.length === model.options.length) return [];
    return chosen.map((o) => String(o.value));
  }

  // sectionValues: { a812: ['40602', ...], ... } — boş liste o section'ı URL'den kaldırır
  function buildSearchUrl(href, sectionValues) {
    const url = new URL(href);
    for (const [section, values] of Object.entries(sectionValues)) {
      url.searchParams.delete(section);
      for (const v of values) url.searchParams.append(section, v);
    }
    url.searchParams.delete('pagingOffset');
    return url.toString();
  }

  const api = { FACETS, buildModel, initialState, selectValues, buildSearchUrl, parseRoom, parseFloor, parseBuildingAge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SahibindenRange = api;
})(globalThis);
