# Container image that runs your code
FROM golang:1.13

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY entrypoint.sh /notifier/entrypoint.sh
COPY main.go /notifier/main.go

# Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT ["/notifier/entrypoint.sh"]