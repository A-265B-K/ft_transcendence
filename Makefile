all: up

up:
	@mkdir -p ./backups
	@docker compose up --build -d
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

fclean:
	@docker compose down --rmi all
	@docker compose down --volumes

cleanbackups:
	@rm -rf backups

re: fclean
	@docker compose up --build -d