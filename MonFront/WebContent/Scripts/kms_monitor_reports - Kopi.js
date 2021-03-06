﻿function Report_PopulateGroupSelectBox(afterPopulateCallback) {
    $.getJSON(CONST_BASEURL + "jobs", function (data) {
        resultGroups = { "items": [] };
        jQuery.each(data.data, function (i) {
            resultGroups.items.push({ "value": data.data[i].id, "text": data.data[i].name, "default": false });
        });
        PopulateSelectBox($("#sbReportGroup"), resultGroups);

        if (afterPopulateCallback != undefined) {
            afterPopulateCallback();
        }
    });
}

function Report_PopulateRequestSelectBox(groupId, afterPopulateCallback) {
    $.getJSON(CONST_BASEURL + "jobs/" + groupId + "/queries", function (data) {
        selectItems = { "items": [] };
        selectItems.items.push({ "value": "_all", "text": "All", "default": false });
        jQuery.each(data.data, function (i) {
            selectItems.items.push({ "value": data.data[i].id, "text": data.data[i].name, "default": false });
        });
        PopulateSelectBox($("#sbReportRequest"), selectItems);

        if (afterPopulateCallback != undefined) {
            afterPopulateCallback();
        }
    });
}

function Report_PopulateSLASelectBox(groupId, afterPopulateCallback) {
    $.getJSON(CONST_BASEURL + "sla", function (data) {
        selectItems = { "items": [] };
        selectItems.items.push({ "value": "_nosla", "text": "No SLA", "default": true });
        jQuery.each(data.data, function (i) {
            selectItems.items.push({ "value": data.data[i].id, "text": data.data[i].name, "default": false });
        });
        PopulateSelectBox($("#sbReportSLA"), selectItems);
    });
}

function Report_PopulateExportSelectBox() {
    PopulateSelectBox($("#sbExport"), KMSMonitor_Export);
}

function Report_PopulatePeriodSelectBox() {
    PopulateSelectBox($("#sbReportPeriod"), KMSMonitor_Periods);
}

function Report_GetReportDataQuery() {

    var requestId = $("#sbReportRequest :selected").val();
    var requestName = $("#sbReportRequest :selected").text();
    var useAggLogs = $("#cbUseAgg").is(":checked");

    var reportData = { "requests": [] };

    var serviceUrl;
    serviceUrl = CONST_BASEURL + "jobs/" + $("#sbReportGroup").val();
    serviceUrl += "/queries/" + $("#sbReportRequest").val();

    if (useAggLogs == true) {
        serviceUrl += "/aggLogs";
    } else {
        serviceUrl += "/logs";
    }
    serviceUrl += "?minDate=" + $("#tbPeriodFrom").val() + "&maxDate=" + $("#tbPeriodTo").val();

    if ($("#sbReportSLA :selected").val() != "_nosla") {
        serviceUrl += "&useSla=" + $("#sbReportSLA :selected").val();
    }

    $.getJSON(serviceUrl, function (data) {
        var reportDataRequest = Report_BuildReportRequestDataStructure(data, requestId, requestName);
        reportData.requests.push(reportDataRequest);
        Report_PlotGraph(reportData);
    });

    /*
    Make request for service health chart (stacked bar chart)
    Notice that any selected service in sbReportRequest will be ignored. 
    */

    serviceUrl = CONST_BASEURL + "serviceapi/groups/" + $("#sbReportGroup option:selected").text() + "/stats/?minDate=" + $("#tbPeriodFrom").val() + "&maxDate=" + $("#tbPeriodTo").val() + "&jsonpCallback=?";

    // Show Service Health chart (stacked bar chart)
    showServiceHealthChart(serviceUrl);


}

