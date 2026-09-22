.PHONY: first-deploy deploy shell logs

first-deploy:
	git pull
	docker compose up -d --build

deploy:
	docker compose up -d --build

shell:
	docker exec -it smoke sh

logs:
	docker compose logs -f
