import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const tooltip = d3.select("#tooltip");

// Tooltip binder
function bindTooltip(selection, renderHTML) {
  selection
    .on("mouseover", (event, d) => {
      tooltip.html(renderHTML(d))
             .style("display", "block");
    })
    .on("mousemove", event => {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top",  `${event.pageY - 28}px`);
    })
    .on("mouseout", () => tooltip.style("display", "none"));
}

(async () => {
  // 1) Load and normalize
  const raw = await d3.csv("Data/venues.csv", d3.autoType);
  const venues = raw.map(d => ({ name: d.Name, type: d.Type, capacity: d.Capacity }));

  // ── Chart 1: Bubble-pack counts by type ───────────────────────────────
  let byType = Array.from(
    d3.rollup(venues, v => v.length, d => d.type),
    ([type, count]) => ({ type, count })
  ).sort((a, b) => d3.descending(a.count, b.count));

  const W1 = 700, H1 = 700;
  const pack1 = d3.pack().size([W1, H1]).padding(20);
  const root1 = d3.hierarchy({ children: byType })
    .sum(d => d.count)
    .sort((a, b) => b.value - a.value);
  pack1(root1);
  const leaves1 = root1.leaves();

  const color1 = d3.scaleOrdinal(byType.map(d => d.type), d3.schemeCategory10);
  const container1 = d3.select("#countChart")
    .style("display", "flex")
    .style("align-items", "flex-start")
    .style("flex-wrap", "wrap")
    .style("overflow-x", "auto");
  const svg1 = container1.append("svg").attr("width", W1).attr("height", H1);

  const node1 = svg1.selectAll("g.node1").data(leaves1).join("g")
    .attr("class", "node1")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  node1.append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => color1(d.data.type))
    .attr("stroke", "#333");
  bindTooltip(node1, d => `<strong>Type:</strong> ${d.data.type}<br/><strong>Count:</strong> ${d.data.count}`);

  node1.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em")
    .attr("font-size", d => `${Math.min(12, Math.max(8, d.r / 3))}px`)
    .attr("pointer-events", "none")
    .text(d => d.data.type);

  const list = container1.selectAll("#countList").data([null]).join(
    enter => enter.append("div").attr("id", "countList")
  );
  list.style("margin-left", "20px").html("");
  list.append("h3").text("Venue Types");
  const ul1 = list.append("ul");
  ul1.selectAll("li").data(byType).join("li").text(d => `${d.type}: ${d.count}`);

  // ── Prepare outliers vs normal for capacities ─────────────────────────
  const capacities = venues.map(d => d.capacity).sort(d3.ascending);
  const threshold = d3.quantile(capacities, 0.90);
  const normal = venues.filter(d => d.capacity <= threshold)
    .sort((a, b) => d3.descending(a.capacity, b.capacity));
  const outliers = venues.filter(d => d.capacity > threshold)
    .sort((a, b) => d3.descending(a.capacity, b.capacity));

  // ── Chart 2: Lollipop for normal capacities ──────────────────────────
  const m2 = { top: 20, right: 20, bottom: 40, left: 150 };
  const rowH = 25;
  const W2 = 800;
  const H2 = m2.top + m2.bottom + normal.length * rowH;

  const svg2 = d3.select("#capacityChart").html("")
    .append("svg").attr("width", W2).attr("height", H2);

  const x2 = d3.scaleLinear()
    .domain([0, d3.max(normal, d => d.capacity)]).nice()
    .range([m2.left, W2 - m2.right]);
  const y2 = d3.scaleBand()
    .domain(normal.map(d => d.name))
    .range([m2.top, H2 - m2.bottom])
    .padding(0.1);

  svg2.append("g").attr("transform", `translate(0,${m2.top})`)
    .call(d3.axisTop(x2).ticks(6)).selectAll("text").attr("dy", "-0.3em");
  svg2.append("g").attr("transform", `translate(${m2.left},0)`)
    .call(d3.axisLeft(y2));

  const rows2 = svg2.selectAll("g.row2").data(normal).join("g")
    .attr("class", "row2").attr("transform", d => `translate(0,${y2(d.name)})`);
  rows2.append("rect").attr("x", m2.left).attr("y", 0)
    .attr("width", W2 - m2.left - m2.right).attr("height", y2.bandwidth())
    .style("fill", "transparent");
  rows2.append("line").attr("x1", m2.left).attr("x2", d => x2(d.capacity))
    .attr("y1", y2.bandwidth()/2).attr("y2", y2.bandwidth()/2).attr("stroke", "#999");
  rows2.append("circle").attr("cx", d => x2(d.capacity))
    .attr("cy", y2.bandwidth()/2).attr("r", 6).attr("fill", "#ff8c00");
  bindTooltip(rows2, d => `<strong>${d.name}</strong><br/><strong>Capacity:</strong> ${d.capacity}`);

  // ── Chart 3: Lollipop for outliers only ──────────────────────────────
  if (outliers.length) {
    const chart3 = d3.select("#capacityChart").append("div").attr("id", "outliersChart");
    chart3.append("h3").text("Outlier Venues (90th percentile+)");

    const W3 = 600;
    const H3 = m2.top + m2.bottom + outliers.length * rowH;
    const svg3 = chart3.append("svg").attr("width", W3).attr("height", H3);

    const x3 = d3.scaleLinear()
      .domain([0, d3.max(outliers, d => d.capacity)]).nice()
      .range([m2.left, W3 - m2.right]);
    const y3 = d3.scaleBand()
      .domain(outliers.map(d => d.name))
      .range([m2.top, H3 - m2.bottom])
      .padding(0.1);

    svg3.append("g").attr("transform", `translate(0,${m2.top})`)
      .call(d3.axisTop(x3).ticks(6)).selectAll("text").attr("dy", "-0.3em");
    svg3.append("g").attr("transform", `translate(${m2.left},0)`)
      .call(d3.axisLeft(y3));

    const rows3 = svg3.selectAll("g.row3").data(outliers).join("g")
      .attr("class", "row3").attr("transform", d => `translate(0,${y3(d.name)})`);
    rows3.append("rect").attr("x", m2.left).attr("y", 0)
      .attr("width", W3 - m2.left - m2.right).attr("height", y3.bandwidth())
      .style("fill", "transparent");
    rows3.append("line").attr("x1", m2.left).attr("x2", d => x3(d.capacity))
      .attr("y1", y3.bandwidth()/2).attr("y2", y3.bandwidth()/2).attr("stroke", "#999");
    rows3.append("circle").attr("cx", d => x3(d.capacity))
      .attr("cy", y3.bandwidth()/2).attr("r", 6).attr("fill", "#d62728");
    bindTooltip(rows3, d => `<strong>${d.name}</strong><br/><strong>Capacity:</strong> ${d.capacity}`);
  }
})();
