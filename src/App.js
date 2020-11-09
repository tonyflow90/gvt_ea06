
import * as mat4 from 'gl-matrix/esm/mat4.js';

import { VertexShader } from './shader/VertexShader.js';
import { FragmentShader } from './shader/FragmentShader.js';

import { Plane } from './shapes/Plane.js';
import { Sphere } from './shapes/Sphere.js';
import { Torus } from './shapes/Torus.js';

let App = (function () {

	let gl;

	// The shader program object is also used to
	// store attribute and uniform locations.
	let prog;

	// Array of model objects.
	let models = [];

	// Model that is target for user input.
	let interactiveModel;

	let camera = {
		// Initial position of the camera.
		eye: [0, 1, 4],
		// Point to look at.
		center: [0, 0, 0],
		// Roll and pitch of the camera.
		up: [0, 1, 0],
		// Opening angle given in radian.
		// radian = degree*2*PI/360.
		fovy: 60.0 * Math.PI / 180,
		// Camera near plane dimensions:
		// value for left right top bottom in projection.
		lrtb: 2.0,
		// View matrix.
		vMatrix: mat4.create(),
		// Projection matrix.
		pMatrix: mat4.create(),
		// Projection types: ortho, perspective, frustum.
		projectionType: "perspective",
		// Angle to Z-Axis for camera when orbiting the center
		// given in radian.
		zAngle: 0,
		// Distance in XZ-Plane from center when orbiting.
		distance: 4,
	};

	function start() {
		init();
		render();
	}

	function init() {
		initWebGL();
		initShaderProgram();
		initUniforms()
		initModels();
		initEventHandler();
		initPipline();
	}

	function initWebGL() {
		// Get canvas and WebGL context.
		let canvas = document.getElementById('canvas');
		gl = canvas.getContext('webgl');
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	}

	/**
	 * Init pipeline parameters that will not change again. 
	 * If projection or viewport change, their setup must
	 * be in render function.
	 */
	function initPipline() {
		gl.clearColor(.95, .95, .95, 1);

		// Backface culling.
		gl.frontFace(gl.CCW);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		// Depth(Z)-Buffer.
		gl.enable(gl.DEPTH_TEST);

		// Polygon offset of rastered Fragments.
		gl.enable(gl.POLYGON_OFFSET_FILL);
		gl.polygonOffset(0.5, 0);

		// Set viewport.
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

		// Init camera.
		// Set projection aspect ratio.
		camera.aspect = gl.viewportWidth / gl.viewportHeight;
	}

	function initShaderProgram() {
		// Init vertex shader.
		let vs = initShader(gl.VERTEX_SHADER, VertexShader);
		// Init fragment shader.
		let fs = initShader(gl.FRAGMENT_SHADER, FragmentShader);
		// Link shader into a shader program.
		prog = gl.createProgram();
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.bindAttribLocation(prog, 0, "aPosition");
		gl.linkProgram(prog);
		gl.useProgram(prog);
	}

	/**
	 * Create and init shader from source.
	 * 
	 * @parameter shaderType: openGL shader type.
	 * @parameter SourceTagId: Id of HTML Tag with shader source.
	 * @returns shader object.
	 */
	function initShader(shaderType, shaderSource) {
		let shader = gl.createShader(shaderType);
		// let shaderSource = document.getElementById(SourceTagId).text;
		gl.shaderSource(shader, shaderSource);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.log(SourceTagId + ": " + gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	}

	function initUniforms() {
		// Projection Matrix.
		prog.pMatrixUniform = gl.getUniformLocation(prog, "uPMatrix");

		// Model-View-Matrix.
		prog.mvMatrixUniform = gl.getUniformLocation(prog, "uMVMatrix");
	}

	function initModels() {
		// fillstyle
		let fs = "fillwireframe";
		createModel(Torus.createVertexData(), fs, [0, 0, 0], [0, 0, 0], [1, 1, 1]);
		createModel(Plane.createVertexData(), "wireframe", [0, -.8, 0], [0, 0, 0],
			[1, 1, 1]);

		let r = 1;
		let t = 2 * Math.PI / 60;
		let dt1 = 0;
		let dt2 = 3 * t;
		let dt3 = 6 * t;
		let dt4 = 9 * t;

		console.log(dt1, dt2, dt3, dt4);

		let [x, y] = [0, 0];
		[x, y] = calcPosition(dt1, r, -1);
		createModel(Sphere.createVertexData(), fs, [x, 0, y], [0, 0, 0],
			[.15, .15, .15]);
		models[2].xyAngle = dt1;
		[x, y] = calcPosition(dt2, r, -1);
		createModel(Sphere.createVertexData(), fs, [x, 0, y], [0, 0, 0],
			[.15, .15, .15]);
		models[3].xyAngle = dt2;
		[x, y] = calcPosition(dt3, r, -1);
		createModel(Sphere.createVertexData(), fs, [x, 0, y], [0, 0, 0],
			[.15, .15, .15]);
		models[4].xyAngle = dt3;
		[x, y] = calcPosition(dt4, r, -1);
		createModel(Sphere.createVertexData(), fs, [x, 0, y], [0, 0, 0],
			[.15, .15, .15]);
		models[5].xyAngle = dt4;

		// createModel(Sphere.createVertexData(), fs, [1, -.3, -1], [0, 0, 0],
		// 	[.25, .25, .25]);
		// createModel(Sphere.createVertexData(), fs, [-1, -.3, -1], [0, 0, 0],
		// 	[.25, .25, .25]);
		// createModel(Sphere.createVertexData(), fs, [1, -.3, 1], [0, 0, 0],
		// 	[.25, .25, .25]);
		// createModel(Sphere.createVertexData(), fs, [-1, -.3, 1], [0, 0, 0],
		// 	[.25, .25, .25]);

		// Select one model that can be manipulated interactively by user.
		interactiveModel = models[0];
	}

	/**
	 * Create model object, fill it and push it in models array.
	 * 
	 * @parameter geometryname: string with name of geometry.
	 * @parameter fillstyle: wireframe, fill, fillwireframe.
	 */
	function createModel(geometry, fillstyle, translate, rotate, scale) {
		let model = {};
		model.fillstyle = fillstyle;
		initDataAndBuffers(model, geometry);
		initTransformations(model, translate, rotate, scale);

		models.push(model);
	}

	/**
	 * Set scale, rotation and transformation for model.
	 */
	function initTransformations(model, translate, rotate, scale) {
		// Store transformation vectors.
		model.translate = translate;
		model.rotate = rotate;
		model.scale = scale;

		// Create and initialize Model-Matrix.
		model.mMatrix = mat4.create();

		// Create and initialize Model-View-Matrix.
		model.mvMatrix = mat4.create();
	}

	/**
	 * Init data and buffers for model object.
	 * 
	 * @parameter model: a model object to augment with data.
	 * @parameter geometryname: string with name of geometry.
	 */
	function initDataAndBuffers(model, geometry) {
		// Provide model object with vertex data arrays.
		// Fill data arrays for Vertex-Positions, Normals, Index data:
		// vertices, normals, indicesLines, indicesTris;
		// Pointer this refers to the window.
		// this[geometryname]['createVertexData'].apply(model);
		Object.assign(model, geometry);

		// Setup position vertex buffer object.
		model.vboPos = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vboPos);
		gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);
		// Bind vertex buffer to attribute variable.
		prog.positionAttrib = gl.getAttribLocation(prog, 'aPosition');
		gl.enableVertexAttribArray(prog.positionAttrib);

		// Setup normal vertex buffer object.
		model.vboNormal = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vboNormal);
		gl.bufferData(gl.ARRAY_BUFFER, model.normals, gl.STATIC_DRAW);
		// Bind buffer to attribute variable.
		prog.normalAttrib = gl.getAttribLocation(prog, 'aNormal');
		gl.enableVertexAttribArray(prog.normalAttrib);

		// Setup lines index buffer object.
		model.iboLines = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboLines);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indicesLines,
			gl.STATIC_DRAW);
		model.iboLines.numberOfElements = model.indicesLines.length;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		// Setup triangle index buffer object.
		model.iboTris = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indicesTris,
			gl.STATIC_DRAW);
		model.iboTris.numberOfElements = model.indicesTris.length;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	function calcPosition(t = 0, r = 1, x = 0, y = 0) {
		let posX = 0, posY = 0;
		posX = r * Math.cos(t);
		posY = r * Math.sin(t);

		posX += x;
		posY += y;

		return [posX, posY];
	}

	function calcAngle(x = 1, y = 1) {
		let t = 0;
		if (y) {
			t = Math.acos(x / y);
		}
		console.log(t);
		return t;
	}

	function initEventHandler() {
		// Rotation step.
		let deltaRotate = Math.PI / 60;
		let deltaTranslate = 0.05;

		window.onkeydown = function (evt) {
			let key = evt.which ? evt.which : evt.keyCode;
			let c = String.fromCharCode(key);
			// console.log(evt);
			// Use shift key to change sign.
			let sign = evt.shiftKey ? -1 : 1;

			// Rotate interactive Model.
			switch (c) {
				case ('K'):
					interactiveModel.rotate[1] += sign * deltaRotate;

					let r = 1;
					let nAngle = 2 * Math.PI / 60;

					models[2].xyAngle += nAngle;
					models[3].xyAngle += nAngle;
					models[4].xyAngle += nAngle;
					models[5].xyAngle += nAngle;

					let [x, y] = [0, 0];
					[x, y] = calcPosition(models[2].xyAngle, r, -1);
					models[2].translate[0] = x;
					models[2].translate[2] = y;

					[x, y] = calcPosition(models[3].xyAngle, r, -1);
					models[3].translate[0] = x;
					models[3].translate[2] = y;

					[x, y] = calcPosition(models[4].xyAngle, r, -1);
					models[4].translate[0] = x;
					models[4].translate[2] = y;

					[x, y] = calcPosition(models[5].xyAngle, r, -1);
					models[5].translate[0] = x;
					models[5].translate[2] = y;

					break;
				// case ('X'):
				// 	interactiveModel.rotate[0] += sign * deltaRotate;
				// 	break;
				// case ('Y'):
				// 	interactiveModel.rotate[1] += sign * deltaRotate;
				// 	break;
				// case ('Z'):
				// 	interactiveModel.rotate[2] += sign * deltaRotate;
				// 	break;
			}
			// Change projection of scene.
			switch (c) {
				case ('O'):
					camera.projectionType = "ortho";
					camera.lrtb = 2;
					break;
				case ('F'):
					camera.projectionType = "frustum";
					camera.lrtb = 1.2;
					break;
				case ('P'):
					camera.projectionType = "perspective";
					break;
			}
			// Camera move and orbit.
			switch (c) {
				case ('C'):
					// Orbit camera.
					camera.zAngle += sign * deltaRotate;
					break;
				case ('H'):
					// Move camera up and down.
					camera.eye[1] += sign * deltaTranslate;
					break;
				case ('D'):
					// Camera distance to center.
					camera.distance += sign * deltaTranslate;
					break;
				case ('V'):
					// Camera fovy in radian.
					camera.fovy += sign * 5 * Math.PI / 180;
					break;
				case ('B'):
					// Camera near plane dimensions.
					camera.lrtb += sign * 0.1;
					break;
			}
			// Render the scene again on any key pressed.
			render();
		};
	}

	/**
	 * Run the rendering pipeline.
	 */
	function render() {
		// Clear framebuffer and depth-/z-buffer.
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		setProjection();

		calculateCameraOrbit();

		// Set view matrix depending on camera.
		mat4.lookAt(camera.vMatrix, camera.eye, camera.center, camera.up);

		// Loop over models.
		for (let i = 0; i < models.length; i++) {
			// Update modelview for model.
			updateTransformations(models[i]);

			// Set uniforms for model.
			gl.uniformMatrix4fv(prog.mvMatrixUniform, false,
				models[i].mvMatrix);

			draw(models[i]);
		}
	}

	function calculateCameraOrbit() {
		// Calculate x,z position/eye of camera orbiting the center.
		let x = 0, z = 2;
		camera.eye[x] = camera.center[x];
		camera.eye[z] = camera.center[z];
		camera.eye[x] += camera.distance * Math.sin(camera.zAngle);
		camera.eye[z] += camera.distance * Math.cos(camera.zAngle);
	}

	function setProjection() {
		let v;
		// Set projection Matrix.
		switch (camera.projectionType) {
			case ("ortho"):
				v = camera.lrtb;
				mat4.ortho(camera.pMatrix, -v, v, -v, v, -10, 10);
				break;
			case ("frustum"):
				v = camera.lrtb;
				mat4.frustum(camera.pMatrix, -v / 2, v / 2, -v / 2, v / 2, 1, 10);
				break;
			case ("perspective"):
				mat4.perspective(camera.pMatrix, camera.fovy,
					camera.aspect, 1, 10);
				break;
		}
		// Set projection uniform.
		gl.uniformMatrix4fv(prog.pMatrixUniform, false, camera.pMatrix);
	}

	/**
	 * Update model-view matrix for model.
	 */
	function updateTransformations(model) {

		// Use shortcut variables.
		let mMatrix = model.mMatrix;
		let mvMatrix = model.mvMatrix;

		// mat4.copy(mvMatrix, camera.vMatrix);

		// Reset matrices to identity.         
		mat4.identity(mMatrix);
		mat4.identity(mvMatrix);

		// Translate.
		mat4.translate(mMatrix, mMatrix, model.translate);
		// Rotate.
		mat4.rotateX(mMatrix, mMatrix, model.rotate[0]);
		mat4.rotateY(mMatrix, mMatrix, model.rotate[1]);
		mat4.rotateZ(mMatrix, mMatrix, model.rotate[2]);
		// Scale
		mat4.scale(mMatrix, mMatrix, model.scale);

		// Combine view and model matrix
		// by matrix multiplication to mvMatrix.        
		mat4.multiply(mvMatrix, camera.vMatrix, mMatrix);
	}

	function draw(model) {
		// Setup position VBO.
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vboPos);
		gl.vertexAttribPointer(prog.positionAttrib, 3, gl.FLOAT, false,
			0, 0);

		// Setup normal VBO.
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vboNormal);
		gl.vertexAttribPointer(prog.normalAttrib, 3, gl.FLOAT, false, 0, 0);

		// Setup rendering tris.
		let fill = (model.fillstyle.search(/fill/) != -1);
		if (fill) {
			gl.enableVertexAttribArray(prog.normalAttrib);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
			gl.drawElements(gl.TRIANGLES, model.iboTris.numberOfElements,
				gl.UNSIGNED_SHORT, 0);
		}

		// Setup rendering lines.
		let wireframe = (model.fillstyle.search(/wireframe/) != -1);
		if (wireframe) {
			gl.disableVertexAttribArray(prog.normalAttrib);
			gl.vertexAttrib3f(prog.normalAttrib, 0, 0, 0);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboLines);
			gl.drawElements(gl.LINES, model.iboLines.numberOfElements,
				gl.UNSIGNED_SHORT, 0);
		}
	}

	// App interface.
	return {
		start: start
	}

}());

export default App;