import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CardNode, CardLink } from '../types/card';

interface CardGraphProps {
  nodes: CardNode[];
  links: CardLink[];
}

export function CardGraph({ nodes, links }: CardGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear existing content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Add zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5]) // Min and max zoom scale
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create a container for all elements that should be zoomed
    const container = svg.append("g");

    // Create the simulation with adjusted forces
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(150) // Increase distance between linked nodes
      )
      .force("charge", d3.forceManyBody()
        .strength(-800) // Stronger repulsion
        .distanceMax(350) // Limit the maximum distance of effect
      )
      .force("collision", d3.forceCollide().radius(60)) // Prevent overlap
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.5)) // Weaker centering force
      .velocityDecay(0.7); // Add more damping to make movement smoother

    // Create the links
    const link = container.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.weight || 1));

    // Create the nodes
    const node = container.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulation));

    // Add card images with hover effect
    const cardGroups = node.append("g")
      .attr("class", "card-group");

    // Add background rectangle for better visibility
    cardGroups.append("rect")
      .attr("x", -30)
      .attr("y", -40)
      .attr("width", 60)
      .attr("height", 84)
      .attr("rx", 3)
      .attr("fill", "white")
      .attr("stroke", "#ddd");

    // Add card images
    cardGroups.append("image")
      .attr("xlink:href", d => d.image)
      .attr("x", -28)
      .attr("y", -38)
      .attr("width", 56)
      .attr("height", 80)
      .attr("clip-path", "url(#card-clip)");

    // Add card names with better visibility
    cardGroups.append("text")
      .text(d => d.name)
      .attr("text-anchor", "middle")
      .attr("y", 60)
      .attr("class", "text-sm font-medium")
      .each(function() {
        // Add white background to text for better readability
        const bbox = (this as SVGTextElement).getBBox();
        const padding = 2;
        d3.select(this.parentNode)
          .insert("rect", "text")
          .attr("x", bbox.x - padding)
          .attr("y", bbox.y - padding)
          .attr("width", bbox.width + (padding * 2))
          .attr("height", bbox.height + (padding * 2))
          .attr("fill", "white")
          .attr("rx", 2);
      });

    // Add hover tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "absolute hidden bg-black text-white p-2 rounded text-sm pointer-events-none")
      .style("z-index", "1000");

    cardGroups
      .on("mouseover", (event, d) => {
        const node = d as CardNode;
        tooltip
          .html(`
            <div class="font-semibold">${node.name}</div>
            <div class="text-xs">${node.card.type_line}</div>
            ${node.card.oracle_text ? `<div class="text-xs mt-1">${node.card.oracle_text}</div>` : ''}
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px")
          .classed("hidden", false);
      })
      .on("mouseout", () => {
        tooltip.classed("hidden", true);
      });

    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Add zoom controls
    const zoomControls = svg.append("g")
      .attr("class", "zoom-controls")
      .attr("transform", `translate(${width - 60}, 20)`);

    // Zoom in button
    zoomControls.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 24)
      .attr("height", 24)
      .attr("rx", 4)
      .attr("fill", "#fff")
      .attr("stroke", "#ddd")
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.3);
      });

    zoomControls.append("text")
      .attr("x", 12)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .text("+")
      .style("pointer-events", "none");

    // Zoom out button
    zoomControls.append("rect")
      .attr("x", 0)
      .attr("y", 30)
      .attr("width", 24)
      .attr("height", 24)
      .attr("rx", 4)
      .attr("fill", "#fff")
      .attr("stroke", "#ddd")
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.7);
      });

    zoomControls.append("text")
      .attr("x", 12)
      .attr("y", 46)
      .attr("text-anchor", "middle")
      .text("-")
      .style("pointer-events", "none");

    // Reset zoom button
    zoomControls.append("rect")
      .attr("x", 0)
      .attr("y", 60)
      .attr("width", 24)
      .attr("height", 24)
      .attr("rx", 4)
      .attr("fill", "#fff")
      .attr("stroke", "#ddd")
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
      });

    zoomControls.append("text")
      .attr("x", 12)
      .attr("y", 76)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text("R")
      .style("pointer-events", "none");

    // Cleanup
    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [nodes, links]);

  // Drag handler with fixed positioning
  const drag = (simulation: d3.Simulation<CardNode, undefined>) => {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      // Don't reset fx and fy to null, keeping the node fixed in place
    }

    return d3.drag<SVGGElement, CardNode>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  return (
    <svg
      ref={svgRef}
      className="w-full h-full min-h-[600px]"
    >
      <defs>
        <clipPath id="card-clip">
          <rect x="-28" y="-38" width="56" height="80" rx="3" />
        </clipPath>
      </defs>
    </svg>
  );
}