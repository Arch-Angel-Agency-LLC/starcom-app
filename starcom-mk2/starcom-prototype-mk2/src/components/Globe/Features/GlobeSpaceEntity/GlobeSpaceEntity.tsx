import Globe from 'react-globe.gl';

export function GlobeSpaceEntity({ planetData }) {
    return (
      <Globe
        objectsData={planetData}
        objectType="planet"
        objectSize={(d) => d.size}
      />
    );
  }