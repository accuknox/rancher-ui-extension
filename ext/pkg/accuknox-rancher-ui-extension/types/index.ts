export interface Cluster {
    id: string;
    name: string;
    spec: {
      displayName: string;
    };
    systemProjectId: string;
  }
  
  export interface ClusterDetail {
    id: string;
    name: string;
    systemProjectId: string;
    allReposPresent: boolean;
    allChartsPresent: boolean;
    allAppPresent: boolean;
    hardeningAvailable: boolean;
    kspmAvailable: boolean;
  }
  
  export interface CwppFormData {
    accessKey: string;
    tokenURL: string;
    spireHost: string;
    ppsHost: string;
    knoxGateway: string;
    admissionController: boolean;
    kyverno: boolean;
  }
  
  export interface KspmFormData {
    authToken: string;
    tenant: string;
    label: string;
    cspmURL: string;
  }
  
  export interface ReposFormData {
      clusterNamePrefix: string;
  }