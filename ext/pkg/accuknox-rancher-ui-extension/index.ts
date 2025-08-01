// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import accuknoxRouting from './routing/accuknox-routing';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  // it will grab information such as `name` and `description`
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./accuknox'));

  // Add Vue Routes
  plugin.addRoutes(accuknoxRouting);
}