all: prod

prod:
	@mkdir -p ./backups/backups
	@./scripts/makefile/start.sh
	@echo Game reachable at https://localhost:8443/

init:
	@mkdir -p ./backups/backups
	@./scripts/bootstrap.sh

dev:
	@mkdir -p ./backups/backups
	@./scripts/makefile/start-dev.sh

down:
	@./scripts/makefile/stop.sh

restart:
	@./scripts/makefile/restart.sh
	@echo Game reachable at https://localhost:8443/

cleanimages: 
	@./scripts/makefile/clean_images.sh

cleanvolumes:
	@./scripts/makefile/clean_volumes.sh

cleanbackups:
	@rm -rf backups/backups

fclean:
	@./scripts/makefile/fclean.sh

re: fclean all