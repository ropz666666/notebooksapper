# Copyright (c) 2024 Microsoft Corporation.
# Licensed under the MIT License

"""Text Utilities for LLM."""
from __future__ import annotations

from collections.abc import Iterator
from itertools import islice

import tiktoken


def num_tokens(text: str, token_encoder) -> int:
    """Return the number of tokens in the given text."""
    return len(token_encoder.encode(text=text))  # type: ignore


def batched(iterable: Iterator, n: int):
    """
    Batch data into tuples of length n. The last batch may be shorter.

    Taken from Python's cookbook: https://docs.python.org/3/library/itertools.html#itertools.batched
    """
    # batched('ABCDEFG', 3) --> ABC DEF G
    if n < 1:
        value_error = "n must be at least one"
        raise ValueError(value_error)
    it = iter(iterable)
    while batch := tuple(islice(it, n)):
        yield batch


def chunk_text(
    text: str, max_tokens: int, token_encoder: tiktoken.Encoding | None = None
):
    """Chunk text by token length."""
    if token_encoder is None:
        token_encoder = tiktoken.get_encoding("cl100k_base")
    tokens = token_encoder.encode(text)  # type: ignore
    chunk_iterator = batched(iter(tokens), max_tokens)
    yield from (token_encoder.decode(list(chunk)) for chunk in chunk_iterator)
