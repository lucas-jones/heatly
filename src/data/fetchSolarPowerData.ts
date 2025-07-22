export type TotalWh = number;
export type History = { [index: string]: TotalWh };
export type SolarPowerData = { [time: string]: History };

export async function fetchSolarPowerData(url: string): Promise<SolarPowerData> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to load power data from ${url}: ${response.statusText}`);
	}
	return (await response.json()) as SolarPowerData;
}
