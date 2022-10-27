"use strict";

import Engine from "../engine.js";

var vShaderSource = `#version 300 es

in vec4 vertexPos;
in vec3 orientation;

out float intensity;

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;
uniform mat4 local;

uniform vec4 lightDir;

void main(){
	gl_Position = projection * inverse(camera) * model * local * vertexPos;
	
	intensity = dot(normalize(local * vec4(orientation, 1.0)), normalize(lightDir));
	intensity = (-intensity + 1.0) / 2.0;
	intensity = intensity * ((-gl_Position.z + 1.0)/2.0);
}
`;

var fShaderSource = `#version 300 es

precision highp float;

in float intensity;

out vec4 outColor;

void main(){
	outColor = vec4(1, 0, 0.5, 1) * intensity;
}
`;


class Shape{
	constructor(mesh, screenWidth, screenHeight, fov, nearZ, farZ){
		this.vertices = mesh.vertices;
		this.edges = mesh.edges;
		this.faces = mesh.faces;
		this.orientation = mesh.orientation;
		this.reset(screenWidth, screenHeight, fov, nearZ, farZ);

	}

	draw(gl, positionBuffer){
		this.setEdges(gl, positionBuffer);
		var primitiveType = gl.LINES;
		var offset = 0;
		var count = this.edges.length * 2;
		gl.drawArrays(primitiveType, offset, count);
	}

