<template>
    <div class="modal-overlay">
      <div class="modal-content">
        <h2 class="text-lg font-bold mb-4">AccuKnox CWPP Agent Configuration</h2>
  
        <label>Access Key</label>
        <input v-model="form.accessKey" class="input" placeholder="Enter Access Key" />
  
        <label class="mt-4">Token URL</label>
        <input v-model="form.tokenURL" class="input" placeholder="cwpp.demo.accuknox.com" />
  
        <label class="mt-4">Spire Host</label>
        <input v-model="form.spireHost" class="input" placeholder="spire.demo.accuknox.com" />
  
        <label class="mt-4">PPS Host</label>
        <input v-model="form.ppsHost" class="input" placeholder="pps.demo.accuknox.com" />
  
        <label class="mt-4">Knox Gateway</label>
        <input v-model="form.knoxGateway" class="input" placeholder="knox-gw.demo.accuknox.com:3000" />
  
        <div class="mt-4 checkbox-group">
          <input type="checkbox" id="admissionController" v-model="form.admissionController" />
          <label for="admissionController">Enable Admission Controller</label>
        </div>
  
        <div class="mt-2 checkbox-group">
          <input type="checkbox" id="kyverno" v-model="form.kyverno" />
          <label for="kyverno">Enable Kyverno</label>
        </div>
  
        <div class="mt-6">
          <button class="btn role-primary" @click="onInstall">Install</button>
          <button class="btn ml-2" @click="onCancel">Cancel</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'InstallCwppModal',
  
    data() {
      return {
        // default values
        form: {
          accessKey: '',
          tokenURL: 'cwpp.demo.accuknox.com',
          spireHost: 'spire.demo.accuknox.com',
          ppsHost: 'pps.demo.accuknox.com',
          knoxGateway: 'knox-gw.demo.accuknox.com:3000',
          admissionController: false,
          kyverno: false,
        },
      };
    },
  
    methods: {
      onInstall() {
        this.$emit('install', this.form);
      },
      onCancel() {
        this.$emit('cancel');
      },
    },
  };
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
  