function Report_GetReportDataAll() {

    // New datastructure containing report data for all requests
    var reportData = { "requests": [] };
    var requestCount = $("#sbReportRequest option").length;
    var completedCount = 0;
    var useAggLogs = $("#cbUseAgg").is(":checked");

    // Loop through all requests
    $("#sbReportRequest option").each(function (idx, element) {

        var requestId = $(element).val();
        var requestName;
        if ($(element).val() == "_all") {
            requestName = "Summary";
        } else {
            requestName = $(element).text();
        }
        
        // Create service url for current request
        serviceUrl = "jobs/" + $("#sbReportGroup").val();
        if (requestId != "_all") { // "_all" = summery log data
            serviceUrl += "/queries/" + requestId;
        }
        if (useAggLogs == true) {
            serviceUrl += "/aggLogs";
        } else {
            serviceUrl += "/logs";
        }
        serviceUrl += "?minDate=" + $("#tbPeriodFrom").val() + "&maxDate=" + $("#tbPeriodTo").val();

        // Check if SLA is selected
        if ($("#sbReportSLA :selected").val() != "_nosla") {
            serviceUrl += "&useSla=" + $("#sbReportSLA :selected").val();
        }
        // get log data for current request
        AjaxGet(serviceUrl, function (data) {

            var reportDataRequest = Report_BuildReportRequestDataStructure(data, requestId, requestName);
            reportData.requests.push(reportDataRequest);

            if (reportData.requests.length == requestCount) {
                
		Report_PlotGraph(reportData);
		
		// Added by Nikolaj Kamstrup
		showServiceResponseTimeChart(reportData);


            };
        	            
        }, undefined, false);

    });

    /*
    Make request for service health chart (stacked bar chart)
    Notice that any selected service in sbReportRequest will be ignored. 
    */

    serviceUrl = CONST_BASEURL + "serviceapi/groups/" + $("#sbReportGroup option:selected").text() + "/stats/?minDate=" + $("#tbPeriodFrom").val() + "&maxDate=" + $("#tbPeriodTo").val() + "&jsonpCallback=?";

    // Show Service Health chart (stacked bar chart)
    showServiceHealthChart(serviceUrl);


    // Show Service Response Time chart (line chart)
    showServiceResponseTimeChart(reportData);


}

function Report_BuildReportRequestDataStructure(data, requestId, requestName) {

    var useAggLogs = $("#cbUseAgg").is(":checked");
    var useSla = false;
    if  ($("#sbReportSLA :selected").val() != "_nosla") {
    	useSla = true;
    }

    
    // Create new request header in report datastructure for current request
    var reportDataRequest = { "requestId": requestId, "requestName": requestName, "timeMin": 0, "timeMax": 0, "graphData": [] };

    // Sorting data by time accending
    if (useAggLogs) {
    	data.data.sort(function (a, b) { return (a["date"] > b["date"]) ? 1 : ((a["date"] < b["date"]) ? -1 : 0); });
    } else {
    	data.data.sort(function (a, b) { return (a["time"] > b["time"]) ? 1 : ((a["time"] < b["time"]) ? -1 : 0); });
    }
    
    // Loop through all log data for current request and add to report datastructure
    $.each(data.data, function (idx) {

        var timeValue;
        var delay;
        
        if (useAggLogs == true) {

        	if (useSla) {
        		delay = data.data[idx].h1MeanRespTime * 1000;
        	} else {
        		delay = data.data[idx].h24MeanRespTime;
        	}
        	
            timeValue = $.datepicker.parseDate("yy-mm-dd", data.data[idx].date);
            
            if (useSla) {
            	timeValue.setHours(data.data[idx].date.substring(11, 13));
                timeValue.setMinutes(data.data[idx].date.substring(14, 16));
                timeValue.setSeconds(data.data[idx].date.substring(17, 19));
            }

        } else {

            // Parsing time and date into Date object, partially using datepicker functionallity.
            timeValue = $.datepicker.parseDate("yy-mm-dd", data.data[idx].time);
            timeValue.setHours(data.data[idx].time.substring(11, 13));
            timeValue.setMinutes(data.data[idx].time.substring(14, 16));
            timeValue.setSeconds(data.data[idx].time.substring(17, 19));

            delay = data.data[idx].delay;
        }
        
        // Add graph data
        //reportDataRequest.graphData.push([timeValue, delay]);
        reportDataRequest.graphData.push([timeValue.getTime(), delay]);

        // Update timeMin and timeMax if current values are new max values
        if (delay > reportDataRequest.timeMax) {
            reportDataRequest.timeMax = delay;
        }

        if (delay < reportDataRequest.timeMin) {
            reportDataRequest.timeMin = delay;
        }

    });
    
    return reportDataRequest;
}

