import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin     = { top: 40, right: 20, bottom: 100, left: 60 };
const groupWidth = 40;

(async () => {
  const data = await d3.csv("Data/all_events_clean.csv", d3.autoType);

  const rolled = Array.from(
    d3.rollup(
      data,
      v => ({
        totalEvents: v.length,
        totalWent:   d3.sum(v, d => d.went)
      }),
      d => d.file
    ),
    ([venue, metrics]) => ({ venue, ...metrics })
  );

  const venues = rolled;
  const n      = venues.length;
  const width  = margin.left + margin.right + n * groupWidth;
  const height = 500;

  const svg = d3
    .select("#container")
    .append("svg")
      .attr("width",  width)
      .attr("height", height);

  const x = d3.scaleBand()
    .domain(venues.map(d => d.venue))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(venues, d => d.totalEvents)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("transform", "rotate(-35)")
        .attr("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Tooltip selection
  const tooltip = d3.select("#tooltip");

  // Bars
  svg.selectAll("rect.event-bar")
    .data(venues)
    .join("rect")
      .attr("class", "event-bar")
      .attr("x",      d => x(d.venue))
      .attr("y",      d => y(d.totalEvents))
      .attr("width",  x.bandwidth())
      .attr("height", d => y(0) - y(d.totalEvents))
      .attr("fill",   "steelblue")
    .on("mouseover", (event, d) => {
      tooltip
        .classed("hidden", false)
        .html(
          `<strong>Venue:</strong> ${d.venue}<br/>
           <strong>Events:</strong> ${d.totalEvents}<br/>
           <strong>Attendance:</strong> ${d.totalWent}`
        );
    })
    .on("mousemove", event => {
      tooltip
        .style("left",  (event.pageX + 10) + "px")
        .style("top",   (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.classed("hidden", true);
    });

  // Chart annotation
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", margin.top / 2)
    .attr("font-weight", "bold")
    .text("Number of events logged on FB; hover to see events & attendance");
})();
