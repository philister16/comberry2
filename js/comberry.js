/**  
  * @desc loads different user inputs and draws chart comparing the different inputs
  * @author Philipp S. Nueesch phn@gmx.ch
  * @required Chart.js
  * @required jQuery
*/ 

/* Global Definitions
***********************************************/

// Making the resultChart responsive globally
Chart.defaults.global.responsive = true;
Chart.defaults.global.scaleFontSize = 16;
Chart.defaults.global.scaleFontColor = "#444";

// Brand prototype for alpha, omega and future expansion
var brandBasic = {
	berry : "",
	name : "beta",
	volume : 100,
	cost : 200,
	revenue : 600,
	profit : function() {
		return this.revenue - this.cost;
	},
	totalCost : function() {
		return this.volume * this.cost;
	},
	totalRevenue : function() {
		return this.volume * this.revenue;
	},
	totalProfit : function() {
		return this.volume * this.profit();
	}
}

// Constructor function to build brand objects from prototype
function brand(array) {
	this.berry = array[0];
	this.name = array[1];
	this.volume = array[2];
	this.cost = array[3];
	this.revenue = array[4];
}

// Copying the prototype into the constructor
brand.prototype = brandBasic;


/* Main app object (model & controller)
***********************************************/

var comberry = {

	// an array of 10 different containers (berries) that will contain the userInput to be compared
	containerBerries : ["strawberry", "raspberry", "blueberry", "cranberry", "blackberry", "dewberry", "mulberry", "wineberry", "juneberry", "cloudberry"],

	// an array of objects representing the brands to compare and added either by user or dev
	brand : [],

	// holds the totals of all added brands together
	altogether : {},

	// holds the brand with the highest profit
	maxProfBrand : {},

	// holds the brand with the lowest cost
	minCostBrand : {},

	sideBySideVolume : 1,

	colorScheme : {
		fillColor: ["rgba(220,220,220,0.5)", "rgba(178,182,121,0.5)", "rgba(78,205,196,0.5)"],
		strokeColor: ["rgba(220,220,220,0.8)", "rgba(178,182,121,0.8)", "rgba(78,205,196,0.8)"],
		highlightFill: ["rgba(220,220,220,0.75)", "rgba(178,182,121,0.75)", "rgba(78,205,196,0.75)"],
		highlightStroke: ["rgba(220,220,220,1)", "rgba(178,182,121,1)", "rgba(78,205,196,1)"],
	},

	/**
	  * Get values from user input fields and store in array
	  * @param {string} containerBerry from which to get inputs
	  * @return {array} ["Name", volume, cost, revenue]
	*/
	getUserInput : function(berry) {
		var userInput = [];

		var $workingArray = $("#" + berry).children("label");
		$workingArray = $workingArray.children("input");
		
		for(var i = 0; i < $workingArray.length; i++) {
			userInput.push($workingArray[i].value);
		}

		for(var i = 0; i < userInput.length; i++) {
			if(i > 0 && i < 4) { // only first element needs to be a string (brand name)
				userInput[i] = parseFloat(userInput[i]);
			}
		}
		return userInput;
	},

	/**
	  * Adds a new brand to the array brands
	  * @param {array} ["Name", volume, cost, revenue]
	  * @return {void}
	*/
	addBrand : function(array) {
		this.brand.push(new brand(array));
	},

	/**
	  * Removes a brand from the brand array
	  * @param {string} name of containerBerry in order to locate position in array 
	  * @return {void}
	*/
	deleteBrand : function(containerBerry) {

		var finder = this.findBrand(containerBerry);
		this.brand.splice(finder, 1);
	},

	/**
	  * Removes an entire input block from UI, then removes brand from brand array,
	  * updates totals of all other brands and renders the chart newly
	  * @param {string} name of containerBerry to locate which block
	  * @return {void}
	*/
	removeInputBlock : function(containerBerry) {
		$(".button-section."+containerBerry).remove();
		this.deleteBrand(containerBerry);
		this.containerBerries.push(containerBerry);
		this.updateAll();
		this.renderSingleChart(state);
	},

	/**
	  * Creates a new input block, appends it to the DOM
	  * Also instantiates a new brand object and inserts it in the brand array
	  * @return {void} || {bool} false (if no containerBerry left)
	*/
	addInputBlock : function() {
		var createData = [];

		// loads unique identifier for the container, if empty containers available
		if(this.containerBerries.length > 0) {
			createData.push(this.containerBerries.shift());
		} else {
			return false;
		}

		// loads the data from the create data input section into array
		$("#create-block").find("input").each(function() {
			createData.push($(this).val());
		});
		
		// builds up the html string which will be appended to the DOM
		var newBlock = '<div class="button-section '+createData[0]+'"><div class="bubble"><div id="'+createData[0]+'" class="form"><label><input type="text" placeholder="Name" value="'+createData[1]+'"><!----></label><label><span>Volume in units: </span><input type="number" value="'+createData[2]+'"></label><label><span>Cost per unit: </span><input type="number" value="'+createData[3]+'"></label><label><span>Revenue per unit: </span><input type="number" value="'+createData[4]+'"></label><input type="submit" class="btn-delete" name="'+createData[0]+'" onclick="deleteBrandAction(this.name)" value=""><input type="submit" class="btn-update" name="'+createData[0]+'" onclick="updateBrandAction(this.name)" value=""></div></div><button class="'+createData[0]+'">'+createData[1]+'<span class="icon-cancel-circle" title="'+createData[0]+'" onclick="deleteBrandAction(this.title)"></span></button></div>'
		$("#input").append(newBlock);

		// parses the numbers to actual numbers for correct maths in the updateAll() function
		for(var i = 0; i < createData.length; i++) {
			if(i > 1) { // only first 2 elements need to be a string (containerBerry and brand name)
				createData[i] = parseFloat(createData[i]);
			}
		}

		// instantiate a new brand object, update the altogether object and render the chart new
		this.addBrand(createData);
		this.updateAll();
		this.renderSingleChart(state);

	},

	updateSideBySideVolume : function() {
		this.sideBySideVolume = parseFloat($("#change-volume-block").find("input").val());
	},

	/**
	  * returns the position of a brand in the brands array
	  * @param {string} name of containerBerry in order to locate brand in brand array
	  * @return {number} position in array
	*/
	findBrand : function(containerBerry) {
		var finder = -1;
		for(var i = 0; i < this.brand.length; i++) {
			if(this.brand[i].berry === containerBerry) {
				finder = i;
			}
		}
		return finder;
	},

	/**
		* get index of brand array for brand with highest profit
		* @return {int} index in brand array
	*/
	getMaxProfit : function() {
		var highest = 0;
		var finder = 0;
		for(var i = 0; i < this.brand.length; i++) {
			if(this.brand[i].profit() > highest) {
				highest = this.brand[i].profit();
				finder = i;
			}
		}
		return finder;
	},

	getMinCost : function() {
		var lowest = this.brand[0].cost;
		var finder = 0;
		for(var i = 1; i < this.brand.length; i++) {
			if(this.brand[i].cost < lowest) {
				lowest = this.brand[i].cost;
				finder = i;
			}
		}
		return finder;
	},

	getOptVolume : function() {
		// divide current total profit through profit of most profitable brand
		var optVolume = this.altogether.profit / this.maxProfBrand.profit();
		return optVolume;
	},

	/**
	  * updates a single brand from user input
	  * @param {string} name of containerBerry in order to locate brand in brand array
	  * @param {array} user input
	  *	@return {void}
	*/
	updateBrand : function(containerBerry, userInput) {
		
		var finder = this.findBrand(containerBerry);
		
		this.brand[finder].name = userInput[0];
		this.brand[finder].volume = userInput[1];
		this.brand[finder].cost = userInput[2];
		this.brand[finder].revenue = userInput[3];
		this.updateAll();

	},

	/**
	  * updates the total of all brands together in the object altogether{}
	  *	@return {void}
	*/
	updateAll : function() {
		var vol = 0;
		var cos = 0;
		var rev = 0;
		var prof = 0;

		for (i = 0; i < this.brand.length; i++) {
			vol = vol + this.brand[i].volume;
			cos = cos + this.brand[i].totalCost();
			rev = rev + this.brand[i].totalRevenue();
			prof = prof + this.brand[i].totalProfit();
		}

		var allT = {
			name : "Current",
			volume : vol,
			cost : cos,
			revenue : rev,
			profit : prof
		}

		this.altogether = allT;

		// only needs to run when there are brands submitted by the user, otherwise some properties are missing and will throw an error
		if(this.brand.length > 0) {
			$.extend(this.maxProfBrand, this.brand[this.getMaxProfit()]);
			this.maxProfBrand.volume = this.altogether.volume;

			$.extend(this.minCostBrand, this.brand[this.getMinCost()]);
			this.minCostBrand.volume = this.altogether.volume;
		}
	},

	/**
	  * removes one brand from the array brand[], identified by the array item's index
	  * @param {number} position of brand in brand array
	  *	@return {void}
	*/
	removeBrand : function(index) {
		comberry.brand.splice(index, 1);
	},

	/**
	  * render a chart with single dataset
	  * takes an array as parameter defining [charttype, color, if combined bar is shown]
	  * @param {array} state = ["volume" | "cost" | "revenue" | "profit", integer, true | false, "Comparison" | "Maximize" | "Minimize" | "Optimize"]
	  *	@return {void}
	*/
	renderSingleChart : function(array) {

		// Set CSS selector of canvas element (incl. the "#")
		var canvas = "#resultChart";

		// array that hold data which is going to be plotted
		var axisLabels = [];
		var dataPoints = [];
		var viewData = [];

		// Switches between the different views, selected view is stored in state array at index 3
		switch(array[3]) {
			case "Maximize":
			// getMaxProfit returns index of brand with highest profit, thus is loaded into viewData
			viewData.push(this.maxProfBrand);
			array[2] = true; // shows the combined bar to compare to
			break;

			case "Minimize":
			// getMinCost
			viewData.push(this.minCostBrand);
			array[2] = true;
			break;

			case "Optimize":
			var optVolBrand = {};
			$.extend(optVolBrand, this.maxProfBrand);
			optVolBrand.volume = this.getOptVolume();
			viewData.push(optVolBrand);
			array[2] = true;
			break;

			case "SideBySide":
			array[2] = false;
			for(var i = 0; i < this.brand.length; i++) {
				viewData[i] = {};
				$.extend(viewData[i], this.brand[i]);
				viewData[i].volume = this.sideBySideVolume;
			}
			break;

			// the comparison view is default and also the initially displayed view, all brands are loaded as viewData
			default:
			viewData = this.brand;
		}



		// get the x-axis label
		for (i = 0; i < viewData.length; i++) {
			axisLabels.push(viewData[i].name);
		}
		if(array[2]) {
			axisLabels.push("Combined");
		}

		// switch to show either volume, cost, revenue or profit, selected page is stored in state array at position 0
		switch (array[0]) {
			case "Volume":
			for (i = 0; i < viewData.length; i++) {
				dataPoints.push(viewData[i].volume);
			}
			if(array[2]) {
				dataPoints.push(this.altogether.volume);
			}
			break;

			case "Cost":
			for (i = 0; i < viewData.length; i++) {
				dataPoints.push(viewData[i].totalCost());
			}
			if(array[2]) {
				dataPoints.push(this.altogether.cost);
			}
			break;

			case "Revenue":
			for (i = 0; i < viewData.length; i++) {
				dataPoints.push(viewData[i].totalRevenue());
			}
			if(array[2]) {
				dataPoints.push(this.altogether.revenue);
			}
			break;

			case "Profit":
			for (i = 0; i < viewData.length; i++) {
				dataPoints.push(viewData[i].totalProfit());
			}
			if(array[2]) {
				dataPoints.push(this.altogether.profit);
			}
			break;
		}

		// set context of canvas element
		var ctx = $(canvas).get(0).getContext("2d");

		// insert the labels and data points
		var data = {
	    labels: axisLabels,
	    datasets: [
	        {
	            label: array[0],
	            fillColor: this.colorScheme.fillColor[array[1]],
	            strokeColor: this.colorScheme.strokeColor[array[1]],
	            highlightFill: this.colorScheme.highlightFill[array[1]],
	            highlightStroke: this.colorScheme.highlightStroke[array[1]],
	            data: dataPoints
	        }
	    ]
	};
	var myBarChart = new Chart(ctx).Bar(data);
	},


/**
	  * builds up the string to go as title above charts
	  * takes an array as parameter defining [charttype, color, if combined bar is shown, selectedview]
	  * @param {array} state = ["volume" | "cost" | "revenue" | "profit", integer, true | false, "Comparison" | "Maximize" | "Minimize" | "Optimize"]
	  *	@return {void}
	*/
	getChartString : function(state) {
		var chartString = "";
			switch(state[3]) {
				case "Maximize":
				var potMoreProfit = this.maxProfBrand.totalProfit() - this.altogether.profit;
				potMoreProfit = potMoreProfit.toFixed(2);
				potMoreProfit = numFor.addCommas(potMoreProfit);
				chartString = "<strong>Maximize Profit</strong> - you would increase your profit by <strong>" + potMoreProfit + "</strong> with " + this.maxProfBrand.name;
				break;

				case "Minimize":
				var potLessCost = this.minCostBrand.totalCost() - this.altogether.cost;
				potLessCost = potLessCost.toFixed(2);
				potLessCost = numFor.addCommas(potLessCost);
				chartString = "<strong>Minimize Cost</strong> - you would decrease your cost by <strong>" + potLessCost + "</strong> with " + this.minCostBrand.name;
				break;

				case "Optimize":
				var potLessVolume = this.getOptVolume() - this.altogether.volume;
				potLessVolume = Math.floor(potLessVolume);
				potLessVolume = numFor.addCommas(potLessVolume);
				chartString = "<strong>Optimize Volume</strong> - you could decrease your volume by <strong>" + potLessVolume + "</strong> with " + this.maxProfBrand.name;
				break;

				case "SideBySide":
				chartString = "<strong>Side by Side</strong> - all options at same volume";
				break;

				default:
				chartString = "<strong>Comparison</strong> - compare your different options";
			}
		return chartString;
	} 
}

