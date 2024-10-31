start:
	@echo "\033[0;35m---STARTING ALL SERVICES...\033[0m"
	docker compose up -d
	make restart
	@echo "\033[0;35m---SUCCESSFULLY...\033[0m"

restart:
	@echo "\033[0;35m---RESTARTING TO ENSURE ALL SERVICES STARTED...\033[0m"
	docker restart cris_bank_core_service
	docker restart cris_bank_transaction_service
	@echo "\033[0;35m---SUCCESSFULLY...\033[0m"

down:
	@echo "\033[0;35m---DOWN ALL SERVICES...\033[0m"
	docker compose down -v
	@echo "\033[0;35m---SUCCESSFULLY...\033[0m"

core-logs:
	@echo "\033[0;35m---SHOW CORE SERVICE LOGS\033[0m"
	docker logs cris_bank_core_service -f --tail 10000

transaction-logs:
	@echo "\033[0;35m---SHOW TRANSACTION SERVICE LOGS\033[0m"
	docker logs cris_bank_transaction_service -f --tail 10000

seed-db:
	@echo "\033[0;35m----SEEDING DATABASE...\033[0m"
	docker compose exec core-service npx tsx apps/core-service/src/common/seeders/index.ts --refresh
	@echo "\033[0;35m----SUCCESSFULLY...\033[0m"