function Report_InsertCheckboxes() {

    // insert checkboxes 
    var choiceContainer = $("#pGraphChoices");
    $(choiceContainer).empty();

    // Only show checkboxes if "all" requests is selected.
    if ($("#sbReportRequest :selected").val() == "_all") {

        $.each($("#sbReportRequest option"), function (i) {
            if ($(this).val() == "_all") {
                choiceContainer.append("<input type='checkbox' checked='checked' id='cbRequest" + $(this).val() + "'></input><label>Summary</label>&nbsp;&nbsp;");
            } else {
                choiceContainer.append("<input type='checkbox' checked='checked' id='cbRequest" + $(this).val() + "'></input>" +
                    "<label>"
                    + $(this).text() + "</label>&nbsp;&nbsp;");
            }
        });

        //choiceContainer.find("input").click(function () {
        //    Report_GetReportDataAll()
        //});

    }

}

// Plot report data in graph for selected requests
// Parameters:
function Report_PlotGraph(reportData) {


    // Determine min and max values for selected report data to be shown in graph
    var timeMin = 0;
    var timeMax = 0;

    // Loop through all requests
    $.each(reportData.requests, function (idx) {

        // Check if current request has been selected by the user or if a specific request has been selected
        if ($("#sbReportRequest :selected").val() != "_all" || $("#cbRequest" + reportData.requests[idx].requestId).is(":checked") == true) {

            if (reportData.requests[idx].timeMax > timeMax) {
                timeMax = reportData.requests[idx].timeMax;
            }

            if (reportData.requests[idx].timeMin < timeMin) {
                timeMin = reportData.requests[idx].timeMin;
            }
        }
    });

    // Prepare data for plotting in graph
    var flotGraphData = [];
    $.each(reportData.requests, function (idx) {
        
        // Only include requests that have been selected by user or if specific request has been selected.
        if ($("#sbReportRequest :selected").val() != "_all" || $("#cbRequest" + reportData.requests[idx].requestId).is(":checked") == true) {
            var flotSeries = {};
            flotSeries.data = reportData.requests[idx].graphData;
            flotSeries.label = reportData.requests[idx].requestName;

            flotGraphData.push(flotSeries);
        }
    });

    $("#divReportGraph").empty();
    
    // Plot data
    $.plot("#divReportGraph", flotGraphData, {
        yaxis: { min: timeMin, max: timeMax },
        xaxis: { mode: "time", timezone: "browser" },
        grid: { hoverable: true, clickable: true },
        zoom: {
            interactive: true
        },
        pan: {
            interactive: true
        },
        series: {
            lines: { show: true },
            points: { show: true }
        }
    });


}

function Report_Init() {
    Report_PopulateGroupSelectBox(function () {
        Report_PopulateRequestSelectBox($("#sbReportGroup :selected").val(),
            function () { Report_InsertCheckboxes(); });
    });
    Report_PopulatePeriodSelectBox();
    Report_PopulateSLASelectBox();
    Report_PopulateExportSelectBox();

    Report_AddEventHandlers();

    $("#tbPeriodFrom").datepicker({ dateFormat: "yy-m-d", firstDay: 1 });
    $("#tbPeriodTo").datepicker({ dateFormat: "yy-m-d", firstDay: 1 });

    $("#cbUseAgg").attr("checked", true);
    
}

