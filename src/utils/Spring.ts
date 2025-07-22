export type SpringOptions = [frequency: number, damping: number];

const UltraSlow: SpringOptions = [0.025, 1];
const VerySlow: SpringOptions = [0.05, 1];
const Slow: SpringOptions = [0.1, 1];
const Normal: SpringOptions = [0.2, 1];
const Fast: SpringOptions = [0.4, 1];
const VeryFast: SpringOptions = [0.8, 1];
const UltraFast: SpringOptions = [1.6, 1];

const Bouncy: SpringOptions = [0.2, 0.5];
const VeryBouncy: SpringOptions = [0.3, 0.3];
const Stiff: SpringOptions = [1.0, 1.2];
const Rigid: SpringOptions = [2.0, 1.5];
const Loose: SpringOptions = [0.15, 0.8];
const Responsive: SpringOptions = [1.2, 0.9];
const Sluggish: SpringOptions = [0.1, 1.5];

export const SpringPresets = {
	UltraSlow,
	VerySlow,
	Slow,
	Normal,
	Fast,
	VeryFast,
	UltraFast,
	Bouncy,
	VeryBouncy,
	Stiff,
	Rigid,
	Loose,
	Responsive,
	Sluggish,
};

export class Spring {
	target: number = 0;
	position: number = 0;
	velocity: number = 0;

	frequency: number = 0.2;
	damping: number = 1;
	speed: number = 100;

	constructor([frequency, damping]: SpringOptions = SpringPresets.Normal, defaultValue = 1) {
		this.frequency = frequency;
		this.damping = damping;
		this.position = this.target = defaultValue;
	}

	update(deltaTime: number) {
		var parms = CalcDampedSpringMotionParams(deltaTime * this.speed, this.frequency, this.damping);
		UpdateDampedSpringMotion(this, this.target, parms);
	}
}

export const UpdateDampedSpringMotion = (spring: Spring, equilibriumPos: number, params: SpringParams) => {
	const oldPos = spring.position - equilibriumPos;
	const oldVel = spring.velocity;

	spring.position = oldPos * params.posPosCoef + oldVel * params.positionVelCoef + equilibriumPos;
	spring.velocity = oldPos * params.velPosCoef + oldVel * params.velocityVelCoef;
};

export type SpringParams = {
	posPosCoef: number;
	positionVelCoef: number;
	velPosCoef: number;
	velocityVelCoef: number;
};

export const CalcDampedSpringMotionParams = (deltaTime: number, angularFrequency: number, dampingRatio: number) => {
	const epsilon = 0.0001;

	var springParams: SpringParams = {
		posPosCoef: 0,
		positionVelCoef: 0,
		velPosCoef: 0,
		velocityVelCoef: 0,
	};

	if (dampingRatio < 0.0) dampingRatio = 0.0;
	if (angularFrequency < 0.0) angularFrequency = 0.0;

	if (angularFrequency < epsilon) {
		springParams.posPosCoef = 1.0;
		springParams.positionVelCoef = 0.0;
		springParams.velPosCoef = 0.0;
		springParams.velocityVelCoef = 1.0;
		return;
	}

	if (dampingRatio > 1.0 + epsilon) {
		var za = -angularFrequency * dampingRatio;
		var zb = angularFrequency * Math.sqrt(dampingRatio * dampingRatio - 1.0);
		var z1 = za - zb;
		var z2 = za + zb;

		var e1 = Math.exp(z1 * deltaTime);
		var e2 = Math.exp(z2 * deltaTime);

		var invTwoZb = 1.0 / (2.0 * zb);

		var e1_Over_TwoZb = e1 * invTwoZb;
		var e2_Over_TwoZb = e2 * invTwoZb;

		var z1e1_Over_TwoZb = z1 * e1_Over_TwoZb;
		var z2e2_Over_TwoZb = z2 * e2_Over_TwoZb;

		springParams.posPosCoef = e1_Over_TwoZb * z2 - z2e2_Over_TwoZb + e2;
		springParams.positionVelCoef = -e1_Over_TwoZb + e2_Over_TwoZb;

		springParams.velPosCoef = (z1e1_Over_TwoZb - z2e2_Over_TwoZb + e2) * z2;
		springParams.velocityVelCoef = -z1e1_Over_TwoZb + z2e2_Over_TwoZb;
	} else if (dampingRatio < 1.0 - epsilon) {
		var omegaZeta = angularFrequency * dampingRatio;
		var alpha = angularFrequency * Math.sqrt(1.0 - dampingRatio * dampingRatio);

		var expTerm = Math.exp(-omegaZeta * deltaTime);
		var cosTerm = Math.cos(alpha * deltaTime);
		var sinTerm = Math.sin(alpha * deltaTime);

		var invAlpha = 1.0 / alpha;

		var expSin = expTerm * sinTerm;
		var expCos = expTerm * cosTerm;
		var expOmegaZetaSin_Over_Alpha = expTerm * omegaZeta * sinTerm * invAlpha;

		springParams.posPosCoef = expCos + expOmegaZetaSin_Over_Alpha;
		springParams.positionVelCoef = expSin * invAlpha;

		springParams.velPosCoef = -expSin * alpha - omegaZeta * expOmegaZetaSin_Over_Alpha;
		springParams.velocityVelCoef = expCos - expOmegaZetaSin_Over_Alpha;
	} else {
		var expTerm = Math.exp(-angularFrequency * deltaTime);
		var timeExp = deltaTime * expTerm;
		var timeExpFreq = timeExp * angularFrequency;

		springParams.posPosCoef = timeExpFreq + expTerm;
		springParams.positionVelCoef = timeExp;

		springParams.velPosCoef = -angularFrequency * timeExpFreq;
		springParams.velocityVelCoef = -timeExpFreq + expTerm;
	}

	return springParams;
};
