// ./routing/extension-routing.ts
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';

import Dashboard from '../pages/Dashboard.vue';
import Policies from '../pages/Policies.vue';

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const PRODUCT_NAME = 'accuknox';
const DASHBOARD_PAGE_NAME = 'Dashboard';

const routes = [
  // this covers the "custom page"
  {
    name:      `${ PRODUCT_NAME }-c-cluster-${ DASHBOARD_PAGE_NAME }`,
    path:      `/${ PRODUCT_NAME }/c/:cluster/${ DASHBOARD_PAGE_NAME }`,
    component: Dashboard,
    meta:      {
      product: PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name: 'accuknox-c-cluster-policies',
    path: '/c/:cluster/policies',
    component: Policies,
    meta: {
      product: PRODUCT_NAME,
      cluster: true,
    },
  },
];

export default routes;