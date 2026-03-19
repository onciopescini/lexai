from mcp.server.fastmcp import FastMCP
import sys
import logging

logging.basicConfig(level=logging.INFO, stream=sys.stderr)

# Create an MCP server
mcp = FastMCP("Atena")

@mcp.tool()
def atena_rag_search(query: str) -> str:
    """Search the Atena legal database.
    
    Args:
        query: The legal query to search for.
    """
    return f"Mock RAG Result for query: {query}. Trovati riferimenti nell'Articolo 3 della Costituzione."

@mcp.tool()
def generate_legal_document(document_type: str, context: str) -> str:
    """Generate a legal document based on type and context.
    
    Args:
        document_type: Type of document (e.g., 'Diffida', 'Contratto').
        context: The context or details to include in the document.
    """
    return f"Bozza di {document_type} generata con successo usando il contesto: {context}."

if __name__ == "__main__":
    # Initialize and run the server over stdio
    mcp.run()
