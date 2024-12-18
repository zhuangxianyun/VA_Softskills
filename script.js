// 0. Set the width and height (in pixels) of SVGs
const width = 1000;
const height = 600;
const margin = { top: 40, right: 30, bottom: 180, left: 80 };

// 3. Create bar chart from the data
d3.csv("classified_jobs (1).csv").then((data) => {
  // Process data to get job counts per category
  const jobCounts = d3.rollup(
    data.filter((d) => d["category"] !== "Quality Control and Assurance"),
    (v) => v.length,
    (d) => d["category"]
  );
  const jobData = Array.from(jobCounts, ([category, count]) => ({
    category,
    count,
  }));

  // Sort jobData by count in descending order
  jobData.sort((a, b) => b.count - a.count);

  // 3.2 Define the position of the bar chart with scaleBand
  const x = d3
    .scaleBand()
    .domain(jobData.map((d) => d.category))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  // 3.3 Define the color for each name with scaleOrdinal
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(jobData, (d) => d.count)])
    .nice()
    .range([height - margin.bottom, margin.top + 20]);

  // 3.4 Add the SVG element inside div
  const svg = d3
    .select("#bar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("display", "block")
    .style("margin", "0 auto");

  // 3.5 Add rectangle bars
  svg
    .selectAll(".bar")
    .data(jobData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.category))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => y(0) - y(d.count))
    .attr("fill", "skyblue")
    .attr("opacity", 0.8)
    .on("mouseover", function (event, d) {
      // Show tooltip on mouseover
      d3.select("#tooltip").style("visibility", "visible").text(d.count); // Set tooltip text to count
    })
    .on("mousemove", function (event) {
      // Move tooltip with mouse
      d3.select("#tooltip")
        .style("top", event.pageY - 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", function () {
      // Hide tooltip on mouseout
      d3.select("#tooltip").style("visibility", "hidden");
    })
    .on("click", function (event, d) {
      // On click, update the radar chart with the selected category
      updateRadarChart(data, d.category);

      // Highlight the clicked bar
      svg.selectAll(".bar").attr("fill", "skyblue"); // Reset all bars to default color
      d3.select(this).attr("fill", "orange"); // Highlight the clicked bar

      // Update the dropdown selection
      d3.select("#category-select").property("value", d.category);
    });

  // 3.6 Add names as texts on the bar chart
  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "12px");

  svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px");

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Job Category Distribution");

  // Add x-axis label
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - margin.bottom / 4 + 30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Job Category");

  // Add y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left / 4)
    .attr("x", -height / 3)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Number of Jobs");

  // 4. Create radar chart below the bar chart
  createRadarChart(data, "all"); // Default to show all categories

  // Add event listener for dropdown
  d3.select("#category-select").on("change", function () {
    const selectedCategory = d3.select(this).property("value");
    updateRadarChart(data, selectedCategory);

    // Highlight the selected bar in the bar chart
    svg.selectAll(".bar").attr("fill", "skyblue"); // Reset all bars to default color
    if (selectedCategory) {
      svg
        .selectAll(".bar")
        .filter((d) => d.category === selectedCategory)
        .attr("fill", "orange"); // Highlight the selected bar
    }
  });
});

