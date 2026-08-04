.PHONY: first-deploy deploy shell logs

first-deploy:
	git pull
	docker compose up -d --build

deploy:
	git pull
	docker compose up -d --build

shell:
	docker exec -it aroma sh

logs:
	docker compose logs -f
