```
    BFS AGENT              CDA AGENT
         │                      │
         ▼                      ▼
    ┌─────────┐           ┌─────────┐
    │ explore │           │ explore │
    │ shallow │           │ deep    │
    │ all     │           │ one     │
    │ paths   │           │ path    │
    └────┬────┘           └────┬────┘
         │                      │
    ┌────▼────┐           ┌────▼────┐
    │ repeat  │           │ mark    │
    │ mistakes│           │ miss    │
    │ forever │           │ filter  │
    └─────────┘           │ repeat  │
                          │ NEVER   │
                          └─────────┘
```

Which one are you?

github.com/whtoo/cda_protocol

#CDAProtocol #AgentAlignment #StopWalkingInCircles