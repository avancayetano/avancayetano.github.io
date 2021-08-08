
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
		shape = new Shape(vertices, edges, [0, 0, 0, 0]);
		shape.reset(self.canvas.width, self.canvas.height);
		shapes.push(shape);
	}

	self.camera = 400;

	var transformation;
	var projectionMat;
	var translateMat;
	var rotateMatX;
	var rotateMatY;
	var rotateMatZ;
	var angle = 0;

	self.context.translate(self.canvas.width/2, self.canvas.height/2);
	self.context.transform(1, 0, 0, -1, 0, 0);

	self.draw = function(){
		self.context.save();
		self.context.setTransform(1,0,0,1,0,0);
		self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
		self.context.restore();
		self.context.lineWidth = 1;
		self.context.strokeStyle = "white";
		
		rotateMatX = rotateX(angle);
		rotateMatY = rotateY(angle);
		rotateMatZ = rotateZ(angle);

		transformation = matrixMult(rotateMatX, matrixMult(rotateMatY, rotateMatZ))

		for (var i = 0; i < shapes.length; i++){
			shapes[i].project(transformation, self.camera);


			shapes[i].draw(self.context, self.camera);

			shapes[i].center[2] += shapes[i].velocity[2];
			shapes[i].center[1] += shapes[i].velocity[1];
			shapes[i].center[0] += shapes[i].velocity[0];

			if (shapes[i].center[2] >= self.camera){
				shapes[i].reset(self.canvas.width, self.canvas.height)
			}
		}

		angle += 0.01;

		window.requestAnimationFrame(self.draw);
	};


	return self;
}


function drawLine(start, end){
	var path = new Path2D();
	path.moveTo(start[0], start[1]);
	path.lineTo(end[0], end[1]);
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

function translate(tx, ty, tz){
	return [
		[1, 0, 0, tx],
		[0, 1, 0, ty],
		[0, 0, 1, tz],
		[0, 0, 0, 1]
	];
}

function project(camera, z){
	try {
		return [
			[300/(camera-z), 0, 0, 0],
			[0, 300/(camera-z), 0, 0],
			[0, 0, 1, 0],
			[0, 0, 0, 1]
		];

	}
	catch(error){
		return [
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0]
		]
	}

}


class Shape{
	constructor(vertices, edges, center){
		this.vertices = vertices;
		this.edges = edges;
		this.center = center;
		this.transformed = [];
	}
	project(transformation, camera){
		for (var i = 0; i < this.vertices.length; i++){
			this.transformed[i] = matrixMult(matrixMult(translate(this.center[0], this.center[1], this.center[2]), transformation), this.vertices[i]);
			this.transformed[i] = matrixMult(project(camera, this.transformed[i][2]), this.transformed[i])
		}
	}
	draw(context, camera){
		for (var i = 0; i < this.edges.length; i++){
			var start = this.transformed[this.edges[i][0]];
			var end = this.transformed[this.edges[i][1]];
			if (start[2] >= camera || end[2] >= camera){
				break;
			}
			var path = drawLine(start, end);
			context.stroke(path);
		}
	}

	reset(screenWidth, screenHeight){
		this.center = [
			Math.random() * screenWidth - screenWidth / 2,
			Math.random() * screenHeight - screenHeight / 2,
			Math.random() * -4000 - 10000,
			0
		];

		this.center[0] *= this.center[2] / 700;
		this.center[1] *= this.center[2] / 700;
		if (this.center[0] >= 0){
			var velX = 5;
		}
		else {
			var velX = -5;
		}
		if (this.center[1] >= 0){
			var velY = 4;
		}
		else {
			var velY = -4;
		}
		this.velocity = [velX, velY, Math.random() * 20 + 20];
	}
}

var main = new Canvas("main-canvas");
main.draw();
