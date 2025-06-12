import React, { useEffect, useRef, useState, Suspense, useMemo } from 'react';
import { useGlobeContext } from '../../context/GlobeContext';
import styles from './TinyGlobe.module.css'; // Assuming you have CSS modules
import * as THREE from 'three'; // Import the THREE namespace
import Globe, { GlobeMethods } from 'react-globe.gl';
import { Vector3, Vector2 } from 'three';
import { TextureLoader, ShaderMaterial, DirectionalLight } from 'three';

const dayNightShader = {
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

        float toRad(in float a) {
            return a * PI / 180.0;
        }

        vec3 Polar2Cartesian(in vec2 c) { // [lng, lat]
            float theta = toRad(90.0 - c.x);
            float phi = toRad(90.0 - c.y);
            return vec3( // x,y,z
                sin(phi) * cos(theta),
                cos(phi),
                sin(phi) * sin(theta)
            );
        }

        void main() {
            float invLon = toRad(globeRotation.x);
            float invLat = -toRad(globeRotation.y);
            mat3 rotX = mat3(
                1, 0, 0,
                0, cos(invLat), -sin(invLat),
                0, sin(invLat), cos(invLat)
            );
            mat3 rotY = mat3(
                cos(invLon), 0, sin(invLon),
                0, 1, 0,
                -sin(invLon), 0, cos(invLon)
            );
            vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
            float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
            vec4 dayColor = texture2D(dayTexture, vUv);
            vec4 nightColor = texture2D(nightTexture, vUv);
            float blendFactor = smoothstep(-0.5, 0.5, intensity);
            gl_FragColor = mix(nightColor, dayColor, blendFactor);
        }
    `
};

const blueMarbleShader = {
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
};

const createDayNightMaterial = (dayTexture: THREE.Texture, nightTexture: THREE.Texture) => {
    return new ShaderMaterial({
        uniforms: {
            dayTexture: { value: dayTexture },
            nightTexture: { value: nightTexture },
            sunPosition: { value: new Vector2() },
            globeRotation: { value: new Vector2() }
        },
        vertexShader: dayNightShader.vertexShader,
        fragmentShader: dayNightShader.fragmentShader
    });
};

const createHologramMaterial = (earthDarkTexture: THREE.Texture) => {
    return new ShaderMaterial({
        uniforms: {
            earthTexture: { value: earthDarkTexture },
            colorFilter: { value: new THREE.Color(0x00ffff) }, // Cyan/teal color filter
            glowIntensity: { value: 2.0 }, // Dynamic glow intensity
            fresnelPower: { value: 2.5 }, // Fresnel effect power
            time: { value: 0.0 } // Time for animation
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            varying float vFresnel;
            uniform float fresnelPower;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vUv = uv;

                // Fresnel effect calculation
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
                // Sample the earth texture
                vec4 textureColor = texture2D(earthTexture, vUv);

                // Apply a pulsating glow effect
                float glow = sin(time * 3.0) * 0.5 + 1.5;

                // Combine texture color with the color filter and Fresnel effect
                vec3 hologramColor = textureColor.rgb * colorFilter * vFresnel * glow * glowIntensity;

                gl_FragColor = vec4(hologramColor, 0.8); // Apply transparency
            }
        `,
        transparent: true, // Allow transparency for better integration
        side: THREE.DoubleSide // Render both sides of the globe
    });
};

const sunPosAt = () => {
    return [0, 0]; // Basic value
};

const interfaceModes = {
    geoMagnetics: 'dayNight',
    intelReports: 'hologram',
    solarSystem: 'blueMarble'
};

