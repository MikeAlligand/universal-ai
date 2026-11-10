from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class GenerationResult:
    text: str
    provider: str
    model: str


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str) -> GenerationResult:
        raise NotImplementedError