/* User interaction (main app controller)
***********************************************/

/**
	* Defaults on app start
	*/

// Defines defaults on app start
var currentPage = "Volume";
var activeColor = 2;
var toggleCombined = false;
var currentView = "Comparison";

// load defaults in state array
var state = [currentPage, activeColor, toggleCombined, currentView];

// hide all bubbles by default except for the create item bubble with name field in autofocus
$(".bubble").hide();
$("#toggleVolumeSwitch").hide();
$("#newberry").siblings().show().find("input[type='text']").focus();
$("#chartTitle").html(comberry.getChartString(state));

/**
	* Main navigation (footer tabs)
	*/
$(".botnav-main").click(function() {
	state[0] = $(this).attr('title');
	comberry.renderSingleChart(state);
	// $("#chartTitle").text(state[0]);
	$(this).addClass('botnav-active');
	$(this).siblings('li').removeClass('botnav-active');
});


/**
	* Update and delete brands
	*/

// Update a brand button 2
function updateBrandAction(berry) {
	var userInput = comberry.getUserInput(berry);
	comberry.updateBrand(berry, userInput);
	comberry.renderSingleChart(state);

	// update the toggle button with new user input and append the span with delete icon again
	var deleteSpan = '<span class="icon-cancel-circle" title="'+berry+'" onclick="deleteBrandAction(this.title)"></span>';
	$("button."+berry).text(userInput[0]).append(deleteSpan);

	// hide the bubble again
	$(".bubble").hide();
	$("button."+berry).removeClass('btn-active');
}

