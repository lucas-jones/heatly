<div align="center">
  <img src="logo.png" width="65%"/>
  <div style="font-size: 2.5em; font-weight: bold; text-align: center;"><a href="https://lucas-jones.github.io/heatly/">View Live Site</a></div>
  <br/>
</div>

# Heatly Tech Test

Visual representation  of UK solar for one day using  data and using H3-Index displays Visualizes UK solar generation for a single day using the [OpenClimateFix UK PV dataset](https://huggingface.co/datasets/openclimatefix/uk_pv). Data is mapped onto an [H3-Index](https://h3geo.org/) hex grid and rendered as scaled hexes in 3D. Uses a single draw call via InstancedMesh for efficient rendering.

## 📊 Data Used
 - **[GeoJson](https://github.com/georgique/world-geojson)**
 - **[UK PV dataset](https://huggingface.co/datasets/openclimatefix/uk_pv)**

## 🔗 Other Visualizations
 - **[Globe Data Visualization](https://globe.gl/)**
 - **[GitHub Globe](https://github.com/Epic-programmer-official/github-globe)**
 - **[Google Globe](https://experiments.withgoogle.com/chrome/globe)**


## 💭 Improvements
 - MsgPack / BinaryPack JSON data
 - Display Weather
 - Cloud Coverage
 - Potential PV vs Actual
 - Display Statistic (total generated)
 - Hover over statistics
 - Timeline slider
 - Multiple days

## 🛠️ Tech Stack

### Core Technologies
- **[H3 Geo](https://h3geo.org/)**
- **[ThreeJS](https://threejs.org/)**
- **[PostProcessing](https://github.com/pmndrs/postprocessing)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Vite Rolldown](https://vite.dev/guide/rolldown)**
- **[Prettier](https://prettier.io/)**
- **[Bun](https://bun.sh/)**


## 🚀 Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```


