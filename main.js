
function Canvas(canvasId){
	var self = this;
	self.canvas = document.getElementById(canvasId);
	self.context = self.canvas.getContext("2d");
	self.canvas.height = document.body.clientHeight;
	self.canvas.width = document.body.clientWidth;

	var vertices = [
		[[-300], [-300], [-300], [1]],
		[[300], [-300], [-300], [1]],
		[[300], [300], [-300], [1]],
		[[-300], [300], [-300], [1]],
		[[-300], [-300], [300], [1]],
		[[300], [-300], [300], [1]],
		[[300], [300], [300], [1]],
		[[-300], [300], [300], [1]]
	];
	var edges = [
		[0, 1], [1, 2], [2, 3], [3, 0],
		[4, 5], [5, 6], [6, 7], [7, 4],
		[0, 4], [1, 5], [2, 6], [3, 7]
	];
	var shape;
	var shapes = [];
	for (var i = 0; i < 30; i++){
		shape = new Shape(vertices, edges, [
			[Math.random() * self.canvas.width - self.canvas.width / 2],
			[Math.random() * self.canvas.height - self.canvas.height / 2],
			[Math.random() * 18000 + 2000],
			[0]
		]);
		shapes.push(shape);
	}

	self.fov = Math.PI / 2;
	self.screenZ = (self.canvas.width/2) / (Math.tan(self.fov/2));

	var transformation;
	var projectionMat;
	var translateMat;
	var rotateMatX;
	var rotateMatY;
	var rotateMatZ;
	var angle = 0;

	self.context.translate(Math.round(self.canvas.width / 2), Math.round(self.canvas.height / 2));
	self.context.lineWidth = 1;
	self.context.strokeStyle = "white";
	
	self.draw = function(){
		self.context.clearRect(-Math.round(self.canvas.width / 2), -Math.round(self.canvas.height / 2), 
			Math.round(self.canvas.width), Math.round(self.canvas.height));

		rotateMatX = rotateX(angle);
		rotateMatY = rotateY(angle);
		rotateMatZ = rotateZ(angle);

		transformation = matrixMult(rotateMatX, matrixMult(rotateMatY, rotateMatZ))

		for (var i = 0; i < shapes.length; i++){
			shapes[i].project(transformation, self.screenZ);
			shapes[i].draw(self.context, self.screenZ);

			shapes[i].center[2][0] += shapes[i].velocity[2];
			shapes[i].center[1][0] += shapes[i].velocity[1];
			shapes[i].center[0][0] += shapes[i].velocity[0];

			if (shapes[i].isOutside(self.canvas.width, self.canvas.height, self.screenZ)){
				shapes[i].reset(self.canvas.width, self.canvas.height, self.fov);
			}
		}

		angle += 0.01;

		window.requestAnimationFrame(self.draw);
	};


	return self;
}


function drawLine(start, end){
	var path = new Path2D();
	path.moveTo(Math.round(start[0]), Math.round(start[1]));
	path.lineTo(Math.round(end[0]), Math.round(end[1]));
	return path;
}


function matrixMult(A, B){
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


function matrixScale(A, s){
	for (var i = 0; i < A.length; i++){
		for (var j = 0; j < A[i].length; j++){
			A[i][j] = s * A[i][j];
		}
	}
	return A;
}



function rotateX(angle){
	return [
		[0, Math.cos(angle), Math.sin(angle), 0],
		[1, 0, 0, 0],
		[0, -Math.sin(angle), Math.cos(angle), 0],
		[0, 0, 0, 1]
	];
}

function rotateY(angle){
	return [
		[Math.cos(angle), 0, Math.sin(angle), 0],
		[0, 1, 0, 0],
		[-Math.sin(angle), 0, Math.cos(angle), 0],
		[0, 0, 0, 1]
	];
}

function rotateZ(angle){
	return [
		[Math.cos(angle), Math.sin(angle), 0, 0],
		[-Math.sin(angle), Math.cos(angle), 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	];
}


function orthogonalProject(){
	return [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 1]
	];
}

function perspectiveProject(screenZ, z){
	if (z == 0){
		z = 1;
	}
	return [
		[screenZ/z, 0, 0, 0],
		[0, screenZ/z, 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	];
}


function translate(tx, ty, tz){
	return [
		[1, 0, 0, tx],
		[0, 1, 0, ty],
		[0, 0, 1, tz],
		[0, 0, 0, 1]
	];
}



class Shape{
	constructor(vertices, edges, center){
		this.vertices = vertices;
		this.edges = edges;
		this.center = center;
		this.transformedCenter = [];
		this.transformed = [];
		if (this.center[0] >= 0){
			var velX = 4;
		}
		else {
			var velX = -4;
		}
		if (this.center[1] >= 0){
			var velY = 3;
		}
		else {
			var velY = -3;
		}
		this.velocity = [velX, velY, -(Math.random() * 20 + 20)];
	}
	project(transformation, screenZ){
		var translateMat = translate(this.center[0], this.center[1], this.center[2]);
		this.transformedCenter = matrixMult(perspectiveProject(screenZ, this.center[2][0]), this.center);
		for (var i = 0; i < this.vertices.length; i++){
			this.transformed[i] = matrixMult(matrixMult(translateMat, transformation), this.vertices[i]);
			this.transformed[i] = matrixMult(perspectiveProject(screenZ, this.transformed[i][2]), this.transformed[i])
		}
	}
	draw(context, screenZ){
		for (var i = 0; i < this.edges.length; i++){
			var start = this.transformed[this.edges[i][0]];
			var end = this.transformed[this.edges[i][1]];
			if (start[2] <= screenZ || end[2] <= screenZ){
				break;
			}
			var path = drawLine(start, end);
			context.stroke(path);
		}
	}

	isOutside(screenWidth, screenHeight, screenZ){
		if (this.transformedCenter[2][0] <= screenZ || 
			Math.abs(this.transformedCenter[1][0]) > screenHeight / 2 + 200 ||
			Math.abs(this.transformedCenter[0][0]) > screenWidth / 2 + 200){
				return true;
		}
	}

	reset(screenWidth, screenHeight, fov){
		var z = Math.random() * 1000 + 20000;
		var x = Math.random() * Math.tan(fov/2) * z - Math.tan(fov/2) * z / 2;
		var y = Math.random() * Math.tan(fov/2) * z - Math.tan(fov/2) * z / 2;

		this.center = [[x], [y], [z], [1]];
		this.velocity = [0, 0, -(Math.random() * 20 + 30)];
	}
}

var main = new Canvas("main-canvas");

main.draw();