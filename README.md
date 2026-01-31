<!-- ![Example Image](server/views/banner.png) -->

# Nimble- Local-first AI Notetaker

Nimble is a simple, privacy-first note app that keeps your notes on your device by default. It works offline. Built-in AI helps you summarize notes, find things quickly, suggest text, and organize with tags. Fast, easy to use, and designed so your data stays private unless you choose to back it up.

## Table of Contents

- [Overview](#Overview)
- [Features](#features)
- [Dependencies](#dependencies)
- [Git Setup](#Git-Setup)
- [Setup](#Setup)
- [Usage](#usage)
- [Contributors](#contributors)

## Overview

- Nimble focuses on privacy and fast local-first workflows. Notes are stored locally (filesystem in the browser). When you ask the app to use AI, it collects the array of notes and opens a WebSocket connection to an AI service (address provided via environment). The AI runs online and responds via the WebSocket with summaries, relevance-ranked results, extracted quotes, or answers to general queries. The app works offline for creating and editing notes; AI-powered features require an active network connection to the configured WebSocket endpoint.

## Features

- Local-first storage-  Notes live on your device by default; fast read/write and offline editing.
- AI agents (over WebSocket)- Remote AI agents process your local notes via a WebSocket connection and return results in real time.
- Relevancy search- Ask questions and get results ranked by relevance across your notes.
- Quote extraction- Automatically extract key quotes or highlights from multiple notes.
- General query- Ask the AI broad questions about your notes (summaries, follow-ups, TODO extraction, etc.).
- Privacy-first design- The UI and storage remain local; only the data you send over WebSocket reaches the AI service.

## Dependencies

- Next.js
- Bun
- WebSockets

## Git-Setup

Clone the repository:

```bash
git clone https://github.com/shaurya35/nimble
cd nimble
```
## Setup

Redirect to Nimble:

```bash
cd nimble
```

Install the dependencies:
```bash
bun install
```

Create a .env file:
```bash
NEXT_PUBLIC_WS_URL=
```
Run client Interface:
```bash
bun dev
```

## Usage

Access the app in your web browser at `http://localhost:3000/`.

## Contributors

- Shaurya ([LinkedIn](https://www.linkedin.com/in/shaurya--jha/))