// Function to create radar chart
function createRadarChart(data, selectedCategory) {
  const skills = [
    "communication",
    "creativity",
    "leadership",
    "collaboration",
    "flexibility",
    "teamwork",
    "adaptability",
  ];
  const categories = [
    "Data Analysis and Data Science",
    "Data Engineering and Technical Support",
    "Data Management and Governance",
    "Business Analysis and Strategy",
    "Development and Product",
    "Teaching and Research",
    "Sales and Customer Management",
    "Data-Driven Marketing and Communication",
    "Human Resources and Administration",
  ];

  const radarWidth = 450; // Adjust width for three charts in a row
  const radarHeight = 450; // Adjust height for better visibility

  // Clear previous radar chart
  d3.select("#radar-chart").selectAll("svg").remove();

  // Create radar chart for the selected category
  if (selectedCategory === "all") {
    // Show all categories
    categories.forEach((category) => {
      const categoryData = data.filter((d) => d["category"].includes(category));
      if (categoryData.length === 0) return;

      const meanValues = skills.map((skill) => {
        const values = categoryData.map((d) => +d[skill]);
        return d3.mean(values);
      });

      const maxValues = d3.max(meanValues);
      const normalizedData = meanValues.map((value) => value / maxValues);

      const angles = Array.from(
        { length: skills.length },
        (v, i) => (i * 2 * Math.PI) / skills.length
      );

      const radarSvg = d3
        .select("#radar-chart")
        .append("svg")
        .attr("width", radarWidth)
        .attr("height", radarHeight)
        .append("g")
        .attr("transform", `translate(${radarWidth / 2}, ${radarHeight / 2})`);

      // Draw grid circles
      const numCircles = 5; // Number of circles
      for (let i = 1; i <= numCircles; i++) {
        radarSvg
          .append("circle")
          .attr("r", (i / numCircles) * 100) // Scale the radius
          .attr("fill", "none")
          .attr("stroke", "lightgray")
          .attr("stroke-width", 1);
      }

      const radarLine = d3
        .lineRadial()
        .angle((d, i) => angles[i])
        .radius((d) => d * 100); // Adjust radius for better fit

      radarSvg
        .append("path")
        .datum(normalizedData.concat(normalizedData[0]))
        .attr("d", radarLine)
        .attr("fill", "skyblue")
        .attr("opacity", 0.6)
        .attr("stroke", "blue")
        .attr("stroke-width", 2);

      angles.forEach((angle, i) => {
        const x = Math.cos(angle) * 120; // Adjust for label position
        const y = Math.sin(angle) * 120;
        radarSvg
          .append("text")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .text(skills[i]);
      });

      radarSvg
        .append("text")
        .attr("x", 0)
        .attr("y", -150) // Adjust for title position
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`Skill Radar Chart for ${category}`);
    });
  } else {
    // Show radar chart for the selected category
    let categoryData = data.filter((d) =>
      d["category"].includes(selectedCategory)
    );

    if (categoryData.length === 0) return;

    const meanValues = skills.map((skill) => {
      const values = categoryData.map((d) => +d[skill]);
      return d3.mean(values);
    });

    const maxValues = d3.max(meanValues);
    const normalizedData = meanValues.map((value) => value / maxValues);

    const angles = Array.from(
      { length: skills.length },
      (v, i) => (i * 2 * Math.PI) / skills.length
    );

    const radarSvg = d3
      .select("#radar-chart")
      .append("svg")
      .attr("width", radarWidth)
      .attr("height", radarHeight)
      .append("g")
      .attr("transform", `translate(${radarWidth / 2}, ${radarHeight / 2})`);

    // Draw grid circles
    const numCircles = 5; // Number of circles
    for (let i = 1; i <= numCircles; i++) {
      radarSvg
        .append("circle")
        .attr("r", (i / numCircles) * 100) // Scale the radius
        .attr("fill", "none")
        .attr("stroke", "lightgray")
        .attr("stroke-width", 1);
    }

    const radarLine = d3
      .lineRadial()
      .angle((d, i) => angles[i])
      .radius((d) => d * 100); // Adjust radius for better fit

    radarSvg
      .append("path")
      .datum(normalizedData.concat(normalizedData[0]))
      .attr("d", radarLine)
      .attr("fill", "skyblue")
      .attr("opacity", 0.6)
      .attr("stroke", "blue")
      .attr("stroke-width", 2);

    angles.forEach((angle, i) => {
      const x = Math.cos(angle) * 120; // Adjust for label position
      const y = Math.sin(angle) * 120;
      radarSvg
        .append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(skills[i]);
    });

    radarSvg
      .append("text")
      .attr("x", 0)
      .attr("y", -150) // Adjust for title position
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(`Skill Radar Chart for ${selectedCategory}`);
  }
}

// Function to update radar chart based on selected category
function updateRadarChart(data, selectedCategory) {
  createRadarChart(data, selectedCategory);
}
