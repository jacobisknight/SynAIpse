# SynapseGrid Design Guidelines

## Design Approach

**System Selected**: Carbon Design System with Linear-inspired modernization

**Rationale**: Enterprise AI orchestration platform requiring data-heavy interfaces, complex workflow visualization, and professional credibility. Carbon's enterprise DNA combined with Linear's refined aesthetics creates the perfect balance for technical users who expect both power and polish.

**Core Principles**:
- Information density without clutter
- Immediate clarity over visual flair
- Purposeful hierarchy in complex interfaces
- Technical precision with human warmth

---

## Typography

**Font Stack**:
- Primary: Inter (via Google Fonts CDN) - UI elements, body text
- Monospace: JetBrains Mono - code snippets, agent IDs, technical data

**Hierarchy**:
- Hero/Page Titles: text-4xl, font-semibold
- Section Headers: text-2xl, font-semibold  
- Card Titles: text-lg, font-medium
- Body Text: text-sm, font-normal
- Labels/Meta: text-xs, font-medium, uppercase tracking-wide
- Data/Metrics: text-3xl, font-bold (dashboard stats)

---

## Layout System

**Spacing Scale**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-6
- Card gaps: gap-6
- Section spacing: space-y-8
- Dashboard grid gaps: gap-4

**Grid Structure**:
- Main dashboard: 12-column grid (grid-cols-12)
- Agent cards: 3-column on desktop (lg:grid-cols-3), 2-column tablet (md:grid-cols-2), single mobile
- Sidebar: Fixed 256px width on desktop, collapsible on mobile
- Content area: max-w-7xl mx-auto for centered layouts

---

## Component Library

### Navigation
**Top Navigation Bar**:
- Full-width sticky header with organization selector, search bar, notification bell, user avatar
- Height: h-16
- Contains: Logo, workspace switcher, global search, quick actions, profile menu

**Sidebar Navigation**:
- Fixed left sidebar (w-64) with collapsible sections
- Icons from Heroicons (outline for inactive, solid for active states)
- Sections: Dashboard, Agents, Workflows, Analytics, Integrations, Settings
- Active state: subtle background fill with border-l accent

### Dashboard Cards
**Stat Cards**:
- Grid layout showing key metrics (Active Agents, Tasks Completed, Success Rate, Avg Response Time)
- Large metric number with trend indicator (↑ 12% vs last week)
- Icon in top-right corner
- Padding: p-6

**Agent Status Cards**:
- Compact cards showing agent name, type badge, status indicator (dot), last activity
- Two-column layout: agent info left, actions right
- Hover: subtle elevation increase

### Workflow Builder
**Canvas Area**:
- Infinite canvas with grid background pattern
- Nodes: Rounded rectangles with icon, title, connection points
- Connections: Curved bezier paths between nodes
- Toolbar: Floating bottom panel with node types to add
- Minimap: Bottom-right corner overview

**Node Design**:
- Border with connection points on all sides
- Icon + title layout
- Status indicator (running/idle/error)
- Size: min-w-48, p-4

### Agent Hierarchy Visualization
**Tree View**:
- Expandable/collapsible tree structure
- Parent agents with nested sub-agents
- Visual connection lines showing delegation
- Compact row height (h-12) with expand/collapse chevron
- Depth indentation: pl-6 per level

### Modals & Overlays
**Agent Creation Modal**:
- Large centered modal (max-w-4xl)
- Multi-step form with progress indicator at top
- Steps: Basic Info → Persona & Voice → Goals & Triggers → Review
- Footer: Cancel, Back, Next/Create buttons

**Drawer Panels**:
- Slide-out right panel for agent details (w-96)
- Contains: Agent overview, recent activity log, performance metrics, configuration
- Close button in top-right

### Forms & Inputs
**Input Fields**:
- Standard height: h-10
- Border with focus ring
- Label above, helper text below
- Placeholder text for context

