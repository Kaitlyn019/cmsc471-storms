// MAP
var map = d3.select('#map');
var mapWidth = +map.attr('width');
var mapHeight = +map.attr('height');

// SCATTER
var scatter = d3.select('#scatter_plot')
var scatterWidth = +scatter.attr('width')
var scatterHeight = +scatter.attr('height')

scatter.style('display', 'none')

scatter.append('svg')
    .attr('width', 680)
    .attr('height', 640)

svgScatter = d3.select("#scatter_plot").select("svg")
    .attr('width', 680)
    .attr('height', 640)

// Initial starting point for map
var atlLatLng = new L.LatLng(10.9156, -54.22851);
var myMap = L.map('map').setView(atlLatLng, 5);
var vertices = d3.map();
var activeMapType = 'nodes_links';

var nodeFeatures = [];

// Map layout design
var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 25,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);

var svgLayer = L.svg();

svgLayer.addTo(myMap)

// Tooltip (doesn't work)
var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([20, 0])
    .html(function (d) {
        return "<h5>" + d['v_id'] + "</h5>"
    });

nodes = []
counts = []

/*
var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(myMap2);

    var svgLayer = L.svg();

svgLayer.addTo(myMap2)
*/

var svg = d3.select('#map').select('svg');
var nodeLinkG = svg.select('g')
    .attr('class', 'leaflet-zoom-hide');

svgScatter.call(toolTip);
var svgHour = d3.select("#my_dataviz").append("svg")
    .attr('width', 800)
    .attr('height', 650)

// Points for the paths
var latlngs_2010 = [
    'M',
    [13.075000, -40.375000], // min/max for starting
    [17.600000, -45.325000], // 25/75 for all lat long
    [24.709888, -61.848908], // mean for all lat long
    'Q',
    [31.100000, -78.800000], //75/25 for all lat long
    [38.850000, -45.050000] // 75 for ending
]

var latlngs_0010 = [
    'M',
    [13.275000, -43.225000],
    [17.400000, -50.100000],
    [24.400000, -67.700000],
    'Q',
    [30.650000, -81.400000],
    [38.725000, -49.550000]
]

var latlngs_1990_2000 = [
    'M',
    [12.600000, -35.500000],
    [16.800000, -48.400000],
    [23.800000, -62.800000],
    'Q',
    [31.600000, -80.200000],
    [40.400000, -48.500000]
]

var latlngs_90 = [
    'M',
    [21.633708, -63.739326],
    [26.050000, -67.700000],
    'Q',
    [33.200000, -83.300000],
    [42.300000, -50.400000]
]

var pathOptions = {
    //color: 'rgba(255,255,255,0.5)',
    weight: 2,
    opacity: 0.5,
}

pathOptions.animate = {
    duration: 2000,
    //iterations: Infinity,
    //easing: 'ease-in-out',
    //direction: 'alternate'
}

// PATHS
var polyline1 = L.curve(latlngs_2010, pathOptions);
polyline1.setStyle({
    color: 'red'
});
var polyline2 = L.curve(latlngs_0010, pathOptions);
polyline2.setStyle({
    color: 'blue'
});
var polyline3 = L.curve(latlngs_1990_2000, pathOptions);
polyline3.setStyle({
    color: 'white'
});
var polyline4 = L.curve(latlngs_90, pathOptions);
polyline3.setStyle({
    color: 'green'
});

var arr = [polyline1, polyline2, polyline3, polyline4];

// Bar graph!
var chartG = svg.append('g').attr("transform", "translate(610,500)")
var chartS = svgScatter.append('g')
var chartHour = svgHour.append('g')

var chart = d3.select("#chart")
var svgChart = chart.append('svg')
.attr('width', 800)
.attr('height', 650)

var chartCount = svgChart.append('g')


