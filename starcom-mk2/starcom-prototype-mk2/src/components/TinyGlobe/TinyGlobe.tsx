import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useGlobeContext } from '../../context/GlobeContext';
import styles from './TinyGlobe.module.css'; // Assuming you have CSS modules
import * as THREE from 'three'; // Import the THREE namespace
import { DirectionalLight, Vector3, TextureLoader, ShaderMaterial, Vector2 } from 'three';
import Globe, { GlobeMethods } from 'react-globe.gl';

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

const sunPosAt = () => {
    return [0, 0]; // Basic value
};

const TinyGlobe: React.FC = () => {
    const { focusLocation } = useGlobeContext();
    const globeRef = useRef<GlobeMethods>();
    const [globeReady, setGlobeReady] = useState(false);
    const [globeMaterial, setGlobeMaterial] = useState<ShaderMaterial>();

    // External data source for sun's location
    const sunPosition = new Vector3(5, 3, 5); // Example position, should be replaced with actual data

    useEffect(() => {
        (function iterateTime() {
            requestAnimationFrame(iterateTime);
        })();
    }, []);

    useEffect(() => {
        const loader = new TextureLoader();
        Promise.all([
            loader.loadAsync('//unpkg.com/three-globe/example/img/earth-day.jpg'),
            loader.loadAsync('//unpkg.com/three-globe/example/img/earth-night.jpg')
        ]).then(([dayTexture, nightTexture]) => {
            setGlobeMaterial(new ShaderMaterial({
                uniforms: {
                    dayTexture: { value: dayTexture },
                    nightTexture: { value: nightTexture },
                    sunPosition: { value: new Vector2() },
                    globeRotation: { value: new Vector2() }
                },
                vertexShader: dayNightShader.vertexShader,
                fragmentShader: dayNightShader.fragmentShader
            }));
        });
    }, []);

    useEffect(() => {
        // Update Sun position
        globeMaterial?.uniforms.sunPosition.value.set(...sunPosAt());
    }, [globeMaterial]);

    useEffect(() => {
        if (globeReady && globeRef.current) {
            if (globeMaterial) {
                globeRef.current.scene().traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material = globeMaterial;
                    }
                });

                const directionalLight = new DirectionalLight(0xffffff, 1);
                directionalLight.position.copy(sunPosition); // Use sun's position
                globeRef.current.scene().add(directionalLight);
            }
        }
    }, [globeReady, sunPosition, globeMaterial]);

    useEffect(() => {
        if (globeReady && globeRef.current && focusLocation) {
            // Rotate TinyGlobe to match the main globe's focus
            globeRef.current.pointOfView({ lat: focusLocation.lat, lng: focusLocation.lng+90, altitude: 2 });
            globeMaterial?.uniforms.globeRotation.value.set(focusLocation.lng+90, focusLocation.lat);
        }
    }, [globeReady, focusLocation, globeMaterial]);

    return (
        <div className={styles.tinyGlobeContainer}>
            <Suspense fallback={<div>Loading...</div>}>
                <Globe
                    ref={globeRef}
                    width={100} // Small size for HUD
                    height={100}
                    backgroundColor="rgba(0, 0, 0, 0)" // Transparent background
                    showAtmosphere={true}
                    atmosphereColor="gray"
                    atmosphereAltitude={0.15}
                    onGlobeReady={() => setGlobeReady(true)}
                />
            </Suspense>
        </div>
    );
};

export default TinyGlobe;