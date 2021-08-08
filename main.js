
function Canvas(canvasId){
	var self = this;
	self.canvas = document.getElementById(canvasId);
	self.context = self.canvas.getContext("2d");
	self.canvas.height = document.body.clientHeight;
	self.canvas.width = document.body.clientWidth;


	var vertices = [
		[[-100], [-100], [-100]],
		[[100], [-100], [-100]],
		[[100], [100], [-100]],
		[[-100], [100], [-100]],
		[[-100], [-100], [100]],
		[[100], [-100], [100]],
		[[100], [100], [100]],
		[[-100], [100], [100]]
	];
	var edges = [
		[0, 1], [1, 2], [2, 3], [3, 0],
		[4, 5], [5, 6], [6, 7], [7, 4],
		[0, 4], [1, 5], [2, 6], [3, 7]
	];
	var shape = new Shape(vertices, edges, [0, 0, 0]);

	var transformation;
	var projectionMat;
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

		projectionMat = orthogonalProject();
		rotateMatY = rotateY(angle);
		rotateMatZ = rotateZ(angle);
		transformation = matrixMult(matrixMult(projectionMat, rotateMatY), rotateMatZ);
		shape.transform(transformation);
		shape.draw(self.context);
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
		[0, Math.cos(angle), Math.sin(angle)],
		[1, 0, 0],
		[0, -Math.sin(angle), Math.cos(angle)]
	];
}

function rotateY(angle){
	return [
		[Math.cos(angle), 0, Math.sin(angle)],
		[0, 1, 0],
		[-Math.sin(angle), 0, Math.cos(angle)]
	];
}

function rotateZ(angle){
	return [
		[Math.cos(angle), Math.sin(angle), 0],
		[-Math.sin(angle), Math.cos(angle), 0],
		[0, 0, 1]
	];
}


function orthogonalProject(){
	return [
		[1, 0, 0],
		[0, 1, 0],
		[0, 0, 0]
	];
}


class Shape{
	constructor(vertices, edges, center){
		this.vertices = vertices;
		this.edges = edges;
		this.center = center;
		this.transformed = [];
	}
	transform(transformation){
		for (var i = 0; i < this.vertices.length; i++){
			this.transformed[i] = matrixMult(transformation, this.vertices[i]);
		}
	}
	draw(context){
		for (var i = 0; i < this.edges.length; i++){
			context.stroke(drawLine(this.transformed[this.edges[i][0]], this.transformed[this.edges[i][1]]));
		}
	}
}

var main = new Canvas("main-canvas");
main.draw();
