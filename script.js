// 0. Set the width and height (in pixels) of SVGs
const width = 600;
const height = 400;
const margin = { top: 40, right: 30, bottom: 180, left: 80 };

// Declare selectedCategories at the top
let selectedCategories = []; // Array to hold selected categories
let skillData = {
  "Data Analysis and Data Science": [1.2, 2, 1, 0.7, 0.1, 5, 0.2],
  "Data Engineering and Technical Support": [0.6, 1.7, 1.7, 1.4, 0.2, 5, 0.9],
  "Data Management and Governance": [0.6, 3.5, 1, 1, 0, 5, 0.7],
  "Business Analysis and Strategy": [1.2, 2, 2.1, 1, 0, 5, 0.7],
  "Development and Product": [0.7, 0.7, 0, 0, 0, 5, 0.7],
  "Teaching and Research": [0, 5, 0, 0, 1, 4, 0],
  "Sales and Customer Management": [3, 1, 1, 1, 2, 5, 0],
  "Data-Driven Marketing and Communication": [1, 2, 3, 0, 0, 5, 3],
  "Human Resources and Administration": [1, 0, 2.5, 0, 0, 5, 0],
};

const skillDescriptions = {
  communication:
    "1. Communication: Effectively conveys ideas, adapts to different audiences, and coordinates well, though complex topics may require more preparation.",
  creativity:
    "2. Creativity: Suggests improvements within existing frameworks but shows limited breakthrough innovation.",
  leadership:
    "3. Leadership: Coordinates teams to achieve goals but needs growth in handling complex challenges.",
  collaboration:
    "4. Collaboration: Excels in teamwork, resource sharing, and driving group success.",
  flexibility:
    "5. Flexibility: Quickly adapts to changes, adjusts strategies effectively, but may need time for complex conflicts.",
  teamwork:
    "6. Teamwork: Shares responsibilities and contributes positively, with room to improve in conflict resolution.",
  adaptability:
    "7. Adaptability: Performs well in new tasks or environments but may need support for multiple simultaneous challenges.",
};