// Getting the data
Promise.all([
    d3.csv('storms_updated.csv', function (row) {
        var node = {
            v_id: +row['id'], LatLng: [+row['lat'], +row['long']], year: row['year'],
            wind: row['wind'],
            category: +row['category']
        };
        vertices.set(node.v_id, node);
        node.linkCount = 0;
        nodeFeatures.push(turf.point([+row['long'], +row['lat']], node));

        return node;
    }),
    d3.csv('counts.csv', function (row) {
        var bar = { year: +row['year'], count: +row['counts'] };
        return bar;
    })]).then(function (data) {
        nodes = data[0];
        counts = data[1];

        // Legends: this handles the colors based on years
        nodeTypes = d3.map(nodes, function (d) {
            return (Math.floor(d.year / 6) * 6) + 1;
        }).keys();
        colorScale = d3.scaleOrdinal(d3.schemeBlues[9]).domain(nodeTypes);

        // Legend for color
        var legend_temp = d3.legendColor()
            .scale(colorScale);

        legend = svg.append("g")
            .attr("transform", "translate(520,440)")
            .call(legend_temp);

        legend.selectAll(".cell").each(function(d,i){
            console.log(d)
            console.log(i)
            d3.select(this).attr("transform","translate(0,"+i*20+")")
            .select(".label").attr("transform","translate(20,10)")
        })
        
        // Handles the size based on category
        linkCountExtent = d3.extent(nodes, function (d) { return d.category; });
        radiusScale = d3.scaleLinear().range([0.5, 10]).domain(linkCountExtent);

        // Legend for size
        var sc_tmp = d3.legendSize()
            .scale(radiusScale)
            .shape('circle')

        scale_legend = svg.append("g")
            .attr("transform", "translate(610,450)")
            .call(sc_tmp)

        scale_legend.selectAll(".cell").each(function(d,i){
                console.log(d)
                console.log(i)
                d3.select(this).attr("transform","translate(0,"+i*20+")")
                .select(".label").attr("transform","translate(20,10)")
            })
    
        svg.append('text')
        .attr('class', 'x label')
        .attr('transform', 'translate(590,440)')
        .text('Category');


        // Scale for bar graph
        var freqExtent = d3.extent(counts, function (d) {
            return +d['count'];
        });
        freqScale = d3.scaleLinear().domain(freqExtent).range([5, 465])
        
        readyToDraw(nodes, counts)
    });

// Initial map drawing
function readyToDraw(nodes, counts) {
    // Adds all nodes onto map
    nodeEnter = nodeLinkG.selectAll('.grid-node')
        .data(nodes)
        .enter().append('circle')
        .attr('class', 'grid-node')
        .style('fill', (function (d) {
            return colorScale(d['year']);
        }))
        .style('fill-opacity', 0.2)
        .style("pointer-events", "auto")
        .attr('r', function (d) {
            return radiusScale(d.category);
        });

    myMap.on('zoomend', updateLayers);

    updateLayers();

    myMap.setZoom(3);

    // Handles the bar graph
    // Axis
    svg.append('text')
        .attr('class', 'x label')
        .attr('transform', 'translate(280,620)')
        .text('Year');

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(30,590)')
        .call(d3.axisBottom(freqScale)
            .ticks(10)
            .tickFormat(function (d) { return 1975 + Math.ceil((d - 2) * (45 / 24)) }));

    // Adds bars to bar graph
    var bars = chartG.selectAll('.bar')
        .data(counts, function (d) {
            return d.count;
        });

    var barsEnter = bars.enter()
        .append('g')
        .attr('class', 'bar');

    bars.merge(barsEnter)
        .attr('transform', function (d, i) {
            return 'translate(' + [i * 10 - 575, 89 - freqScale(d.count) / 3] + ')';
        });

    barsEnter.append('rect')
        .attr('width', 10)
        .attr('height', function (d) {
            return freqScale(d.count) / 3;
        })
        .style('fill', 'black')
        .style('fill-opacity', 0.5);

    bars.exit().remove();
}

function updateLayers() {
    nodeLinkG.selectAll('.grid-node')
        .attr('cx', function (d) { return myMap.latLngToLayerPoint(d.LatLng).x })
        .attr('cy', function (d) { return myMap.latLngToLayerPoint(d.LatLng).y })

};

