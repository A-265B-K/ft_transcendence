all: prod

prod:
	@mkdir -p ./backups/backups
	@./scripts/start.sh
	@echo Game reachable at https://localhost:8443/

init:
	@mkdir -p ./backups/backups
	@./scripts/bootstrap.sh

dev:
	@mkdir -p ./backups/backups
	@./scripts/start-dev.sh

down:
	@./scripts/stop.sh

restart:
	@./scripts/restart.sh
	@echo Game reachable at https://localhost:8443/

cleanimages: 
	@./scripts/clean_images.sh

cleanvolumes:
	@./scripts/clean_volumes.sh

cleanbackups:
	@rm -rf backups/backups

fclean:
	@./scripts/fclean.sh

re: fclean all