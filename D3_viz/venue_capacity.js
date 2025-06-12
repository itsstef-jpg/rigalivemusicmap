import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const tooltip = d3.select("#tooltip");

// simple tooltip binder
function bindTooltip(selection, render) {
  selection
    .on("mouseover", (evt, d) => {
      tooltip.html(render(d))
             .style("display", "block");
    })
    .on("mousemove", evt => {
      tooltip
        .style("left", `${evt.pageX + 10}px`)
        .style("top",  `${evt.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });
}

(async () => {
  // 1) load & normalize
  const raw    = await d3.csv("Data/2nd_clean_pass/Data/venues_cleaned.csv", d3.autoType);
  const venues = raw.map(d => ({
    name:     d.Name,
    type:     d.Type,
    capacity: d.Capacity
  }));

  // 2) compute threshold & split normal vs outliers
  const caps      = venues.map(d => d.capacity).sort(d3.ascending);
  const threshold = d3.quantile(caps, 0.90);
  const normal    = venues
    .filter(d => d.capacity <= threshold)
    .sort((a, b) => d3.descending(a.capacity, b.capacity));
  const outliers  = venues
    .filter(d => d.capacity  > threshold)
    .sort((a, b) => d3.descending(a.capacity, b.capacity));

  // 3) parameters
  const m    = { top:20, right:20, bottom:40, left:150 };
  const rowH = 25;
  const W    = 800;

  //
  // ── Chart A: normal capacities ────────────────────────────────────────
  //
  const H1  = m.top + m.bottom + normal.length * rowH;
  const svg1 = d3.select("#capacityChart")
    .html("")       // clear any old content
    .append("svg")
      .attr("width",  W)
      .attr("height", H1);

  const x1 = d3.scaleLinear()
    .domain([0, d3.max(normal, d => d.capacity)]).nice()
    .range([m.left, W - m.right]);

  const y1 = d3.scaleBand()
    .domain(normal.map(d => d.name))
    .range([m.top, H1 - m.bottom])
    .padding(0.1);

  // axes
  svg1.append("g")
      .attr("transform", `translate(0,${m.top})`)
      .call(d3.axisTop(x1).ticks(6))
      .selectAll("text")
        .attr("dy","-0.3em");

  svg1.append("g")
      .attr("transform", `translate(${m.left},0)`)
      .call(d3.axisLeft(y1));

  // rows
  const rows1 = svg1.selectAll("g.row1")
    .data(normal)
    .join("g")
      .attr("class", "row1")
      .attr("transform", d => `translate(0,${y1(d.name)})`);

  // invisible hit area
  rows1.append("rect")
      .attr("x", m.left)
      .attr("y", 0)
      .attr("width",  W - m.left - m.right)
      .attr("height", y1.bandwidth())
      .style("fill", "transparent");

  // line
  rows1.append("line")
      .attr("x1", m.left)
      .attr("x2", d => x1(d.capacity))
      .attr("y1", y1.bandwidth()/2)
      .attr("y2", y1.bandwidth()/2)
      .attr("stroke","#999");

  // dot
  rows1.append("circle")
      .attr("cx", d => x1(d.capacity))
      .attr("cy", y1.bandwidth()/2)
      .attr("r", 6)
      .attr("fill","#ff8c00");

  // hover on entire row
  bindTooltip(rows1, d =>
    `<strong>${d.name}</strong><br/>
     <strong>Capacity:</strong> ${d.capacity}`
  );

  //
  // ── Chart B: outlier capacities ───────────────────────────────────────
  //
  if (outliers.length) {
    // title
    d3.select("#capacityChart")
      .append("h3")
      .text("Outlier Venues (90th percentile+)");

    const H2  = m.top + m.bottom + outliers.length * rowH;
    const svg2 = d3.select("#capacityChart")
      .append("svg")
        .attr("width",  W)
        .attr("height", H2);

    const x2 = d3.scaleLinear()
      .domain([0, d3.max(outliers, d => d.capacity)]).nice()
      .range([m.left, W - m.right]);

    const y2 = d3.scaleBand()
      .domain(outliers.map(d => d.name))
      .range([m.top, H2 - m.bottom])
      .padding(0.1);

    svg2.append("g")
        .attr("transform", `translate(0,${m.top})`)
        .call(d3.axisTop(x2).ticks(6))
        .selectAll("text")
          .attr("dy","-0.3em");

    svg2.append("g")
        .attr("transform", `translate(${m.left},0)`)
        .call(d3.axisLeft(y2));

    const rows2 = svg2.selectAll("g.row2")
      .data(outliers)
      .join("g")
        .attr("class", "row2")
        .attr("transform", d => `translate(0,${y2(d.name)})`);

    rows2.append("rect")
        .attr("x", m.left)
        .attr("y", 0)
        .attr("width",  W - m.left - m.right)
        .attr("height", y2.bandwidth())
        .style("fill", "transparent");

    rows2.append("line")
        .attr("x1", m.left)
        .attr("x2", d => x2(d.capacity))
        .attr("y1", y2.bandwidth()/2)
        .attr("y2", y2.bandwidth()/2)
        .attr("stroke","#999");

    rows2.append("circle")
        .attr("cx", d => x2(d.capacity))
        .attr("cy", y2.bandwidth()/2)
        .attr("r", 6)
        .attr("fill","#d62728");

    bindTooltip(rows2, d =>
      `<strong>${d.name}</strong><br/>
       <strong>Capacity:</strong> ${d.capacity}`
    );
  }
})();
