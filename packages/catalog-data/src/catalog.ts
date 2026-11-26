import type { CatalogSeed, SeedProduct, SeedReference, SpecSource } from './types.ts';

/**
 * Data produk asli untuk Fase 1A.
 *
 * Aturan:
 * - Nilai spek hanya disalin dari halaman resmi pabrikan, atau toko resmi merek kalau
 *   pabrikan tidak punya situs. URL-nya ada di `specSourceUrl`.
 * - Nilai yang tidak tertulis di sana dibiarkan kosong. Untuk gear pemilik, nilai itu
 *   dicatat di PERLU-DIUKUR.md dan diisi dengan sumber 'ukur' setelah diukur.
 * - Harga adalah harga contoh pasar Indonesia (kelipatan Rp1.000). Stok dan unit demo
 *   diatur supaya semua kombinasi status di halaman katalog muncul minimal sekali.
 * - Warna ditulis seperti di halaman resmi.
 */

function sources(resmi: string[], ukur: string[] = []): Record<string, SpecSource> {
  return Object.fromEntries([
    ...resmi.map((k) => [k, 'resmi' as const]),
    ...ukur.map((k) => [k, 'ukur' as const]),
  ]);
}

const TRI_MODE = ['Kabel', 'Wireless 2.4 GHz', 'Bluetooth'];
const MOUSE_SPECS = ['length_mm', 'width_mm', 'height_mm', 'weight_g', 'connectivity', 'sensor'];

