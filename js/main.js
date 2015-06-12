var $controlButton = $("#controlBtn");
var $urlInput = $("#urlInpt");
var $canvas = $("#canvas");
var $logsBtn = $("#logsBtn");
var $canvasStatus = $canvas.find("#canvasStatus");
var $canvasGraph = $canvas.find("#canvasGraph .ct-chart");
$canvasGraph.html('');

var data = {}, serverUrl = "", columnDone = 0; logs = '';

function startRecording() {
	logs += "START recording\n";
	$.get(serverUrl + "/control/stop", function(){
		logs += "GET: " + serverUrl + "/control/stop | SUCCESS\n";
		$.get(serverUrl + "/control/start", function() {
			logs += "GET: " + serverUrl + "/control/start | SUCCESS\n";
		}).fail(function(){
			logs += "GET: " + serverUrl + "/control/stop | FAIL\n";
		});
	}).fail(function() {
		stopRecording();
		$canvasStatus.text("Unable to connect to server");
		logs += "GET: " + serverUrl + "/control/stop | FAIL\n";
		// Alert the user that the app cannot connect to the server.
	});
}

function stopRecording() {
	logs += "STOP recording\n";
	$.get(serverUrl + "/control/stop", function() {
		logs += "GET: " + serverUrl + "/control/stop | SUCCESS\n";
		$.get(serverUrl + "/status", function(status) {
			logs += "GET: " + serverUrl + "/status | SUCCESS\n";
			logs += JSON.stringify(status) + "\n";
			data = {};
			columnDone = 0;
			var setKeys = Object.keys(status.sets);
			var setKey = setKeys[setKeys.length - 1];
			var set = status.sets[setKey];
			logs += "SELECTED SET: " + setKey + "\n";
			var colIDs = set.colIDs;

			for( var i = 0; i < colIDs.length; i++ ) {
				var col = status.columns[colIDs[i]];
				data[col.name] = {};
				data[col.name].unit = col.unit;
				data[col.name].formatStr = col.formatStr;
				(function(col, i){
					$.get(serverUrl + "/columns/" + colIDs[i], function(column){
						logs += "GET: " + serverUrl + "/columns/" + colIDs[i] + " | SUCCESS\n";
						logs += column + "\n";
						data[col.name].values = column.values;
						columnDone++;
						if(columnDone == colIDs.length) {
							displayData();	
						}
					});
				})(col, i);
			}
		});
	}).fail(function() {
		logs += "GET: " + serverUrl + "/control/stop | FAIL\n";
		$canvasStatus.text("Unable to connect to server");
	});
}

function displayData() {
	logs += "DISPLAY data\n";
	logs += JSON.stringify(data, null, 2) + "\n\n";
	console.log(logs);
	var chartData = {
		// A labels array that can contain any sort of values
		labels: data.Time.values,
		// Our series array that contains series objects or in this case series data arrays
		series: [data.Pressure.values]
	};
	new Chartist.Line('.ct-chart', chartData, {lineSmooth: false, showPoint: false, axisY:{onlyInteger: true, showGrid: false}});
}


function onControlClick(e) {
	if($(this).hasClass("btn-green")) {
		$(this).removeClass("btn-green");
		$(this).text("Stop");
		$(this).addClass("btn-red");
		$urlInput.prop("disabled", true);
		serverUrl = $urlInput.val().trim();
		$canvasStatus.text("Recording data");
		$canvasGraph.html('');
		startRecording();
	}
	else {
		$(this).removeClass("btn-red");
		$(this).text("Start");
		$(this).addClass("btn-green");
		$urlInput.prop("disabled", false);
		$canvasStatus.text("");
		//$canvasGraph.show();
		stopRecording();	
	}
}
$controlButton.fastButton(onControlClick);
$controlButton.on("click", onControlClick);

$logsBtn.fastButton(function() {
	var body = logs;
	body = body.replace(/\n/g, "%0D%0A");
	body = body.replace(/&/g, "%26");
	document.location.href = 'mailto:jugalm9@gmail.com?subject=Labquest&body=' + body;
});