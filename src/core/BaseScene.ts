import { Scene, PerspectiveCamera, WebGLRenderer, Color, AmbientLight, DirectionalLight, FogExp2, Clock } from "three";
import { EffectComposer, RenderPass, EffectPass, BloomEffect, BlendFunction } from "postprocessing";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class BaseScene {
	readonly scene: Scene;
	readonly camera: PerspectiveCamera;
	readonly renderer: WebGLRenderer;
	readonly composer: EffectComposer;
	readonly controls: OrbitControls;
	readonly clock: Clock;

	constructor(container: HTMLDivElement) {
		this.clock = new Clock();

		this.scene = new Scene();
		this.scene.background = new Color(0x0e1116);

		this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.position.set(0, 80, 160);

		this.renderer = new WebGLRenderer({
			antialias: false,
			stencil: false,
			depth: false,
			powerPreference: "high-performance",
			logarithmicDepthBuffer: true,
		});
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		container.appendChild(this.renderer.domElement);

		this.composer = new EffectComposer(this.renderer);
		this.composer.addPass(new RenderPass(this.scene, this.camera));
		this.composer.addPass(
			new EffectPass(
				this.camera,
				new BloomEffect({
					blendFunction: BlendFunction.ADD,
					mipmapBlur: true,
					luminanceThreshold: 0.1,
					luminanceSmoothing: 0.1,
					intensity: 2.8,
					resolutionScale: 0.5,
				}),
			),
		);

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.minDistance = 40;
		this.controls.maxDistance = 400;
		this.controls.target.set(0, 0, 0);
		this.camera.position.set(-8.062, 59.786, 87.103);
		this.camera.rotation.set(-0.719, -0.081, -0.071);
		this.controls.target.set(0.585, -10.509, 6.757);
		this.controls.enableZoom = false;
		this.controls.enablePan = false;
		this.controls.enableDamping = true;
		this.controls.maxPolarAngle = 1.1;
		this.controls.minPolarAngle = 0.7;

		const ambient = new AmbientLight(0xffffff, 0.7);
		this.scene.add(ambient);

		const directional = new DirectionalLight(0xffffff, 3.2);
		directional.position.set(100, 200, 100);
		this.scene.add(directional);

		this.scene.fog = new FogExp2(0x0e1116, 0.003);

		window.addEventListener("resize", this.handleResize.bind(this));
	}

	private handleResize(): void {
		const { innerWidth: width, innerHeight: height } = window;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(width, height);
		this.composer.setSize(width, height);
	}

	protected update(_dt: number): void {}

	public render(): void {
		const deltaTime = this.clock.getDelta();

		this.update(deltaTime);
		this.controls.update(deltaTime);
		this.composer.render();

		requestAnimationFrame(this.render.bind(this));
	}
}
