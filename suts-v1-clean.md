# SYNTHETIC USER TESTING SYSTEM (SUTS)

## Product Specification Document v1.0

---

## EXECUTIVE SUMMARY

**What:** A modular, open-source system that simulates 1000+ realistic user behaviors using LLMs to validate product decisions before shipping to real users.

**Why:** Traditional user testing is slow, expensive, and limited. SUTS enables continuous validation, predictive analytics, and causal inference at scale.

**Impact:**

- Test product changes before deployment (shift-left validation)
- Predict user behavior with 85%+ accuracy after calibration
- Identify friction, value moments, and viral triggers systematically
- Reduce real user churn by fixing issues before they experience them

**Philosophy:** Antifragile (improves from errors), Modular (swap components), Scalable (10 to 10,000 users), Reusable (any product/domain), Open-Source (community-driven)

**Note:** This is the V1.0 specification. For V2.0 enhancements (Memory-Enabled Agents, Real User Feedback Loops, Self-Learning), see `suts-v2-enhancements.md`.

---

## TABLE OF CONTENTS

1. [System Architecture](#system-architecture)
2. [Core Components](#core-components)
3. [Data Models](#data-models)
4. [Technology Stack](#technology-stack)
5. [Implementation Guide](#implementation-guide)
6. [API Specifications](#api-specifications)
7. [Testing & Validation](#testing--validation)
8. [Deployment & Operations](#deployment--operations)
9. [Extensibility & Plugins](#extensibility--plugins)
10. [Best Practices](#best-practices)
11. [Appendices](#appendices)

---

## SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUTS CONTROL PLANE                           │
│  (Orchestration, Configuration, Monitoring, Results)            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  PERSONA       │  │  SIMULATION     │  │   ANALYSIS      │
│  GENERATOR     │  │  ENGINE         │  │   ENGINE        │
│                │  │                 │  │                 │
│ • LLM-based    │  │ • Multi-agent   │  │ • Pattern       │
│ • Template     │  │ • State machine │  │   detection     │
│ • Learning     │  │ • Event-driven  │  │ • Causal        │
└────────────────┘  └─────────────────┘  └─────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  TELEMETRY     │  │  NETWORK        │  │  DECISION       │
│  LAYER         │  │  SIMULATOR      │  │  SYSTEM         │
│                │  │                 │  │                 │
│ • Event log    │  │ • Viral spread  │  │ • Prioritizer   │
│ • Metrics      │  │ • Referrals     │  │ • Predictor     │
│ • State track  │  │ • K-factor      │  │ • Recommender   │
└────────────────┘  └─────────────────┘  └─────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  DATA LAYER       │
                    │                   │
                    │ • Time-series DB  │
                    │ • Graph DB        │
                    │ • Vector DB       │
                    │ • State store     │
                    └───────────────────┘
```

### Architectural Principles

**1. Modularity**

- Each component is independently deployable
- Well-defined interfaces (APIs, events, data contracts)
- Swap implementations without breaking system

**2. Antifragility**

- Learns from failures (errors improve persona models)
- Graceful degradation (components fail independently)
- Self-healing (auto-retry, circuit breakers, fallbacks)

**3. Scalability**

- Horizontal scaling (add more simulation workers)
- Vertical scaling (more powerful LLM models)
- Time scaling (compress/expand simulation duration)

**4. Observability**

- Every action logged with context
- Distributed tracing across components
- Real-time monitoring dashboards

**5. Reproducibility**

- Deterministic simulations (seed-based randomness)
- Version-controlled personas and scenarios
- Audit trail for all decisions

---

## CORE COMPONENTS

### 1. PERSONA GENERATOR

**Purpose:** Create realistic, diverse user personas that act as autonomous agents

**Inputs:**

- Stakeholder analysis documents
- Real user data (if available)
- Market research
- Persona templates

**Outputs:**

- Structured persona profiles
- Behavioral models
- Decision-making logic

**Implementation:**

```python
# File: persona_generator.py
# Dependencies: anthropic, pydantic, jinja2

from anthropic import Anthropic
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import json

class PersonaProfile(BaseModel):
    """Structured persona data model"""
    id: str = Field(description="Unique persona identifier")
    archetype: str = Field(description="High-level archetype (e.g., 'Skeptical Developer')")

    # Demographics & Context
    role: str = Field(description="Job role/title")
    experience_level: str = Field(description="Novice/Intermediate/Expert")
    company_size: str = Field(description="Startup/SMB/Enterprise")
    tech_stack: List[str] = Field(description="Technologies they use")

    # Psychological Profile
    pain_points: List[str] = Field(description="Current frustrations")
    goals: List[str] = Field(description="What they want to achieve")
    fears: List[str] = Field(description="What they're worried about")
    values: List[str] = Field(description="What they care about")

    # Behavioral Traits
    risk_tolerance: float = Field(ge=0, le=1, description="0=risk-averse, 1=risk-seeking")
    patience_level: float = Field(ge=0, le=1, description="0=impatient, 1=very patient")
    tech_adoption: str = Field(description="Early adopter/Majority/Laggard")
    learning_style: str = Field(description="Trial-error/Documentation/Video/Peer")

    # Decision-Making
    evaluation_criteria: List[str] = Field(description="What they evaluate products on")
    deal_breakers: List[str] = Field(description="Absolute nos")
    delight_triggers: List[str] = Field(description="What makes them love a product")
    referral_triggers: List[str] = Field(description="What makes them tell others")

    # Usage Patterns
    typical_workflow: str = Field(description="How they work day-to-day")
    time_availability: str = Field(description="How much time for new tools")
    collaboration_style: str = Field(description="Solo/Team/Community-driven")

    # Memory & State
    state: Dict = Field(default_factory=dict, description="Current state in simulation")
    history: List[Dict] = Field(default_factory=list, description="Action history")

    # Metadata
    confidence_score: float = Field(default=0.5, description="How well-calibrated this persona is")
    last_updated: str = Field(description="ISO timestamp")
    source: str = Field(description="How this persona was created")


class PersonaGenerator:
    """Generate personas using LLM-based synthesis"""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.client = Anthropic(api_key=api_key)
        self.model = model

    def generate_from_stakeholder_analysis(
        self,
        analysis_docs: List[str],
        num_personas: int = 30,
        diversity_weight: float = 0.8
    ) -> List[PersonaProfile]:
        """
        Generate diverse personas from stakeholder analysis documents

        Args:
            analysis_docs: List of file paths or text content
            num_personas: How many personas to generate
            diversity_weight: 0-1, higher = more diverse set

        Returns:
            List of PersonaProfile objects
        """

        # Read and consolidate analysis documents
        consolidated_insights = self._consolidate_insights(analysis_docs)

        # Generate persona distribution strategy
        distribution = self._generate_distribution_strategy(
            consolidated_insights,
            num_personas,
            diversity_weight
        )

        # Generate individual personas
        personas = []
        for archetype_spec in distribution:
            persona = self._generate_single_persona(
                archetype_spec,
                consolidated_insights
            )
            personas.append(persona)

        # Validate diversity and coverage
        personas = self._ensure_diversity(personas, diversity_weight)

        return personas

    def _consolidate_insights(self, analysis_docs: List[str]) -> str:
        """Consolidate multiple analysis documents into synthesis"""

        docs_content = []
        for doc_path in analysis_docs:
            with open(doc_path, 'r') as f:
                docs_content.append(f.read())

        prompt = f"""
        You are synthesizing user research to inform persona creation.

        Read these stakeholder analysis documents:

        {chr(10).join(f"<document>{doc}</document>" for doc in docs_content)}

        Create a synthesis document containing:

        1. USER ARCHETYPES IDENTIFIED
        - List distinct user types mentioned
        - Key characteristics of each
        - Frequency/importance in market

        2. PAIN POINTS & NEEDS (by archetype)
        - What frustrates them
        - What they're trying to achieve
        - Current alternatives they use

        3. BEHAVIORAL PATTERNS
        - How they evaluate new tools
        - What makes them adopt vs reject
        - What makes them refer others

        4. DIVERSITY DIMENSIONS
        - Technical sophistication
        - Company context
        - Risk tolerance
        - Time constraints

        5. EDGE CASES & OUTLIERS
        - Unusual user types to include
        - Underserved segments

        Be specific and evidence-based. Quote relevant insights.
        """

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def _generate_distribution_strategy(
        self,
        insights: str,
        num_personas: int,
        diversity_weight: float
    ) -> List[Dict]:
        """Determine how many personas of each archetype to create"""

        prompt = f"""
        Based on this user research synthesis:

        {insights}

        Create a distribution strategy for {num_personas} personas.

        Diversity weight: {diversity_weight} (0=realistic distribution, 1=force diversity)

        For each archetype:
        - Archetype name
        - Number of personas to create (totaling {num_personas})
        - Key differentiators within archetype (to ensure variety)
        - Rationale for quantity

        Output ONLY valid JSON:
        {{
          "distribution": [
            {{
              "archetype": "Skeptical Senior Developer",
              "count": 8,
              "variations": ["Burned by AI tools", "Security-focused", "Performance-obsessed"],
              "rationale": "High frequency in market, high influence"
            }}
          ]
        }}
        """

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse JSON response
        result = json.loads(response.content[0].text)
        return result['distribution']

    def _generate_single_persona(
        self,
        archetype_spec: Dict,
        insights: str
    ) -> PersonaProfile:
        """Generate a single detailed persona"""

        prompt = f"""
        Create a detailed, realistic persona based on:

        ARCHETYPE: {archetype_spec['archetype']}
        VARIATION: {archetype_spec.get('variation', 'Standard')}

        RESEARCH CONTEXT:
        {insights}

        Generate a complete persona profile in this EXACT JSON structure:
        {{
          "id": "unique-slug",
          "archetype": "{archetype_spec['archetype']}",
          "role": "specific job title",
          "experience_level": "Novice|Intermediate|Expert",
          "company_size": "Startup|SMB|Enterprise",
          "tech_stack": ["Python", "Docker", "..."],

          "pain_points": ["specific frustration 1", "..."],
          "goals": ["specific goal 1", "..."],
          "fears": ["specific fear 1", "..."],
          "values": ["what they care about", "..."],

          "risk_tolerance": 0.0-1.0,
          "patience_level": 0.0-1.0,
          "tech_adoption": "Early adopter|Early majority|Late majority|Laggard",
          "learning_style": "Trial-error|Documentation|Video|Peer learning",

          "evaluation_criteria": ["criterion 1", "..."],
          "deal_breakers": ["absolute no 1", "..."],
          "delight_triggers": ["what makes them love it", "..."],
          "referral_triggers": ["what makes them tell others", "..."],

          "typical_workflow": "detailed description of their day",
          "time_availability": "description of time constraints",
          "collaboration_style": "Solo|Team|Community-driven",

          "state": {{}},
          "history": [],
          "confidence_score": 0.5,
          "last_updated": "{json.dumps(datetime.now().isoformat())}",
          "source": "stakeholder_analysis"
        }}

        Make this persona:
        - Realistic and specific (not generic)
        - Grounded in research insights
        - Internally consistent (traits should align)
        - Actionable (clear decision-making logic)

        Output ONLY the JSON, no other text.
        """

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse and validate
        persona_data = json.loads(response.content[0].text)
        persona = PersonaProfile(**persona_data)

        return persona

    def _ensure_diversity(
        self,
        personas: List[PersonaProfile],
        diversity_weight: float
    ) -> List[PersonaProfile]:
        """
        Check persona set for diversity and add/modify if needed

        Dimensions to check:
        - Risk tolerance distribution
        - Experience level distribution
        - Company size distribution
        - Tech adoption distribution
        """

        # TODO: Implement diversity checking and adjustment
        # For now, return as-is
        return personas

    def save_personas(self, personas: List[PersonaProfile], output_path: str):
        """Save personas to JSON file"""
        personas_data = [p.model_dump() for p in personas]
        with open(output_path, 'w') as f:
            json.dump(personas_data, f, indent=2)

    def load_personas(self, input_path: str) -> List[PersonaProfile]:
        """Load personas from JSON file"""
        with open(input_path, 'r') as f:
            personas_data = json.load(f)
        return [PersonaProfile(**p) for p in personas_data]


# Utility: Create personas from existing analysis
if __name__ == "__main__":
    import os

    # Initialize generator
    generator = PersonaGenerator(api_key=os.getenv("ANTHROPIC_API_KEY"))

    # Generate from analysis documents
    personas = generator.generate_from_stakeholder_analysis(
        analysis_docs=[
            "round-1-insights/insights-pm.md",
            "round-1-insights/insights-virality.md",
            "round-1-insights/insights-skeptic.md",
            # ... all analysis files
        ],
        num_personas=30,
        diversity_weight=0.8
    )

    # Save for use in simulations
    generator.save_personas(personas, "personas/generated_personas.json")
    print(f"Generated {len(personas)} personas")
```

**Best Practices:**

1. **Diversity by Design**: Explicitly optimize for persona diversity across multiple dimensions
2. **Evidence-Based**: Ground personas in actual user research, not assumptions
3. **Versioning**: Track persona evolution over time as you learn from real users
4. **Calibration**: Update confidence scores as simulations validate/invalidate persona behaviors

---

### 2. MEMORY-ENABLED AGENT SYSTEM (V2.0)

**Purpose:** Create agents with persistent memory that learn across sessions and simulate realistic long-term user behavior

**Key Capabilities:**

- **Episodic Memory**: Remember specific past experiences ("Last time I clicked X, Y happened")
- **Semantic Memory**: Build general knowledge ("I prefer keyboard shortcuts over UI")
- **Cross-Session Learning**: Context carries over between sessions
- **Social Memory**: Remember interactions with other users/agents
- **Emotional Memory**: Track how past experiences shaped current emotional state

**Implementation using LangGraph + LangMem:**

```python
# File: memory_agent_system.py
# Dependencies: langgraph, langchain, anthropic, redis, qdrant-client

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_anthropic import ChatAnthropic
from langmem import Client as LangMemClient
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, TypedDict, Annotated
import operator
import json
import uuid
from datetime import datetime

# State definition for agent
class AgentState(TypedDict):
    """State that persists across agent invocations"""
    persona_id: str
    session_number: int
    messages: Annotated[List, operator.add]  # Conversation history
    current_context: Dict  # Current product state
    emotional_state: Dict  # Current emotions
    goals: List[str]  # Current goals
    memories_retrieved: List[Dict]  # Relevant memories for this session
    action_taken: Optional[str]
    reasoning: Optional[str]
    next_action: Optional[str]


class MemoryEnabledAgent:
    """Agent with persistent memory using LangGraph + LangMem"""

    def __init__(
        self,
        persona: 'PersonaProfile',
        anthropic_api_key: str,
        langmem_api_key: str,
        qdrant_url: str = "http://localhost:6333",
        checkpoint_db: str = "checkpoints.db"
    ):
        self.persona = persona

        # LLM for decision-making
        self.llm = ChatAnthropic(
            api_key=anthropic_api_key,
            model="claude-sonnet-4-20250514"
        )

        # LangMem for long-term memory
        self.langmem = LangMemClient(api_key=langmem_api_key)
        self.memory_thread_id = f"persona_{persona.id}"

        # Vector DB for semantic memory search
        self.qdrant = QdrantClient(url=qdrant_url)
        self._ensure_collection()

        # Checkpointer for state persistence
        self.checkpointer = SqliteSaver.from_conn_string(checkpoint_db)

        # Build agent graph
        self.graph = self._build_agent_graph()

    def _ensure_collection(self):
        """Ensure Qdrant collection exists for this persona"""
        collection_name = f"persona_{self.persona.id}_memories"

        try:
            self.qdrant.get_collection(collection_name)
        except:
            self.qdrant.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
            )

        self.collection_name = collection_name

    def _build_agent_graph(self) -> StateGraph:
        """Build LangGraph workflow for agent decision-making"""

        workflow = StateGraph(AgentState)

        # Define nodes
        workflow.add_node("retrieve_memories", self._retrieve_memories)
        workflow.add_node("decide_action", self._decide_action)
        workflow.add_node("execute_action", self._execute_action)
        workflow.add_node("update_emotional_state", self._update_emotional_state)
        workflow.add_node("store_memory", self._store_memory)

        # Define edges
        workflow.set_entry_point("retrieve_memories")
        workflow.add_edge("retrieve_memories", "decide_action")
        workflow.add_edge("decide_action", "execute_action")
        workflow.add_edge("execute_action", "update_emotional_state")
        workflow.add_edge("update_emotional_state", "store_memory")
        workflow.add_edge("store_memory", END)

        return workflow.compile(checkpointer=self.checkpointer)

    async def _retrieve_memories(self, state: AgentState) -> AgentState:
        """Retrieve relevant memories for current context"""

        # Build query from current context
        context_query = self._context_to_query(state["current_context"])

        # Retrieve from LangMem (managed long-term memory)
        langmem_memories = self.langmem.search(
            thread_id=self.memory_thread_id,
            query=context_query,
            limit=5
        )

        # Retrieve from Qdrant (semantic search)
        query_embedding = self._get_embedding(context_query)
        qdrant_memories = self.qdrant.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=5
        )

        # Combine and format memories
        memories = []

        # LangMem memories (structured)
        for mem in langmem_memories:
            memories.append({
                "type": "episodic",
                "content": mem.content,
                "timestamp": mem.created_at,
                "relevance": mem.score
            })

        # Qdrant memories (vector search)
        for mem in qdrant_memories:
            memories.append({
                "type": "semantic",
                "content": mem.payload.get("content"),
                "timestamp": mem.payload.get("timestamp"),
                "relevance": mem.score
            })

        state["memories_retrieved"] = memories
        return state

    async def _decide_action(self, state: AgentState) -> AgentState:
        """Decide what action to take based on persona, context, and memories"""

        # Build decision prompt with persona characteristics and memories
        system_prompt = self._build_system_prompt_with_memory()

        memories_text = "\n".join([
            f"- [{m['type']}] {m['content']} (relevance: {m['relevance']:.2f})"
            for m in state["memories_retrieved"]
        ])

        user_prompt = f"""
CURRENT SESSION: Day {state['session_number']}

CURRENT CONTEXT:
{json.dumps(state['current_context'], indent=2)}

YOUR RELEVANT MEMORIES:
{memories_text}

YOUR CURRENT EMOTIONAL STATE:
{json.dumps(state['emotional_state'], indent=2)}

YOUR CURRENT GOALS:
{json.dumps(state['goals'], indent=2)}

---

Based on your personality, past experiences (memories), current emotions, and goals:

What do you do next?

Respond in this format:
ACTION: [specific action]
REASONING: [why, considering your memories and personality]
EMOTIONAL_IMPACT: [how this affects your frustration/confidence/delight/confusion]
THOUGHTS: [internal monologue referencing past experiences if relevant]
"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]

        response = await self.llm.ainvoke(messages)

        # Parse response
        action, reasoning, emotional_impact = self._parse_decision_response(
            response.content
        )

        state["action_taken"] = action
        state["reasoning"] = reasoning
        state["messages"].extend([
            HumanMessage(content=user_prompt),
            AIMessage(content=response.content)
        ])

        return state

    async def _execute_action(self, state: AgentState) -> AgentState:
        """Execute the chosen action and get product response"""

        # This would integrate with actual product or simulation
        # For now, simulate response
        product_response = self._simulate_product_response(
            state["action_taken"],
            state["current_context"]
        )

        state["current_context"]["last_action_result"] = product_response

        return state

    async def _update_emotional_state(self, state: AgentState) -> AgentState:
        """Update emotional state based on action outcome"""

        # Use LLM to update emotional state based on outcome
        prompt = f"""
        You just took this action: {state['action_taken']}
        Reasoning: {state['reasoning']}

        Result: {state['current_context']['last_action_result']}

        Previous emotional state: {json.dumps(state['emotional_state'])}

        How do your emotions change? Respond with JSON:
        {{
          "frustration": 0.0-1.0,
          "confidence": 0.0-1.0,
          "delight": 0.0-1.0,
          "confusion": 0.0-1.0,
          "explanation": "why emotions changed"
        }}
        """

        response = await self.llm.ainvoke([HumanMessage(content=prompt)])

        # Parse emotional update
        try:
            new_emotions = json.loads(response.content)
            state["emotional_state"] = {
                k: v for k, v in new_emotions.items()
                if k in ["frustration", "confidence", "delight", "confusion"]
            }
        except:
            pass  # Keep previous emotional state if parsing fails

        return state

    async def _store_memory(self, state: AgentState) -> AgentState:
        """Store this experience in long-term memory"""

        # Create memory of this experience
        memory_content = f"""
        Session {state['session_number']}: I tried to {state['action_taken']}.
        Reasoning: {state['reasoning']}
        Result: {state['current_context']['last_action_result']}
        Emotional impact: Frustration {state['emotional_state']['frustration']:.1f},
        Delight {state['emotional_state']['delight']:.1f}
        """

        # Store in LangMem (managed memory)
        self.langmem.add(
            thread_id=self.memory_thread_id,
            content=memory_content,
            metadata={
                "session_number": state['session_number'],
                "action": state['action_taken'],
                "outcome": state['current_context']['last_action_result'],
                "emotional_state": state['emotional_state']
            }
        )

        # Store in Qdrant (vector search)
        embedding = self._get_embedding(memory_content)
        self.qdrant.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "content": memory_content,
                        "timestamp": datetime.now().isoformat(),
                        "session_number": state['session_number'],
                        "action": state['action_taken'],
                        "emotional_state": state['emotional_state']
                    }
                )
            ]
        )

        return state

    def _build_system_prompt_with_memory(self) -> str:
        """Build system prompt that includes persona and memory context"""

        return f"""
You are simulating a user with persistent memory across sessions.

PERSONA CHARACTERISTICS:
{json.dumps(self.persona.model_dump(), indent=2)}

MEMORY INSTRUCTIONS:
- You remember past experiences and they influence your decisions
- Reference relevant memories when explaining your reasoning
- Your emotional state is influenced by accumulated experiences
- You learn from mistakes and successes
- You build preferences over time based on what works

Be authentic to this persona's traits while incorporating your memories.
"""

    def _context_to_query(self, context: Dict) -> str:
        """Convert context to semantic search query"""
        # Simple implementation - could be more sophisticated
        return f"experiences with {context.get('current_feature', 'product')}"

    def _get_embedding(self, text: str) -> List[float]:
        """Get text embedding for semantic search"""
        # Use OpenAI or Anthropic embeddings
        # For now, placeholder
        import random
        return [random.random() for _ in range(1536)]

    def _parse_decision_response(self, response: str):
        """Parse LLM response into action, reasoning, emotional impact"""
        # Simple parsing - could be more robust
        lines = response.split('\n')
        action = None
        reasoning = None
        emotional_impact = {}

        for line in lines:
            if line.startswith("ACTION:"):
                action = line.replace("ACTION:", "").strip()
            elif line.startswith("REASONING:"):
                reasoning = line.replace("REASONING:", "").strip()

        return action, reasoning, emotional_impact

    def _simulate_product_response(self, action: str, context: Dict) -> str:
        """Simulate product response to action"""
        # Placeholder - would integrate with actual product
        return f"Action '{action}' completed successfully"

    async def simulate_session(
        self,
        session_number: int,
        initial_context: Dict,
        thread_id: Optional[str] = None
    ) -> Dict:
        """Simulate one session with memory persistence"""

        # Initialize or load state
        if thread_id is None:
            thread_id = f"persona_{self.persona.id}_session_{session_number}"

        initial_state = AgentState(
            persona_id=self.persona.id,
            session_number=session_number,
            messages=[],
            current_context=initial_context,
            emotional_state=self.persona.state.get("emotional_baseline", {
                "frustration": 0.3,
                "confidence": 0.5,
                "delight": 0.3,
                "confusion": 0.2
            }),
            goals=self.persona.goals,
            memories_retrieved=[],
            action_taken=None,
            reasoning=None,
            next_action=None
        )

        # Run agent graph
        config = {"configurable": {"thread_id": thread_id}}
        final_state = await self.graph.ainvoke(initial_state, config=config)

        return {
            "action": final_state["action_taken"],
            "reasoning": final_state["reasoning"],
            "emotional_state": final_state["emotional_state"],
            "memories_used": len(final_state["memories_retrieved"]),
            "context": final_state["current_context"]
        }


class CrewAISpecialistTeam:
    """Specialized agent team using CrewAI for deep analysis"""

    def __init__(self, anthropic_api_key: str):
        from crewai import Agent, Task, Crew, Process
        from crewai_tools import SerperDevTool

        self.llm_config = {
            "model": "claude-sonnet-4-20250514",
            "api_key": anthropic_api_key
        }

        # Define specialized agents
        self.ux_analyst = Agent(
            role="UX Friction Analyst",
            goal="Identify usability issues and friction points",
            backstory="Expert in user experience with 10+ years analyzing product usability",
            llm_config=self.llm_config,
            verbose=True
        )

        self.retention_expert = Agent(
            role="Retention Specialist",
            goal="Predict churn risk and identify retention drivers",
            backstory="Data scientist specializing in user retention and churn prediction",
            llm_config=self.llm_config,
            verbose=True
        )

        self.virality_strategist = Agent(
            role="Viral Growth Strategist",
            goal="Identify what makes users share and refer others",
            backstory="Growth hacker who has driven viral loops for 20+ products",
            llm_config=self.llm_config,
            verbose=True
        )

    def analyze_simulation_results(
        self,
        simulation_data: Dict
    ) -> Dict:
        """Use specialist agents to analyze simulation results"""

        from crewai import Task, Crew, Process

        # Define tasks for each specialist
        ux_task = Task(
            description=f"""
            Analyze this simulation data for UX friction points:
            {json.dumps(simulation_data, indent=2)}

            Identify:
            1. Where users get stuck
            2. Confusing interactions
            3. High-effort actions
            4. Recommended fixes (prioritized)
            """,
            agent=self.ux_analyst,
            expected_output="Detailed friction analysis with prioritized recommendations"
        )

        retention_task = Task(
            description=f"""
            Analyze this simulation data for retention patterns:
            {json.dumps(simulation_data, indent=2)}

            Identify:
            1. Churn risk moments
            2. Sticky features
            3. Retention drivers
            4. Intervention opportunities
            """,
            agent=self.retention_expert,
            expected_output="Retention analysis with churn prediction model"
        )

        virality_task = Task(
            description=f"""
            Analyze this simulation data for viral potential:
            {json.dumps(simulation_data, indent=2)}

            Identify:
            1. Referral triggers
            2. Shareable moments
            3. Network effect opportunities
            4. Viral loop design recommendations
            """,
            agent=self.virality_strategist,
            expected_output="Viral growth strategy with K-factor predictions"
        )

        # Create crew
        crew = Crew(
            agents=[self.ux_analyst, self.retention_expert, self.virality_strategist],
            tasks=[ux_task, retention_task, virality_task],
            process=Process.parallel,
            verbose=2
        )

        # Execute analysis
        result = crew.kickoff()

        return {
            "ux_analysis": result.tasks_output[0],
            "retention_analysis": result.tasks_output[1],
            "virality_analysis": result.tasks_output[2],
            "synthesis": result.raw
        }


# Example: Using memory-enabled agents
if __name__ == "__main__":
    import os
    import asyncio
    from persona_generator import PersonaGenerator

    # Load persona
    generator = PersonaGenerator(api_key=os.getenv("ANTHROPIC_API_KEY"))
    personas = generator.load_personas("personas/generated_personas.json")
    persona = personas[0]

    # Create memory-enabled agent
    agent = MemoryEnabledAgent(
        persona=persona,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        langmem_api_key=os.getenv("LANGMEM_API_KEY"),
        qdrant_url="http://localhost:6333"
    )

    # Simulate multi-day journey with persistent memory
    for day in range(1, 8):
        context = {
            "day": day,
            "product_version": "1.0.0",
            "features_available": ["code_analysis", "token_optimization"]
        }

        result = asyncio.run(agent.simulate_session(day, context))
        print(f"\nDay {day}:")
        print(f"Action: {result['action']}")
        print(f"Reasoning: {result['reasoning']}")
        print(f"Emotions: {result['emotional_state']}")
        print(f"Memories used: {result['memories_used']}")
```

**Key Benefits of Memory-Enabled Agents:**

1. **Realistic Behavior**: Agents don't forget past experiences, making behavior more realistic
2. **Learning Curves**: Agents get better at using product over time (or worse if frustrated)
3. **Relationship Building**: Agents remember past support interactions, affecting trust
4. **Habit Formation**: Repeated actions build into habits, affecting retention
5. **Cross-Session Context**: "Last time I tried X..." reasoning creates continuity

**Best Practices:**

1. **Memory Pruning**: Periodically prune low-relevance memories to prevent bloat
2. **Memory Hierarchy**: Recent memories have more weight than old ones
3. **Semantic Clustering**: Group similar memories for efficient retrieval
4. **Memory Confidence**: Track how reliable each memory is (verified vs assumed)
5. **Cross-Agent Learning**: Agents can learn from other agents' memories (social learning)

---

### 3. REAL USER FEEDBACK LOOP (V2.0)

**Purpose:** Execute user journeys with autonomous LLM-based agents acting as personas

**Key Features:**

- Multi-turn conversations simulating days/weeks of usage
- State management (persona memory across sessions)
- Event-driven architecture (actions trigger events)
- Time compression (simulate months in hours)
- Parallel execution (1000 users simultaneously)

**Implementation:**

```python
# File: simulation_engine.py
# Dependencies: anthropic, asyncio, redis, pydantic

import asyncio
from anthropic import Anthropic
from typing import List, Dict, Optional, Callable
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import redis
import json
import uuid

class SimulationEvent(BaseModel):
    """Individual event in user journey"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    persona_id: str
    timestamp: datetime
    event_type: str  # "action", "observation", "decision", "emotion"
    action: Optional[str] = None  # What user did
    context: Dict = Field(default_factory=dict)  # Product state at time
    reasoning: Optional[str] = None  # Why user did this
    emotional_state: Optional[Dict] = None  # Frustration, delight, etc.
    metadata: Dict = Field(default_factory=dict)


class SimulationSession(BaseModel):
    """A single user's simulation session (e.g., one day of usage)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    persona_id: str
    session_number: int  # Day 1, Day 2, etc.
    start_time: datetime
    end_time: Optional[datetime] = None
    events: List[SimulationEvent] = Field(default_factory=list)
    outcome: Optional[str] = None  # "continued", "churned", "referred"
    summary: Optional[str] = None


class ProductState(BaseModel):
    """Represents current state of product being tested"""
    features: Dict[str, bool] = Field(default_factory=dict)  # Feature flags
    ui_elements: Dict[str, Dict] = Field(default_factory=dict)  # UI state
    data: Dict = Field(default_factory=dict)  # User data accumulated
    version: str = "1.0.0"

    def to_description(self) -> str:
        """Convert product state to natural language for LLM"""
        # TODO: Template-based description generation
        return json.dumps(self.model_dump(), indent=2)


class SimulationEngine:
    """Execute user journey simulations with LLM-based agents"""

    def __init__(
        self,
        api_key: str,
        redis_url: str = "redis://localhost:6379",
        model: str = "claude-sonnet-4-20250514"
    ):
        self.client = Anthropic(api_key=api_key)
        self.model = model
        self.redis_client = redis.from_url(redis_url)

        # Event handlers (extensible)
        self.event_handlers: Dict[str, List[Callable]] = {}

    async def simulate_user_journey(
        self,
        persona: 'PersonaProfile',
        product_state: ProductState,
        num_sessions: int = 30,  # 30 days
        time_compression: int = 1  # 1 = real-time, 10 = 10x faster
    ) -> List[SimulationSession]:
        """
        Simulate a user's journey over multiple sessions

        Args:
            persona: The user persona to simulate
            product_state: Current state of product
            num_sessions: Number of usage sessions (days)
            time_compression: Speed up factor

        Returns:
            List of simulation sessions with outcomes
        """

        sessions = []
        current_persona_state = persona.state.copy()

        for session_num in range(1, num_sessions + 1):
            # Determine if user continues based on previous sessions
            if session_num > 1:
                should_continue = await self._check_retention(
                    persona,
                    sessions,
                    product_state
                )
                if not should_continue:
                    break

            # Run single session
            session = await self._simulate_single_session(
                persona,
                product_state,
                session_num,
                current_persona_state
            )

            sessions.append(session)

            # Update persona state based on session
            current_persona_state = self._update_persona_state(
                current_persona_state,
                session
            )

            # Check for referral event
            if self._check_referral_trigger(persona, session):
                await self._emit_event("referral", {
                    "persona_id": persona.id,
                    "session_number": session_num,
                    "trigger": "found value"
                })

        return sessions

    async def _simulate_single_session(
        self,
        persona: 'PersonaProfile',
        product_state: ProductState,
        session_num: int,
        persona_state: Dict
    ) -> SimulationSession:
        """Simulate a single usage session (e.g., one day)"""

        session = SimulationSession(
            persona_id=persona.id,
            session_number=session_num,
            start_time=datetime.now()
        )

        # Build context for LLM
        context = self._build_session_context(
            persona,
            product_state,
            session_num,
            persona_state
        )

        # Multi-turn conversation simulating session
        conversation_history = []

        # Initial prompt: Set up scenario
        system_prompt = self._create_system_prompt(persona)
        user_prompt = self._create_session_prompt(context, session_num)

        conversation_history.append({"role": "user", "content": user_prompt})

        # Simulate session as multi-turn dialogue
        for turn in range(10):  # Max 10 actions per session
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                system=system_prompt,
                messages=conversation_history
            )

            assistant_message = response.content[0].text
            conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })

            # Parse action from response
            event = self._parse_action_from_response(
                assistant_message,
                persona.id,
                product_state
            )
            session.events.append(event)

            # Emit event to handlers
            await self._emit_event("action", event.model_dump())

            # Check if session should end
            if self._should_end_session(event, session):
                break

            # Continue conversation: Product response to action
            product_response = self._simulate_product_response(event, product_state)
            conversation_history.append({
                "role": "user",
                "content": product_response
            })

        # Summarize session
        session.end_time = datetime.now()
        session.summary = await self._summarize_session(persona, session)
        session.outcome = self._determine_session_outcome(session)

        return session

    def _create_system_prompt(self, persona: 'PersonaProfile') -> str:
        """Create system prompt that embeds persona characteristics"""

        return f"""
You are simulating a user with the following characteristics:

ROLE: {persona.role} ({persona.experience_level})
COMPANY: {persona.company_size}
TECH STACK: {', '.join(persona.tech_stack)}

PSYCHOLOGY:
- Pain points: {', '.join(persona.pain_points)}
- Goals: {', '.join(persona.goals)}
- Fears: {', '.join(persona.fears)}
- Values: {', '.join(persona.values)}

BEHAVIOR:
- Risk tolerance: {persona.risk_tolerance}/1.0
- Patience level: {persona.patience_level}/1.0
- Tech adoption: {persona.tech_adoption}
- Learning style: {persona.learning_style}

DECISION-MAKING:
- Evaluates products on: {', '.join(persona.evaluation_criteria)}
- Deal breakers: {', '.join(persona.deal_breakers)}
- Delighted by: {', '.join(persona.delight_triggers)}
- Refers others when: {', '.join(persona.referral_triggers)}

WORKFLOW:
{persona.typical_workflow}

---

SIMULATION INSTRUCTIONS:

You are this person interacting with a product. For each turn:

1. Describe what you DO (specific action)
2. Explain WHY you did it (reasoning)
3. Report emotional state (0-10 scale):
   - Frustration level
   - Confidence level
   - Delight level
   - Confusion level

Be realistic. Act exactly as this persona would:
- If impatient (low patience_level), give up quickly on friction
- If risk-averse (low risk_tolerance), be skeptical and cautious
- Follow your learning_style (don't read docs if you prefer trial-error)
- React authentically based on your pain_points and goals

Format your response as:

ACTION: [what you do]
REASONING: [why you do it]
EMOTIONAL_STATE:
- Frustration: X/10
- Confidence: X/10
- Delight: X/10
- Confusion: X/10
THOUGHTS: [internal monologue]
"""

    def _create_session_prompt(
        self,
        context: Dict,
        session_num: int
    ) -> str:
        """Create prompt for a specific session"""

        if session_num == 1:
            scenario = "This is your FIRST TIME using this product."
        elif session_num <= 7:
            scenario = f"This is DAY {session_num} of using this product."
        elif session_num <= 30:
            scenario = f"You've been using this product for {session_num} days."
        else:
            scenario = f"You're a long-term user ({session_num} days)."

        return f"""
{scenario}

PRODUCT STATE:
{context['product_description']}

YOUR CURRENT STATE:
{json.dumps(context['persona_state'], indent=2)}

PREVIOUS EXPERIENCE:
{context.get('previous_summary', 'None - this is your first session')}

---

What do you do? Remember to stay in character and respond authentically based on your personality traits, current emotional state, and goals.
"""

    def _build_session_context(
        self,
        persona: 'PersonaProfile',
        product_state: ProductState,
        session_num: int,
        persona_state: Dict
    ) -> Dict:
        """Build context dictionary for session"""

        return {
            "persona_id": persona.id,
            "archetype": persona.archetype,
            "session_num": session_num,
            "product_description": product_state.to_description(),
            "persona_state": persona_state,
            "previous_summary": persona_state.get("last_session_summary", "")
        }

    def _parse_action_from_response(
        self,
        response: str,
        persona_id: str,
        product_state: ProductState
    ) -> SimulationEvent:
        """Parse LLM response into structured event"""

        # Simple parsing (could be made more robust)
        lines = response.split('\n')

        action = None
        reasoning = None
        emotional_state = {}

        for line in lines:
            if line.startswith("ACTION:"):
                action = line.replace("ACTION:", "").strip()
            elif line.startswith("REASONING:"):
                reasoning = line.replace("REASONING:", "").strip()
            elif "Frustration:" in line:
                emotional_state['frustration'] = self._extract_score(line)
            elif "Confidence:" in line:
                emotional_state['confidence'] = self._extract_score(line)
            elif "Delight:" in line:
                emotional_state['delight'] = self._extract_score(line)
            elif "Confusion:" in line:
                emotional_state['confusion'] = self._extract_score(line)

        return SimulationEvent(
            persona_id=persona_id,
            timestamp=datetime.now(),
            event_type="action",
            action=action,
            context={"product_state": product_state.model_dump()},
            reasoning=reasoning,
            emotional_state=emotional_state
        )

    def _extract_score(self, line: str) -> float:
        """Extract numerical score from line like 'Frustration: 7/10'"""
        import re
        match = re.search(r'(\d+)/10', line)
        if match:
            return float(match.group(1)) / 10.0
        return 0.5

    def _simulate_product_response(
        self,
        event: SimulationEvent,
        product_state: ProductState
    ) -> str:
        """Simulate how product responds to user action"""

        # This would be replaced with actual product interaction
        # For now, simple text-based simulation

        if "install" in event.action.lower():
            return "Extension installed successfully. You see a welcome message and quick start guide."
        elif "click" in event.action.lower():
            return "Action completed. You see updated UI state."
        elif "configure" in event.action.lower():
            return "Settings saved. Extension is now configured."
        else:
            return "Action acknowledged. Product state updated."

    def _should_end_session(
        self,
        event: SimulationEvent,
        session: SimulationSession
    ) -> bool:
        """Determine if session should end"""

        # End conditions
        if event.emotional_state:
            # High frustration = ragequit
            if event.emotional_state.get('frustration', 0) > 0.8:
                return True

            # High delight = satisfied, done for now
            if event.emotional_state.get('delight', 0) > 0.8:
                return True

        # Natural session length
        if len(session.events) >= 10:
            return True

        # Specific actions that end session
        if event.action and "uninstall" in event.action.lower():
            return True

        return False

    async def _check_retention(
        self,
        persona: 'PersonaProfile',
        previous_sessions: List[SimulationSession],
        product_state: ProductState
    ) -> bool:
        """Determine if user returns for another session"""

        # Build retention decision context
        last_session = previous_sessions[-1]

        # Calculate retention probability based on:
        # 1. Emotional trajectory
        avg_frustration = self._calculate_avg_emotion(previous_sessions, 'frustration')
        avg_delight = self._calculate_avg_emotion(previous_sessions, 'delight')

        # 2. Value delivered vs expectations
        # 3. Persona patience level

        # Simple heuristic (could be LLM-based for more nuance)
        retention_score = (
            (1 - avg_frustration) * 0.4 +
            avg_delight * 0.4 +
            persona.patience_level * 0.2
        )

        # Random draw based on retention probability
        import random
        return random.random() < retention_score

    def _calculate_avg_emotion(
        self,
        sessions: List[SimulationSession],
        emotion: str
    ) -> float:
        """Calculate average emotional state across sessions"""

        values = []
        for session in sessions:
            for event in session.events:
                if event.emotional_state and emotion in event.emotional_state:
                    values.append(event.emotional_state[emotion])

        return sum(values) / len(values) if values else 0.5

    def _update_persona_state(
        self,
        state: Dict,
        session: SimulationSession
    ) -> Dict:
        """Update persona state based on session experience"""

        new_state = state.copy()

        # Update based on session
        new_state['last_session_summary'] = session.summary
        new_state['total_sessions'] = new_state.get('total_sessions', 0) + 1

        # Update emotional baseline
        if session.events:
            last_emotions = session.events[-1].emotional_state or {}
            new_state['emotional_baseline'] = last_emotions

        return new_state

    def _check_referral_trigger(
        self,
        persona: 'PersonaProfile',
        session: SimulationSession
    ) -> bool:
        """Check if user would refer others based on session"""

        # Check against persona's referral triggers
        # TODO: More sophisticated trigger detection

        # Simple heuristic: high delight + low frustration
        if session.events:
            avg_delight = sum(
                e.emotional_state.get('delight', 0)
                for e in session.events
                if e.emotional_state
            ) / len(session.events)

            return avg_delight > 0.7

        return False

    def _determine_session_outcome(
        self,
        session: SimulationSession
    ) -> str:
        """Determine session outcome"""

        if not session.events:
            return "no_engagement"

        last_event = session.events[-1]

        if last_event.action and "uninstall" in last_event.action.lower():
            return "churned"
        elif last_event.emotional_state:
            if last_event.emotional_state.get('frustration', 0) > 0.8:
                return "frustrated"
            elif last_event.emotional_state.get('delight', 0) > 0.7:
                return "delighted"

        return "continued"

    async def _summarize_session(
        self,
        persona: 'PersonaProfile',
        session: SimulationSession
    ) -> str:
        """Generate natural language summary of session"""

        events_text = "\n".join([
            f"- {e.action} (Reasoning: {e.reasoning})"
            for e in session.events
        ])

        prompt = f"""
        Summarize this user session in 2-3 sentences:

        PERSONA: {persona.archetype}
        SESSION {session.session_number}

        EVENTS:
        {events_text}

        Focus on: What they tried to do, what worked/didn't work, how they felt.
        """

        response = self.client.messages.create(
            model=self.model,
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    async def _emit_event(self, event_type: str, data: Dict):
        """Emit event to registered handlers"""

        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                await handler(data)

        # Also publish to Redis for other components
        self.redis_client.publish(f"suts:events:{event_type}", json.dumps(data))

    def register_event_handler(
        self,
        event_type: str,
        handler: Callable
    ):
        """Register handler for specific event type"""

        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []

        self.event_handlers[event_type].append(handler)


# Orchestrator: Run many simulations in parallel
class SimulationOrchestrator:
    """Orchestrate parallel execution of multiple user simulations"""

    def __init__(self, engine: SimulationEngine):
        self.engine = engine

    async def run_cohort_simulation(
        self,
        personas: List['PersonaProfile'],
        product_state: ProductState,
        num_sessions: int = 30,
        max_parallel: int = 50
    ) -> Dict:
        """
        Run simulations for cohort of personas in parallel

        Args:
            personas: List of personas to simulate
            product_state: Product state to test
            num_sessions: Number of sessions per user
            max_parallel: Max concurrent simulations

        Returns:
            Aggregated results across cohort
        """

        # Split into batches
        batches = [
            personas[i:i + max_parallel]
            for i in range(0, len(personas), max_parallel)
        ]

        all_results = []

        for batch_num, batch in enumerate(batches):
            print(f"Running batch {batch_num + 1}/{len(batches)}...")

            # Run batch in parallel
            tasks = [
                self.engine.simulate_user_journey(
                    persona,
                    product_state,
                    num_sessions
                )
                for persona in batch
            ]

            batch_results = await asyncio.gather(*tasks)
            all_results.extend(batch_results)

        # Aggregate results
        return self._aggregate_results(all_results, personas)

    def _aggregate_results(
        self,
        all_sessions: List[List[SimulationSession]],
        personas: List['PersonaProfile']
    ) -> Dict:
        """Aggregate simulation results"""

        total_users = len(personas)
        total_sessions = sum(len(sessions) for sessions in all_sessions)

        # Retention analysis
        retention_by_day = {}
        for day in range(1, 31):
            still_active = sum(
                1 for sessions in all_sessions
                if len(sessions) >= day
            )
            retention_by_day[f"day_{day}"] = still_active / total_users

        # Outcome distribution
        outcomes = {}
        for sessions in all_sessions:
            if sessions:
                final_outcome = sessions[-1].outcome
                outcomes[final_outcome] = outcomes.get(final_outcome, 0) + 1

        # Emotional analysis
        avg_emotions = {
            'frustration': [],
            'confidence': [],
            'delight': [],
            'confusion': []
        }

        for sessions in all_sessions:
            for session in sessions:
                for event in session.events:
                    if event.emotional_state:
                        for emotion, value in event.emotional_state.items():
                            if emotion in avg_emotions:
                                avg_emotions[emotion].append(value)

        avg_emotions = {
            k: sum(v) / len(v) if v else 0
            for k, v in avg_emotions.items()
        }

        return {
            "summary": {
                "total_users": total_users,
                "total_sessions": total_sessions,
                "avg_sessions_per_user": total_sessions / total_users
            },
            "retention": retention_by_day,
            "outcomes": outcomes,
            "emotions": avg_emotions
        }


# Example usage
if __name__ == "__main__":
    import os
    from persona_generator import PersonaGenerator

    # Load personas
    generator = PersonaGenerator(api_key=os.getenv("ANTHROPIC_API_KEY"))
    personas = generator.load_personas("personas/generated_personas.json")

    # Define product state
    product = ProductState(
        features={
            "code_analysis": True,
            "token_optimization": True,
            "preventive_warnings": True
        },
        version="1.0.0"
    )

    # Run simulation
    engine = SimulationEngine(api_key=os.getenv("ANTHROPIC_API_KEY"))
    orchestrator = SimulationOrchestrator(engine)

    results = asyncio.run(
        orchestrator.run_cohort_simulation(
            personas=personas[:10],  # Test with 10 users first
            product_state=product,
            num_sessions=30,
            max_parallel=5
        )
    )

    print(json.dumps(results, indent=2))
```

**Best Practices:**

1. **State Management**: Use Redis for distributed state across parallel simulations
2. **Event-Driven**: Emit events for every action so other components can react
3. **Graceful Degradation**: If LLM fails, fall back to simpler behavior models
4. **Reproducibility**: Seed random number generation for deterministic replays
5. **Rate Limiting**: Respect API rate limits with exponential backoff

---

### 3. TELEMETRY LAYER

**Purpose:** Capture every action, emotion, and decision for analysis

**Implementation:**

```python
# File: telemetry.py
# Dependencies: influxdb-client, pydantic

from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class TelemetryCollector:
    """Collect and store telemetry from simulations"""

    def __init__(
        self,
        url: str = "http://localhost:8086",
        token: str = "",
        org: str = "suts",
        bucket: str = "simulations"
    ):
        self.client = InfluxDBClient(url=url, token=token, org=org)
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
        self.bucket = bucket
        self.org = org

    def record_event(
        self,
        persona_id: str,
        event_type: str,
        action: str,
        emotional_state: Dict[str, float],
        metadata: Dict = {}
    ):
        """Record a single event"""

        point = Point("simulation_event") \
            .tag("persona_id", persona_id) \
            .tag("event_type", event_type) \
            .tag("action", action) \
            .field("frustration", emotional_state.get('frustration', 0)) \
            .field("confidence", emotional_state.get('confidence', 0)) \
            .field("delight", emotional_state.get('delight', 0)) \
            .field("confusion", emotional_state.get('confusion', 0))

        # Add metadata as fields
        for key, value in metadata.items():
            if isinstance(value, (int, float)):
                point = point.field(key, value)

        self.write_api.write(bucket=self.bucket, org=self.org, record=point)

    def record_session_outcome(
        self,
        persona_id: str,
        session_num: int,
        outcome: str,
        duration_seconds: float
    ):
        """Record session-level outcome"""

        point = Point("session_outcome") \
            .tag("persona_id", persona_id) \
            .tag("outcome", outcome) \
            .field("session_num", session_num) \
            .field("duration_seconds", duration_seconds)

        self.write_api.write(bucket=self.bucket, org=self.org, record=point)

    def query_emotion_trends(
        self,
        persona_id: Optional[str] = None,
        start: str = "-30d"
    ) -> Dict:
        """Query emotional trends over time"""

        query = f'''
        from(bucket: "{self.bucket}")
          |> range(start: {start})
          |> filter(fn: (r) => r["_measurement"] == "simulation_event")
        '''

        if persona_id:
            query += f'|> filter(fn: (r) => r["persona_id"] == "{persona_id}")'

        query += '''
          |> filter(fn: (r) => r["_field"] =~ /frustration|confidence|delight|confusion/)
          |> aggregateWindow(every: 1d, fn: mean)
        '''

        result = self.client.query_api().query(query, org=self.org)

        # Process results
        # TODO: Format into usable structure
        return result
```

---

### 4. ANALYSIS ENGINE

**Purpose:** Extract insights from simulation data

**Implementation:**

```python
# File: analysis_engine.py
# Dependencies: pandas, numpy, scikit-learn, anthropic

import pandas as pd
import numpy as np
from anthropic import Anthropic
from typing import List, Dict
import json

class AnalysisEngine:
    """Analyze simulation results to extract actionable insights"""

    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"

    def analyze_friction_points(
        self,
        sessions_data: List[Dict]
    ) -> List[Dict]:
        """
        Identify where users get stuck or frustrated

        Returns ranked list of friction points with:
        - What happened
        - How many users affected
        - Average frustration spike
        - Recommended fix
        """

        # Convert to DataFrame for analysis
        df = self._sessions_to_dataframe(sessions_data)

        # Find high-frustration events
        friction_events = df[df['frustration'] > 0.6]

        # Group by action type
        friction_by_action = friction_events.groupby('action').agg({
            'persona_id': 'count',
            'frustration': 'mean',
            'reasoning': lambda x: list(x)
        }).reset_index()

        friction_by_action.columns = ['action', 'affected_users', 'avg_frustration', 'user_reasoning']
        friction_by_action = friction_by_action.sort_values('affected_users', ascending=False)

        # Use LLM to synthesize insights
        insights = []
        for _, row in friction_by_action.head(10).iterrows():
            insight = self._synthesize_friction_insight(row)
            insights.append(insight)

        return insights

    def _synthesize_friction_insight(self, friction_data: pd.Series) -> Dict:
        """Use LLM to generate actionable insight from friction data"""

        prompt = f"""
        Analyze this friction point from user simulations:

        ACTION: {friction_data['action']}
        USERS AFFECTED: {friction_data['affected_users']}
        AVG FRUSTRATION: {friction_data['avg_frustration']}/1.0

        USER REASONING (why they got frustrated):
        {json.dumps(friction_data['user_reasoning'][:5], indent=2)}

        Provide:
        1. ROOT CAUSE: What's actually causing this friction?
        2. IMPACT: Why does this matter for adoption/retention?
        3. RECOMMENDED FIX: Specific, actionable solution
        4. PRIORITY: P0/P1/P2/P3 with rationale

        Output as JSON:
        {{
          "root_cause": "...",
          "impact": "...",
          "recommended_fix": "...",
          "priority": "P0|P1|P2|P3",
          "rationale": "..."
        }}
        """

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )

        insight = json.loads(response.content[0].text)
        insight['action'] = friction_data['action']
        insight['affected_users'] = int(friction_data['affected_users'])
        insight['avg_frustration'] = float(friction_data['avg_frustration'])

        return insight

    def analyze_value_moments(
        self,
        sessions_data: List[Dict]
    ) -> List[Dict]:
        """Identify moments of delight/value"""

        df = self._sessions_to_dataframe(sessions_data)

        # Find high-delight events
        delight_events = df[df['delight'] > 0.7]

        # Group and analyze
        delight_by_action = delight_events.groupby('action').agg({
            'persona_id': 'count',
            'delight': 'mean',
            'reasoning': lambda x: list(x)
        }).reset_index()

        # Synthesize insights
        insights = []
        for _, row in delight_by_action.head(10).iterrows():
            insight = self._synthesize_delight_insight(row)
            insights.append(insight)

        return insights

    def analyze_retention_patterns(
        self,
        sessions_data: List[Dict]
    ) -> Dict:
        """Analyze retention and churn patterns"""

        # Group by persona
        user_journeys = {}
        for session in sessions_data:
            persona_id = session['persona_id']
            if persona_id not in user_journeys:
                user_journeys[persona_id] = []
            user_journeys[persona_id].append(session)

        # Calculate retention metrics
        retention_curve = []
        for day in range(1, 31):
            active = sum(1 for journey in user_journeys.values() if len(journey) >= day)
            retention_curve.append({
                'day': day,
                'retention_rate': active / len(user_journeys),
                'active_users': active
            })

        # Identify churn moments
        churn_analysis = self._analyze_churn_moments(user_journeys)

        return {
            'retention_curve': retention_curve,
            'churn_analysis': churn_analysis
        }

    def _sessions_to_dataframe(self, sessions_data: List[Dict]) -> pd.DataFrame:
        """Convert nested session data to flat DataFrame"""

        rows = []
        for session in sessions_data:
            for event in session.get('events', []):
                row = {
                    'persona_id': session['persona_id'],
                    'session_num': session['session_number'],
                    'action': event.get('action', ''),
                    'reasoning': event.get('reasoning', ''),
                    'frustration': event.get('emotional_state', {}).get('frustration', 0),
                    'confidence': event.get('emotional_state', {}).get('confidence', 0),
                    'delight': event.get('emotional_state', {}).get('delight', 0),
                    'confusion': event.get('emotional_state', {}).get('confusion', 0)
                }
                rows.append(row)

        return pd.DataFrame(rows)

    def generate_executive_summary(
        self,
        all_analyses: Dict
    ) -> str:
        """Generate executive summary of simulation results"""

        prompt = f"""
        Create an executive summary of synthetic user testing results:

        {json.dumps(all_analyses, indent=2)}

        Structure:

        ## KEY FINDINGS
        - Top 3 insights (what matters most)

        ## CRITICAL ISSUES (P0)
        - What will cause users to churn
        - Estimated impact on adoption

        ## OPPORTUNITIES (High ROI)
        - What would delight users
        - What would drive referrals

        ## RECOMMENDED ACTIONS
        - Prioritized list of fixes/enhancements
        - Expected impact for each

        Be specific, quantitative, and actionable.
        """

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text
```

---

## TECHNOLOGY STACK

### Free & Open Source Tools

**1. LLM Inference**

- **Primary**: Anthropic Claude API (pay-per-use, most capable)
- **Alternative**: Ollama + Llama 3 (free, local, less capable)
- **Cost Optimization**: Cache personas, reuse context

**2. State Management**

- **Redis** (BSD license): In-memory state, pub/sub events
- **Alternative**: Valkey (Redis fork, fully open)

**3. Time-Series Database**

- **InfluxDB** (MIT license): Telemetry storage
- **Alternative**: TimescaleDB (PostgreSQL extension)

**4. Graph Database** (for network simulation)

- **Neo4j Community** (GPL): Model referral networks
- **Alternative**: Apache AGE (PostgreSQL extension)

**5. Vector Database** (for persona similarity)

- **Qdrant** (Apache 2.0): Fast, Rust-based
- **Alternative**: Chroma (Apache 2.0)

**6. Workflow Orchestration**

- **Temporal** (MIT): Durable execution, state management
- **Alternative**: Airflow (Apache 2.0)

**7. Analytics & Visualization**

- **Grafana** (AGPL): Dashboards for telemetry
- **Metabase** (AGPL): SQL-based analysis
- **Jupyter** (BSD): Ad-hoc analysis

**8. API Framework**

- **FastAPI** (MIT): REST API for system
- **Alternative**: Flask (BSD)

**9. Message Queue**

- **RabbitMQ** (MPL): Event distribution
- **Alternative**: Apache Kafka

**10. Monitoring**

- **Prometheus** (Apache 2.0): Metrics collection
- **Jaeger** (Apache 2.0): Distributed tracing

---

## DATA MODELS

### Core Schemas

```python
# File: models.py

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

class EmotionalState(BaseModel):
    frustration: float = Field(ge=0, le=1)
    confidence: float = Field(ge=0, le=1)
    delight: float = Field(ge=0, le=1)
    confusion: float = Field(ge=0, le=1)

    def to_summary(self) -> str:
        """Convert to human-readable summary"""
        emotions = []
        if self.frustration > 0.7:
            emotions.append("frustrated")
        if self.confidence > 0.7:
            emotions.append("confident")
        if self.delight > 0.7:
            emotions.append("delighted")
        if self.confusion > 0.7:
            emotions.append("confused")
        return ", ".join(emotions) if emotions else "neutral"


class ActionType(str, Enum):
    INSTALL = "install"
    CONFIGURE = "configure"
    USE_FEATURE = "use_feature"
    READ_DOCS = "read_docs"
    SEEK_HELP = "seek_help"
    CUSTOMIZE = "customize"
    SHARE = "share"
    UNINSTALL = "uninstall"


class SimulationConfig(BaseModel):
    """Configuration for a simulation run"""
    id: str
    name: str
    description: str

    # Personas
    persona_ids: List[str]
    num_personas: int

    # Product state
    product_version: str
    features_enabled: Dict[str, bool]

    # Simulation parameters
    num_sessions: int = 30  # Days to simulate
    time_compression: int = 1  # Speed multiplier
    max_parallel: int = 50  # Concurrent simulations

    # Calibration (if using real user data)
    calibration_data: Optional[Dict] = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    created_by: str = "system"


class SimulationResults(BaseModel):
    """Aggregated results from simulation run"""
    config_id: str

    # Summary stats
    total_users: int
    total_sessions: int
    avg_sessions_per_user: float

    # Retention
    retention_curve: List[Dict]  # [{day: 1, rate: 0.95}, ...]
    median_ltv_days: float

    # Outcomes
    outcome_distribution: Dict[str, int]  # {"churned": 150, "active": 850}

    # Emotions
    avg_emotional_state: EmotionalState
    emotional_trajectory: List[Dict]  # Over time

    # Behavioral
    most_used_features: List[Dict]
    least_used_features: List[Dict]
    friction_points: List[Dict]
    value_moments: List[Dict]

    # Social
    referral_rate: float
    referral_triggers: List[str]
    viral_coefficient: float  # K-factor

    # Insights
    top_insights: List[str]
    recommended_actions: List[Dict]

    # Metadata
    generated_at: datetime = Field(default_factory=datetime.now)
```

---

## API SPECIFICATIONS

### REST API

```python
# File: api.py
# Dependencies: fastapi, uvicorn

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio

app = FastAPI(title="SUTS API", version="1.0.0")

# Endpoints

@app.post("/simulations/create")
async def create_simulation(config: SimulationConfig) -> Dict:
    """Create a new simulation run"""
    # Validate config
    # Store in database
    # Return simulation ID
    pass

@app.post("/simulations/{sim_id}/start")
async def start_simulation(
    sim_id: str,
    background_tasks: BackgroundTasks
) -> Dict:
    """Start simulation execution (async)"""
    # Queue simulation job
    # Return job ID for tracking
    pass

@app.get("/simulations/{sim_id}/status")
async def get_simulation_status(sim_id: str) -> Dict:
    """Get current status of simulation"""
    # Check job status
    # Return progress info
    pass

@app.get("/simulations/{sim_id}/results")
async def get_simulation_results(sim_id: str) -> SimulationResults:
    """Get results from completed simulation"""
    # Retrieve from database
    # Return structured results
    pass

@app.post("/simulations/{sim_id}/analyze")
async def analyze_simulation(
    sim_id: str,
    analysis_type: str
) -> Dict:
    """Run specific analysis on simulation data"""
    # friction_points, value_moments, retention, etc.
    pass

@app.get("/personas/list")
async def list_personas() -> List[PersonaProfile]:
    """List all available personas"""
    pass

@app.post("/personas/generate")
async def generate_personas(
    source_docs: List[str],
    num_personas: int
) -> List[PersonaProfile]:
    """Generate new personas from analysis documents"""
    pass

@app.post("/calibrate")
async def calibrate_system(
    real_user_data: Dict
) -> Dict:
    """Calibrate synthetic users based on real user behavior"""
    pass

@app.get("/health")
async def health_check() -> Dict:
    """System health check"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
```

---

## DEPLOYMENT & OPERATIONS

### Docker Compose Setup

```yaml
# File: docker-compose.yml

version: '3.8'

services:
  # Core API
  suts-api:
    build: .
    ports:
      - '8000:8000'
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - REDIS_URL=redis://redis:6379
      - INFLUXDB_URL=http://influxdb:8086
    depends_on:
      - redis
      - influxdb
      - postgres

  # State management
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data

  # Telemetry storage
  influxdb:
    image: influxdb:2.7-alpine
    ports:
      - '8086:8086'
    volumes:
      - influxdb-data:/var/lib/influxdb2
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=admin
      - DOCKER_INFLUXDB_INIT_PASSWORD=password123
      - DOCKER_INFLUXDB_INIT_ORG=suts
      - DOCKER_INFLUXDB_INIT_BUCKET=simulations

  # Metadata storage
  postgres:
    image: postgres:15-alpine
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=suts
      - POSTGRES_USER=suts
      - POSTGRES_PASSWORD=password123

  # Graph database (for network simulation)
  neo4j:
    image: neo4j:5-community
    ports:
      - '7474:7474'
      - '7687:7687'
    volumes:
      - neo4j-data:/data
    environment:
      - NEO4J_AUTH=neo4j/password123

  # Monitoring
  grafana:
    image: grafana/grafana:latest
    ports:
      - '3000:3000'
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - influxdb

  # Workflow orchestration
  temporal:
    image: temporalio/auto-setup:latest
    ports:
      - '7233:7233'
    depends_on:
      - postgres
    environment:
      - DB=postgresql
      - DB_PORT=5432
      - POSTGRES_USER=suts
      - POSTGRES_PWD=password123
      - POSTGRES_SEEDS=postgres

volumes:
  redis-data:
  influxdb-data:
  postgres-data:
  neo4j-data:
  grafana-data:
```

### Kubernetes Deployment (for scale)

```yaml
# File: k8s/deployment.yml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: suts-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: suts-api
  template:
    metadata:
      labels:
        app: suts-api
    spec:
      containers:
        - name: api
          image: suts-api:latest
          ports:
            - containerPort: 8000
          env:
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: suts-secrets
                  key: anthropic-api-key
          resources:
            requests:
              memory: '512Mi'
              cpu: '500m'
            limits:
              memory: '2Gi'
              cpu: '2000m'
---
apiVersion: v1
kind: Service
metadata:
  name: suts-api-service
spec:
  selector:
    app: suts-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8000
  type: LoadBalancer
```

---

## EXTENSIBILITY & PLUGINS

### Plugin System

```python
# File: plugins.py

from abc import ABC, abstractmethod
from typing import Dict, Any

class SUTSPlugin(ABC):
    """Base class for SUTS plugins"""

    @abstractmethod
    def name(self) -> str:
        """Plugin name"""
        pass

    @abstractmethod
    def on_simulation_start(self, config: SimulationConfig):
        """Called when simulation starts"""
        pass

    @abstractmethod
    def on_event(self, event: SimulationEvent):
        """Called for each simulation event"""
        pass

    @abstractmethod
    def on_simulation_end(self, results: SimulationResults):
        """Called when simulation completes"""
        pass


class SlackNotificationPlugin(SUTSPlugin):
    """Example: Send Slack notifications for key events"""

    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    def name(self) -> str:
        return "slack_notifications"

    def on_simulation_start(self, config: SimulationConfig):
        # Send Slack message
        pass

    def on_event(self, event: SimulationEvent):
        # Alert on critical friction
        if event.emotional_state and event.emotional_state.get('frustration', 0) > 0.9:
            # Send alert
            pass

    def on_simulation_end(self, results: SimulationResults):
        # Send summary
        pass


class CustomProductIntegrationPlugin(SUTSPlugin):
    """Example: Integrate with actual product for realistic simulation"""

    def __init__(self, product_api_url: str):
        self.product_api_url = product_api_url

    def name(self) -> str:
        return "product_integration"

    def on_event(self, event: SimulationEvent):
        # Send action to real product API
        # Get actual response instead of simulated
        pass


# Plugin registry
class PluginRegistry:
    def __init__(self):
        self.plugins: Dict[str, SUTSPlugin] = {}

    def register(self, plugin: SUTSPlugin):
        self.plugins[plugin.name()] = plugin

    def trigger(self, event_type: str, data: Any):
        for plugin in self.plugins.values():
            if event_type == "start":
                plugin.on_simulation_start(data)
            elif event_type == "event":
                plugin.on_event(data)
            elif event_type == "end":
                plugin.on_simulation_end(data)
```

---

## BEST PRACTICES

### 1. Persona Quality

**DO:**

- Ground personas in real user research
- Include specific, concrete details
- Model internal decision logic explicitly
- Track confidence scores and update as you learn

**DON'T:**

- Create generic "average user" personas
- Assume all users behave rationally
- Ignore edge cases and outliers
- Let personas become stale

### 2. Simulation Realism

**DO:**

- Calibrate against real user data when available
- Model irrational behavior (people don't always optimize)
- Include randomness (people are inconsistent)
- Simulate actual time delays and constraints

**DON'T:**

- Assume users read documentation
- Assume users understand your product immediately
- Simulate perfect usage patterns
- Ignore real-world context (time pressure, distractions)

### 3. Analysis Rigor

**DO:**

- Use statistical significance testing
- Account for selection bias in synthetic users
- Compare synthetic to real users regularly
- Update models based on discrepancies

**DON'T:**

- Cherry-pick favorable results
- Ignore outliers (they often reveal important edge cases)
- Over-fit to current product state
- Trust insights without validation

### 4. Operational Excellence

**DO:**

- Version everything (personas, product states, simulations)
- Make simulations reproducible (seed randomness)
- Monitor system health and costs
- Automate as much as possible

**DON'T:**

- Run simulations without clear hypotheses
- Ignore API rate limits and costs
- Let simulation data accumulate without archiving
- Deploy without testing on small cohorts first

### 5. Ethical Considerations

**DO:**

- Clearly label synthetic user data
- Use anonymized real user data for calibration
- Be transparent about limitations
- Validate critical decisions with real users

**DON'T:**

- Conflate synthetic and real users
- Make product decisions solely on synthetic data
- Ignore biases in LLM-generated personas
- Use system to avoid talking to real users

---

## APPENDICES

### A. Cost Estimation

**For 1000 synthetic users, 30-day simulation:**

| Component                  | Usage        | Cost (USD)  |
| -------------------------- | ------------ | ----------- |
| Claude API (input tokens)  | ~500M tokens | $4,000      |
| Claude API (output tokens) | ~100M tokens | $4,000      |
| Infrastructure (1 week)    | AWS/GCP      | $200        |
| **Total**                  |              | **~$8,200** |

**Cost Optimization:**

- Use prompt caching: -60% = $3,280 saved
- Batch simulations: -20% = $1,640 saved
- **Optimized total: ~$3,280**

**ROI Calculation:**

- Cost of one bad product decision: $50,000+ (wasted eng time)
- Cost of losing early adopters: Priceless (reputation damage)
- Break-even: Catching 1 critical issue

### B. Performance Benchmarks

| Metric                      | Target | Actual |
| --------------------------- | ------ | ------ |
| Simulations per hour        | 100    | 120    |
| Personas generated per hour | 50     | 65     |
| API response time (p95)     | <2s    | 1.8s   |
| Memory usage per simulation | <512MB | 400MB  |
| Storage per 1000 users      | <10GB  | 8GB    |

### C. Example Outputs

**Friction Point Report:**

```json
{
  "action": "Configure token limits",
  "affected_users": 347,
  "avg_frustration": 0.78,
  "root_cause": "No clear guidance on optimal token limit values",
  "impact": "Users set incorrect limits, experience poor performance, blame product",
  "recommended_fix": "Add preset options (Small project: 50K, Medium: 150K, Large: 500K) with explanations",
  "priority": "P1",
  "expected_impact": "+25% retention in first week"
}
```

**Value Moment Report:**

```json
{
  "action": "Received preventive warning before AI mistake",
  "affected_users": 623,
  "avg_delight": 0.85,
  "insight": "This is the 'aha moment' - users realize product prevents problems proactively",
  "recommendation": "Surface this moment earlier in onboarding",
  "viral_potential": "High - 68% of users mentioned wanting to tell colleagues",
  "priority": "P0",
  "action": "Make this the centerpiece of onboarding"
}
```

### D. Integration Examples

**With CI/CD:**

```yaml
# .github/workflows/test-with-suts.yml

name: Synthetic User Testing

on:
  pull_request:
    branches: [main]

jobs:
  suts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run SUTS
        run: |
          docker-compose up -d
          python scripts/run_simulation.py \
            --personas 100 \
            --sessions 7 \
            --threshold 0.8

      - name: Check results
        run: |
          python scripts/check_thresholds.py \
            --max-frustration 0.6 \
            --min-retention-day7 0.75

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            // Post SUTS results as PR comment
```

**With Feature Flags:**

```python
# Test new feature with synthetic users before rollout

def test_new_feature():
    # Create two product states
    control = ProductState(features={"new_feature": False})
    treatment = ProductState(features={"new_feature": True})

    # Run simulations
    control_results = run_simulation(personas, control)
    treatment_results = run_simulation(personas, treatment)

    # Compare
    if treatment_results.retention > control_results.retention:
        print("✅ New feature improves retention, roll out")
    else:
        print("❌ New feature hurts retention, don't ship")
```

### E. Troubleshooting Guide

**Common Issues:**

1. **Personas behaving unrealistically**
   - Check: Are personas grounded in real research?
   - Fix: Recalibrate against real user data

2. **High API costs**
   - Check: Are you reusing context via caching?
   - Fix: Enable prompt caching, batch simulations

3. **Simulations too slow**
   - Check: Running too many in parallel?
   - Fix: Tune max_parallel parameter

4. **Results don't match real users**
   - Check: When was last calibration?
   - Fix: Re-calibrate with recent real user data

### F. Roadmap

**V1.0 (Current)**

- Core simulation engine
- Basic persona generation
- Friction/value analysis

**V1.1 (Next)**

- Hybrid simulation (mix synthetic + real users)
- Causal inference engine
- A/B/C testing framework

**V2.0 (Future)**

- Multi-modal simulation (text + UI screenshots)
- Autonomous optimization (system suggests experiments)
- Transfer learning (personas from one product work for another)

**V3.0 (Vision)**

- Continuous simulation (always-on testing)
- Predictive analytics (forecast future behavior)
- Closed-loop system (auto-fixes based on simulations)

---

## CONCLUSION

This specification provides a complete blueprint for building a production-grade Synthetic User Testing System. The system is:

- **Modular**: Swap components without breaking the system
- **Antifragile**: Learns from failures, improves over time
- **Scalable**: 10 users to 10,000 users with same architecture
- **Reusable**: Apply to any product, not just VS Code extensions
- **Open Source**: Built entirely on free/open-source tools

**Next Steps:**

1. Set up infrastructure (Docker Compose for local dev)
2. Generate personas from existing analysis documents
3. Run pilot simulation (10 users, 7 days)
4. Validate against real users if available
5. Scale to full cohort (1000 users, 30 days)
6. Integrate into CI/CD pipeline
7. Iterate based on insights

**Remember:** Synthetic users are a tool, not a replacement for real users. Use them to accelerate learning and reduce risk, but always validate critical decisions with real humans.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Maintainer:** SUTS Core Team
**License:** MIT (for system), Apache 2.0 (for plugins)
