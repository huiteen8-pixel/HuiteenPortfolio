export function isProductionRuntime() {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.COZE_PROJECT_ENV === 'PROD'
  );
}