function Report_AddEventHandlers() {


    $("#sbReportGroup").change(function () {
        Report_PopulateRequestSelectBox($("#sbReportGroup :selected").val(),
            function () {
                Report_InsertCheckboxes();
            });
    });

    $("#sbReportRequest").change(function () {
        Report_InsertCheckboxes();
    });

    $("#bnDisplayReport").click(function () {

	// show status/loading image
        $("#service_response_time_status_img").show();
        $("#service_response_health_status_img").show();

    	
    	if ($("#sbReportRequest :checked").val() != "_all") {
            Report_GetReportDataQuery();
        } else {
            Report_GetReportDataAll();
        }
    });
    
    $("#sbReportPeriod").change(function () {
        
        var periodId = $("#sbReportPeriod :selected").val();

        if (periodId != 0 && periodId != "_all") {
            var minDate = CalculateMinDate(parseInt(periodId));
            var maxDate = new Date;
            maxDate = maxDate.getFullYear() + "-" + (maxDate.getMonth() + 1) + "-" + maxDate.getDate();
            $("#tbPeriodFrom").val(minDate);
            $("#tbPeriodTo").val(maxDate);
        }
        else {
            $("#tbPeriodFrom").val("");
            $("#tbPeriodTo").val("");
        }


    });

    $("#tbPeriodFrom").change(function () {
        $("#sbReportPeriod").val(0);
    });

    $("#tbPeriodTo").change(function () {
        $("#sbReportPeriod").val(0);
    });


    $("#divReportGraph").bind("plothover", function (event, pos, item) {
        if (item) {

            if (previousPoint != item.dataIndex) {
                previousPoint = item.dataIndex;

                $("#tooltip").remove();
                var x = item.datapoint[0].toFixed(2),
					y = item.datapoint[1].toFixed(2);

                var xTime = new Date(parseInt(x));
                var xTimeString = FormatNumberLength(xTime.getDate(), 2) + "." + FormatNumberLength((xTime.getMonth() + 1), 2) + "." + xTime.getFullYear() + " " + FormatNumberLength((xTime.getHours()), 2) + ":" + FormatNumberLength((xTime.getMinutes()), 2);

                showTooltip(item.pageX, item.pageY,
							"Request: " + item.series.label + "<br />Time: " + xTimeString + "<br />Response time: " + parseInt(y) + " ms");

            }
        }
        else {
            $("#tooltip").remove();
            previousPoint = null;
        }

    });

    $("#bnExport").click(function () {
        var groupId = $("#sbReportGroup :selected").val();
        var requestId = $("#sbReportRequest :selected").val();
        var exportId = $("#sbExport :selected").text();
        var minDate = $("#tbPeriodFrom").val();
        var maxDate = $("#tbPeriodTo").val();
        var slaText = $("#sbReportSLA :selected").val();
        var slaVal = $("#sbReportSLA :selected").val();
        var useAgg = $("#cbUseAgg").is(":checked");

        var url = "";

        switch (exportId) {
        
        case "stats_csv":
        	
        	if (useAgg == true) {
        		alert("Selected export not supported with aggregated report data.");
        	} else if (requestId != "_all") {
        		alert("Selected export only supported with all requests selected.");
        	} else {
        		url = url + "/logs/statexport?minDate=" + minDate + "&maxDate=" + maxDate;
        	}
        	if (slaVal != "_nosla") {
                url = url + "&useSla=" + slaText;
            }
        	break;
        
        default:

        	if (useAgg == true) {
	            
	            if (slaVal == "_nosla") {
	                if (requestId == "_all") {
	                    url = url + "/aggLogs/export/" + exportId + "?minDate=" + minDate + "&maxDate=" + maxDate;
	                } else {
	                    url = url + "/requests/" + requestId + "/aggLogs/export/" + exportId + "?minDate=" + minDate + "&maxDate=" + maxDate;
	                }
	            } else {
	                if (requestId == "_all") {
	                    url = url + "/aggHourLogs/export/" + exportId + "?minDate=" + minDate + "&maxDate=" + maxDate + "&useSla=" + slaVal;
	                } else {
	                    url = url + "/requests/" + requestId + "/aggHourLogs/export/" + exportId + "?minDate=" + minDate + "&maxDate=" + maxDate + "&useSla=" + slaVal;
	                }
	            }
	        } else {
	            if (requestId == "_all") {
	                url = url + "/logs/export/" + exportId + "?minDate=" + minDate + "&maxDate=" + maxDate;
	            } else {
	                url = url + "/requests/" + exportId + "/logs/export/" + xsltId + "?minDate=" + minDate + "&maxDate=" + maxDate;
	            }
	            if (slaVal != "_nosla") {
	                url = url + "&useSla=" + slaText;
	            }
	        };
	
	        break;
	        
        }
        
        if (url != "") {
            url = CONST_BASEURL + "groups/" + groupId + url;
            window.location.href = url;
        }

    });

}

