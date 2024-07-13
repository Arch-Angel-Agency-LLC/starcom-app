
# Starcom App Node Web Visualization

## Overview

This document provides instructions for creating a visualization of a node web for the Starcom App's cyber investigations case management tool. The node web can be dragged around and zoomed in and out, and can be displayed in both 2D and 3D views.

## Prerequisites

Ensure you have a ReactJS project set up. You can use `create-react-app` to set up a basic React application if you haven't already.

### Install Necessary Libraries

Install D3.js for 2D visualizations, Three.js for 3D visualizations, and React-Three-Fiber for integrating Three.js with React.

```sh
npm install d3 three @react-three/fiber
```

## 2D Node Web with D3.js

Create a React component using D3.js to create a force-directed graph.

### NodeWeb2D.js

```jsx
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const NodeWeb2D = () => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', 800)
      .attr('height', 600);

    const nodes = [
      { id: 1, name: 'Node 1' },
      { id: 2, name: 'Node 2' },
      { id: 3, name: 'Node 3' },
      // Add more nodes as needed
    ];

    const links = [
      { source: 1, target: 2 },
      { source: 2, target: 3 },
      // Add more links as needed
    ];

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(400, 300));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999');

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 10)
      .attr('fill', '#69b3a2');

    node.append('title')
      .text(d => d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

  }, []);

  return (
    <svg ref={svgRef}></svg>
  );
};

export default NodeWeb2D;
```

## 3D Node Web with Three.js and React-Three-Fiber

Create a React component using Three.js and React-Three-Fiber to create a 3D graph.

### NodeWeb3D.js

```jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { ForceGraph3D } from 'react-force-graph';

const NodeWeb3D = () => {
  const graphData = {
    nodes: [
      { id: 1, name: 'Node 1' },
      { id: 2, name: 'Node 2' },
      { id: 3, name: 'Node 3' },
      // Add more nodes as needed
    ],
    links: [
      { source: 1, target: 2 },
      { source: 2, target: 3 },
      // Add more links as needed
    ],
  };

  return (
    <Canvas>
      <ForceGraph3D
        graphData={graphData}
        nodeAutoColorBy="group"
        linkDirectionalParticles={2}
      />
    </Canvas>
  );
};

export default NodeWeb3D;
```

## Toggling Between 2D and 3D Views

Use state management (like React's useState) to toggle between the 2D and 3D components.

### NodeWebContainer.js

```jsx
import React, { useState } from 'react';
import NodeWeb2D from './NodeWeb2D';
import NodeWeb3D from './NodeWeb3D';

const NodeWebContainer = () => {
  const [is3D, setIs3D] = useState(false);

  return (
    <div>
      <button onClick={() => setIs3D(!is3D)}>
        Toggle {is3D ? '2D' : '3D'} View
      </button>
      {is3D ? <NodeWeb3D /> : <NodeWeb2D />}
    </div>
  );
};

export default NodeWebContainer;
```

## Summary

This guide provides a starting point for building an interactive node web visualization in both 2D and 3D views for the Starcom App's cyber investigations case management tool. You can further customize the appearance and functionality as needed.
