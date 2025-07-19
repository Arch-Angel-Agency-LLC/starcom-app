# NetRunner UX Flow Diagram

This document outlines the key user experience flows within the NetRunner system, illustrating how users navigate through different tasks and processes.

## 1. Main Navigation Flow

```
┌─────────────────┐
│     Landing     │
│      Page       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    NetRunner    │
│    Dashboard    │
└─────────┬───────┘
          │
┌─────────┼─────────┬──────────┬──────────┬──────────┬──────────┐
│         │         │          │          │          │          │
▼         ▼         ▼          ▼          ▼          ▼          ▼
┌─────┐ ┌─────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Basic│ │Adv. │ │ Power   │ │  Bot    │ │  Intel  │ │ Market- │ │Monitoring│
│Search│ │Search│ │ Tools   │ │Control  │ │Analysis │ │ place   │ │Dashboard │
└──┬──┘ └──┬──┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
   │       │         │         │          │          │          │
   └───────┴─────────┴─────────┴──────────┴──────────┴──────────┘
```

## 2. Search Flow

```
┌─────────────────┐
│    NetRunner    │
│    Dashboard    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Enter Search   │
│     Query       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Sources  │
│   & Filters     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Execute Search │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  View Results   │
└────────┬────────┘
         │
    ┌────┴────────────┬─────────────────┬─────────────────┐
    │                 │                 │                 │
    ▼                 ▼                 ▼                 ▼
┌─────────┐    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Refine  │    │ Extract     │   │ Save        │   │ Use in      │
│ Search  │    │ Entities    │   │ Results     │   │ Report      │
└─────────┘    └─────────────┘   └─────────────┘   └─────────────┘
```

## 3. Power Tools Flow

```
┌─────────────────┐
│   Power Tools   │
│     Panel       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Tool     │
│ Category        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Browse and     │
│ Select Tool(s)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Configure Tool  │
│ Parameters      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Execute Tool   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  View Results   │
└────────┬────────┘
         │
    ┌────┴────────────┬─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌─────────────┐   ┌─────────────┐
│ Save    │    │ Export      │   │ Use in      │
│ Results │    │ Results     │   │ Report      │
└─────────┘    └─────────────┘   └─────────────┘
```

## 4. Bot Automation Flow

```
┌─────────────────┐
│  Bot Control    │
│     Panel       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Browse and      │
│ Select Bot      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Configure Bot   │
│ Task            │
└────────┬────────┘
         │
    ┌────┴─────────┐
    │              │
    ▼              ▼
┌─────────┐  ┌─────────────┐
│ Schedule │  │ Run         │
│ Task     │  │ Immediately │
└────┬─────┘  └──────┬──────┘
     │               │
     └───────┬───────┘
             │
             ▼
┌─────────────────┐
│ Monitor Task    │
│ Progress        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Results    │
└────────┬────────┘
         │
    ┌────┴────────────┬─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌─────────────┐   ┌─────────────┐
│ Save    │    │ Create      │   │ Share       │
│ Results │    │ Report      │   │ Results     │
└─────────┘    └─────────────┘   └─────────────┘
```

## 5. Intel Analysis Flow

```
┌─────────────────┐
│ Intel Analysis  │
│     Panel       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Analysis │
│ Type/Template   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Import Data     │
│ (Search/Tools)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract/Verify  │
│ Entities        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add Findings    │
│ & Analysis      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Report │
└────────┬────────┘
         │
    ┌────┴────────────┬─────────────────┬─────────────────┐
    │                 │                 │                 │
    ▼                 ▼                 ▼                 ▼
┌─────────┐    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Save as │    │ Export      │   │ Create      │   │ List on     │
│ Draft   │    │ Report      │   │ Briefing    │   │ Marketplace │
└─────────┘    └─────────────┘   └─────────────┘   └─────────────┘
```

## 6. Marketplace Flow

