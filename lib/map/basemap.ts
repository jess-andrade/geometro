export const primaryBaseMap = {
  provider: 'OpenStreetMap DE',
  tileUrl: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
} as const;

export const fallbackBaseMap = {
  provider: 'OpenStreetMap France',
  tileUrl: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> · Tiles: <a href="https://www.openstreetmap.fr/" target="_blank" rel="noreferrer">OpenStreetMap France</a>',
} as const;
