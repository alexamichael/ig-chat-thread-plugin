// Convo Gen Plugin v2 - Supports 1:1 and Group Chat conversations
// Uses Llama API for conversation generation

// Show the plugin UI
figma.showUI(__html__, { width: 320, height: 710 });

// ============================================================================
// AVAILABLE PROFILE VARIANTS
// These are the usernames/variants available in .People profile pictures
// ============================================================================
const PROFILE_VARIANTS = [
  'aimi.allover',
  'alex.anyways18',
  'azevedo_drdr',
  'chantouflowergirl',
  'gwangurl77',
  'hi_kimuraito',
  'kalindi_rainbows',
  'mishka_songs',
  'pierre_thecomet',
  'sunflower_power77',
  'vasudaydreams',
  'silvaqueen15',
  'pia.in.a.pod',
  'sprinkles_bby19',
  'paisley.print.48',
  'jaded.elephant17',
  'alo.daiane1',
  'e.manny.well.52',
  'Handle20',
  'princess_peace',
  'paulo.amoda1',
  'zacarias.brasilia9',
  'unverified_vera',
  'real_yelana15',
  'raissa.cool22',
  'ubiratan.totalmente',
  'seoyeonseoul',
  'heaven.is.nevaeh',
  'lala_adriana900',
  'okay_kaiden_459',
  'mika_florist45',
  'lil_wyatt838',
  'its_santos787',
  'nora.needs.cheese',
  'stellas_gr00v3',
  'hidayathere22',
  'maiara_praia1'
];

// ============================================================================
// EMOJI COMPONENT KEYS
// Hard-coded component keys from the MDS-iOS-Emojis library
// These are used to swap emoji in reactions
// ============================================================================
const EMOJI_COMPONENT_KEYS = {
  'Grinning Face with Big Eyes': 'ed87fe389f3024b42ab37bf1f962a51780f90748',
  'Red Heart': 'd1cf9ecd97edf5b131f6975ec133644b888d85aa',
  'Thumbs Up': 'ad40ef25df39f32ea39b6f90b2a23697ae68ad82',
  'Purple Heart': 'c3a06a077d09d96d2ef67ba9e546d50ba677ce14',
  'Fire': '9af07ac82f5a657eee481d75e5c069355fc54121',
  'Pouting Face': '09236c1257bc0920088a2a8ed7f81fbc271d08d4',
  'Face Screaming in Fear': 'd749e887b72bb762f6adb2eec1d33994c05fe752',
  'Face with Tears of Joy': '1a7453323b4a23490c0569f88f2e1ec33d832aca'
};

/**
 * Pick N random unique profiles from the available variants
 */
function pickRandomProfiles(count) {
  const shuffled = [...PROFILE_VARIANTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Find Person components within the Header's Diagonal facepile
 */
function findFacepilePersonComponents(headerNode) {
  const personComponents = [];

  function searchForPerson(node, depth = 0) {
    if (depth > 10) return;

    const name = node.name.toLowerCase();

    // Look for "Person" components or ".People profile pictures"
    if ((name.includes('person') || name.includes('people profile')) &&
        (node.type === 'INSTANCE' || node.type === 'COMPONENT')) {
      personComponents.push(node);
      return; // Don't recurse into Person components
    }

    if ('children' in node) {
      for (const child of node.children) {
        searchForPerson(child, depth + 1);
      }
    }
  }

  searchForPerson(headerNode);
  return personComponents;
}

/**
 * Set the profile variant on a Person/Profile component
 * Returns the Handle (username) if successful
 */
function setProfileVariant(personNode, variantName) {
  if (personNode.type !== 'INSTANCE') {
    console.log(`[PROFILE] Node is not an instance: ${personNode.name}`);
    return null;
  }

  try {
    const props = personNode.componentProperties;
    const propKeys = Object.keys(props);
    console.log(`[PROFILE] Component properties for "${personNode.name}":`, propKeys);
    console.log(`[PROFILE] Node ID: ${personNode.id}`);

    // Look for Handle property specifically (case-insensitive)
    let handleKey = null;
    for (const key of propKeys) {
      if (key.toLowerCase().includes('handle')) {
        handleKey = key;
        break;
      }
    }

    if (handleKey) {
      const propValue = props[handleKey];
      console.log(`[PROFILE] Found Handle property "${handleKey}" with current value: "${propValue.value}" (type: ${propValue.type})`);

      // WORKAROUND: First reset to a different value, then set to desired value
      // This forces Figma to actually re-render the component
      const currentValue = propValue.value;

      // If current value is different from target, we can set directly
      // But if somehow it's already set, we need to toggle it
      try {
        // First, try setting to a known different value to force a refresh
        if (currentValue === variantName) {
          console.log(`[PROFILE] Value already set to "${variantName}", forcing refresh...`);
          // Set to a different value first
          const tempValue = variantName === 'chantouflowergirl' ? 'gwangurl77' : 'chantouflowergirl';
          personNode.setProperties({ [handleKey]: tempValue });
        }

        // Now set to the desired value
        personNode.setProperties({ [handleKey]: variantName });

        // Verify the change was applied
        const newProps = personNode.componentProperties;
        const newValue = newProps[handleKey] ? newProps[handleKey].value : null;
        console.log(`[PROFILE] After setProperties, Handle value is now: "${newValue}"`);

        if (newValue === variantName) {
          console.log(`[PROFILE] ✓ Successfully set "${handleKey}" to "${variantName}"`);

          // WORKAROUND 1: Reset all overrides on the Person component to clear stale visual state
          try {
            if (typeof personNode.resetOverrides === 'function') {
              personNode.resetOverrides();
              console.log(`[PROFILE] Reset overrides on Person component`);
            }
          } catch (resetError) {
            console.log(`[PROFILE] Could not reset overrides:`, resetError.message);
          }

          // WORKAROUND 2: Try to force visual refresh by slightly adjusting opacity
          try {
            const originalOpacity = personNode.opacity;
            personNode.opacity = originalOpacity === 1 ? 0.999 : 1;
            personNode.opacity = originalOpacity;
            console.log(`[PROFILE] Forced visual refresh via opacity toggle`);
          } catch (opacityError) {
            // Ignore opacity errors - not all nodes support it
          }

          // WORKAROUND 3: Re-set the property after reset to ensure it takes effect
          try {
            personNode.setProperties({ [handleKey]: variantName });
            console.log(`[PROFILE] Re-set Handle property after reset`);
          } catch (resetSetError) {
            // Ignore if re-setting fails
          }

          return variantName;
        } else {
          console.log(`[PROFILE] ✗ Value did NOT change! Expected "${variantName}" but got "${newValue}"`);

          // DEBUG: Log all available variant values for this component
          try {
            const mainComp = personNode.mainComponent;
            if (mainComp && mainComp.parent && mainComp.parent.type === 'COMPONENT_SET') {
              const variantSet = mainComp.parent;
              const availableVariants = variantSet.children.map(c => c.name);
              console.log(`[PROFILE] Available variants in set:`, availableVariants.slice(0, 10), '...');
            }
          } catch (debugError) {
            console.log(`[PROFILE] Could not get available variants:`, debugError.message);
          }

          return null;
        }
      } catch (e) {
        console.log(`[PROFILE] Failed to set "${handleKey}" to "${variantName}":`, e.message);
      }
    } else {
      // Fall back to looking for any VARIANT or INSTANCE_SWAP property
      for (const key of propKeys) {
        const propValue = props[key];
        if (propValue.type === 'VARIANT' || propValue.type === 'INSTANCE_SWAP') {
          console.log(`[PROFILE] Found variant property "${key}" with current value:`, propValue.value);

          try {
            personNode.setProperties({ [key]: variantName });

            // Verify the change
            const newProps = personNode.componentProperties;
            const newValue = newProps[key] ? newProps[key].value : null;
            console.log(`[PROFILE] After setProperties, value is now: "${newValue}"`);

            if (newValue === variantName) {
              console.log(`[PROFILE] ✓ Successfully set "${key}" to "${variantName}"`);
              return variantName;
            } else {
              console.log(`[PROFILE] ✗ Value did NOT change!`);
            }
          } catch (e) {
            console.log(`[PROFILE] Failed to set "${key}" to "${variantName}":`, e.message);
          }
        }
      }
    }

    console.log(`[PROFILE] No Handle or variant property found for "${personNode.name}"`);
    return null;
  } catch (error) {
    console.error(`[PROFILE] Error setting variant:`, error);
    return null;
  }
}

/**
 * Find the Header Module in a Chat Thread
 */
function findHeaderModule(threadNode) {
  if ('children' in threadNode) {
    for (const child of threadNode.children) {
      const name = child.name.toLowerCase();
      if (name.includes('header')) {
        return child;
      }
    }
  }
  return null;
}

/**
 * Find the .Profile photo component in the Header Module
 */
function findProfilePhotoComponent(headerNode) {
  function search(node, depth = 0) {
    if (depth > 10) return null;

    const name = node.name.toLowerCase();

    // Look for "Profile photo" or ".Profile photo" component
    if ((name.includes('profile photo') || name.includes('.profile')) &&
        (node.type === 'INSTANCE' || node.type === 'COMPONENT')) {
      return node;
    }

    if ('children' in node) {
      for (const child of node.children) {
        const result = search(child, depth + 1);
        if (result) return result;
      }
    }

    return null;
  }

  return search(headerNode);
}

/**
 * Set the Profile type property to "Group" on a Profile photo component
 */
function setProfileTypeToGroup(profilePhotoNode) {
  return setProfileType(profilePhotoNode, 'Group');
}

/**
 * Set the Profile type property to "User" on a Profile photo component
 */
function setProfileTypeToUser(profilePhotoNode) {
  return setProfileType(profilePhotoNode, 'User');
}

/**
 * Set the Profile type property on a Profile photo component
 */
function setProfileType(profilePhotoNode, typeValue) {
  if (profilePhotoNode.type !== 'INSTANCE') {
    console.log(`[PROFILE] Profile photo is not an instance`);
    return false;
  }

  try {
    const props = profilePhotoNode.componentProperties;
    console.log(`[PROFILE] Profile photo properties:`, Object.keys(props));

    // Look for Profile type property
    for (const key of Object.keys(props)) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes('profile') && keyLower.includes('type')) {
        console.log(`[PROFILE] Found Profile type property: "${key}" with value:`, props[key].value);

        try {
          profilePhotoNode.setProperties({ [key]: typeValue });
          console.log(`[PROFILE] Successfully set Profile type to "${typeValue}"`);
          return true;
        } catch (e) {
          console.log(`[PROFILE] Failed to set Profile type:`, e.message);
        }
      }
    }

    console.log(`[PROFILE] No Profile type property found`);
    return false;
  } catch (error) {
    console.error(`[PROFILE] Error setting Profile type:`, error);
    return false;
  }
}

