// Convert GLB to base64 data URL for inline embedding
import fs from 'fs';
import path from 'path';

const glbPath = path.join(process.cwd(), 'src/assets/models/intel_report-01d.glb');
const outputPath = path.join(process.cwd(), 'src/assets/models/intel_report-01d-base64.ts');

try {
  const glbBuffer = fs.readFileSync(glbPath);
  const base64Data = glbBuffer.toString('base64');
  const dataUrl = `data:model/gltf-binary;base64,${base64Data}`;
  
  const output = `// Auto-generated base64 GLB data URL
// Generated from: ${path.basename(glbPath)}
// Size: ${Math.round(glbBuffer.length / 1024)}KB

export const INTEL_REPORT_MODEL_DATA_URL = "${dataUrl}";
`;

  fs.writeFileSync(outputPath, output);
  console.log(`✅ Generated ${outputPath}`);
  console.log(`📦 Original size: ${Math.round(glbBuffer.length / 1024)}KB`);
  console.log(`📦 Base64 size: ${Math.round(base64Data.length / 1024)}KB`);
  
} catch (error) {
  console.error('❌ Error generating base64 GLB:', error);
}