function CalculateMinDate(periodId) {

    var minDate;
    var today = new Date();

    switch (periodId) {
        case 1: // Today
            minDate = today;
            break;
        case 2: // Yesterday
            var yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            minDate = yesterday;
            break;
        case 3: // Last week
            var lastweek = new Date();
            lastweek.setDate(today.getDate() - 7);
            minDate = lastweek;
            break;
        case 4: // This month
            var thismonth = new Date();
            thismonth.setDate(1);
            minDate = thismonth;
            break;
        case 5: // Past six months
            var past6months = new Date();
            past6months.setMonth(today.getMonth() - 5);
            past6months.setDate(1);
            minDate = past6months;
            break;
        case 6: // Past year
            var pastyear = new Date();
            pastyear.setYear(today.getFullYear() - 1);
            pastyear.setDate(1);
            minDate = pastyear;
            break;
        default: 'All';
    }
    return minDate.getFullYear() + "-" + (minDate.getMonth() + 1) + "-" + minDate.getDate();
}

function showTooltip(x, y, contents) {
    $('<div id="tooltip">' + contents + '</div>').css({
        position: 'absolute',
        display: 'none',
        top: y + 5,
        left: x + 5,
        border: '1px solid #fdd',
        padding: '2px',
        'background-color': '#fee',
        opacity: 0.80
    }).appendTo("body").fadeIn(200);
}


