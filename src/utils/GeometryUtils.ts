import { Vector2, Shape, Path } from "three";
import { polygonToCells, cellToBoundary } from "h3-js";
import type { Position, Geometry } from "geojson";

export function projectLonLatToFlatXY(lon: number, lat: number): Vector2 {
	// Spherical Web Mercator (EPSG:3857) in radians; absolute scale doesn't matter as we auto-fit
	const maxLat = 85.05112878;
	const clampedLat = Math.max(Math.min(lat, maxLat), -maxLat);
	const longitudeRadians = (lon * Math.PI) / 180; // longitude in radians
	const latitudeRadians = (clampedLat * Math.PI) / 180; // latitude in radians
	return new Vector2(longitudeRadians, Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2)));
}

export function createShapeFromPolygon(polygon: Position[][]): Shape[] {
	const shapes: Shape[] = [];
	if (polygon.length === 0) return shapes;

	const [outer, ...holes] = polygon;
	if (!outer || outer.length < 3) return shapes;

	const shape = new Shape();
	for (let i = 0; i < outer.length; i++) {
		const [lon, lat] = outer[i];
		const projectedXY = projectLonLatToFlatXY(lon, lat);
		if (i === 0) shape.moveTo(projectedXY.x, projectedXY.y);
		else shape.lineTo(projectedXY.x, projectedXY.y);
	}

	for (const hole of holes) {
		if (!hole || hole.length < 3) continue;
		const holePath = new Path();
		for (let i = 0; i < hole.length; i++) {
			const [lon, lat] = hole[i];
			const projectedXY = projectLonLatToFlatXY(lon, lat);
			if (i === 0) holePath.moveTo(projectedXY.x, projectedXY.y);
			else holePath.lineTo(projectedXY.x, projectedXY.y);
		}
		shape.holes.push(holePath);
	}

	shapes.push(shape);
	return shapes;
}

export function shapesFromGeometry(geometry: Geometry): Shape[] {
	if (geometry.type === "Polygon") {
		return createShapeFromPolygon(geometry.coordinates);
	}
	if (geometry.type === "MultiPolygon") {
		const all: Shape[] = [];
		for (const poly of geometry.coordinates) {
			all.push(...createShapeFromPolygon(poly));
		}
		return all;
	}

	return [];
}

export function collectH3CellsFromGeometry(geometry: Geometry, resolution: number): Set<string> {
	const cells = new Set<string>();
	if (geometry.type === "Polygon") {
		const polygonCells = polygonToCells(geometry.coordinates as any, resolution, true);
		for (const cellIndex of polygonCells) cells.add(cellIndex);
		return cells;
	}
	if (geometry.type === "MultiPolygon") {
		for (const poly of geometry.coordinates) {
			const polygonCells = polygonToCells(poly as any, resolution, true);
			for (const cellIndex of polygonCells) cells.add(cellIndex);
		}
		return cells;
	}

	return cells;
}

export function createShapesFromH3Cell(index: string): Shape[] {
	const boundary = cellToBoundary(index, true) as Position[];
	return createShapeFromPolygon([boundary]);
}
