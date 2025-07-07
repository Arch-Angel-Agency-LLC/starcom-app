
import * as fs from 'fs';
import * as path from 'path';

const testResults = `
All 145Passed 61 Failed 84Flaky 0Skipped 0
7/2/2025, 11:45:25 AM
Total time: 4.7m
ai-agent.spec.ts
AI Agent Autonomous UI Testing › should detect and test UI components autonomouslychromium
32.4s
ai-agent.spec.ts:54
View Trace
AI Agent Autonomous UI Testing › should handle complex user workflowschromium
1.4s
ai-agent.spec.ts:128
View Trace
AI Agent Autonomous UI Testing › should detect performance issueschromium
2.2s
ai-agent.spec.ts:209
View Trace
AI Agent Autonomous UI Testing › should handle error conditions gracefullychromium
2.4s
ai-agent.spec.ts:241
View Trace
AI Agent Autonomous UI Testing › should detect and test UI components autonomouslyfirefox
19.1s
ai-agent.spec.ts:54
View Trace
AI Agent Autonomous UI Testing › should handle complex user workflowsfirefox
4.3s
ai-agent.spec.ts:128
View Trace
AI Agent Autonomous UI Testing › should detect performance issuesfirefox
4.0s
ai-agent.spec.ts:209
View Trace
AI Agent Autonomous UI Testing › should handle error conditions gracefullyfirefox
4.2s
ai-agent.spec.ts:241
View Trace
AI Agent Autonomous UI Testing › should detect and test UI components autonomouslywebkit
19.2s
ai-agent.spec.ts:54
View Trace
AI Agent Autonomous UI Testing › should handle complex user workflowswebkit
2.0s
ai-agent.spec.ts:128
View Trace
AI Agent Autonomous UI Testing › should detect performance issueswebkit
2.6s
ai-agent.spec.ts:209
View Trace
AI Agent Autonomous UI Testing › should handle error conditions gracefullywebkit
2.9s
ai-agent.spec.ts:241
View Trace
AI Agent Autonomous UI Testing › should detect and test UI components autonomouslymobile-chrome
17.2s
ai-agent.spec.ts:54
View Trace
AI Agent Autonomous UI Testing › should handle complex user workflowsmobile-chrome
2.0s
ai-agent.spec.ts:128
View Trace
AI Agent Autonomous UI Testing › should detect performance issuesmobile-chrome
2.4s
ai-agent.spec.ts:209
View Trace
AI Agent Autonomous UI Testing › should handle error conditions gracefullymobile-chrome
2.4s
ai-agent.spec.ts:241
View Trace
AI Agent Autonomous UI Testing › should detect and test UI components autonomouslymobile-safari
17.6s
ai-agent.spec.ts:54
View Trace
AI Agent Autonomous UI Testing › should handle complex user workflowsmobile-safari
1.8s
ai-agent.spec.ts:128
View Trace
AI Agent Autonomous UI Testing › should detect performance issuesmobile-safari
2.4s
ai-agent.spec.ts:209
View Trace
AI Agent Autonomous UI Testing › should handle error conditions gracefullymobile-safari
3.0s
ai-agent.spec.ts:241
View Trace
AI Agent Autonomous UI Testing › should detect and test UI components autonomouslyai-agent
17.6s
ai-agent.spec.ts:54
View Trace
AI Agent Autonomous UI Testing › should handle complex user workflowsai-agent
1.3s
ai-agent.spec.ts:128
View Trace
AI Agent Autonomous UI Testing › should detect performance issuesai-agent
2.3s
ai-agent.spec.ts:209
View Trace
AI Agent Autonomous UI Testing › should handle error conditions gracefullyai-agent
2.2s
ai-agent.spec.ts:241
View Trace
AI Agent Autonomous UI Testing › should perform accessibility analysischromium
1.7s
ai-agent.spec.ts:165
AI Agent Autonomous UI Testing › should perform accessibility analysisfirefox
4.2s
ai-agent.spec.ts:165
AI Agent Autonomous UI Testing › should perform accessibility analysiswebkit
2.0s
ai-agent.spec.ts:165
AI Agent Autonomous UI Testing › should perform accessibility analysismobile-chrome
1.6s
ai-agent.spec.ts:165
AI Agent Autonomous UI Testing › should perform accessibility analysismobile-safari
1.5s
ai-agent.spec.ts:165
AI Agent Autonomous UI Testing › should perform accessibility analysisai-agent
1.5s
ai-agent.spec.ts:165
ai-agent-phase2.spec.ts
AI Agent Phase 2 Advanced UI Testing › should perform advanced component detection with multiple strategieschromium
8.3s
ai-agent-phase2.spec.ts:33
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform intelligent interaction testingchromium
3.3s
ai-agent-phase2.spec.ts:61
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform UI pattern recognition and classificationchromium
3.5s
ai-agent-phase2.spec.ts:131
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform automated accessibility analysischromium
3.2s
ai-agent-phase2.spec.ts:177
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform advanced component detection with multiple strategiesfirefox
4.9s
ai-agent-phase2.spec.ts:33
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform intelligent interaction testingfirefox
3.5s
ai-agent-phase2.spec.ts:61
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform UI pattern recognition and classificationfirefox
3.8s
ai-agent-phase2.spec.ts:131
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform automated accessibility analysisfirefox
4.3s
ai-agent-phase2.spec.ts:177
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform advanced component detection with multiple strategieswebkit
4.0s
ai-agent-phase2.spec.ts:33
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform intelligent interaction testingwebkit
3.4s
ai-agent-phase2.spec.ts:61
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform UI pattern recognition and classificationwebkit
3.4s
ai-agent-phase2.spec.ts:131
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform automated accessibility analysiswebkit
3.7s
ai-agent-phase2.spec.ts:177
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform advanced component detection with multiple strategiesmobile-chrome
3.4s
ai-agent-phase2.spec.ts:33
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform intelligent interaction testingmobile-chrome
3.2s
ai-agent-phase2.spec.ts:61
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform UI pattern recognition and classificationmobile-chrome
3.1s
ai-agent-phase2.spec.ts:131
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform automated accessibility analysismobile-chrome
3.1s
ai-agent-phase2.spec.ts:177
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform advanced component detection with multiple strategiesmobile-safari
3.1s
ai-agent-phase2.spec.ts:33
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform intelligent interaction testingmobile-safari
3.3s
ai-agent-phase2.spec.ts:61
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform UI pattern recognition and classificationmobile-safari
3.7s
ai-agent-phase2.spec.ts:131
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform automated accessibility analysismobile-safari
3.4s
ai-agent-phase2.spec.ts:177
View Trace
AI Agent Phase 2 Advanced UI Testing › should perform performance-aware component testingchromium
3.0s
ai-agent-phase2.spec.ts:253
AI Agent Phase 2 Advanced UI Testing › should perform performance-aware component testingfirefox
3.6s
ai-agent-phase2.spec.ts:253
AI Agent Phase 2 Advanced UI Testing › should perform performance-aware component testingwebkit
3.6s
ai-agent-phase2.spec.ts:253
AI Agent Phase 2 Advanced UI Testing › should perform performance-aware component testingmobile-chrome
3.0s
ai-agent-phase2.spec.ts:253
AI Agent Phase 2 Advanced UI Testing › should perform performance-aware component testingmobile-safari
3.1s
ai-agent-phase2.spec.ts:253
enhanced-component-detection.spec.ts
Enhanced Component Detection › should wait for React app to load and detect componentschromium
3.2s
enhanced-component-detection.spec.ts:21
View Trace
Enhanced Component Detection Logic › should detect top navigation bar with improved accuracychromium
607ms
enhanced-component-detection.spec.ts:141
View Trace
Enhanced Component Detection Logic › should detect main content areachromium
610ms
enhanced-component-detection.spec.ts:151
View Trace
Enhanced Component Detection Logic › should detect footerchromium
729ms
enhanced-component-detection.spec.ts:158
View Trace
Enhanced Component Detection › should wait for React app to load and detect componentsfirefox
4.5s
enhanced-component-detection.spec.ts:21
View Trace
Enhanced Component Detection Logic › should detect top navigation bar with improved accuracyfirefox
709ms
enhanced-component-detection.spec.ts:141
View Trace
Enhanced Component Detection Logic › should detect main content areafirefox
1.3s
enhanced-component-detection.spec.ts:151
View Trace
Enhanced Component Detection Logic › should detect footerfirefox
1.2s
enhanced-component-detection.spec.ts:158
View Trace
Enhanced Component Detection › should wait for React app to load and detect componentswebkit
3.6s
enhanced-component-detection.spec.ts:21
View Trace
Enhanced Component Detection Logic › should detect top navigation bar with improved accuracywebkit
917ms
enhanced-component-detection.spec.ts:141
View Trace
Enhanced Component Detection Logic › should detect main content areawebkit
642ms
enhanced-component-detection.spec.ts:151
View Trace
Enhanced Component Detection Logic › should detect footerwebkit
578ms
enhanced-component-detection.spec.ts:158
View Trace
Enhanced Component Detection › should wait for React app to load and detect componentsmobile-chrome
2.7s
enhanced-component-detection.spec.ts:21
View Trace
Enhanced Component Detection Logic › should detect top navigation bar with improved accuracymobile-chrome
706ms
enhanced-component-detection.spec.ts:141
View Trace
Enhanced Component Detection Logic › should detect main content areamobile-chrome
636ms
enhanced-component-detection.spec.ts:151
View Trace
Enhanced Component Detection Logic › should detect footermobile-chrome
5.6s
enhanced-component-detection.spec.ts:158
View Trace
Enhanced Component Detection › should wait for React app to load and detect componentsmobile-safari
3.3s
enhanced-component-detection.spec.ts:21
View Trace
Enhanced Component Detection Logic › should detect top navigation bar with improved accuracymobile-safari
489ms
enhanced-component-detection.spec.ts:141
View Trace
Enhanced Component Detection Logic › should detect main content areamobile-safari
940ms
enhanced-component-detection.spec.ts:151
View Trace
Enhanced Component Detection Logic › should detect footermobile-safari
526ms
enhanced-component-detection.spec.ts:158
View Trace
Enhanced Component Detection › should detect different component typeschromium
3.5s
enhanced-component-detection.spec.ts:73
Enhanced Component Detection › should work with AgentInterface using enhanced detectionchromium
6.1s
enhanced-component-detection.spec.ts:91
Enhanced Component Detection › should detect different component typesfirefox
14.6s
enhanced-component-detection.spec.ts:73
Enhanced Component Detection › should work with AgentInterface using enhanced detectionfirefox
16.1s
enhanced-component-detection.spec.ts:91
Enhanced Component Detection › should detect different component typeswebkit
35.1s
enhanced-component-detection.spec.ts:73
Enhanced Component Detection › should work with AgentInterface using enhanced detectionwebkit
17.4s
enhanced-component-detection.spec.ts:91
Enhanced Component Detection › should detect different component typesmobile-chrome
4.1s
enhanced-component-detection.spec.ts:73
Enhanced Component Detection › should work with AgentInterface using enhanced detectionmobile-chrome
16.4s
enhanced-component-detection.spec.ts:91
Enhanced Component Detection › should detect different component typesmobile-safari
14.7s
enhanced-component-detection.spec.ts:73
Enhanced Component Detection › should work with AgentInterface using enhanced detectionmobile-safari
17.4s
enhanced-component-detection.spec.ts:91
user-simulation.spec.ts
Human-like UI Interaction Simulation › should simulate a user joining a team, sending a message, and verifying it appearschromium
11.9s
user-simulation.spec.ts:5
View Trace
Human-like UI Interaction Simulation › E2E-002: should correctly enable/disable the send button based on inputchromium
11.2s
user-simulation.spec.ts:28
View Trace
Human-like UI Interaction Simulation › E2E-003: should switch channels and preserve message statechromium
11.7s
user-simulation.spec.ts:54
View Trace
Human-like UI Interaction Simulation › should simulate a user joining a team, sending a message, and verifying it appearsfirefox
11.9s
user-simulation.spec.ts:5
View Trace
Human-like UI Interaction Simulation › E2E-002: should correctly enable/disable the send button based on inputfirefox
12.4s
user-simulation.spec.ts:28
View Trace
Human-like UI Interaction Simulation › E2E-003: should switch channels and preserve message statefirefox
12.5s
user-simulation.spec.ts:54
View Trace
Human-like UI Interaction Simulation › should simulate a user joining a team, sending a message, and verifying it appearswebkit
11.6s
user-simulation.spec.ts:5
View Trace
Human-like UI Interaction Simulation › E2E-002: should correctly enable/disable the send button based on inputwebkit
11.3s
user-simulation.spec.ts:28
View Trace
Human-like UI Interaction Simulation › E2E-003: should switch channels and preserve message statewebkit
11.3s
user-simulation.spec.ts:54
View Trace
Human-like UI Interaction Simulation › should simulate a user joining a team, sending a message, and verifying it appearsmobile-chrome
11.2s
user-simulation.spec.ts:5
View Trace
Human-like UI Interaction Simulation › E2E-002: should correctly enable/disable the send button based on inputmobile-chrome
11.7s
user-simulation.spec.ts:28
View Trace
Human-like UI Interaction Simulation › E2E-003: should switch channels and preserve message statemobile-chrome
11.5s
user-simulation.spec.ts:54
View Trace
Human-like UI Interaction Simulation › should simulate a user joining a team, sending a message, and verifying it appearsmobile-safari
11.6s
user-simulation.spec.ts:5
View Trace
Human-like UI Interaction Simulation › E2E-002: should correctly enable/disable the send button based on inputmobile-safari
12.1s
user-simulation.spec.ts:28
View Trace
Human-like UI Interaction Simulation › E2E-003: should switch channels and preserve message statemobile-safari
11.3s
user-simulation.spec.ts:54
View Trace
react-app-debug.spec.ts
React App Debug Analysis › analyze why React app root is emptychromium
178ms
react-app-debug.spec.ts:4
View Trace
React App Debug Analysis › analyze why React app root is emptyfirefox
496ms
react-app-debug.spec.ts:4
View Trace
React App Debug Analysis › analyze why React app root is emptywebkit
752ms
react-app-debug.spec.ts:4
View Trace
React App Debug Analysis › analyze why React app root is emptymobile-chrome
234ms
react-app-debug.spec.ts:4
View Trace
React App Debug Analysis › analyze why React app root is emptymobile-safari
814ms
react-app-debug.spec.ts:4
View Trace
basic-ui.spec.ts
AI Agent Testing Infrastructure › should load the application homepagechromium
8.6s
basic-ui.spec.ts:7
AI Agent Testing Infrastructure › should detect basic UI elementschromium
3.3s
basic-ui.spec.ts:43
AI Agent Testing Infrastructure › should be accessible to screen readerschromium
1.7s
basic-ui.spec.ts:69
AI Agent Testing Infrastructure › should complete a basic interaction workflowchromium
1.6s
basic-ui.spec.ts:97
AI Agent Testing Infrastructure › should load the application homepagefirefox
5.5s
basic-ui.spec.ts:7
AI Agent Testing Infrastructure › should detect basic UI elementsfirefox
4.0s
basic-ui.spec.ts:43
AI Agent Testing Infrastructure › should be accessible to screen readersfirefox
2.8s
basic-ui.spec.ts:69
AI Agent Testing Infrastructure › should complete a basic interaction workflowfirefox
3.6s
basic-ui.spec.ts:97
AI Agent Testing Infrastructure › should load the application homepagewebkit
3.9s
basic-ui.spec.ts:7
AI Agent Testing Infrastructure › should detect basic UI elementswebkit
3.5s
basic-ui.spec.ts:43
AI Agent Testing Infrastructure › should be accessible to screen readerswebkit
1.5s
basic-ui.spec.ts:69
AI Agent Testing Infrastructure › should complete a basic interaction workflowwebkit
1.9s
basic-ui.spec.ts:97
AI Agent Testing Infrastructure › should load the application homepagemobile-chrome
3.6s
basic-ui.spec.ts:7
AI Agent Testing Infrastructure › should detect basic UI elementsmobile-chrome
3.3s
basic-ui.spec.ts:43
AI Agent Testing Infrastructure › should be accessible to screen readersmobile-chrome
1.2s
basic-ui.spec.ts:69
AI Agent Testing Infrastructure › should complete a basic interaction workflowmobile-chrome
1.5s
basic-ui.spec.ts:97
AI Agent Testing Infrastructure › should load the application homepagemobile-safari
3.6s
basic-ui.spec.ts:7
AI Agent Testing Infrastructure › should detect basic UI elementsmobile-safari
3.3s
basic-ui.spec.ts:43
AI Agent Testing Infrastructure › should be accessible to screen readersmobile-safari
1.3s
basic-ui.spec.ts:69
AI Agent Testing Infrastructure › should complete a basic interaction workflowmobile-safari
1.7s
basic-ui.spec.ts:97
deep-react-debug.spec.ts
Deep React Debug Analysis › diagnose React mounting issues in detailchromium
12.0s
deep-react-debug.spec.ts:4
Deep React Debug Analysis › diagnose React mounting issues in detailfirefox
10.0s
deep-react-debug.spec.ts:4
Deep React Debug Analysis › diagnose React mounting issues in detailwebkit
6.8s
deep-react-debug.spec.ts:4
Deep React Debug Analysis › diagnose React mounting issues in detailmobile-chrome
6.8s
deep-react-debug.spec.ts:4
Deep React Debug Analysis › diagnose React mounting issues in detailmobile-safari
7.0s
deep-react-debug.spec.ts:4
page-structure-analysis.spec.ts
Page Structure Analysischromium
3.9s
page-structure-analysis.spec.ts:3
Page Structure Analysisfirefox
5.1s
page-structure-analysis.spec.ts:3
Page Structure Analysiswebkit
5.9s
page-structure-analysis.spec.ts:3
Page Structure Analysismobile-chrome
4.3s
page-structure-analysis.spec.ts:3
Page Structure Analysismobile-safari
4.3s
page-structure-analysis.spec.ts:3
universal-component-detection.spec.ts
AI Agent Interface - Universal Component Detection › should detect components using universal detectorchromium
16.5s
universal-component-detection.spec.ts:5
AI Agent Interface - Universal Component Detection › should handle pages with no detectable components gracefullychromium
12.3s
universal-component-detection.spec.ts:62
AI Agent Interface - Universal Component Detection › should detect components using universal detectorfirefox
18.2s
universal-component-detection.spec.ts:5
AI Agent Interface - Universal Component Detection › should handle pages with no detectable components gracefullyfirefox
12.9s
universal-component-detection.spec.ts:62
AI Agent Interface - Universal Component Detection › should detect components using universal detectorwebkit
16.9s
universal-component-detection.spec.ts:5
AI Agent Interface - Universal Component Detection › should handle pages with no detectable components gracefullywebkit
12.5s
universal-component-detection.spec.ts:62
AI Agent Interface - Universal Component Detection › should detect components using universal detectormobile-chrome
16.6s
universal-component-detection.spec.ts:5
AI Agent Interface - Universal Component Detection › should handle pages with no detectable components gracefullymobile-chrome
12.3s
universal-component-detection.spec.ts:62
AI Agent Interface - Universal Component Detection › should detect components using universal detectormobile-safari
17.3s
universal-component-detection.spec.ts:5
AI Agent Interface - Universal Component Detection › should handle pages with no detectable components gracefullymobile-safari
12.6s
universal-component-detection.spec.ts:62
`;

