function _1(md){return(
md`<div style="color: grey; font: 13px/25.5px var(--sans-serif); text-transform: uppercase;"><h1 style="display: none;">Index chart</h1><a href="https://d3js.org/">D3</a> › <a href="/@d3/gallery">Gallery</a></div>

# Index chart

This chart shows the weekly price of several technology stocks from 2013 to 2018 relative to each stock’s price on the highlighted date. Hover over the chart to change the date for comparison. Data: [Yahoo Finance](https://finance.yahoo.com/lookup)`
)}

function _date(value,htl){return(
htl.html`<div style="display: flex; min-height: 33px; font: 12px sans-serif; align-items: center;">${value.toLocaleString("en", {timeZone: "UTC", month: "long", day: "numeric", year: "numeric"})}</div>`
)}

function _value(d3,stocks)
{
  // Specify the chart’s dimensions.
  const width = 928;
  const height = 600;
  const marginTop = 20;
  const marginRight = 40;
  const marginBottom = 30;
  const marginLeft = 40;

  // Create the horizontal time scale.
  const x = d3.scaleUtc()
      .domain(d3.extent(stocks, d => d.Date))
      .range([marginLeft, width - marginRight])
      .clamp(true)

  // Normalize the series with respect to the value on the first date. Note that normalizing
  // the whole series with respect to a different date amounts to a simple vertical translation,
  // thanks to the logarithmic scale! See also https://observablehq.com/@d3/change-line-chart
  const series = d3.groups(stocks, d => d.Symbol).map(([key, values]) => {
    const v = values[0].Close;
    return {key, values: values.map(({Date, Close}) => ({Date, value: Close / v}))};
  });

  // Create the vertical scale. For each series, compute the ratio *s* between its maximum and
  // minimum values; the path is going to move between [1 / s, 1] when the reference date
  // corresponds to its maximum and [1, s] when it corresponds to its minimum. To have enough
  // room, the scale is based on the series that has the maximum ratio *k*  (in this case, AMZN).
  const k = d3.max(series, ({values}) => d3.max(values, d => d.value) / d3.min(values, d => d.value));
  const y = d3.scaleLog()
      .domain([1 / k, k])
      .rangeRound([height - marginBottom, marginTop])

  // Create a color scale to identify series.
  const z = d3.scaleOrdinal(d3.schemeCategory10).domain(series.map(d => d.Symbol));

  // For each given series, the update function needs to identify the date—closest to the current
  // date—that actually contains a value. To do this efficiently, it uses a bisector:
  const bisect = d3.bisector(d => d.Date).left;

  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; -webkit-tap-highlight-color: transparent;");

  // Create the axes and central rule.
  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
      .call(g => g.select(".domain").remove());

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y)
          .ticks(null, x => +x.toFixed(6) + "×"))
      .call(g => g.selectAll(".tick line").clone()
          .attr("stroke-opacity", d => d === 1 ? null : 0.2)
          .attr("x2", width - marginLeft - marginRight))
      .call(g => g.select(".domain").remove());
  
  const rule = svg.append("g")
    .append("line")
      .attr("y1", height)
      .attr("y2", 0)
      .attr("stroke", "black");

  // Create a line and a label for each series.
  const serie = svg.append("g")
      .style("font", "bold 10px sans-serif")
    .selectAll("g")
    .data(series)
    .join("g");

  const line = d3.line()
      .x(d => x(d.Date))
      .y(d => y(d.value));

  serie.append("path")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke", d => z(d.key))
      .attr("d", d => line(d.values));

  serie.append("text")
      .datum(d => ({key: d.key, value: d.values[d.values.length - 1].value}))
      .attr("fill", d => z(d.key))
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("stroke-width", 3)
      .attr("x", x.range()[1] + 3)
      .attr("y", d => y(d.value))
      .attr("dy", "0.35em")
      .text(d => d.key);

  // Define the update function, that translates each of the series vertically depending on the
  // ratio between its value at the current date and the value at date 0. Thanks to the log
  // scale, this gives the same result as a normalization by the value at the current date.
  function update(date) {
    date = d3.utcDay.round(date);
    rule.attr("transform", `translate(${x(date) + 0.5},0)`);
    serie.attr("transform", ({values}) => {
      const i = bisect(values, date, 0, values.length - 1);
      return `translate(0,${y(1) - y(values[i].value / values[0].value)})`;
    });
    svg.property("value", date).dispatch("input"); // for viewof compatibility
  }

  // Create the introductory animation. It repeatedly calls the update function for dates ranging
  // from the last to the first date of the x scale.
  d3.transition()
      .ease(d3.easeCubicOut)
      .duration(1500)
      .tween("date", () => {
        const i = d3.interpolateDate(x.domain()[1], x.domain()[0]);
        return t => update(i(t));
      });

  // When the user mouses over the chart, update it according to the date that is
  // referenced by the horizontal position of the pointer.
  svg.on("mousemove touchmove", function(event) {
    update(x.invert(d3.pointer(event, this)[0]));
    d3.event.preventDefault();
  });

  // Sets the date to the start of the x axis. This is redundant with the transition above;
  // uncomment if you want to remove the transition.
  // update(x.domain()[0]);
  
  return svg.node();
}


