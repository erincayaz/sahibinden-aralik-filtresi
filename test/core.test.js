const test = require('node:test');
const assert = require('node:assert/strict');
const SR = require('../src/core.js');

// Etiketler sahibinden'deki sırayla; value olarak etiketin kendisi kullanılıyor
const opts = (labels) => labels.map((label) => ({ value: label, label }));
const facet = (section) => SR.FACETS.find((f) => f.section === section);
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

const BUILDING_AGE = opts([
  '0 (Oturuma Hazır)', '0 (Yapım Aşamasında)', '1', '2', '3', '4', '5',
  '6-10 arası', '11-15 arası', '16-20 arası', '21-25 arası', '26-30 arası', '31 ve üzeri',
]);
const FLOOR = opts([
  'Giriş Altı Kot', 'Bodrum Kat', 'Zemin Kat', 'Bahçe Katı', 'Giriş Katı', 'Yüksek Giriş', 'Çatı Katı',
  ...range(1, 29), '30 ve üzeri',
]);
const ROOMS = opts([
  'Stüdyo (1+0)', '1+1', '1.5+1', '2+0', '2+1', '2.5+1', '2+2', '3+0', '3+1', '3.5+1', '3+2', '3+3',
  '4+1', '10+1', '10+2', '10 Üzeri',
]);

test('bina yaşı: duraklar ve kovalar', () => {
  const m = SR.buildModel(facet('a812'), BUILDING_AGE);
  assert.deepEqual(m.stops.map((s) => s.label), ['0', '1', '2', '3', '4', '5', '6-10', '11-15', '16-20', '21-25', '26-30', '31+']);
  const s = SR.initialState(m, []);
  Object.assign(s, { min: 3, max: 11 });
  assert.deepEqual(SR.selectValues(m, s), ['3', '4', '5', '6-10 arası', '11-15 arası']);
});

test('bina yaşı: min 0 iken sadece işaretli 0 seçenekleri', () => {
  const m = SR.buildModel(facet('a812'), BUILDING_AGE);
  const s = SR.initialState(m, []);
  s.max = 2;
  s.checked.delete('0 (Yapım Aşamasında)');
  assert.deepEqual(SR.selectValues(m, s), ['0 (Oturuma Hazır)', '1', '2']);
});

test('filtre yoksa her şey seçili → boş liste', () => {
  const m = SR.buildModel(facet('a811'), FLOOR);
  assert.deepEqual(SR.selectValues(m, SR.initialState(m, [])), []);
});

test('bulunduğu kat: min > 0 ise kot/bodrum/zemin dahil değil, çatı checkbox ile', () => {
  const m = SR.buildModel(facet('a811'), FLOOR);
  assert.equal(m.stops[0].label, '0 ve altı');
  assert.equal(m.options.find((o) => o.label === 'Yüksek Giriş').kind, 'low');
  assert.equal(m.options.find((o) => o.label === 'Çatı Katı').kind, 'free');

  const s = SR.initialState(m, []);
  Object.assign(s, { min: 2, max: 4 });
  s.checked.delete('Çatı Katı');
  assert.deepEqual(SR.selectValues(m, s), ['2', '3', '4']);
  s.checked.add('Çatı Katı');
  assert.deepEqual(SR.selectValues(m, s), ['Çatı Katı', '2', '3', '4']);
});

test('bulunduğu kat: URL\'den durum okuma', () => {
  const m = SR.buildModel(facet('a811'), FLOOR);
  const s = SR.initialState(m, ['3', '7']);
  assert.equal(s.min, 3);
  assert.equal(s.max, 7);
  // min en altta değil → low'lar en alta çekilince işaretli gelsin, çatı işaretsiz
  assert.ok(s.checked.has('Bodrum Kat'));
  assert.ok(!s.checked.has('Çatı Katı'));
});

test('oda/salon ayrı aralık', () => {
  const m = SR.buildModel(facet('a20'), ROOMS);
  assert.deepEqual(m.roomStops.map((s) => s.label), ['1', '1.5', '2', '2.5', '3', '3.5', '4', '10', '10+']);
  assert.deepEqual(m.salonStops.map((s) => s.label), ['0', '1', '2', '3']);

  const s = { roomMin: 2, roomMax: 3, salonMin: 1, salonMax: 1 };
  assert.deepEqual(SR.selectValues(m, s), ['2+1', '2.5+1', '3+1']);

  // "10 Üzeri" salon bilgisi taşımaz, oda aralığı kapsıyorsa dahil
  assert.deepEqual(SR.selectValues(m, { roomMin: 10, roomMax: 10.5, salonMin: 1, salonMax: 1 }), ['10+1', '10 Üzeri']);
});

test('eşleşme yoksa null', () => {
  const m = SR.buildModel(facet('a20'), ROOMS);
  assert.equal(SR.selectValues(m, { roomMin: 1, roomMax: 1, salonMin: 3, salonMax: 3 }), null);
});

test('URL kurma: tekrarlı parametre, diğerleri korunur, sayfalama sıfırlanır', () => {
  const url = SR.buildSearchUrl(
    'https://www.sahibinden.com/satilik-daire/istanbul?a812=1&price_max=5000000&pagingOffset=20',
    { a812: ['40604', '40603'], a20: [] },
  );
  assert.equal(url, 'https://www.sahibinden.com/satilik-daire/istanbul?price_max=5000000&a812=40604&a812=40603');
});
