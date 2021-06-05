//Copying the template code

const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);
const xLine = d3.scaleTime().range([margin * 2, width - margin]);
const yLine = d3.scaleLinear().range([height - margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function () {
        lineParam = d3.select(this).property('value');
        updateLinePlot();
    });

//Subscribe to click event of barChart
    barChart.on('click', onBarClick);

//Drawing a line plot with the selected parameters
    function updateLinePlot() {
        const index = data.findIndex(item => item.country === selected);
        if(index === -1) return;
        const item = data[index][lineParam];
        let entries = Object.entries(item).slice(0, -5)
        let xScaler = xLine.domain(d3.extent(entries.map(entry => new Date(entry[0]))));
        let yScaler = yLine.domain(d3.extent(entries.map(entry => parseFloat(entry[1]))));
        lineChart.selectAll('path').remove();
        countryName.html(selected);
        xLineAxis.call(d3.axisBottom(xScaler));
        yLineAxis.call(d3.axisLeft(yScaler));
        lineChart.append('path')
            .datum(entries)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(data => xScaler(new Date(data[0])))
                .y(data => yScaler(parseFloat(data[1]))))
    }

//Drawing bars for 4 given regions
    function updateBar() {
        let meanData = d3.nest()
            .key(data => data['region'])
            .rollup(v => d3.mean(v, data => parseFloat(data[param][year])))
            .entries(data);

        let xScaler = xBar.domain(['asia', 'europe', 'africa', 'americas']);
        let yScaler = yBar.domain([0, d3.max(meanData.map(data => data.value))]);

        xBarAxis.call(d3.axisBottom(xScaler));
        yBarAxis.call(d3.axisLeft(yScaler));

        handleBar(barChart.selectAll(".bar")
            .data(meanData)
            .enter().append("rect").on('click', onBarClick), xScaler, yScaler);

        handleBar(barChart.selectAll(".bar")
            .data(meanData)
            .transition(), xScaler, yScaler);
    }

//Setting the bar's attributes
    function handleBar(selection, xScaler, yScaler) {
        selection.attr("class", "bar")
            .attr("x", data => xScaler(data.key))
            .attr("y", data => yScaler(data.value))
            .attr("width", xScaler.bandwidth())
            .attr("height", data => height - margin - yScaler(data.value))
            .attr('fill', data => colorScale(data.key));
    }

//Handling on bar-click event
    function onBarClick(ClickedData, i) {

//If we click on a bar
        if(typeof ClickedData !== "undefined" && highlighted !== ClickedData.key) {
        //update the view based on a selection
            highlighted = ClickedData.key;
            barChart.selectAll('.bar')
                .transition()
                .style('opacity', data => data.key === highlighted ? 1.0 : 0.5);

            scatterPlot.selectAll('circle').transition()
                .style('opacity', data => data.region === highlighted ? 0.7 : 0);
        }
 //If we click on an empty space or on a previously selected bar
        else {
        //reset to default view
            barChart.selectAll('.bar')
                .transition()
                .style('opacity', 1.0);

            scatterPlot.selectAll('circle').transition()
                .style('opacity', 0.7);
             highlighted = '';
        }
        d3.event.stopPropagation();
    }

//Drawing a scatterplot
    function updateScatterPlot() {
        let rScaler = radiusScale.domain(d3.extent(data.map(data => parseFloat(data[rParam][year]))));
        let xScaler = x.domain(d3.extent(data.map(data => parseFloat(data[xParam][year]))));
        let yScaler = y.domain(d3.extent(data.map(data => parseFloat(data[yParam][year]))));
        xAxis.call(d3.axisBottom(xScaler));
        yAxis.call(d3.axisLeft(yScaler));

        handleScatter(scatterPlot
            .selectAll('circle')
            .data(data)
            .enter().append('circle').on('click', onKruzho4ekClick), xScaler, yScaler, rScaler);

        handleScatter(scatterPlot
            .selectAll('circle')
            .data(data)
            .transition(), xScaler, yScaler, rScaler);
    }

//Setting the attributes of circles (points)
    function handleScatter(selection, xScaler, yScaler, rScaler) {
        selection.attr('r', data => rScaler(parseFloat(data[rParam][year])))
            .attr('cx', data => xScaler(parseFloat(data[xParam][year])))
            .attr('cy', data => yScaler(parseFloat(data[yParam][year])))
            .attr('fill', data => colorScale(data['region']));
    }

//Handling on a circle-click event
    function onKruzho4ekClick(ClickedData, i) {
        selected = ClickedData.country
        scatterPlot.selectAll('circle')
            .transition()
            .attr('stroke-width', data => data.country === selected ? 3 : 1);
        d3.select(this).raise();
        updateLinePlot();
    }

    updateBar();
    updateScatterPlot();
});

//Loading the data from the .csv files (template code)
async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}