**Select Dropdowns**:
- Custom styled with Heroicons chevron
- Max height with scroll for long lists
- Search functionality for integration selectors

**Toggle Switches**:
- Agent enable/disable, feature flags
- Label on left, switch on right

### Data Tables
**Agent List Table**:
- Sticky header row
- Columns: Name, Type, Status, Tasks, Success Rate, Actions
- Row height: h-14
- Striped rows for readability (odd/even)
- Action menu (three dots) in last column

**Sortable Headers**:
- Click to sort with directional icon
- Active column highlighted

### Status Indicators
**Agent Status Badges**:
- Small pill badges (px-2.5 py-0.5, text-xs, rounded-full)
- Types: Active (green), Idle (gray), Processing (blue), Error (red)
- Dot indicator + text label

**Health Indicators**:
- Traffic light system for system health
- Large dot (w-3 h-3) with pulsing animation for active states

### Monitoring Dashboard
**Real-time Activity Feed**:
- Scrollable list of recent agent actions
- Each item: timestamp, agent name, action description, result
- Auto-refreshing with subtle animation on new items

**Performance Charts**:
- Line charts for metrics over time
- Bar charts for task distribution across agents
- Donut chart for success/failure rates
- Library: Chart.js or Recharts

---

## Animations

**Purposeful Motion Only**:
- Page transitions: None (instant)
- Modal entrance: Fade in with slight scale (duration-200)
- Drawer slide: Slide from edge (duration-300)
- Loading states: Subtle pulse on skeleton screens
- Live data updates: Smooth number count-up (duration-500)
- Node connections: Animated draw on creation (duration-400)

**Hover States**:
- Cards: Subtle shadow increase (transition-shadow duration-200)
- Buttons: Background darkening (transition-colors duration-150)
- No complex animations on data-heavy components

---

## Icons

**Library**: Heroicons (outline for most UI, solid for active/selected states)

**Usage**:
- Navigation items: 20x20px
- Card headers: 24x24px  
- Agent type indicators: 16x16px
- Action buttons: 16x16px
- Large feature illustrations: 48x48px

**Key Icons**:
- Dashboard: chart-bar
- Agents: cpu-chip
- Workflows: arrows-right-left
- Voice: microphone
- Data: database
- Settings: cog-6-tooth
- Add: plus-circle
- Hierarchy: arrows-pointing-out

---

## Images

**Hero Section** (Marketing/Landing - if created separately):
- Large abstract visualization of connected nodes/network
- Represents AI agent orchestration concept
- Gradient overlay for text readability
- Full viewport height hero with centered content

**Dashboard** (Main App):
- No hero image - functional dashboard layout
- Optional: Empty state illustrations when no agents exist
- Agent avatars: Generated gradients or initials for personalization

**Agent Cards**:
- Small icon representing agent type (voice/workflow/data)
- No decorative images - focus on data and status

---

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px - Single column, hidden sidebar (hamburger menu)
- Tablet: 768px - 1024px - Two columns, collapsible sidebar
- Desktop: > 1024px - Full layout with fixed sidebar

**Mobile Adaptations**:
- Sidebar becomes bottom sheet or drawer
- Workflow builder switches to list view
- Tables become cards
- Multi-column grids become single column

---

## Enterprise-Specific Patterns

**Multi-tenancy UI**:
- Organization switcher in top-left (dropdown with search)
- Workspace indicator always visible
- Team member avatars in top-right

**RBAC Indicators**:
- Disabled states for actions user lacks permission for
- Subtle lock icon on restricted features
- Clear messaging: "Contact admin to enable"

**Audit Trail**:
- Expandable "History" section showing all changes
- Timestamp, user, action, before/after states

**Empty States**:
- Large centered icon + heading + description + primary CTA
- Example: "No agents yet. Create your first autonomous agent to get started."

---

This design system prioritizes clarity, efficiency, and scalability for complex enterprise workflows while maintaining a modern, refined aesthetic that technical users will appreciate.