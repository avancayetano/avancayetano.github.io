
var cameraDir = [0, 0, 0];
var cameraSpeed = 1;
document.addEventListener("keydown", function(event){
	event.preventDefault();
	if (event.key == "w"){
		cameraDir[1] = -1;
	}
	else if (event.key == "s"){
		cameraDir[1] = 1;
	}
	else if (event.key == "a"){
		cameraDir[0] = -1;
	}
	else if (event.key == "d"){
		cameraDir[0] = 1;
	}
	else if (event.key == " "){
		cameraDir[2] = 1;
	}
});

document.addEventListener("keyup", function(event){
	event.preventDefault();
	if (event.key == "w"){
		cameraDir[1] = 0;
	}
	else if (event.key == "s"){
		cameraDir[1] = 0;
	}
	else if (event.key == "a"){
		cameraDir[0] = 0;
	}
	else if (event.key == "d"){
		cameraDir[0] = 0;
	}
	else if (event.key == " "){
		cameraDir[2] = 0;	
	}
});


function Canvas(canvasId){
	var self = this;
	self.canvas = document.getElementById(canvasId);
	self.context = self.canvas.getContext("2d");
	self.canvas.height = document.body.clientHeight;
	self.canvas.width = document.body.clientWidth;

	self.fov = Math.PI / 2;
	self.screenZ = (self.canvas.height/2) / (Math.tan(self.fov/2));




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
	for (var i = 0; i < 50; i++){
		var z = Math.random()*5000 + 20000;
		var y = Math.random()*(2*Math.tan(self.fov/2)*z-1500) - Math.tan(self.fov/2)*z+1500;
		var x = (self.canvas.width/self.canvas.height) * (Math.random()*(2*Math.tan(self.fov/2)*z-1500)  - Math.tan(self.fov/2)*z+1500);
		shape = new Shape(vertices, edges, [
			[x],
			[y],
			[z],
			[1]
		]);
		shapes.push(shape);
	}

	self.context.globalAlpha = 1;


	self.clock;

	var transformations;
	var projectionMat;
	var translateMat;
	var rotateMatX;
	var rotateMatY;
	var rotateMatZ;
	var angle = 0;

	var elapsedTime;

	self.context.translate(Math.floor(self.canvas.width / 2), Math.floor(self.canvas.height / 2));
	self.context.lineWidth = 2;
	self.context.strokeStyle = "green";


	// self.canvas.parentElement.addEventListener("click", function(event){
	// 	event.preventDefault();
	// 	var z = Math.random()*5000 + 3000;
	// 	var yScreen = event.y - self.canvas.height/2;
	// 	var angle = Math.atan(yScreen/self.screenZ);
	// 	var y = Math.tan(angle)*z;
	// 	var x = (self.canvas.width/self.canvas.height) * y;
	// 	console.log(y);
	// 	console.log(x);


	// 	shapes.push(new Shape(vertices, edges, [
	// 		[x],
	// 		[y],
	// 		[z],
	// 		[1]
	// 	]));
	// })

	self.draw = function(timestamp){

		
		if (self.clock == undefined){
			self.clock = timestamp;
		}
		elapsedTime = ((timestamp - self.clock)) / 1000;
		self.clock = timestamp;
		self.context.clearRect(-Math.floor(self.canvas.width / 2), -Math.floor(self.canvas.height / 2), 
			Math.floor(self.canvas.width), Math.floor(self.canvas.height));

		rotateMatX = rotateX(angle);
		rotateMatY = rotateY(angle);
		rotateMatZ = rotateZ(angle);

		transformations = [
			matrixMult(rotateMatX, matrixMult(rotateMatY, rotateMatZ)),
			matrixMult(rotateMatZ, matrixMult(rotateMatX, rotateMatY)),
			matrixMult(rotateMatY, matrixMult(rotateMatZ, rotateMatX))
		]

		self.context.beginPath();

		for (var i = 0; i < shapes.length; i++){
			shapes[i].project(transformations[i % 3], self.screenZ);
			shapes[i].draw(self.context, self.screenZ);


			shapes[i].centerOffset = [
				shapes[i].centerOffset[0] + cameraDir[0] * cameraSpeed,
				shapes[i].centerOffset[1] + cameraDir[1] * cameraSpeed,
				shapes[i].centerOffset[2] + cameraDir[2] * cameraSpeed,
			];

			shapes[i].center[2][0] += shapes[i].velocity[2] * elapsedTime;
			shapes[i].center[1][0] += shapes[i].velocity[1] * elapsedTime;
			shapes[i].center[0][0] += shapes[i].velocity[0] * elapsedTime;

			if (shapes[i].isOutside(self.canvas.width, self.canvas.height, self.screenZ)){
				shapes[i].reset(self.canvas.width, self.canvas.height, self.fov, self.screenZ);
			}
		}

		self.context.stroke();

		angle += 0.01;

		

		window.requestAnimationFrame(self.draw);
	};


	return self;
}






function drawLine(context, start, end){
	context.moveTo(Math.floor(start[0]), Math.floor(start[1]));
	context.lineTo(Math.floor(end[0]), Math.floor(end[1]));
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
		[1, 0, 0, 0],
		[0, Math.cos(angle), -Math.sin(angle), 0],
		[0, Math.sin(angle), Math.cos(angle), 0],
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
		[Math.cos(angle), -Math.sin(angle), 0, 0],
		[Math.sin(angle), Math.cos(angle), 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	];
}


function orthogonalProject(){
	return [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, 0],
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
			var velX = 400;
		}
		else {
			var velX = -400;
		}
		if (this.center[1] >= 0){
			var velY = 300;
		}
		else {
			var velY = -300;
		}

		this.centerOffset = [0, 0, 0];

		this.velocity = [velX, velY, -(Math.random() * 2000 + 2000)];
	}
	project(transformation, screenZ){
		// transformation here are the rotations
		this.center[0][0] = this.center[0][0] - this.centerOffset[0];
		this.center[1][0] = this.center[1][0] - this.centerOffset[1];
		this.center[2][0] = this.center[2][0] - this.centerOffset[2];

		var translateMat = translate(this.center[0], this.center[1], this.center[2]);
		this.transformedCenter = matrixMult(perspectiveProject(screenZ, this.center[2][0]), this.center);
		var tempTransformation = matrixMult(translateMat, transformation);
		for (var i = 0; i < this.vertices.length; i++){
			this.transformed[i] = matrixMult(tempTransformation, this.vertices[i]);
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
			drawLine(context, start, end);
		}
	}

	isOutside(screenWidth, screenHeight, screenZ){
		if (this.transformedCenter[2][0] <= screenZ || 
			Math.abs(this.transformedCenter[1][0]) > screenHeight / 2 + 200 ||
			Math.abs(this.transformedCenter[0][0]) > screenWidth / 2 + 200){
				return true;
		}
	}

	reset(screenWidth, screenHeight, fov, screenZ){
		var z = Math.random()*5000 + 20000;
		var y = Math.random()*(2*Math.tan(fov/2)*z-1500) - Math.tan(fov/2)*z+1500;
		var x = (screenWidth/screenHeight) * (Math.random()*(2*Math.tan(fov/2)*z-1500)  - Math.tan(fov/2)*z+1500);
		this.center = [[x], [y], [z], [1]];
		this.velocity = [0, 0, -(Math.random() * 2000 + 2000)];
		this.centerOffset = [0, 0, 0];
	}
}

var main = new Canvas("main-canvas");

window.requestAnimationFrame(main.draw);