// delete a brand/item
function deleteBrandAction(berry) {
	// check if still 2 brands are loaded, if not switch view to default comparison and show reduced menu options
	// Hacky: becaue we hardcoded renderSinglechart in method we need to assume that if deleteBrandAction is called
	// user has made decision, should there be less than 3 brands already we will end up with less than two after function call
	// that way we can update state array before renderSingleChart is called through the removeInputBlock method
	if(comberry.brand.length < 3) {
		state[3] = "Comparison";
		$("#topmenu ul li").removeClass('botnav-active');
		$("#topmenu ul li").first().addClass('botnav-active'); // comparison is the first menu item
		// brings in the combined bar switch again
		if(state[2]) {
			$("#toggleCombinedSwitch").show().text("Hide Combined Bar");
		} else {
			$("#toggleCombinedSwitch").show().text("Show Combined Bar");
		}
		$("#chartTitle").html(comberry.getChartString(state));
		$("#full-topmenu").hide();
		$("#reduced-topmenu").show();
	}
	comberry.removeInputBlock(berry);
	if(comberry.containerBerries.length > 0) {
		$("#newberry").show();
	}
} 


/**
	* Toggle the combined bar through special button
	*/
$("#toggleCombinedSwitch").click(function() {
	if(state[2]) {
		$("#toggleCombinedSwitch").text("Show Combined Bar");
		state[2] = false;
	} else {
		$("#toggleCombinedSwitch").text("Hide Combined Bar");
		state[2] = true;
	}
	comberry.renderSingleChart(state);
});


