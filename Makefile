all: up

up:
	@mkdir -p ./backups
	@docker compose up -d
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
	@rm -rf backups

fclean: cleanbackups
	@docker compose down --rmi all --volumes

re: fclean
	@docker compose up --build -d

resetdocker: fclean
	@docker system prune -af
	@docker volume prune -af