/**
 * useGlobeRightClickInteraction - Hook for right-click context menu on globe
 * 
 * Handles right-click events on the globe surface, detects geographic coordinates,
 * and manages context menu state using the global context menu provider.
 */

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GlobeContextAction, GlobeContextActionData } from '../components/ui/GlobeContextMenu/GlobeContextMenu';
import { useGlobalGlobeContextMenu } from '../context/GlobalGlobeContextMenuProvider';

interface UseGlobeRightClickProps {
  globeRef: React.RefObject<{ 
    camera: () => THREE.Camera; 
    scene: () => THREE.Scene;
    getCoords?: (lat: number, lng: number) => THREE.Vector3;
  }>;
  containerRef: React.RefObject<HTMLDivElement>;
  enabled?: boolean;
  onContextAction?: (action: GlobeContextAction, data?: GlobeContextActionData) => void;
}

interface GlobeIntersection {
  point: THREE.Vector3;
  geoCoordinates: { lat: number; lng: number };
}

export function useGlobeRightClickInteraction({
  globeRef,
  containerRef,
  enabled = true,
  onContextAction
}: UseGlobeRightClickProps) {
  const globalContextMenu = useGlobalGlobeContextMenu();
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Convert 3D world position to geographic coordinates
  const worldToGeo = useCallback((worldPos: THREE.Vector3): { lat: number; lng: number } => {
    // Normalize the world position to get it on the unit sphere
    const normalized = worldPos.clone().normalize();
    
    // Convert Cartesian coordinates to spherical (lat/lng)
    // Note: This assumes the globe is centered at origin with radius ~100
    const lat = Math.asin(normalized.y) * (180 / Math.PI);
    const lng = Math.atan2(normalized.x, normalized.z) * (180 / Math.PI);
    
    return { lat, lng };
  }, []);

  // Raycast against globe surface to find intersection point
  const getGlobeIntersection = useCallback((
    mouseX: number, 
    mouseY: number, 
    containerRect: DOMRect
  ): GlobeIntersection | null => {
    if (!globeRef.current) return null;

    const globeObj = globeRef.current;
    const camera = globeObj.camera();
    const scene = globeObj.scene();
    
    if (!camera || !scene) return null;

    // Convert mouse coordinates to normalized device coordinates (-1 to +1)
    const x = ((mouseX - containerRect.left) / containerRect.width) * 2 - 1;
    const y = -((mouseY - containerRect.top) / containerRect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    // Find intersections with all objects in the scene
    const intersects = raycasterRef.current.intersectObjects(scene.children, true);
    
    console.log(`🔍 Raycasting found ${intersects.length} intersections`);
    
    // Look for the first intersection that represents the globe surface
    // This typically would be a sphere mesh representing the Earth
    for (const intersect of intersects) {
      console.log('🎯 Checking intersection:', {
        type: intersect.object.type,
        name: intersect.object.name,
        geometry: intersect.object instanceof THREE.Mesh ? intersect.object.geometry?.type : 'N/A',
        distance: intersect.distance
      });
      
      // Skip if it's not a mesh or if it's too small (likely UI element)
      if (!intersect.object || intersect.object.type !== 'Mesh') continue;
      
      // Check if this looks like a globe mesh (reasonable size sphere)
      const mesh = intersect.object as THREE.Mesh;
      if (mesh.geometry && 
          (mesh.geometry.type === 'SphereGeometry' || 
           mesh.geometry.type === 'SphereBufferGeometry' ||
           mesh.name?.toLowerCase().includes('globe') ||
           mesh.name?.toLowerCase().includes('earth'))) {
        
        console.log('🌍 Found globe mesh:', mesh.name || 'unnamed');
        
        const worldPoint = intersect.point;
        const geoCoordinates = worldToGeo(worldPoint);
        
        return {
          point: worldPoint,
          geoCoordinates
        };
      }
    }

    return null;
  }, [globeRef, worldToGeo]);

  // Handle context menu action
  const handleContextAction = useCallback((
    action: GlobeContextAction, 
    data?: GlobeContextActionData
  ) => {
    console.log('🎯 Context menu action (hook fallback):', {
      action: action.id,
      label: action.label,
      data
    });

    if (!data?.geoLocation) {
      console.warn('No geo location provided for action:', action.id);
      return;
    }

    const { lat, lng } = data.geoLocation;

    // Provide basic fallback implementations for when parent doesn't handle actions
    switch (action.id) {
      case 'create-intel-report':
        console.log('📝 Creating intel report at:', { lat, lng });
        alert(`Intel Report creation requested at: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n\nThis action needs to be handled by the parent component.`);
        break;
      
      case 'add-marker':
        console.log('📍 Adding marker at:', { lat, lng });
        alert(`Marker placement requested at: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n\nMarker functionality coming soon.`);
        break;
        
      case 'location-details': {
        console.log('🌍 Showing location details for:', { lat, lng });
        const hemisphere = lat > 0 ? 'Northern' : 'Southern';
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        alert(`Location Details:\nCoordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}\nHemisphere: ${hemisphere}\nLocal Timezone: ${timezone}`);
        break;
      }
        
      case 'share-location': {
        console.log('👥 Sharing location:', { lat, lng });
        const coordsText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(coordsText).then(() => {
            alert(`Coordinates copied to clipboard:\n${coordsText}`);
          }).catch(() => {
            alert(`Coordinates:\n${coordsText}\n(Copy manually)`);
          });
        } else {
          alert(`Coordinates:\n${coordsText}\n(Clipboard not available)`);
        }
        break;
      }
        
      default:
        console.log('🔧 Unhandled action (using fallback):', action.id);
        alert(`Feature "${action.label}" is not yet implemented.\n\nLocation: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  // Handle right-click events
  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (!enabled || !containerRef.current) return;

    event.preventDefault(); // Prevent browser context menu

    const rect = containerRef.current.getBoundingClientRect();
    const intersection = getGlobeIntersection(event.clientX, event.clientY, rect);

    if (intersection) {
      console.log('🌍 Right-click on globe:', {
        coordinates: intersection.geoCoordinates,
        worldPoint: intersection.point
      });

      globalContextMenu.showContextMenu(
        { x: event.clientX, y: event.clientY },
        intersection.geoCoordinates,
        onContextAction || handleContextAction
      );
    } else {
      console.log('❌ Right-click missed globe surface');
    }
  }, [enabled, containerRef, getGlobeIntersection, globalContextMenu, handleContextAction, onContextAction]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    // Disable default context menu and add our handler
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled, containerRef, handleContextMenu]);

  // Close context menu on escape key
  useEffect(() => {
    if (!globalContextMenu.isVisible) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        globalContextMenu.hideContextMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [globalContextMenu]);

  return {
    // Functions
    handleContextAction,
    
    // Utilities
    getGlobeIntersection: (mouseX: number, mouseY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      return getGlobeIntersection(mouseX, mouseY, rect);
    }
  };
}

export default useGlobeRightClickInteraction;
