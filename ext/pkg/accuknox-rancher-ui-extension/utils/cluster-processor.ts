import { Store } from 'vuex';
import { Cluster, ClusterDetail } from '../types';
import { ACCUKNOX_REPO_NAME, AGENTS_CHART, CWPP_HARDENING_CHART, KUBEARMOR_OPERATOR_CHART, KSPM_CHARTS_CONFIG } from '../constants';

// Helper to check if a specific app is installed
async function isAppInstalled(store: Store<any>, clusterId: string, namespace: string, appName: string): Promise<boolean> {
  try {
    const res = await store.dispatch('management/request', {
      url: `/k8s/clusters/${clusterId}/v1/catalog.cattle.io.apps/${namespace}/${appName}`,
      method: 'GET',
    });
    return !!res?.id;
  } catch (e) {
    return false;
  }
}

export async function processClusterStatus(store: Store<any>, cluster: Cluster): Promise<ClusterDetail> {
  let savedClusterName = '';
  let allReposPresent = false;
  let allChartsPresent = false;
  let allAppPresent = false;
  let hardeningAvailable = false;
  let kspmAvailable = false;

  try {
    // 1. Check for Repo
    const repoRes = await store.dispatch('management/request', {
      url: `/k8s/clusters/${cluster.id}/v1/catalog.cattle.io.clusterrepo`, method: 'GET'
    });
    allReposPresent = repoRes.data.some((r: any) => r.id === ACCUKNOX_REPO_NAME);

    if (allReposPresent) {
      // 2. Check if repo index is available (charts are ready)
      try {
        const chartRes = await store.dispatch('management/request', {
          url: `/k8s/clusters/${cluster.id}/v1/catalog.cattle.io.clusterrepos/${ACCUKNOX_REPO_NAME}?link=index`, method: 'GET'
        });
        allChartsPresent = !!chartRes?.entries;
      } catch (e) {
        allChartsPresent = false;
      }
    }
    
    // 3. Get cluster name from ConfigMap
    try {
        const cmRes = await store.dispatch('management/request', {
            url: `/k8s/clusters/${cluster.id}/v1/configmaps/agents/accuknoxrancheruiextentionconfig`, method: 'GET'
        });
        savedClusterName = `(${cmRes.data.clusterName})`;
    } catch(e) {
        // ConfigMap not found, name is empty
    }


    // 4. Check for installed apps
    const agentApp = await isAppInstalled(store, cluster.id, AGENTS_CHART.namespace, AGENTS_CHART.name);
    const operatorApp = await isAppInstalled(store, cluster.id, KUBEARMOR_OPERATOR_CHART.namespace, KUBEARMOR_OPERATOR_CHART.name);
    allAppPresent = agentApp && operatorApp;

    hardeningAvailable = await isAppInstalled(store, cluster.id, CWPP_HARDENING_CHART.namespace, CWPP_HARDENING_CHART.releaseName);
    kspmAvailable = await isAppInstalled(store, cluster.id, AGENTS_CHART.namespace, KSPM_CHARTS_CONFIG[0].releaseName);
    
  } catch (e: any) {
    savedClusterName = `(Error: ${e.message || 'Failed to fetch status'})`;
  }
  
  return {
    id: cluster.id,
    name: `${cluster.spec.displayName} ${savedClusterName}`,
    systemProjectId: cluster.systemProjectId,
    allReposPresent,
    allChartsPresent,
    allAppPresent,
    hardeningAvailable,
    kspmAvailable,
  };
}