# ChatGPTree

A conversational AI application with a thread-based navigation system, built on top of the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template.

## Overview

ChatGPTree adds a Reddit-style thread navigation system to AI conversations, allowing discussions to stay organized and tidy. Instead of linear chat histories, conversations can branch, be threaded and navigated hierarchically.

## Features

- **Thread Navigation** - Reddit-like conversation threading to keep discussions organized
- **Branching Conversations** - Create new branches from any point in a conversation
- **Message Management** - Delete questions and responses from conversations (note: with the cost of affecting AI context)
- **AI-Powered Chat** - Built on the Vercel AI SDK with support for multiple model providers

### Planned Features

- [ ] Personas - Customizable AI personalities
- [ ] Project Creation - Organize conversations into projects

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS, shadcn/ui
- **Backend API**: Node.js (Next.js API routes)
- **Microservices**: Go
- **AI**: Vercel AI SDK

## Status

🚧 **Work in Progress** - This project is under active development. Code cleanup, refactoring and development of new features is ongoing.

## Acknowledgments

Based on the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template.
