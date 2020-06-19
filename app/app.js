// topojson data taken from https://github.com/deldersveld/topojson -- map without antarctica
const url = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries-sans-antarctica.json";
// variables
var mapData;
var suicideData;
var svg;
var countries;
var currentYearData;
//constants
const noDataCountries = "#A9A9A9"
const maxValue = 61500; // refer to clean.py
const colorScale = d3.scaleLinear().domain([0, maxValue]).range([0,1]);

// Starting point for the app -- initializes map and pulls data
function init() {
    d3.json(url).then(topojson => {
        mapData = topojson;
        return d3.json("data/json/cyanide.json");
    }).then(data => {
        suicideData = data;
        createSVG();
        createSlider();
        return 1;
    })
}

// creating map, panning and zoom -- taken from LV5-Z4
function createSVG() {
    const width = document.getElementById("map").clientWidth;
    const height = 800;

    const projection = d3.geoMercator()
        .center([0,40])
        .scale(180)
        .translate([width/2, height/2]);

    const path = d3.geoPath()
        .projection(projection);
    
    svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("stroke", "black")

    countries = svg.selectAll("svg.country")
        .data(topojson.feature(mapData, mapData.objects.countries1).features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .style("stroke", "gray")
        .style("stroke-width", 1);

    var zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    svg.call(zoom);
}

function zoomed() {
    svg.selectAll("path")
        .attr("transform", d3.event.transform);
}

// time slider taken from https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
function createSlider() {
    const min = 1985;
    const max = 2016;
    const width = document.getElementById("map").clientWidth;
    var sliderTime = d3.sliderBottom()
        .min(min)
        .max(max)
        .width(width - 50)
        .tickFormat(d3.format(''))
        .ticks(max - min)
        .step(1)
        .default(1985)
        .on("onchange", val => {
            currentYearData = suicideData.filter(item => item.year == val);
            countries.each(function(d) {
                console.log(d)
                const suicides = getData(d);
                d3.select(this).style("fill", suicides ? colorScaleSuicides(suicides) : noDataCountries)
            });
        });

    const gStep = d3.select("div#slider-time")
        .append("svg")
        .attr("width", width)
        .attr("height", 100)
        .append("g")
        .attr('transform', 'translate(30,30)');

    gStep.call(sliderTime);
}

function getData(val) {
    const data = currentYearData.find(item => item.country == val);
    if(data) {
        value = data.suicides
        return isNaN(value) ? false : value;
    } else {
        return false;
    }
}

function colorScaleSuicides(suicides) {
    val = d3.interpolateOrRd(colorScale(suicides));
    return val;
}

// initialize
init();