/**
	* Change the volume to compare on in the side by side view
	*/
$("#changeVolumeBlock").click(function() {
	comberry.updateSideBySideVolume();
	comberry.renderSingleChart(state);
	$(".bubble-short").hide();
});


/**
	* Create a new input-block form interaction
	*/
$("#createInputBlock").click(function() {
	comberry.addInputBlock();
	$(".bubble").hide();
	if(comberry.containerBerries.length < 1) {
		$("#newberry").hide();
	}
	// remove all inputted values so when user returns to add another item finds empty field
	$("#create-block").find("input[type='text'], input[type='number']").val("");
});


/**
	* Toggle the bubbles
	*/
//!! potential ERROR - combined switch button has no siblings therefore is not targeted by this functions, if this is changed code will break
$("#input").on("click", function() {
	if(event.target.nodeName === "BUTTON") {
		var clickedNode = event.target;

		// add the btn-active class to the button which is currently clicked/whose bubble is opened
		var showBubble = $(clickedNode).hasClass('btn-active');
		if(showBubble) {
			$(clickedNode).removeClass('btn-active');
		} else {
			$(clickedNode).addClass('btn-active');
		}
		$(clickedNode).siblings().toggle();

		// autofocus on field name first in the add new button's bubble
		if($(clickedNode).hasClass('btn-special')) {
			$(clickedNode).siblings().find(".focussed").focus();
		}
	}
});


