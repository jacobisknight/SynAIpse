# SynapseGrid - Enterprise AI Agent Orchestration Platform

## Overview

SynapseGrid is an enterprise-grade platform that enables organizations to deploy, manage, and orchestrate autonomous AI agents across voice, workflow, and data ecosystems. Built with a modern fullstack TypeScript architecture, it provides a unified control plane for managing complex agent hierarchies and autonomous task decomposition.

## Core Features

### Implemented MVP Features

1. **Multi-tenant Architecture**
   - Organization-based workspaces
   - Role-based access control foundation
   - Isolated agent management per organization

2. **Agent Management**
   - Create agents of three types: Voice, Workflow, and Data
   - Configure agent personas, goals, and triggers
   - Start/stop agent execution
   - Real-time status monitoring

3. **Autonomous Sub-Agent Spawning**
   - AI-powered task decomposition using OpenAI GPT-5
   - Automatic sub-agent creation for complex tasks
   - Parent-child agent hierarchy tracking
   - Intelligent agent type assignment based on sub-task requirements

4. **Agent Hierarchy Visualization**
   - Tree-view visualization of agent relationships
   - Expandable/collapsible hierarchy
   - Real-time status indicators
   - Parent-child delegation tracking

5. **Real-time Monitoring**
   - Live dashboard with key metrics
   - Activity feed showing recent agent actions
   - WebSocket-powered real-time updates
   - Agent performance statistics

6. **Integration Framework**
   - Mock connectors for enterprise systems (Salesforce, SAP, ServiceNow, etc.)
   - Enable/disable integrations
   - Integration status tracking

7. **Professional Enterprise UI**
   - Carbon Design System with Linear-inspired aesthetics
   - Dark mode support
   - Responsive design across all breakpoints
   - Accessible components with proper test IDs

## Architecture

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query v5
- **UI Components**: Shadcn UI + Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Fonts**: Inter (UI), JetBrains Mono (code/technical)

### Backend
- **Runtime**: Node.js with Express
- **Data Storage**: In-memory storage (MemStorage)
- **AI Services**: OpenAI GPT-5 via Replit AI Integrations
- **Real-time**: WebSocket (ws) for live updates
- **Validation**: Zod schemas

### AI Integration
- Uses Replit AI Integrations for OpenAI access
- No API key required - charges billed to Replit credits
- Implements retry logic with exponential backoff
- Rate limiting protection with p-limit and p-retry

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Shadcn components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   ├── create-agent-modal.tsx
│   │   │   └── agent-hierarchy.tsx
│   │   ├── pages/          # Route pages
│   │   │   ├── dashboard.tsx
│   │   │   ├── agents.tsx
│   │   │   ├── workflows.tsx
│   │   │   ├── integrations.tsx
│   │   │   ├── data.tsx
│   │   │   └── settings.tsx
│   │   └── App.tsx
│   └── index.html
├── server/
│   ├── routes.ts           # API endpoints + WebSocket
│   ├── storage.ts          # In-memory data storage
│   └── ai-service.ts       # AI task decomposition & execution
├── shared/
│   └── schema.ts           # Shared data models & validation
└── design_guidelines.md    # UI/UX design system
```

## Key Technologies

- **OpenAI GPT-5**: Task decomposition, agent persona generation, task execution
- **WebSocket**: Real-time agent status updates
- **Zod**: Runtime type validation
- **Drizzle ORM**: Schema definitions (ready for PostgreSQL migration)
- **TanStack Query**: Data fetching and caching
- **React Hook Form**: Form management
- **Shadcn UI**: Component library

## Agent Lifecycle

1. **Create** - User defines agent name, type, persona, goals, and triggers
2. **Deploy** - Agent is created and registered in the system
3. **Activate** - Agent status changed to "active" for task execution
4. **Decompose** (Optional) - Complex tasks are broken into sub-tasks, spawning sub-agents
5. **Execute** - Agents process tasks using LLM intelligence
6. **Monitor** - Real-time tracking of agent performance and status
7. **Cleanup** - Sub-agents are automatically removed after task completion (configurable)

## Autonomous Sub-Agent System

### How It Works

1. User submits a complex task to a parent agent
2. POST `/api/agents/:id/decompose` with task description
3. AI analyzes task and parent agent's goals/type
4. System generates 2-5 executable sub-tasks
5. Sub-agents are automatically created with:
   - Appropriate agent type (voice/workflow/data)
   - AI-generated persona matching the sub-task
   - Priority assignment
   - Parent-child relationship tracking
6. Each sub-agent receives its assigned task
7. Tasks can be executed via POST `/api/agents/:id/execute`

### Example Flow

```javascript
// 1. Create parent workflow agent
POST /api/agents
{
  "name": "Customer Onboarding Agent",
  "type": "workflow",
  "goals": ["Onboard new customers efficiently"],
  "organizationId": "demo-org"
}

// 2. Decompose complex task
POST /api/agents/{parentId}/decompose
{
  "taskDescription": "Onboard a new enterprise customer with 500 users"
}

// 3. System automatically creates sub-agents:
//    - Data Agent: Validate customer data
//    - Workflow Agent: Set up user accounts
//    - Voice Agent: Send welcome communications
```

## API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/:id` - Get agent details
- `PATCH /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent (and sub-agents)
- `POST /api/agents/:id/decompose` - Decompose task into sub-agents
- `POST /api/agents/:id/execute` - Execute agent task

### Tasks
- `GET /api/tasks` - List tasks (filter by agentId)
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task

### Integrations
- `GET /api/integrations` - List integrations
- `POST /api/integrations` - Create integration
- `PATCH /api/integrations/:id` - Update integration

### Stats & Activity
- `GET /api/stats` - Dashboard statistics
- `GET /api/activity` - Recent activity feed

### WebSocket
- Connect to `/ws` for real-time updates
- Events: `agent_created`, `agent_updated`, `agent_deleted`, `subagents_created`, `task_completed`, etc.

## Development

### Running Locally
The workflow "Start application" runs `npm run dev` which starts:
- Express backend on port 5000
- Vite frontend (served through Express)

### Environment Variables
Automatically configured:
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI Integrations endpoint
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Integration API key

## Design System

Following Carbon Design System with Linear-inspired modernization:

### Colors
- Primary: Blue (#1D4ED8 family)
- Success: Green (for active agents)
- Warning: Amber (for processing states)
- Error: Red (for errors)
- Neutral: Gray scale with excellent contrast

### Typography
- UI: Inter font family
- Code/Technical: JetBrains Mono
- Hierarchy: 4xl → 2xl → lg → sm → xs

### Spacing
- Small: 4px (gap-1)
- Medium: 16-24px (gap-4 to gap-6)
- Large: 32px+ (gap-8)

## Next Phase Features

1. PostgreSQL database persistence
2. Vector database for RAG (Pinecone/Milvus)
3. Voice synthesis (ElevenLabs integration)
4. Advanced workflow builder (visual canvas)
5. Federated learning layer
6. Compliance dashboard (HIPAA/SOC2 audit trails)
7. Real-time collaboration features
8. Agent marketplace/SDK

## Recent Changes

- **2025-01-XX**: Initial MVP implementation
  - Complete agent CRUD with hierarchy support
  - AI-powered task decomposition
  - Autonomous sub-agent spawning
  - Real-time WebSocket updates
  - Professional enterprise UI with dark mode
  - Integration framework foundation
