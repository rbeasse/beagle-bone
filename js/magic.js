var socket = io.connect('http://bone.beasse.co');

// Function to draw the potentiometer graph
var live_graph = function(reading, width, context){

	// Draw the line
	context.fillStyle = "#4f2222";
	context.fillRect(0, 0, width, reading);
	context.fill();

	// Move the image over
	var imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
	context.putImageData(imageData, width, 0);

	// Make room for the new line
	context.clearRect(0, 0, width, context.canvas.height);
};

// Pad numbers below 10 with a 0
function pad(number) {
    return (number < 10) ? '0' + number.toString() : number.toString();
}

// When the page is loaded..
var loaded = function(){	

	// Grab the canvas's
	var potentiometer_canvas  = document.getElementById("potentiometer_canvas");
	var potentiometer_context = potentiometer_canvas.getContext("2d");
	var cpu_canvas  = document.getElementById("cpu_canvas");
	var cpu_context = cpu_canvas.getContext("2d");

	// Change x and y to be bottoms up.
	potentiometer_context.translate(0, potentiometer_canvas.height);
	potentiometer_context.scale(1, -1);
	cpu_context.translate(0, cpu_canvas.height);
	cpu_context.scale(1, -1);

	// Function too send the slider value when it has been changed.
	var slider = function(){
		socket.emit(this.id, (this.value / 100));
	}

	// Grab the 3 sliders
	var led_pin_1 = document.getElementById("led_pin_1"),
		led_pin_2 = document.getElementById("led_pin_2"),
		led_pin_3 = document.getElementById("led_pin_3");

	// Set their onchange event
	led_pin_1.onchange = slider;
	led_pin_2.onchange = slider;
	led_pin_3.onchange = slider;

	// Set a default value to start at
	var potentiometer_value = 10;

	// Every 500 miliseconds draw a graph for the potentiometer
	setInterval(function(){
		live_graph(potentiometer_value, 4, potentiometer_context);
	}, 500);


	// When potentiometer is read, update the value and graph
	socket.on('potentiometer', function(reading) {
		potentiometer_value = reading;
		live_graph(reading, 1, potentiometer_context);
	});

	// When the user connects..
	socket.on('connected', function(reading) {
		document.getElementById('connecting').style.visibility = 'hidden'; 
	});

	// When the temp is read, update the div
	socket.on('temp', function(reading) {
		document.getElementById("temp").innerHTML = reading + "C";
	});

	// When the cpu is read, update the graph
	socket.on('cpu', function(reading) {
		document.getElementById("cpu").innerHTML = reading;
		live_graph(reading, 15, cpu_context);
	});

	// When the uptime is read, update the div and conver it
	socket.on('uptime', function(time) {

		// Every second..
		setInterval(function(){

			// Get hours
			var hours = Math.floor(time / 3600);
			
			// Get minutes
			var divisor_for_minutes = time % 3600;
			var minutes = Math.floor(divisor_for_minutes / 60);

			// Get seconds
			var divisor_for_seconds = divisor_for_minutes % 60;
    		var seconds = Math.ceil(divisor_for_seconds);

    		// Update the div
			document.getElementById("uptime").innerHTML = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);

			time++; // Add a second
		}, 1000); 
		
	});
}

document.addEventListener("DOMContentLoaded", loaded, false); 