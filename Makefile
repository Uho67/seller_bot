-include .env
export

CONTAINER_NAME ?= aromavawe

.PHONY: first-deploy deploy shell logs

first-deploy:
	git pull
	docker compose up -d --build

deploy:
	docker compose up -d --build

shell:
	docker exec -it $(CONTAINER_NAME) sh

logs:
	docker compose logs -f
