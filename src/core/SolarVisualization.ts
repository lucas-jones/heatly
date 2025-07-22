import type { FeatureCollection as GeoJsonData } from "geojson";
import { cellToLatLng } from "h3-js";
import { Box3, Group, Vector3 } from "three";
import type { SolarPowerData } from "../data/fetchSolarPowerData";
import * as GeometryUtils from "../utils/GeometryUtils";
import { BaseScene } from "./BaseScene";
import { GridPlane } from "./GridPlane";
import { SolarHexInstancedMesh } from "./SolarHexInstancedMesh";

export const HEX_RESOLUTION = 5;
export const MIN_SCALE_Y = 0.002;
export const MAX_SCALE_Y = 0.08;

export class SolarVisualization extends BaseScene {
	private group: Group = new Group();
	private cellIndices: Record<string, number> = {};
	private instancedHex!: SolarHexInstancedMesh;
	private timeKeys: string[] = [];
	private dailyMax = 0;
	public currentTimeKey: string | null = null;

	constructor(container: HTMLDivElement, geoJsonData: GeoJsonData, powerData: SolarPowerData) {
		super(container);
		this.initialize(geoJsonData, powerData);
	}

	private initialize(geoData: GeoJsonData, powerData: SolarPowerData): void {
		const allHex = new Set<string>();

		for (const feature of geoData.features) {
			if (!feature.geometry) continue;
			const featureCells = GeometryUtils.collectH3CellsFromGeometry(feature.geometry, HEX_RESOLUTION);
			for (const cell of featureCells) allHex.add(cell);
		}

		// Build per-cell positions using H3 cell centers (no temporary geometries)
		const positionsPerCell: Record<string, Vector3> = {};
		let totalInstances = 0;
		for (const cell of allHex) {
			const [lat, lng] = cellToLatLng(cell);
			const flat = GeometryUtils.projectLonLatToFlatXY(lng, lat);
			positionsPerCell[cell] = new Vector3(flat.x, 0.0, -flat.y);
			totalInstances++;
		}

		this.instancedHex = new SolarHexInstancedMesh(totalInstances);

		for (const [cell, position] of Object.entries(positionsPerCell)) {
			this.cellIndices[cell] = this.instancedHex.addInstance(position);
		}

		this.group.add(this.instancedHex);
		this.scene.add(new GridPlane());
		this.scene.add(this.group);

		this.fitGroupToView(this.group, 250);

		this.dailyMax = this.calculateDailyMax(powerData);
		this.timeKeys = Object.keys(powerData).sort();
		this.updateVisualizationData(this.timeKeys[0], powerData);
	}

	startDataAnimation(powerData: SolarPowerData, intervalMs: number = 600): void {
		if (this.timeKeys.length === 0) return;
		let idx = 0;
		const tk0 = this.timeKeys[idx];
		this.updateVisualizationData(tk0, powerData);
		this.updateHud(tk0);

		setInterval(() => {
			idx = (idx + 1) % this.timeKeys.length;
			const tk = this.timeKeys[idx];
			this.updateVisualizationData(tk, powerData);
			this.updateHud(tk);
		}, intervalMs);
	}

	protected update(deltaTime: number): void {
		this.instancedHex.update(deltaTime);
	}

	private updateVisualizationData(timeKey: string, solarPowerData: SolarPowerData): void {
		this.currentTimeKey = timeKey;
		const history = solarPowerData[timeKey] || {};
		for (const cell of Object.keys(this.cellIndices)) {
			const value = Number(history[cell] ?? 0);
			const t = this.dailyMax > 0 && value > 0 ? Math.sqrt(value / this.dailyMax) : 0;
			const scaleY = MIN_SCALE_Y + t * (MAX_SCALE_Y - MIN_SCALE_Y);
			const idx = this.cellIndices[cell];

			this.instancedHex.setValues(idx, scaleY, t);
		}
	}

	private fitGroupToView(group: Group, targetSize: number = 250): void {
		const overall = new Box3().setFromObject(group);
		const size = new Vector3();
		const center = new Vector3();
		overall.getSize(size);
		const fitScale = targetSize / Math.max(size.x, size.z, 1);
		group.scale.setScalar(fitScale);
		overall.setFromObject(group);
		overall.getCenter(center);
		group.position.x -= center.x;
		group.position.y -= center.y;
		group.position.z -= center.z;
	}

	private calculateDailyMax(solarPowerData: SolarPowerData): number {
		return Math.max(...Object.values(solarPowerData).flatMap((history) => Object.values(history)));
	}

	private updateHud(timeKey: string): void {
		const dateTimeElement = document.getElementById("hud") as HTMLDivElement | null;

		if (!dateTimeElement) return;

		const time = new Date(timeKey);

		const pad = (number: number) => String(number).padStart(2, "0");

		const hh = pad(time.getHours());
		const mm = pad(time.getMinutes());
		const yyyy = time.getFullYear();
		const MM = pad(time.getMonth() + 1);
		const dd = pad(time.getDate());

		dateTimeElement.textContent = `${yyyy}-${MM}-${dd} ${hh}:${mm}\nDomestic solar power generation`.toUpperCase();
	}
}
