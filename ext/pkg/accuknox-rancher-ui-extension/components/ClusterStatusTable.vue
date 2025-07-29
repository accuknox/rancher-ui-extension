<template>
  <div>
    <!-- Control bar for "Select All" -->
    <div v-if="clusters.length > 0" class="select-all-bar">
      <input 
        id="select-all-checkbox"
        type="checkbox" 
        :checked="allSelected" 
        @change="toggleSelectAll" 
      />
      <label for="select-all-checkbox">
        {{ allSelected ? 'Deselect All Clusters' : 'Select All Clusters' }}
      </label>
    </div>

    <!-- Loading Spinner -->
    <div v-if="loading" class="feedback-container">
      <div class="spinner"></div>
      <p>Loading Clusters...</p>
    </div>

    <!-- Empty State Message -->
    <div v-else-if="!clusters.length" class="feedback-container">
      <p>No clusters found.</p>
    </div>

    <!-- Responsive Card Grid -->
    <div v-else class="cluster-grid">
      <div v-for="cluster in clusters" :key="cluster.id" class="cluster-card">
        <!-- Card Header -->
        <div class="card-header">
          <h3 class="cluster-name">{{ cluster.name }}</h3>
          <input
            type="checkbox"
            :value="cluster.id"
            :checked="selectedClusterIds.includes(cluster.id)"
            @change="toggleSelection(cluster.id)"
            class="cluster-checkbox"
          />
        </div>

        <!-- Card Body with Status List -->
        <div class="card-body">
          <ul class="status-list">
            <li class="status-item">
              <span class="status-label">Repo Status</span>
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
            </li>
            <li class="status-item">
              <span class="status-label">Chart Status</span>
              <span :class="cluster.allChartsPresent ? 'status-green' : 'status-red'">
                {{ cluster.allChartsPresent ? 'Ready ✅' : '❌ Not Ready' }}
              </span>
            </li>
            <li class="status-item">
              <span class="status-label">CWPP Status</span>
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
            </li>
            <li class="status-item">
              <span class="status-label">Hardening Status</span>
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
            </li>
        <!-- KSPM STATUS BLOCK -->
        <li class="status-item status-item-multiline">
              <span class="status-label">KSPM Status</span>
              <span :class="cluster.kspmAvailable ? 'status-green' : 'status-red'">
                <template v-if="cluster.kspmAvailable">
                  <div class="status-links-group">
                    <a :href="`/dashboard/c/${cluster.id}/apps/catalog.cattle.io.app/agents/accuknox-cis-k8s-job`" class="status-link">
                      CIS Benchmark
                    </a>
                    <a :href="`/dashboard/c/${cluster.id}/apps/catalog.cattle.io.app/agents/accuknox-k8s-risk-assessment-job`" class="status-link">
                      Risk Assessment
                    </a>
                    <a :href="`/dashboard/c/${cluster.id}/apps/catalog.cattle.io.app/agents/accuknox-kiem-job`" class="status-link">
                      KIEM
                    </a>
                  </div>
                </template>
                <template v-else>
                  ❌ Not Installed
                </template>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { ClusterDetail } from '../types'; // Adjust path if needed

export default defineComponent({
  name: 'ClusterStatusCards', // Renamed for clarity
  props: {
    clusters: {
      type: Array as PropType<ClusterDetail[]>,
      required: true,
    },
    selectedClusterIds: {
      type: Array as PropType<string[]>,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:selectedClusterIds'],
  setup(props, { emit }) {
    const allSelected = computed(() =>
      props.clusters.length > 0 && props.selectedClusterIds.length === props.clusters.length
    );

    const toggleSelectAll = () => {
      const newSelectedIds = allSelected.value ? [] : props.clusters.map(c => c.id);
      emit('update:selectedClusterIds', newSelectedIds);
    };
    
    const toggleSelection = (clusterId: string) => {
        const newSelected = [...props.selectedClusterIds];
        const index = newSelected.indexOf(clusterId);
        if (index > -1) {
            newSelected.splice(index, 1);
        } else {
            newSelected.push(clusterId);
        }
        emit('update:selectedClusterIds', newSelected);
    };

    return { allSelected, toggleSelectAll, toggleSelection };
  },
});
</script>

<style scoped>
/* --- Main Layout --- */
.cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

/* --- Card Styling --- */
.cluster-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
  overflow: hidden;
}

.cluster-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* --- Card Header --- */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.cluster-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.cluster-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* --- Card Body & Status List --- */
.card-body {
  padding: 16px;
}

.status-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.status-item:not(:last-child) {
  border-bottom: 1px solid #f3f4f6;
}

.status-label {
  color: #4b5563; /* gray-600 */
}

/* --- Status Indicators --- */
.status-green {
  color: #059669; /* emerald-600 */
  font-weight: 500;
}

.status-red {
  color: #dc2626; /* red-600 */
  font-weight: 500;
}

/* --- Top Control Bar --- */
.select-all-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.select-all-bar label {
  font-weight: 500;
  cursor: pointer;
}
.select-all-bar input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* --- Loading and Empty States --- */
.feedback-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #6b7280;
  font-size: 1.1rem;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #2563eb;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

.status-link:hover {
  color: #1d4ed8; /* blue-800 */
}

/* --- Styles for multi-line status items --- */
.status-item-multiline {
  /* Aligns the "KSPM Status" label to the top of the links block */
  align-items: flex-start;
}

.status-links-group {
  display: flex;
  flex-direction: column;
  /* Aligns the links to the right edge of the card */
  align-items: flex-end;
  gap: 4px; /* Adds a small space between the links */
  text-align: right;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>