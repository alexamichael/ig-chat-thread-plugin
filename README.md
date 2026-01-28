# IG Direct Chat Thread - Figma plugin

A Figma plugin for generating realistic Instagram Direct Message chat thread mockups with AI-powered conversation generation and customizable visual elements.

# How it works

1. Drag a Chat Thread component instance from the IG Product Systems (Direct) Figma library onto a frame
2. Search for and run the IG Direct Chat Thread plugin
3. With the Chat thread plugin selected, configure your desired settings in the plugin UI. Changes update in real time according to selection


---

### Chat type

Toggle offers mode switching between 1:1 chat and Group chat (3 people). The toggle also affects how AI organizes conversation content.

- **1:1 chat** - Swaps all Profile photos in Chat blocks and Header module and Title text in the Header module
- **Group chat** - Accounts for 3 people in the chat, swaps all Profile photos and Admin text in Chat blocks and Title text in the Header module. Usernames are aligned with Profile photos.

Usernames: aimi.allover, alex.anyways18, azevedo_drdr, chantouflowergirl, gwangurl77, hi_kimuraito, kalindi_rainbows, mishka_songs, pierre_thecomet, sunflower_power77, vasudaydreams, silvaqueen15, pia.in.a.pod, sprinkles_bby19, paisley.print.48, jaded.elephant17, alo.daiane1, e.manny.well.52, Handle20, princess_peace, paulo.amoda1, zacarias.brasilia9, unverified_vera, real_yelana15, raissa.cool22, ubiratan.totalmente, seoyeonseoul, heaven.is.nevaeh, lala_adriana900, okay_kaiden_459, mika_florist45, lil_wyatt838, its_santos787, nora.needs.cheese, stellas_gr00v3, hidayathere22, maiara_praia1

---

### Conversation

Choose from 8 predefined topic templates that generate contextually appropriate conversations:

- **🏀 Sports** - Friends discussing games, players, and matches with sports-fan enthusiasm
- **🎒 High school** - Students texting about school life, homework struggles, and gossip using casual teen language
- **✨ Gen-Z** - Friends using current slang like "no cap", "fr", "lowkey", and "slay" while hyping each other up
- **✈️ Travel** - Friends sharing travel experiences, asking questions about trips, and making future plans
- **🎉 Events** - Friends coordinating event logistics, discussing outfits, and building excitement
- **💼 Business** - Colleagues coordinating on projects, sharing updates, and aligning on deliverables
- **🎬 Creators** - Content creators sharing ideas, reacting to each other's content, and discussing collaborations
- **👨‍👩‍👧 Friends & family** - Family members or close friends sharing updates and checking in with warmth

Each topic template has separate prompts optimized for 1:1 and 3-person group chat conversations.


### Custom topics

Enter any custom topic description up to 75 characters in the "Describe custom topic..." input field. The plugin uses the Llama API to generate contextually relevant conversation content based on your description. Click the "Generate" button to create AI-powered messages that match your specified topic. The generate button enables once you type a custom topic.

### Conversation length

The Length slider controls how many messages appear in the generated conversation. The slider has 3 positions:

- **Short (690px H)** - For quick mockups in a single iPhone or Android frame
- **Medium (~1,000px H)** - Moderate conversation length for a series of mockups
- **Long (~2,000px H)** - Extended conversation for a series of mockups

---

### Emoji slider

The emoji slider controls the frequency of emoji reactions on chat messages. The slider has 3 positions:

- **Off** - No emoji reactions appear on messages
- **Medium** - Moderate emoji presence scattered throughout the conversation
- **High** - Frequent emoji reactions for expressive conversations

When enabled, the plugin swaps emoji components using the MDS-iOS-Emojis library. Available reaction emojis include: Grinning Face with Big Eyes, Red Heart, Thumbs Up, Purple Heart, Fire, Pouting Face, Face Screaming in Fear, and Face with Tears of Joy. Group chat reactions are set up to mimic realistic .Chat reactions, using Profile photos or number counts and differ from 1:1 chat reactions.

### Stickers slider

The sticker slider controls the frequency of sticker messages in conversations. The slider has 3 positions:

- **Off** - No stickers in the conversation
- **Medium** - Occasional sticker messages add visual variety
- **High** - Frequent sticker content throughout the chat

When enabled, the plugin places stickers from the IGD-Sticker-Packs library around chat messages. Stickers are randomly rotated (±4°, ±8°, or ±16°) and sized between 70-100 pixels for natural variation. Available stickers include: CartoonVibes_Admiration512, PinkWink, Combine, CartoonVibes_LoveYouMeanIt, cat, CartoonVibes_ThinkingOfYou, HighFive, and pinkCry. [IGD Sticker Packs](https://www.figma.com/design/MGmBsfWqA1IfEaVpqWCksN/IGD-Sticker-Packs?node-id=1-125&t=hh1bxHKheSGUHBJy-1)

### Gradient dropdown

The gradient dropdown applies visual effects to the chat thread:

- **No gradient** - Standard chat appearance with default styling
- **Gradient** - Applies a purple-to-pink Instagram-style gradient overlay (#D300C5 to #7043EA)

### Media integration dropdown

The media dropdown controls rich media content in conversations:

- **No media** - Text-only messages without media attachments
- **Media chat** - Replaces some Text chat components with Media chat components containing images. Images are contextually selected based on conversation keywords from categories: selfies, food, travel, funny, and events
- **Reels** - Replaces some messages with IG content share components set to "Share reels" state. Reels images are contextually selected based on conversation topic
- **Both** - Combines Media chat and Reels content in the same conversation

Media images are sourced from the Widen DAM (facebook.widen.net) and automatically matched to conversation context using keyword analysis. Reels automatically generate different Profile photos and usernames.
