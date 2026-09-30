all: prod

prod:
	@mkdir -p ./backups/backups
	./scripts/start.sh
	@echo Game reachable at https://localhost:8443/

dev:
	@mkdir -p ./backups/backups
	./scripts/start-dev.sh

down:
	./scripts/stop.sh

restart:
	./scripts/restart.sh
	@echo Game reachable at https://localhost:8443/

cleanimages: 
	@docker compose down --rmi all

cleanvolumes:
	@docker compose down --volumes

cleanbackups:
	@rm -rf backups/backups

fclean: cleanbackups
	@docker compose down --rmi all --volumes

re: fclean all