import { Mesh, PlaneGeometry, ShaderMaterial, Color } from "three";

export class GridPlane extends Mesh<PlaneGeometry, ShaderMaterial> {
	constructor() {
		const material = new ShaderMaterial({
			transparent: true,
			uniforms: {
				uScale: { value: 3.0 },
				uThickness: { value: 0.02 },
				uLineColor: { value: new Color(0x22262c) },
				uBackgroundColor: { value: new Color(0x0e1116) },
				uOpacity: { value: 1.0 },
				uFadeDistance: { value: 50.0 },
				uFadeSmoothness: { value: 200.0 },
			},
			vertexShader: `
                varying vec3 vWorldPos;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPos = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
			fragmentShader: `
                precision highp float;
                varying vec3 vWorldPos;
                uniform float uScale;
                uniform float uThickness;
                uniform vec3 uLineColor;
                uniform vec3 uBackgroundColor;
                uniform float uOpacity;
                uniform float uFadeDistance;
                uniform float uFadeSmoothness;

                float aastep(float threshold, float dist) {
                    float afwidth = fwidth(dist);
                    return smoothstep(threshold - afwidth, threshold + afwidth, dist);
                }

                void main() {
                    // World-space grid on XZ plane
                    vec2 g = vWorldPos.xz / max(uScale, 1e-6);
                    vec2 grid = abs(fract(g - 0.5) - 0.5) / fwidth(g);
                    float line = 1.0 - min(min(grid.x, grid.y), 1.0);

                    // thickness control
                    float distToLine = min(abs(fract(g.x) - 0.5), abs(fract(g.y) - 0.5));
                    float t = 1.0 - aastep(uThickness * 0.5, distToLine);
                    float intensity = max(line, t);

                    vec3 color = mix(uBackgroundColor, uLineColor, intensity);
                    float d = length(vWorldPos);
                    float fade = 1.0 - smoothstep(uFadeDistance, uFadeDistance + uFadeSmoothness, d);
                    gl_FragColor = vec4(color, uOpacity * fade);
                }
            `,
		});

		super(new PlaneGeometry(20000, 20000, 1, 1), material);
		this.rotation.x = -Math.PI / 2;
		this.position.y = -0.002;
		this.frustumCulled = false;
	}
}
