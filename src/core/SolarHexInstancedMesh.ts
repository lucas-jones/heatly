import {
	InstancedMesh,
	type Material,
	ExtrudeGeometry,
	Object3D,
	Vector3,
	DynamicDrawUsage,
	InstancedBufferAttribute,
	Color,
	Float32BufferAttribute,
	MeshStandardMaterial,
} from "three";
import { Spring, SpringPresets } from "../utils/Spring";
import { generateHexGeometry } from "../utils/HexUtils";

const BASE_GREY = new Color(0x444444);
const GREEN = new Color(0x00ff66);

const HEX_MATERIAL = new MeshStandardMaterial({ vertexColors: true });
export class SolarHexInstancedMesh extends InstancedMesh<ExtrudeGeometry, Material> {
	private instances: { position: Vector3; scaleSpring: Spring; colorSpring: Spring }[] = [];

	private instanceCountUsed: number = 0;
	private readonly initialScaleY = 0.002;

	private tempObject: Object3D = new Object3D();
	private readonly tempColor: Color = new Color();

	constructor(capacity: number) {
		super(generateHexGeometry(), HEX_MATERIAL, capacity);
		this.instanceMatrix.setUsage(DynamicDrawUsage);
		this.capacity = capacity;

		const vertexCount = this.geometry.attributes.position.count;
		const colors = new Float32Array(vertexCount * 3);
		for (let i = 0; i < vertexCount; i++) {
			colors[i * 3 + 0] = 1.0;
			colors[i * 3 + 1] = 1.0;
			colors[i * 3 + 2] = 1.0;
		}
		this.geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

		this.instanceColor = new InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
		const white = new Color(0xffffff);
		for (let i = 0; i < capacity; i++) {
			this.setColorAt(i, white);
		}
		this.instanceColor.needsUpdate = true;

		// Initialize identity transforms and default springs
		for (let i = 0; i < capacity; i++) {
			const state = {
				position: new Vector3(),
				scaleSpring: new Spring(SpringPresets.Fast, this.initialScaleY),
				colorSpring: new Spring(SpringPresets.Fast, 0),
			};
			this.instances[i] = state;
			this.tempObject.position.copy(state.position);
			this.tempObject.scale.set(1, this.initialScaleY, 1);
			this.tempObject.updateMatrix();
			this.setMatrixAt(i, this.tempObject.matrix);
		}
		this.count = 0; // nothing active until added
	}

	addInstance(position: Vector3): number {
		const index = this.instanceCountUsed;
		const state = this.instances[index];
		state.position.copy(position);

		this.tempObject.position.copy(position);
		this.tempObject.scale.set(1, this.initialScaleY, 1);
		this.tempObject.updateMatrix();
		this.setMatrixAt(index, this.tempObject.matrix);

		this.instanceCountUsed++;
		this.count = this.instanceCountUsed;
		this.instanceMatrix.needsUpdate = true;
		return index;
	}

	setValues(index: number, scaleY: number, t: number): void {
		const state = this.instances[index];
		if (!state) return;
		state.scaleSpring.target = scaleY;
		state.colorSpring.target = Math.max(0, Math.min(1, t * 1.5));
	}

	update(deltaTime: number): void {
		const used = this.instanceCountUsed;

		for (let i = 0; i < used; i++) {
			const state = this.instances[i];
			const scaleSpring = state.scaleSpring;
			const colorSpring = state.colorSpring;

			scaleSpring.update(deltaTime / 10);
			colorSpring.update(deltaTime / 10);

			this.tempObject.position.copy(state.position);
			this.tempObject.scale.set(1, scaleSpring.position, 1);
			this.tempObject.updateMatrix();
			this.setMatrixAt(i, this.tempObject.matrix);

			// Update color from grey->green based on smoothed t
			this.tempColor.copy(BASE_GREY).lerp(GREEN, colorSpring.position);
			this.setColorAt(i, this.tempColor);
		}

		this.instanceMatrix.needsUpdate = true;
		this.instanceColor!.needsUpdate = true;
	}
}