function _4(md){return(
md`The cell below merges five CSV files, adding the symbol for each stock as the first column for each row.`
)}

async function _stocks(FileAttachment){return(
(await Promise.all([
  FileAttachment("AAPL.csv").csv({typed: true}).then((values) => ["AAPL", values]),
  FileAttachment("AMZN.csv").csv({typed: true}).then((values) => ["AMZN", values]),
  FileAttachment("GOOG.csv").csv({typed: true}).then((values) => ["GOOG", values]),
  FileAttachment("IBM.csv").csv({typed: true}).then((values) => ["IBM", values]),
  FileAttachment("MSFT.csv").csv({typed: true}).then((values) => ["MSFT", values]),
])).flatMap(([Symbol, values]) => values.map(d => ({Symbol, ...d})))
)}

function _6(md){return(
md`This representation can alternatively be produced using [Observable Plot](/plot/)’s concise API and built-in [normalize transform](/plot/transforms/normalize) (see an [interactive example](/@observablehq/plot-index-chart)):`
)}

function _7(Plot,d3,stocks){return(
Plot.plot({
  y: {
    type: "log",
    grid: true,
    label: "Change in price (%)",
    tickFormat: ((f) => (x) => f((x - 1) * 100))(d3.format("+d"))
  },
  marks: [
    Plot.ruleY([1]),
    Plot.lineY(stocks, Plot.normalizeY({x: "Date", y: "Close", stroke: "Symbol"}))
  ]
})
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["MSFT.csv", {url: new URL("./files/a3a40558b8a2590e24ccfa34bd62710fbbbe31badd5ad593b7b897b043180a95ae018de2d4e8c92af37cb21395abde4462c3291223ea0652baccfd04db91a749.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["IBM.csv", {url: new URL("./files/c56b9e232d72bf1df96ca3eeca37e29e811adb72f49d943659a0006c015e74d2c429186d9dca251060784f364eb2a16fd39584695d523588bdcb87e4d9eac650.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["GOOG.csv", {url: new URL("./files/3ca44f93993f84575ab5461b4097d37b814438266e8cfe8774f70882f49bb289143c190963a158e8dc886989433af1161798ba76f2f4b36d17cc7150cba94477.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["AMZN.csv", {url: new URL("./files/51ef8c06edd5d139385ad9477c0a42cbf0152f5a4facf30a52d5eaa3ce4debecf1114c4a51199e734274e4411ec8149ffdd0d094cd334095cf8f2a004fc90d44.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["AAPL.csv", {url: new URL("./files/3ccff97fd2d93da734e76829b2b066eafdaac6a1fafdec0faf6ebc443271cfc109d29e80dd217468fcb2aff1e6bffdc73f356cc48feb657f35378e6abbbb63b9.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("date")).define("date", ["value","htl"], _date);
  main.variable(observer("viewof value")).define("viewof value", ["d3","stocks"], _value);
  main.variable(observer("value")).define("value", ["Generators", "viewof value"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _4);
  main.variable(observer("stocks")).define("stocks", ["FileAttachment"], _stocks);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer()).define(["Plot","d3","stocks"], _7);
  return main;
}