/*
This part was added by Nikolaj Kamstrup 
*/


		/*
		This function updates the chart with service health.
		Data is fetched from the backend service, transformed into a more
		Flot chart friendly structure and finally plotted.
		*/
		function showServiceHealthChart(serviceUrl) {			

			// Get data from backend service
			$.getJSON(serviceUrl, function (serviceData, status) {
				if(status=="success") {
					
					// Create arrays to hold the data series and x-axis ticks
					var series_available = []; // data for available series 
					var series_failed = []; // data for failed series
					var series_unavailable = []; // data for unavailable series
					var series_untested = []; // data for untested series
					var xaxis = []; // the data for the x-axis

					// internal counter used in loop
					i = 0;

					// Loop through the backend service data and extract the relevant data for plotting with Flot
					$.each(serviceData.data, function() {
						
						// populate plot data arrays.
						//series_available.push([i, parseFloat(serviceData.data[i].AvailablePct)]);
						//series_failed.push([i, parseFloat(serviceData.data[i].FailedPct)]);
						//series_unavailable.push([i, parseFloat(serviceData.data[i].UnavailablePct)]);
						//series_untested.push([i, parseFloat(serviceData.data[i].NotTestedPct)]);

						// Hack to convert numbers from Danish notation to US (comma --> dot)
						series_available.push([i, parseFloat((serviceData.data[i].AvailablePct).replace(",", "."))]);
						series_failed.push([i, parseFloat((serviceData.data[i].FailedPct).replace(",", "."))]);
						series_unavailable.push([i, parseFloat((serviceData.data[i].UnavailablePct).replace(",", "."))]);
						series_untested.push([i, parseFloat((serviceData.data[i].NotTestedPct).replace(",", "."))]);

						
						// Populate x-axis array
						xaxis.push([i, serviceData.data[i].RequestName]);

						i++;
					});
					
					// create JSON object to hold the plot data and other information related to each data series
					var datasets_health = {
						"available": {
							label: "Available",
							color: "#86B404",
							data: series_available
						},
						"failed": {
							label: "Failed",
							color: "#FFFF00",
							data: series_failed
						},
						"unavailable": {
							label: "Unavailable",
							color: "#B43104",
							data: series_unavailable
						},
						"untested": {
							label: "Untested",
							color: "#BDBDBD",
							data: series_untested
						}
					};
					
					// Flot setting for stacked bar chart
					var options = {
						xaxis: {
						  ticks: xaxis,
						  autoscaleMargin: 0.02
						},
						series: {
							stack: 0,
							lines: {
								show: false,
								fill: true,
								steps: false
							},
							bars: {
								show: true,
								barWidth: 0.6,
								lineWidth: 0,
								align: "center",
								fill: 1
							}
						},
						legend: {
							show: true,
							noColumns: 4,
							toggle: false
						},
						grid: {
							backgroundColor: { colors: [ "#fff", "#fff" ] },
							borderWidth: 1,
							borderColor: '#999999',
							hoverable: true
						},
						tooltip: true,
						tooltipOpts: {
							content: "%s:<br>%y" + "%",
							defaultTheme: false
						}
					};
					
					var data = [];
					$.each(datasets_health, function(key, val) {
						data.push(datasets_health[key]);
					});		

					// Show chart
					$.plot("#chart_health", data, options);
					
					
				}
				else {
					alert("Der skete en fejl ved hentning af data!")
				}
				// stop loading image
				$("#service_health_status_img").hide();
			});
			

		}


		/*
		This function updates the chart with service response time.
		Data is fetched from the backend service, transformed into a more
		Flot chart friendly structure and finally plotted.
		*/
		function showServiceResponseTimeChart(reportData) {
			

    // Determine min and max values for selected report data to be shown in graph
    var timeMin = 0;
    var timeMax = 0;

    // Loop through all requests
    $.each(reportData.requests, function (idx) {

        // Check if current request has been selected by the user or if a specific request has been selected
        if ($("#sbReportRequest :selected").val() != "_all" || $("#cbRequest" + reportData.requests[idx].requestId).is(":checked") == true) {

            if (reportData.requests[idx].timeMax > timeMax) {
                timeMax = reportData.requests[idx].timeMax;
            }

            if (reportData.requests[idx].timeMin < timeMin) {
                timeMin = reportData.requests[idx].timeMin;
            }
        }
    });

    // Prepare data for plotting in graph
    var flotGraphData = [];
    $.each(reportData.requests, function (idx) {
        
        // Only include requests that have been selected by user or if specific request has been selected.
        if ($("#sbReportRequest :selected").val() != "_all" || $("#cbRequest" + reportData.requests[idx].requestId).is(":checked") == true) {
            var flotSeries = {};
            flotSeries.data = reportData.requests[idx].graphData;
            flotSeries.label = reportData.requests[idx].requestName;

            flotGraphData.push(flotSeries);
        }
    });


			
			// first correct the timestamps - they are recorded as the daily
			// midnights in UTC+0100, but Flot always displays dates in UTC
			// so we have to add one hour to hit the midnights in the plot
			//addHoursToTimestamps(d1, 1);
			//addHoursToTimestamps(d2, 1);
			
			// Chart options - change if necessary
			var line_chart_options = {
				yaxis: { min: timeMin, max: timeMax },
				xaxis: {
					mode: "time",
					tickLength: 5
				},
				selection: {
					mode: "x"
				},
			        series: {
            				lines: { show: true },
            				points: { show: true }
        			},
				legend: {
					show: true,
					noColumns: 1,
					toggle: true
				},
				grid: {
					backgroundColor: { colors: [ "#fff", "#fff" ] },
					borderWidth: 1,
					borderColor: '#999999',
					markings: weekendAreas,
					hoverable: true
				},
				tooltip: true,
				tooltipOpts: {
					content: "%s:<br>%yms"
				}
			};
	
			var overview_chart_options = {
				series: {
					lines: {
						show: true,
						lineWidth: 1
					},
					shadowSize: 0
				},
				xaxis: {
					ticks: [],
					mode: "time"
				},
				yaxis: {
					ticks: [],
					min: 0,
					autoscaleMargin: 0.1
				},
				legend: {
					show: false
				},
				selection: {
					mode: "x"
				},
				grid: {
					borderWidth: 1,
					borderColor: '#cccccc'
				}
			};
	
			
			// Plot the response time main chart
			var plot = $.plot("#chart_responsetime", flotGraphData, line_chart_options);
	
			// Plot the response time overview chart
			var overview = $.plot("#chart_responsetime_overview", flotGraphData, overview_chart_options);
	
			// Connect the chart and the overview chart
			$("#chart_responsetime").bind("plotselected", function(event, ranges) {
					
				// do the zooming
				plot = $.plot("#chart_responsetime", flotGraphData, $.extend(true, {}, line_chart_options, {
					xaxis: {
						min: ranges.xaxis.from,
						max: ranges.xaxis.to
					}
				}));
	
				// don't fire event on the overview to prevent eternal loop
				overview.setSelection(ranges, true);
			});
	
			$("#chart_responsetime_overview").bind("plotselected", function (event, ranges) {
				plot.setSelection(ranges);
/*
				plot = $.plot("#chart_responsetime", flotGraphData, $.extend(true, {}, line_chart_options, {
					xaxis: {
						min: ranges.xaxis.from,
						max: ranges.xaxis.to
					}
				}));
*/

			});
			
			// stop loading image
			$("#service_response_time_status_img").hide();

			
		}


		/*
		Helper funtion to extract a subset of data stored in JSON 
		*/
