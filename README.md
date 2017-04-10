# RW-Cluster

![rw-cluster.png](https://bitbucket.org/repo/64KGjqx/images/1449010692-rw-cluster.png)

* Leader-Election: mutex (redis transactions)
* Messaging: queue (redis list)

Кластер состоит из нод с ролями Writer и Reader.

### Координация:

1. Writer
Арендует (lease) ресурс с TTL (ключ в redis), обновляя его с интервалом (renew).
Аренда выдаётся для конкретного writer instance по id.
Пока writer работает, другие ноды не могут получить эту же роль.
Другие ноды в кластере не могут lease/renew ресурс, т.к. имеют отличные id.
Когда writer завершает работу, TTL истекает и lease может взять другая нода.

2. Reader
С интервалом проверяет наличие ключа. При его отсутствии принимает попытку стать writer.

### Состояния приложения:

1. Dead letters reader
Запуск приложения с ключем `getErrors`. Неудачно обработанные reader нодой сообщения выводятся на экран.

2. Runtime reconfiguration
Приложение в данном состоянии пытается стать writer нодой.

3. Writer
Генерирует сообщения и складывает их в очередь.

4. Reader
Читает сообщения из очереди, затем обрабатывает. Неудачно обработанные сообщения складывает в другую очередь.

Ноды не общаются друг с другом.


### NPM
```
npm i
```

### Usage
```
writer/reader: node app
dead-letters: node app getErrors
```

### TODO
1. Redis pub-sub cluster mesh (p2p)
2. Leader election (bully)

Нужно сделать мультикаст через общую шину на базе redis pub-sub между нодами и реализовать один из алгоритмов leader-election.
Мысль об этом пришла уже позже :)