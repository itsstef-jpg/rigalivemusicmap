import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin    = { top: 40, right: 20, bottom: 40, left: 150 };
// pixels per venue row
const rowHeight = 25;

(async () => {
  const data = await d3.csv("Data/all_events_clean-years.csv", d3.autoType);
  const rolled = Array.from(
    d3.rollup(
      data,
      v => ({ totalEvents: v.length, totalWent: d3.sum(v, d=>d.went) }),
      d=>d.file
    ),
    ([venue, m]) => ({ venue, ...m })
  );

  const venues = rolled;
  const n      = venues.length;
  const width  = 800;
  const height = margin.top + margin.bottom + n * rowHeight;

  const svg = d3.select("#container")
    .append("svg")
      .attr("width",  width)
      .attr("height", height);

  // 1) x = count of events
  const x = d3.scaleLinear()
    .domain([0, d3.max(venues, d=>d.totalEvents)]).nice()
    .range([margin.left, width - margin.right]);

  // 2) y = one band per venue
  const y = d3.scaleBand()
    .domain(venues.map(d=>d.venue))
    .range([margin.top, height - margin.bottom])
    .padding(0.1);

  // 3) axes
  svg.append("g")
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(x).ticks(5))
    .selectAll("text")
      .attr("dy", -4);

  svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

  // tooltip
  const tooltip = d3.select("#tooltip");

  // 4) bars
const rows = svg.selectAll("g.bar-row")
  .data(venues)
  .join("g")
    .attr("class", "bar-row")
    .attr("transform", d => `translate(0,${y(d.venue)})`)
    // move the listeners up to the group
    .on("mouseover", (event, d) => {
      tooltip
        .classed("hidden", false)
        .html(`
          <strong>${d.venue}</strong><br/>
          Events: ${d.totalEvents}<br/>
          Attendance: ${d.totalWent}
        `);
    })
    .on("mousemove", event => {
      tooltip
        .style("left",  (event.pageX + 10) + "px")
        .style("top",   (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.classed("hidden", true));

// 1) transparent “hit” rect spanning the full width
rows.append("rect")
  .attr("x",      margin.left)
  .attr("y",      0)
  .attr("width",  width - margin.left - margin.right)
  .attr("height", y.bandwidth())
  .style("fill", "transparent");

// 2) your visible bar on top
rows.append("rect")
  .attr("class", "event-bar")
  .attr("x",      margin.left)
  .attr("y",      0)
  .attr("width",  d => x(d.totalEvents) - margin.left)
  .attr("height", y.bandwidth())
  .attr("fill",   "steelblue");

  // 5) Chart title
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", margin.top / 2)
    .attr("font-weight", "bold")
    .text("Number of events logged on FB; hover to see events & attendance");
})();
