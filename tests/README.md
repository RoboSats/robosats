# Run e2e tests

```
docker compose -f docker-tests.yml --env-file tests/compose.env up -d
docker exec coordinator coverage run manage.py test
docker exec coordinator coverage report
```