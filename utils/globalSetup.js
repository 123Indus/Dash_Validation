import { initializeReports } from './reportGenerator';

export default async function globalSetup() {
    await initializeReports();
}
