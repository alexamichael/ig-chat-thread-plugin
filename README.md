# IG Direct Chat Gen

A Figma plugin that generates realistic Instagram Direct Message conversations using AI.

![IG Direct Chat Gen](ig-direct_chat-gen.png)

## Features

- **AI-Powered Conversations**: Uses Llama API to generate natural, realistic text conversations
- **1:1 & Group Chat Support**: Automatically detects and supports both 2-person and 3-person group chats
- **8 Preset Topics**:
  - 🏀 Sports
  - 🎒 High School
  - ✨ Gen-Z
  - ✈️ Travel
  - 🎉 Events
  - 💼 Business
  - 🎬 Creators
  - 👨‍👩‍👧 Friends & Family
- **Custom Topics**: Enter any topic for custom conversation generation
- **Smart Structure Detection**: Automatically detects chat bubble components and message patterns
- **Profile Photo Detection**: Identifies unique participants in group chats

## Installation

1. Open Figma
2. Go to **Plugins** → **Browse plugins in Community**
3. Search for "IG Direct Chat Gen"
4. Click **Install**

## Usage

1. Select a Chat Thread component in your Figma design
2. Run the plugin from **Plugins** → **IG Direct Chat Gen**
3. Choose a conversation topic (preset or custom)
4. Click **Generate conversation**
5. The plugin will populate your chat bubbles with realistic messages

## Development

### Prerequisites

- Figma desktop app
- A Llama API key (for conversation generation)

### Setup

1. Clone this repository
2. In Figma, go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Select the `manifest.json` file from this repository

### Building

After making changes to `ui.html` or `headerImage.js`, run the build script:

```bash
./build.sh
```

This combines the source files into `ui-built.html` which is used by the plugin.

### File Structure

```
ig-chat-gen_v2/
├── manifest.json      # Plugin configuration
├── code.js            # Main plugin logic (Figma API)
├── ui.html            # Source UI file
├── ui-built.html      # Built UI (used by plugin)
├── headerImage.js     # Base64 encoded header image
├── build.sh           # Build script
└── ig-direct_chat-gen.png  # Plugin icon
```

## Author

**Alexa Michael** - [Meta Profile](https://www.internalfb.com/profile/view/6709430)

## License

Internal use only - Meta Platforms, Inc.
# test
# test
