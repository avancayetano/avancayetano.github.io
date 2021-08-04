function main(){
	var canvas = document.getElementById("main-canvas");
	var context = canvas.getContext("2d");
	canvas.width = document.body.clientWidth; 
	canvas.height = document.body.clientHeight;

	var mousePos = {x:0, y:0};

	canvas.addEventListener("mousemove", function(event){
		event.preventDefault();
		context.clearRect(0, 0, canvas.width, canvas.height);
		mousePos = {x: event.offsetX, y:event.offsetY};
		var path = drawLine({x:mousePos.x, y: 0}, {x:mousePos.x, y: canvas.height});

		context.lineWidth = 2;
		context.strokeStyle = "red";
		context.stroke(path);
		



	});

}


function drawLine(start, end){
	var path = new Path2D();
	path.moveTo(start.x, start.y);
	path.lineTo(end.x, end.y);
	return path;
}


main();
