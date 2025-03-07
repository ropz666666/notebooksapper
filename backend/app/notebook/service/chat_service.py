from backend.app.notebook.schema.note import GetNoteListDetails
from backend.app.notebook.schema.notesource import GetNoteSourceListDetails
from backend.app.notebook.service.notesource_service import note_source_service
from backend.app.notebook.service.note_service import note_service
from backend.app.notebook.service.embedding_service import embedding_service
from backend.utils.serializers import select_as_dict
from sapperrag.llm.oai import ChatOpenAI
from backend.core.conf import settings


class ChatService:
    def __init__(self, note_source_ids: list[int], note_ids: list[int], api_key: str) -> None:
        self.chatbot = ChatOpenAI(api_key, settings.OPENAI_BASE_URL)
        self.note_source_ids = note_source_ids
        self.note_sources: list[GetNoteSourceListDetails] = []
        self.note_ids = note_ids
        self.notes: list[GetNoteListDetails] = []

    async def initialize_sources(self):
        """异步获取 note sources 并赋值"""
        for source_id in self.note_source_ids:
            source = await note_source_service.get(pk=int(source_id))
            self.note_sources.append(GetNoteSourceListDetails(**select_as_dict(source)))

        for note_id in self.note_ids:
            note = await note_service.get(pk=int(note_id))
            self.notes.append(GetNoteListDetails(**select_as_dict(note)))

    async def build_source_context(self, query):
        embeddings = await embedding_service.get_embeddings_by_query(note_source_ids=self.note_source_ids,
                                                                     query=query, topK=7)
        system = ""
        for emb in embeddings:
            system += emb.content + "\n"

        return system

    async def build_note_context(self):
        system = ""
        for note in self.notes:
            system += note.content + "\n"

        return system

    def build_history_context(self, messages: []):
        system = ""
        for emb in messages:
            system += emb['content'] + "\n"

        return system

    async def process_message(self, message: []):
        system = ""
        if len(self.note_ids) == 0:
            source_context = await self.build_source_context(message[-1]['content'])
            system += source_context + '\n'
        else:
            note_context = await self.build_note_context()
            system += note_context + '\n'

        system += self.build_history_context(message[:-1])

        system += "\noutput in a markdown format!!"

        query = [{'role': 'system', 'content': system}, message[-1]]
        print(query)

        response = self.chatbot.generate(
            messages=query,
            response_format="text",
            streaming=True
        )
        for chunk in response:
            yield chunk




