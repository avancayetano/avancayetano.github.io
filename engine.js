export default class Engine{

	constructor(){
		this.clock = undefined;
	}

	getElapsedTime(timestamp){
		if (this.clock == undefined){
			this.clock = timestamp;
		}
		var elapsedTime = ((timestamp - this.clock)) / 1000;
		this.clock = timestamp;
		return elapsedTime;
	}

	getFps(elapsedTime){
		return Math.round(1/elapsedTime);
	}

	displayFps(elapsedTime, contId){
		var fps = this.getFps(elapsedTime);
		var displayCont = document.getElementById(contId);
		displayCont.innerHTML = "FPS: " + fps;
	}


	initCanvas(canvasId){
		var canvas = document.getElementById(canvasId);
		this.resizeCanvas(canvas);
		var gl = canvas.getContext("webgl2");
		if (!gl){
			alert("WebGL2 not supported.");
			return undefined;
		}
		return [canvas, gl];
	}

	resizeCanvas(canvas){
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
	}

	createShader(gl, type, source){
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		return shader;
	}

	createProgram(gl, vertexShader, fragmentShader){
		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		return program;
	}

	initProgram(gl, vShaderSource, fShaderSource){
		var vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vShaderSource);
		var fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);

		var program = this.createProgram(gl, vertexShader, fragmentShader);
		return program;

	}

	multiplyMat(A, B){
		var product = [];
		var sum;

		for (var i = 0; i < A.length; i++){
			product[i] = [];
			for (var j = 0; j < B[i].length; j++){
				sum = 0;
				for (var k = 0; k < A[i].length; k++){
					sum += A[i][k] * B[k][j];
				}
				product[i].push(sum);
			}
		}
		return product;
	}


	inverseMat(A){

		var determinant = getDeterminant(A);
		var A_adj = getAdjugateMat(A);
		var inverse = constantMultMat(A_adj, 1/determinant);

		return inverse;
	}

	getDeterminant(A){
		if (A.length === 1){
			var determinant = A[0][0];
		}
		else if (A.length === 2){
			var determinant = A[0][0]*A[1][1] - A[0][1]*A[1][0];
		}
		else if (A.length === 3){
			var determinant = A[0][0]*getDeterminant(getSubmatrix(A, 0, 0)) 
				- A[0][1]*getDeterminant(getSubmatrix(A, 0, 1))
				+ A[0][2]*getDeterminant(getSubmatrix(A, 0, 2));				
		}
		else if (A.length === 4){
			var determinant = A[0][0]*getDeterminant(getSubmatrix(A, 0, 0))
				- A[0][1]*getDeterminant(getSubmatrix(A, 0, 1))
				+ A[0][2]*getDeterminant(getSubmatrix(A, 0, 2))
				- A[0][3]*getDeterminant(getSubmatrix(A, 0, 3));
		}
		else {
			return -1;
		}

		return determinant;
	}

	getSubmatrix(A, i, j){
		var M = A.slice(0, i).concat(A.slice(i+1)).map((subArr) => subArr.filter((val, idx) => idx !== j));

		return M;
	}


	getAdjugateMat(A){
		var adjugate = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
		for (var i = 0; i < 4; i++){
			for (var j = 0; j < 4; j++){
				var tmp =  getDeterminant(getSubmatrix(A, i, j));
				adjugate[i][j] = ((i + j) % 2 == 0) ? tmp : -tmp; 
			}
		}
		return adjugate;

	}

	constantMultMat(A, c){
		return A.map(val => val.map((a) => a*c));
	}


	scaleMat(sx, sy, sz){
		return [
			[sx, 0, 0, 0],
			[0, sy, 0, 0],
			[0, 0, sz, 0],
			[0, 0, 0, 1]
		];
	}

	identityMat(){
		return [
			[1, 0, 0, 0],
			[0, 1, 0, 0],
			[0, 0, 1, 0],
			[0, 0, 0, 1]
		];
	}

	xRotationMat(angle){
		return [
			[1, 0, 0, 0],
			[0, Math.cos(angle), -Math.sin(angle), 0],
			[0, Math.sin(angle), Math.cos(angle), 0],
			[0, 0, 0, 1]
		];
	}

	yRotationMat(angle){
		return [
			[Math.cos(angle), 0, Math.sin(angle), 0],
			[0, 1, 0, 0],
			[-Math.sin(angle), 0, Math.cos(angle), 0],
			[0, 0, 0, 1]
		];
	}

	zRotationMat(angle){
		return [
			[Math.cos(angle), -Math.sin(angle), 0, 0],
			[Math.sin(angle), Math.cos(angle), 0, 0],
			[0, 0, 1, 0],
			[0, 0, 0, 1]
		];
	}

	// 3d to clip space
	projectionMat(width, height, nearZ, farZ){
		return [
			[2/width, 0, 0, -1],
			[0, -2/height, 0, 1],
			[0, 0, 2/(farZ-nearZ), -(2*nearZ/(farZ-nearZ) + 1)],
			[0, 0, 1/nearZ, 0.0001]
		];
	}


	// model coord -> world coord
	modelMat(center){
		return this.translationMat(center[0], center[1], center[2]);
	}

	cameraMat(camTransformation){
		return this.inverseMat(camTransformation);
	}

	translationMat(tx, ty, tz){
		return [
			[1, 0, 0, tx],
			[0, 1, 0, ty],
			[0, 0, 1, tz],
			[0, 0, 0, 1]
		];
	}

	flatten(arr){
		return arr.reduce((ret, curr) => ret.concat(curr), []);
	}

	setUniformMat(gl, matrixLocation, matrix, flatten){
		if (matrix.length === 4){
			if (flatten){
				gl.uniformMatrix4fv(matrixLocation, true, this.flatten(matrix));
			}
			else {
				gl.uniformMatrix4fv(matrixLocation, true, matrix);
			}
			
		}
		else if (matrix.length === 3){
			if (flatten){
				gl.uniformMatrix3fv(matrixLocation, true, this.flatten(matrix));
			}
			else {
				gl.uniformMatrix3fv(matrixLocation, true, matrix);
			}
		}
		else if (matrix.length === 2){
			if (flatten){
				gl.uniformMatrix2fv(matrixLocation, true, this.flatten(matrix));
			}
			else {
				gl.uniformMatrix2fv(matrixLocation, true, matrix);
			}
		}
		else {
			alert("Not valid matrix");
		}
		
	}

	setUniformVec(gl, vectorLocation, vector, flatten){
		if (vector.length === 4){
			if (flatten){
				gl.uniform4fv(vectorLocation, this.flatten(vector));
			}
			else {
				gl.uniform4fv(vectorLocation, vector);
			}
			
		}
		else if (vector.length === 3){
			if (flatten){
				gl.uniform3fv(vectorLocation, this.flatten(vector));
			}
			else {
				gl.uniform3fv(vectorLocation, vector);
			}
		}
		else if (vector.length === 2){
			if (flatten){
				gl.uniform2fv(vectorLocation, this.flatten(vector));
			}
			else {
				gl.uniform2fv(vectorLocation, vector);
			}
		}
		else {
			alert("Not valid vector");
		}
	}

}