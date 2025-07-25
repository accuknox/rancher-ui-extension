<script>
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { handleGrowl } from '../utils/handle-growl';
import Loading from '../components/Loading.vue';

export default {
  data() {
    return {
      clusterDetails: [],
      clusters: [],
      message: '',
      form: {
        accessKey: '',
        clusterName: '',
        tokenURL: '',
        spireHost: '',
        ppsHost: '',
        knoxGateway: '',
        admissionController: false,
        kyverno: false
      },
      loading: false,
      showModal: false,
      repoInstalling: false,
      chartInstalling: false,
      hardeningChartInstalling: false,
      selectedClusterIds: [],
      selectAllClusterIds: false,
    };
  },
  components: { Loading },
  async mounted() {
    this.loading = true;
    try {
      const res = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.CLUSTER,
      });
      const clusters = res || [];
      const clusterDetails = []
      console.log(clusters);
      for (const cluster of clusters) {
        let allRepos = []
        let allReposPresent = false;
        let allChartsPresent = false
        let hardeningAvailable = false;
        let allAppPresent = false;
        let error = '';
        try{
          const res = await this.$store.dispatch('management/request', {
            url:    `/k8s/clusters/${ cluster.id }/v1/catalog.cattle.io.clusterrepo`,
            method: 'GET',
          });
          allRepos = res.data
          allReposPresent = this.checkAllReposPresent(allRepos);

          if (allReposPresent) {
            allChartsPresent = await this.checkChartAvailability(cluster.id);
          }

          const apps = await this.getInstallConfig(cluster.spec.displayName)
          for (const app of apps) {
            const appDetails = await this.getAppDetails(cluster.id, `${app.namespace}/${app.chartName}`)
            allAppPresent = !!appDetails?.id;
          }

          const hardeningAppDetails = await this.getAppDetails(cluster.id, `kubearmor/accuknox-cwpp-hardening-policies`)
          hardeningAvailable = !!hardeningAppDetails?.id;
        } catch (e) {
          error = '(Error)'
        }

        clusterDetails.push({
          id: `${cluster.id}`,
          name: `${cluster.spec.displayName}${error}`,
          systemProjectId: cluster.systemProjectId,
          repos: allRepos,
          allReposPresent: allReposPresent,
          allChartsPresent: allChartsPresent,
          allAppPresent: allAppPresent,
          hardeningAvailable: hardeningAvailable,
        });
      }
      this.clusterDetails = clusterDetails
    } catch (e) {
      handleGrowl({ error: e, store: this.$store });
    }
    this.loading = false;
  },
  watch: {
    selectedClusterIds(newVal) {
      this.selectAllClusterIds = newVal.length === this.clusterDetails.length;
    }
  },
  methods: {
    toggleSelectAllClusterIds() {
      if (this.selectAllClusterIds) {
        this.selectedClusterIds = this.clusterDetails.map(c => c.id);
      } else {
        this.selectedClusterIds = [];
      }
    },
    checkAllReposPresent(allRepos) {
      const requiredRepo = 'accuknox-charts';
      return allRepos.some(r => r.id === requiredRepo);
    },
    async checkChartAvailability(clusterId) {
      const repoName = 'accuknox-charts'
      try {
          const response = await this.$store.dispatch('management/request', {
            url:    `/k8s/clusters/${ clusterId }/v1/catalog.cattle.io.clusterrepos/${repoName}?link=index`,
            method: 'GET',
          });

        return !!response?.entries;
      } catch {
        return false;
      }
    },
    async installHardeningChart(cluster) {
      this.loading = true;

      const data = {
        charts: [
          {
            chartName: 'accuknox-cwpp-hardening-policies',
            version: '0.1.0',
            releaseName: 'accuknox-cwpp-hardening-policies',
            values: {}
          }
        ],
        namespace: 'kubearmor',
        projectId: cluster.systemProjectId,
        timeout: '600s',
        wait: true
      };

      try {
        await this.$store.dispatch('management/request', {
          url: `/k8s/clusters/${cluster.id}/v1/catalog.cattle.io.clusterrepos/accuknox-charts?action=install`,
          method: 'POST',
          data
        });
        this.$store.dispatch('growl/success', {
          title: `Hardening Policies Installed on ${cluster.name}`,
          message: 'accuknox-cwpp-hardening-policies installed successfully'
        });
      } catch (e) {
        handleGrowl({ error: e, store: this.$store, overrideStatusText: `AccuKnox Charts are ${e._statusText.toLowerCase()} on ${cluster.name}` });
      }
      this.loading = false;
    },
    async getAppDetails(clusterId, appName) {
      try {
        
        const response = await this.$store.dispatch('management/request', {
          url: `/k8s/clusters/${ clusterId }/v1/catalog.cattle.io.apps/${appName}?link=index`,
          method: 'GET'
        });
        return response
      } catch {
        return null
      }
    },
    openModalWithDefaults() {
      this.form = {
        accessKey: '',
        clusterName: '',
        tokenURL: 'cwpp.demo.accuknox.com',
        spireHost: 'spire.demo.accuknox.com',
        ppsHost: 'pps.demo.accuknox.com',
        knoxGateway: 'knox-gw.demo.accuknox.com:3000',
        admissionController: false,
        kyverno: false
      };
      this.showModal = true;
    },

    getInstallConfig(clusterName) {
      return [
        {
          name: 'accuknox-charts',
          chartName: 'kubearmor-operator',
          version: 'v1.5.7',
          namespace: 'kubearmor',
          values: { autoDeploy: true }
        },
        {
          name: 'accuknox-charts',
          chartName: 'agents-chart',
          version: 'v0.10.7',
          namespace: 'agents',
          values: {
            clusterName: `${this.form.clusterNamePrefix}${clusterName}`,
            accessKey: this.form.accessKey,
            spireHost: this.form.spireHost,
            tokenURL: this.form.tokenURL,
            ppsHost: this.form.ppsHost,
            knoxGateway: this.form.knoxGateway,
            admissionController: { enabled: this.form.admissionController },
            kyverno: { enabled: this.form.kyverno }
          }
        }
      ];
    },

    async installCharts() {
      this.showModal = false;
      this.chartInstalling = true;
      this.loading = true;


      const selected = this.clusterDetails.filter(c => this.selectedClusterIds.includes(c.id));
      for (const cluster of selected) {
        const cleanName = cluster.name.replace(/[^a-zA-Z0-9]/g, '');
        const charts = this.getInstallConfig(cleanName);

        for (const chart of charts) {
          const data = {
            charts: [
              {
                chartName: chart.chartName,
                version: chart.version,
                releaseName: chart.chartName,
                annotations: {
                  'catalog.cattle.io/ui-source-repo-type': 'cluster',
                  'catalog.cattle.io/ui-source-repo': chart.name
                },
                values: {
                  ...chart.values,
                  global: {
                    cattle: {
                      clusterId: cluster.id,
                      clusterName: cluster.name,
                      systemProjectId: cluster.systemProjectId,
                      url: this.url
                    }
                  }
                }
              }
            ],
            forceUpdate: 'true',
            namespace: chart.namespace,
            projectId: cluster.projectId,
            timeout: '600s',
            wait: true
          };

          try {
            const response = await this.$store.dispatch('rancher/request', {
              url: `/k8s/clusters/${cluster.id}/v1/catalog.cattle.io.clusterrepos/${chart.name}?action=install`,
              method: 'POST',
              data
            });

            this.$store.dispatch('growl/success', {
              title: `AccuKnox ${chart.chartName} installed successfully  on ${cluster.name}`,
              message: ''
            });

          } catch (e) {
            handleGrowl({ error: e, store: this.$store });
          }
        }
      }

      
      this.loading = false;

      this.chartInstalling = false;
    },

    async createNamespace(clusterId, ns) {
      const nsPayload = {
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: ns
        }
      };

      try {
        const response = await this.$store.dispatch('rancher/request', {
          url: `/k8s/clusters/${clusterId}/v1/namespaces`,
          method: 'POST',
          data: nsPayload
        });

        return response;
      } catch (error) {
        const status = error?.status;

        if (status === 409) {
          return { alreadyExists: true, namespace: ns };
        }
        throw error;
      }
    },

    async installRepos(clusterId) {
      const name = 'accuknox-charts';
      const opt = { cluster: clusterId };
      this.loading = true;


      try {
        const res = await this.$store.dispatch('management/request', {
          url:    `/k8s/clusters/${ clusterId }/v1/catalog.cattle.io.clusterrepo`,
          method: 'GET',
        });
        const allRepos = res.data

        const exists = allRepos.find(r => r.id === name);

        await this.createNamespace(clusterId, 'agents');
        await this.createNamespace(clusterId, 'kubearmor');

        const deploymentPayload = {
            "type": "apps.deployment",
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "labels": {
                    "app": "accuknox-charts"
                },
                "name": "accuknox-charts",
                "namespace": "agents"
            },
            "spec": {
                "progressDeadlineSeconds": 600,
                "replicas": 1,
                "revisionHistoryLimit": 10,
                "selector": {
                    "matchLabels": {
                        "app": "accuknox-charts"
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
                            "app": "accuknox-charts"
                        },
                        "namespace": "agents"
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

        try {
          const deployment = await this.$store.dispatch('management/request', {
            url:    `/k8s/clusters/${ clusterId }/v1/apps.deployments`,
            method: 'POST',
            data: deploymentPayload
          });
        } catch (error) {
          const status = error?.status;

          if (status !== 409) {
            throw error;
          }
        }

        const servicePayload = {
            "type": "service",
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": "accuknox-charts",
                "namespace": "agents",
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
                  "app": "accuknox-charts"
                },
                "sessionAffinity": "None",
                "type": "ClusterIP"
            }
        }

        try {
          const service = await this.$store.dispatch('management/request', {
            url:    `/k8s/clusters/${ clusterId }/v1/services`,
            method: 'POST',
            data: servicePayload
          });
        } catch (error) {
          const status = error?.status;

          if (status !== 409) {
            throw error;
          }
        }

        try {
          const repo = await this.$store.dispatch('management/request', {
            url:    `/k8s/clusters/${ clusterId }/v1/catalog.cattle.io.clusterrepo`,
            method: 'POST',
            data: {
              metadata: { name },
              spec: {
                url: 'http://accuknox-charts.agents:8080/charts',
                forceUpdate: 'true',
              },
            }
          });
        } catch (error) {
          const status = error?.status;

          if (status !== 409) {
            throw error;
          }
        }

        this.checkChartAvailability(clusterId);

        this.$store.dispatch('growl/success', {
          title: (`Repo installed in ${clusterId}`),
          message: ''
        });
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
      }

      this.loading = false;

    },

    async installReposForSelectedClusters() {
      this.loading = true;
      this.repoInstalling = true;
      const selected = this.clusterDetails.filter(c => this.selectedClusterIds.includes(c.id));
      for (const cluster of selected) {
        await this.installRepos(cluster.id);
      }
      this.repoInstalling = false;
      this.loading = false;
    },
    async installHardeningChartForSelectedClusters() {
      this.loading = true;
      this.hardeningChartInstalling = true;
      const selected = this.clusterDetails.filter(c => this.selectedClusterIds.includes(c.id));
      for (const cluster of selected) {
        await this.installHardeningChart(cluster);
      }
      this.hardeningChartInstalling = false;
      this.loading = false;
    },
  },
};
</script>

