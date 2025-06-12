// Moved from src/__tests__/data-services.all.test.ts
// Centralized test suite for all data service artifacts and domains
// Artifacts: data-service-interfaces, data-service-testing-strategy, data-service-observability, data-service-refactor-plan
// This file imports and runs all relevant test modules for unified reporting and CI.

import './eia/EIADataProvider.unit.test';
// import './eia/EIADataProvider.contract.test'; // File does not exist
import './eia/EIADataProvider.observability.test';
import './eia/EIADataCacheService.unit.test';
import './eia/EIADataCacheService.observability.test';
// import './eia/LegacyEIAServiceAdapter.contract.test'; // File does not exist
import './market/MarketDataProvider.unit.test';
import './market/MarketDataCacheService.unit.test';
import './shared/FallbackProvider.unit.test';
// import './EIAService.integration.test'; // (Commented out: file missing)
import './eia/EIAService.e2e.test';
import './eia/EIAService.test';
// TODO: Add imports for all future domain/provider/cache/adapters tests