interface TestResult {
    suite: string;
    title: string;
    browser: string;
    duration: string;
    location: string;
    status: 'Failed' | 'Flaky' | 'Passed';
}

interface Summary {
    passed: number;
    failed: number;
    flaky: number;
    skipped: number;
    totalTime: string;
}

function parseTestResults(log: string): { summary: Summary; failures: TestResult[], flaky: TestResult[] } {
    const lines = log.trim().split('\\n');
    
    const summaryMatch = lines[0].match(/(\d+)Passed (\d+) Failed (\d+)Flaky (\d+)Skipped/);
    const timeMatch = lines[2].match(/Total time: (.*)/);

    const summary: Summary = {
        passed: summaryMatch ? parseInt(summaryMatch[1], 10) : 0,
        failed: summaryMatch ? parseInt(summaryMatch[2], 10) : 0,
        flaky: summaryMatch ? parseInt(summaryMatch[3], 10) : 0,
        skipped: summaryMatch ? parseInt(summaryMatch[4], 10) : 0,
        totalTime: timeMatch ? timeMatch[1] : 'N/A'
    };

    const failures: TestResult[] = [];
    const flaky: TestResult[] = [];

    let currentSuite = '';
    for (let i = 3; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.endsWith('.spec.ts')) {
            currentSuite = line;
            continue;
        }

        if (line.includes('›')) {
            const titleBrowserMatch = line.match(/(.*) › (.*)/);
            if (titleBrowserMatch) {
                const description = titleBrowserMatch[1];
                const testNameAndBrowser = titleBrowserMatch[2];
                
                // This is a rough way to distinguish browser from test name
                const browsers = ['chromium', 'firefox', 'webkit', 'mobile-chrome', 'mobile-safari', 'ai-agent'];
                let browser = 'unknown';
                let title = testNameAndBrowser;

                for(const b of browsers) {
                    if(testNameAndBrowser.endsWith(b)) {
                        browser = b;
                        title = testNameAndBrowser.replace(b, '').trim();
                        break;
                    }
                }


                const duration = lines[i + 1];
                const location = lines[i + 2];
                
                // Heuristic to determine if a test has failed or is flaky
                // The provided log doesn't explicitly state "FAILED" or "FLAKY" per test
                // We rely on the summary counts and assume the listed tests are the problems.
                // This is an approximation.
                if (failures.length < summary.failed) {
                     failures.push({ suite: currentSuite, title, browser, duration, location, status: 'Failed' });
                } else {
                    flaky.push({ suite: currentSuite, title, browser, duration, location, status: 'Flaky' });
                }
                i += 3; // Skip lines we've processed
            }
        }
    }

    return { summary, failures, flaky };
}