	setEdges(gl, positionBuffer){
		var vertices = this.edges.reduce((ret, curr) => 
			ret.concat([...this.vertices[curr[0]].map((v => v[0])), ...this.vertices[curr[1]].map((v => v[0]))]), []
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	}

	drawFill(gl, positionBuffer, orientationBuffer){
		this.setFaces(gl, positionBuffer);
		this.setOrientation(gl, orientationBuffer);
		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = this.faces.length * 3;
		gl.drawArrays(primitiveType, offset, count);
	}

	setFaces(gl, positionBuffer){
		var vertices = this.faces.reduce((ret, curr) => 
			ret.concat([...this.vertices[curr[0]].map((v => v[0])), ...this.vertices[curr[1]].map((v => v[0])), ...this.vertices[curr[2]].map((v => v[0]))]), []
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	}

	setOrientation(gl, orientationBuffer){
		var orientation = [];
		for (var idx in this.faces){
			orientation.push(...this.orientation[idx]);
			orientation.push(...this.orientation[idx]);
			orientation.push(...this.orientation[idx]);
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, orientationBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(orientation), gl.STATIC_DRAW);
	}


	isOutside(nearZ){
		if (this.center[2] - 2830 < nearZ){
			return true;
		}
		return false;
	}

	reset(screenWidth, screenHeight, fov, nearZ, farZ){
		var z = farZ;
		var y = Math.random()*(1.75*Math.tan(fov/2)*z) - Math.tan(fov/2)*z;
		var x = (screenWidth/screenHeight) * (Math.random()*(1.75*Math.tan(fov/2)*z) - Math.tan(fov/2)*z);
		this.center = [[x], [y], [z], [1]];

		this.velocity = [0, 0, -(Math.random() * 4000 + 4000)];
	}
}



function Main(){
	var self = this;

	var [canvas, gl] = engine.initCanvas("main-canvas");
	
	var program = engine.initProgram(gl, vShaderSource, fShaderSource);
	gl.useProgram(program);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);


	var vertexPositionLoc = gl.getAttribLocation(program, "vertexPos");
	var orientationLoc = gl.getAttribLocation(program, "orientation");

	var projectionMatLoc = gl.getUniformLocation(program, "projection");
	var cameraMatLoc = gl.getUniformLocation(program, "camera");
	var modelMatLoc = gl.getUniformLocation(program, "model");
	var localMatLoc = gl.getUniformLocation(program, "local");
	
	var lightDirLoc = gl.getUniformLocation(program, "lightDir");


	var fov = Math.PI / 2;
	var nearZ = (canvas.height/2) / (Math.tan(fov/2));
	var farZ = 100000;
	var angle = 0;

	var projectionMat = engine.projectionMat(canvas.width, canvas.height, nearZ, farZ);
	engine.setUniformMat(gl, projectionMatLoc, projectionMat, true);

	var cameraMat = engine.identityMat();
	engine.setUniformMat(gl, cameraMatLoc, cameraMat, true);

	var vertices = [
		[[-2000], [-2000], [-2000], [1]],
		[[2000], [-2000], [-2000], [1]],
		[[2000], [2000], [-2000], [1]],
		[[-2000], [2000], [-2000], [1]],
		[[-2000], [-2000], [2000], [1]],
		[[2000], [-2000], [2000], [1]],
		[[2000], [2000], [2000], [1]],
		[[-2000], [2000], [2000], [1]]
	];
	var edges = [
		[0, 1], [1, 2], [2, 3], [3, 0],
		[4, 5], [5, 6], [6, 7], [7, 4],
		[0, 4], [1, 5], [2, 6], [3, 7]
	];

	var faces = [
		[0, 3, 1], [3, 2, 1],
		[1, 2, 6], [6, 5, 1],
		[5, 6, 7], [7, 4, 5],
		[3, 0, 4], [7, 3, 4],
		[0, 1, 5], [5, 4, 0],
		[6, 2, 3], [7, 6, 3]
	];

	var orientation = [
		[0, 0, -1], [0, 0, -1],
		[1, 0, 0], [1, 0, 0],
		[0, 0, 1], [0, 0, 1],
		[-1, 0, 0], [-1, 0, 0],
		[0, -1, 0], [0, -1, 0],
		[0, 1, 0], [0, 1, 0]
	];

	var mesh = {
		vertices: vertices,
		edges: edges,
		faces: faces,
		orientation: orientation
	}

	var shapes = [];
	for (var i = 0; i < 50; i++){
		shapes.push(new Shape(mesh, canvas.width, canvas.height, fov, nearZ, farZ));
	}

	var positionBuffer = gl.createBuffer();
	var orientationBuffer = gl.createBuffer();

	var vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	gl.enableVertexAttribArray(vertexPositionLoc);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(vertexPositionLoc, 4, gl.FLOAT, false, 0, 0);

	gl.enableVertexAttribArray(orientationLoc);
	gl.bindBuffer(gl.ARRAY_BUFFER, orientationBuffer);
	gl.vertexAttribPointer(orientationLoc, 3, gl.FLOAT, false, 0, 0);


	self.gameLoop = function(timestamp){

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var elapsedTime = engine.getElapsedTime(timestamp);

		gl.bindVertexArray(vao);

		angle += 0.01;
		var rotateMatX = engine.xRotationMat(angle);
		var rotateMatY = engine.yRotationMat(angle);
		var rotateMatZ = engine.zRotationMat(angle);

		var rotations = [
			engine.multiplyMat(rotateMatX, engine.multiplyMat(rotateMatY, rotateMatZ)),
			engine.multiplyMat(rotateMatZ, engine.multiplyMat(rotateMatX, rotateMatY)),
			engine.multiplyMat(rotateMatY, engine.multiplyMat(rotateMatZ, rotateMatX))
		];


		for (var i in shapes){
			var shape = shapes[i];
			// newCenter = translationMat * center
			// projection * modelMat(newCenter) * (rotationMat * scaleMat) * vertex

			shape.center = engine.multiplyMat(engine.translationMat(
				shape.velocity[0] * elapsedTime, shape.velocity[1] * elapsedTime, shape.velocity[2] * elapsedTime), shape.center);

			var rotationMat = rotations[i % 3];

			engine.setUniformMat(gl, localMatLoc, rotationMat, true);
			engine.setUniformMat(gl, modelMatLoc, engine.modelMat(shape.center), true);



			engine.setUniformVec(gl, lightDirLoc, shape.center, true);

			shape.drawFill(gl, positionBuffer, orientationBuffer);


			if (shape.isOutside(nearZ)){
				shape.reset(canvas.width, canvas.height, fov, nearZ, farZ);
			}

		}

		window.requestAnimationFrame(self.gameLoop);
	};

	return self;
}


const engine = new Engine();
const main = new Main();


window.requestAnimationFrame(main.gameLoop);

