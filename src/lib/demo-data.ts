// Simple deterministic demo data so pages show content without Supabase.
export type SaleRow = {
  date: string;                // ISO day
  location: string;
  machine: string;
  product: string;
  qty: number;
  price: number;               // USD
  revenue: number;             // qty * price
};

const LOCS = ['Manhattan Tech Hub', 'Brooklyn Hospital', 'Queens University', 'Jersey Logistics'];
const MACH = ['M-001', 'M-002', 'M-003', 'M-004', 'M-005'];
const PRODS = [
  { name: 'Coke 12oz', price: 2.00 },
  { name: 'Pepsi 12oz', price: 2.00 },
  { name: 'Water 16oz', price: 1.50 },
  { name: 'Chips BBQ',  price: 1.75 },
  { name: 'Candy Bar',  price: 1.50 },
];

function seeded(seed: number) {
  // xorshift32
  let x = seed || 123456789;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

export function getDemoSales(days = 30): SaleRow[] {
  const today = new Date();
  const rng = seeded(days * 1337 + today.getUTCDate());
  const rows: SaleRow[] = [];

  for (let d = 0; d < days; d++) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    day.setUTCDate(day.getUTCDate() - d);
    const iso = day.toISOString().slice(0, 10);

    // per-day traffic (weekday ↑, weekend ↓)
    const weekday = day.getUTCDay(); // 0 Sun - 6 Sat
    const baseTx = weekday === 0 || weekday === 6 ? 12 : 28;
    const jitter = Math.floor(rng() * 10);
    const txCount = baseTx + jitter;

    for (let i = 0; i < txCount; i++) {
      const loc = LOCS[Math.floor(rng() * LOCS.length)];
      const mac = MACH[Math.floor(rng() * MACH.length)];
      const prod = PRODS[Math.floor(rng() * PRODS.length)];
      const qty = 1 + (rng() < 0.12 ? 1 : 0); // sometimes 2 items
      const price = prod.price;
      rows.push({
        date: iso,
        location: loc,
        machine: mac,
        product: prod.name,
        qty,
        price,
        revenue: +(qty * price).toFixed(2),
      });
    }
  }

  // stable order: newest first
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return rows;
}