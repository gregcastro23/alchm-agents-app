import os
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional

# Configuration
CHROMADB_PATH = os.getenv("CHROMADB_PATH", "./chroma_db")

class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMADB_PATH)
        
    def get_or_create_collection(self, name: str):
        return self.client.get_or_create_collection(name=name)
        
    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str]):
        collection = self.get_or_create_collection(collection_name)
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
    def query(self, collection_name: str, query_text: str, n_results: int = 5, where: Optional[Dict[str, Any]] = None):
        collection = self.get_or_create_collection(collection_name)
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where
        )
        return results

vector_store = VectorStore()
