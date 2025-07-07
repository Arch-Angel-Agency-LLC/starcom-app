// GlobeModeMapping.ts
// AI-NOTE: See globe-mode-mapping-reference.artifact for mapping logic.

/**
 * GlobeModeMapping: Maps Starcom visualization modes to globe rendering modes, shaders, and overlays.
 * - See globe-mode-mapping-reference.artifact and globe-modes.artifact for mapping logic and extension.
 */

export class GlobeModeMapping {
  /**
   * Get render config for a given mode (see globe-mode-mapping-reference.artifact)
   */
  static getRenderConfigForMode(mode: string) {
    // AI-NOTE: See globe-mode-mapping-reference.artifact and globe-modes.artifact for mapping logic.
    // Expanded mapping with rationale and overlays
    const mapping: Record<string, { shader: string; overlays: string[]; texture: string; rationale: string }> = {
      CyberCommand: {
        shader: 'hologram',
        overlays: ['alerts', 'intelMarkers'],
        texture: 'earthDark',
        rationale: 'CyberCommand uses a hologram effect for a futuristic, high-contrast look. Overlays highlight cyber alerts and intelligence markers.'
      },
      EcoNatural: {
        shader: 'dayNight',
        overlays: ['weather', 'naturalEvents'],
        texture: 'earthDay',
        rationale: 'EcoNatural uses day/night shading to visualize real-world environmental data and events.'
      },
      GeoPolitical: {
        shader: 'blueMarble',
        overlays: ['borders', 'territories'],
        texture: 'blueMarble',
        rationale: 'GeoPolitical uses the blue marble texture for clarity and overlays for borders and territories.'
      },
      INTEL: {
        shader: 'intelShader',
        overlays: ['intelMarkersOverlay'],
        texture: 'intelTexture',
        rationale: 'INTEL mode uses overlays for intelligence markers.'
      },
    };
    return mapping[mode] || mapping['EcoNatural']; // fallback
  }
}
