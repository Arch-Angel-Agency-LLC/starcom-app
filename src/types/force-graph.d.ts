/**
 * Type declarations for force-graph
 */

declare module 'force-graph' {
  interface GraphData {
    nodes: Array<NodeObject>;
    links: Array<LinkObject>;
  }

  interface NodeObject {
    id?: string;
    name?: string;
    val?: number;
    color?: string;
    [key: string]: any;
  }

  interface LinkObject {
    source: string | NodeObject;
    target: string | NodeObject;
    value?: number;
    color?: string;
    [key: string]: any;
  }

  interface ForceGraphInstance {
    // Core methods
    graphData(data: GraphData): ForceGraphInstance;
    width(width: number): ForceGraphInstance;
    height(height: number): ForceGraphInstance;
    backgroundColor(color: string): ForceGraphInstance;
    
    // Node methods
    nodeId(nodeId: string): ForceGraphInstance;
    nodeVal(valFn: (node: NodeObject) => number): ForceGraphInstance;
    nodeLabel(labelFn: (node: NodeObject) => string): ForceGraphInstance;
    nodeColor(colorFn: (node: NodeObject) => string): ForceGraphInstance;
    nodeCanvasObject(canvasFn: (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => void): ForceGraphInstance;
    onNodeClick(callback: (node: NodeObject) => void): ForceGraphInstance;
    onNodeHover(callback: (node: NodeObject | null) => void): ForceGraphInstance;
    onNodeDrag(callback: (node: NodeObject, translate: { x: number, y: number }) => void): ForceGraphInstance;
    onNodeDragEnd(callback: (node: NodeObject) => void): ForceGraphInstance;
    
    // Link methods
    linkSource(sourceId: string): ForceGraphInstance;
    linkTarget(targetId: string): ForceGraphInstance;
    linkWidth(widthFn: (link: LinkObject) => number): ForceGraphInstance;
    linkColor(colorFn: (link: LinkObject) => string): ForceGraphInstance;
    linkDirectionalArrowLength(lengthFn: (link: LinkObject) => number): ForceGraphInstance;
    linkDirectionalArrowRelPos(position: number): ForceGraphInstance;
    onLinkClick(callback: (link: LinkObject) => void): ForceGraphInstance;
    onLinkHover(callback: (link: LinkObject | null) => void): ForceGraphInstance;
    
    // Simulation methods
    d3Force(forceName: string, forceInstance: any): ForceGraphInstance;
    d3VelocityDecay(decay: number): ForceGraphInstance;
    d3AlphaDecay(decay: number): ForceGraphInstance;
    
    // Utility methods
    refresh(): ForceGraphInstance;
    centerAt(x?: number, y?: number): ForceGraphInstance;
    zoom(zoomLevel: number, duration?: number): ForceGraphInstance;
    pauseAnimation(): ForceGraphInstance;
    resumeAnimation(): ForceGraphInstance;
    _destructor?(): void;
  }

  function ForceGraph(): (elem: HTMLElement) => ForceGraphInstance;
  export default ForceGraph;
}

/**
 * Type declarations for 3d-force-graph
 */

declare module '3d-force-graph' {
  interface GraphData {
    nodes: Array<NodeObject>;
    links: Array<LinkObject>;
  }

  interface NodeObject {
    id?: string;
    name?: string;
    val?: number;
    color?: string;
    [key: string]: any;
  }

  interface LinkObject {
    source: string | NodeObject;
    target: string | NodeObject;
    value?: number;
    color?: string;
    [key: string]: any;
  }

  interface ForceGraph3DInstance {
    // Core methods
    graphData(data: GraphData): ForceGraph3DInstance;
    width(width: number): ForceGraph3DInstance;
    height(height: number): ForceGraph3DInstance;
    backgroundColor(color: string): ForceGraph3DInstance;
    
    // Node methods
    nodeId(nodeId: string): ForceGraph3DInstance;
    nodeVal(valFn: (node: NodeObject) => number): ForceGraph3DInstance;
    nodeLabel(labelFn: (node: NodeObject) => string): ForceGraph3DInstance;
    nodeColor(colorFn: (node: NodeObject) => string): ForceGraph3DInstance;
    nodeThreeObject(objectFn: (node: NodeObject) => any | null): ForceGraph3DInstance;
    onNodeClick(callback: (node: NodeObject) => void): ForceGraph3DInstance;
    onNodeHover(callback: (node: NodeObject | null) => void): ForceGraph3DInstance;
    onNodeDrag(callback: (node: NodeObject, translate: { x: number, y: number, z: number }) => void): ForceGraph3DInstance;
    onNodeDragEnd(callback: (node: NodeObject) => void): ForceGraph3DInstance;
    
    // Link methods
    linkSource(sourceId: string): ForceGraph3DInstance;
    linkTarget(targetId: string): ForceGraph3DInstance;
    linkWidth(widthFn: (link: LinkObject) => number): ForceGraph3DInstance;
    linkColor(colorFn: (link: LinkObject) => string): ForceGraph3DInstance;
    linkDirectionalArrowLength(lengthFn: (link: LinkObject) => number): ForceGraph3DInstance;
    linkDirectionalArrowRelPos(position: number): ForceGraph3DInstance;
    onLinkClick(callback: (link: LinkObject) => void): ForceGraph3DInstance;
    onLinkHover(callback: (link: LinkObject | null) => void): ForceGraph3DInstance;
    
    // Simulation methods
    d3Force(forceName: string, forceInstance: any): ForceGraph3DInstance;
    d3VelocityDecay(decay: number): ForceGraph3DInstance;
    d3AlphaDecay(decay: number): ForceGraph3DInstance;
    
    // Utility methods
    refresh(): ForceGraph3DInstance;
    cameraPosition(position: { x?: number, y?: number, z?: number }, lookAt?: { x?: number, y?: number, z?: number }, duration?: number): ForceGraph3DInstance;
    zoom(zoomLevel: number, duration?: number): ForceGraph3DInstance;
    pauseAnimation(): ForceGraph3DInstance;
    resumeAnimation(): ForceGraph3DInstance;
    _destructor?(): void;
  }

  function ForceGraph3D(): (elem: HTMLElement) => ForceGraph3DInstance;
  export default ForceGraph3D;
}
