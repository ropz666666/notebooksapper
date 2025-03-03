"""Base classes for global and local context builders."""

from abc import ABC, abstractmethod


class GlobalContextBuilder(ABC):
    """Base class for global-search context builders."""

    @abstractmethod
    def build_context(
        self, **kwargs
    ):
        """Build the context for the global search mode."""


class LocalContextBuilder(ABC):
    """Base class for local-search context builders."""

    @abstractmethod
    def build_context(
        self,
        query: str,
        **kwargs,
    ):
        """Build the context for the local search mode."""


class TextContextBuilder(ABC):
    """Base class for local-search context builders."""

    @abstractmethod
    def build_context(
        self,
        query: str,
        **kwargs,
    ):
        """Build the context for the local search mode."""
