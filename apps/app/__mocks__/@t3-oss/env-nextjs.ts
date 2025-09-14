// Mock for @t3-oss/env-nextjs
export const createEnv = (config: any) => {
  // Return a mock environment object with all the expected properties
  const mockEnv: any = {};
  
  // Add client environment variables
  if (config.client) {
    Object.keys(config.client).forEach(key => {
      mockEnv[key] = process.env[key] || `mock-${key}`;
    });
  }
  
  // Add server environment variables
  if (config.server) {
    Object.keys(config.server).forEach(key => {
      mockEnv[key] = process.env[key] || `mock-${key}`;
    });
  }
  
  return mockEnv;
};

export default { createEnv };
