<a id="readme-top"></a>

<div align="center">
    <a href="https://github.com/krislette/bach-or-bot">
    <img src="public/supalogo.png" alt="Logo" width="80" height="80">
  </a>

  <h1>語旅 · Kotabi</h1>
  <p align="center">
    An interactive web prototype for exploring the geographic origins of Japanese loanwords (外来語)
    <br />
    <a href="https://drive.google.com/file/d/1J9PtqVWGfNdMPvZWB8DpyP_VB96AH0_1/view?usp=sharing"><strong>Explore the report »</strong></a>
    <br /><br />
    <a href="#features">Features</a>
    ·
    <a href="#website-snapshots">Snapshots</a>
    ·
    <a href="#setup">Setup</a>
    ·
    <a href="#project-structure">Structure</a>
  </p>
</div>

## About The Project

語旅 (Kotabi), meaning "word journey," is an interactive web prototype that makes the phenomenon of Japanese loanwords (_gairaigo_, 外来語) explorable and visually engaging. Built with Svelte, TypeScript, and D3.js, it renders a zoomable world map where each donor country is colored using a traditional Japanese pigment palette. Users can click any country to browse its loanwords, or switch to the AI-powered Discover mode to classify a katakana word and predict its donor language, powered by a pre-trained LinearSVC classifier served through a FastAPI backend.

This project was built for COSC 402: Current Trends and Topics in Computing (HCI Interactive Prototype).

## Table of Contents

1. [About The Project](#about-the-project)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Website Snapshots](#website-snapshots)
5. [Setup](#setup)
6. [Project Structure](#project-structure)
7. [License](#license)

## Features

- **Interactive World Map**: Zoomable and pannable SVG map with smooth zoom-to-country transitions and constrained pan bounds
- **Country Color Palette**: Each donor country is assigned a deterministic color from a traditional Japanese pigment palette (山吹, 常磐, 柿, 藤, and more)
- **Explore Mode (探索)**: Click any colored country to view its national flag, donor language, loanword count, and a searchable, paginated word list
- **Real-time Search**: Filter loanwords by katakana or English meaning as you type, with a clear button and result count
- **Discover Mode (発見)**: Enter a katakana word and receive an AI-predicted donor language with confidence scores and a bar chart
- **Dual UK/US Highlight**: English predictions highlight both the United Kingdom and the United States simultaneously with a combined zoom
- **Progressive Disclosure**: Word card meanings are clamped to two lines and expand fully on hover
- **Responsive Feedback**: Bilingual validation messages, loading spinners, disabled states, and automatic result clearing on tab switch
- **Japanese Aesthetic**: Seigaiha wave header, washi paper tones, vermillion accents, Shippori Mincho B1, and Noto Sans JP typography

## Technologies Used

| Technology                                       | Purpose                                        |
| ------------------------------------------------ | ---------------------------------------------- |
| [Svelte](https://svelte.dev/) + TypeScript       | Frontend framework and type safety             |
| [Vite](https://vitejs.dev/)                      | Build tool and dev server                      |
| [D3.js](https://d3js.org/)                       | Map rendering, zoom behavior, and data binding |
| [TopoJSON](https://github.com/topojson/topojson) | Geographic data (world-atlas)                  |
| [FastAPI](https://fastapi.tiangolo.com/)         | Backend REST API for AI predictions            |
| [flagcdn.com](https://flagcdn.com/)              | Country flag images                            |

## Website Snapshots

**Initial Load**: World map with Japanese pigment country colors and the Explore panel idle state
<img width="1323" height="637" alt="image" src="https://github.com/user-attachments/assets/d0b2b80d-c1c4-4a92-9728-0b6720917cfa" />

**Explore Mode**: Country selected with flag, language tag, loanword count, search bar, and word cards
<img width="1323" height="639" alt="image" src="https://github.com/user-attachments/assets/ee5b1b51-9748-4be1-957d-1857b6a215f9" />

<img width="1323" height="639" alt="image" src="https://github.com/user-attachments/assets/4f0b5a7e-8ac0-4853-bf62-7d63990abe84" />

<img width="1322" height="635" alt="image" src="https://github.com/user-attachments/assets/483437fc-0f41-4029-b87b-b49e2dc90d99" />

**Discover Mode**: Katakana input, Analyze button, disclaimer note, and example word chips
<img width="1321" height="638" alt="image" src="https://github.com/user-attachments/assets/fb55b7d2-e369-483d-b9f1-ea2f87db5876" />

<img width="1321" height="636" alt="image" src="https://github.com/user-attachments/assets/4bbc3985-5522-4734-9ae4-974a4c3e95b4" />

<img width="1321" height="637" alt="image" src="https://github.com/user-attachments/assets/c64fdde1-0cfb-441b-ab6f-ec9f2cc57eb0" />

## Setup

### Prerequisites

- Node.js 18+
- The [Kotabi API](https://github.com/krislette/kataklassifer) running locally on port `8000`

### Installation

```bash
git clone https://github.com/krislette/gairaigo-map.git
cd gairaigo-map
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. Make sure the FastAPI backend is running before using Discover mode.

### Build for Production

```bash
npm run build
npm run preview
```

### Type Check

```bash
npm run check
```

## Project Structure

```
gairaigo-map/
├── public/
│ ├── favicon.svg
│ └── icons.svg
├── src/
│ ├── data/
│ │ └── gairaigo_full.json # 10,378 loanword entries across 37 donor languages
│ ├── lib/
│ │ ├── components/
│ │ │ ├── WorldMap.svelte # D3 map, zoom, pan, country rendering
│ │ │ ├── ExplorePanel.svelte # Country header, search, word list
│ │ │ └── DiscoverPanel.svelte # Katakana input, AI prediction, result card
│ │ ├── stores/
│ │ │ └── mapStore.ts # Shared reactive state (activeIso2, highlights, zoom)
│ │ ├── isoMapping.ts # ISO2 ↔ numeric country code mapping
│ │ └── types.ts # TypeScript interfaces
│ ├── App.svelte # Root layout, tab bar, header, footer
│ ├── app.css # Global CSS variables and design tokens
│ └── main.ts # Entry point
├── index.html
├── vite.config.ts
├── svelte.config.js
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.node.json
```

## License

This project is for academic use. Loanword data is sourced from [JMdict/EDICT](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project), distributed under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/) by the Electronic Dictionary Research and Development Group.

<p align="right"><a href="#readme-top">Back to top</a></p>
