async function loadData() {
    // Load both CSV files
    const links = await d3.csv("sankey_data4.csv", d3.autoType);
    const nodeInfo = await d3.csv("node_info.csv");

    // Create a map for node descriptions from the node_info CSV
    const nodeDescriptions = new Map(nodeInfo.map(d => [d.node, d.description]));

    // Extract the unique nodes
    const nodes = Array.from(new Set(links.flatMap(l => [l.from, l.to])), (name, index) => ({
        id: index,
        name: name,
        description: nodeDescriptions.get(name) || "No description available" // Default description if not found
    }));

    // Create a node map for linking nodes with their IDs
    const nodeMap = new Map(nodes.map(d => [d.name, d.id]));

    // Update the links with the correct node IDs
    const updatedLinks = links.map(link => ({
        source: nodeMap.get(link.from),
        target: nodeMap.get(link.to),
        value: +link.value
    }));

    return { nodes, links: updatedLinks };
}

function createSankey({ nodes, links }, containerId) {
    const width = 1000;
    const height = 600;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const totalWidth = width + margin.left + margin.right;
    const totalHeight = height + margin.top + margin.bottom;

    // const svg = d3.select(containerId)
    //     .html("")
    //     .append("svg")
    //     .attr("width", width + 300)
    //     .attr("height", height + 50);

    const svg = d3.select(containerId)
        .html("") // Clear the container
        .append("svg")
        .attr("width", totalWidth+150)
        .attr("height", totalHeight+50)
        .attr("viewBox", `0 0 ${totalWidth} ${totalHeight+50}`) // Keep it responsive
        .style("display", "block")
        .style("margin", "0 auto")    

    svg.append("text")
        .attr("x", totalWidth / 2) // Center horizontally
        .attr("y", 20) // Position the title at the top
        .attr("text-anchor", "middle") // Center the text
        .style("font-size", "20px") // Adjust font size
        .style("font-weight", "bold") // Make it bold
        .style("fill", "#333") // Set the text color
        .text("Sankey Diagram: Job, Skills and Countries");

    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(20)
        .extent([[0, 50], [width - 0, height + 50]]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankey({ nodes, links });

    const earthTonePalette = [
        "#A0522D", "#8B4513", "#D2691E", "#CD853F", "#F4A460", "#DEB887", "#D2B48C", "#BC8F8F", "#FFE4C4", "#FAEBD7",
        "#F5DEB3", "#EEDC82", "#BDB76B", "#808000", "#556B2F", "#6B8E23", "#8FBC8F", "#2E8B57", "#A9A9A9", "#696969"
    ];

    const colorScale = d3.scaleOrdinal(earthTonePalette);

    // Create the floating chart for the tooltips
    const floatingChart = svg.append("g")
        .attr("class", "floating-chart")
        .style("visibility", "hidden");

    // Draw the links
    svg.append("g")
        .selectAll(".link")
        .data(sankeyLinks)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d => {
            const nodeWidthScaled = sankey.nodeWidth() * 10;
            const sourceX = d.source.x0 + nodeWidthScaled;
            const targetX = d.target.x0;
            const sourceY = d.y0;
            const targetY = d.y1;
            const curvature = 0.5;
            const xMid = (sourceX + targetX) / 2;

            return `M${sourceX},${sourceY}
                    C${xMid},${sourceY}
                    ${xMid},${targetY}
                    ${targetX},${targetY}`;
        })
        .attr("stroke", d => colorScale(d.source.name))
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", d => Math.max(1, d.width))
        .style("fill", "none");

    // Draw the nodes
    const node = svg.append("g")
        .selectAll(".node")
        .data(sankeyNodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    node.append("rect")
        .attr("height", d => d.y1 - d.y0)
        .attr("width", sankey.nodeWidth() * 10)
        .attr("fill", d => colorScale(d.name))
        .attr("fill-opacity", 1)
        .attr("stroke", d => colorScale(d.name));

    node.append("text")
        .attr("transform", function (d) {
            const x = sankey.nodeWidth() * 10 / 2 + 5;
            const y = (d.y1 - d.y0) / 2;
            return `translate(${x}, ${y})`;
        })
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "black")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .text(d => d.name);

    // Add tooltips with node-specific information
    node.append("title")
        .text(d => `${d.name}\nDescription: ${d.description}`);

    // Handle mouse events to show the floating info box
    node.on("mouseover", function (event, d) {
        floatingChart.style("visibility", "visible")
            .attr("transform", `translate(${event.pageX + 10}, ${event.pageY + 10})`);

        floatingChart.selectAll("*").remove();  // Clear previous content

        floatingChart.append("rect")
            .attr("width", 200)
            .attr("height", 80)
            .attr("fill", "white")
            .attr("stroke", "#333")
            .attr("stroke-width", 1);

        floatingChart.append("text")
            .attr("x", 10)
            .attr("y", 20)
            .style("font-size", "12px")
            .text(`Skill: ${d.name}`);

        floatingChart.append("text")
            .attr("x", 10)
            .attr("y", 40)
            .style("font-size", "10px")
            .text(`Description: ${d.description}`);
    })
        .on("mouseout", function () {
            floatingChart.style("visibility", "hidden");
        });

    // Add click event to highlight links connected to clicked node
    node.on("click", function (event, d) {
        const clickedNode = d;
        svg.selectAll(".link")
            .attr("stroke-opacity", l =>
                l.source === clickedNode || l.target === clickedNode ? 0.8 : 0.2
            );
    });
}

// Adding buttons for reordering
async function initializeSankey() {
    const data = await loadData();

    // Adding button functionality for reordering links
    const reorderButtons = [
        { label: "Country → Soft Skills → Job Position", order: ["from", "to"], colorClass: "green-button" },
        { label: "Job Position → Soft Skills → Country", order: ["to", "from"], colorClass: "orange-button" }
    ];

    const container = d3.select("#button-container");
    reorderButtons.forEach(({ label, order, colorClass }) => {
        container.append("button")
            .text(label)
            .attr("class", colorClass)  // Assign color class to each button
            .on("click", () => {
                const reorderedLinks = data.links.map(link => ({
                    source: order[0] === "from" ? link.source : link.target,
                    target: order[1] === "to" ? link.target : link.source,
                    value: link.value
                }));

                const reorderedData = { nodes: data.nodes, links: reorderedLinks };
                createSankey(reorderedData, "#container");
            });
    });

    // Initial creation of Sankey diagram
    createSankey(data, "#container");
}

initializeSankey();
