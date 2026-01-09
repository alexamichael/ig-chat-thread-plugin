// Convo Gen Plugin v2 - Supports 1:1 and Group Chat conversations
// Uses Llama API for conversation generation

// Show the plugin UI
figma.showUI(__html__, { width: 320, height: 710 });

// ============================================================================
// FIGMA COMPONENT DETECTION AND TEXT POPULATION
// ============================================================================

/**
 * Recursively find all text nodes within a node
 */
function findAllTextNodes(node, textNodes = []) {
  if (node.type === 'TEXT') {
    textNodes.push(node);
  }

  if ('children' in node) {
    for (const child of node.children) {
      findAllTextNodes(child, textNodes);
    }
  }

  return textNodes;
}

/**
 * Find profile photo/avatar components within a node
 * Handles access issues gracefully when components are from external libraries
 */
function findProfilePhotos(node, photos = [], depth = 0) {
  if (depth > 10) return photos;
  
  try {
    const name = node.name.toLowerCase();
    const nodeType = node.type;

    const photoPatterns = ['profile', 'avatar', 'photo', 'pfp'];
    const isProfilePhoto = photoPatterns.some(p => name.includes(p));

    if (isProfilePhoto && (nodeType === 'INSTANCE' || nodeType === 'COMPONENT' || nodeType === 'FRAME' || nodeType === 'ELLIPSE')) {
      let photoId = node.name; // Default fallback to node name
      
      try {
        if (nodeType === 'INSTANCE') {
          // Try to get mainComponent id, but handle cases where it's inaccessible
          // (e.g., from external library without access)
          if (node.mainComponent && node.mainComponent.id) {
            photoId = node.mainComponent.id;
          } else {
            // Fallback: try to use the component's key or the instance's own id
            photoId = node.id;
          }
        }
      } catch (e) {
        // mainComponent access failed (possibly external library without access)
        console.log(`[PROFILE PHOTO] Could not access mainComponent for "${node.name}", using node.id as fallback`);
        photoId = node.id;
      }
      
      // Try to get image hash from fills as a more unique identifier
      try {
        if ('fills' in node && node.fills !== figma.mixed && Array.isArray(node.fills)) {
          const imageFill = node.fills.find(f => f.type === 'IMAGE');
          if (imageFill && imageFill.imageHash) {
            photoId = imageFill.imageHash;
          }
        }
      } catch (e) {
        // fills access failed, use existing photoId
        console.log(`[PROFILE PHOTO] Could not access fills for "${node.name}", using existing photoId`);
      }
      
      photos.push({ node, photoId, name: node.name });
      return photos;
    }

    if ('children' in node) {
      for (const child of node.children) {
        findProfilePhotos(child, photos, depth + 1);
      }
    }
  } catch (e) {
    // If any unexpected error occurs, log it and continue
    console.error(`[PROFILE PHOTO] Error processing node: ${e.message}`);
  }
  
  return photos;
}

/**
 * Check if a node name or its properties indicate it's a sender
 */
function isSenderNode(node) {
  const name = node.name.toLowerCase();

  // Check name directly
  if (name.includes('sender') || name.includes('outgoing') || name.includes('sent')) {
    return true;
  }

  // Check component properties for INSTANCE nodes
  if (node.type === 'INSTANCE') {
    try {
      const props = node.componentProperties || {};
      for (const [key, value] of Object.entries(props)) {
        const propKey = key.toLowerCase();
        const propVal = String(value.value || '').toLowerCase();

        // Check if any property indicates sender
        if (propVal.includes('sender') || propVal.includes('outgoing') || propVal.includes('sent')) {
          return true;
        }
        // Check Type property specifically
        if (propKey.includes('type') && propVal.includes('sender')) {
          return true;
        }
      }
    } catch (e) {
      console.log('Error reading component properties:', e);
    }
  }

  return false;
}

/**
 * Check if a node name or its properties indicate it's a recipient
 */
