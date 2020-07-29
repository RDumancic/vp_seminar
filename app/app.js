// topojson data taken from https://github.com/deldersveld/topojson -- map without antarctica
const url = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries-sans-antarctica.json";
//constants
const height = 750;
const noDataCountries = "#A9A9A9";
const defaultYear = 1985;
const finalYear = 2016;
const finalYearSuicides = 61500; // refer to clean.py
const finalYearRate = 52; // refer to clean.py
const colorTotal = d3.scaleLinear()
    .domain([0, finalYearSuicides])
    .range([255,0]);
const colorRate = d3.scaleLinear()
    .domain([0,finalYearRate])
    .range([255,0]);
const scaleTotal = d3.scaleLinear()
    .domain([finalYearSuicides,0])
    .range([0, height - 15]);
const scaleRate = d3.scaleLinear()
    .domain([finalYearRate,0])
    .range([0, height - 15]);
const margin = {top: 20, right: 20, bottom: 40, left: 60}
const barWidth = 242 - margin.left - margin.right;
const barHeight = 400 - margin.top - margin.bottom;
const bar = d3.select("#bar").append("svg")
    .attr("width", barWidth + margin.left + margin.right)
    .attr("height", barHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// variables
var mapData;
var suicideData;
var svg;
var countries;
var currentYearData;
var prevRadio;
var choice = "total";
var currentYear;
var legend;
var sliderTime;

// Starting point for the app -- initializes site and pulls data
function init() {
    document.forms.form.addEventListener("change", function(item) {
        if(item.target.name == "radios") {
            prevRadio = item.target;
            choice = prevRadio.value;
            selectYear(currentYear);
            setScale();
        }
    })
    d3.json(url).then(topojson => {
        mapData = topojson;
        return d3.json("data/json/cyanide.json");
    }).then(data => {
        suicideData = data;
        createSVG();
        createSlider();
        createLegend();
        initPlay();
        selectYear(defaultYear);
        return 1;
    })
}

// creating map, panning and zoom -- taken from LV5-Z4
function createSVG() {
    const width = document.getElementById("map").clientWidth;

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
        .style("stroke-width", 1)
        .on("click", country => setInfo(country));

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
    const defaultYear = 1985;
    const finalYear = 2016;
    const width = document.getElementById("slider-time").clientWidth;
    sliderTime = d3.sliderBottom()
        .min(defaultYear)
        .max(finalYear)
        .width(width - 50)
        .tickFormat(d3.format(''))
        .ticks(finalYear - defaultYear)
        .step(1)
        .default(defaultYear)
        .on("onchange", year => selectYear(year));

    const gStep = d3.select("div#slider-time")
        .append("svg")
        .attr("width", width)
        .attr("height", 100)
        .append("g")
        .attr('transform', 'translate(30,30)');

    gStep.call(sliderTime);
}

// placed in a separate function so it can be called to set default values
function selectYear(year) {
    currentYearData = suicideData.filter(item => item.year == year);
    currentYear = year;
    countries.each(function(d) {
        const suicides = getData(d.properties.name);
        d3.select(this).style("fill", suicides ? colorScaleSuicides(suicides) : noDataCountries)
    });
}

function getData(val) {
    const data = currentYearData.find(item => item.country == val);
    if(choice == "total") {
        if(data) {
            value = data.suicides
            return isNaN(value) ? false : value;
        } else {
            return false;
        }
    } else {
        if(data) {
            value = data.rate
            return isNaN(value) ? false : value;
        } else {
            return false;
        }
    } 
}

function colorScaleSuicides(suicides) {
    var hex;
    if(choice == "total") {
        hex = Math.trunc(colorTotal(suicides)).toString(16);
    } else {
        hex = Math.trunc(colorRate(suicides)).toString(16);
    }
    hex.length == 1 ? hex = "0" + hex : hex = hex;
    var x = "ff" + hex + hex;
    return x;
}

function initPlay() {
    play = d3.select("#play");
    play.on("click", () => {
        if(!play.classed("disabled")) {
            play.classed("disabled", true);
            startPlay();
        }
    } )
}

function startPlay() {
    var i = +1;
    if(currentYear == finalYear) {
        i = -1;
    }
    interval = setInterval(() => {
        var curr = currentYear + i;
        if(curr > finalYear || curr < defaultYear) {
            clearInterval(interval);
            play.classed("disabled", false);
        } else {
            sliderTime.value(currentYear + i)
        }
    }, 100)
}

// legend taken from https://bl.ocks.org/HarryStevens/6eb89487fc99ad016723b901cbd57fde
function createLegend() {
    legend = d3.select("#legend")
        .append("svg")
        .attr("width", 100)
        .attr("height", height);

    const defs = legend.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "100%")
        .attr("y2", "0%");

    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#ffffff");

    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#ff0000")

    legend.append("rect")
        .attr("width", 25)
        .attr("height", height)
        .attr("transform", "translate(0, 10)")
        .style("fill", "url(#gradient)")
        .style("stroke", "black")

    setScale();
}

function setScale() {
    legend.selectAll("g").remove();

    chosenScale = getScale();

    const yAxis = d3.axisRight()
    .scale(chosenScale)
    .ticks(15)
    .tickFormat((d) => d);

    legend.append("g")
        .attr("transform", "translate(25,10)")
        .call(yAxis);
}

function getScale() {
    if(choice == "total") {
        return scaleTotal;
    } else {
        return scaleRate;
    }
}

function setInfo(country) {
    const data = currentYearData.find(item => item.country == country.properties.name);
    var info = d3.select("#info");

    var innerHTML = 
        "<h4><b>" + data.country + " - " + data.year + "</b></h4>" +
        "<p><b>Population:</b> " + data.population + "</p>" +
        "<p><b>Total number of suicides:</b> " + data.suicides + "</p>" +
        "<p><b>Male suicides:</b> " + data.male + "</p>" +
        "<p><b>Female suicides:</b> " + data.female + "</p>" +
        "<p><b>Suicide rate per 100,000 population:</b> " + data.rate.toFixed(2) + "</p>";
        
    info.html(innerHTML);

    bar.selectAll("g").remove();
    bar.selectAll("rect").remove();

    var bardata = [
        {gender: "male", value: data.male},
        {gender: "female", value: data.female}
    ];

    console.log(bardata);

    var x = d3.scaleBand()
        .range([0, barWidth])
        .domain(bardata.map(function(d) { return d.gender}))
        .padding(0.2)

    var y = d3.scaleLinear()
        .range([barHeight, 0])
        .domain([0, data.male + data.female]);
        
    bar.append("g")
        .attr("transform", "translate(0," + barHeight + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "small");      

    bar.append("g")
        .call(d3.axisLeft(y));

    bar.selectAll("mybar")
        .data(bardata)
        .enter()
        .append("rect")
        .style("fill", "lightcoral")
        .attr("x", function(d) {return x(d.gender);})
        .attr("y", function(d) {return y(d.value);})
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return barHeight - y(d.value);})
}

// initialize
init();