function updateMap(i) {

    if (i == 0) { // we want the count graph
        chart.style('display', 'block')
        scatter.style('display', 'none')
        d3.select('#my_dataviz').style('display', 'none')
        map.style('display', 'none')
        
        countGraph();
    } else if (i < 6) { // any  of the maps
        scatter.style('display', 'none')
        
        if (i == 1){
            map.style('display', 'block')
            chart.style('display','none')
            legend.attr('visibility', 'visible')
            svgChart.exit().remove()
        } else if (i == 5){
            map.style('display', 'block')
            d3.select('#my_dataviz').style('display', 'none')
            legend.attr('visibility', 'visible')
            svgHour.exit().remove()
        } else {
            legend.attr('visibility', 'hidden')
        }

    } else { // hour graph
        chart.style('display','none')
        map.style('display', 'none')
        d3.select('#my_dataviz').style('display', 'block')
        hourGraph();
    }

    if (i != 0){ // not the first one
        var filtered = nodes.filter(function (d) {
            if (i == 2) {
                legend.attr('visibility', 'hidden')
                polyline4.addTo(myMap);
                return d['year'] < 1990;
            } else if (i == 3) {
                polyline3.addTo(myMap);
                return d['year'] < 2000 && d['year'] >= 1990;
            } else if (i == 4) {
                polyline2.addTo(myMap);
                return d['year'] < 2010 && d['year'] >= 2000;
            } else if (i == 5) {
                polyline1.addTo(myMap);
                return d['year'] >= 2010;
            } else {
                return true;
            }
        });

        var filtered_cts = counts.filter(function (d) {
            if (i == 2) {
                return d['year'] < 1990;
            } else if (i == 3) {
                return d['year'] < 2000;
            } else if (i == 4) {
                return d['year'] < 2010
            } else {
                return true;
            }
        })

        var bars = chartG.selectAll('.bar')
            .data(filtered_cts, function (d) {
                return d.count;
            });

        var barsEnter = bars.enter()
            .append('g')
            .attr('class', 'bar');

        barsEnter.append('rect')
            .attr('width', 10)
            .style('fill', 'black')
            .style('fill-opacity', 0.5)
            .attr('transform', function (d, i) {
                return 'translate(' + [i * 10 - 575, 89 - freqScale(d.count) / 3] + ')';
            })
            .transition()
            .duration(750)
            .attr('height', function (d) {
                return freqScale(d.count) / 3;
            })

        bars.merge(barsEnter)

        bars.exit().remove();
    }
    
    if (i == 1) { // first of the maps
        var points = nodeLinkG.selectAll('.grid-node')
            .data(filtered, function (d) {
                return d;
            })

        var pointsEnter = points.enter().append('circle')
            .attr('class', 'grid-node')
            .style('fill', (function (d) {
                return colorScale(d['year']);
            }))
            .style('fill-opacity', 0.2)
            .attr('r', function (d) {
                return radiusScale(d.category);
            });

        points.merge(pointsEnter);

        updateLayers();

        // Scales the animation duration so that it's related to the line length
        // (but such that the longest and shortest lines' durations are not too different).
        // You may want to use a different scaling factor.
        points.exit().remove()

    } else if (i == 6) { // ????
        arr.forEach(x => x.remove(myMap));
        setInterval(function () {
            updateLayers();  // call the function you created to update the chart
        }, 1500);
    } else if (i != 0) { // not 0, not 1, not 6
        var points = nodeLinkG.selectAll('.grid-node')
            .data(filtered, function (d) {
                return d;
            })

        var pointsEnter = points.enter().append('circle')
            .attr('class', 'grid-node')
            .style('fill', 'orange')
            .style('opacity', 0.3)
            .attr('r', function (d) {
                return radiusScale(d.category);
            });

        pointsEnter.on('mouseover', toolTip.show)
            .on('mouseout', toolTip.hide);

        points.merge(pointsEnter);

        updateLayers();

        // Scales the animation duration so that it's related to the line length
        // (but such that the longest and shortest lines' durations are not too different).
        // You may want to use a different scaling factor.
        points.exit().remove()
    }
}


d3.graphScroll()
    .graph(d3.selectAll('#graph'))
    .container(d3.select('#main'))
    .sections(d3.selectAll('#sections > div'))
    .on('active', function (i) {
        console.log("At section " + i);
        updateMap(i)
    })

function hourGraph() {

    var margin = { top: 10, right: 30, bottom: 50, left: 60 },
        width = 680,
        height = 640;

    // append the svg object to the body of the page
    /*svgHour.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)*/
    /*.attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");*/

    d3.csv("size.csv").then(function (data) {

        // When reading the csv, I must format variables:
        data.forEach(function (d) {
            return { hour: d.hour, size: d.size }
        });

        // Add X axis --> it is a date format
        var x = d3.scaleLinear()
            .domain([0, 23])
            .range([0, 660]); // svg height 680 - leave 10 margin on either side
        chartHour.append("g")
            .attr("class", "xaxis")
            .attr("transform", "translate(50, 620)")
            .call(d3.axisBottom(x));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, 189.9])
            .range([610, 0]); // svg height 640 - leave 10 margin on either side
        chartHour.append("g")
            .attr("transform", "translate(50,10)")
            .call(d3.axisLeft(y));


        // Add the line
        console.log("ok here we are")

        // Add the line
        var path = chartHour.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("d", d3.line()
                .x(function (d) { console.log(x(d.hour)); return x(d.hour) + 35 })
                .y(function (d) { return y(d.size) })
            )
            .attr("stroke-width", 1.5)

        const pathLength = path.node().getTotalLength();
        const transitionPath = d3.transition().ease(d3.easeQuadInOut).duration(1500);
        path
            .attr("stroke-dashoffset", pathLength)
            .attr("stroke-dasharray", pathLength)
            .transition(transitionPath)
            .attr("stroke-dashoffset", 0)

        //adding axis names
        chartHour.append('text')
            .attr('transform', 'translate(' + [(width / 2) + 25, height + 5] + ')')
            .text('Hour');

        chartHour.append('text')
            .attr('transform', 'translate(' + [15, (height / 2) + 20] + ') rotate(270)')
            .text('Average Hurricane Size');

    })
}

