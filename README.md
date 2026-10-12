# VibeLens

**See What Your Data Is Saying.**

VibeLens is an AI-powered customer feedback intelligence application that transforms unstructured reviews into sentiment classifications, visual patterns, evidence-based insights, and actionable recommendations.

> GitHub description: AI-powered customer feedback sentiment analysis and data insights platform built with Python, NLP, Pandas and modern web technologies.

## Project Objective

To develop a sentiment analysis application capable of analysing customer feedback and transforming textual data into meaningful insights.

## Features

- Single-review sentiment analysis with an explainable normalized score
- CSV upload, validation, cleaning, and in-browser analysis
- Built-in dataset of 50 realistic reviews across seven topics
- Sentiment distribution, category comparisons, keywords, ratings, and date trends
- Dataset-derived insights and recommendations with no fabricated statistics
- Searchable, filterable, sortable, paginated review table
- Enriched CSV export and printable/PDF insight report
- Responsive dashboard, accessible controls, empty/error/loading states, and persistent dark mode

## Core Competencies Demonstrated

- Data interpretation using AI
- Analytical thinking and AI-assisted insight generation
- Sentiment analysis and text classification
- Basic machine learning and NLP concepts
- Data visualisation
- Individual project ownership

## Technology Stack

React 19, TypeScript, Vite 8, Tailwind CSS 4, browser File APIs, and native SVG/CSS visualisations.

## Architecture

The application intentionally uses a client-side architecture. Uploaded files stay in the browser and are not sent to a server. Analysis, aggregation, charts, insights, and exports are computed from the active dataset in real time.

## Installation

```bash
pnpm install
pnpm dev
```

Open the local URL shown by Vite. For a production build:

```bash
pnpm build
pnpm preview
```

## Dataset format

CSV files require a `review` column. Optional columns are `date`, `category`, and `rating`.

```csv
review,date,category,rating
"The support team was excellent.",2026-01-04,Support,5
```

## How sentiment analysis works

VibeLens uses a transparent lexicon-based sentiment method suitable for a reliable browser demo:

1. Normalize and tokenize each review.
2. Match tokens against curated positive and negative lexicons.
3. Apply basic negation and intensity modifiers.
4. Normalize the score by text length.
5. Classify the review as Positive, Neutral, or Negative.

The displayed value is a **normalized lexicon score**, not a probability or fabricated model confidence.

## Data analysis methodology

Data collection → Data cleaning → Sentiment analysis → Classification → Aggregation → Visualisation → Insight generation → Recommendations

All percentages and numerical insight claims are calculated from the active dataset. Optional charts and metrics are hidden or explained when required fields are unavailable.

## Limitations

Lexicon analysis does not have human-level emotional understanding. It can miss sarcasm, idioms, mixed sentiment, context, and domain-specific wording. The tool is designed to support—not replace—human interpretation. Uploaded data is held only in application memory and is not persisted after refresh.

## Future improvements

- Validated transformer-based sentiment models
- Multilingual and aspect-based sentiment analysis
- Secure backend persistence and dataset comparison
- User-defined taxonomies and stop-word lists
- Branded server-generated PDF reports

## Portfolio description

VibeLens is an AI-powered sentiment analysis platform that transforms customer feedback into actionable insights. The application combines NLP-based sentiment classification, data visualisation and AI-assisted insight generation to help users understand what their customers are saying.

## Author

Individual Week 3 AI/Data Analysis project.
