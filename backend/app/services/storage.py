from pathlib import Path
from uuid import uuid4
class DocumentStorage:
    def __init__(self, root: str): self.root=Path(root); self.root.mkdir(parents=True, exist_ok=True)
    def save(self, filename: str, content: bytes) -> str:
        safe=Path(filename).name; key=f"{uuid4()}-{safe}"; (self.root/key).write_bytes(content); return key
    def get(self, key: str) -> bytes: return (self.root/Path(key).name).read_bytes()
    def delete(self, key: str):
        path=self.root/Path(key).name
        if path.exists(): path.unlink()
    def exists(self, key: str) -> bool: return (self.root/Path(key).name).is_file()
