<script>
import { MANAGEMENT } from '@shell/config/types';
import * as AccuKnoxService from '../services/accuknox';
import { processClusterStatus } from '../utils/cluster-processor';
import { handleGrowl } from '../utils/handle-growl';

import Loading from '../components/Loading.vue';
import ClusterStatusTable from '../components/ClusterStatusTable.vue';
import InstallReposModal from '../components/InstallReposModal.vue';
import InstallCwppModal from '../components/InstallCwppModal.vue';
import InstallKspmModal from '../components/InstallKspmModal.vue';

export default {
  name: 'AccuKnoxDashboard',
  
  components: {
    Loading,
    ClusterStatusTable,
    InstallReposModal,
    InstallCwppModal,
    InstallKspmModal
  },

  data() {
    return {
      isLoading: false,
      clusterDetails: [], // This will hold the processed ClusterDetail[]
      allClusters: [], // This will hold the raw Cluster[] from the API
      selectedClusterIds: [],
      
      // Modal visibility state
      showReposModal: false,
      showCwppModal: false,
      showKspmModal: false,
    };
  },

  computed: {
    hasSelection() {
      return this.selectedClusterIds.length > 0;
    },
    selectedClusters() {
      // Filter the raw clusters based on selected IDs
      return this.allClusters.filter(c => this.selectedClusterIds.includes(c.id));
    }
  },

  async mounted() {
    await this.loadClusterData();
  },

  methods: {
    async loadClusterData() {
      this.isLoading = true;
      try {
        this.allClusters = await AccuKnoxService.fetchAllClusters(this.$store);
        
        const promises = this.allClusters.map(cluster => processClusterStatus(this.$store, cluster));
        this.clusterDetails = await Promise.all(promises);
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
      } finally {
        this.isLoading = false;
      }
    },

    // --- Handlers for Modal Events ---
    async handleInstallRepos(formData) {
      this.showReposModal = false;
      this.isLoading = true;
      try {
        for (const cluster of this.selectedClusters) {
          const details = this.clusterDetails.find(d => d.id === cluster.id);
          await AccuKnoxService.installRepos(this.$store, cluster, formData.clusterNamePrefix);
        }
      } finally {
        await this.loadClusterData(); // Refresh data, which sets isLoading=false
      }
    },
    
    async handleInstallCwpp(formData) {
      this.showCwppModal = false;
      this.isLoading = true;
      try {
        for (const cluster of this.selectedClusters) {
           const details = this.clusterDetails.find(d => d.id === cluster.id);
           // Assumes the cluster name is part of the detail object you fetch
           const configName = details.name.match(/\(([^)]+)\)/)?.[1] || cluster.name;
           await AccuKnoxService.installCwppCharts(this.$store, cluster, formData, configName);
        }
      } finally {
        await this.loadClusterData();
      }
    },

    async handleInstallHardening() {
      this.isLoading = true;
      try {
        for (const cluster of this.selectedClusters) {
          await AccuKnoxService.installHardeningChart(this.$store, cluster);
        }
      } finally {
        await this.loadClusterData();
      }
    },

    async handleInstallKspm(formData) {
      this.showKspmModal = false;
      this.isLoading = true;
      try {
        for (const cluster of this.selectedClusters) {
           const details = this.clusterDetails.find(d => d.id === cluster.id);
           const configName = details.name.match(/\(([^)]+)\)/)?.[1] || cluster.name;
           await AccuKnoxService.installKspmCharts(this.$store, cluster, formData, configName);
        }
      } finally {
        await this.loadClusterData();
      }
    },
  }
};
</script>

<template>
  <div class="container p-4">
    <div class="button-bar">
      <!-- Buttons remain the same -->
      <button class="btn btn-primary" :disabled="isLoading || !hasSelection" @click="showReposModal = true">
        Install Repos
      </button>
      <button class="btn btn-primary" :disabled="isLoading || !hasSelection" @click="showCwppModal = true">
        Install CWPP
      </button>
      <button class="btn btn-primary" :disabled="isLoading || !hasSelection" @click="handleInstallHardening">
        Install Hardening
      </button>
      <button class="btn btn-primary" :disabled="isLoading || !hasSelection" @click="showKspmModal = true">
        Install KSPM
      </button>
    </div>

    <Loading v-if="isLoading" />

    <ClusterStatusTable
      v-else
      :clusters="clusterDetails"
      :selected-cluster-ids.sync="selectedClusterIds"
      :loading="isLoading"
    />
    
    <!-- Modals -->
    <InstallReposModal v-if="showReposModal" @cancel="showReposModal = false" @install="handleInstallRepos" />
    <InstallCwppModal v-if="showCwppModal" @cancel="showCwppModal = false" @install="handleInstallCwpp" />
    <InstallKspmModal v-if="showKspmModal" @cancel="showKspmModal = false" @install="handleInstallKspm" />

  </div>
</template>