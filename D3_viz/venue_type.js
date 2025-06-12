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
  const raw = await d3.csv("Data/2nd_clean_pass/Data/venues_cleaned.csv", d3.autoType);
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

})();
