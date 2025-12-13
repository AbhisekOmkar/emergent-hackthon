# AI Agent Builder Platform - Requirements & Architecture

## Original Problem Statement
Build a production-grade AI Agent Builder platform similar to Giga.ai, Voiceflow, and LiveKit Agent Builder. The platform enables users to create, configure, test, and deploy both Voice AI agents and Chat agents with drag-and-drop workflow builders, comprehensive integrations, and enterprise-grade features.

## User Choices
- **Authentication**: Clerk (to be integrated)
- **LLM Providers**: OpenAI, Anthropic Claude, Google Gemini (using Emergent LLM Key)
- **Voice**: LiveKit only
- **Integrations**: Real Unified.to integrations
- **Design**: Dark theme with amber/orange accents

## Architecture

### Tech Stack
- **Frontend**: React 18, Tailwind CSS, shadcn/ui, React Flow, Recharts, Zustand
- **Backend**: FastAPI, MongoDB, emergentintegrations
- **Design**: Dark theme (#09090b), Amber accents (#f59e0b), Outfit/Manrope fonts

### Features Implemented (MVP)

#### Dashboard
- Stats cards (Total Agents, Total Calls, Success Rate, Avg Duration)
- Recent agents list
- Quick actions panel

#### Agent Management
- Create agents (Chat/Voice/Multi-modal)
- Agent list with search and filtering
- Agent settings (General, Persona, LLM, Voice, Advanced)
- Agent deployment

#### Flow Builder
- React Flow canvas with drag-and-drop
- Node types: Start, LLM Response, Condition, Action, End
- Node palette sidebar
- Mini map and controls

#### Agent Testing
- Chat playground interface
- Real LLM integration (OpenAI/Claude/Gemini via Emergent key)
- Session management
- Real-time messaging

#### Tools Library
- 9 built-in tools (Book Appointment, Check Availability, Update CRM, etc.)
- Integration categories (CRM, Calendar, HR, ATS, Ticketing, etc.)
- Custom HTTP tool builder
- Unified.to integration support (350+ integrations)

#### Knowledge Base
- Create knowledge bases
- Document upload capability (UI ready)

#### Analytics
- Calls overview chart
- Duration chart
- Success rate metrics
- Create custom insights

#### Settings
- Profile management
- API keys configuration (OpenAI, Anthropic, ElevenLabs, LiveKit)
- Notification preferences
- Billing overview

## API Endpoints

### Agents
- `POST /api/agents` - Create agent
- `GET /api/agents` - List agents
- `GET /api/agents/{id}` - Get agent
- `PUT /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent
- `POST /api/agents/{id}/deploy` - Deploy agent

### Flows
- `POST /api/agents/{id}/flows` - Create flow
- `GET /api/agents/{id}/flows` - List flows
- `PUT /api/agents/{id}/flows/{flowId}` - Update flow

### Tools
- `GET /api/tools` - List custom tools
- `GET /api/tools/builtin` - List built-in tools
- `POST /api/tools` - Create custom tool

### Knowledge Base
- `POST /api/knowledge` - Create knowledge base
- `GET /api/knowledge` - List knowledge bases
- `DELETE /api/knowledge/{id}` - Delete knowledge base

### Chat/LLM
- `POST /api/chat` - Chat with agent using LLM

### Analytics
- `GET /api/analytics/calls` - Get call analytics
- `GET /api/insights` - List insights
- `POST /api/insights` - Create insight

### Integrations
- `GET /api/integrations/categories` - List Unified.to categories

## Next Tasks (Phase 2)

### High Priority
1. **Clerk Authentication Integration** - Add user authentication and protected routes
2. **LiveKit Voice Integration** - Real-time voice agent testing with LiveKit
3. **Document Upload** - Implement file upload for knowledge bases with RAG
4. **Flow Execution** - Execute agent flows based on node configurations

### Medium Priority
5. **Unified.to OAuth** - Real integration connections with OAuth flows
6. **Call Recording** - Store and playback call recordings
7. **SIP Trunk Management** - Phone number provisioning and management
8. **Real Analytics** - Track actual call metrics and transcripts

### Lower Priority
9. **Multi-tenant Support** - Organization and team management
10. **Webhook Integrations** - External event handling
11. **Agent Versioning** - Version control for agent configurations
12. **Export/Import** - Agent configuration backup and restore
