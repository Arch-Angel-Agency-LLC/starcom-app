# IntelWeb Integration Roadmap

Phase A — Data Mapping & Vault
- Deliverables:
  - Mapping spec finalized and reviewed
  - Converter producing VFS from sample IntelReportData
  - relationshipGraph populated
- Acceptance:
  - Demo vault with ≥3 reports, ≥5 entities, ≥8 edges
  - Validation checklist passes

Phase B — Graph Foundations
- Deliverables:
  - IntelGraph uses relationshipGraph; adds layout presets
  - Canvas renderer; worker-based physics; LOD labels
- Acceptance:
  - 5k nodes / 10k edges at ≥30 FPS
  - Filters (classification/type/confidence/time) responsive (<100ms)

Phase C — 3D Engine
- Deliverables:
  - GraphEngine3D with three-forcegraph or custom
  - GPU picking; LOD; frustum culling
- Acceptance:
  - 20k nodes / 50k edges at ≥30 FPS
  - Parity with 2D interactions

Phase D — Integration & UX
- Deliverables:
  - Wrapper loads service-built VFS/DataPack
  - Save/restore positions; geo/timeline layouts
- Acceptance:
  - End-to-end flow from Intel → VFS → Graph; shareable saved views

Reviews & Checkpoints
- Half-phase perf checks; code review gates; UX validations with sample datasets

