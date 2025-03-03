import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Union

from sapperrag.model import TextChunk


def map_query_to_text_chunks(
    query: str,
    text_chunks: List[TextChunk],
    vector_db: pd.DataFrame,
    text_embedder
) -> List[TextChunk]:
    # ��ȡ��ѯ��Ƕ������
    query_emb = np.array(text_embedder.embed(query), dtype=np.float32).reshape(1, -1)

    # ����ÿ���洢��Ƕ���������ѯǶ���������������ƶ�
    similarities = []
    for _, row in vector_db.iterrows():
        # ���洢��Ƕ������ת��Ϊ numpy ����
        stored_emb = np.array(row.Embedding, dtype=np.float32).reshape(1, -1)
        sim = cosine_similarity(query_emb, stored_emb)[0][0]
        similarities.append(sim)

    # �����ƶ���ӵ� DataFrame ��
    vector_db['similarity'] = similarities

    # �������ƶ�����
    sorted_vector_db = vector_db.sort_values(by='similarity', ascending=False)

    # �� vector_db �� ID ��תΪ�����Լӿ�����ٶ�
    sorted_ids = set(sorted_vector_db['ID'])

    # �� text_chunks ת��Ϊһ���� ID Ϊ�����ֵ䣬�Ա���ٲ���
    text_chunks_dict = {chunk.id: chunk for chunk in text_chunks}

    # ��������� ID ��ȡ��Ӧ���ı���
    sorted_chunks = [text_chunks_dict[chunk_id] for chunk_id in sorted_ids if chunk_id in text_chunks_dict]

    return sorted_chunks
