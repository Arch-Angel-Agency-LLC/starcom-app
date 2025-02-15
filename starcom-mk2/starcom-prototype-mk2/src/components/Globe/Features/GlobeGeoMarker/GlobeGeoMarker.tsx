import Globe from 'react-globe.gl';

export function GlobeGeoMarker({ data }) {
    return (
      <Globe
        markersData={data}
        markerColor={() => 'red'}
        markerSize={1.5}
      />
    );
  }