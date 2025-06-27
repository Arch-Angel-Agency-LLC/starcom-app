// Centralized custom shaders and material creators for Globe and TinyGlobe
import * as THREE from 'three';

// --- Hologram Shader ---
export function createHologramMaterial(earthDarkTexture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      earthTexture: { value: earthDarkTexture },
      colorFilter: { value: new THREE.Color(0x00ffff) },
      glowIntensity: { value: 2.0 },
      fresnelPower: { value: 2.5 },
      time: { value: 0.0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vFresnel;
      uniform float fresnelPower;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        vec3 viewDirection = normalize(cameraPosition - position);
        vFresnel = pow(1.0 - dot(vNormal, viewDirection), fresnelPower);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D earthTexture;
      uniform vec3 colorFilter;
      uniform float glowIntensity;
      uniform float time;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vFresnel;
      void main() {
        vec4 textureColor = texture2D(earthTexture, vUv);
        float glow = sin(time * 3.0) * 0.5 + 1.5;
        vec3 hologramColor = textureColor.rgb * colorFilter * vFresnel * glow * glowIntensity;
        gl_FragColor = vec4(hologramColor, 0.8);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });
}

// --- DayNight Shader ---
export function createDayNightMaterial(dayTexture: THREE.Texture, nightTexture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTexture },
      nightTexture: { value: nightTexture },
      sunPosition: { value: new THREE.Vector2() },
      globeRotation: { value: new THREE.Vector2() }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      #define PI 3.141592653589793
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform vec2 sunPosition;
      uniform vec2 globeRotation;
      varying vec3 vNormal;
      varying vec2 vUv;
      float toRad(in float a) { return a * PI / 180.0; }
      vec3 Polar2Cartesian(in vec2 c) {
        float theta = toRad(90.0 - c.x);
        float phi = toRad(90.0 - c.y);
        return vec3(sin(phi) * cos(theta), cos(phi), sin(phi) * sin(theta));
      }
      void main() {
        float invLon = toRad(globeRotation.x);
        float invLat = -toRad(globeRotation.y);
        mat3 rotX = mat3(1, 0, 0, 0, cos(invLat), -sin(invLat), 0, sin(invLat), cos(invLat));
        mat3 rotY = mat3(cos(invLon), 0, sin(invLon), 0, 1, 0, -sin(invLon), 0, cos(invLon));
        vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
        float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);
        float blendFactor = smoothstep(-0.5, 0.5, intensity);
        gl_FragColor = mix(nightColor, dayColor, blendFactor);
      }
    `
  });
}

// --- BlueMarble Shader ---
export function createBlueMarbleMaterial(blueMarbleTexture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      blueMarbleTexture: { value: blueMarbleTexture }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D blueMarbleTexture;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(blueMarbleTexture, vUv);
      }
    `
  });
}

// --- Shader Selector Utility ---
export function getGlobeMaterial(
  mode: string,
  submode: string,
  textures: { earthDarkTexture?: THREE.Texture; dayTexture?: THREE.Texture; nightTexture?: THREE.Texture; blueMarbleTexture?: THREE.Texture }
): THREE.Material | undefined {
  // Map CyberCommand/IntelReports to hologram
  if ((mode === 'hologram') || (mode === 'CyberCommand' && submode === 'IntelReports')) {
    return createHologramMaterial(textures.earthDarkTexture!);
  }
  if (mode === 'dayNight') {
    return createDayNightMaterial(textures.dayTexture!, textures.nightTexture!);
  }
  if (mode === 'blueMarble') {
    return createBlueMarbleMaterial(textures.blueMarbleTexture!);
  }
  // Default: use react-globe.gl's built-in material
  return undefined;
}