function countGraph() {
    var parseDate = d3.timeParse('%Y');
    var margin = { top: 30, bottom: 30, left: 50, right: 30 };
    // Hand code the svg dimensions, you can also use +svg.attr('width') or +svg.attr('height')
    var chartWidth = +svgChart.attr('width') - margin.left - margin.right;
    var chartHeight = +svgChart.attr('height') - margin.top - margin.bottom;

    var dateDomain = [new Date(1973, 1), new Date(2022, 1)]
    var countDomain = [0, 28];
    var padding = { t: 20, r: 20, b: 60, l: 60 };

    d3.csv('storms.csv').then(function (dataset) {
        // get the distinct count of storms in each year
        dataset.forEach(function (price) {
            price.year = parseDate(price.year);
        });
        
        var nested_data = d3.nest()
            .key(function (d) { return d.year; })
            .key(function (d) { return d.name; })
            .rollup(function (ids) {
                return ids.length;
            })
            .entries(dataset);

        console.log(nested_data);
        console.log(typeof nested_data[0].key);

        var xScale = d3.scaleTime()
            .domain(dateDomain)
            .range([0, 660]);

        var yScale = d3.scaleLinear()
            .domain(countDomain)
            .range([610, 0]);

        chartCount.append('g')
            .attr("transform", "translate(45,615)")
            .call(d3.axisBottom(xScale))
        chartCount.append('g')
            .attr("transform", "translate(45,5)")
            .call(d3.axisLeft(yScale))

        var line = d3.line()
            .x(function (d) { return xScale(Date.parse(d.key)); })
            .y(function (d) { return yScale((d.values).length); })
            .curve(d3.curveMonotoneX)

        chartCount.append('text')
            .attr('class', 'x axis-label')
            .attr('transform', 'translate(340,600)')
            .text('Date (by Year)');

        chartCount.append('text')
            .attr('class', 'y axis-label')
            .attr('transform', 'translate(20,340) rotate(270)')
            .text('Count of Storms');

        chartCount.append("path")
            .datum(nested_data)
            .attr("class", "line")
            .attr("transform", "translate(" + 45 + "," + 5 + ")")
            .attr("d", line)
            .style("fill", "none")
            .style("stroke", "#6699ff")
            .style("stroke-width", "2")
            .call(transition);

        var dots = chartCount.selectAll('dot')
            .data(nested_data)
        var dotsEnter = dots.enter()
            .append('circle')
            .attr('class', 'dot')
            .attr("cx", function (d) { return xScale(Date.parse(d.key)); })
            .attr("cy", function (d) { return yScale((d.values).length); })
            .attr("r", 3)
            .attr("transform", "translate(" + 45 + "," + 5 + ")")
            .style("fill", "#CC0000")
            .attr("data-booked", "true")
            .attr("opacity", "0")
            .on("mouseover", function (a, b, c) {
                d3.select(this).attr('class', 'focus')
            })
            .on("mouseout", function () {
                d3.select(this).attr('class', 'dot')
            });

        dotsEnter.transition()
            .duration(7000)
            .delay((d, i) => (xScale(Date.parse(d.key))))
            .attr("opacity", "1");
        dotsEnter.append('text')
            .attr('y', -10)
            .text(function (d) {
                return d.values.length;
            });

    })
}

function transition(path) {
    path.transition()
        .duration(4000)
        .attrTween("stroke-dasharray", tweenDash)
        .on("end", () => { d3.select('.temperature-line').call(transition); });
}

function tweenDash() {
    const l = this.getTotalLength(),
        i = d3.interpolateString("0," + l, l + "," + l);
    return function (t) { return i(t) };
}