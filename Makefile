start-dev:
	docker-compose -f docker-compose.yml up
stop-dev:
	docker-compose -f docker-compose.yml down
build-deploy:
	docker-compose -f docker-compose.deploy.yml build
start-deploy:
	docker-compose -f docker-compose.deploy.yml up &
stop-deploy:
	docker-compose -f docker-compose.deploy.yml down
build-react:
	docker-compose -f docker-compose.react-build.yml up
delete-dbs:
	rm -R ./docker/serp-postgresql/
delete-deps:
	# For FASTAPI
	rm -R ./serp-fastapi/__pycache__
	rm -R ./serp-fastapi/test.db
	rm -R ./serp-fastapi/.coverage
	rm -R ./serp-fastapi/.mypy_cache
	rm -R ./serp-fastapi/.pytest_cache
	# For React
	rm -R ./serp-react/node_modules
	rm -R ./serp-react/build
	
priv-dev:
	chmod u+x ./scripts/privileges-development.sh && ./scripts/privileges-development.sh

priv-deploy:
	chmod u+x ./scripts/privileges-deploy.sh && ./scripts/privileges-deploy.sh
