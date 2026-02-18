FROM alpine:3.21

RUN apk add --no-cache gcc musl-dev

WORKDIR /sandbox

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
