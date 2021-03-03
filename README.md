# metric-tracker
A fork of 0xTracker component to specialise of Metric related trades only

# Deployment

set up elasticsearch vm conf: 
```shell
sysctl -w vm.max_map_count=262144
```

and persist it for next runs 

```shell
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
```

init env configs for 0xTracker processes
```shell
cp 0x-tracker-api/.env.example 0x-tracker-api/.env
cp 0x-tracker-worker/.env.example 0x-tracker-worker/.env
cp 0x-event-extractor/.env.example 0x-event-extractor/.env
```

then run 
```shell
docker-compose up -d
```