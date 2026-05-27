export const BILL_LOGOS = {
  meralco:       require('@/assets/images/bills/meralco.png'),
  maynilad:      require('@/assets/images/bills/maynilad.png'),
  manilawater:   require('@/assets/images/bills/manilawater.jpg'),
  pldt:          require('@/assets/images/bills/PLDT.png'),
  converge:      require('@/assets/images/bills/converge.jpg'),
  globe:         require('@/assets/images/bills/globe.png'),
  smart:         require('@/assets/images/bills/smart.png'),
  dito:          require('@/assets/images/bills/dito.jpg'),
  skycable:      require('@/assets/images/bills/skycable.png'),
  netflix:       require('@/assets/images/bills/netflix.png'),
  spotify:       require('@/assets/images/bills/spotify.png'),
  applemusic:    require('@/assets/images/bills/applemusic.png'),
  youtubepremium: require('@/assets/images/bills/youtubepremium.avif'),
} as const;

export function pickBillLogo(title: string): any {
  if (!title) return null;
  const normalized = title.toLowerCase().replace(/\s+/g, '');
  if (normalized.includes('meralco')) return BILL_LOGOS.meralco;
  if (normalized.includes('maynilad')) return BILL_LOGOS.maynilad;
  if (normalized.includes('manilawater')) return BILL_LOGOS.manilawater;
  if (normalized.includes('pldt')) return BILL_LOGOS.pldt;
  if (normalized.includes('converge')) return BILL_LOGOS.converge;
  if (normalized.includes('globe')) return BILL_LOGOS.globe;
  if (normalized.includes('smart')) return BILL_LOGOS.smart;
  if (normalized.includes('dito')) return BILL_LOGOS.dito;
  if (normalized.includes('skycable')) return BILL_LOGOS.skycable;
  if (normalized.includes('netflix')) return BILL_LOGOS.netflix;
  if (normalized.includes('spotify')) return BILL_LOGOS.spotify;
  if (normalized.includes('applemusic')) return BILL_LOGOS.applemusic;
  if (normalized.includes('youtubepremium')) return BILL_LOGOS.youtubepremium;
  return null;
}

export const DEFAULT_BILLS = [
  { id: 1, name: 'Meralco', image: BILL_LOGOS.meralco, type: 'Electricity' },
  { id: 2, name: 'Maynilad', image: BILL_LOGOS.maynilad, type: 'Water' },
  { id: 3, name: 'Manila Water', image: BILL_LOGOS.manilawater, type: 'Water' },
  { id: 4, name: 'PLDT', image: BILL_LOGOS.pldt, type: 'Internet' },
  { id: 5, name: 'Converge', image: BILL_LOGOS.converge, type: 'Converge ICT' },
  { id: 6, name: 'Globe', image: BILL_LOGOS.globe, type: 'Telecom' },
  { id: 7, name: 'Smart', image: BILL_LOGOS.smart, type: 'Telecom' },
  { id: 8, name: 'DITO', image: BILL_LOGOS.dito, type: 'Telecom' },
  { id: 9, name: 'Sky Cable', image: BILL_LOGOS.skycable, type: 'Cable TV' },
  { id: 10, name: 'Netflix', image: BILL_LOGOS.netflix, type: 'Entertainment' },
  { id: 11, name: 'Spotify', image: BILL_LOGOS.spotify, type: 'Music' },
  { id: 12, name: 'Apple Music', image: BILL_LOGOS.applemusic, type: 'Music' },
  { id: 13, name: 'YouTube Premium', image: BILL_LOGOS.youtubepremium, type: 'Entertainment' },
];
