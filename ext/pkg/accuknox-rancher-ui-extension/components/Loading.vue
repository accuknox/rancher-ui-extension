<template>
    <div class="spinner-container">
      <div class="spinner"></div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Spinner',
  };
  </script>
  
  <style scoped>
  .spinner-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80px;
  }
  
  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-top-color: #3498db; /* Customize color */
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  </style>
  