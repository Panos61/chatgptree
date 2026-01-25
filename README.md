# ChatGPTree

A conversational AI application with a thread-based navigation system, built on top of the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template.

## Overview

ChatGPTree adds a Reddit-style thread navigation system to AI conversations, allowing discussions to stay organized and tidy. Instead of linear chat histories, conversations can branch, be threaded and navigated hierarchically. Unlike, other AI conversational applications, conversations are kept organised, fully manageable and clean.

## Goals

This project is currently being developed mainly for personal use. To be honest, it’s quite common for me to get lost in a long conversation after coming back to it. With the goals below in mind, I found an opportunity to get involved in LLM applications.

- **Better Conversation Organization** - Move beyond linear chat to structured, navigable threads
- **Context Preservation** - Maintain conversation context while allowing flexible navigation
- **User Control** - Give users full control over their conversation flow and message management
- **Scalable Architecture** - Build with microservices for maintainability and performance
- **Enhanced AI Interaction** - Support multiple personas and project-based conversations

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
