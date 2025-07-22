FROM alpine:3.20 as builder

RUN apk add --no-cache curl bash tar gzip openssl

RUN curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 && \
    chmod 700 get_helm.sh && \
    ./get_helm.sh

ENV HELM_EXPERIMENTAL_OCI=1
WORKDIR /charts
RUN helm pull oci://public.ecr.aws/k9v9d5v2/agents-chart --version v0.10.7
RUN helm repo add kubearmor https://kubearmor.github.io/charts/ && \
    helm repo update && \
    helm pull kubearmor/kubearmor-operator --version v1.5.7

COPY accuknox-cwpp-hardening-policies ./accuknox-cwpp-hardening-policies

RUN helm package accuknox-cwpp-hardening-policies && rm -rf accuknox-cwpp-hardening-policies

RUN helm repo index . \
  --url http://accuknox-charts.agents:8080/charts/

## Managed via github action
FROM accuknox-ui-extention:build

USER root

RUN mkdir -p /home/plugin-server/plugin-contents/charts

COPY --from=builder /charts /home/plugin-server/plugin-contents/charts

RUN chown -R pluginserver:pluginserver /home/plugin-server/plugin-contents/charts

USER pluginserver