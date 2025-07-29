<template>
    <table class="modern-table">
      <thead>
        <tr>
          <th>
            <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
            Cluster Name
          </th>
          <th>Repo Status</th>
          <th>Chart Status</th>
          <th>CWPP Status</th>
          <th>Hardening Status</th>
          <th>KSPM Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cluster in clusters" :key="cluster.id">
          <td>
            <input
              type="checkbox"
              :value="cluster.id"
              :checked="selectedClusterIds.includes(cluster.id)"
              @change="toggleSelection(cluster.id)"
            />
            {{ cluster.name }}
          </td>
          <td>
            <span :class="cluster.allReposPresent ? 'status-green' : 'status-red'">
              {{ cluster.allReposPresent ? '✅ Installed' : '❌ Not Installed' }}
            </span>
          </td>
          <td>
            <span :class="cluster.allChartsPresent ? 'status-green' : 'status-red'">
              {{ cluster.allChartsPresent ? '✅ Ready' : '❌ Not Ready' }}
            </span>
          </td>
          <!-- ... other status columns ... -->
        </tr>
        <tr v-if="!clusters.length && !loading">
          <td colspan="6" class="text-center">No clusters found.</td>
        </tr>
      </tbody>
    </table>
  </template>
  
  <script lang="ts">
  import { defineComponent, PropType, computed } from 'vue';
  import { ClusterDetail } from '../types';
  
  export default defineComponent({
    name: 'ClusterStatusTable',
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
  