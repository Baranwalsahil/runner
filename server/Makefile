.PHONY: dev test install migrate freeze

VENV := .venv
PY := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
UVICORN := $(VENV)/bin/uvicorn
PYTEST := $(VENV)/bin/pytest

install:
	python3.13 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

dev:
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir .

test:
	$(PYTEST) -v

freeze:
	$(PIP) freeze > requirements.txt