const TinyGlobe: React.FC = () => {
    const { focusLocation } = useGlobeContext();
    const globeRef = useRef<GlobeMethods>();
    const [globeReady, setGlobeReady] = useState(false);
    const [globeMaterial, setGlobeMaterial] = useState<ShaderMaterial | null>(null);
    const [interfaceMode, setInterfaceMode] = useState<'geoMagnetics' | 'intelReports' | 'solarSystem'>('intelReports');
    const texturesRef = useRef<{ dayTexture: THREE.Texture; nightTexture: THREE.Texture; blueMarbleTexture: THREE.Texture; earthDarkTexture: THREE.Texture } | null>(null);

    const sunPosition = useMemo(() => new Vector3(5, 3, 5), []); // Example position, should be replaced with actual data

    useEffect(() => {
        const loader = new TextureLoader();
        Promise.all([
            loader.loadAsync('//unpkg.com/three-globe/example/img/earth-day.jpg'),
            loader.loadAsync('//unpkg.com/three-globe/example/img/earth-night.jpg'),
            loader.loadAsync('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg'), // Blue Marble texture
            loader.loadAsync('//unpkg.com/three-globe/example/img/earth-dark.jpg') // Earth-dark texture
        ]).then(([dayTexture, nightTexture, blueMarbleTexture, earthDarkTexture]) => {
            texturesRef.current = { dayTexture, nightTexture, blueMarbleTexture, earthDarkTexture };
            setGlobeMaterial(createDayNightMaterial(dayTexture, nightTexture));
        }).catch((error) => {
            console.error("Error loading textures:", error);
        });
    }, []);

    useEffect(() => {
        if (texturesRef.current) {
            const { dayTexture, nightTexture, blueMarbleTexture, earthDarkTexture } = texturesRef.current;
            const materials = {
                dayNight: createDayNightMaterial(dayTexture, nightTexture),
                hologram: createHologramMaterial(earthDarkTexture),
                blueMarble: new ShaderMaterial({
                    uniforms: {
                        blueMarbleTexture: { value: blueMarbleTexture }
                    },
                    vertexShader: blueMarbleShader.vertexShader,
                    fragmentShader: blueMarbleShader.fragmentShader
                })
            };

            const selectedMaterial = materials[interfaceModes[interfaceMode] as keyof typeof materials];
            setGlobeMaterial(selectedMaterial);
        }
    }, [interfaceMode]);

    useEffect(() => {
        // Update Sun position
        if (interfaceMode === 'geoMagnetics' && globeMaterial?.uniforms?.sunPosition) {
            globeMaterial.uniforms.sunPosition.value.set(...sunPosAt());
        }
    }, [globeMaterial, interfaceMode]);

    useEffect(() => {
        if (globeReady && globeRef.current) {
            if (globeMaterial) {
                globeRef.current.scene().traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material = globeMaterial;
                    }
                });

                if (interfaceMode === 'geoMagnetics') {
                    const directionalLight = new DirectionalLight(0xffffff, 1);
                    directionalLight.position.copy(sunPosition); // Use sun's position
                    globeRef.current.scene().add(directionalLight);
                }
            }
        }
    }, [globeReady, sunPosition, globeMaterial, interfaceMode]);

    useEffect(() => {
        if (globeReady && globeRef.current && focusLocation) {
            // Rotate TinyGlobe to match the main globe's focus
            globeRef.current.pointOfView({ lat: focusLocation.lat, lng: focusLocation.lng + 90, altitude: 2 });
            if (interfaceMode === 'geoMagnetics' && globeMaterial?.uniforms?.globeRotation) {
                globeMaterial.uniforms.globeRotation.value.set(focusLocation.lng + 90, focusLocation.lat);
            }
        }
    }, [globeReady, focusLocation, globeMaterial, interfaceMode]);

    useEffect(() => {
        // Animate the hologram material
        const animate = () => {
            if (globeMaterial && interfaceMode === 'intelReports' && globeMaterial.uniforms?.time) {
                globeMaterial.uniforms.time.value += 0.01; // Increment time for animation
            }
            requestAnimationFrame(animate);
        };
        animate();
    }, [globeMaterial, interfaceMode]);

    return (
        <div className={`${styles.tinyGlobeContainer}`}>
            <div className={`${styles.title}`}>
                <h1>Starcom</h1>
            </div>
            <Suspense fallback={<div>Loading...</div>}>
                <Globe
                    ref={globeRef}
                    width={100} // Small size for HUD
                    height={100}
                    backgroundColor="rgba(0, 0, 0, 0)" // Transparent background
                    showAtmosphere={true}
                    atmosphereColor="#00C4FF" // Teal blue tint
                    atmosphereAltitude={0.15}
                    onGlobeReady={() => setGlobeReady(true)}
                />
            </Suspense>
            <div className={styles.buttonContainer}>
                <button 
                    className={styles.shaderButton} 
                    data-interface-button="geoMagnetics" 
                    onClick={() => setInterfaceMode('geoMagnetics')}
                >
                    🌎
                </button>
                <button 
                    className={styles.shaderButton} 
                    data-interface-button="intelReports" 
                    onClick={() => setInterfaceMode('intelReports')}
                >
                    📑
                </button>
                <button 
                    className={styles.shaderButton} 
                    data-interface-button="solarSystem" 
                    onClick={() => setInterfaceMode('solarSystem')}
                >
                    ☀️
                </button>
            </div>
        </div>
    );
};

export default TinyGlobe;