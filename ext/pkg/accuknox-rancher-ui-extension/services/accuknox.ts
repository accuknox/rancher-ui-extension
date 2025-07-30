import { Store } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { handleGrowl } from '../utils/handle-growl';
import { ACCUKNOX_REPO_NAME, AGENTS_NAMESPACE, KUBEARMOR_NAMESPACE, CONFIG_MAP_NAME, CWPP_HARDENING_CHART, KSPM_CHARTS_CONFIG, KUBEARMOR_OPERATOR_CHART, AGENTS_CHART } from '../constants';
import { Cluster, CwppFormData, KspmFormData } from '../types';

async function rancherRequest(store: Store<any>, options: any, errorMessage?: string) {
  try {
    return await store.dispatch('management/request', options);
  } catch (e: any) {
    handleGrowl({
      error: e,
      store,
      overrideStatusText: errorMessage || `Request failed: ${e._statusText || e.message}`
    });
    throw e; 
  }
}

// --- Data Fetching ---
export async function fetchAllClusters(store: Store<any>): Promise<Cluster[]> {
  const res = await store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
  return res || [];
}

export async function getClusterRepos(store: Store<any>, clusterId: string) {
  return rancherRequest(store, {
    url: `/k8s/clusters/${clusterId}/v1/catalog.cattle.io.clusterrepo`,
    method: 'GET',
  });
}

async function getAppDetails(store: Store<any>, clusterId: string, appName: string) {
    const response = await store.dispatch('management/request', {
      url: `/k8s/clusters/${ clusterId }/v1/catalog.cattle.io.apps/${appName}?link=index`,
      method: 'GET'
    });
    return response
}

// --- Namespace and Repo Installation ---

async function createNamespace(store: Store<any>, clusterId: string, ns: string) {
    try {
        await rancherRequest(store, {
            url: `/k8s/clusters/${clusterId}/v1/namespaces`,
            method: 'POST',
            data: { apiVersion: "v1", kind: "Namespace", metadata: { name: ns } }
        });
    } catch(e: any) {
        if (e?.status !== 409) throw e; // Ignore if it already exists
    }
}

export async function installRepos(store: Store<any>, cluster: Cluster, prefix: string) {
  await createNamespace(store, cluster.id, AGENTS_NAMESPACE);
  await createNamespace(store, cluster.id, KUBEARMOR_NAMESPACE);

  const cleanName = cluster.spec.displayName.replace(/[^a-zA-Z0-9]/g, '');
  
  // Install ConfigMap, Deployment, Service
  const configMapPayload = { metadata: { name: CONFIG_MAP_NAME, namespace: AGENTS_NAMESPACE }, data: { clusterName: `${prefix}${cleanName}` }};
  await rancherRequest(store, { url: `/k8s/clusters/${ cluster.id }/v1/configmaps`, method: 'POST', data: configMapPayload }, `Failed to create ConfigMap on ${cluster.name}`).catch(e => { if (e?.status !== 409) throw e; });
  
  const deploymentPayload = {
    "type": "apps.deployment",
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
        "labels": {
            "app": ACCUKNOX_REPO_NAME
        },
        "name": ACCUKNOX_REPO_NAME,
        "namespace": AGENTS_NAMESPACE
    },
    "spec": {
        "progressDeadlineSeconds": 600,
        "replicas": 1,
        "revisionHistoryLimit": 10,
        "selector": {
            "matchLabels": {
                "app": ACCUKNOX_REPO_NAME
            }
        },
        "strategy": {
            "rollingUpdate": {
                "maxSurge": "25%",
                "maxUnavailable": "25%"
            },
            "type": "RollingUpdate"
        },
        "template": {
            "metadata": {
                "creationTimestamp": null,
                "labels": {
                    "app": ACCUKNOX_REPO_NAME
                },
                "namespace": AGENTS_NAMESPACE
            },
            "spec": {
                "containers": [
                    {
                        "image": "harbor.do.accuknox.com/npci/accuknox-rancher-ui-extension:latest",
                        "imagePullPolicy": "Always",
                        "name": "container-0",
                        "resources": {},
                        "securityContext": {},
                        "terminationMessagePath": "/dev/termination-log",
                        "terminationMessagePolicy": "File"
                    }
                ],
                "dnsPolicy": "ClusterFirst",
                "restartPolicy": "Always",
                "schedulerName": "default-scheduler",
                "securityContext": {},
                "terminationGracePeriodSeconds": 30
            }
        }
      },
  }
  await rancherRequest(store, { url: `/k8s/clusters/${ cluster.id }/v1/apps.deployments`, method: 'POST', data: deploymentPayload }, `Failed to create Deployment on ${cluster.name}`).catch(e => { if (e?.status !== 409) throw e; });

  const servicePayload = {
      "type": "service",
      "apiVersion": "v1",
      "kind": "Service",
      "metadata": {
          "name": ACCUKNOX_REPO_NAME,
          "namespace": AGENTS_NAMESPACE,
      },
      "spec": {
          "internalTrafficPolicy": "Cluster",
          "ipFamilies": [
              "IPv4"
          ],
          "ipFamilyPolicy": "SingleStack",
          "ports": [
              {
                  "name": "port1",
                  "port": 8080,
                  "protocol": "TCP",
                  "targetPort": 8080
              }
          ],
          "selector": {
            "app": ACCUKNOX_REPO_NAME
          },
          "sessionAffinity": "None",
          "type": "ClusterIP"
      }
  }
  await rancherRequest(store, { url: `/k8s/clusters/${ cluster.id }/v1/services`, method: 'POST', data: servicePayload }, `Failed to create Servuce on ${cluster.name}`).catch(e => { if (e?.status !== 409) throw e; });

  const repoPayload = { metadata: { name: ACCUKNOX_REPO_NAME }, spec: { url: `http://${ACCUKNOX_REPO_NAME}.${AGENTS_NAMESPACE}:8080/charts`, forceUpdate: 'true' } };
  await rancherRequest(store, { url: `/k8s/clusters/${ cluster.id }/v1/catalog.cattle.io.clusterrepo`, method: 'POST', data: repoPayload }, `Failed to create Repo on ${cluster.name}`).catch(e => { if (e?.status !== 409) throw e; });

  store.dispatch('growl/success', { title: `Repo installed on ${cluster.name}`, message: '' });
}