```
┌─────────────────┐
│ Marketplace     │
│     Panel       │
└────────┬────────┘
         │
    ┌────┴─────────┐
    │              │
    ▼              ▼
┌─────────┐  ┌─────────────┐
│ Browse  │  │ My          │
│ Listings │  │ Portfolio   │
└────┬─────┘  └──────┬──────┘
     │               │
     ▼               ▼
┌─────────┐  ┌─────────────┐
│ Filter  │  │ Manage My   │
│ Listings │  │ Listings    │
└────┬─────┘  └──────┬──────┘
     │               │
     ▼               │
┌─────────┐          │
│ View    │          │
│ Details │          │
└────┬─────┘         │
     │               │
     ▼               ▼
┌─────────┐  ┌─────────────┐
│ Purchase│  │ Create New  │
│ Intel   │  │ Listing     │
└────┬─────┘  └──────┬──────┘
     │               │
     ▼               ▼
┌─────────┐  ┌─────────────┐
│ View    │  │ Set Pricing │
│ Purchased│ │ & Terms     │
│ Intel   │  │             │
└─────────┘  └─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │ Publish     │
              │ Listing     │
              └─────────────┘
```

## 7. Monitoring Flow

```
┌─────────────────┐
│ Monitoring      │
│ Dashboard       │
└────────┬────────┘
         │
    ┌────┴─────────┐
    │              │
    ▼              ▼
┌─────────┐  ┌─────────────┐
│ View    │  │ Create New  │
│ Monitors │  │ Monitor     │
└────┬─────┘  └──────┬──────┘
     │               │
     ▼               ▼
┌─────────┐  ┌─────────────┐
│ Check   │  │ Configure   │
│ Status  │  │ Sources     │
└────┬─────┘  └──────┬──────┘
     │               │
     ▼               ▼
┌─────────┐  ┌─────────────┐
│ View    │  │ Set         │
│ Alerts  │  │ Frequency   │
└────┬─────┘  └──────┬──────┘
     │               │
     ▼               ▼
┌─────────┐  ┌─────────────┐
│ Act on  │  │ Configure   │
│ Alerts  │  │ Alerts      │
└─────────┘  └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │ Activate    │
             │ Monitor     │
             └─────────────┘
```

## 8. Cross-Mode Transitions

```
┌─────────────────┐
│    Search       │
│    Results      │
└────────┬────────┘
         │
    ┌────┴───────────┬────────────────┬────────────────┐
    │                │                │                │
    ▼                ▼                ▼                ▼
┌─────────┐   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Use in  │   │ Analyze with │  │ Monitor    │   │ Create Bot  │
│ Report  │   │ Power Tools  │  │ Source     │   │ Task        │
└────┬────┘   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
     │               │               │                │
     ▼               ▼               ▼                ▼
┌─────────┐   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│Analysis │   │Power Tools  │  │Monitoring   │   │Bot Control  │
│Mode     │   │Mode         │  │Mode         │   │Mode         │
└─────────┘   └─────────────┘  └─────────────┘  └─────────────┘
```

## 9. Report Generation Flow

```
┌─────────────────┐
│  Intelligence   │
│    Sources      │
└────────┬────────┘
         │
    ┌────┴───────────┬────────────────┬────────────────┐
    │                │                │                │
    ▼                ▼                ▼                ▼
┌─────────┐   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Search  │   │ Power Tool  │  │ Bot Task    │   │ Monitor    │
│ Results │   │ Results     │  │ Results     │   │ Alerts     │
└────┬────┘   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
     │               │               │                │
     └───────────────┼───────────────┼────────────────┘
                     │               │
                     ▼               ▼
             ┌─────────────┐  ┌─────────────┐
             │ Raw Intel   │  │ Processed   │
             │ Data        │  │ Intel Data  │
             └──────┬──────┘  └──────┬──────┘
                    │                │
                    └────────┬───────┘
                             │
                             ▼
                     ┌─────────────┐
                     │ Intel Report│
                     │ Builder     │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Finalized   │
                     │ Report      │
                     └──────┬──────┘
                            │
                ┌───────────┴──────────┐
                │                      │
                ▼                      ▼
        ┌─────────────┐         ┌─────────────┐
        │ Internal    │         │ Marketplace │
        │ Storage     │         │ Listing     │
        └─────────────┘         └─────────────┘
```

