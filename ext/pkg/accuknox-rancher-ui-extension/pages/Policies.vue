<script>
import { handleGrowl } from '../utils/handle-growl';

export default {
  data() {
    return {
      policies: [],
      loading: true,
      error: null,
      clusterId: this.$route.params.cluster
    };
  },
  async mounted() {
    try {

      const response = await this.$store.dispatch('management/request', {
        url: `/k8s/clusters/${ this.clusterId }/v1/security.kubearmor.com.KubeArmorClusterPolicy?exclude=metadata.managedFields`,
        method: 'GET'
      });

      const KubeArmorClusterPolicy = response?.data || [];
      this.policies = this.policies.concat(KubeArmorClusterPolicy);

      const responseKubeArmorPolicy = await this.$store.dispatch('management/request', {
        url: `/k8s/clusters/${ this.clusterId }/v1/security.kubearmor.com.KubeArmorPolicy?exclude=metadata.managedFields`,
        method: 'GET'
      });

      const KubeArmorPolicy = responseKubeArmorPolicy?.data || [];
      this.policies = this.policies.concat(KubeArmorPolicy);
      console.log(this.loading)
    } catch (e) {
      this.error = e;
      handleGrowl({ error: e, store: this.$store });
    } finally {
      this.loading = false;
    }
  }
};
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold mb-4">📜 Active Policies</h1>

    <div v-if="loading" class="text-gray-500">Loading policies...</div>
    <div v-else-if="error" class="text-red-500">❌ Failed to load policies.</div>
    <div v-else-if="policies.length === 0" class="text-gray-500">No policies found.</div>

    <table v-else class="min-w-full border border-gray-200 mt-4">
      <thead class="bg-gray-100 text-left">
        <tr>
          <th class="p-2 border-b border-gray-300">Name</th>
          <th class="p-2 border-b border-gray-300">Namespace</th>
          <th class="p-2 border-b border-gray-300">Age</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="policy in policies" :key="policy.metadata.uid" class="hover:bg-gray-50">
          <td>
            <span class='status-green'>
                <a
                  :href="`/dashboard/c/${clusterId}/explorer/security.kubearmor.com.${policy.kind.toLowerCase()}/${policy.metadata.name}`"
                  class="underline text-blue-600 hover:text-blue-800"
                >
                {{ policy.metadata.name }}
                </a>
            </span>
          </td>
          <td class="p-2 border-b">{{ policy.metadata.namespace || 'cluster-wide' }}</td>
          <td class="p-2 border-b">
            {{ new Date(policy.metadata.creationTimestamp).toLocaleString() }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
