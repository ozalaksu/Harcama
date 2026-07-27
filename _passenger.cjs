async function main() {
  await import('./server-dist/index.js');
}

main().catch((error) => {
  console.error('Passenger bootstrap failed:', error);
  process.exit(1);
});
