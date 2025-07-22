import { fetchGeoJsonData } from "./data/fetchGeoJsonData";
import { fetchSolarPowerData } from "./data/fetchSolarPowerData";
import { SolarVisualization } from "./core/SolarVisualization";

async function initializeApp() {
	const container = document.getElementById("app") as HTMLDivElement;

	const [geoData, powerData] = await Promise.all([fetchGeoJsonData("united_kingdom.json"), fetchSolarPowerData("solar_data.json")]);

	const app = new SolarVisualization(container, geoData, powerData);
	app.render();
	app.startDataAnimation(powerData, 60);
}

initializeApp();
