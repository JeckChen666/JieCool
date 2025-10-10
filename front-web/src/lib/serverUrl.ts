export function getServerUrl(): string {
  return (
    process.env.SERVER_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    "http://localhost:8080"
  );
}