/**
 * Find ALL Person components with Handle property in the entire component tree
 * This does a fresh deep search to get current node references
 */
function findAllPersonComponentsWithHandle(rootNode) {
  const personComponents = [];

  function search(node, depth = 0) {
    if (depth > 25) return;

    const name = node.name.toLowerCase();
    const nodeType = node.type;

    // Look for Person component with Handle property
    if ((name.includes('person') || name.includes('people profile')) && nodeType === 'INSTANCE') {
      try {
        const props = node.componentProperties;
        const propKeys = Object.keys(props);

        if (propKeys.some(k => k.toLowerCase().includes('handle'))) {
          console.log(`[FIND ALL PERSONS] Found Person with Handle: "${node.name}" at depth ${depth}`);
          personComponents.push(node);
        }
      } catch (e) {
        // Skip nodes we can't read
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        search(child, depth + 1);
      }
    }
  }

  search(rootNode);
  return personComponents;
}

/**
 * Check if a node is inside the Header Module
 */
function isNodeInHeader(node) {
  let parent = node.parent;
  let depth = 0;

  while (parent && depth < 20) {
    const name = parent.name.toLowerCase();
    if (name.includes('header')) {
      return true;
    }
    if (parent.type === 'PAGE' || parent.type === 'DOCUMENT') {
      break;
    }
    parent = parent.parent;
    depth++;
  }

  return false;
}

/**
 * Create a realistic-looking full name from a username
 * Uses the first letter of the username to pick a realistic first name
 */
function createFallbackNameFromUsername(username) {
  // Common first names organized by first letter
  const firstNamesByLetter = {
    'a': ['Alex', 'Amanda', 'Andrew', 'Anna', 'Anthony', 'Ashley', 'Aiden', 'Aria', 'Austin', 'Audrey'],
    'b': ['Benjamin', 'Bella', 'Brandon', 'Brianna', 'Blake', 'Brooke', 'Brian', 'Bailey', 'Bradley', 'Bianca'],
    'c': ['Christopher', 'Charlotte', 'Caleb', 'Chloe', 'Cameron', 'Claire', 'Connor', 'Caroline', 'Carter', 'Cassidy'],
    'd': ['Daniel', 'Diana', 'David', 'Daisy', 'Dylan', 'Destiny', 'Derek', 'Delilah', 'Dominic', 'Dakota'],
    'e': ['Ethan', 'Emma', 'Elijah', 'Emily', 'Evan', 'Elena', 'Eric', 'Elizabeth', 'Edward', 'Eva'],
    'f': ['Felix', 'Faith', 'Finn', 'Fiona', 'Francisco', 'Felicity', 'Fernando', 'Francesca', 'Franklin', 'Flora'],
    'g': ['Gabriel', 'Grace', 'Gavin', 'Gabriella', 'George', 'Gianna', 'Grant', 'Genesis', 'Giovanni', 'Gemma'],
    'h': ['Henry', 'Hannah', 'Hunter', 'Haley', 'Harrison', 'Harper', 'Hayden', 'Heidi', 'Hugo', 'Holly'],
    'i': ['Isaac', 'Isabella', 'Ivan', 'Ivy', 'Ian', 'Iris', 'Isaiah', 'Isla', 'Ismael', 'Imani'],
    'j': ['James', 'Jessica', 'Jacob', 'Julia', 'Joshua', 'Jasmine', 'Jordan', 'Jade', 'Julian', 'Jocelyn'],
    'k': ['Kevin', 'Katherine', 'Kyle', 'Kylie', 'Kenneth', 'Kira', 'Keith', 'Kelly', 'Kai', 'Kimberly'],
    'l': ['Liam', 'Lily', 'Lucas', 'Luna', 'Logan', 'Layla', 'Leo', 'Lauren', 'Luke', 'Leah'],
    'm': ['Michael', 'Maria', 'Mason', 'Mia', 'Matthew', 'Madison', 'Marcus', 'Maya', 'Max', 'Melissa'],
    'n': ['Nathan', 'Natalie', 'Noah', 'Nicole', 'Nicholas', 'Nora', 'Nolan', 'Naomi', 'Neil', 'Nina'],
    'o': ['Oliver', 'Olivia', 'Oscar', 'Ophelia', 'Owen', 'Octavia', 'Omar', 'Opal', 'Orion', 'Odessa'],
    'p': ['Patrick', 'Penelope', 'Peter', 'Paige', 'Paul', 'Piper', 'Philip', 'Priscilla', 'Preston', 'Pearl'],
    'q': ['Quinn', 'Queenie', 'Quentin', 'Quincy', 'Quinton', 'Queen', 'Quillan', 'Quella', 'Quest', 'Quinta'],
    'r': ['Ryan', 'Rachel', 'Robert', 'Rebecca', 'Richard', 'Riley', 'Raymond', 'Rosa', 'Ryder', 'Ruby'],
    's': ['Samuel', 'Sophia', 'Sebastian', 'Sarah', 'Steven', 'Stella', 'Scott', 'Samantha', 'Shane', 'Sierra'],
    't': ['Thomas', 'Taylor', 'Tyler', 'Trinity', 'Timothy', 'Tessa', 'Trevor', 'Tiffany', 'Tristan', 'Thea'],
    'u': ['Ulysses', 'Uma', 'Uriel', 'Unity', 'Urban', 'Ursula', 'Umar', 'Una', 'Usher', 'Unique'],
    'v': ['Victor', 'Victoria', 'Vincent', 'Valentina', 'Vaughn', 'Vanessa', 'Vince', 'Vera', 'Vernon', 'Violet'],
    'w': ['William', 'Willow', 'Wesley', 'Wendy', 'Walter', 'Whitney', 'Wyatt', 'Willa', 'Warren', 'Winter'],
    'x': ['Xavier', 'Ximena', 'Xander', 'Xyla', 'Xeno', 'Xiomara', 'Xerxes', 'Xena', 'Xavi', 'Xia'],
    'y': ['Yusuf', 'Yara', 'Yosef', 'Yasmine', 'Yuri', 'Yvonne', 'Yael', 'Yolanda', 'Yahir', 'Yvette'],
    'z': ['Zachary', 'Zoe', 'Zane', 'Zara', 'Zander', 'Zelda', 'Zion', 'Zena', 'Zeke', 'Zinnia']
  };

  // Common last names
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White'];

  // Get the first letter of the username (lowercase)
  const cleanedUsername = username.replace(/[^a-zA-Z]/g, '');
  const firstLetter = cleanedUsername.length > 0 ? cleanedUsername.charAt(0).toLowerCase() : 'a';

  // Get first names for this letter, or default to 'a' names
  const firstNames = firstNamesByLetter[firstLetter] || firstNamesByLetter['a'];

  // Pick a random first name and last name
  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return randomFirstName + ' ' + randomLastName;
}

/**
 * Find Title and Body text nodes in the Header Module
 * Based on component structure:
 * - Header Module > Profile + Text > Text > Title text > Name (TEXT)
 * - Header Module > Profile + Text > Text > Body text > 1st Body line (TEXT)
 * Returns { titleNode, bodyNode } or null values if not found
 */