## 10. Intelligence Lifecycle Flow

```
┌─────────────────┐
│ Raw Intelligence│
│ Collection      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Processing &    │
│ Verification    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Analysis &      │
│ Report Creation │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Dissemination   │
│ (Marketplace)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Actionable      │
│ Intelligence    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Feedback &      │
│ Refinement      │
└────────┬────────┘
         │
         └──────────┐
                    ▼
           ┌─────────────────┐
           │ Continuous      │
           │ Monitoring      │
           └─────────────────┘
```

## 11. User Onboarding Flow

```
┌─────────────────┐
│ First-time      │
│ Login           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ NetRunner       │
│ Introduction    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Feature         │
│ Walkthrough     │
└────────┬────────┘
         │
    ┌────┴─────────┬────────────────┬────────────────┬────────────────┐
    │              │                │                │                │
    ▼              ▼                ▼                ▼                ▼
┌─────────┐ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Search  │ │ Power Tools │  │ Bot         │  │ Analysis    │  │ Marketplace │
│ Demo    │ │ Demo        │  │ Demo        │  │ Demo        │  │ Demo        │
└────┬────┘ └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
     │             │                │                │                │
     └─────────────┴────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │ Preferences     │
                            │ Setup           │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Main Dashboard  │
                            └─────────────────┘
```

## 12. Account Management Flow

```
┌─────────────────┐
│ User Profile    │
│ Icon            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Account Menu    │
└────────┬────────┘
         │
    ┌────┴───────────┬────────────────┬────────────────┬────────────────┐
    │                │                │                │                │
    ▼                ▼                ▼                ▼                ▼
┌─────────┐   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Profile │   │ API Keys    │  │ Billing     │  │ Preferences │  │ History     │
│ Settings│   │             │  │             │  │             │  │             │
└────┬────┘   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
     │               │               │                │                │
     ▼               ▼               ▼                ▼                ▼
┌─────────┐   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Update  │   │ Generate    │  │ Payment     │  │ Interface   │  │ View        │
│ Info    │   │ New Key     │  │ Methods     │  │ Settings    │  │ Activity    │
└─────────┘   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

## 13. Detailed Tool Execution Flow

```
┌─────────────────┐
│ Select Power    │
│ Tool            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Basic           │
│ Configuration   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Advanced        │
│ Configuration   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execution       │
│ Parameters      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Run Tool        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Progress   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Results         │
│ Display         │
└────────┬────────┘
         │
    ┌────┴───────────┬────────────────┬────────────────┐
    │                │                │                │
    ▼                ▼                ▼                ▼
┌─────────┐   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Raw     │   │ Processed   │  │ Visual      │  │ Export      │
│ Data    │   │ Data        │  │ View        │  │ Options     │
└─────────┘   └─────────────┘  └─────────────┘  └─────────────┘
```

## 14. Alert Handling Flow

```
┌─────────────────┐
│ Alert           │
│ Triggered       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Alert           │
│ Notification    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Alert      │
│ Details         │
└────────┬────────┘
         │
    ┌────┴───────────┬────────────────┬────────────────┐
    │                │                │                │
    ▼                ▼                ▼                ▼
┌─────────┐   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Dismiss │   │ Investigate │  │ Create      │  │ Adjust      │
│ Alert   │   │ Alert       │  │ Report      │  │ Monitor     │
└─────────┘   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
                     │                │                │
                     ▼                │                │
             ┌─────────────┐          │                │
             │ Use Power   │          │                │
             │ Tools       │          │                │
             └──────┬──────┘          │                │
                    │                 │                │
                    └─────────────────┼────────────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │ Take Action │
                              └─────────────┘
```

## 15. Report Publishing Flow

```
┌─────────────────┐
│ Completed       │
│ Intel Report    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Review Report   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set Publication │
│ Options         │
└────────┬────────┘
         │
    ┌────┴───────────┬────────────────┐
    │                │                │
    ▼                ▼                ▼
