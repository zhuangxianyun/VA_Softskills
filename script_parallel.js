// const width = 900, height = 580;
const margins = { top: 120, right: 30, bottom: 30, left: 100 };

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width+100)
    .attr("height", height);

const categoryLabels = {
    categoryA: "Country",
    categoryB: "Contract",
    categoryC: "Mode",
    categoryD: "Soft skills"
};

  
d3.csv("parallel_d3.csv", d => ({
    id: +d.id,
    categoryA: d["country"],
    categoryB: d["contract"],
    categoryC: d["job_category"],
    categoryD: d["AllSkills"]
})).then(data => {
    const dimensions = ["categoryA", "categoryB", "categoryC", "categoryD"];
    const x = d3.scalePoint()
        .domain(dimensions)
        .range([margins.left+20, width - margins.right+20]);

    const yScales = {};
    dimensions.forEach(dim => {
        yScales[dim] = d3.scalePoint()
            .domain(d3.union(data.map(d => d[dim])))
            .range([height - margins.bottom +20, margins.top+20]);
    });

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const groupedData = d3.rollups(
        data,
        v => v.length, 
        d => d.categoryA,
        d => d.categoryB,
        d => d.categoryC,
        d => d.categoryD
    );

   
    const links = [];
    groupedData.forEach(([catA, catBGroup]) => {
        catBGroup.forEach(([catB, catCGroup]) => {
            catCGroup.forEach(([catC, catDGroup]) => {
                catDGroup.forEach(([catD, frequency]) => {
                    links.push({
                        categoryA: catA,
                        categoryB: catB,
                        categoryC: catC,
                        categoryD: catD,
                        value: frequency
                    });
                });
            });
        });
    });

  
    const lineGenerator = d3.line()
        .x(d => x(d.dimension))
        .y(d => yScales[d.dimension](d.value));

    const pathsGroup = svg.append("g").attr("class", "paths"); // Contenedor para las líneas
    const axesGroup = svg.append("g").attr("class", "axes"); // Contenedor para los ejes
        
 
    const paths = pathsGroup.selectAll(".path")
    .data(links)
    .join("path")
    .attr("class", "path")
    .attr("d", d => {
        const points = dimensions.map(dim => ({
            dimension: dim,
            value: d[dim]
        }));
        return lineGenerator(points);
    })
    .attr("stroke", "#d3d3d3")
    .attr("stroke-width", d => d.value / 2)
    .attr("fill", "none")
    .attr("opacity", 0.1);


   
    const highlightConnections = () => {
        const categoryAValue = d3.select("#categoryA-filter").property("value");
        const categoryBValue = d3.select("#categoryB-filter").property("value");
        const categoryCValue = d3.select("#categoryC-filter").property("value");
        const categoryDValue = d3.select("#categoryD-filter").property("value");

        paths
        .attr("stroke", d => {
            if (categoryAValue === "all" && categoryBValue === "all" && categoryCValue === "all" && categoryDValue === "all") {
                return "rgba(211, 211, 211, 0.3)";
            }
            return (categoryAValue === "all" || d.categoryA === categoryAValue) &&
                   (categoryBValue === "all" || d.categoryB === categoryBValue) &&
                   (categoryCValue === "all" || d.categoryC === categoryCValue) &&
                   (categoryDValue === "all" || d.categoryD === categoryDValue)
                ? "#ff5733"
                : "rgba(211, 211, 211, 0.3)";
        })
        .attr("opacity", 0.5) 
            .each(function(d) {
             
              const categoryAValue = d3.select("#categoryA-filter").property("value");
              const categoryBValue = d3.select("#categoryB-filter").property("value");
              const categoryCValue = d3.select("#categoryC-filter").property("value");
              const categoryDValue = d3.select("#categoryD-filter").property("value");
              
             
              if (
                  (categoryAValue === "all" || d.categoryA === categoryAValue) &&
                  (categoryBValue === "all" || d.categoryB === categoryBValue) &&
                  (categoryCValue === "all" || d.categoryC === categoryCValue) &&
                  (categoryDValue === "all" || d.categoryD === categoryDValue)
              ) {
                  d3.select(this).raise(); 
              }
             
          });
  };
    pathsGroup.lower();
    axesGroup.raise(); 

    
    const uniqueCategories = {
        categoryA: Array.from(new Set(data.map(d => d.categoryA))),
        categoryB: Array.from(new Set(data.map(d => d.categoryB))),
        categoryC: Array.from(new Set(data.map(d => d.categoryC))),
        categoryD: Array.from(new Set(data.map(d => d.categoryD)))
    };

   
    Object.keys(uniqueCategories).forEach(category => {
        const select = d3.select(`#${category}-filter`);
        uniqueCategories[category].forEach(value => {
            select.append("option")
                .attr("value", value)
                .text(value);
        });
    });
    const highlightedCountries = ["Belgium", "France", "Italy", "Spain", "Netherlands"];
    
    d3.selectAll("select").on("change", highlightConnections);
    
    
    axesGroup.selectAll(".axis")
        .data(dimensions)
        .join("g")
        .attr("class", "axis")
        .attr("transform", d => `translate(${x(d)},0)`)
        .each(function (d) {
            d3.select(this).call(d3.axisLeft(yScales[d]));
            d3.select(this).selectAll(".tick text")
                .style("font-weight", d => highlightedCountries.includes(d) ? "bold" : "normal")
                .style("fill", d => highlightedCountries.includes(d) ? "#000000" : "#808080");
        })
        .append("text")
        .attr("text-anchor", d => (d === "categoryD" ? "start" : "middle"))
        .attr("x", d => (d === "categoryD" ? 20 : 0))
        .attr("y", margins.top - 10)
        .text(d => categoryLabels[d]);

    
    
    
});
