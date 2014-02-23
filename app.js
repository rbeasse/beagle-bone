var os = require('os');
var beaglebone = require('bonescript');
var io = require('socket.io').listen(8000);
var exec = require('child_process').exec;

// Command to get the CPU usage.
var command = "top -bn 1 | awk '{print $9}' | tail -n +8 | awk '{s+=$1} END {print s}'";


io.set('log level', 1); // Do not show all logs.

// Assign each PIN we will be reading.
var led_pin_1 = "P8_13",
    led_pin_2 = "P8_19",
	led_pin_3 = "P9_14",
	potentiometer = "P9_36",
	TMP36 = "P9_38";
    
// Set up some variables.
var potentiometer_reading, potentiometer_check;
    
// When a user connects..
io.sockets.on('connection', function(socket){

	// Let the user know that they have connected.
	socket.emit("connected", "welcome");

	// Send the current uptime and the reading from the TMP36
	socket.emit("uptime", os.uptime());
	beaglebone.analogRead(TMP36, send_temp); 
    send_cpu();

    // Every 500 miliseconds listen for a reading from the potentiometer.
    setInterval(function(){
		beaglebone.analogRead(potentiometer, check_potentiometer); 
	}, 500);

	// Every 2 seconds send the cpu % and the temp
	setInterval(function(){
		beaglebone.analogRead(TMP36, send_temp); 
		send_cpu();
	}, 2000);

	// When a slider is changed, change the following LED
	socket.on("led_pin_1", function(data) {
		beaglebone.analogWrite(led_pin_1, data, 2000, null);
	});

	socket.on("led_pin_2", function(data) {
		beaglebone.analogWrite(led_pin_2, data, 2000, null);
	});

	socket.on("led_pin_3", function(data) {
		beaglebone.analogWrite(led_pin_3, data, 2000, null);
	});

	// Checks for the value of the potentiometer - if it is not changed, nothing is sent
	function check_potentiometer(reading) {
		potentiometer_check = Math.floor(reading.value * 100);
		if (potentiometer_reading != potentiometer_check
								  && !isNaN(potentiometer_check)){
			potentiometer_reading = potentiometer_check;
			socket.emit("potentiometer", potentiometer_check);
		}
	}  

	// Sends a valid temp
	function send_temp(reading){
		var millivolts = (reading.value * 1800);
		var temp_c = (millivolts - 500) / 10;
		if (!isNaN(temp_c)){
			socket.emit("temp", temp_c);
		}
	}

	// Sends the CPU usage
	function send_cpu(){
		exec(command, function (error, stdout, stderr) {
		  socket.emit("cpu", stdout);
		});
	}

});

