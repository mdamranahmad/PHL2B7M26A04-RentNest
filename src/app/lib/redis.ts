import { createClient } from 'redis';
import config from '../config';

export const redisClient = createClient({
    username: config.redis_username,
    password: config.redis_password,
    socket: {
        host: config.redis_socket_host,
        port: Number(config.redis_socket_port),
    }
});

// redisClient.on('error', err => console.log('Redis Client Error', err));

// await client.connect();

// await client.set('foo', 'bar');
// const result = await client.get('foo');
// console.log(result)  // >>> bar

