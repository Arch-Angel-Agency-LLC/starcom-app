// Simple Layer Registry (Phase Infra-0 skeleton)
import * as THREE from 'three';
import { clearGroup } from './utils/disposal';

export interface LayerDefinition {
  id: string;
  order: number;
  build: () => THREE.Group;        // Build geometry group (idempotent if already built)
  onActivate?: (group: THREE.Group) => void;  // Hook when activated
  onSuspend?: (group: THREE.Group) => void;   // Hook when suspended (detached)
  dispose?: (group: THREE.Group) => void;     // Full cleanup
}

interface LayerState {
  def: LayerDefinition;
  group: THREE.Group | null;
  status: 'registered' | 'built' | 'active' | 'suspended' | 'disposed';
}

export class LayerRegistry {
  private layers: Map<string, LayerState> = new Map();
  private dirty = false;

  register(def: LayerDefinition) {
    if (this.layers.has(def.id)) {
      console.warn(`[LayerRegistry] Layer already registered: ${def.id}`);
      return;
    }
    this.layers.set(def.id, { def, group: null, status: 'registered' });
    this.dirty = true;
  }

  build(id: string) {
    const st = this.layers.get(id);
    if (!st) return;
    if (st.status === 'disposed') return;
    if (!st.group) {
      st.group = st.def.build();
    }
    st.status = 'built';
  }

  activate(id: string, scene: THREE.Scene) {
    const st = this.layers.get(id);
    if (!st) return;
    if (st.status === 'disposed') return;
    if (!st.group) this.build(id);
    if (st.group && !scene.children.includes(st.group)) {
      scene.add(st.group);
      st.status = 'active';
      st.def.onActivate?.(st.group);
      this.dirty = true;
    }
  }

  suspend(id: string, scene: THREE.Scene) {
    const st = this.layers.get(id);
    if (!st || !st.group) return;
    if (scene.children.includes(st.group)) {
      scene.remove(st.group);
      st.status = 'suspended';
      st.def.onSuspend?.(st.group);
      this.dirty = true;
    }
  }

  dispose(id: string, scene?: THREE.Scene) {
    const st = this.layers.get(id);
    if (!st) return;
    if (st.group) {
      if (scene && scene.children.includes(st.group)) scene.remove(st.group);
      st.def.dispose?.(st.group);
      clearGroup(st.group);
      st.group = null;
    }
    st.status = 'disposed';
    this.dirty = true;
  }

  getActiveLayersSorted(): THREE.Group[] {
    const actives: Array<{ order: number; group: THREE.Group }> = [];
    this.layers.forEach(st => {
      if (st.status === 'active' && st.group) actives.push({ order: st.def.order, group: st.group });
    });
    return actives.sort((a,b) => a.order - b.order).map(a => a.group);
  }

  getStatus(id: string) {
    return this.layers.get(id)?.status;
  }
}

export const globalLayerRegistry = new LayerRegistry();