/**
	* Top menu navigation controller
	*/

// Intitials
var $helpPage = $("#help");
var $topmenu = $("#topmenu")
var topnavState = false;
$helpPage.hide();
$topmenu.hide();

// show help page when question mark is clicked
$(".icon-question").click(function() {
	$(".topnav-left").toggleClass('topnav-active');
	$helpPage.toggle();
});

// show menu when menu icon is clicked
$(".icon-menu").click(function() {
	$(".topnav-right").toggleClass('topnav-active');
	if(comberry.brand.length < 2) {
		$("#reduced-topmenu").show();
		$("#full-topmenu").hide();
	} else {
		$("#full-topmenu").show();
		$("#reduced-topmenu").hide();
	}
	$topmenu.toggle();
});

// load view selection into state array
$("#topmenu ul").on("click", function() {
	var clickedNode = event.target;

	// if we show the reduced menu makes sure a click on the reduced message doesn't change the state array
	if(event.target.title !== "reduced-topmenu-message") {
		$("#topmenu ul li").removeClass('botnav-active');
		$(clickedNode).addClass('botnav-active');
		state[3] = event.target.title;
	}

	// plot the chart title
	$("#chartTitle").html(comberry.getChartString(state));

	// close the topmenue
	$topmenu.toggle();
	$(".topnav-right").toggleClass('topnav-active');

	// Show the combined bar switch button only with the comparison chart
	if(state[3] === "Comparison") {
		if(state[2]) {
			$("#toggleCombinedSwitch").show().text("Hide Combined Bar");
		} else {
			$("#toggleCombinedSwitch").show().text("Show Combined Bar");
		}
	} else {
		$("#toggleCombinedSwitch").hide();
	}

	// Show the volume switch button only with the sidebyside chart
	if(state[3] === "SideBySide") {
		$("#toggleVolumeSwitch").show();
	} else {
		$("#toggleVolumeSwitch").hide();
	}

	// render the chart
	comberry.renderSingleChart(state);
});

// Close the pages when touching them
$("#help").click(function() {
	$helpPage.hide();
	$(".topnav-left").removeClass('topnav-active');
	topnavState = false;
});