const products: SeedProduct[] = [
  // ── Gear pemilik ────────────────────────────────────────────────────────────
  {
    slug: 'vortexseries-ignix-f1',
    brandSlug: 'vortexseries',
    categorySlug: 'mouse',
    modelName: 'Ignix F1',
    description:
      'Mouse simetris tri-mode (kabel, 2.4 GHz, Bluetooth) seberat sekitar 51 gram dengan sensor PixArt PAW 3311.',
    specs: {
      length_mm: 121.48,
      width_mm: 61.27,
      height_mm: 38.2,
      weight_g: 51,
      shape: 'Simetris',
      connectivity: TRI_MODE,
      sensor: 'PixArt PAW 3311',
    },
    specSources: sources([...MOUSE_SPECS, 'shape', 'color']),
    specSourceUrl: 'https://vortexseries.net/products/ignix-f1',
    eloshapesUrl: null,
    ownerGear: true,
    // Stok habis tetapi unit demonya tersedia (D5).
    variants: [
      {
        sku: 'L2-VTX-IGNIXF1-WHT',
        name: 'White',
        attributes: { color: 'White' },
        priceIdr: 529_000,
        stockQty: 0,
        sortOrder: 1,
      },
      {
        sku: 'L2-VTX-IGNIXF1-BLK',
        name: 'Black',
        attributes: { color: 'Black' },
        priceIdr: 529_000,
        stockQty: 0,
        sortOrder: 2,
      },
    ],
    demoUnits: [{ code: 'DM-M-001', variantSku: 'L2-VTX-IGNIXF1-WHT', status: 'available' }],
  },
  {
    slug: 'vortexseries-ignix-r1-pro',
    brandSlug: 'vortexseries',
    categorySlug: 'mouse',
    modelName: 'Ignix R1 Pro',
    description:
      'Mouse tri-mode sekitar 60 gram dengan sensor PixArt PAW3395 PRO, polling hingga 1000 Hz, dan baterai 500 mAh.',
    // Bentuk: manual pabrikan menyebut desain ergonomis, dan EloShapes mengelompokkannya sebagai
    // ergonomis tangan kanan (deskripsi toko VortexSeries menyebut "simetris", tapi manual yang dipakai).
    // Manual: https://assets.zyrosite.com/AMqDx3O7Z1H4jK5k/manual-book-ignix-r1-lBzZGUvyPOsNutMh.pdf
    // Manual juga memastikan urutan dimensi P × L × T.
    specs: {
      length_mm: 127.69,
      width_mm: 67.76,
      height_mm: 42.84,
      weight_g: 60,
      shape: 'Ergonomis kanan',
      connectivity: TRI_MODE,
      sensor: 'PixArt PAW3395 PRO',
    },
    specSources: sources([...MOUSE_SPECS, 'shape', 'color']),
    specSourceUrl: 'https://vortexseries.net/products/ignix-r1',
    eloshapesUrl:
      'https://www.eloshapes.com/mouse/compare?p=razer-deathadder-v3-vs.-vortex-series-ignix-r1-pro',
    ownerGear: true,
    variants: [
      {
        sku: 'L2-VTX-IGNIXR1PRO-WHT',
        name: 'Putih',
        attributes: { color: 'Putih' },
        priceIdr: 749_000,
        stockQty: 3,
        sortOrder: 1,
      },
      {
        sku: 'L2-VTX-IGNIXR1PRO-BLK',
        name: 'Hitam',
        attributes: { color: 'Hitam' },
        priceIdr: 749_000,
        stockQty: 4,
        sortOrder: 2,
      },
    ],
    demoUnits: [{ code: 'DM-M-002', variantSku: 'L2-VTX-IGNIXR1PRO-BLK', status: 'available' }],
  },
  {
    slug: 'pressplay-essential-75-he',
    brandSlug: 'pressplay',
    categorySlug: 'keyboard',
    modelName: 'Essential 75 HE',
    description:
      'Keyboard 75% (81 tombol) dengan switch magnetik NICHIRIN, rapid trigger, polling hingga 8000 Hz, dan knob media.',
    specs: { layout: '75%', connectivity: ['Kabel'], hot_swap: true },
    specSources: sources([
      'layout',
      'connectivity',
      'hot_swap',
      'switch_name',
      'switch_type',
      'color',
    ]),
    specSourceUrl:
      'https://pressplayid.com/products/essential75-he-75-rapid-trigger-magnetic-trigger-mechanical-keyboard',
    eloshapesUrl: null,
    ownerGear: true,
    variants: [
      {
        sku: 'L2-PRS-ESS75HE-CWH',
        name: 'NICHIRIN (magnetic) · Clear White',
        attributes: { switch_name: 'NICHIRIN', switch_type: 'Magnetic', color: 'Clear White' },
        priceIdr: 789_000,
        stockQty: 4,
        sortOrder: 1,
      },
      {
        sku: 'L2-PRS-ESS75HE-SBK',
        name: 'NICHIRIN (magnetic) · Smokey Black',
        attributes: { switch_name: 'NICHIRIN', switch_type: 'Magnetic', color: 'Smokey Black' },
        priceIdr: 789_000,
        stockQty: 5,
        sortOrder: 2,
      },
      {
        sku: 'L2-PRS-ESS75HE-SOR',
        name: 'NICHIRIN (magnetic) · Soda Orange',
        attributes: { switch_name: 'NICHIRIN', switch_type: 'Magnetic', color: 'Soda Orange' },
        priceIdr: 789_000,
        stockQty: 2,
        sortOrder: 3,
      },
    ],
    demoUnits: [{ code: 'DM-K-001', variantSku: 'L2-PRS-ESS75HE-SBK', status: 'available' }],
  },
  {
    slug: 'royal-kludge-m75',
    brandSlug: 'royal-kludge',
    categorySlug: 'keyboard',
    modelName: 'M75',
    description:
      'Keyboard 75% gasket mount tri-mode dengan layar OLED dan knob, keycap PBT double-shot, dan switch hot-swap.',
    // Halaman resmi RK menyebut jenis switch yang saling bertentangan. Hanya Fast Silver yang diisi,
    // karena pemilik mengecek langsung di unitnya (Linear). Viridian dan Pale Green tetap kosong.
    specs: { layout: '75%', connectivity: TRI_MODE, hot_swap: true },
    specSources: sources(
      ['layout', 'connectivity', 'hot_swap', 'switch_name', 'color'],
      ['switch_type'],
    ),
    specSourceUrl: 'https://rkgamingstore.com/products/m75-wireless-gaming-keyboard',
    eloshapesUrl: null,
    ownerGear: true,
    variants: [
      {
        sku: 'L2-RKG-M75-BLK-VIR',
        name: 'Viridian · Black',
        attributes: { switch_name: 'Viridian', color: 'Black' },
        priceIdr: 1_099_000,
        stockQty: 3,
        sortOrder: 1,
      },
      {
        sku: 'L2-RKG-M75-BLK-PGR',
        name: 'Pale Green · Black',
        attributes: { switch_name: 'Pale Green', color: 'Black' },
        priceIdr: 1_099_000,
        stockQty: 2,
        sortOrder: 2,
      },
      {
        sku: 'L2-RKG-M75-BLU-FSV',
        name: 'Fast Silver (linear) · Blue',
        attributes: { switch_name: 'Fast Silver', switch_type: 'Linear', color: 'Blue' },
        priceIdr: 1_099_000,
        stockQty: 1,
        sortOrder: 3,
      },
    ],
    demoUnits: [
      { code: 'DM-K-002', variantSku: 'L2-RKG-M75-BLK-VIR', status: 'available' },
      { code: 'DM-K-003', variantSku: 'L2-RKG-M75-BLU-FSV', status: 'servicing' },
    ],
  },
  {
    slug: 'dbe-kumo-gs1x-pro',
    brandSlug: 'dbe',
    categorySlug: 'headset',
    modelName: 'Kumo GS1X Pro',
    description:
      'Headset ringan sekitar 161 gram dengan tiga koneksi: dongle 2.4 GHz, Bluetooth 5.3, dan jack 3,5 mm.',
    // Mic: toko resmi dbE menjual mic pengganti khusus GS1X Pro, jadi mic-nya bisa dilepas.
    // Closed-back dan warna: dicek pemilik (foto resmi earcup dan unit miliknya).
    specs: {
      connectivity: ['3.5 mm', 'Wireless 2.4 GHz', 'Bluetooth'],
      mic: 'Lepas-pasang',
      back_type: 'Closed-back',
      weight_g: 161,
    },
    specSources: sources(['connectivity', 'mic', 'weight_g'], ['back_type', 'color']),
    specSourceUrl:
      'https://www.tokopedia.com/dbeofficial/dbe-kumo-gs1x-pro-superlight-triple-connection-gaming-headset-dengan-bass-jernih-bluetooth-5-3-dongle-2-4ghz-untuk-pc-smartphone-tablet-dan-console-1732440966058903038',
    eloshapesUrl: null,
    ownerGear: true,
    // SKU tetap berakhiran -STD supaya seed memperbarui varian yang sudah ada (seed mencari lewat SKU),
    // bukan membuat varian baru di samping yang lama.
    variants: [
      {
        sku: 'L2-DBE-GS1XPRO-STD',
        name: 'Hitam',
        attributes: { color: 'Hitam' },
        priceIdr: 549_000,
        stockQty: 8,
        sortOrder: 1,
      },
    ],
    demoUnits: [{ code: 'DM-H-001', variantSku: 'L2-DBE-GS1XPRO-STD', status: 'available' }],
  },
  {
    slug: 'hyperx-cloud-ii',
    brandSlug: 'hyperx',
    categorySlug: 'headset',
    modelName: 'Cloud II',
    description:
      'Headset closed-back dengan driver 53 mm, rangka aluminium, mic lepas-pasang, dan kotak kontrol audio USB.',
    specs: { connectivity: ['USB'], mic: 'Lepas-pasang', back_type: 'Closed-back', weight_g: 320 },
    specSources: sources(['connectivity', 'mic', 'back_type', 'weight_g', 'color']),
    specSourceUrl: 'https://uk.hyperx.com/products/hyperx-cloud-ii',
    eloshapesUrl: null,
    ownerGear: true,
    variants: [
      {
        sku: 'L2-HPX-CLOUD2-BRD',
        name: 'Black-Red',
        attributes: { color: 'Black-Red' },
        priceIdr: 1_199_000,
        stockQty: 6,
        sortOrder: 1,
      },
    ],
    demoUnits: [{ code: 'DM-H-002', variantSku: 'L2-HPX-CLOUD2-BRD', status: 'servicing' }],
  },
  {
    slug: 'vortexseries-ignix-glide',
    brandSlug: 'vortexseries',
    categorySlug: 'glasspad',
    modelName: 'Ignix Glide',
    description:
      'Glasspad kaca tempered 490 × 420 mm dengan permukaan micro-etched matte dan alas silikon anti-slip.',
    // Data GLIDE V2 (yang masih dijual). Model milik pemilik dikonfirmasi lewat PERLU-DIUKUR.md.
    specs: {
      length_mm: 490,
      width_mm: 420,
      thickness_mm: 3.8,
      coating: 'Micro-Etched Matte Glass Surface',
    },
    specSources: sources(['length_mm', 'width_mm', 'thickness_mm', 'coating']),
    specSourceUrl: 'https://vortexseries.net/products/GLIDE-V2',
    eloshapesUrl: null,
    ownerGear: true,
    variants: [
      {
        sku: 'L2-VTX-GLIDE-STD',
        name: 'Standar',
        attributes: {},
        priceIdr: 399_000,
        stockQty: 5,
        sortOrder: 1,
      },
    ],
    demoUnits: [],
  },
  {
    slug: 'lastpad-hathor',
    brandSlug: 'lastpad',
    categorySlug: 'mousepad',
    modelName: 'Hathor',
    description:
      'Mousepad kain dengan alas busa polyester X-SOFT dan jahitan tepi di bawah permukaan.',
    // Toko resmi Lastpad hanya mencantumkan warna. Ukuran dan permukaan menunggu PERLU-DIUKUR.md.
    specs: {},
    specSources: sources(['color']),
    specSourceUrl:
      'https://www.tokopedia.com/lastpad/lastpad-hathor-gaming-e-sports-mousepad-polyester-foam-x-soft-base-type-balance-under-surface-stitching-1735645255881230035-1735645268429604563',
    eloshapesUrl: null,
    ownerGear: true,
    variants: [
      {
        sku: 'L2-LSP-HATHOR-BLK',
        name: 'Black',
        attributes: { color: 'Black' },
        priceIdr: 200_000,
        stockQty: 7,
        sortOrder: 1,
      },
      {
        sku: 'L2-LSP-HATHOR-DSG',
        name: 'Design',
        attributes: { color: 'Design' },
        priceIdr: 200_000,
        stockQty: 3,
        sortOrder: 2,
      },
    ],
    demoUnits: [],
  },

  // ── Disetujui pemilik ───────────────────────────────────────────────────────
  {
    slug: 'logitech-g-pro-x-superlight-2',
    brandSlug: 'logitech',
    categorySlug: 'mouse',
    modelName: 'G Pro X Superlight 2',
    description:
      'Mouse wireless LIGHTSPEED 60 gram dengan sensor HERO 2, switch LIGHTFORCE hybrid, dan polling hingga 8000 Hz.',
    specs: {
      length_mm: 125,
      width_mm: 63.5,
      height_mm: 40,
      weight_g: 60,
      connectivity: ['Wireless 2.4 GHz'],
      sensor: 'HERO 2',
    },
    specSources: sources([...MOUSE_SPECS, 'color']),
    specSourceUrl:
      'https://www.logitechg.com/en-us/shop/p/pro-x2-superlight-wireless-mouse.910-006636',
    eloshapesUrl: null,
    ownerGear: false,
    variants: [
      {
        sku: 'L2-LOG-GPXS2-WHT',
        name: 'White',
        attributes: { color: 'White' },
        priceIdr: 2_199_000,
        stockQty: 5,
        sortOrder: 1,
      },
      {
        sku: 'L2-LOG-GPXS2-BLK',
        name: 'Black',
        attributes: { color: 'Black' },
        priceIdr: 2_199_000,
        stockQty: 6,
        sortOrder: 2,
      },
      {
        sku: 'L2-LOG-GPXS2-MAG',
        name: 'Magenta',
        attributes: { color: 'Magenta' },
        priceIdr: 2_199_000,
        stockQty: 2,
        sortOrder: 3,
      },
    ],
    demoUnits: [{ code: 'DM-M-003', variantSku: 'L2-LOG-GPXS2-WHT', status: 'in_use' }],
  },
  {
    slug: 'razer-deathadder-v3-pro',
    brandSlug: 'razer',
    categorySlug: 'mouse',
    modelName: 'DeathAdder V3 Pro',
    description:
      'Mouse ergonomis tangan kanan 63 gram dengan sensor Focus Pro 30K, wireless HyperSpeed, dan mode kabel USB-C.',
    specs: {
      length_mm: 128,
      width_mm: 68,
      height_mm: 44,
      weight_g: 63,
      shape: 'Ergonomis kanan',
      connectivity: ['Kabel', 'Wireless 2.4 GHz'],
      sensor: 'Focus Pro 30K',
    },
    specSources: sources([...MOUSE_SPECS, 'shape', 'color']),
    specSourceUrl: 'https://www.razer.com/gaming-mice/razer-deathadder-v3-pro/RZ01-04630300-R3WL',
    eloshapesUrl: null,
    ownerGear: false,
    variants: [
      {
        sku: 'L2-RZR-DAV3PRO-BLK',
        name: 'Black',
        attributes: { color: 'Black' },
        priceIdr: 2_399_000,
        stockQty: 2,
        sortOrder: 1,
      },
      {
        sku: 'L2-RZR-DAV3PRO-WHT',
        name: 'White',
        attributes: { color: 'White' },
        priceIdr: 2_399_000,
        stockQty: 0,
        sortOrder: 2,
      },
    ],
    demoUnits: [{ code: 'DM-M-004', variantSku: 'L2-RZR-DAV3PRO-BLK', status: 'available' }],
  },
  {
    slug: 'keychron-k8-pro',
    brandSlug: 'keychron',
    categorySlug: 'keyboard',
    modelName: 'K8 Pro',
    description:
      'Keyboard TKL dengan firmware QMK/VIA, koneksi Bluetooth dan kabel USB-C, keycap PBT double-shot, dan socket hot-swap.',
    specs: { layout: 'TKL', connectivity: ['Kabel', 'Bluetooth'], hot_swap: true },
    // Jenis switch dari tabel resmi Gateron (pembuat switch-nya):
    // https://www.gateron.com/products/gateron-g-pro-3-pin-switch-features
    specSources: sources([
      'layout',
      'connectivity',
      'hot_swap',
      'switch_name',
      'switch_type',
      'color',
    ]),
    specSourceUrl:
      'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard',
    eloshapesUrl: null,
    ownerGear: false,
    // Unit demo memakai switch selain varian pertama (D4).
    variants: [
      {
        sku: 'L2-KCH-K8PRO-RED',
        name: 'Gateron G Pro Red (linear)',
        attributes: { switch_name: 'Gateron G Pro Red', switch_type: 'Linear', color: 'Black' },
        priceIdr: 1_649_000,
        stockQty: 2,
        sortOrder: 1,
      },
      {
        sku: 'L2-KCH-K8PRO-BLU',
        name: 'Gateron G Pro Blue (clicky)',
        attributes: { switch_name: 'Gateron G Pro Blue', switch_type: 'Clicky', color: 'Black' },
        priceIdr: 1_649_000,
        stockQty: 1,
        sortOrder: 2,
      },
      {
        sku: 'L2-KCH-K8PRO-BRN',
        name: 'Gateron G Pro Brown (tactile)',
        attributes: { switch_name: 'Gateron G Pro Brown', switch_type: 'Tactile', color: 'Black' },
        priceIdr: 1_649_000,
        stockQty: 3,
        sortOrder: 3,
      },
    ],
    demoUnits: [{ code: 'DM-K-004', variantSku: 'L2-KCH-K8PRO-BRN', status: 'available' }],
  },
  {
    slug: 'royal-kludge-rk61',
    brandSlug: 'royal-kludge',
    categorySlug: 'keyboard',
    modelName: 'RK61',
    description:
      'Keyboard 60% (61 tombol) tri-mode dengan Bluetooth 5.1, dongle 2.4 GHz, mode kabel USB-C, dan switch hot-swap.',
    // Jenis switch sengaja kosong: halaman resmi hanya menyebut warna switch.
    specs: { layout: '60%', connectivity: TRI_MODE, hot_swap: true },
    specSources: sources(['layout', 'connectivity', 'hot_swap', 'switch_name', 'color']),
    specSourceUrl: 'https://rkgamingstore.com/products/rk61-60-percent-keyboard',
    eloshapesUrl: null,
    ownerGear: false,
    // Tanpa unit demo: mewakili status "Tidak ada unit demo".
    variants: [
      {
        sku: 'L2-RKG-RK61-BLK-RED',
        name: 'Red · Black',
        attributes: { switch_name: 'Red', color: 'Black' },
        priceIdr: 599_000,
        stockQty: 4,
        sortOrder: 1,
      },
      {
        sku: 'L2-RKG-RK61-BLK-BLU',
        name: 'Blue · Black',
        attributes: { switch_name: 'Blue', color: 'Black' },
        priceIdr: 599_000,
        stockQty: 3,
        sortOrder: 2,
      },
      {
        sku: 'L2-RKG-RK61-BLK-BRN',
        name: 'Brown · Black',
        attributes: { switch_name: 'Brown', color: 'Black' },
        priceIdr: 599_000,
        stockQty: 2,
        sortOrder: 3,
      },
      {
        sku: 'L2-RKG-RK61-WHT-RED',
        name: 'Red · White',
        attributes: { switch_name: 'Red', color: 'White' },
        priceIdr: 599_000,
        stockQty: 2,
        sortOrder: 4,
      },
      {
        sku: 'L2-RKG-RK61-WHT-BLU',
        name: 'Blue · White',
        attributes: { switch_name: 'Blue', color: 'White' },
        priceIdr: 599_000,
        stockQty: 0,
        sortOrder: 5,
      },
      {
        sku: 'L2-RKG-RK61-WHT-BRN',
        name: 'Brown · White',
        attributes: { switch_name: 'Brown', color: 'White' },
        priceIdr: 599_000,
        stockQty: 1,
        sortOrder: 6,
      },
    ],
    demoUnits: [],
  },
  {
    slug: 'artisan-hien',
    brandSlug: 'artisan',
    categorySlug: 'mousepad',
    modelName: 'Hien XL',
    description:
      'Mousepad kain bertekstur kasar dari Jepang, ukuran XL 490 × 420 mm, dengan tiga pilihan kekerasan alas.',
    // Ketebalan berbeda per kekerasan (XSOFT/SOFT 4 mm, MID 3 mm), jadi tidak diisi di level produk.
    // Halaman resmi tidak mencantumkan warna dan menyebut permukaannya "balance-speed".
    specs: { size: 'XL', length_mm: 490, width_mm: 420 },
    specSources: sources(['size', 'length_mm', 'width_mm']),
    specSourceUrl: 'https://artisan-jp.com/global/fx-hien',
    eloshapesUrl: null,
    ownerGear: false,
    variants: [
      {
        sku: 'L2-ART-HIENXL-XSF',
        name: 'XSOFT',
        attributes: {},
        priceIdr: 1_050_000,
        stockQty: 2,
        sortOrder: 1,
      },
      {
        sku: 'L2-ART-HIENXL-SFT',
        name: 'SOFT',
        attributes: {},
        priceIdr: 1_050_000,
        stockQty: 4,
        sortOrder: 2,
      },
      {
        sku: 'L2-ART-HIENXL-MID',
        name: 'MID',
        attributes: {},
        priceIdr: 1_050_000,
        stockQty: 1,
        sortOrder: 3,
      },
    ],
    demoUnits: [],
  },
  {
    slug: 'skypad-glass-3-0',
    brandSlug: 'skypad',
    categorySlug: 'glasspad',
    modelName: 'Glass 3.0',
    description:
      'Glasspad 350 × 300 mm dengan permukaan kaca yang diproses khusus untuk luncuran cepat dan mudah dibersihkan.',
    specs: {
      length_mm: 350,
      width_mm: 300,
      thickness_mm: 3.6,
      coating: 'Specially treated glass surface',
    },
    specSources: sources(['length_mm', 'width_mm', 'thickness_mm', 'coating', 'color']),
    // skypad.gg kini dialihkan ke situs lain; halaman resminya dibaca dari arsip.
    specSourceUrl:
      'https://web.archive.org/web/20230115021842/https://skypad.gg/products/mousepad-glass-3-0',
    eloshapesUrl: null,
    ownerGear: false,
    variants: [
      {
        sku: 'L2-SKY-GLASS3-BCL',
        name: 'Black Cloud',
        attributes: { color: 'Black Cloud' },
        priceIdr: 1_150_000,
        stockQty: 3,
        sortOrder: 1,
      },
      {
        sku: 'L2-SKY-GLASS3-WCL',
        name: 'White Cloud',
        attributes: { color: 'White Cloud' },
        priceIdr: 1_150_000,
        stockQty: 0,
        sortOrder: 2,
      },
    ],
    demoUnits: [],
  },
  {
    slug: 'logitech-desk-mat-studio-series',
    brandSlug: 'logitech',
    categorySlug: 'deskmat',
    modelName: 'Desk Mat Studio Series',
    description:
      'Desk mat 700 × 300 mm dari kain poliester daur ulang dengan alas karet alami anti-slip.',
    specs: { length_mm: 700, width_mm: 300, material: 'Kain' },
    specSources: sources(['length_mm', 'width_mm', 'material', 'color']),
    specSourceUrl:
      'https://support.logi.com/hc/en/articles/4404828966935-Specification-Logitech-Desk-Mat',
    eloshapesUrl: null,
    ownerGear: false,
    variants: [
      {
        sku: 'L2-LOG-DMSTUDIO-ROS',
        name: 'Dark Rose',
        attributes: { color: 'Dark Rose' },
        priceIdr: 399_000,
        stockQty: 4,
        sortOrder: 1,
      },
      {
        sku: 'L2-LOG-DMSTUDIO-LAV',
        name: 'Lavender',
        attributes: { color: 'Lavender' },
        priceIdr: 399_000,
        stockQty: 3,
        sortOrder: 2,
      },
      {
        sku: 'L2-LOG-DMSTUDIO-GRY',
        name: 'Mid Grey',
        attributes: { color: 'Mid Grey' },
        priceIdr: 399_000,
        stockQty: 5,
        sortOrder: 3,
      },
    ],
    demoUnits: [],
  },
  {
    slug: 'orbitkey-desk-mat',
    brandSlug: 'orbitkey',
    categorySlug: 'deskmat',
    modelName: 'Desk Mat',
    description:
      'Desk mat minimalis ukuran Standard 700 × 320 mm dengan permukaan PU halus, alas karet anti-slip, dan klip kabel.',
    specs: { length_mm: 700, width_mm: 320, material: 'Kulit sintetis' },
    specSources: sources(['length_mm', 'width_mm', 'material', 'color']),
    specSourceUrl: 'https://www.orbitkey.com/products/deskmat',
    eloshapesUrl: null,
    ownerGear: false,
    variants: [
      {
        sku: 'L2-ORB-DESKMAT-BLK',
        name: 'Black',
        attributes: { color: 'Black' },
        priceIdr: 749_000,
        stockQty: 2,
        sortOrder: 1,
      },
      {
        sku: 'L2-ORB-DESKMAT-STN',
        name: 'Stone',
        attributes: { color: 'Stone' },
        priceIdr: 749_000,
        stockQty: 2,
        sortOrder: 2,
      },
      {
        sku: 'L2-ORB-DESKMAT-ESP',
        name: 'Espresso',
        attributes: { color: 'Espresso' },
        priceIdr: 749_000,
        stockQty: 1,
        sortOrder: 3,
      },
    ],
    demoUnits: [],
  },
];