function analyze() {
    const { summary, failures, flaky } = parseTestResults(testResults);

    console.log('--- Test Result Analysis ---');
    console.log(JSON.stringify(summary, null, 2));
    console.log('\\n--- Top Failing Suites ---');
    
    const failureCounts: { [suite: string]: number } = {};
    for (const f of failures) {
        failureCounts[f.suite] = (failureCounts[f.suite] || 0) + 1;
    }
    const sortedFailures = Object.entries(failureCounts).sort((a, b) => b[1] - a[1]);
    console.log(sortedFailures.map(([suite, count]) => `${suite}: ${count} failures`).join('\\n'));


    console.log('\\n--- Top Flaky Suites ---');
    const flakyCounts: { [suite: string]: number } = {};
    for (const f of flaky) {
        flakyCounts[f.suite] = (flakyCounts[f.suite] || 0) + 1;
    }
    const sortedFlaky = Object.entries(flakyCounts).sort((a, b) => b[1] - a[1]);
    console.log(sortedFlaky.map(([suite, count]) => `${suite}: ${count} flaky tests`).join('\\n'));


    console.log('\\n--- Critical Failure Analysis ---');
    const reactDebugFailures = failures.filter(f => f.suite === 'react-app-debug.spec.ts');
    if (reactDebugFailures.length > 0) {
        console.log('CRITICAL: `react-app-debug.spec.ts` is failing.');
        console.log('This test analyzes why the React app root is empty.');
        console.log('Its failure across all browsers strongly suggests a fundamental issue with the application loading in the test environment.');
        console.log('This is likely the root cause for the cascade of other UI test failures.');
        console.log('Next step should be to create a dedicated debug test for this issue.');
    }

     const userSimFailures = failures.filter(f => f.suite === 'user-simulation.spec.ts');
    if (userSimFailures.length > 0) {
        console.log('\\nCRITICAL: `user-simulation.spec.ts` is failing.');
        console.log('This indicates the core user workflow is broken, preventing any meaningful E2E testing.');
    }
}

analyze();