function findHeaderTitleAndBody(headerNode) {
  let titleNode = null;
  let bodyNode = null;

  function search(node, depth = 0, parentName = '') {
    if (depth > 15) return;
    if (titleNode && bodyNode) return; // Found both, stop searching

    const name = node.name.toLowerCase();
    const nodeType = node.type;
    const parentLower = parentName.toLowerCase();

    if (nodeType === 'TEXT') {
      // Look for "Name" text node inside "Title text" container
      if (name === 'name' && parentLower.includes('title')) {
        console.log(`[HEADER TEXT] Found Name node inside Title text: "${node.name}" with text: "${node.characters}"`);
        titleNode = node;
      }
      // Look for "1st Body line" text node inside "Body text" container
      else if (name.includes('1st body') || name === '1st body line') {
        console.log(`[HEADER TEXT] Found 1st Body line node: "${node.name}" with text: "${node.characters}"`);
        bodyNode = node;
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        search(child, depth + 1, node.name);
        if (titleNode && bodyNode) return;
      }
    }
  }

  search(headerNode);

  // Debug: If not found, log what we did find
  if (!titleNode || !bodyNode) {
    console.log(`[HEADER TEXT] Search result - titleNode: ${titleNode ? 'found' : 'NOT FOUND'}, bodyNode: ${bodyNode ? 'found' : 'NOT FOUND'}`);
    // Do a more detailed search to see what text nodes exist
    function debugSearch(node, depth = 0, path = '') {
      if (depth > 15) return;
      const currentPath = path ? `${path} > ${node.name}` : node.name;
      if (node.type === 'TEXT') {
        console.log(`[HEADER TEXT DEBUG] Text node found: "${currentPath}" = "${node.characters}"`);
      }
      if ('children' in node) {
        for (const child of node.children) {
          debugSearch(child, depth + 1, currentPath);
        }
      }
    }
    debugSearch(headerNode);
  }

  return { titleNode, bodyNode };
}

/**
 * Find all recipient Chat blocks in a Chat Thread
 */
function findRecipientChatBlocks(threadNode) {
  const recipientBlocks = [];

  function searchForBlocks(node, depth = 0) {
    if (depth > 5) return;

    const name = node.name.toLowerCase();

    // Check for chat block patterns
    const isBlock = name.includes('chat block') || name.includes('block');

    if (isBlock && (node.type === 'INSTANCE' || node.type === 'COMPONENT' || node.type === 'FRAME')) {
      // Check if this is a recipient block
      if (isRecipientNode(node)) {
        recipientBlocks.push(node);
        return; // Don't recurse into blocks
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        searchForBlocks(child, depth + 1);
      }
    }
  }

  searchForBlocks(threadNode);
  return recipientBlocks;
}

/**
 * Find the profile photo component within a Chat block
 * Need to find the Person component with Handle property, which may be deeply nested
 * Structure can be: Text chat > Chat + Reaction > Content > Profile > Profile photo > Profile Photo > Person
 */
function findProfileInBlock(blockNode) {
  console.log(`[BLOCK PROFILE] ========================================`);
  console.log(`[BLOCK PROFILE] Searching for profile in block: "${blockNode.name}" (${blockNode.type})`);
  console.log(`[BLOCK PROFILE] Block ID: ${blockNode.id}`);

  let foundPerson = null;
  let allInstancesFound = []; // Track all instances we find for debugging

  function search(node, depth = 0, path = '') {
    if (depth > 25) return; // Increased depth for very deep nesting
    if (foundPerson) return; // Stop if already found

    const nodeType = node.type;
    const currentPath = path ? `${path} > ${node.name}` : node.name;

    // Log all nodes at first 15 levels for debugging
    if (depth < 15) {
      console.log(`[BLOCK PROFILE] (depth ${depth}): "${node.name}" (${nodeType})`);
    }

    // Check ANY INSTANCE node for Handle property - not just ones named "person"
    if (nodeType === 'INSTANCE') {
      try {
        const props = node.componentProperties;
        const propKeys = Object.keys(props);

        // Log all instances we find
        allInstancesFound.push({ name: node.name, path: currentPath, props: propKeys });

        if (propKeys.some(k => k.toLowerCase().includes('handle'))) {
          console.log(`[BLOCK PROFILE] ✓ Found INSTANCE with Handle property!`);
          console.log(`[BLOCK PROFILE]   Name: "${node.name}"`);
          console.log(`[BLOCK PROFILE]   Path: ${currentPath}`);
          console.log(`[BLOCK PROFILE]   Properties: ${propKeys.join(', ')}`);
          console.log(`[BLOCK PROFILE]   Node ID: ${node.id}`);
          foundPerson = node;
          return;
        }
      } catch (e) {
        console.log(`[BLOCK PROFILE] Could not read properties of "${node.name}":`, e.message);
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        search(child, depth + 1, currentPath);
        if (foundPerson) return;
      }
    }
  }

  search(blockNode);

  // Log all instances found for debugging
  console.log(`[BLOCK PROFILE] Total INSTANCE nodes found: ${allInstancesFound.length}`);
  for (const inst of allInstancesFound) {
    console.log(`[BLOCK PROFILE]   - "${inst.name}" at ${inst.path}`);
    console.log(`[BLOCK PROFILE]     Props: ${inst.props.join(', ') || 'none'}`);
  }

  if (foundPerson) {
    console.log(`[BLOCK PROFILE] ✓ Returning Person node: "${foundPerson.name}"`);
    return foundPerson;
  }

  console.log(`[BLOCK PROFILE] ✗ No node with Handle property found in block "${blockNode.name}"`);
  console.log(`[BLOCK PROFILE] ========================================`);
  return null;
}

/**
 * Find all recipient Chat blocks and their profile photo components
 */
function findRecipientBlocksWithPhotos(threadNode) {
  const recipientBlocks = [];

  function searchForBlocks(node, depth = 0) {
    if (depth > 5) return;

    const name = node.name.toLowerCase();

    // Check for chat block patterns that are recipient type
    const isBlock = (name.includes('chat block') || name.includes('block')) &&
                    (name.includes('recipient') || !name.includes('sender'));

    if (isBlock && (node.type === 'INSTANCE' || node.type === 'COMPONENT' || node.type === 'FRAME')) {
      // Check if this is actually a recipient block
      if (isRecipientNode(node)) {
        const profilePhotos = findProfilePhotos(node);
        recipientBlocks.push({
          block: node,
          profilePhotos: profilePhotos
        });
        return;
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        searchForBlocks(child, depth + 1);
      }
    }
  }

  searchForBlocks(threadNode);
  return recipientBlocks;
}

/**
 * Find "created the chat." text node within the thread
 * This is typically in an admin/system message area
 */
function findCreatedChatText(threadNode) {
  let foundTextNode = null;

  function search(node, depth = 0) {
    if (depth > 20) return;
    if (foundTextNode) return;

    if (node.type === 'TEXT') {
      const text = node.characters.toLowerCase();
      if (text.includes('created the chat')) {
        console.log(`[CREATED CHAT] Found text node: "${node.name}" with text: "${node.characters}"`);
        foundTextNode = node;
        return;
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        search(child, depth + 1);
        if (foundTextNode) return;
      }
    }
  }

  search(threadNode);
  return foundTextNode;
}

/**
 * Update "created the chat." text with the appropriate username
 * - If Person A (sender) sends first message → "You created the chat."
 * - If Person B or C sends first message → "{username} created the chat."
 */
async function updateCreatedChatText(threadNode, structure, profilesAssigned) {
  const createdChatNode = findCreatedChatText(threadNode);

  if (!createdChatNode) {
    console.log('[CREATED CHAT] No "created the chat." text found');
    return false;
  }

  // Find the first message in the conversation
  if (!structure || structure.length === 0) {
    console.log('[CREATED CHAT] No messages in structure');
    return false;
  }

  const firstMessage = structure[0];
  let creatorName;

  if (firstMessage.type === 'sender' || firstMessage.person === 'A') {
    // Person A (you) sent the first message
    creatorName = 'You';
  } else {
    // Person B or C sent the first message - use their assigned username
    const person = firstMessage.person; // 'B' or 'C'
    creatorName = profilesAssigned[person] || 'Someone';
  }

  const newText = `${creatorName} created the chat.`;
  console.log(`[CREATED CHAT] Setting text to: "${newText}"`);

  const success = await setTextNodeContent(createdChatNode, newText);
  if (success) {
    console.log(`[CREATED CHAT] Successfully updated to: "${newText}"`);
  } else {
    console.log(`[CREATED CHAT] Failed to update text`);
  }

  return success;
}

/**
 * Find Admin text nodes within a Chat block (Eyebrow text)
 * Returns the first text node found that can be used for the username
 */
function findAdminText(blockNode) {
  let foundTextNode = null;

  function searchForTextInNode(node, depth = 0) {
    if (depth > 10) return;
    if (foundTextNode) return;

    if (node.type === 'TEXT') {
      console.log(`[ADMIN TEXT] Found text node inside Eyebrow: "${node.name}"`);
      foundTextNode = node;
      return;
    }

    if ('children' in node) {
      for (const child of node.children) {
        searchForTextInNode(child, depth + 1);
        if (foundTextNode) return;
      }
    }
  }

  function search(node, depth = 0) {
    if (depth > 15) return;
    if (foundTextNode) return;

    const name = node.name.toLowerCase();
    const nodeType = node.type;

    // Check if this is an Eyebrow container - search for ANY text node inside
    if (name.includes('eyebrow')) {
      console.log(`[ADMIN TEXT] Found Eyebrow container: "${node.name}" (${nodeType})`);
      // Search for any text node inside this eyebrow container
      searchForTextInNode(node, 0);
      if (foundTextNode) return;
    }

    // Also check for direct text node matches as fallback
    if (nodeType === 'TEXT') {
      if (name.includes('admin') || name.includes('username') ||
          name.includes('handle') || name.includes('name')) {
        console.log(`[ADMIN TEXT] Found text node by name: "${node.name}"`);
        foundTextNode = node;
        return;
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        search(child, depth + 1);
        if (foundTextNode) return;
      }
    }
  }

  search(blockNode);
  return foundTextNode;
}

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
 * Now detects group chats by checking the component's "Group chat?" property first,
 * then falling back to checking for multiple unique profile photos
 */
