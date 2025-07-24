# IntelWeb Documentation

## Overview

IntelWeb is a graph-based relationship visualization tool within the Starcom application that transforms the NodeWeb application from a simple intel report viewer into an Obsidian-style knowledge graph interface. It enables analysts to explore intelligence data as an interactive network of entities, relationships, and connections.

## Architecture

IntelWeb implements a **Virtual Filesystem** approach to handle intelligence packages in a static deployment environment, supporting password-protected ZIP archives that contain structured intelligence vaults similar to Obsidian workspaces.

## Key Features

- **Graph Visualization**: Force-directed network graphs with physics simulation
- **Entity Management**: People, Organizations, Establishments, Regions
- **Relationship Mapping**: Wikilink-style connections `[[Entity Name]]`
- **Intelligence Packages**: Self-contained vaults with ZIP compression
- **Obsidian Interface**: Complete UI/UX parity with Obsidian graph view
- **Offline Capability**: IndexedDB caching for disconnected analysis

## Documentation Structure

- [`TECHNICAL-SPECIFICATION.md`](./TECHNICAL-SPECIFICATION.md) - Complete technical implementation details
- [`DATA-MODELS.md`](./DATA-MODELS.md) - Interface definitions and data structures
- [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) - Development roadmap and milestones
- [`OBSIDIAN-INTERFACE-REFERENCE.md`](./OBSIDIAN-INTERFACE-REFERENCE.md) - UI component specifications
- [`VIRTUAL-FILESYSTEM.md`](./VIRTUAL-FILESYSTEM.md) - Package management and storage architecture
- [`LONG-ISLAND-CASE-EXAMPLE.md`](./LONG-ISLAND-CASE-EXAMPLE.md) - Reference implementation example

## Quick Start

The IntelWeb transformation addresses the architectural issue where the NodeWeb application was functioning as an intel report viewer (now moved to IntelAnalyzer) and evolves it into a powerful relationship analysis tool.

## Related Components

- **NodeWeb Application**: `/src/applications/nodeweb/NodeWebApplication.tsx`
- **IntelAnalyzer**: `/src/components/IntelAnalyzer/` (now handles report viewing)
- **Long Island Case Data**: `/src/data/The Long Island Case/` (reference vault)
- **Enhanced Application Router**: `/src/components/Router/EnhancedApplicationRouter.tsx`
