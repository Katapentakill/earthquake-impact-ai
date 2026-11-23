import sys
from pathlib import Path

# Permite `from app.services... import ...` sin instalar nada: las funciones probadas son puras
# (no importan la configuración ni la base de datos).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
