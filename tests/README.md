# Run e2e tests

```
docker compose -f docker-tests.yml --env-file tests/compose.env up -d
docker exec test-sql psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'test_postgres';"
docker exec test-sql psql -U postgres -c "DROP DATABASE IF EXISTS test_postgres"
docker exec test-coordinator coverage run manage.py test
docker exec test-coordinator coverage report
```

Notes:
- `docker-tests.yml` sets `SKIP_FRONTEND_TESTS` to `true` by default (frontend templates are built separately).
  To run frontend template fetch tests, set `SKIP_FRONTEND_TESTS=false`.
- To run the coordinator against CLN (and exercise the hold plugin path), set `LNVENDOR=CLN`.