┌─────────┐   ┌─────────────┐  ┌─────────────┐
│ Internal│   │ Marketplace │  │ Export to   │
│ Only    │   │ Listing     │  │ External    │
└─────────┘   └──────┬──────┘  └─────────────┘
                     │
                     ▼
             ┌─────────────┐
             │ Set Pricing │
             │ & Terms     │
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │ Create      │
             │ Preview     │
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │ Publish     │
             │ Listing     │
             └─────────────┘
```

## 16. Collaboration Flow

```
┌─────────────────┐
│ Intel Report    │
│ or Project      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Share Options   │
└────────┬────────┘
         │
    ┌────┴───────────┬────────────────┬────────────────┐
    │                │                │                │
    ▼                ▼                ▼                ▼
┌─────────┐   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Add     │   │ Export &    │  │ Share Link  │  │ Assign      │
│ Colleague│  │ Send        │  │             │  │ Task        │
└────┬────┘   └─────────────┘  └─────────────┘  └──────┬──────┘
     │                                                  │
     ▼                                                  ▼
┌─────────┐                                      ┌─────────────┐
│ Set     │                                      │ Set         │
│ Permissions│                                   │ Deadline    │
└────┬────┘                                      └──────┬──────┘
     │                                                  │
     └──────────────────────┬───────────────────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │ Activity        │
                    │ Tracking        │
                    └─────────────────┘
```

## 17. Common Feature Interaction Patterns

### 17.1 Selection Pattern

```
┌─────────────────┐
│ View List       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Filter/Search   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Item     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Details    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Take Action     │
└─────────────────┘
```

### 17.2 Configuration Pattern

```
┌─────────────────┐
│ Default Config  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Basic Settings  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Advanced        │
│ Settings        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Preview/Test    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save/Apply      │
└─────────────────┘
```

### 17.3 Wizard Pattern

```
┌─────────────────┐
│ Start Wizard    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 1          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 2          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 3          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Review          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Complete        │
└─────────────────┘
```

## 18. Mobile Experience Flow Differences

```
┌─────────────────┐
│ Mobile NetRunner│
│ Dashboard       │
└────────┬────────┘
         │
    ┌────┴───────────┐
    │                │
    ▼                ▼
┌─────────┐   ┌─────────────┐
│ Mode    │   │ Current     │
│ Selector│   │ Mode View   │
└────┬────┘   └──────┬──────┘
     │               │
     └───────┬───────┘
             │
             ▼
┌─────────────────┐          ┌─────────────────┐
│ Bottom          │          │ Full-screen     │
│ Navigation      │◀─────────│ Action View     │
└────────┬────────┘          └─────────────────┘
         │                             ▲
    ┌────┴───────────┬────────────────┐│
    │                │                ││
    ▼                ▼                ││
┌─────────┐   ┌─────────────┐         ││
│ Quick   │   │ View        │         ││
│ Actions │   │ Notifications│        ││
└─────────┘   └─────────────┘         ││
                                       ││
                                       ││
┌─────────────────┐                   ││
│ Pull-to-refresh │                   ││
│ Results         │───────────────────┘│
└─────────────────┘                    │
                                       │
┌─────────────────┐                    │
│ Swipe Actions   │────────────────────┘
└─────────────────┘
```

## 19. Summary of Key UX Patterns

1. **Progressive Disclosure** - Present complex functionality gradually
2. **Contextual Actions** - Show relevant actions based on current content
3. **Consistent Navigation** - Maintain consistent navigation across modes
4. **Transactional Flows** - Well-defined steps for complex operations
5. **Collaborative Workflows** - Support for multi-user intelligence workflows
6. **Cross-mode Integration** - Seamless transition between different modes
7. **Data Transformation Visualization** - Clear representation of data processing
8. **Tool-based Interaction** - Specialized tools for specific intelligence tasks

This UX flow documentation serves as a guide for implementing the NetRunner interface, ensuring a consistent and intuitive user experience across all parts of the system.
