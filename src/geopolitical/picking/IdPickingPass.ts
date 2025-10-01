import * as THREE from 'three';

function hash32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function colorFromId(id: string): THREE.Color {
  const h = hash32(id);
  // Use 24-bit RGB from hash
  const r = (h & 0xff);
  const g = ((h >> 8) & 0xff);
  const b = ((h >> 16) & 0xff);
  return new THREE.Color(r / 255, g / 255, b / 255);
}

export class IdPickingPass {
  private renderer: THREE.WebGLRenderer;
  private rt: THREE.WebGLRenderTarget;
  private scene: THREE.Scene;
  private camera: THREE.Camera | null = null;
  private targetGroup: THREE.Group | null = null;
  private groupPick: THREE.Group;
  private size = { width: 512, height: 512 };
  private idByRGB = new Map<string, string>();
  private pickMeshByName = new Map<string, THREE.Mesh>();

  constructor(width = 512, height = 512) {
    const canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: false });
    this.renderer.setSize(width, height, false);
    this.rt = new THREE.WebGLRenderTarget(width, height, { depthBuffer: true, stencilBuffer: false });
    this.rt.texture.minFilter = THREE.NearestFilter;
    this.rt.texture.magFilter = THREE.NearestFilter;
    this.rt.texture.generateMipmaps = false;
    this.scene = new THREE.Scene();
    this.groupPick = new THREE.Group();
    this.scene.add(this.groupPick);
    this.size = { width, height };
  }

  setSize(width: number, height: number) {
    if (width === this.size.width && height === this.size.height) return;
    this.size = { width, height };
    this.renderer.setSize(width, height, false);
    this.rt.setSize(width, height);
  }

  setCamera(camera: THREE.Camera) {
    this.camera = camera;
  }

  setTargetGroup(group: THREE.Group | null) {
    this.targetGroup = group;
    this.rebuildPickingGroup();
  }

  private rebuildPickingGroup() {
    // Rebuild the picking meshes from targetGroup meshes with solid color materials
    this.groupPick.clear();
    this.idByRGB.clear();
    this.pickMeshByName.clear();
    if (!this.targetGroup) return;
    const materialCache = new Map<string, THREE.MeshBasicMaterial>();
    const addMesh = (src: THREE.Mesh) => {
      const id = src.name || 'mesh';
      const color = colorFromId(id);
      const key = `${(color.r*255)|0},${(color.g*255)|0},${(color.b*255)|0}`;
      this.idByRGB.set(key, id);
      let mat = materialCache.get(key);
      if (!mat) {
        mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        materialCache.set(key, mat);
      }
      const mesh = new THREE.Mesh((src.geometry as THREE.BufferGeometry), mat);
      mesh.name = id;
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(src.matrixWorld);
      this.groupPick.add(mesh);
      this.pickMeshByName.set(id, mesh);
    };
    this.targetGroup.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        addMesh(obj as THREE.Mesh);
      }
    });
  }

  private refreshTransformsFromTarget() {
    if (!this.targetGroup) return;
    // Update matrices of pick meshes to match current world matrices of target meshes
    this.targetGroup.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const id = (obj as THREE.Mesh).name || 'mesh';
        const pickMesh = this.pickMeshByName.get(id);
        if (pickMesh) {
          pickMesh.matrix.copy((obj as THREE.Mesh).matrixWorld);
        }
      }
    });
  }

  private render() {
    if (!this.camera) return;
  // Ensure transforms reflect latest scene updates
  this.refreshTransformsFromTarget();
    this.renderer.setRenderTarget(this.rt);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }

  getIdAt(x: number, y: number): string | null {
    if (!this.camera) return null;
    this.render();
    const { width, height } = this.size;
    const px = Math.min(width - 1, Math.max(0, Math.floor(x)));
    const py = Math.min(height - 1, Math.max(0, Math.floor(y)));
    const buffer = new Uint8Array(4);
    this.renderer.readRenderTargetPixels(this.rt, px, height - py - 1, 1, 1, buffer);
    const key = `${buffer[0]},${buffer[1]},${buffer[2]}`;
    const id = this.idByRGB.get(key) || null;
    return id;
  }

  getIdAtNormalized(u: number, v: number): string | null {
    // u,v in [0,1], origin top-left (v=0 at top)
    const x = Math.round(u * (this.size.width - 1));
    const y = Math.round(v * (this.size.height - 1));
    return this.getIdAt(x, y);
  }

  setSizeFromCanvas(canvas: HTMLCanvasElement) {
    // Use the device pixel size to match camera projection
    const w = canvas.width || canvas.clientWidth;
    const h = canvas.height || canvas.clientHeight;
    if (w && h) this.setSize(w, h);
  }
}
