export const DISTANCE_RANGES = [
  { code:'0_50', label:'0–50 m', min:0, max:50 },
  { code:'50_100', label:'50–100 m', min:50, max:100 },
  { code:'100_250', label:'100–250 m', min:100, max:250 },
  { code:'250_500', label:'250–500 m', min:250, max:500 },
  { code:'500_1000', label:'500–1.000 m', min:500, max:1000 },
  { code:'gt_1000', label:'> 1.000 m', min:1000, max:null },
] as const;

export function distanceRange(distanceMeters:number) {
  return DISTANCE_RANGES.find((range) => distanceMeters >= range.min && (range.max === null || distanceMeters < range.max)) ?? DISTANCE_RANGES.at(-1)!;
}
