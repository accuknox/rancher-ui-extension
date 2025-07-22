export interface GrowlConfig {
  error: {
    data?: {
      _statusText?: string;
      message?: string;
    };
    _statusText?: string;
    message?: string;
  };
  store?: any;
  type?: string;
  overrideStatusText?: string;
}

export function handleGrowl(config: GrowlConfig): void {
  const rawError = config.error?.data || config.error;

  const error = {
    _statusText: config.overrideStatusText || rawError._statusText || config.type || "Error",
    message: rawError.message || "Unknown error",
  };

  const type = config.type || "Error";

  config.store.dispatch(
    `growl/${type.toLowerCase()}`,
    {
      title: error._statusText,
      message: error.message,
      timeout: 5000,
    },
    { root: true }
  );
}
