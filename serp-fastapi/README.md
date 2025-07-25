# 🔧 Backend - Sistema d'Emergencies i Resposta Prioritaria
API central que gestiona la lógica de negocio y conecta con las APIs simuladas de Nokia.

## 🛠️ Tecnologías
- FastAPI
- Python 3.9
- Docker

## 📡 Endpoints

### Alertas
- `POST /api/alerts` → Crear alerta
- `GET /api/alerts` → Listar alertas
- `GET /api/alerts/{id}` → Detalles de alerta
- `PATCH /api/alerts/{id}` → Actualizar estado

### Dispositivos
- `GET /api/devices` → Listar dispositivos
- `POST /api/devices` → Crear dispositivo
- `GET /api/devices/{id}` → Detalles de dispositivo
- `PATCH /api/devices/{id}` → Actualizar dispositivo
- `DELETE /api/devices/{id}` → Eliminar dispositivo

### QoS
- `POST /api/devices/{id}/qos` → Activar QoS
- `DELETE /api/devices/{id}/qos` → Desactivar QoS

### Location
- `GET /api/devices/{id}/location` → Obtener ubicación

## 🔌 Integración con Nokia API
- QoS Management: `http://mock-nokia-api:6000/api/v1/qos`
- Location Services: `http://mock-nokia-api:6000/api/v1/location`

## 📝 Notas
- La API se integra con el mock de Nokia para QoS y ubicación
- Gestión automática de QoS al crear/resolver alertas
- Soporte para asignación de dispositivos a emergencias
- CORS habilitado para el frontend


## Python Code QA Utilities
To ensure your **Python FastAPI** code is clean, secure, bug-free, and maintainable, you can use a combination of tools that check for:

---

### ✅ **1. Style (PEP8 Compliance)**

* **[Black](https://github.com/psf/black)** – Opinionated code formatter.
* **[isort](https://github.com/PyCQA/isort)** – Automatically sort and format import statements.
* **[flake8](https://github.com/PyCQA/flake8)** – Checks for style guide violations.

  * Can be extended with plugins like `flake8-docstrings`, `flake8-bugbear`, etc.

---

### 🔐 **2. Security**

* **[Bandit](https://github.com/PyCQA/bandit)** – Scans Python code for security issues.
* **[Safety](https://github.com/pyupio/safety)** – Checks dependencies for known security vulnerabilities.
* **[Dependabot](https://docs.github.com/en/code-security/dependabot)** (GitHub-integrated) – Keeps dependencies updated and flags security issues in dependencies.

---

### 🐞 **3. Bug Detection**

* **[Pylint](https://github.com/pylint-dev/pylint)** – Linter that detects potential bugs and enforces coding standards.
* **[mypy](http://mypy-lang.org/)** – Static type checker for Python (especially good if using type hints).
* **[pyright](https://github.com/microsoft/pyright)** – Fast type checker (alternative to `mypy`, used in VS Code).

---

### 📦 **4. Dependency and Package Management**

* **[Poetry](https://python-poetry.org/)** or **[Pipenv](https://github.com/pypa/pipenv)** – Manage dependencies and environments cleanly.

---

### 🧪 **5. Testing**

* **[pytest](https://docs.pytest.org/)** – Python testing framework.
* **[httpx](https://www.python-httpx.org/)** – Great for testing FastAPI endpoints.
* **[pytest-cov](https://pypi.org/project/pytest-cov/)** – Add code coverage tracking to your tests.

---

### 🚦 **6. CI Integration**

Use a CI system (like **GitHub Actions**, **GitLab CI**, or **CircleCI**) to run all checks automatically on every push/PR:

* Style: `black`, `isort`
* Lint: `flake8`, `pylint`
* Type checks: `mypy` or `pyright`
* Security: `bandit`, `safety`
* Tests: `pytest`

---

### 🧰 **Recommended Setup Script (for local use)**

```bash
# Install essential tools
pip install black isort flake8 bandit safety mypy pylint pytest httpx pytest-cov

# Optional (if using pyproject.toml):
pip install poetry
```

---

### 📋 **Optional Enhancements**

* **[pre-commit](https://pre-commit.com/)** – Run all tools before committing code.
* **[dockerfilelint](https://github.com/replicatedhq/dockerfilelint)** – If you’re using Docker with FastAPI.
* **[jsonschema](https://pypi.org/project/jsonschema/)** – Validate JSON input/output if not fully relying on FastAPI’s Pydantic.

---

Would you like a sample `pre-commit` config or GitHub Actions workflow to tie this all together?


### Code QA Tools

```bash
pip install black isort flake8 bandit safety mypy pylint  pytest-cov
```

#### Usage

| Tool           | Main Command Example       | Description                                             |
| -------------- | -------------------------- | ------------------------------------------------------- |
| **Black**      | `black .`                  | Format all Python files in the current directory.       |
| **isort**      | `isort .`                  | Sort imports recursively in all Python files.           |
| **flake8**     | `flake8 .`                 | Check for style and lint errors.                        |
| **bandit**     | `bandit -r .`              | Recursively scan code for security issues.              |
| **safety**     | `safety check`             | Check installed dependencies for known vulnerabilities. |
| **pylint**     | `pylint your_module/`      | Static code analysis for possible bugs and smells.      |
| **mypy**       | `mypy your_module/`        | Static type checking (uses Python type hints).          |
| **pytest**     | `pytest`                   | Run all tests in the current directory.                 |
| **pytest-cov** | `pytest --cov=your_module` | Run tests and report code coverage.                     |



