export const NO_SCHEDULER_FOUND = (schedulerName: string, name?: string) =>
  name
    ? `No ${schedulerName} was found with the given name (${name}). Check your configuration.`
    : `No ${schedulerName} was found. Check your configuration.`;
