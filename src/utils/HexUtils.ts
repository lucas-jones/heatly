import { ExtrudeGeometry, Shape, type ShapeJSON } from "three";

const HEX_SHAPE_CENTERED = {
	metadata: { version: 4.7, type: "Curve", generator: "Curve.toJSON" },
	arcLengthDivisions: 200,
	type: "Shape",
	autoClose: false,
	curves: [
		{
			metadata: { version: 4.7, type: "Curve", generator: "Curve.toJSON" },
			arcLengthDivisions: 200,
			type: "LineCurve",
			v1: [-0.00045852007475538636, 0.0025540296477573055],
			v2: [-0.002388586252939924, 0.001118824484697356],
		},
		{
			metadata: { version: 4.7, type: "Curve", generator: "Curve.toJSON" },
			arcLengthDivisions: 200,
			type: "LineCurve",
			v1: [-0.002388586252939924, 0.001118824484697356],
			v2: [-0.0019240979399088864, -0.001435346946514704],
		},
		{
			metadata: { version: 4.7, type: "Curve", generator: "Curve.toJSON" },
			arcLengthDivisions: 200,
			type: "LineCurve",
			v1: [-0.0019240979399088864, -0.001435346946514704],
			v2: [0.0004627356412164607, -0.0025540296477573055],
		},
		{
			metadata: { version: 4.7, type: "Curve", generator: "Curve.toJSON" },
			arcLengthDivisions: 200,
			type: "LineCurve",
			v1: [0.0004627356412164607, -0.0025540296477573055],
			v2: [0.002388586252939917, -0.001125041307884933],
		},
		{
			metadata: { version: 4.7, type: "Curve", generator: "Curve.toJSON" },
			arcLengthDivisions: 200,
			type: "LineCurve",
			v1: [0.002388586252939917, -0.001125041307884933],
			v2: [0.0019318197334180498, 0.0014288280802825515],
		},
		{
			metadata: { version: 4.7, type: "Curve", generator: "Curve.toJSON" },
			arcLengthDivisions: 200,
			type: "LineCurve",
			v1: [0.0019318197334180498, 0.0014288280802825515],
			v2: [-0.00045852007475538636, 0.0025540296477573055],
		},
	],
	currentPoint: [-0.00045852007475538636, 0.0025540296477573055],
	uuid: "7ef12c09-90a8-4c15-ad65-fcabcf2dbd59",
	holes: [],
} as const;

export const generateHexGeometry = (): ExtrudeGeometry => {
	const canonicalShape = new Shape().fromJSON(HEX_SHAPE_CENTERED as unknown as ShapeJSON);

	return new ExtrudeGeometry(canonicalShape, { depth: 1, bevelEnabled: false }).scale(0.9, 0.9, 0.9).rotateX(-Math.PI / 2);
};
