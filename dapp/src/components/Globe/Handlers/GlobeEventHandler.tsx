// src/components/Globe/Handlers/GlobeEventHandler.tsx
// import { useGlobeData } from './GlobeDataProvider';
// import Globe from 'react-globe.gl';

// export function GlobeEventHandler({ globeRef }) {
//   const { selectGeoMarker, selectSpaceEntity } = useGlobeData();

//   const handleClick = (event) => {
//     if (event.type === 'marker') {
//       selectGeoMarker(event);
//     } else if (event.type === 'space-entity') {
//       selectSpaceEntity(event);
//     }
//   };

//   return <Globe ref={globeRef} onClick={handleClick} />;
// }