// 3. Create bar chart from the data
d3.csv("classified_jobs (1).csv").then((data) => {
  // Process data to get job counts per category
  const jobCounts = d3.rollup(
    data,
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

  // 生成饼图数据
  const pieData = jobData; // 使用条形图的数据

  // 4. Create pie chart
  const pieWidth = 810; // 饼图宽度
  const pieHeight = 400; // 饼图高度
  const radius = Math.min(pieWidth - 150, pieHeight - 150) / 2; // 半径

  // 创建 SVG 元素
  const pieSvg = d3
    .select("#pie-chart") // 确保在 HTML 中有一个 id 为 pie-chart 的 div
    .append("svg")
    .attr("width", pieWidth)
    .attr("height", pieHeight)
    .append("g")
    .attr("transform", `translate(${pieWidth / 2 - 180}, ${pieHeight / 2})`);

  const color = d3.scaleOrdinal(d3.schemeCategory10); // 使用 D3 的颜色方案

  const pie = d3.pie().value((d) => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  const arcs = pie(pieData);

  // Add title
  pieSvg
    .append("text")
    .attr("x", 0)
    .attr("y", -radius - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Job Category Distribution");

  // 绘制饼图
  pieSvg
    .selectAll("arc")
    .data(arcs)
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d, i) => color(i))
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .on("mouseover", function (event, d) {
      const total = d3.sum(pieData.map((d) => d.count));
      const percentage = ((d.data.count / total) * 100).toFixed(2);
      d3.select("#tooltip")
        .style("visibility", "visible")
        .text(`${d.data.category}: ${percentage}%`);
    })
    .on("mousemove", function (event) {
      d3.select("#tooltip")
        .style("top", event.pageY - 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", function () {
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // 添加图例
  const legend = pieSvg
    .selectAll(".legend")
    .data(pieData)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(20, ${i * 20 - radius + 30})`);

  legend
    .append("rect")
    .attr("x", radius)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d, i) => color(i));

  legend
    .append("text")
    .attr("x", radius + 20)
    .attr("y", 9)
    .attr("dy", ".35em")
    .text((d) => d.category);

  // 4. Create radar chart below the bar chart
  createRadarChart(selectedCategories);

  // Add event listeners for job buttons
  d3.selectAll(".job-button").on("click", function () {
    const selectedCategory = d3.select(this).attr("data-category");

    // Toggle selection
    if (selectedCategories.includes(selectedCategory)) {
      selectedCategories = selectedCategories.filter(
        (category) => category !== selectedCategory
      );
      d3.select(this).classed("selected", false); // Remove selected class
    } else {
      selectedCategories.push(selectedCategory);
      d3.select(this).classed("selected", true); // Add selected class
    }

    // Update radar chart based on selected categories
    createRadarChart(selectedCategories);
  });
});

// Function to create radar chart
function createRadarChart(selectedCategories) {
  const skills = [
    "communication",
    "creativity",
    "leadership",
    "collaboration",
    "flexibility",
    "teamwork",
    "adaptability",
  ];

  // Clear previous radar chart
  d3.select("#radar-chart").selectAll("svg").remove();

  // Prepare radar chart data
  const radarData = skills.map((skill, index) => {
    const values = selectedCategories.map((category) => {
      return skillData[category] ? skillData[category][index] / 5 : 0; // 获取技能值或0
    });
    return {
      skill: skill,
      values: values,
    };
  });

  // 绘制雷达图的逻辑
  const width = 800;
  const height = 400;
  const radius = Math.min(width - 100, height - 100) / 2;

  const angleSlice = (Math.PI * 2) / radarData.length;

  const radarLine = d3
    .lineRadial()
    .radius((d) => d.value * radius)
    .angle((d, i) => i * angleSlice);

  const svg = d3
    .select("#radar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // 绘制网格圆
  const numCircles = 5; // 圆的数量
  for (let i = 1; i <= numCircles; i++) {
    svg
      .append("circle")
      .attr("r", (i / numCircles) * radius) // 缩放半径
      .attr("fill", "none")
      .attr("stroke", "lightgray")
      .attr("stroke-width", 1);
  }

  // 绘制每个选中类别的雷达线
  selectedCategories.forEach((category, index) => {
    const color = d3.schemeCategory10[index % 10]; // 获取每个类别的颜色
    const categoryRadarData = radarData.map((d) => ({
      skill: d.skill,
      value: d.values[index] || 0, // 获取当前类别的值
    }));

    svg
      .append("path")
      .datum(categoryRadarData)
      .attr("d", radarLine)
      .attr(
        "fill",
        `rgba(${d3.rgb(color).r}, ${d3.rgb(color).g}, ${d3.rgb(color).b}, 0.5)`
      )
      .attr("stroke", color)
      .attr("stroke-width", 2);
  });

  // 添加技能名称和鼠标悬浮事件
  radarData.forEach((d, i) => {
    const angle = (i * 2 * Math.PI) / radarData.length;
    const x = Math.cos(angle) * (radius + 50); // 调整标签位置
    const y = Math.sin(angle) * (radius + 20);
    const skillName = d.skill;

    const text = svg
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(skillName);

    // 添加鼠标悬浮事件
    text
      .on("mouseover", function () {
        d3.select("#tooltip")
          .style("visibility", "visible")
          .text(skillDescriptions[skillName])
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        d3.select("#tooltip").style("visibility", "hidden");
      });
  });

  // 添加标题
  svg
    .append("text")
    .attr("x", 0)
    .attr("y", -radius - 30) // 调整标题位置
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text(`Skill Radar Chart for ${selectedCategories.join(", ")}`);
}

// Function to update radar chart based on selected category
function updateRadarChart(data, selectedCategory) {
  createRadarChart(selectedCategory);
}