function isRecipientNode(node) {
  const name = node.name.toLowerCase();

  // Check name directly
  if (name.includes('recipient') || name.includes('incoming') || name.includes('received')) {
    return true;
  }

  // Check component properties for INSTANCE nodes
  if (node.type === 'INSTANCE') {
    try {
      const props = node.componentProperties || {};
      for (const [key, value] of Object.entries(props)) {
        const propKey = key.toLowerCase();
        const propVal = String(value.value || '').toLowerCase();

        // Check if any property indicates recipient
        if (propVal.includes('recipient') || propVal.includes('incoming') || propVal.includes('received')) {
          return true;
        }
        // Check Type property specifically
        if (propKey.includes('type') && propVal.includes('recipient')) {
          return true;
        }
      }
    } catch (e) {
      console.log('Error reading component properties:', e);
    }
  }

  return false;
}

/**
 * Find chat bubble components within a node
 * Uses flexible detection to handle various naming conventions
 */
function findChatBubbles(node, bubbles = [], depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return bubbles;

  const name = node.name.toLowerCase();
  const nodeType = node.type;

  // Check if this is a chat bubble component using flexible patterns
  // Matches: "Chat Bubble", "Text Chat", "Bubble", or components with Sender/Recipient in name
  const bubblePatterns = [
    'chat bubble',
    'chatbubble',
    'text chat',
    'textchat',
    'bubble',
    'chat / sender',
    'chat / recipient',
    'chat/sender',
    'chat/recipient'
  ];

  const isBubbleByName = bubblePatterns.some(pattern => name.includes(pattern));
  const isSenderOrRecipient = (
    (name.includes('sender') || name.includes('recipient')) &&
    !name.includes('block') &&
    !name.includes('thread') &&
    !name.includes('chat thread')
  );

  const isChatBubble = isBubbleByName || isSenderOrRecipient;

  if (isChatBubble && (nodeType === 'INSTANCE' || nodeType === 'COMPONENT' || nodeType === 'FRAME')) {
    console.log(`[BUBBLE FOUND] "${node.name}" (${nodeType})`);
    bubbles.push(node);
    // Don't recurse into bubbles
    return bubbles;
  }

  // Recurse into children
  if ('children' in node) {
    for (const child of node.children) {
      findChatBubbles(child, bubbles, depth + 1, maxDepth);
    }
  }

  return bubbles;
}

/**
 * Find chat blocks within a node
 */
function findChatBlocks(node, blocks = [], depth = 0, maxDepth = 5) {
  if (depth > maxDepth) return blocks;

  const name = node.name.toLowerCase();
  const nodeType = node.type;

  // Check for chat block patterns
  const blockPatterns = [
    'chat block',
    'chatblock',
    'block / sender',
    'block / recipient',
    'block/sender',
    'block/recipient',
    'message block',
    'messageblock'
  ];

  const isBlock = blockPatterns.some(pattern => name.includes(pattern)) ||
    (name.includes('block') && (name.includes('sender') || name.includes('recipient')));

  if (isBlock && (nodeType === 'INSTANCE' || nodeType === 'COMPONENT' || nodeType === 'FRAME')) {
    console.log(`[BLOCK FOUND] "${node.name}" (${nodeType})`);
    blocks.push(node);
    // Don't recurse into blocks - we'll find bubbles inside them separately
    return blocks;
  }

  // Recurse into children
  if ('children' in node) {
    for (const child of node.children) {
      findChatBlocks(child, blocks, depth + 1, maxDepth);
    }
  }

  return blocks;
}

/**
 * Determine if a bubble is a sender or recipient based on name, properties, or parent
 * Returns: 'sender', 'recipient', or 'unknown'
 */
function getBubbleType(node) {
  // Check the node itself first
  if (isSenderNode(node)) return 'sender';
  if (isRecipientNode(node)) return 'recipient';

  // Check parent hierarchy for type hints
  let parent = node.parent;
  let depth = 0;
  while (parent && depth < 5) {
    if (isSenderNode(parent)) return 'sender';
    if (isRecipientNode(parent)) return 'recipient';

    if (parent.type === 'PAGE' || parent.type === 'DOCUMENT') break;
    parent = parent.parent;
    depth++;
  }

  return 'unknown';
}