/*
		function getServiceResponseTimeData(reportData, start, end) {

                  var flotGraphData = [];
                  $.each(reportData.requests, function (idx) {
        
                     // Only include requests that have been selected by user or if specific request has been selected.
                     if ($("#sbReportRequest :selected").val() != "_all" || $("#cbRequest" + reportData.requests[idx].requestId).is(":checked") == true) {
            		var flotSeries = {};
                        if(Date.parseDate(reportData.requests[idx].date) >= start && reportData.requests[idx].tid <= end) {
            		  flotSeries.data = reportData.requests[idx].graphData;
            		  flotSeries.label = reportData.requests[idx].requestName;
            		  flotGraphData.push(flotSeries);
			}
         	     }
    		  });
		  return flotGraphData;
		}
*/
		/*
		Helper funtion to add/subtract hours from timestamps in data series
		Mostly copy of sample code from flotchart.org 
		*/
		function addHoursToTimestamps(d, hoursToAdd) {
			for (var i = 0; i < d.length; ++i) {
				d[i][0] += hoursToAdd * 60 * 60 * 1000;
			}
			return d;
		}
		
		/*
		Helper for returning the weekends in a period
		Mostly copy of sample code from flotchart.org 
		*/
		function weekendAreas(axes) {

			var markings = [],
				d = new Date(axes.xaxis.min);

			// go to the first Saturday

			d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7))
			d.setUTCSeconds(0);
			d.setUTCMinutes(0);
			d.setUTCHours(0);

			var i = d.getTime();

			// when we don't set yaxis, the rectangle automatically
			// extends to infinity upwards and downwards

			do {
				markings.push({ xaxis: { from: i, to: i + 2 * 24 * 60 * 60 * 1000 } });
				i += 7 * 24 * 60 * 60 * 1000;
			} while (i < axes.xaxis.max);

			return markings;
		}

