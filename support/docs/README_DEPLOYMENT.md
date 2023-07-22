# project deployment

## table of content

- dev/staging
- prod
- GitHub actions variables

## dev/staging

The development/staging are both hosted on `TBD`.

There is some GitHub actions in place for the CI :

- `.github/workflows/develop.yml`
    - triggered on each merge on `develop` branch
    - builds the docker image and send it to the registry
    - deploy and restart the api container on the dev server
- `.github/workflows/staging.yml`
    - triggered on each merge on `staging` branch
    - builds the docker image and send it to the registry
    - deploy and restart the api container on the staging server
- `.github/workflows/runTests.yml`
    - run all automated tests and send the results to sonarcloud

## production

The production is hosted on `TBD`.

There is one GitHub actions in place for the CI :

- `.github/workflows/production.yml`
    - triggered on each merge on `main` branch
    - builds the docker image and send it to the registry 
      

the deployment is not automated by choice. 
You will need to connect to the production server and update the container :

```bash
ssh <prod server>
docker-compose pull api
docker-compose up -d api
```

## GitHub actions variables

`SONAR_TOKEN` : the project sonar generated token
`SSH_DEV_HOST` : the ssh host to the development server
`SSH_DEV_USERNAME` : the ssh username
`SSH_DEV_PORT` : the ssh port
`SSH_DEV_KEY` : the content of the ssh private key used to connect to the dev server
`DOCKER_HUB_REGISTRY` : the docker registry url
`DOCKER_HUB_USER` : the docker registry username
`DOCKER_HUB_PASSWORD` : the docker registry password
