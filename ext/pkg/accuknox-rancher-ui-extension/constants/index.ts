export const ACCUKNOX_REPO_NAME = 'accuknox-charts';
export const AGENTS_NAMESPACE = 'agents';
export const KUBEARMOR_NAMESPACE = 'kubearmor';
export const CONFIG_MAP_NAME = 'accuknoxrancheruiextentionconfig';

export const CWPP_HARDENING_CHART = {
  name: 'accuknox-cwpp-hardening-policies',
  version: '0.1.0',
  releaseName: 'accuknox-cwpp-hardening-policies',
  namespace: KUBEARMOR_NAMESPACE,
};

export const KUBEARMOR_OPERATOR_CHART = {
  name: 'kubearmor-operator',
  version: 'v1.5.7',
  namespace: KUBEARMOR_NAMESPACE,
};

export const AGENTS_CHART = {
  name: 'agents-chart',
  version: 'v0.10.7',
  namespace: AGENTS_NAMESPACE,
};

export const KSPM_CHARTS_CONFIG = [
  {
    chartName: 'cis-k8s-job',
    releaseName: 'accuknox-cis-k8s-job',
    version: 'v1.1.4',
  },
  {
    chartName: 'k8s-risk-assessment-job',
    releaseName: 'accuknox-k8s-risk-assessment-job',
    version: 'v1.1.4',
  },
  {
    chartName: 'kiem-job',
    releaseName: 'accuknox-kiem-job',
    version: 'v1.1.4',
  },
];