/**
 * Get the main text node from a chat bubble (usually the message content)
 */
function getMainTextNode(bubble) {
  const textNodes = findAllTextNodes(bubble);

  if (textNodes.length === 0) return null;
  if (textNodes.length === 1) return textNodes[0];

  // If multiple text nodes, find the one that's likely the message
  return textNodes.reduce((best, current) => {
    const currentName = current.name.toLowerCase();
    const bestName = best.name.toLowerCase();

    // Prefer nodes named "message", "text", "content", etc.
    const messageKeywords = ['message', 'text', 'content', 'body', 'label'];
    const currentHasKeyword = messageKeywords.some(k => currentName.includes(k));
    const bestHasKeyword = messageKeywords.some(k => bestName.includes(k));

    if (currentHasKeyword && !bestHasKeyword) return current;
    if (bestHasKeyword && !currentHasKeyword) return best;

    // Exclude timestamps, names, etc.
    const excludeKeywords = ['time', 'date', 'name', 'avatar', 'status', 'read', 'delivered'];
    const currentExcluded = excludeKeywords.some(k => currentName.includes(k));
    const bestExcluded = excludeKeywords.some(k => bestName.includes(k));

    if (currentExcluded && !bestExcluded) return best;
    if (bestExcluded && !currentExcluded) return current;

    // Fall back to comparing text length (prefer longer content area)
    return current.characters.length >= best.characters.length ? current : best;
  }, textNodes[0]);
}

/**
 * Set text on a text node, loading the font if necessary
 */
async function setTextNodeContent(textNode, content) {
  try {
    // Load the font used by the text node
    if (textNode.fontName !== figma.mixed) {
      await figma.loadFontAsync(textNode.fontName);
    } else {
      // If mixed fonts, load the first character's font (if text exists)
      if (textNode.characters.length > 0) {
        const fontName = textNode.getRangeFontName(0, 1);
        await figma.loadFontAsync(fontName);
      }
    }

    textNode.characters = content;
    return true;
  } catch (error) {
    console.error('Error setting text:', error);
    return false;
  }
}

/**
 * Analyze the structure of a Chat Thread and return the pattern of bubbles
 * Now detects group chats by checking for multiple unique profile photos
 */
