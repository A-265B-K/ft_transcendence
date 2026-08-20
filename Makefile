all: prod

prod:
	@mkdir -p ./backups/backups
	@docker compose up -d
	@echo Game reachable at https://localhost:8443/

dev:
	@mkdir -p ./backups/backups
	@docker compose -f docker-compose-dev.yaml up
	@echo Game reachable at https://localhost:8443/

down:
	@docker compose down

restart:
	@docker compose restart
	@echo Game reachable at https://localhost:8443/

cleanimages: 
	@docker compose down --rmi all

cleanvolumes:
	@docker compose down --volumes

cleanbackups:
	@rm -rf backups/backups

fclean: cleanbackups
	@docker compose down --rmi all --volumes

re: fclean up