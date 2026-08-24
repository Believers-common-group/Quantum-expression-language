from typing import Protocol

from qel_tn01.contracts import Intent, NodeManifest
from qel_tn01.errors import QelError


class NodeAdapter(Protocol):
    def manifest(self) -> NodeManifest: ...
    def authorize(self, intent: Intent) -> QelError | None: ...
