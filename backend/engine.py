import os
import uuid
import json
from typing import List, Literal, Dict
from pydantic import BaseModel, Field
import networkx as nx
from langchain_mistralai import ChatMistralAI

# --- Strict Pydantic Models for Structured Extraction ---
class Entity(BaseModel):
    name: str = Field(description="Unique name or designation of the entity.")
    type: str = Field(description="Category (e.g., Organization, Concept, Event).")
    description: str = Field(description="Factual core description.")

class Relationship(BaseModel):
    source: str
    target: str
    relation_type: str = Field(description="Connection string like INFLUENCES, CONTRADICTS, DEPENDS_ON.")
    explanation: str

class ExtractedInsight(BaseModel):
    type: Literal["Obvious", "Non-Obvious"]
    category: Literal["Fact", "Decision", "Risk", "Pattern", "Contradiction", "Evolution"]
    title: str
    summary: str
    confidence: float
    evidence: List[str]

class KnowledgePayload(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]
    insights: List[ExtractedInsight]

# --- Memory and State Storage Handler ---
class MemoryWorkspace:
    def __init__(self, filename="workspace_store.json"):
        self.filename = filename
        self.graph = nx.DiGraph()
        self.insights = []
        self.load()

    def update_workspace(self, payload: KnowledgePayload, source_id: str):
        # Insert or Update Entities
        for ent in payload.entities:
            node_key = ent.name.strip().upper()
            if self.graph.has_node(node_key):
                self.graph.nodes[node_key]["description"] += f" | (Update): {ent.description}"
            else:
                self.graph.add_node(node_key, label=ent.name, type=ent.type, description=ent.description)

        # Insert or Update Directed Relationships
        for rel in payload.relationships:
            src = rel.source.strip().upper()
            tgt = rel.target.strip().upper()
            if not self.graph.has_node(src): self.graph.add_node(src, label=rel.source, type="Concept", description="")
            if not self.graph.has_node(tgt): self.graph.add_node(tgt, label=rel.target, type="Concept", description="")
            
            self.graph.add_edge(src, tgt, type=rel.relation_type, explanation=rel.explanation)

        # Compile Insights
        for ins in payload.insights:
            self.insights.append(ins.model_dump())
        self.save()

    def get_serializable_graph(self) -> Dict:
        return {
            "nodes": [{"id": n, "label": d.get("label", n), "type": d.get("type", "Unknown"), "description": d.get("description", "")} for n, d in self.graph.nodes(data=True)],
            "edges": [{"source": u, "target": v, "type": d.get("type", ""), "explanation": d.get("explanation", "")} for u, v, d in self.graph.edges(data=True)]
        }

    def save(self):
        with open(self.filename, "w") as f:
            json.dump({"nodes": list(self.graph.nodes(data=True)), "edges": list(self.graph.edges(data=True)), "insights": self.insights}, f)

    def load(self):
        if os.path.exists(self.filename):
            try:
                with open(self.filename, "r") as f:
                    data = json.load(f)
                    for n, d in data.get("nodes", []): self.graph.add_node(n, **d)
                    for u, v, d in data.get("edges", []): self.graph.add_edge(u, v, **d)
                    self.insights = data.get("insights", [])
            except: pass


# --- Corrected LangChain AI Orchestration Engine ---
class AIWorkspaceEngine:
    def __init__(self):
        # Initialize the LangChain chat model wrapper
        self.llm = ChatMistralAI(
            api_key=os.getenv("MISTRAL_API_KEY", ""),
            model="mistral-large-latest",
            temperature=0
        )
        self.workspace = MemoryWorkspace()

    def process_research(self, topic: str, content: str):
        source_id = f"SRC_{uuid.uuid4().hex[:4].upper()}"
        
        prompt = f"""
        You are an advanced AI research agent.
        Analyze the provided research content for the topic '{topic}'.
        
        Extract:
        1. Cleaned core Entities
        2. Direct or indirect directional functional Relationships
        3. Obvious and Non-Obvious system insights
        
        Content Source:
        {content}
        """
        
        # FIX: Use LangChain's native structured output wrapper method to force Pydantic casting
        structured_llm = self.llm.with_structured_output(KnowledgePayload)
        parsed_payload = structured_llm.invoke(prompt)
        
        # Update the network graph memory arrays incrementally
        self.workspace.update_workspace(parsed_payload, source_id)
        return {"status": "success", "source_id": source_id, "insights_count": len(parsed_payload.insights)}

    def execute_chat(self, message: str) -> str:
        graph_data = self.workspace.get_serializable_graph()
        
        prompt = f"""
        You are a structured reasoning assistant. Answer the query based on the active Knowledge Graph State and Surfaced Insights provided.
        
        Graph Memory Context: 
        {json.dumps(graph_data)}
        
        Surfaced Insights Context: 
        {json.dumps(self.workspace.insights)}
        
        User Query: {message}
        
        Provide a clean Markdown summary response with clear, scannable headers.
        """
        
        # FIX: Use LangChain's native invoke method to request text outputs
        response = self.llm.invoke(prompt)
        return response.content
