import type { FeatureCollection } from "geojson";

export async function fetchGeoJsonData(url: string): Promise<FeatureCollection> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to load GeoJSON from ${url}: ${response.statusText}`);
	}
	const data: unknown = await response.json();
	return data as FeatureCollection;
}
