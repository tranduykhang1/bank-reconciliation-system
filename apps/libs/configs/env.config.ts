import * as Joi from 'joi';

export const EnvValidationSchema = Joi.object({
	SERVICE_PORT: Joi.number().port().default(3000),
	CORE_SERVICE_PORT: Joi.number().port().default(8080),
	TRANSACTION_SERVICE_PORT: Joi.number().port().default(8081),

	MONGO_HOST: Joi.string().default('db'),
	MONGO_INITDB_DATABASE: Joi.string().default('sample'),
	MONGO_INITDB_ROOT_USERNAME: Joi.string().default('user'),
	MONGO_INITDB_ROOT_PASSWORD: Joi.string().default('pass'),
	MONGO_ADMIN_PORT: Joi.number().port().default(8083),

	MONGO_URI: Joi.string().default('mongodb://localhost:27017'),

	JWT_SECRET: Joi.string().default('secret-string'),
	AT_EXPIRE: Joi.string().default('60m'),
	PW_SECRET: Joi.string().default('secret-string'),

	REDIS_HOST: Joi.string().default('redis'),
	REDIS_PORT: Joi.number().port().default(6379),
	REDIS_PASSWORD: Joi.string().default('redis-secret'),
	REDIS_DB: Joi.number().default(0),
	REDIS_PORT_GUI: Joi.number().port().default(3036),

	RABBITMQ_PORT: Joi.number().port().default(5672),
	RABBITMQ_MANAGEMENT_PORT: Joi.number().port().default(15672),
	RABBITMQ_URI: Joi.string().default('amqp://rabbitmq:rabbitmq@localhost:5672'),
}).unknown(true);