function analyzeChatStructure(threadNode) {
  // Find chat blocks first
  let chatBlocks = findChatBlocks(threadNode);

  // Track unique recipient profile photos for group chat detection
  const recipientProfiles = new Map(); // photoId -> first occurrence index
  let blockIndex = 0;

  // Collect profile photos from recipient blocks
  for (const block of chatBlocks) {
    if (isRecipientNode(block)) {
      const photos = findProfilePhotos(block);
      if (photos.length > 0) {
        const photoId = photos[0].photoId;
        if (!recipientProfiles.has(photoId)) {
          recipientProfiles.set(photoId, blockIndex);
        }
      }
    }
    blockIndex++;
  }

  const isGroupChat = recipientProfiles.size > 1;
  const recipientPhotoIds = Array.from(recipientProfiles.keys());

  console.log(`[GROUP CHAT] Unique recipient profiles: ${recipientProfiles.size}, Is Group: ${isGroupChat}`);

  // Collect all bubbles
  let bubbles = [];
  let bubbleToBlock = new Map(); // Map bubble to its parent block

  if (chatBlocks.length === 0) {
    bubbles = findChatBubbles(threadNode);
  } else {
    for (const block of chatBlocks) {
      const blockBubbles = findChatBubbles(block);
      for (const bubble of blockBubbles) {
        bubbleToBlock.set(bubble.id, block);
      }
      bubbles.push(...blockBubbles);
    }
  }

  if (bubbles.length === 0) {
    return { structure: [], isGroupChat: false, participants: 2 };
  }

  // Sort bubbles by their Y position (top to bottom)
  bubbles.sort((a, b) => {
    const aY = a.absoluteTransform ? a.absoluteTransform[1][2] : 0;
    const bY = b.absoluteTransform ? b.absoluteTransform[1][2] : 0;
    return aY - bY;
  });

  // Analyze each bubble and assign person (A = sender/you, B and C = recipients for group chats)
  const structure = bubbles.map((bubble, index) => {
    const type = getBubbleType(bubble);
    const textNode = getMainTextNode(bubble);

    // Determine person label
    let person = 'B'; // Default to first recipient
    if (type === 'sender') {
      person = 'A'; // Sender is always Person A (you)
    } else if (isGroupChat) {
      // For group chats, check which recipient this is
      const parentBlock = bubbleToBlock.get(bubble.id);
      if (parentBlock) {
        const photos = findProfilePhotos(parentBlock);
        if (photos.length > 0) {
          const photoId = photos[0].photoId;
          const photoIndex = recipientPhotoIds.indexOf(photoId);
          person = photoIndex === 0 ? 'B' : 'C'; // First recipient = B, Second = C
        }
      }
    }

    return {
      index,
      type: type || 'unknown',
      person,
      bubble,
      textNode
    };
  });

  // Infer unknown types from surrounding bubbles
  for (let i = 0; i < structure.length; i++) {
    if (structure[i].type === 'unknown') {
      const prevType = i > 0 ? structure[i - 1].type : null;
      const nextType = i < structure.length - 1 ? structure[i + 1].type : null;

      if (prevType && prevType !== 'unknown') {
        structure[i].type = prevType === 'sender' ? 'recipient' : 'sender';
      } else if (nextType && nextType !== 'unknown') {
        structure[i].type = nextType === 'sender' ? 'recipient' : 'sender';
      } else {
        structure[i].type = i % 2 === 0 ? 'recipient' : 'sender';
      }

      // Assign person based on type and group chat status
      if (structure[i].type === 'sender') {
        structure[i].person = 'A';
      } else if (isGroupChat) {
        // For group chat recipients, try to determine from parent block's profile photo
        const parentBlock = bubbleToBlock.get(structure[i].bubble.id);
        if (parentBlock) {
          const photos = findProfilePhotos(parentBlock);
          if (photos.length > 0) {
            const photoId = photos[0].photoId;
            const photoIndex = recipientPhotoIds.indexOf(photoId);
            structure[i].person = photoIndex === 0 ? 'B' : 'C';
          } else {
            // No photo found, check surrounding bubbles for person hint
            const prevPerson = i > 0 ? structure[i - 1].person : null;
            const nextPerson = i < structure.length - 1 ? structure[i + 1].person : null;
            if (prevPerson === 'B' || nextPerson === 'B') {
              structure[i].person = 'B';
            } else if (prevPerson === 'C' || nextPerson === 'C') {
              structure[i].person = 'C';
            } else {
              // Default to alternating between B and C for variety
              const recipientCount = structure.slice(0, i).filter(s => s.type === 'recipient').length;
              structure[i].person = recipientCount % 2 === 0 ? 'B' : 'C';
            }
          }
        } else {
          // No parent block, use alternating pattern
          const recipientCount = structure.slice(0, i).filter(s => s.type === 'recipient').length;
          structure[i].person = recipientCount % 2 === 0 ? 'B' : 'C';
        }
      } else {
        // Non-group chat, all recipients are Person B
        structure[i].person = 'B';
      }
    }
  }

  return {
    structure,
    isGroupChat,
    participants: isGroupChat ? 3 : 2
  };
}

/**
 * Convert structure to a pattern description for Llama
 * e.g., "3 messages from Person A, then 2 messages from Person B, then 1 from Person A"
 */
