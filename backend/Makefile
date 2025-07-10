format:
	# Code formatting
	black .
	# Automatically sort and format import statements
	isort .

lint:
	# Check for style guide violations
	echo "flake8"
	-flake8 .
	#  Linter that detects potential bugs and enforces coding standards.
	echo "pylint src"
	-pylint ./main.py
	echo "pylint test"
	-pylint tests/
	# Static type checker for Python (especially good if using type hints).
	echo "mypy src"
	-mypy src/
	echo "mypy src"
	-mypy tests/
flake:
	# Check for style guide violations
	echo "flake8"
	-flake8 .
pylint:
	#  Linter that detects potential bugs and enforces coding standards.
	echo "pylint src"
	-pylint .
	#echo "pylint test"
	#-pylint tests/
mypy:
	# Static type checker for Python (especially good if using type hints).
	echo "mypy src"
	-mypy src/
	echo "mypy tests integration"
	-mypy tests/integration/
security:
	echo "bandit -r"
	-bandit -r .
	echo "safety check"
	-safety check
test:
	echo "pytest -cov=src"
	pytest --cov=src

all: format lint security test