function analyzeChatStructure(threadNode) {
  // First, check if the component has a "Group chat?" property
  let isGroupChatFromProperty = null;

  if (threadNode.type === 'INSTANCE') {
    try {
      const props = threadNode.componentProperties;
      for (const key of Object.keys(props)) {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('group')) {
          const value = props[key].value;
          // Handle both boolean and string variants
          if (typeof value === 'boolean') {
            isGroupChatFromProperty = value;
          } else if (typeof value === 'string') {
            isGroupChatFromProperty = value.toLowerCase() === 'true';
          }
          console.log(`[ANALYZE] Found "Group chat?" property: ${key} = ${value} → isGroupChat = ${isGroupChatFromProperty}`);
          break;
        }
      }
    } catch (e) {
      console.log('[ANALYZE] Could not read component properties:', e.message);
    }
  }

  // Find chat blocks first
  let chatBlocks = findChatBlocks(threadNode);

  // Track unique recipient profile photos for group chat detection (fallback)
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

  // Use the component property if available, otherwise fall back to profile detection
  const isGroupChat = isGroupChatFromProperty !== null ? isGroupChatFromProperty : recipientProfiles.size > 1;
  const recipientPhotoIds = Array.from(recipientProfiles.keys());

  console.log(`[ANALYZE] isGroupChatFromProperty: ${isGroupChatFromProperty}, recipientProfiles.size: ${recipientProfiles.size}, final isGroupChat: ${isGroupChat}`);

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
  return groups.map((g) => {
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
// DIAGNOSTIC: Log all component properties in a Chat Thread
// Run this to discover reaction properties
// ============================================================================

function diagnosticLogAllProperties(node, maxDepth = 15) {
  const results = {
    instances: [],
    summary: {}
  };

  function search(n, depth = 0, path = '') {
    if (depth > maxDepth) return;

    const currentPath = path ? `${path} > ${n.name}` : n.name;
    const nameLower = n.name.toLowerCase();

    // Log all INSTANCE nodes with their properties
    if (n.type === 'INSTANCE') {
      try {
        const props = n.componentProperties;
        const propKeys = Object.keys(props);
        const propDetails = {};

        for (const key of propKeys) {
          const prop = props[key];
          propDetails[key] = {
            type: prop.type,
            value: prop.value
          };

          // Track property names for summary
          if (!results.summary[key]) {
            results.summary[key] = { count: 0, values: new Set(), types: new Set() };
          }
          results.summary[key].count++;
          results.summary[key].values.add(String(prop.value));
          results.summary[key].types.add(prop.type);
        }

        // Check if this might be reaction-related
        const isReactionRelated = nameLower.includes('reaction') ||
                                   nameLower.includes('emoji') ||
                                   propKeys.some(k => k.toLowerCase().includes('reaction')) ||
                                   propKeys.some(k => k.toLowerCase().includes('emoji'));

        if (isReactionRelated || propKeys.length > 0) {
          results.instances.push({
            name: n.name,
            path: currentPath,
            depth: depth,
            isReactionRelated: isReactionRelated,
            properties: propDetails
          });
        }
      } catch (e) {
        // Skip nodes we can't read
      }
    }

    if ('children' in n) {
      for (const child of n.children) {
        search(child, depth + 1, currentPath);
      }
    }
  }

  search(node);

  // Log reaction-related instances first
  console.log('='.repeat(80));
  console.log('DIAGNOSTIC: Component Properties Analysis');
  console.log('='.repeat(80));

  const reactionInstances = results.instances.filter(i => i.isReactionRelated);
  if (reactionInstances.length > 0) {
    console.log('\n🎯 REACTION-RELATED COMPONENTS FOUND:');
    for (const inst of reactionInstances) {
      console.log(`\n  📦 "${inst.name}" (depth: ${inst.depth})`);
      console.log(`     Path: ${inst.path}`);
      console.log(`     Properties:`);
      for (const [key, val] of Object.entries(inst.properties)) {
        console.log(`       - ${key}: ${val.value} (${val.type})`);
      }
    }
  } else {
    console.log('\n⚠️ No obviously reaction-related components found.');
    console.log('   Looking for components with interesting properties...');
  }

  // Log property summary
  console.log('\n📊 PROPERTY SUMMARY (all properties found):');
  const sortedProps = Object.entries(results.summary)
    .sort((a, b) => b[1].count - a[1].count);

  for (const [propName, data] of sortedProps) {
    const values = Array.from(data.values).slice(0, 5).join(', ');
    const moreValues = data.values.size > 5 ? ` (+${data.values.size - 5} more)` : '';
    console.log(`  ${propName}: ${data.count}x, values: [${values}${moreValues}]`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('END DIAGNOSTIC');
  console.log('='.repeat(80));

  return results;
}

// ============================================================================
// REACTIONS: Find Text chat components and apply reactions
// ============================================================================

/**
 * Available emoji for reactions - these map to Figma component names
 */
const REACTION_EMOJI = [
  { name: 'Red Heart', keywords: ['love', 'heart', 'miss', 'care', 'sweet', 'cute', 'aww', 'babe', 'baby', 'xo', '❤️', 'thanks', 'thank', 'appreciate', 'grateful', 'best', 'amazing'] },
  { name: 'Purple Heart', keywords: ['love', 'purple', 'fave', 'favorite', 'bestie', 'bff', 'always', 'forever'] },
  { name: 'Fire', keywords: ['fire', 'hot', 'lit', 'amazing', 'insane', 'crazy', 'sick', 'dope', 'heat', 'flames', 'killing', 'slay', 'ate', 'served', 'iconic'] },
  { name: 'Face with Tears of Joy', keywords: ['lol', 'lmao', 'haha', 'hilarious', 'funny', 'dead', 'dying', 'crying', 'joke', 'omg', 'bruh', 'bro', 'stop', 'cant', "can't", 'wheeze', '😂', 'jk', 'kidding'] },
  { name: 'Loudly Crying Face', keywords: ['sad', 'cry', 'crying', 'sob', 'miss', 'wish', 'ugh', 'hate', 'worst', 'terrible', 'awful', 'no', 'whyy', 'pain', 'hurt', 'lonely', 'depressed'] },
  { name: 'Smiling Face with Heart-Eyes', keywords: ['love', 'gorgeous', 'beautiful', 'pretty', 'handsome', 'hot', 'cute', 'obsessed', 'perfect', 'goals', 'wow', 'stunning', 'dreamy', 'crush'] },
  { name: 'Thumbs Up', keywords: ['ok', 'okay', 'sure', 'yes', 'yep', 'yeah', 'good', 'cool', 'nice', 'great', 'sounds', 'bet', 'works', 'done', 'got it', 'gotcha', 'perfect', 'agree', 'down'] },
  { name: 'Clapping Hands', keywords: ['congrats', 'congratulations', 'proud', 'amazing', 'awesome', 'incredible', 'well done', 'bravo', 'yay', 'finally', 'win', 'won', 'did it', 'made it', 'achieved'] },
  { name: 'Folded Hands', keywords: ['please', 'pray', 'hope', 'thanks', 'thank', 'grateful', 'bless', 'wish', 'fingers crossed', 'hopefully', 'praying', 'amen'] },
  { name: 'Hundred Points', keywords: ['100', 'facts', 'true', 'truth', 'exactly', 'real', 'agree', 'right', 'perfect', 'spot on', 'accurate', 'legit', 'fr', 'no cap', 'period'] },
  { name: 'Face Screaming in Fear', keywords: ['omg', 'what', 'shocked', 'surprised', 'crazy', 'insane', 'cant believe', "can't believe", 'no way', 'seriously', 'shook', 'wild', 'unreal', 'wtf', 'wait'] },
  { name: 'Sparkles', keywords: ['new', 'exciting', 'special', 'magic', 'amazing', 'beautiful', 'aesthetic', 'vibes', 'perfect', 'love', 'yay', 'finally', 'dream', 'happy', 'blessed'] }
];

/**
 * Pick a contextual emoji from ONLY the discovered available emoji
 * @param {string} messageText - The text content of the message
 * @param {Map} emojiMap - Map of discovered emoji names to component keys
 * @returns {string} - The emoji name to use
 */
function pickContextualEmojiFromAvailable(messageText, emojiMap) {
  // Get the list of available emoji names
  const availableEmoji = Array.from(emojiMap.keys());

  if (availableEmoji.length === 0) {
    return 'Red Heart'; // Fallback if nothing discovered
  }

  if (!messageText || messageText.trim().length === 0) {
    // Random from available
    const picked = availableEmoji[Math.floor(Math.random() * availableEmoji.length)];
    console.log(`[EMOJI PICK] No text, random pick: "${picked}"`);
    return picked;
  }

  const textLower = messageText.toLowerCase();

  // Define keyword mappings for common emoji names
  // Categories match parts of emoji names (e.g., "heart" matches "Red Heart", "Purple Heart")
  const emojiKeywords = {
    'heart': ['love', 'heart', 'miss', 'care', 'sweet', 'cute', 'aww', 'thanks', 'thank', 'appreciate', 'best', 'amazing', 'babe', 'baby', 'xo', '❤️', 'ily', 'luv', 'adore', 'beautiful', 'gorgeous', 'pretty'],
    'purple': ['purple', 'fave', 'favorite', 'bestie', 'bff', 'always', 'forever', 'queen', 'slay', 'iconic'],
    'thumbs': ['ok', 'okay', 'sure', 'yes', 'yep', 'yeah', 'good', 'cool', 'nice', 'great', 'sounds', 'bet', 'works', 'done', 'got it', 'agree', 'down', 'perfect', 'fine', 'alright', 'np', 'no problem', 'kk', 'k'],
    'grinning': ['lol', 'haha', 'hehe', 'funny', 'hilarious', 'joke', 'laugh', 'silly', 'goofy', ':)', '😊', 'happy', 'yay', 'excited'],
    'joy': ['lol', 'lmao', 'haha', 'hahaha', 'hilarious', 'funny', 'dead', 'dying', 'crying', 'joke', 'omg', 'bruh', 'bro', 'stop', 'im dead', "i'm dead", 'wheeze', '😂', 'jk', 'kidding', 'rofl'],
    'fire': ['fire', 'hot', 'lit', 'amazing', 'insane', 'crazy', 'sick', 'dope', 'slay', 'ate', 'served', 'heat', 'flames', 'killing it', 'goat', 'legendary', 'epic', 'wild', 'bussin'],
    'crying': ['sad', 'cry', 'crying', 'sob', 'miss you', 'ugh', 'hate', 'worst', 'terrible', 'awful', 'depressed', 'lonely', 'pain', 'hurt'],
    'pouting': ['mad', 'angry', 'annoyed', 'frustrated', 'ugh', 'hate', 'annoying', 'irritated', 'pissed', 'wtf', 'seriously', 'really'],
    'scream': ['omg', 'what', 'shocked', 'surprised', 'no way', 'shook', 'wtf', 'wait', 'hold up', 'excuse me', 'are you serious', 'cant believe', "can't believe", 'unreal', 'insane', 'crazy', 'wild'],
    'sparkle': ['new', 'exciting', 'special', 'magic', 'beautiful', 'perfect', 'aesthetic', 'vibes', 'blessed', 'dream', 'finally', 'yay'],
    'clap': ['congrats', 'proud', 'amazing', 'awesome', 'yay', 'finally', 'win', 'won', 'did it', 'made it', 'achieved', 'bravo'],
    'pray': ['please', 'pray', 'hope', 'thanks', 'grateful', 'bless', 'fingers crossed', 'hopefully', 'amen'],
    'hundred': ['100', 'facts', 'true', 'exactly', 'real', 'agree', 'fr', 'no cap', 'period', 'literally', 'so true', 'right'],
    'eyes': ['lol', 'haha', 'funny', 'wow', 'omg', 'look', 'see', 'check']
  };

  // Score each available emoji
  const scores = availableEmoji.map(emojiName => {
    const nameLower = emojiName.toLowerCase();
    let score = 0;

    // Check each keyword category
    for (const [category, keywords] of Object.entries(emojiKeywords)) {
      // If this emoji name contains the category keyword
      if (nameLower.includes(category)) {
        // Check if the message contains any of the keywords
        for (const keyword of keywords) {
          if (textLower.includes(keyword)) {
            score += 1;
            if (keyword.length > 4) score += 0.5;
          }
        }
      }
    }

    return { name: emojiName, score };
  });

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  // If we have matches, pick from top scorers
  if (scores[0].score > 0) {
    const topScore = scores[0].score;
    const topEmoji = scores.filter(s => s.score >= topScore * 0.7 && s.score > 0);
    const picked = topEmoji[Math.floor(Math.random() * topEmoji.length)].name;
    console.log(`[EMOJI PICK] Text: "${textLower.substring(0, 50)}..." → picked "${picked}" (score: ${topScore})`);
    return picked;
  }

  // No matches - pick random from available
  const randomPick = availableEmoji[Math.floor(Math.random() * availableEmoji.length)];
  console.log(`[EMOJI PICK] No keyword match for "${textLower.substring(0, 30)}...", random: "${randomPick}"`);
  return randomPick;
}

/**
 * Find all chat components that can have reactions within a Chat Thread
 * This includes: Text chat, Media chat, and External link components
 * These are the components that have the Reaction boolean property
 */
function findAllReactableChatComponents(node) {
  const chatComponents = [];

  function search(n, depth = 0) {
    if (depth > 10) return;

    const name = n.name.toLowerCase();

    // Look for "Text chat", "Media chat", or "External link" components
    if ((name.includes('text chat') || name.includes('media chat') || name.includes('external link')) && n.type === 'INSTANCE') {
      chatComponents.push(n);
      return; // Don't recurse into these components
    }

    if ('children' in n) {
      for (const child of n.children) {
        search(child, depth + 1);
      }
    }
  }

  search(node);
  return chatComponents;
}

/**
 * Find all Text chat components within a Chat Thread
 * These are the components that have the Reaction boolean property
 */
function findTextChatComponents(node) {
  const textChats = [];

  function search(n, depth = 0) {
    if (depth > 10) return;

    const name = n.name.toLowerCase();

    // Look for "Text chat" components
    if (name.includes('text chat') && n.type === 'INSTANCE') {
      textChats.push(n);
      return; // Don't recurse into Text chat components
    }

    if ('children' in n) {
      for (const child of n.children) {
        search(child, depth + 1);
      }
    }
  }

  search(node);
  return textChats;
}

/**
 * Set the Reaction property on a Text chat component
 * Also sets the Reactions variant to "1" for 1:1 chats (single emoji)
 * @param {SceneNode} textChatNode - The Text chat component
 * @param {boolean} enabled - Whether to enable or disable the reaction
 * @param {boolean} isGroupChat - Whether this is a group chat
 * @param {string[]} emojiList - Array of emoji names to randomly pick from
 * @param {Map} emojiMap - Map of emoji names to component keys (optional)
 */
function setReactionOnTextChat(textChatNode, enabled, isGroupChat = false, emojiList = ['Red Heart'], emojiMap = null) {
  if (textChatNode.type !== 'INSTANCE') {
    return false;
  }

  try {
    const props = textChatNode.componentProperties;
    const propKeys = Object.keys(props);

    // Find the Reaction boolean property (format: "Reaction#131467:0")
    let reactionKey = null;
    for (const key of propKeys) {
      if (key.toLowerCase().includes('reaction') && props[key].type === 'BOOLEAN') {
        reactionKey = key;
        break;
      }
    }

    if (reactionKey) {
      textChatNode.setProperties({ [reactionKey]: enabled });

      // If enabling reaction, also find and set the nested .Chat reaction component
      if (enabled) {
        setChatReactionVariant(textChatNode, isGroupChat, emojiList, emojiMap);
      }

      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(`[REACTION] Error setting reaction:`, error);
    return false;
  }
}

/**
 * Discover emoji component IDs by finding existing emoji instances in the ENTIRE PAGE
 * This searches beyond just the selected thread to find more emoji variety
 * Returns a map of emoji names to their component keys
 */
function discoverEmojiComponentIds(threadNode) {
  const emojiMap = new Map();

  function search(node, depth = 0) {
    if (depth > 25) return;

    const name = node.name.toLowerCase();

    // Look for emoji-related components
    if (node.type === 'INSTANCE') {
      try {
        // Check if this node's name suggests it's an emoji
        const emojiKeywords = ['heart', 'fire', 'joy', 'crying', 'thumbs', 'clap', 'pray', 'hundred', 'scream', 'sparkle', 'emoji', 'face', 'grinning', 'smiling', 'beaming', 'sunglasses', 'eyes'];
        const isEmojiByName = emojiKeywords.some(k => name.includes(k));

        if (isEmojiByName && node.mainComponent) {
          const mainComp = node.mainComponent;
          const compName = mainComp.name;
          const compKey = mainComp.key || mainComp.id;

          if (compKey && !emojiMap.has(compName)) {
            emojiMap.set(compName, compKey);
            console.log(`[EMOJI DISCOVER] Found: "${compName}" → ${compKey}`);
          }
        }

        // Also check INSTANCE_SWAP properties for emoji references
        const props = node.componentProperties;
        for (const key of Object.keys(props)) {
          if (key.toLowerCase().includes('emoji') && props[key].type === 'INSTANCE_SWAP') {
            const currentValue = props[key].value;
            if (currentValue) {
              // Try to get the component from this ID
              try {
                const compNode = figma.getNodeById(currentValue);
                if (compNode && (compNode.type === 'COMPONENT' || compNode.type === 'INSTANCE')) {
                  const compName = compNode.name;
                  const compKey = compNode.type === 'COMPONENT' ? (compNode.key || compNode.id) : currentValue;
                  if (!emojiMap.has(compName)) {
                    emojiMap.set(compName, compKey);
                    console.log(`[EMOJI DISCOVER] Found via INSTANCE_SWAP: "${compName}" → ${compKey}`);
                  }
                }
              } catch (e) {
                // Could not get node by ID
              }
            }
          }
        }
      } catch (e) {
        // Skip nodes we can't read
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        search(child, depth + 1);
      }
    }
  }

  // Only search the selected thread (not entire page - that's slow)
  // Hard-coded keys cover the main emoji, discovery just finds any extras
  search(threadNode);

  // Log summary
  console.log(`[EMOJI DISCOVER] Found ${emojiMap.size} additional emoji in thread`);

  return emojiMap;
}

/**
 * Find the .Chat reaction component nested within a Text chat and set its Reactions variant
 * For 1:1 chats, we set Reactions to "1" (single emoji)
 * For group chats, we could randomize between "1", "2", "3"
 * @param {SceneNode} textChatNode - The Text chat component
 * @param {boolean} isGroupChat - Whether this is a group chat
 * @param {string[]} emojiList - Array of emoji names to use
 * @param {Map} emojiMap - Map of emoji names to component keys (optional)
 */
function setChatReactionVariant(textChatNode, isGroupChat = false, emojiList = ['Red Heart'], emojiMap = null) {
  function findChatReaction(node, depth = 0) {
    if (depth > 15) return null;

    const name = node.name.toLowerCase();

    // Look for ".Chat reaction" component
    if (name.includes('chat reaction') && node.type === 'INSTANCE') {
      return node;
    }

    if ('children' in node) {
      for (const child of node.children) {
        const result = findChatReaction(child, depth + 1);
        if (result) return result;
      }
    }

    return null;
  }

  const chatReactionNode = findChatReaction(textChatNode);

  if (!chatReactionNode) {
    return false;
  }

  try {
    const props = chatReactionNode.componentProperties;
    const propKeys = Object.keys(props);

    // Find the Reactions variant property
    let reactionsKey = null;
    for (const key of propKeys) {
      if (key.toLowerCase() === 'reactions' && props[key].type === 'VARIANT') {
        reactionsKey = key;
        break;
      }
    }

    if (reactionsKey) {
      // For 1:1 chats, always use "1" (single emoji)
      const reactionCount = isGroupChat ? String(Math.floor(Math.random() * 2) + 1) : "1";
      chatReactionNode.setProperties({ [reactionsKey]: reactionCount });
    }

    // If we have an emoji map, try to swap emoji
    if (emojiMap && emojiMap.size > 0 && emojiList.length > 0) {
      console.log(`[EMOJI SWAP] Attempting swap with emojiList:`, emojiList);
      console.log(`[EMOJI SWAP] Available in emojiMap:`, Array.from(emojiMap.keys()));

      // Find emoji INSTANCE_SWAP properties
      for (const key of propKeys) {
        if (key.toLowerCase().includes('emoji') && props[key].type === 'INSTANCE_SWAP') {
          console.log(`[EMOJI SWAP] Found INSTANCE_SWAP property: "${key}", current value: ${props[key].value}`);

          // Pick the emoji from the list (should be the contextually chosen one)
          const targetEmojiName = emojiList[0];
          console.log(`[EMOJI SWAP] Target emoji: "${targetEmojiName}"`);

          // Find the matching component key from our discovered map
          let foundKey = null;
          let foundName = null;
          for (const [name, compKey] of emojiMap.entries()) {
            if (name.toLowerCase() === targetEmojiName.toLowerCase() ||
                name.toLowerCase().includes(targetEmojiName.toLowerCase()) ||
                targetEmojiName.toLowerCase().includes(name.toLowerCase())) {
              foundKey = compKey;
              foundName = name;
              break;
            }
          }

          if (foundKey) {
            console.log(`[EMOJI SWAP] Found matching key for "${foundName}": ${foundKey}`);
            try {
              chatReactionNode.setProperties({ [key]: foundKey });
              console.log(`[EMOJI SWAP] ✓ Successfully set ${key} to ${foundKey}`);
            } catch (e) {
              console.log(`[EMOJI SWAP] ✗ Failed to set property:`, e.message);
            }
          } else {
            console.log(`[EMOJI SWAP] ✗ No matching key found for "${targetEmojiName}"`);
          }
          break; // Only set the first emoji property for 1:1 chats
        }
      }
    } else {
      console.log(`[EMOJI SWAP] Skipped - emojiMap size: ${emojiMap ? emojiMap.size : 0}, emojiList length: ${emojiList ? emojiList.length : 0}`);
    }

    return true;
  } catch (error) {
    console.error(`[REACTION] Error setting reaction variant:`, error);
    return false;
  }
}

/**
 * Find an emoji component by its name
 * Returns the component key/id that can be used for INSTANCE_SWAP
 * @param {string} emojiName - The name of the emoji (e.g., "Red Heart", "Fire")
 */
function findEmojiComponentByName(emojiName) {
  // First, try to find the component in the current page's components
  const searchName = emojiName.toLowerCase();

  function searchForComponent(node, depth = 0) {
    if (depth > 3) return null;

    // Check if this is a component or component set with matching name
    if ((node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') &&
        node.name.toLowerCase().includes(searchName)) {
      console.log(`[EMOJI SEARCH] Found matching component: "${node.name}" (${node.type}), key: ${node.key}`);
      return node.key || node.id;
    }

    if ('children' in node) {
      for (const child of node.children) {
        const result = searchForComponent(child, depth + 1);
        if (result) return result;
      }
    }

    return null;
  }

  // Search in the current page first
  const pageResult = searchForComponent(figma.currentPage);
  if (pageResult) return pageResult;

  // If not found, we can't easily search libraries without more context
  // The emoji components are likely from a library, so we need to use
  // the actual component IDs from the existing instance

  console.log(`[EMOJI SEARCH] Could not find component for "${emojiName}" in current page`);
  return null;
}

/**
 * Apply reactions to all reactable chat components with randomized spacing
 * Includes: Text chat, Media chat, and External link components
 * - 25% (Some): Approximately every 4-5 messages (randomized)
 * - 50% (Lots): Approximately every 2 messages (randomized)
 * @param {SceneNode} threadNode - The chat thread node
 * @param {number} percentage - Percentage level (25 = Some, 50 = Lots)
 * @param {boolean} isGroupChat - Whether this is a group chat
 */
function applyReactionsToThread(threadNode, percentage, isGroupChat) {
  // Find ALL reactable chat components (Text chat, Media chat, External link)
  const allChatComponents = findAllReactableChatComponents(threadNode);

  if (allChatComponents.length === 0) {
    console.log('[REACTION] No reactable chat components found');
    return { applied: 0, total: 0 };
  }

  console.log(`[REACTION] Found ${allChatComponents.length} reactable chat components (Text chat, Media chat, External link)`);

  // Discover emoji component IDs from existing instances
  console.log('[REACTION] Discovering emoji component IDs...');
  const discoveredEmojiMap = discoverEmojiComponentIds(threadNode);

  // Create combined emoji map with hard-coded keys + discovered keys
  const emojiMap = new Map();

  // Add hard-coded keys first (these are always available)
  for (const [name, key] of Object.entries(EMOJI_COMPONENT_KEYS)) {
    emojiMap.set(name, key);
  }

  // Merge in any discovered keys (these might override or add new ones)
  for (const [name, key] of discoveredEmojiMap.entries()) {
    if (!emojiMap.has(name)) {
      emojiMap.set(name, key);
    }
  }

  console.log(`[REACTION] Combined emoji map has ${emojiMap.size} emoji available`);

  // Sort by vertical position to maintain message order
  allChatComponents.sort((a, b) => {
    const aY = a.absoluteTransform ? a.absoluteTransform[1][2] : 0;
    const bY = b.absoluteTransform ? b.absoluteTransform[1][2] : 0;
    return aY - bY;
  });

  // First, remove all existing reactions to start fresh
  for (const chatComponent of allChatComponents) {
    setReactionOnTextChat(chatComponent, false, isGroupChat, []);
  }

  // Determine spacing based on percentage
  let baseInterval, variation;
  if (percentage === 25) {
    // "Some" - every 4-5 messages (base 4, variation 0-1)
    baseInterval = 4;
    variation = 2; // Math.random() * 2 gives 0-1.99, floor gives 0 or 1
  } else if (percentage === 50) {
    // "Lots" - every 2-3 messages (base 2, variation 0-1)
    baseInterval = 2;
    variation = 2; // Math.random() * 2 gives 0-1.99, floor gives 0 or 1
  } else {
    baseInterval = 3;
    variation = 2;
  }

  // Apply reactions with randomized spacing
  const selectedIndices = [];
  let nextReactionIndex = Math.floor(Math.random() * 2);

  while (nextReactionIndex < allChatComponents.length) {
    selectedIndices.push(nextReactionIndex);
    const interval = baseInterval + Math.floor(Math.random() * variation);
    nextReactionIndex += interval;
  }

  console.log(`[REACTION] Selected ${selectedIndices.length} messages at indices: ${selectedIndices.join(', ')}`);

  let appliedCount = 0;
  for (const index of selectedIndices) {
    const chatComponent = allChatComponents[index];
    const componentName = chatComponent.name.toLowerCase();

    // Get the message text from this chat component (works for all types)
    const messageText = getChatComponentTextContent(chatComponent);

    // Log what type of component we're processing
    let componentType = 'unknown';
    if (componentName.includes('text chat')) componentType = 'Text chat';
    else if (componentName.includes('media chat')) componentType = 'Media chat';
    else if (componentName.includes('external link')) componentType = 'External link';

    console.log(`[REACTION] Processing ${componentType}: "${messageText ? messageText.substring(0, 30) + '...' : '(no text)'}"`);

    // Pick a contextual emoji based on the message content
    const selectedEmoji = pickContextualEmojiFromAvailable(messageText, emojiMap);

    if (setReactionOnTextChat(chatComponent, true, isGroupChat, [selectedEmoji], emojiMap)) {
      appliedCount++;
    }
  }

  return { applied: appliedCount, total: allChatComponents.length };
}

/**
 * Get the text content from any chat component (Text chat, Media chat, or External link)
 * Searches for the main message text node
 * @param {SceneNode} chatNode - The chat component
 * @returns {string|null} - The message text or null if not found
 */
function getChatComponentTextContent(chatNode) {
  let messageText = null;
  let allTexts = []; // Collect all text for fallback

  function search(node, depth = 0) {
    if (depth > 15) return;

    if (node.type === 'TEXT') {
      const name = node.name.toLowerCase();
      const text = node.characters;

      // Skip empty text
      if (!text || text.length < 2) return;

      // Skip nodes that are clearly not message content
      const skipPatterns = ['time', 'date', 'read', 'delivered', 'typing', 'count', 'admin', 'eyebrow', 'timestamp', 'ago'];
      if (skipPatterns.some(p => name.includes(p))) return;

      // Collect all text for potential concatenation
      allTexts.push(text);

      // Prefer nodes that look like message content
      const preferPatterns = ['message', 'text', 'content', 'body', 'label', 'title', 'caption', 'link'];
      if (preferPatterns.some(p => name.includes(p)) && !messageText) {
        messageText = text;
        return;
      }

      // If no preferred node found yet, use this one if it has substantial content
      if (!messageText && text.length > 10) {
        messageText = text;
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        search(child, depth + 1);
      }
    }
  }

  search(chatNode);

  // If we found a main text, return it
  if (messageText) {
    return messageText;
  }

  // Otherwise, concatenate all texts found (useful for External link with multiple text elements)
  if (allTexts.length > 0) {
    return allTexts.join(' ');
  }

  return null;
}

/**
 * Get the text content from a Text chat component
 * Searches for the main message text node
 * @param {SceneNode} textChatNode - The Text chat component
 * @returns {string|null} - The message text or null if not found
 */
function getTextChatMessageContent(textChatNode) {
  return getChatComponentTextContent(textChatNode);
}

/**
 * Remove all reactions from ALL chat components that can have reactions
 * This includes: Text chat, Media chat, and External link components
 */
function removeReactionsFromThread(threadNode) {
  const allChatComponents = findAllReactableChatComponents(threadNode);

  if (allChatComponents.length === 0) {
    console.log('[REACTION] No reactable chat components found');
    return { removed: 0, total: 0 };
  }

  console.log(`[REACTION] Removing reactions from ${allChatComponents.length} chat components (Text chat, Media chat, External link)`);

  let removedCount = 0;
  for (const chatComponent of allChatComponents) {
    if (setReactionOnTextChat(chatComponent, false, false)) {
      removedCount++;
    }
  }

  return { removed: removedCount, total: allChatComponents.length };
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'apply-reactions') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first'
      });
      return;
    }

    const threadNode = selection[0];
    const percentage = msg.percentage;

    // Determine if this is a group chat
    let isGroupChat = false;
    if (threadNode.type === 'INSTANCE') {
      try {
        const props = threadNode.componentProperties;
        for (const key of Object.keys(props)) {
          if (key.toLowerCase().includes('group')) {
            const value = props[key].value;
            isGroupChat = typeof value === 'boolean' ? value : value === 'True';
            break;
          }
        }
      } catch (e) {
        console.log('[REACTION] Could not read group chat property:', e.message);
      }
    }

    console.log(`[REACTION] Applying reactions at ${percentage}% (isGroupChat: ${isGroupChat})`);
    const result = applyReactionsToThread(threadNode, percentage, isGroupChat);

    if (result.total === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'No Text chat components found in selection'
      });
    } else {
      figma.ui.postMessage({
        type: 'success',
        message: `Applied reactions to ${result.applied} of ${result.total} messages`
      });
    }
    return;
  }

  if (msg.type === 'remove-reactions') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first'
      });
      return;
    }

    const threadNode = selection[0];
    console.log('[REACTION] Removing all reactions');
    const result = removeReactionsFromThread(threadNode);

    if (result.total === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'No Text chat components found in selection'
      });
    } else {
      figma.ui.postMessage({
        type: 'success',
        message: `Removed reactions from ${result.removed} messages`
      });
    }
    return;
  }

  if (msg.type === 'run-diagnostics') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first to run diagnostics'
      });
      return;
    }

    console.log('[DIAGNOSTICS] Running property analysis on selected node...');
    const results = diagnosticLogAllProperties(selection[0]);

    // Send results back to UI
    figma.ui.postMessage({
      type: 'diagnostics-complete',
      message: `Found ${results.instances.length} component instances. Check Figma developer console for details.`,
      reactionRelated: results.instances.filter(i => i.isReactionRelated).map(i => ({
        name: i.name,
        path: i.path,
        properties: i.properties
      }))
    });
    return;
  }

  if (msg.type === 'close') {
    figma.closePlugin();
    return;
  }