<template>

  <div  class="container p-4">
    <div class="button-bar">
    <button class="btn btn-primary" :disabled="repoInstalling"  @click="installReposForSelectedClusters">
      Install Repos
    </button>
    <button class="btn btn-primary" :disabled="chartInstalling" @click="openModalWithDefaults">
      Install Charts
    </button>
    <button class="btn btn-primary" :disabled="hardeningChartInstalling" @click="installHardeningChartForSelectedClusters">
      Install Hardening Policies
    </button>
  </div>
    <table class="modern-table">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              v-model="selectAllClusterIds"
              @change="toggleSelectAllClusterIds"
            />
            Select All
          </th>
          <th>Repo Status</th>
          <th>Chart Status</th>
          <th>Apps Status</th>
          <th>Hardening Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(cluster, index) in clusterDetails" :key="cluster.id">
          <td>
            <input
                type="checkbox"
                :value="cluster.id"
                v-model="selectedClusterIds"
              />
            {{ cluster.name }}
          </td>
          <td>
            <span :class="cluster.allReposPresent ? 'status-green' : 'status-red'">
              <template v-if="cluster.allReposPresent">
                <a
                  :href="`/dashboard/c/${cluster.id}/apps/catalog.cattle.io.clusterrepo/accuknox-charts`"
                  class="underline text-blue-600 hover:text-blue-800"
                >
                  View
                </a>
              </template>
              <template v-else>
                ❌ Not Installed
              </template>
            </span>
          </td>
          <td>
            <span :class="cluster.allChartsPresent ? 'status-green' : 'status-red'">
              {{ cluster.allChartsPresent ? '✅ Ready' : '❌ Not Ready' }}
            </span>
          </td>
          <td>
            <span :class="cluster.allAppPresent ? 'status-green' : 'status-red'">
              <template v-if="cluster.allAppPresent">
                <a
                  :href="`/dashboard/c/${cluster.id}/apps/catalog.cattle.io.app/agents/agents-chart`"
                  class="underline text-blue-600 hover:text-blue-800"
                >
                  View
                </a>
              </template>
              <template v-else>
                ❌ Not Installed
              </template>
            </span>
          </td>
          <td>
            <span :class="cluster.hardeningAvailable ? 'status-green' : 'status-red'">
              <template v-if="cluster.hardeningAvailable">
                <router-link
                  :to="`/c/${cluster.id}/policies`"
                  class="underline text-blue-600 hover:text-blue-800"
                >
                  View
                </router-link>
              </template>
              <template v-else>
                ❌ Not Installed
              </template>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <Loading v-if="loading" />
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2 class="text-lg font-bold mb-4">AccuKnox Agent Configuration</h2>

        <label>Access Key</label>
        <input v-model="form.accessKey" class="input" placeholder="Enter Access Key" />

        <label class="mt-4">Cluster Name Prefix</label>
        <input v-model="form.clusterNamePrefix" class="input" placeholder="Cluster Name Prefix" />

        <label class="mt-4">Token URL</label>
        <input v-model="form.tokenURL" class="input" placeholder="cwpp.demo.accuknox.com" />

        <label class="mt-4">Spire Host</label>
        <input v-model="form.spireHost" class="input" placeholder="spire.demo.accuknox.com" />

        <label class="mt-4">PPS Host</label>
        <input v-model="form.ppsHost" class="input" placeholder="pps.demo.accuknox.com" />

        <label class="mt-4">Knox Gateway</label>
        <input v-model="form.knoxGateway" class="input" placeholder="knox-gw.demo.accuknox.com:3000" />

        <label class="mt-4 block">Enable Admission Controller</label>
        <input type="checkbox" v-model="form.admissionController" />

        <label class="mt-4 block">Enable Kyverno</label>
        <input type="checkbox" v-model="form.kyverno" />

        <div class="mt-6">
          <button class="btn role-primary" @click="installCharts">Install</button>
          <button class="btn ml-2" @click="showModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.button-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn:disabled {
  background-color: #d1d5db;
  color: #6b7280;
  cursor: not-allowed;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  min-width: 400px;
  text-align: center;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}
.input {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Segoe UI', sans-serif;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.modern-table thead {
  background-color: #f3f4f6;
  color: #111827;
  font-weight: 600;
}

.modern-table th,
.modern-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.modern-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.modern-table tbody tr:hover {
  background-color: #f0fdf4;
}

.status-green {
  color: #059669; /* emerald-600 */
  font-weight: 500;
}

.status-red {
  color: #dc2626; /* red-600 */
  font-weight: 500;
}
</style>
