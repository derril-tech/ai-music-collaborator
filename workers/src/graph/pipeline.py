"""Main LangGraph pipeline for music generation."""

from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .nodes import (
    LyricsNode,
    StructurePlanner,
    MelodyGen,
    HarmonyGen,
    RhythmGen,
    ArrangeNode,
    SynthesizeNode,
    MixMasterNode,
    QAValidator,
    Exporter,
)
from .state import MusicState


class MusicPipeline:
    """Main music generation pipeline using LangGraph."""

    def __init__(self):
        self.graph = self._build_graph()
        self.memory = MemorySaver()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(MusicState)

        # Add nodes
        workflow.add_node("lyrics", LyricsNode())
        workflow.add_node("structure", StructurePlanner())
        workflow.add_node("melody", MelodyGen())
        workflow.add_node("harmony", HarmonyGen())
        workflow.add_node("rhythm", RhythmGen())
        workflow.add_node("arrange", ArrangeNode())
        workflow.add_node("synthesize", SynthesizeNode())
        workflow.add_node("mix_master", MixMasterNode())
        workflow.add_node("qa", QAValidator())
        workflow.add_node("export", Exporter())

        # Define the workflow
        workflow.set_entry_point("lyrics")
        
        # Main flow: lyrics -> structure -> melody -> harmony -> rhythm -> arrange
        workflow.add_edge("lyrics", "structure")
        workflow.add_edge("structure", "melody")
        workflow.add_edge("melody", "harmony")
        workflow.add_edge("harmony", "rhythm")
        workflow.add_edge("rhythm", "arrange")
        
        # Parallel processing for synthesis
        workflow.add_edge("arrange", "synthesize")
        workflow.add_edge("synthesize", "mix_master")
        
        # QA and export
        workflow.add_edge("mix_master", "qa")
        workflow.add_edge("qa", "export")
        workflow.add_edge("export", END)

        return workflow.compile(checkpointer=self.memory)

    async def run(self, initial_state: Dict[str, Any]) -> Dict[str, Any]:
        """Run the music generation pipeline."""
        config = {"configurable": {"thread_id": initial_state.get("project_id", "default")}}
        
        # Initialize state
        state = MusicState(
            project_id=initial_state["project_id"],
            lyrics=initial_state.get("lyrics", ""),
            genre=initial_state.get("genre", "pop"),
            key=initial_state.get("key", "C"),
            tempo=initial_state.get("tempo", 120),
            time_signature=initial_state.get("time_signature", "4/4"),
            mood=initial_state.get("mood", "happy"),
        )

        # Run the pipeline
        result = await self.graph.ainvoke(state, config)
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get pipeline configuration."""
        return {
            "nodes": list(self.graph.nodes.keys()),
            "edges": list(self.graph.edges),
            "checkpointer": "memory",
        }
