# Migration & Deprecations

Now
- Enhanced IntelDashboard mounts the unified Workspace Console.
- Legacy `/intel/workspace` available with a deprecation banner.

Next
- IntelAnalyzer (current) is deprecated; to be replaced by the Analysis Workbench.
- TimeMap standalone route will show a banner guiding to the Workbench's Timeline view.

Removal window
- Keep legacy routes for 1 release; add banner and telemetry to measure usage; remove after adoption threshold.

Bridges
- From Dashboard report card/inspector: "Analyze in Workbench" link deep-linking to selection.
- From Workbench inspector: "Open in Dashboard" for edits.
