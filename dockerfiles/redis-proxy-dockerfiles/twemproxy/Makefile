install:
	docker build --rm -t nebula/redis-twemproxy .

build:
	docker run -d -p 6379:6379 --name twemproxy nebula/redis-twemproxy

rm:
	docker rm -f twemproxy
