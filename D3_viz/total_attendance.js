import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin    = { top: 60, right: 20, bottom: 40, left: 150 };
const rowHeight = 25;

(async () => {
  // 0) load & roll up
  const data = await d3.csv("Data/attendance_event_count.csv", d3.autoType);
  const venues = data.map(d => ({
    venue:           d.file,
    totalEvents:     d.count,
    totalInterested: d.interested
  }));

  // 1) dimensions & SVG
  const n            = venues.length;
  const totalWidth   = 900;
  const totalHeight  = margin.top + margin.bottom + n * rowHeight;
  const panelGap     = 40;
  const panelWidth   = (totalWidth - margin.left - margin.right - panelGap) / 2;

  const svg = d3.select("#container")
    .append("svg")
      .attr("width",  totalWidth)
      .attr("height", totalHeight);

  // 2) shared y-scale
  const y = d3.scaleBand()
    .domain(venues.map(d => d.venue))
    .range([margin.top, totalHeight - margin.bottom])
    .padding(0.1);

  // tooltip div
  const tooltip = d3.select("#tooltip");

  // ── PANEL 1: EVENTS ───────────────────────────────────────────
  const xEvents = d3.scaleLinear()
    .domain([0, d3.max(venues, d => d.totalEvents)]).nice()
    .range([margin.left, margin.left + panelWidth]);

  // axes
  svg.append("g")
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(xEvents).ticks(5))
    .selectAll("text").attr("dy", -4);

  svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

  // full‐row hit areas for events
  svg.selectAll("rect.event-hit")
    .data(venues)
    .join("rect")
      .attr("class", "event-hit")
      .attr("x",      margin.left)
      .attr("y",      d => y(d.venue))
      .attr("width",  panelWidth)
      .attr("height", y.bandwidth())
      .style("fill", "transparent")
      .on("mouseover", (event, d) => {
        tooltip
          .classed("hidden", false)
          .html(`<strong>${d.venue}</strong><br/>Events: ${d.totalEvents}`)
          .style("left",  (event.pageX + 10) + "px")
          .style("top",   (event.pageY - 28) + "px");
      })
      .on("mousemove", event => {
        tooltip
          .style("left",  (event.pageX + 10) + "px")
          .style("top",   (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.classed("hidden", true);
      });

  // colored event bars (disable pointer events on them)
  svg.selectAll("rect.events")
    .data(venues)
    .join("rect")
      .attr("class", "events")
      .attr("x",      margin.left)
      .attr("y",      d => y(d.venue))
      .attr("width",  d => xEvents(d.totalEvents) - margin.left)
      .attr("height", y.bandwidth())
      .attr("fill",   "steelblue")
      .attr("pointer-events", "none");  // ← here

  // panel title
  svg.append("text")
    .attr("x", margin.left + panelWidth / 2)
    .attr("y", margin.top - 30)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("Total Events");

  // ── PANEL 2: INTERESTED ────────────────────────────────────────
  const offset = margin.left + panelWidth + panelGap;
  const xInt = d3.scaleLinear()
    .domain([0, d3.max(venues, d => d.totalInterested)]).nice()
    .range([offset, offset + panelWidth]);

  // axis
  svg.append("g")
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(xInt).ticks(5))
    .selectAll("text").attr("dy", -4);

  // full‐row hit areas for interested
  svg.selectAll("rect.interest-hit")
    .data(venues)
    .join("rect")
      .attr("class", "interest-hit")
      .attr("x",      offset)
      .attr("y",      d => y(d.venue))
      .attr("width",  panelWidth)
      .attr("height", y.bandwidth())
      .style("fill", "transparent")
      .on("mouseover", (event, d) => {
        tooltip
          .classed("hidden", false)
          .html(`<strong>${d.venue}</strong><br/>Interested: ${d.totalInterested}`)
          .style("left",  (event.pageX + 10) + "px")
          .style("top",   (event.pageY - 28) + "px");
      })
      .on("mousemove", event => {
        tooltip
          .style("left",  (event.pageX + 10) + "px")
          .style("top",   (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.classed("hidden", true);
      });

  // colored interest bars (disable pointer events)
  svg.selectAll("rect.interest")
    .data(venues)
    .join("rect")
      .attr("class", "interest")
      .attr("x",      offset)
      .attr("y",      d => y(d.venue))
      .attr("width",  d => xInt(d.totalInterested) - offset)
      .attr("height", y.bandwidth())
      .attr("fill",   "orange")
      .attr("pointer-events", "none");  // ← and here

  // title
  svg.append("text")
    .attr("x", offset + panelWidth / 2)
    .attr("y", margin.top - 30)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("Total Interested");

})();
