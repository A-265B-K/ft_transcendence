all: up

up:
	@docker compose up --build -d

debug:
	@docker compose up --build

down:
	@docker compose down

restart:
	@docker compose restart

cleanimages: 
	@docker compose down --rmi all

cleanvolumes:
	@docker compose down --volumes

fclean:
	@docker compose down --rmi all
	@docker compose down --volumes

re: fclean
	@docker compose up --build -d