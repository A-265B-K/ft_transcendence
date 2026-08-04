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

fclean: cleanimages cleanvolumes

re: cleanimages cleanvolumes up