async function installChart(store: Store<any>, cluster: Cluster, chart: any, values: object, releaseName?: string) {
    const data = {
        charts: [{
            chartName: chart.name,
            version: chart.version,
            releaseName: releaseName || chart.releaseName || chart.name,
            values
        }],
        namespace: chart.namespace,
        projectId: cluster.systemProjectId,
        timeout: '600s',
        wait: true,
        forceUpdate: 'true',
    };
    
    await rancherRequest(store, {
        url: `/k8s/clusters/${cluster.id}/v1/catalog.cattle.io.clusterrepos/${ACCUKNOX_REPO_NAME}?action=install`,
        method: 'POST',
        data
    }, `Failed to install ${chart.name} on ${cluster.name}`);

    store.dispatch('growl/success', { title: `${chart.name} Installed on ${cluster.name}`, message: 'Chart installed successfully' });
}


export async function installCwppCharts(store: Store<any>, cluster: Cluster, formData: CwppFormData, clusterConfigName: string) {
    const agentValues = {
        clusterName: clusterConfigName,
        accessKey: formData.accessKey,
        spireHost: formData.spireHost,
        tokenURL: formData.tokenURL,
        ppsHost: formData.ppsHost,
        knoxGateway: formData.knoxGateway,
        admissionController: { enabled: formData.admissionController },
        kyverno: { enabled: formData.kyverno },
    };
    
    await installChart(store, cluster, KUBEARMOR_OPERATOR_CHART, { autoDeploy: true });
    await installChart(store, cluster, AGENTS_CHART, agentValues);
}

export async function installHardeningChart(store: Store<any>, cluster: Cluster) {
    await installChart(store, cluster, CWPP_HARDENING_CHART, {});
}

export async function installKspmCharts(store: Store<any>, cluster: Cluster, formData: KspmFormData, clusterConfigName: string) {
    const sharedValues = {
        cronTab: '30 9 * * *',
        clusterName: clusterConfigName,
        tenantID: formData.tenant,
        authToken: formData.authToken,
        label: formData.label,
        url: formData.cspmURL
    };
    
    for (const kspmChart of KSPM_CHARTS_CONFIG) {
        const chartConfig = { name: kspmChart.chartName, version: kspmChart.version, namespace: AGENTS_NAMESPACE, releaseName: kspmChart.releaseName };

        let chartValues = {};
        switch (kspmChart.chartName) {
            case 'cis-k8s-job':
                chartValues = {
                    url: sharedValues.url, 
                    tenantId: sharedValues.tenantID, 
                    authToken: sharedValues.authToken,
                    cronTab: sharedValues.cronTab,
                    clusterName: sharedValues.clusterName,
                    label: sharedValues.label
                };
                break;
            case 'k8s-risk-assessment-job':
                chartValues = {
                    URL: sharedValues.url, 
                    tenantID: sharedValues.tenantID,
                    authToken: sharedValues.authToken,
                    cronTab: sharedValues.cronTab,
                    clusterName: sharedValues.clusterName,
                    label: sharedValues.label
                };
                break;
            case 'kiem-job':
                chartValues = {
                    URL: sharedValues.url, 
                    tenantID: sharedValues.tenantID,
                    authToken: sharedValues.authToken,
                    cronTab: sharedValues.cronTab,
                    clusterName: sharedValues.clusterName,
                    label: sharedValues.label
                };
                break;

            default:
                chartValues = {}; 
                break;
        }
        await installChart(store, cluster, chartConfig, chartValues);
    }
}