function structureToPatternDescription(structure) {
  if (structure.length === 0) return '';

  const groups = [];
  let currentType = structure[0].type;
  let count = 0;

  for (const item of structure) {
    if (item.type === currentType) {
      count++;
    } else {
      groups.push({ type: currentType, count });
      currentType = item.type;
      count = 1;
    }
  }
  groups.push({ type: currentType, count });

  // Convert to description
  return groups.map((g, i) => {
    const person = g.type === 'sender' ? 'Person A (sender/you)' : 'Person B (recipient/other person)';
    return `${g.count} message${g.count > 1 ? 's' : ''} from ${person}`;
  }).join(', then ');
}

/**
 * Convert structure to a simple array for the UI
 */
function structureToArray(structure) {
  return structure.map(s => ({
    type: s.type,
    hasTextNode: s.textNode !== null
  }));
}

// ============================================================================
// SELECTION CHANGE LISTENER
// ============================================================================

// Listen for selection changes and automatically analyze
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select a Chat Thread component or group containing Chat Blocks or Text Chats'
    });
    return;
  }

  const result = analyzeChatStructure(selection[0]);

  if (result.structure.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'No chat bubbles found. Please select a Chat Thread component or group containing Chat Blocks or Text Chats.'
    });
    return;
  }

  const patternDescription = structureToPatternDescription(result.structure);
  const structureArray = result.structure.map(s => ({
    type: s.type,
    person: s.person,
    hasTextNode: s.textNode !== null
  }));

  figma.ui.postMessage({
    type: 'structure-analyzed',
    structure: structureArray,
    patternDescription: patternDescription,
    totalBubbles: result.structure.length,
    isGroupChat: result.isGroupChat,
    participants: result.participants
  });

  // Store the structure for later use
  figma.root.setPluginData('currentStructure', JSON.stringify(result.structure.map(s => ({
    type: s.type,
    person: s.person,
    bubbleId: s.bubble.id,
    textNodeId: s.textNode ? s.textNode.id : null
  }))));
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'close') {
    figma.closePlugin();
    return;
  }

  if (msg.type === 'analyze-structure') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component or group containing Chat Blocks or Text Chats'
      });
      return;
    }

    const result = analyzeChatStructure(selection[0]);

    if (result.structure.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'No chat bubbles found. Please select a Chat Thread component or group containing Chat Blocks or Text Chats.'
      });
      return;
    }

    const patternDescription = structureToPatternDescription(result.structure);
    const structureArray = result.structure.map(s => ({
      type: s.type,
      person: s.person,
      hasTextNode: s.textNode !== null
    }));

    figma.ui.postMessage({
      type: 'structure-analyzed',
      structure: structureArray,
      patternDescription: patternDescription,
      totalBubbles: result.structure.length,
      isGroupChat: result.isGroupChat,
      participants: result.participants
    });

    // Store the structure for later use
    figma.root.setPluginData('currentStructure', JSON.stringify(result.structure.map(s => ({
      type: s.type,
      person: s.person,
      bubbleId: s.bubble.id,
      textNodeId: s.textNode ? s.textNode.id : null
    }))));

    return;
  }

  if (msg.type === 'populate-conversation') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component or group containing Chat Blocks or Text Chats'
      });
      return;
    }

    const messages = msg.messages;

    if (!messages || messages.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'No conversation data received'
      });
      return;
    }

    try {
      // Re-analyze structure to get current bubble references
      const result = analyzeChatStructure(selection[0]);

      if (result.structure.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'No chat bubbles found in selection'
        });
        return;
      }

      let populated = 0;

      for (let i = 0; i < Math.min(result.structure.length, messages.length); i++) {
        const { textNode } = result.structure[i];
        const messageText = messages[i];

        if (textNode && messageText) {
          const success = await setTextNodeContent(textNode, messageText);
          if (success) populated++;
        }
      }

      figma.ui.postMessage({
        type: 'success',
        message: `Populated ${populated} chat bubble${populated !== 1 ? 's' : ''} with conversation`
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message: `Error: ${error.message}`
      });
    }
  }
};
