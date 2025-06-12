import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin    = { top: 60, right: 20, bottom: 40, left: 150 };
const rowHeight = 25;

(async () => {
  // 0) load & roll up
  const data = await d3.csv("Data/attendance_event_count.csv", d3.autoType);
  const venues = data.map(d => ({
    venue:           d.file,
    totalEvents:     d.count,
    totalInterested: d.interested,
    totalWent:       d.went
  }));

  // 1) dimensions & SVG
  const n             = venues.length;
  const totalWidth    = 1200;                   // enough room for 3 panels + gaps
  const totalHeight   = margin.top + margin.bottom + n * rowHeight;
  const panelGap      = 40;
  const numPanels     = 3;
  const panelWidth    = (totalWidth - margin.left - margin.right - panelGap * (numPanels - 1)) / numPanels;

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

  // helper to draw one panel
  function drawPanel(offset, metricKey, title, color) {
    // x-scale for this metric
    const x = d3.scaleLinear()
      .domain([0, d3.max(venues, d => d[metricKey])]).nice()
      .range([offset, offset + panelWidth]);

    // top axis
    svg.append("g")
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(5))
      .selectAll("text")
        .attr("dy", -4);

    // full-row hit rects
    svg.selectAll(`rect.${metricKey}-hit`)
      .data(venues)
      .join("rect")
        .attr("class", `${metricKey}-hit`)
        .attr("x",      offset)
        .attr("y",      d => y(d.venue))
        .attr("width",  panelWidth)
        .attr("height", y.bandwidth())
        .style("fill", "transparent")
        .on("mouseover", (event, d) => {
          tooltip
            .classed("hidden", false)
            .html(`<strong>${d.venue}</strong><br/>${title}: ${d[metricKey]}`)
            .style("left",  (event.pageX + 10) + "px")
            .style("top",   (event.pageY - 28) + "px");
        })
        .on("mousemove", event => {
          tooltip
            .style("left",  (event.pageX + 10) + "px")
            .style("top",   (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.classed("hidden", true));

    // colored bars (pointer‐events:none so hits pass through)
    svg.selectAll(`rect.${metricKey}`)
      .data(venues)
      .join("rect")
        .attr("class", metricKey)
        .attr("x",      offset)
        .attr("y",      d => y(d.venue))
        .attr("width",  d => x(d[metricKey]) - offset)
        .attr("height", y.bandwidth())
        .attr("fill",   color)
        .attr("pointer-events", "none");

    // panel title
    svg.append("text")
      .attr("x", offset + panelWidth / 2)
      .attr("y", margin.top - 30)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text(title);
  }

  // 3) draw shared left axis (venues)
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // 4) draw each metric panel
  // Panel 1: Total Events
  drawPanel(
    margin.left,
    "totalEvents",
    "Total Events",
    "steelblue"
  );

  // Panel 2: Total Interested
  drawPanel(
    margin.left + panelWidth + panelGap,
    "totalInterested",
    "Total Interested",
    "orange"
  );

  // Panel 3: Total Attendance
  drawPanel(
    margin.left + (panelWidth + panelGap) * 2,
    "totalWent",
    "Total Attendance",
    "seagreen"
  );

})();
