import Globe from 'react-globe.gl';

export function GlobeIntelNode({ intelData }) {
    return (
      <Globe
        objectsData={intelData}
        objectType="intel"
        objectSize={(d) => d.riskLevel}
      />
    );
  }