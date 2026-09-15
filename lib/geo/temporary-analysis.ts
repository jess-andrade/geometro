import { featureCollection, lineString, point } from '@turf/helpers';
import { distance } from '@turf/distance';
import { nearestPoint } from '@turf/nearest-point';
import { pointToLineDistance } from '@turf/point-to-line-distance';
import type { Feature, LineString, MultiLineString, Point } from 'geojson';
import { distanceRange } from './distance-ranges';

export function nearestStation(origin:Feature<Point>, stations:Feature<Point>[]) {
  if (!stations.length) return null;
  const nearest = nearestPoint(origin, featureCollection(stations));
  return { station:nearest, distanceM:distance(origin, nearest, { units:'kilometers' }) * 1000 };
}

export function nearestMetroLine(origin:Feature<Point>, lines:Feature<LineString | MultiLineString>[]) {
  if (!lines.length) return null;
  const result = lines.map((line) => {
    const segments = line.geometry.type === 'LineString'
      ? [lineString(line.geometry.coordinates)]
      : line.geometry.coordinates.map((coordinates) => lineString(coordinates));
    const distanceM = Math.min(...segments.map((segment) => pointToLineDistance(origin, segment, { units:'kilometers' }) * 1000));
    return { line, distanceM };
  }).sort((a,b)=>a.distanceM-b.distanceM)[0];
  return { ...result, range:distanceRange(result.distanceM) };
}

export function analysisPoint(longitude:number, latitude:number) { return point([longitude,latitude]); }