/**
 * Mouse referensi untuk Bandingkan (Fase 1B). Tidak dijual dan tidak punya halaman produk.
 * Keempat ukuran wajib disalin dari halaman resmi pabrikan yang dibuka saat itu. Atribut lain
 * hanya diisi kalau tertulis di sumber yang sama.
 */
const references: SeedReference[] = [
  {
    slug: 'logitech-g102-lightsync',
    brandSlug: 'logitech',
    categorySlug: 'mouse',
    modelName: 'G102 Lightsync',
    // Halaman resmi menulis Length 116,6 mm, Width 62,1 mm, Height 38,2 mm, Weight 85 g, dan "Wired Gaming Mouse".
    specs: {
      length_mm: 116.6,
      width_mm: 62.1,
      height_mm: 38.2,
      weight_g: 85,
      connectivity: ['Kabel'],
    },
    specSources: sources(['length_mm', 'width_mm', 'height_mm', 'weight_g', 'connectivity']),
    specSourceUrl:
      'https://www.logitechg.com/en-my/shop/p/g102-lightsync-rgb-gaming-mouse.910-005802',
    eloshapesUrl: null,
  },
];

export const catalogSeed: CatalogSeed = {
  brands: [
    { slug: 'artisan', name: 'Artisan' },
    { slug: 'dbe', name: 'dbE' },
    { slug: 'hyperx', name: 'HyperX' },
    { slug: 'keychron', name: 'Keychron' },
    { slug: 'lastpad', name: 'Lastpad' },
    { slug: 'logitech', name: 'Logitech' },
    { slug: 'orbitkey', name: 'Orbitkey' },
    { slug: 'pressplay', name: 'Pressplay' },
    { slug: 'razer', name: 'Razer' },
    { slug: 'royal-kludge', name: 'Royal Kludge' },
    { slug: 'skypad', name: 'SkyPAD' },
    { slug: 'vortexseries', name: 'VortexSeries' },
  ],
  products,
  references,
  compareExample: { currentSlug: 'logitech-g102-lightsync', targetSlug: 'vortexseries-ignix-f1' },
};