if (msg.type === 'toggle-chat-type') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first'
      });
      return;
    }

    const node = selection[0];

    // Check if it's an instance that can have properties set
    if (node.type === 'INSTANCE') {
      try {
        // Log all component properties for debugging
        const props = node.componentProperties;
        console.log('[DEBUG] All component properties:', JSON.stringify(props, null, 2));

        // Find the Group chat property and Topic property
        let groupChatPropKey = null;
        let groupChatPropValue = null;
        let topicPropKey = null;
        let topicPropValue = null;

        for (const key of Object.keys(props)) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes('group')) {
            groupChatPropKey = key;
            groupChatPropValue = props[key];
            console.log(`[DEBUG] Found group property: "${key}" with value:`, groupChatPropValue);
          }
          if (keyLower.includes('topic')) {
            topicPropKey = key;
            topicPropValue = props[key];
            console.log(`[DEBUG] Found topic property: "${key}" with value:`, topicPropValue);
          }
        }

        if (groupChatPropKey && groupChatPropValue) {
          // Check the property type to determine how to set Group chat
          const propType = groupChatPropValue.type;
          console.log(`[DEBUG] Property type: ${propType}`);

          let groupChatValue;
          if (propType === 'BOOLEAN') {
            groupChatValue = msg.isGroupChat;
          } else if (propType === 'VARIANT') {
            // Variant values are case-sensitive - use 'True'/'False' with capital letters
            groupChatValue = msg.isGroupChat ? 'True' : 'False';
          } else {
            groupChatValue = msg.isGroupChat;
          }

          // Set Group chat AND Topic together
          // 1:1 Chat → Group chat = False, Topic = Travel
          // Group Chat → Group chat = True, Topic = Creators
          const topicValue = msg.isGroupChat ? 'Creators' : 'Travel';

          const propertiesToSet = {
            [groupChatPropKey]: groupChatValue
          };

          if (topicPropKey) {
            propertiesToSet[topicPropKey] = topicValue;
          }

          console.log(`[DEBUG] Setting properties:`, propertiesToSet);
          node.setProperties(propertiesToSet);

          // IMPORTANT: Wait for Figma to process the variant change before modifying children
          // This ensures the component instances are fully swapped before we try to set their properties
          await new Promise(resolve => setTimeout(resolve, 50));

          // ================================================================
          // PROFILE PHOTO SWAPPING (for Group Chat)
          // ================================================================
          let profilesAssigned = { B: null, C: null };

console.log(`[PROFILE] msg.isGroupChat = ${msg.isGroupChat}`);

          // Find the Header Module first (needed for both Group and 1:1)
          const headerModule = findHeaderModule(node);

          if (msg.isGroupChat) {
            console.log('[PROFILE] Starting profile swapping for Group Chat...');

            // Pick 2 random profiles for B and C
            const randomProfiles = pickRandomProfiles(2);
            profilesAssigned.B = randomProfiles[0];
            profilesAssigned.C = randomProfiles[1];
            console.log(`[PROFILE] Selected profiles - B: ${profilesAssigned.B}, C: ${profilesAssigned.C}`);

            if (headerModule) {
              console.log(`[PROFILE] Found Header Module: "${headerModule.name}"`);

              // First, find and set the Profile photo component's Profile type to Group
              const profilePhotoComponent = findProfilePhotoComponent(headerModule);
              if (profilePhotoComponent) {
                console.log(`[PROFILE] Found Profile photo component: "${profilePhotoComponent.name}"`);
                setProfileTypeToGroup(profilePhotoComponent);
              }

              // Find Person components in the Header's facepile
              const facepilePersons = findFacepilePersonComponents(headerModule);
              console.log(`[PROFILE] Found ${facepilePersons.length} Person components in Header`);

              // Set the first Person to B's profile, second to C's profile
              for (let i = 0; i < facepilePersons.length && i < 2; i++) {
                const personNode = facepilePersons[i];
                const profileToSet = i === 0 ? profilesAssigned.B : profilesAssigned.C;
                console.log(`[PROFILE] Setting Person ${i} ("${personNode.name}") to "${profileToSet}"`);

                const setResult = setProfileVariant(personNode, profileToSet);
                if (setResult) {
                  console.log(`[PROFILE] Successfully set Person ${i} to "${profileToSet}"`);
                } else {
                  console.log(`[PROFILE] Failed to set Person ${i}`);
                }
              }
            } else {
              console.log('[PROFILE] Could not find Header Module');
            }

            // ================================================================
            // SET PROFILE PHOTOS AND ADMIN TEXT ON CHAT BLOCKS (TOGETHER)
            // ================================================================
            console.log('[PROFILE] Setting profile photos and admin text on Chat blocks...');

            // Wait for Figma to complete the variant swap before setting Chat block profiles
            await new Promise(resolve => setTimeout(resolve, 100));

            // Find all recipient blocks - we'll set BOTH profile photo AND admin text per block
            // This ensures they stay in sync
            const recipientBlocks = findRecipientChatBlocks(node);
            console.log(`[PROFILE] Found ${recipientBlocks.length} recipient Chat blocks`);

            // For each recipient block, set both the profile photo and admin text to the same person
            for (let i = 0; i < recipientBlocks.length; i++) {
              const block = recipientBlocks[i];
              const person = i % 2 === 0 ? 'B' : 'C';
              const profileToSet = person === 'B' ? profilesAssigned.B : profilesAssigned.C;

              console.log(`[BLOCK ${i}] Setting to Person ${person} = "${profileToSet}"`);

              // Find and set the Person component's profile photo within this block
              const personNode = findProfileInBlock(block);
              if (personNode) {
                console.log(`[BLOCK ${i}] Found Person node: "${personNode.name}"`);
                setProfileVariant(personNode, profileToSet);
              } else {
                console.log(`[BLOCK ${i}] No Person node found in block`);
              }

              // Find and set the admin text within this same block
              const adminTextNode = findAdminText(block);
              if (adminTextNode) {
                console.log(`[BLOCK ${i}] Setting admin text to "${profileToSet}"`);
                await setTextNodeContent(adminTextNode, profileToSet);
              } else {
                console.log(`[BLOCK ${i}] No admin text node found in block`);
              }
            }

            // ================================================================
            // UPDATE "CREATED THE CHAT" TEXT
            // ================================================================
            // Re-analyze structure to see who sends the first message
            const structureResult = analyzeChatStructure(node);
            if (structureResult.structure.length > 0) {
              await updateCreatedChatText(node, structureResult.structure, profilesAssigned);
            }

            // ================================================================
            // UPDATE HEADER TITLE AND BODY TEXT (for Group Chat)
            // ================================================================
            console.log('[HEADER TEXT] Updating Header for Group Chat...');

            if (headerModule) {
              const { titleNode, bodyNode } = findHeaderTitleAndBody(headerModule);

              if (titleNode) {
                console.log('[HEADER TEXT] Setting Title to: "Friend group"');
                await setTextNodeContent(titleNode, 'Friend group');
              } else {
                console.log('[HEADER TEXT] Title node not found');
              }

              if (bodyNode) {
                console.log('[HEADER TEXT] Setting Body to: "Change name and image"');
                await setTextNodeContent(bodyNode, 'Change name and image');
              } else {
                console.log('[HEADER TEXT] Body node not found');
              }
            }

          } else {
            // Switching to 1:1 Chat - set Profile type back to User and pick a profile
            console.log('[PROFILE] Switching to 1:1 Chat...');

            // Pick 1 random profile for the recipient (Person B)
            const randomProfiles = pickRandomProfiles(1);
            profilesAssigned.B = randomProfiles[0];
            console.log(`[PROFILE] Selected profile for 1:1 - B: ${profilesAssigned.B}`);

            if (headerModule) {
              console.log(`[PROFILE] Found Header Module: "${headerModule.name}"`);

              // Find and set the Profile photo component's Profile type to User
              const profilePhotoComponent = findProfilePhotoComponent(headerModule);
              if (profilePhotoComponent) {
                console.log(`[PROFILE] Found Profile photo component: "${profilePhotoComponent.name}"`);
                setProfileTypeToUser(profilePhotoComponent);
              }

              // For 1:1 Chat, use findProfileInBlock to find the Person with Handle property
              // This is the same approach that works for Chat blocks
              console.log(`[PROFILE] Searching for Person with Handle in Header Module...`);
              const headerPerson = findProfileInBlock(headerModule);

              if (headerPerson) {
                console.log(`[PROFILE] Found Header Person: "${headerPerson.name}"`);
                console.log(`[PROFILE] Setting Header Person to "${profilesAssigned.B}"`);
                const setResult = setProfileVariant(headerPerson, profilesAssigned.B);
                if (setResult) {
                  console.log(`[PROFILE] Successfully set Header Person to "${profilesAssigned.B}"`);
                } else {
                  console.log(`[PROFILE] Failed to set Header Person`);
                }
              } else {
                console.log('[PROFILE] No Person with Handle found in Header for 1:1');
              }
            } else {
              console.log('[PROFILE] Could not find Header Module');
            }

            // ================================================================
            // SET PROFILE PHOTOS ON CHAT BLOCKS (1:1 Chat)
            // ================================================================
            console.log('[PROFILE] Setting profile photos on Chat blocks for 1:1...');

            // Wait a bit longer for Figma to complete the variant swap
            await new Promise(resolve => setTimeout(resolve, 100));

            // Find ALL Person components with Handle property in the entire component
            // This ensures we get fresh references after the variant swap
            const allPersonComponents = findAllPersonComponentsWithHandle(node);
            console.log(`[PROFILE] Found ${allPersonComponents.length} Person components with Handle in entire component`);

            // Filter to only those in recipient blocks (not in Header)
            let personIndex = 0;
            for (const personNode of allPersonComponents) {
              // Skip if this is in the Header (we already set the Header Person)
              const isInHeader = isNodeInHeader(personNode);
              if (isInHeader) {
                console.log(`[PROFILE] Skipping Person in Header: "${personNode.name}"`);
                continue;
              }

              console.log(`[PROFILE] Setting Chat Person ${personIndex} to "${profilesAssigned.B}"`);
              setProfileVariant(personNode, profilesAssigned.B);
              personIndex++;
            }

            // Set Admin text on recipient blocks
            const recipientBlocks = findRecipientChatBlocks(node);
            console.log(`[PROFILE] Found ${recipientBlocks.length} recipient Chat blocks for admin text`);

            for (let i = 0; i < recipientBlocks.length; i++) {
              const block = recipientBlocks[i];
              const adminTextNode = findAdminText(block);
              if (adminTextNode) {
                console.log(`[ADMIN TEXT] Setting username to "${profilesAssigned.B}" in Chat block ${i}`);
                setTextNodeContent(adminTextNode, profilesAssigned.B).then(success => {
                  if (success) {
                    console.log(`[ADMIN TEXT] Successfully set username to "${profilesAssigned.B}"`);
                  } else {
                    console.log(`[ADMIN TEXT] Failed to set username`);
                  }
                });
              }
            }

            // ================================================================
            // UPDATE HEADER TITLE AND BODY TEXT (for 1:1 Chat)
            // ================================================================
            // Generate a name from the username and update Header text directly
            console.log(`[HEADER TEXT] Updating Header for username: ${profilesAssigned.B}`);

            if (headerModule) {
              const { titleNode, bodyNode } = findHeaderTitleAndBody(headerModule);

              // Generate a fallback name from the username
              const generatedName = createFallbackNameFromUsername(profilesAssigned.B);

              if (titleNode) {
                console.log(`[HEADER TEXT] Setting Title to: "${profilesAssigned.B}"`);
                await setTextNodeContent(titleNode, profilesAssigned.B);
              } else {
                console.log('[HEADER TEXT] Title node not found');
              }

              if (bodyNode) {
                console.log(`[HEADER TEXT] Setting Body to: "${generatedName}"`);
                await setTextNodeContent(bodyNode, generatedName);
              } else {
                console.log('[HEADER TEXT] Body node not found');
              }
            } else {
              console.log('[HEADER TEXT] Header Module not found');
            }
          }

          // Re-analyze the structure after toggling
          const result = analyzeChatStructure(node);
          const structureArray = result.structure.map(s => ({
            type: s.type,
            person: s.person,
            hasTextNode: s.textNode !== null
          }));

          figma.ui.postMessage({
            type: 'structure-analyzed',
            structure: structureArray,
            patternDescription: structureToPatternDescription(result.structure),
            totalBubbles: result.structure.length,
            isGroupChat: msg.isGroupChat,
            participants: msg.participants
          });

          figma.ui.postMessage({
            type: 'success',
            message: `Switched to ${msg.isGroupChat ? 'Group Chat' : '1:1 Chat'}`
          });
} else {
          figma.ui.postMessage({
            type: 'error',
            message: 'Could not find "Group chat?" property on this component. Available properties: ' + Object.keys(props).join(', ')
          });
        }
      } catch (error) {
        figma.ui.postMessage({
          type: 'error',
          message: `Error toggling chat type: ${error.message}`
        });
      }
    } else {
      figma.ui.postMessage({
        type: 'error',
        message: 'Selected node is not a component instance'
      });
    }
    return;
  }

  if (msg.type === 'update-participants') {
    // For future use when we support more than 3 participants
    console.log(`Participant count updated to: ${msg.participants}`);
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
