// Convo Gen Plugin v2 - Supports 1:1 and Group Chat conversations
// Uses Llama API for conversation generation

// Show the plugin UI
figma.showUI(__html__, { width: 320, height: 725 });

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
  'Face with Tears of Joy': '1a7453323b4a23490c0569f88f2e1ec33d832aca',
  'Smiling Face with Heart-Eyes': '4e5198e4ed150a2b04cf1e1eb4732351ad74467d',
  'Smiling Face with Hearts': 'c79f1eaebff885fd9644691ba8a95b1ca80b0a1b',
  'Clapping Hands': 'ff29714e7ddb5ae42b4126edc90a1917ef7fa4a7',
  'Raising Hands': '19185ae765a0964fafd5dda9f03f766b517f81e7',
  'Glowing Star': '6d3c418c328d7699cea6a6dd665195d1a5d902a1',
  'Hundred Points': '1f441d4c29399752ad074159677a4c2670b7032f',
  'Sparkles': '5b4bbd07bae1360fc8e0ef243b2b8ea811fa6958',
  'Folded Hands': 'c8b7858940d76a1d3d4d17e1b19c373887f1f264',
  'Ok Hand': 'bc5f1ec4beb606ebfc06ba4e7133bfb15c6065a9',
  'High Voltage': 'b10b66619b502cf43e03d92f5cf79ac4eaad96e9',
  'Ghost': 'aa41f3a5018ef0bc5f0ae27811e419b50e23b7f9',
  'Sign of the Horns': 'bff7dd7b682c7a2120f6202599f528efcdd875e3',
  'Butterfly': '2f08291a9ae86e3fbcec936fae9800cfa92313ed',
  'Hibiscus': '1756c028dcfafc6f96bc050270deae37f063048c',
  'New Moon Face': '27bafbee63c5f56dfded931c1ca7451bb9f5021f',
  'Rainbow': 'f0d9df2652fb2ed71f16a6c3f05e538e4aa787a2',
  'Hear-No-Evil Monkey': 'b222df3a57c9b8839fa0dce43411cc59832b908a'
};

// Cache for imported emoji component IDs (maps component key → node ID)
// This is populated by preloadEmojiComponents() at startup
const EMOJI_COMPONENT_IDS = new Map();

/**
 * Pre-import all emoji components and cache their node IDs
 * This should be called once at plugin startup
 * @returns {Promise<number>} Number of emoji components successfully imported
 */
async function preloadEmojiComponents() {
  console.log('[EMOJI PRELOAD] Starting emoji component preload...');
  let loadedCount = 0;

  for (const [name, key] of Object.entries(EMOJI_COMPONENT_KEYS)) {
    try {
      const component = await figma.importComponentByKeyAsync(key);
      if (component) {
        EMOJI_COMPONENT_IDS.set(key, component.id);
        console.log(`[EMOJI PRELOAD] ✓ Loaded "${name}" → ${component.id}`);
        loadedCount++;
      }
    } catch (e) {
      console.log(`[EMOJI PRELOAD] ✗ Failed to load "${name}": ${e.message}`);
    }
  }

  console.log(`[EMOJI PRELOAD] Complete! Loaded ${loadedCount}/${Object.keys(EMOJI_COMPONENT_KEYS).length} emoji components`);
  return loadedCount;
}

// Preload emoji components when plugin starts
preloadEmojiComponents();

// ============================================================================
// STICKER COMPONENT KEYS
// Hard-coded component keys from the IGD-Sticker-Packs library
// These are used to place stickers around chat messages
// ============================================================================
const STICKER_COMPONENT_KEYS = {
  'CartoonVibes_Admiration512': '628de8fa4e1e0114f7aa6cfae5e370832cbd508e',
  'PinkWink': '312777a0c4c5c59ef2d118dada0b5a8eac1b9309',
  'Combine': '1409ce555e5fa5430b8b83921fa6052e1968ed61',
  'CartoonVibes_LoveYouMeanIt': 'ae31c8c4d9ccf5391d4f4fda9b90e95cdf1788c6',
  'cat': 'fca603b1a6b597035af408279e3f2f7c178afe75',
  'CartoonVibes_ThinkingOfYou': '14670464c11092e65f8a1646037bd7385897cb92',
  'HighFive': 'ff474ce0e2e68573eb4f64e9c9a70e5d197404bc',
  'pinkCry': '11a649498d6ac0bf2622defc359a912b68f40345'
};

// ============================================================================
// MEDIA CHAT COMPONENT SET NAMES
// These are the names of component sets that can replace Text chat
// The variant is selected based on matching To - From and Chat bubble properties
// ============================================================================
const MEDIA_CHAT_COMPONENT_SET_NAMES = {
  'media-chat': 'Media chat',
  'reels': 'IG content share',  // Reels now uses IG content share with Share=Share reels variant
  'ig-content-share': 'IG content share'
};

// Nested instance configurations for specific media types
// After swapping to the target component, we find nested instances and set their properties
const MEDIA_TYPE_NESTED_INSTANCE_CONFIG = {
  'reels': {
    nestedInstanceName: '.XMA type',  // The nested instance to find inside IG content share
    propertyName: 'Type',              // The variant property to set on that nested instance
    propertyValue: 'Reels'             // The value to set (matches the variant value)
  }
};

// Sticker rotation options (in degrees)
const STICKER_ROTATIONS = [4, 8, 16, -4, -8, -16];

// Sticker size range (width in pixels, height scales proportionally)
const STICKER_SIZE_MIN = 70;
const STICKER_SIZE_MAX = 100;

// ============================================================================
// MEDIA IMAGE URLS BY CATEGORY
// Images from the Widen DAM to apply to Media chat components
// Organized by category for contextual matching
// ============================================================================
const MEDIA_IMAGES = {
  selfies: [
    'https://facebook.widen.net/content/v59w5zlqmy/png/png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/d9kazbig92/png/png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/ehurkxer6b/png/IG_Brand_Selfies_Direct_Response_2025_Portrait_2x3_ParkingLot7.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/bt3odvgggg/png/IG_Brand_Selfies_Direct_Response_2025_Group_Images_Portrait_2x3_Sky1.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/uc13mgfwt2/png/IG_Brand_Direct_Response_2025_Group_Images_Portrait_2x3_Sidewalk.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/pghrfptnyd/png/IG_Brand_Direct_Response_2025_Group_Images_Portrait_2x3_Sidewalk5.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/j4xjyobvzv/png/IG_Brand_Direct_Response_2025_Group_Images_Portrait_2x3_Sidewalk8.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/5ql2cczgcj/png/IG_Brand_Direct_Response_2025_Group_Images_Portrait_2x3_Sidewalk3.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/djbvuuxvaj/png/IGC_Tokyo_23_10115.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals'
  ],
  food: [
    'https://facebook.widen.net/content/omm7ai7fzb/png/DebaHekmatLondonUKStill19_Instagram_Various_Toolkit_None_O.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/h4uc781b9f/png/ATXStillPolaroidFriendsDuoFoodSmiley40_Instagram_Various_Toolkit_None_O.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/u3w5n1fhxj/png/png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/xnfgfaof6o/png/png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/wsbd3ye8bd/png/IG_Brand_Toronto_2025_Object_Still_Life_or_Landscape_Lifestyle_3x2_Cake1.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/5utm4jsigs/png/IG_Brand_Direct_Response_2025_Objects_Portrait_2x3_Sidewalk7.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals'
  ],
  travel: [
    'https://facebook.widen.net/content/sachoyfg8z/png/IGC_Austin23_iPhone_Day5_MISC_IMG_6328.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/z6wjk0wfux/png/png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/pqbslna797/png/IGC_Tokyo_23_10126.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/ztlau1posd/png/ATXStillSpringdaleFarmOutdoorTree_Instagram_Various_Toolkit_None_O.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/b0dzxuhfut/png/ATLStillEastAtlantaTexture06_Instagram_Various_Toolkit_None_O.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/h59b0dpvvz/png/ATLStillEastAtlantaSign02_Instagram_Various_Toolkit_None_O.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/capftque8v/png/ATXStillFarmfieldFieldWalk01_Instagram_Various_Toolkit_None_O.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals'
  ],
  funny: [
    'https://facebook.widen.net/content/k1ann9emng/png/IG_Brand_Selfies_Direct_Response_2025_Devices_Portrait_2x3_Bathroom.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals'
  ],
  events: [
    'https://facebook.widen.net/content/pxzbnixrxq/png/IG_Brand_Toronto_2025_Group_Picture_Selfie_Portrait_Lifestyle_3x2_Yarn1.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/rlmvvpjyor/png/IG_Brand_Direct_Response_2025_Group_Images_Portrait_2x3_Storefront.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/ulfbajrpar/png/IG_Brand_Direct_Response_2025_Group_Images_Portrait_2x3_Frontyard.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/fiqqvzdatz/png/SofiaGarciaPenaNYCStill02_Instagram_Various_Toolkit_None_O.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals'
  ]
};

// Keyword mappings for contextual image selection
const MEDIA_IMAGE_KEYWORDS = {
  selfies: ['selfie', 'me', 'look', 'cute', 'pretty', 'beautiful', 'gorgeous', 'hot', 'fit', 'ootd', 'outfit', 'hair', 'makeup', 'face', 'pic', 'photo', 'mirror', 'ready', 'feeling'],
  food: ['food', 'eat', 'eating', 'hungry', 'dinner', 'lunch', 'breakfast', 'brunch', 'coffee', 'drink', 'cake', 'pizza', 'sushi', 'yummy', 'delicious', 'tasty', 'cooking', 'recipe', 'restaurant', 'cafe'],
  travel: ['travel', 'trip', 'vacation', 'holiday', 'flight', 'airport', 'beach', 'mountain', 'city', 'explore', 'adventure', 'road trip', 'nature', 'outside', 'outdoor', 'view', 'sunset', 'sunrise', 'sky', 'beautiful place'],
  funny: ['lol', 'lmao', 'haha', 'funny', 'joke', 'meme', 'dead', 'dying', 'hilarious', 'bruh', 'wtf', 'omg', 'shook', 'wild', 'crazy', 'insane', 'no way', 'stop'],
  events: ['party', 'birthday', 'celebration', 'wedding', 'concert', 'festival', 'event', 'fun', 'friends', 'group', 'squad', 'crew', 'hang', 'hangout', 'night out', 'going out', 'vibes', 'lit', 'turnt']
};

// ============================================================================
// Reels images for IG content share background
// Organized by category for contextual matching (like Media chat images)
// ============================================================================
const REELS_IMAGES = {
  selfies: [
    'https://facebook.widen.net/content/xed4mmfznb/png/IG_Brand_Montclair_2025_Selfie_Selfie_2x3_Garage_15.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/vybuojmtt2/png/IG_Brand_Selfies_Direct_Response_2025_Portrait_2x3_Sky3.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/kwhrhdq0z4/png/IG_Brand_Selfies_Direct_Response_2025_Portrait_2x3_Sky2.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/l2c3u7rftb/png/IG_Brand_Selfies_Direct_Response_2025_Portrait_2x3_Ceiling.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/v7i2o1uj0b/png/IG_Brand_Toronto_2025_Group_Picture_Selfie_Device_Portrait_Lifestyle_2x3_Sunglasses7.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals'
  ],
  events: [
    'https://facebook.widen.net/content/t3khsoxglv/png/IG_Brand_Montclair_2025_Portrait_3x2_Stage_41.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals'
  ],
  highschool: [
    'https://facebook.widen.net/content/ja3aqsndyh/png/IG_Brand_Montclair_2025_Portrait_3x2_Garage_8.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals'
  ],
  creators: [
    'https://facebook.widen.net/content/oyquknaerq/png/ATLStillUndergroundStairDance01_Instagram_Various_Toolkit_None_O.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals',
    'https://facebook.widen.net/content/vmip9g3ko3/png/IGC_Austin23_iPhone_House1_Backyard_IMG_4892.png?position=c&quality=80&x.portal_shortcode_generated=8g6hmqgm&x.app=portals'
  ],
  business: [
    // Note: Video URLs removed - Figma can only use image URLs for fills
    // Add image URLs for business category when available
  ],
  sports: [
    // Note: Video URLs removed - Figma can only use image URLs for fills
    // Add image URLs for sports category when available
  ]
};

// Keyword mappings for Reels contextual image selection (uses same keywords as Media chat)
const REELS_IMAGE_KEYWORDS = {
  selfies: ['selfie', 'me', 'look', 'cute', 'pretty', 'beautiful', 'gorgeous', 'hot', 'fit', 'ootd', 'outfit', 'hair', 'makeup', 'face', 'pic', 'photo', 'mirror', 'ready', 'feeling'],
  events: ['party', 'birthday', 'celebration', 'wedding', 'concert', 'festival', 'event', 'fun', 'friends', 'group', 'squad', 'crew', 'hang', 'hangout', 'night out', 'going out', 'vibes', 'lit', 'turnt', 'stage', 'show'],
  highschool: ['school', 'highschool', 'high school', 'class', 'homework', 'study', 'exam', 'test', 'teacher', 'student', 'campus', 'teen', 'teenager', 'grade', 'freshman', 'senior', 'junior', 'prom'],
  creators: ['create', 'creator', 'content', 'video', 'edit', 'shoot', 'film', 'camera', 'production', 'behind the scenes', 'bts', 'collab', 'collaboration', 'influencer', 'dance', 'dancing'],
  business: ['work', 'business', 'meeting', 'office', 'job', 'career', 'professional', 'project', 'deadline', 'client', 'team', 'company', 'startup', 'entrepreneur', 'hustle', 'grind'],
  sports: ['sport', 'sports', 'game', 'play', 'player', 'team', 'win', 'score', 'match', 'practice', 'training', 'workout', 'gym', 'fitness', 'athlete', 'run', 'running', 'bike', 'bmx', 'skate', 'ball']
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
 * Pick a random Reels image from REELS_IMAGES (categorized)
 * Uses keyword matching similar to Media chat images
 * @param {Set} usedImages - Set of already-used image URLs to avoid duplicates
 * @returns {string} - A URL from REELS_IMAGES
 */
function pickReelsImage(usedImages) {
  const allImages = Object.values(REELS_IMAGES).flat();

  // Safety check - if no images configured
  if (allImages.length === 0) {
    console.log('[REELS IMAGE] No images configured in REELS_IMAGES');
    return null;
  }

  // Filter out already-used images
  const usedSet = usedImages || new Set();
  const availableImages = allImages.filter(url => !usedSet.has(url));

  console.log('[REELS IMAGE] Total images: ' + allImages.length + ', Used: ' + usedSet.size + ', Available: ' + availableImages.length);

  if (availableImages.length === 0) {
    console.log('[REELS IMAGE] All images used, resetting to allow repeats');
    // If all images are used, allow repeats by using all images
    const picked = allImages[Math.floor(Math.random() * allImages.length)];
    return picked;
  }

  const picked = availableImages[Math.floor(Math.random() * availableImages.length)];
  console.log('[REELS IMAGE] Random pick from available');
  return picked;
}

/**
 * Apply an image to a Reels (IG content share) component
 * Finds the .Aspect ratio component and fills its active variant child with the image
 * @param {InstanceNode} igContentShareNode - The IG content share instance
 * @param {string} imageUrl - The URL of the image to apply
 * @returns {Promise<boolean>} - True if successful
 */
async function applyImageToReels(igContentShareNode, imageUrl) {
  console.log('[REELS IMAGE] Applying image to "' + igContentShareNode.name + '"...');

  try {
    const image = await figma.createImageAsync(imageUrl);
    console.log('[REELS IMAGE] Image fetched, hash: ' + image.hash);

    let aspectRatioNode = null;

    function findAspectRatio(node, depth) {
      if (depth > 15 || aspectRatioNode) return;
      const name = node.name;
      if (name === '.Aspect ratio' || name.startsWith('.Aspect ratio')) {
        aspectRatioNode = node;
        console.log('[REELS IMAGE] Found .Aspect ratio: "' + node.name + '" (' + node.type + ')');
        return;
      }
      if ('children' in node) {
        for (const child of node.children) {
          findAspectRatio(child, depth + 1);
        }
      }
    }

    findAspectRatio(igContentShareNode, 0);

    if (!aspectRatioNode) {
      console.log('[REELS IMAGE] .Aspect ratio not found in IG content share');
      return false;
    }

    let aspectRatioFrame = null;
    const aspectRatioPatterns = ['4:3', '16:9', '1:1', '9:16', '3:4', '2:3', '3:2'];

    if ('children' in aspectRatioNode) {
      for (const child of aspectRatioNode.children) {
        const childName = child.name;
        if (aspectRatioPatterns.includes(childName) || childName.match(/^\d+:\d+$/)) {
          if (child.visible !== false) {
            aspectRatioFrame = child;
            console.log('[REELS IMAGE] Found aspect ratio frame: "' + child.name + '"');
            break;
          }
        }
      }

      if (!aspectRatioFrame) {
        for (const child of aspectRatioNode.children) {
          if ((child.type === 'FRAME' || child.type === 'RECTANGLE') &&
              child.visible !== false &&
              !child.name.toLowerCase().includes('button') &&
              !child.name.toLowerCase().includes('play')) {
            aspectRatioFrame = child;
            console.log('[REELS IMAGE] Using first suitable child: "' + child.name + '"');
            break;
          }
        }
      }
    }

    if (!aspectRatioFrame && 'fills' in aspectRatioNode) {
      aspectRatioFrame = aspectRatioNode;
      console.log('[REELS IMAGE] Using .Aspect ratio itself as fill target');
    }

    if (!aspectRatioFrame) {
      console.log('[REELS IMAGE] Could not find aspect ratio frame to fill');
      return false;
    }

    if ('fills' in aspectRatioFrame) {
      var imageFill = {
        type: 'IMAGE',
        scaleMode: 'FILL',
        imageHash: image.hash
      };
      aspectRatioFrame.fills = [imageFill];
      console.log('[REELS IMAGE] ✓ Applied image fill to "' + aspectRatioFrame.name + '"');
      return true;
    } else {
      console.log('[REELS IMAGE] Frame does not support fills');
      return false;
    }

  } catch (error) {
    var errorMsg = error ? (error.message || error.toString()) : 'Unknown error';
    console.log('[REELS IMAGE] Error applying image: ' + errorMsg);
    return false;
  }
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
 * Detect what media types are currently present in a chat thread
 * Returns: { hasMediaChat: boolean, hasIGContentShare: boolean }
 */
async function detectMediaInThread(threadNode) {
  const chatBlocks = findChatBlockComponents(threadNode);

  let hasMediaChat = false;
  let hasIGContentShare = false;

  for (const chatBlock of chatBlocks) {
    try {
      const props = chatBlock.componentProperties;
      const propKeys = Object.keys(props);

      for (const key of propKeys) {
        if (props[key].type !== 'INSTANCE_SWAP') continue;

        const currentValue = props[key].value;
        if (!currentValue) continue;

        const currentComponent = await figma.getNodeByIdAsync(currentValue);
        if (!currentComponent) continue;

        const compName = currentComponent.name || '';
        const parentName = currentComponent.parent ? (currentComponent.parent.name || '') : '';

        // Check for Media chat
        if (parentName === 'Media chat' || compName.toLowerCase().includes('media chat')) {
          hasMediaChat = true;
        }

        // Check for IG content share (used for Reels)
        if (parentName === 'IG content share' || compName.toLowerCase().includes('ig content share')) {
          hasIGContentShare = true;
        }

        // Early exit if both found
        if (hasMediaChat && hasIGContentShare) {
          return { hasMediaChat, hasIGContentShare };
        }
      }
    } catch (e) {
      // Continue scanning other blocks
    }
  }

  return { hasMediaChat, hasIGContentShare };
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
figma.on('selectionchange', async () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Please select a Chat Thread component'
    });
    return;
  }

  const result = analyzeChatStructure(selection[0]);

  if (result.structure.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'No chat bubbles found. Please select a Chat Thread component.'
    });
    return;
  }

  const patternDescription = structureToPatternDescription(result.structure);
  const structureArray = result.structure.map(s => ({
    type: s.type,
    person: s.person,
    hasTextNode: s.textNode !== null
  }));

  // Detect what media types are currently in the thread
  const mediaState = await detectMediaInThread(selection[0]);

  // Detect thread length category based on the height of the thread component
  // Targets are: Short=917px, Medium=1064px, Long=2200px
  const threadHeight = selection[0].height || 0;
  let threadLength = 'long'; // default
  let lengthSliderValue = 100; // default to long (100)

  // Use midpoints between the target sizes to determine boundaries
  // Short <= 990 (midpoint between 917 and 1064)
  // Medium 991-1632 (midpoint between 1064 and 2200)
  // Long > 1632
  if (threadHeight <= 990) {
    threadLength = 'short';
    lengthSliderValue = 0;
  } else if (threadHeight <= 1632) {
    threadLength = 'medium';
    lengthSliderValue = 50;
  } else {
    threadLength = 'long';
    lengthSliderValue = 100;
  }

  console.log(`[SELECTION] Thread height: ${Math.round(threadHeight)}px → Length: ${threadLength.toUpperCase()}`);

  figma.ui.postMessage({
    type: 'structure-analyzed',
    structure: structureArray,
    patternDescription: patternDescription,
    totalBubbles: result.structure.length,
    isGroupChat: result.isGroupChat,
    participants: result.participants,
    currentMedia: mediaState,
    threadLength: threadLength,
    lengthSliderValue: lengthSliderValue,
    threadHeight: Math.round(threadHeight)
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
  { name: 'Smiling Face with Heart-Eyes', keywords: ['love', 'gorgeous', 'beautiful', 'pretty', 'handsome', 'hot', 'cute', 'obsessed', 'perfect', 'goals', 'wow', 'stunning', 'dreamy', 'crush'] },
  { name: 'Smiling Face with Hearts', keywords: ['love', 'adore', 'sweet', 'aww', 'cute', 'babe', 'baby', 'happy', 'blessed', 'thankful', 'grateful', 'caring', 'wholesome'] },
  { name: 'Fire', keywords: ['fire', 'hot', 'lit', 'amazing', 'insane', 'crazy', 'sick', 'dope', 'heat', 'flames', 'killing', 'slay', 'ate', 'served', 'iconic'] },
  { name: 'High Voltage', keywords: ['fire', 'lit', 'energy', 'hype', 'crazy', 'insane', 'electric', 'wild', 'intense', 'whoa', 'pow', 'boom', 'fast', 'quick'] },
  { name: 'Face with Tears of Joy', keywords: ['lol', 'lmao', 'haha', 'hilarious', 'funny', 'dead', 'dying', 'crying', 'joke', 'omg', 'bruh', 'bro', 'stop', 'cant', "can't", 'wheeze', '😂', 'jk', 'kidding'] },
  { name: 'Ghost', keywords: ['lol', 'haha', 'dead', 'dying', 'im dead', "i'm dead", 'boo', 'spooky', 'ghost', 'disappear', 'vanish', 'bye', 'dip', 'sneak', 'creep'] },
  { name: 'Hear-No-Evil Monkey', keywords: ['omg', 'oops', 'embarrassed', 'shy', 'awkward', 'cringe', 'ugh', 'no', 'stop', 'cant', "can't", 'blush', 'lol', 'haha', 'whoops', 'sorry'] },
  { name: 'New Moon Face', keywords: ['vibes', 'mood', 'aesthetic', 'shady', 'sneaky', 'sus', 'hmm', 'interesting', 'tea', 'drama', 'lowkey', 'oop', 'vibe', 'energy', 'chaotic'] },
  { name: 'Thumbs Up', keywords: ['ok', 'okay', 'sure', 'yes', 'yep', 'yeah', 'good', 'cool', 'nice', 'great', 'sounds', 'bet', 'works', 'done', 'got it', 'gotcha', 'perfect', 'agree', 'down'] },
  { name: 'Ok Hand', keywords: ['ok', 'okay', 'perfect', 'nice', 'good', 'great', 'fine', 'cool', 'chef', 'kiss', 'spot on', 'nailed', 'smooth', 'clean', 'solid'] },
  { name: 'Clapping Hands', keywords: ['congrats', 'congratulations', 'proud', 'amazing', 'awesome', 'incredible', 'well done', 'bravo', 'yay', 'finally', 'win', 'won', 'did it', 'made it', 'achieved'] },
  { name: 'Raising Hands', keywords: ['yay', 'excited', 'celebrate', 'woo', 'yes', 'finally', 'amazing', 'awesome', 'lets go', 'omg', 'so good', 'love it', 'happy', 'pumped', 'hyped'] },
  { name: 'Sign of the Horns', keywords: ['rock', 'metal', 'sick', 'dope', 'insane', 'crazy', 'wild', 'epic', 'legendary', 'lit', 'lets go', 'hyped', 'rad', 'gnarly', 'party'] },
  { name: 'Grinning Face with Big Eyes', keywords: ['happy', 'excited', 'yay', 'haha', 'hehe', 'funny', 'silly', 'goofy', 'laugh', ':)', '😊'] },
  { name: 'Glowing Star', keywords: ['amazing', 'star', 'incredible', 'perfect', 'beautiful', 'stunning', 'goals', 'iconic', 'special', 'shine', 'bright', 'golden', 'best', 'wow', 'impressive'] },
  { name: 'Sparkles', keywords: ['new', 'exciting', 'special', 'magic', 'amazing', 'beautiful', 'aesthetic', 'vibes', 'perfect', 'love', 'yay', 'finally', 'dream', 'happy', 'blessed'] },
  { name: 'Butterfly', keywords: ['beautiful', 'pretty', 'gorgeous', 'aesthetic', 'vibes', 'glow', 'free', 'change', 'growth', 'transform', 'cute', 'sweet', 'nature', 'spring'] },
  { name: 'Hibiscus', keywords: ['beautiful', 'pretty', 'gorgeous', 'flower', 'cute', 'sweet', 'aesthetic', 'vibes', 'tropical', 'summer', 'vacation', 'love', 'pink'] },
  { name: 'Rainbow', keywords: ['happy', 'love', 'pride', 'beautiful', 'colorful', 'vibes', 'good', 'positive', 'amazing', 'wonderful', 'bright', 'joy', 'lucky'] },
  { name: 'Folded Hands', keywords: ['yes', 'please', 'thanks', 'thank', 'agree', 'appreciate', 'grateful', 'respect', 'bless', 'hope', 'bet', 'sounds good', 'perfect', 'great', 'absolutely'] },
  { name: 'Hundred Points', keywords: ['love', 'best', 'amazing', 'perfect', '100', 'facts', 'true', 'exactly', 'real', 'right', 'legit', 'fr', 'no cap', 'period', 'the best', 'incredible'] }
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
    'heart-eyes': ['love', 'gorgeous', 'beautiful', 'pretty', 'handsome', 'hot', 'cute', 'obsessed', 'perfect', 'goals', 'wow', 'stunning', 'dreamy', 'crush'],
    'with hearts': ['love', 'adore', 'sweet', 'aww', 'cute', 'babe', 'baby', 'happy', 'blessed', 'thankful', 'grateful', 'caring', 'wholesome'],
    'thumbs': ['ok', 'okay', 'sure', 'yes', 'yep', 'yeah', 'good', 'cool', 'nice', 'great', 'sounds', 'bet', 'works', 'done', 'got it', 'agree', 'down', 'perfect', 'fine', 'alright', 'np', 'no problem', 'kk', 'k'],
    'ok hand': ['ok', 'okay', 'perfect', 'nice', 'good', 'great', 'fine', 'cool', 'chef', 'kiss', 'spot on', 'nailed', 'smooth', 'clean', 'solid'],
    'clap': ['congrats', 'proud', 'amazing', 'awesome', 'yay', 'finally', 'win', 'won', 'did it', 'made it', 'achieved', 'bravo'],
    'raising': ['yay', 'excited', 'celebrate', 'woo', 'yes', 'finally', 'amazing', 'awesome', 'lets go', 'omg', 'so good', 'love it', 'happy', 'pumped', 'hyped'],
    'horns': ['rock', 'metal', 'sick', 'dope', 'insane', 'crazy', 'wild', 'epic', 'legendary', 'lit', 'lets go', 'hyped', 'rad', 'party'],
    'grinning': ['lol', 'haha', 'hehe', 'funny', 'hilarious', 'joke', 'laugh', 'silly', 'goofy', ':)', '😊', 'happy', 'yay', 'excited'],
    'joy': ['lol', 'lmao', 'haha', 'hahaha', 'hilarious', 'funny', 'dead', 'dying', 'crying', 'joke', 'omg', 'bruh', 'bro', 'stop', 'im dead', "i'm dead", 'wheeze', '😂', 'jk', 'kidding', 'rofl', 'happy', 'excited', 'yay', 'amazing', 'so good', 'the best', 'love it', 'love this'],
    'ghost': ['lol', 'haha', 'dead', 'dying', 'im dead', "i'm dead", 'boo', 'ghost', 'disappear', 'bye', 'dip', 'sneak'],
    'no-evil': ['omg', 'oops', 'embarrassed', 'shy', 'awkward', 'cringe', 'stop', 'cant', "can't", 'blush', 'lol', 'haha', 'whoops', 'sorry'],
    'moon': ['vibes', 'mood', 'aesthetic', 'shady', 'sneaky', 'sus', 'hmm', 'interesting', 'tea', 'drama', 'lowkey', 'oop', 'vibe', 'energy', 'chaotic'],
    'fire': ['fire', 'hot', 'lit', 'amazing', 'insane', 'crazy', 'sick', 'dope', 'slay', 'ate', 'served', 'heat', 'flames', 'killing it', 'goat', 'legendary', 'epic', 'wild', 'bussin'],
    'voltage': ['fire', 'lit', 'energy', 'hype', 'crazy', 'insane', 'electric', 'wild', 'intense', 'whoa', 'boom', 'fast', 'quick'],
    'glowing': ['amazing', 'star', 'incredible', 'perfect', 'beautiful', 'stunning', 'goals', 'iconic', 'special', 'shine', 'bright', 'golden', 'best', 'wow', 'impressive'],
    'sparkle': ['new', 'exciting', 'special', 'magic', 'beautiful', 'perfect', 'aesthetic', 'vibes', 'blessed', 'dream', 'finally', 'yay'],
    'butterfly': ['beautiful', 'pretty', 'gorgeous', 'aesthetic', 'vibes', 'glow', 'free', 'cute', 'sweet', 'nature', 'spring'],
    'hibiscus': ['beautiful', 'pretty', 'gorgeous', 'flower', 'cute', 'sweet', 'aesthetic', 'vibes', 'tropical', 'summer', 'love', 'pink'],
    'rainbow': ['happy', 'love', 'pride', 'beautiful', 'colorful', 'vibes', 'good', 'positive', 'amazing', 'wonderful', 'bright', 'joy', 'lucky'],
    'pray': ['yes', 'please', 'thanks', 'agree', 'appreciate', 'grateful', 'respect', 'bless', 'hope', 'bet', 'sounds good', 'perfect', 'great', 'absolutely'],
    'hundred': ['love', 'best', 'amazing', 'perfect', '100', 'facts', 'true', 'exactly', 'real', 'right', 'legit', 'fr', 'no cap', 'period', 'the best', 'incredible']
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
 * Pick a contextual image URL based on message text content
 * Matches keywords in the text to image categories
/**
 * Pick a contextual image from MEDIA_IMAGES based on message text
 * Uses keyword matching to find the best category, falls back to random
 * @param {string} messageText - The text content near the Media chat
 * @param {Set} usedImages - Set of already-used image URLs to avoid duplicates
 * @returns {string} - A URL from MEDIA_IMAGES
 */
function pickContextualMediaImage(messageText, usedImages) {
  const allImages = Object.values(MEDIA_IMAGES).flat();

  // Safety check - if no images configured
  if (allImages.length === 0) {
    console.log('[MEDIA IMAGE] No images configured in MEDIA_IMAGES');
    return null;
  }

  // Filter out already-used images
  const usedSet = usedImages || new Set();
  const availableImages = allImages.filter(url => !usedSet.has(url));

  console.log('[MEDIA IMAGE] Total images: ' + allImages.length + ', Used: ' + usedSet.size + ', Available: ' + availableImages.length);

  if (availableImages.length === 0) {
    console.log('[MEDIA IMAGE] All images used, resetting to allow repeats');
    // If all images are used, allow repeats by using all images
    const picked = allImages[Math.floor(Math.random() * allImages.length)];
    return picked;
  }

  if (!messageText || messageText.trim().length === 0) {
    const picked = availableImages[Math.floor(Math.random() * availableImages.length)];
    console.log('[MEDIA IMAGE] No text, random pick from available');
    return picked;
  }

  const textLower = messageText.toLowerCase();
  const categoryScores = {};

  for (const [category, keywords] of Object.entries(MEDIA_IMAGE_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        score += 1;
        if (keyword.length > 4) score += 0.5;
      }
    }
    categoryScores[category] = score;
  }

  let bestCategory = null;
  let bestScore = 0;
  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  if (bestCategory && bestScore > 0 && MEDIA_IMAGES[bestCategory] && MEDIA_IMAGES[bestCategory].length > 0) {
    // Filter category images by what's still available
    const categoryImages = MEDIA_IMAGES[bestCategory].filter(url => !usedSet.has(url));
    if (categoryImages.length > 0) {
      const picked = categoryImages[Math.floor(Math.random() * categoryImages.length)];
      console.log('[MEDIA IMAGE] Text matched category "' + bestCategory + '" (score: ' + bestScore + ')');
      return picked;
    }
    // If all category images used, fall through to random from available
  }

  const randomPick = availableImages[Math.floor(Math.random() * availableImages.length)];
  console.log('[MEDIA IMAGE] Random pick from available');
  return randomPick;
}

/**
 * Apply an image to a Media chat component
 * Finds the .Aspect ratio component and fills its active variant child with the image
 * @param {InstanceNode} mediaChatNode - The Media chat instance
 * @param {string} imageUrl - The URL of the image to apply
 * @returns {Promise<boolean>} - True if successful
 */
async function applyImageToMediaChat(mediaChatNode, imageUrl) {
  console.log('[MEDIA IMAGE] Applying image to "' + mediaChatNode.name + '"...');

  try {
    const image = await figma.createImageAsync(imageUrl);
    console.log('[MEDIA IMAGE] Image fetched, hash: ' + image.hash);

    let aspectRatioNode = null;

    function findAspectRatio(node, depth) {
      if (depth > 15 || aspectRatioNode) return;
      const name = node.name;
      if (name === '.Aspect ratio' || name.startsWith('.Aspect ratio')) {
        aspectRatioNode = node;
        console.log('[MEDIA IMAGE] Found .Aspect ratio: "' + node.name + '" (' + node.type + ')');
        return;
      }
      if ('children' in node) {
        for (const child of node.children) {
          findAspectRatio(child, depth + 1);
        }
      }
    }

    findAspectRatio(mediaChatNode, 0);

    if (!aspectRatioNode) {
      console.log('[MEDIA IMAGE] .Aspect ratio not found in Media chat');
      return false;
    }

    let aspectRatioFrame = null;
    const aspectRatioPatterns = ['4:3', '16:9', '1:1', '9:16', '3:4', '2:3', '3:2'];

    if ('children' in aspectRatioNode) {
      for (const child of aspectRatioNode.children) {
        const childName = child.name;
        if (aspectRatioPatterns.includes(childName) || childName.match(/^\d+:\d+$/)) {
          if (child.visible !== false) {
            aspectRatioFrame = child;
            console.log('[MEDIA IMAGE] Found aspect ratio frame: "' + child.name + '"');
            break;
          }
        }
      }

      if (!aspectRatioFrame) {
        for (const child of aspectRatioNode.children) {
          if ((child.type === 'FRAME' || child.type === 'RECTANGLE') &&
              child.visible !== false &&
              !child.name.toLowerCase().includes('button') &&
              !child.name.toLowerCase().includes('play')) {
            aspectRatioFrame = child;
            console.log('[MEDIA IMAGE] Using first suitable child: "' + child.name + '"');
            break;
          }
        }
      }
    }

    if (!aspectRatioFrame && 'fills' in aspectRatioNode) {
      aspectRatioFrame = aspectRatioNode;
      console.log('[MEDIA IMAGE] Using .Aspect ratio itself as fill target');
    }

    if (!aspectRatioFrame) {
      console.log('[MEDIA IMAGE] Could not find aspect ratio frame to fill');
      return false;
    }

    if ('fills' in aspectRatioFrame) {
      var imageFill = {
        type: 'IMAGE',
        scaleMode: 'FILL',
        imageHash: image.hash
      };
      aspectRatioFrame.fills = [imageFill];
      console.log('[MEDIA IMAGE] Applied image fill to "' + aspectRatioFrame.name + '"');
      return true;
    } else {
      console.log('[MEDIA IMAGE] Frame does not support fills');
      return false;
    }

  } catch (error) {
    var errorMsg = error ? (error.message || error.toString()) : 'Unknown error';
    console.log('[MEDIA IMAGE] Error applying image: ' + errorMsg);
    return false;
  }
}

/**
 * Randomize the aspect ratio on a Media chat component
 * Finds the .Aspect ratio component and sets a random Aspect ratio variant
 * @param {InstanceNode} mediaChatNode - The Media chat instance
 * @returns {Promise<boolean>} - True if successful
 */
async function randomizeAspectRatio(mediaChatNode) {
  // Aspect ratio options - weighted towards 4:3 (most common)
  // 4:3 appears 5 times, 1:1 appears 2 times, 16:9 appears 2 times
  // This gives roughly: 4:3 = 55%, 1:1 = 22%, 16:9 = 22%
  var aspectRatioOptions = ['4:3', '4:3', '4:3', '4:3', '4:3', '1:1', '1:1', '16:9', '16:9'];
  var randomRatio = aspectRatioOptions[Math.floor(Math.random() * aspectRatioOptions.length)];

  // For landscape, only enable for ratios that support it (not 1:1)
  var randomLandscape = randomRatio !== '1:1' && Math.random() > 0.5;

  // Video is less common
  var randomVideo = Math.random() > 0.8; // 20% chance of video

  console.log('[ASPECT RATIO] Randomizing: ratio=' + randomRatio + ', landscape=' + randomLandscape + ', video=' + randomVideo);

  try {
    let aspectRatioNode = null;

    function findAspectRatio(node, depth) {
      if (depth > 15 || aspectRatioNode) return;
      var name = node.name;
      if (name === '.Aspect ratio' || name.startsWith('.Aspect ratio')) {
        aspectRatioNode = node;
        return;
      }
      if ('children' in node) {
        for (const child of node.children) {
          findAspectRatio(child, depth + 1);
        }
      }
    }

    findAspectRatio(mediaChatNode, 0);

    if (!aspectRatioNode) {
      console.log('[ASPECT RATIO] .Aspect ratio not found');
      return false;
    }

    if (aspectRatioNode.type !== 'INSTANCE') {
      console.log('[ASPECT RATIO] .Aspect ratio is not an instance');
      return false;
    }

    var props = aspectRatioNode.componentProperties;
    var propKeys = Object.keys(props);

    // Find the property keys
    var aspectRatioKey = null;
    var landscapeKey = null;
    var videoKey = null;

    for (const key of propKeys) {
      var keyLower = key.toLowerCase();
      if (keyLower === 'aspect ratio' || keyLower.startsWith('aspect ratio#')) {
        aspectRatioKey = key;
      }
      if (keyLower === 'landscape?' || keyLower.startsWith('landscape?#')) {
        landscapeKey = key;
      }
      if (keyLower === 'video' || keyLower.startsWith('video#')) {
        videoKey = key;
      }
    }

    console.log('[ASPECT RATIO] Found keys: ratio=' + aspectRatioKey + ', landscape=' + landscapeKey + ', video=' + videoKey);

    // Try to set all properties that exist, handling errors gracefully
    var propsToSet = {};

    if (aspectRatioKey) {
      propsToSet[aspectRatioKey] = randomRatio;
    }
    if (landscapeKey && randomRatio !== '1:1') {
      // Only set landscape for non-square ratios
      propsToSet[landscapeKey] = randomLandscape;
    }
    if (videoKey) {
      propsToSet[videoKey] = randomVideo;
    }

    if (Object.keys(propsToSet).length > 0) {
      try {
        aspectRatioNode.setProperties(propsToSet);
        console.log('[ASPECT RATIO] ✓ Set properties: ' + JSON.stringify(propsToSet));
      } catch (e) {
        console.log('[ASPECT RATIO] Combined set failed, trying individually...');

        // Try setting just the aspect ratio
        if (aspectRatioKey) {
          try {
            aspectRatioNode.setProperties({ [aspectRatioKey]: randomRatio });
            console.log('[ASPECT RATIO] ✓ Set aspect ratio to ' + randomRatio);
          } catch (e2) {
            console.log('[ASPECT RATIO] Could not set aspect ratio: ' + e2.message);
          }
        }
      }
    }

    console.log('[ASPECT RATIO] Properties randomization complete');
    return true;

  } catch (error) {
    var errorMsg = error ? (error.message || error.toString()) : 'Unknown error';
    console.log('[ASPECT RATIO] Error: ' + errorMsg);
    return false;
  }
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

    // Debug: Log instance names at top levels
    if (depth <= 3 && n.type === 'INSTANCE') {
      console.log(`[FIND TEXT CHAT] Depth ${depth}: Found INSTANCE "${n.name}"`);
    }

    // Look for "Text chat" components
    if (name.includes('text chat') && n.type === 'INSTANCE') {
      console.log(`[FIND TEXT CHAT] ✓ Matched Text chat: "${n.name}"`);
      textChats.push(n);
      return; // Don't recurse into Text chat components
    }

    if ('children' in n) {
      for (const child of n.children) {
        search(child, depth + 1);
      }
    }
  }

  console.log(`[FIND TEXT CHAT] Starting search from node: "${node.name}" (type: ${node.type})`);
  search(node);
  console.log(`[FIND TEXT CHAT] Found ${textChats.length} Text chat components`);
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
 * @param {Object} assignedProfiles - Object with { A: string, B: string, C: string } profile handles (for group chats)
 * @param {string} messageSender - Which person sent this message ('A', 'B', or 'C')
 */
function setReactionOnTextChat(textChatNode, enabled, isGroupChat = false, emojiList = ['Red Heart'], emojiMap = null, assignedProfiles = null, messageSender = 'B') {
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
        setChatReactionVariant(textChatNode, isGroupChat, emojiList, emojiMap, assignedProfiles, messageSender);
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
 * Discover assigned profiles from existing recipient Chat blocks
 * Also picks a random profile for Person A (the sender)
 * Returns an object with profile assignments { A: string, B: string, C: string }
 */
function discoverAssignedProfiles(threadNode) {
  const profiles = { A: null, B: null, C: null };
  const uniqueProfiles = [];

  // Find recipient chat blocks and extract their profile Handle values
  const recipientBlocks = findRecipientChatBlocks(threadNode);
  console.log(`[PROFILE DISCOVER] Found ${recipientBlocks.length} recipient blocks`);

  for (const block of recipientBlocks) {
    const personNode = findProfileInBlock(block);
    if (personNode && personNode.type === 'INSTANCE') {
      try {
        const props = personNode.componentProperties;
        for (const key of Object.keys(props)) {
          if (key.toLowerCase().includes('handle')) {
            const handleValue = props[key].value;
            if (handleValue && !uniqueProfiles.includes(handleValue)) {
              uniqueProfiles.push(handleValue);
              console.log(`[PROFILE DISCOVER] Found profile: "${handleValue}"`);
            }
            break;
          }
        }
      } catch (e) {
        // Skip nodes we can't read
      }
    }
  }

  // Assign to B and C
  if (uniqueProfiles.length >= 1) {
    profiles.B = uniqueProfiles[0];
  }
  if (uniqueProfiles.length >= 2) {
    profiles.C = uniqueProfiles[1];
  }

  // Pick a random profile for Person A (the sender) that's different from B and C
  const usedProfiles = [profiles.B, profiles.C].filter(p => p);
  const availableForA = PROFILE_VARIANTS.filter(p => !usedProfiles.includes(p));
  if (availableForA.length > 0) {
    profiles.A = availableForA[Math.floor(Math.random() * availableForA.length)];
  } else {
    // Fallback if somehow all profiles are used
    profiles.A = PROFILE_VARIANTS[0];
  }

  console.log(`[PROFILE DISCOVER] Assigned profiles - A: ${profiles.A}, B: ${profiles.B}, C: ${profiles.C}`);
  return profiles;
}

/**
 * Set profile photos on .People profile pictures components inside .Chat reaction
 * This is used for group chat reactions where the reaction shows who reacted
 *
 * Logic:
 * - If the message is from a RECIPIENT (B or C):
 *   - 2 reactions: Show Person A + the other recipient
 *   - 1 reaction: Show Person A
 * - If the message is from the SENDER (A):
 *   - 2 reactions: Show Person B + Person C
 *   - 1 reaction: Show either Person B or Person C (random)
 *
 * @param {SceneNode} chatReactionNode - The .Chat reaction component
 * @param {Object} assignedProfiles - Object with { A: string, B: string, C: string } profile handles
 * @param {boolean} isSenderMessage - Whether this message was sent by Person A
 * @param {string} messageSender - Which person sent this message ('A', 'B', or 'C')
 * @param {number} reactionCount - Number of reactions (1 or 2)
 */
function setReactionProfilePhotos(chatReactionNode, assignedProfiles, isSenderMessage, messageSender, reactionCount) {
  if (!assignedProfiles) {
    console.log(`[REACTION PROFILE] No assigned profiles provided, skipping`);
    return;
  }

  // Determine which profiles to show based on who sent the message
  let profilesToAssign = [];

  if (isSenderMessage || messageSender === 'A') {
    // Person A sent the message → reactors are B and/or C
    if (reactionCount >= 2) {
      // 2 reactions: Show B and C
      profilesToAssign = [assignedProfiles.B, assignedProfiles.C].filter(p => p);
    } else {
      // 1 reaction: Show either B or C (random)
      const options = [assignedProfiles.B, assignedProfiles.C].filter(p => p);
      if (options.length > 0) {
        profilesToAssign = [options[Math.floor(Math.random() * options.length)]];
      }
    }
    console.log(`[REACTION PROFILE] Sender message (A) → showing reactors: ${profilesToAssign.join(', ')}`);
  } else {
    // Person B or C sent the message → reactors include Person A
    if (reactionCount >= 2) {
      // 2 reactions: Show A + the other recipient
      if (messageSender === 'B') {
        // B sent → show A + C
        profilesToAssign = [assignedProfiles.A, assignedProfiles.C].filter(p => p);
      } else {
        // C sent → show A + B
        profilesToAssign = [assignedProfiles.A, assignedProfiles.B].filter(p => p);
      }
    } else {
      // 1 reaction: Show Person A
      if (assignedProfiles.A) {
        profilesToAssign = [assignedProfiles.A];
      }
    }
    console.log(`[REACTION PROFILE] Recipient message (${messageSender}) → showing reactors: ${profilesToAssign.join(', ')}`);
  }

  if (profilesToAssign.length === 0) {
    console.log(`[REACTION PROFILE] No profiles to assign`);
    return;
  }

  let profileIndex = 0;

  function findAndSetProfiles(node, depth = 0) {
    if (depth > 20) return;

    const name = node.name.toLowerCase();

    // Look for .People profile pictures or Person components with Handle property
    if ((name.includes('people profile') || name.includes('person')) && node.type === 'INSTANCE') {
      try {
        const props = node.componentProperties;
        for (const key of Object.keys(props)) {
          if (key.toLowerCase().includes('handle')) {
            if (profileIndex < profilesToAssign.length) {
              const profileToSet = profilesToAssign[profileIndex];
              console.log(`[REACTION PROFILE] Setting profile ${profileIndex} to "${profileToSet}"`);
              node.setProperties({ [key]: profileToSet });
              profileIndex++;
            }
            break;
          }
        }
      } catch (e) {
        console.log(`[REACTION PROFILE] Could not set profile:`, e.message);
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        findAndSetProfiles(child, depth + 1);
      }
    }
  }

  findAndSetProfiles(chatReactionNode);
  console.log(`[REACTION PROFILE] Set ${profileIndex} profile photos in reaction`);
}

/**
 * Discover emoji component IDs by finding existing emoji instances in the thread
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
 * @param {Object} assignedProfiles - Object with { A: string, B: string, C: string } profile handles (for group chats)
 * @param {string} messageSender - Which person sent this message ('A', 'B', or 'C')
 */
function setChatReactionVariant(textChatNode, isGroupChat = false, emojiList = ['Red Heart'], emojiMap = null, assignedProfiles = null, messageSender = 'B') {
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

    let reactionCount = 1;
    if (reactionsKey) {
      // For 1:1 chats, always use "1" (single emoji)
      // For group chats, randomize between "1" and "2" (which show profiles)
      reactionCount = isGroupChat ? Math.floor(Math.random() * 2) + 1 : 1;
      chatReactionNode.setProperties({ [reactionsKey]: String(reactionCount) });

      // For group chats with 1 or 2 reactions, set the profile photos
      if (isGroupChat && assignedProfiles && (reactionCount === 1 || reactionCount === 2)) {
        console.log(`[REACTION PROFILE] Setting profiles for ${reactionCount} reaction(s) in group chat (sender: ${messageSender})`);
        const isSenderMessage = messageSender === 'A';
        setReactionProfilePhotos(chatReactionNode, assignedProfiles, isSenderMessage, messageSender, reactionCount);
      }
    }

    // If we have an emoji map, try to swap emoji
    if (emojiMap && emojiMap.size > 0 && emojiList.length > 0) {
      console.log(`[EMOJI SWAP] Attempting swap with emojiList:`, emojiList);
      console.log(`[EMOJI SWAP] Available in emojiMap:`, Array.from(emojiMap.keys()));

      // Find emoji INSTANCE_SWAP properties
      let emojiSlotIndex = 0;
      for (const key of propKeys) {
        if (key.toLowerCase().includes('emoji') && props[key].type === 'INSTANCE_SWAP') {
          console.log(`[EMOJI SWAP] Found INSTANCE_SWAP property: "${key}", current value: ${props[key].value}`);

          // Pick the emoji from the list for this slot
          const targetEmojiName = emojiList[Math.min(emojiSlotIndex, emojiList.length - 1)];
          console.log(`[EMOJI SWAP] Target emoji for slot ${emojiSlotIndex}: "${targetEmojiName}"`);

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

            // Look up the preloaded component ID from our cache
            // EMOJI_COMPONENT_IDS maps component key → node ID
            const componentId = EMOJI_COMPONENT_IDS.get(foundKey);

            if (componentId) {
              try {
                chatReactionNode.setProperties({ [key]: componentId });
                console.log(`[EMOJI SWAP] ✓ Successfully set ${key} to component ID ${componentId}`);
              } catch (e) {
                console.log(`[EMOJI SWAP] ✗ Failed to set property:`, e.message);
              }
            } else {
              console.log(`[EMOJI SWAP] ✗ Component not preloaded for key: ${foundKey}`);
              // Fallback: try using the key directly (may not work for library components)
              try {
                chatReactionNode.setProperties({ [key]: foundKey });
                console.log(`[EMOJI SWAP] ⚠ Fallback: tried setting key directly`);
              } catch (e) {
                console.log(`[EMOJI SWAP] ✗ Fallback also failed:`, e.message);
              }
            }
          } else {
            console.log(`[EMOJI SWAP] ✗ No matching key found for "${targetEmojiName}"`);
          }

          emojiSlotIndex++;
          // For 1:1 chats, only set the first emoji slot
          // For group chats, set up to 2 slots (one per reaction)
          if (!isGroupChat || emojiSlotIndex >= reactionCount) {
            break;
          }
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
  // Get the VISIBLE bounds of the Chat thread (accounting for clipping parents)
  const visibleBounds = getVisibleBounds(threadNode);
  if (visibleBounds) {
    console.log(`[REACTION] Visible bounds: ${visibleBounds.width.toFixed(0)} x ${visibleBounds.height.toFixed(0)}`);
  }

  // Find ALL reactable chat components (Text chat, Media chat, External link)
  const allChatComponentsUnfiltered = findAllReactableChatComponents(threadNode);

  if (allChatComponentsUnfiltered.length === 0) {
    console.log('[REACTION] No reactable chat components found');
    return { applied: 0, total: 0 };
  }

  // Filter to only include components within the visible bounds
  const allChatComponents = visibleBounds
    ? allChatComponentsUnfiltered.filter(comp => isNodeInVisibleBounds(comp, visibleBounds))
    : allChatComponentsUnfiltered;

  console.log(`[REACTION] Found ${allChatComponentsUnfiltered.length} total reactable chat components, ${allChatComponents.length} in visible area`);

  if (allChatComponents.length === 0) {
    console.log('[REACTION] No reactable chat components in visible area');
    return { applied: 0, total: 0 };
  }

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

  // For group chats, discover the assigned profiles (B and C) to use in reaction photos
  let assignedProfiles = null;
  if (isGroupChat) {
    console.log('[REACTION] Group chat detected, discovering assigned profiles...');
    assignedProfiles = discoverAssignedProfiles(threadNode);
  }

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
  if (percentage === 15) {
    // "Low" - every 5-7 messages
    baseInterval = 5;
    variation = 3;
  } else if (percentage === 25) {
    // "Medium" - every 3-5 messages
    baseInterval = 3;
    variation = 3;
  } else if (percentage === 40) {
    // "High" - every 2-3 messages
    baseInterval = 2;
    variation = 2;
  } else if (percentage === 60) {
    // "Max" - every 1-2 messages
    baseInterval = 1;
    variation = 2;
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

    // Determine who sent this message (A = sender/you, B or C = recipients)
    let messageSender = 'B'; // Default to recipient B

    // Check if this is a sender message (Person A / "you")
    const isSenderMessage = isSenderNode(chatComponent) ||
                            (chatComponent.parent && isSenderNode(chatComponent.parent));

    if (isSenderMessage) {
      messageSender = 'A';
    } else if (isGroupChat) {
      // For group chat recipients, try to determine if it's B or C
      // We can check the profile photo in the parent block to distinguish
      const parentBlock = chatComponent.parent;
      if (parentBlock) {
        const personNode = findProfileInBlock(parentBlock);
        if (personNode && personNode.type === 'INSTANCE') {
          try {
            const props = personNode.componentProperties;
            for (const key of Object.keys(props)) {
              if (key.toLowerCase().includes('handle')) {
                const handleValue = props[key].value;
                // Compare with assigned profiles to determine B or C
                if (assignedProfiles && handleValue === assignedProfiles.C) {
                  messageSender = 'C';
                } else {
                  messageSender = 'B';
                }
                break;
              }
            }
          } catch (e) {
            // Default to B if we can't read properties
          }
        }
      }
    }

    console.log(`[REACTION] Message sender: ${messageSender}`);

    // Pick a contextual emoji based on the message content
    const selectedEmoji = pickContextualEmojiFromAvailable(messageText, emojiMap);

    // For group chats, pick a second different emoji for 2-reaction displays
    const emojiListForMessage = [selectedEmoji];
    if (isGroupChat) {
      const availableEmoji = Array.from(emojiMap.keys()).filter(e => e !== selectedEmoji);
      if (availableEmoji.length > 0) {
        emojiListForMessage.push(availableEmoji[Math.floor(Math.random() * availableEmoji.length)]);
      }
    }

    if (setReactionOnTextChat(chatComponent, true, isGroupChat, emojiListForMessage, emojiMap, assignedProfiles, messageSender)) {
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
// STICKERS: Place sticker components around chat messages
// ============================================================================

/**
 * Pick a random sticker from available stickers, excluding already used ones
 * @param {Set} usedStickers - Set of sticker names already used in this chat
 * @returns {Object|null} - { name: string, key: string } or null if all stickers used
 */
function pickRandomSticker(usedStickers = new Set()) {
  const stickerNames = Object.keys(STICKER_COMPONENT_KEYS);

  // Filter out already used stickers
  const availableStickers = stickerNames.filter(name => !usedStickers.has(name));

  if (availableStickers.length === 0) {
    console.log('[STICKER] All stickers have been used, no more available');
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableStickers.length);
  const name = availableStickers[randomIndex];
  return { name, key: STICKER_COMPONENT_KEYS[name] };
}

/**
 * Pick a random sticker size between min and max
 * @returns {number} - Random size in pixels
 */
function pickRandomStickerSize() {
  return STICKER_SIZE_MIN + Math.random() * (STICKER_SIZE_MAX - STICKER_SIZE_MIN);
}

/**
 * Pick a random rotation from the available options
 * @returns {number} - Rotation in degrees
 */
function pickRandomRotation() {
  return STICKER_ROTATIONS[Math.floor(Math.random() * STICKER_ROTATIONS.length)];
}

/**
 * Find the Chat thread window frame that contains the chat blocks
 * This is needed to place stickers within the correct parent
 */
function findChatThreadWindow(threadNode) {
  // Look for a frame that contains the chat content area
  function search(node, depth = 0) {
    if (depth > 5) return null;

    const name = node.name.toLowerCase();

    // Look for common names for the chat content area
    if ((name.includes('chat thread') || name.includes('content') || name.includes('messages')) &&
        (node.type === 'FRAME' || node.type === 'GROUP')) {
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

  // First try to find a specific chat content area
  const contentArea = search(threadNode);
  if (contentArea) return contentArea;

  // Fallback to the thread node itself
  return threadNode;
}

/**
 * Apply stickers to chat messages with randomized spacing
 * @param {SceneNode} threadNode - The chat thread node
 * @param {number} percentage - Percentage level (25 = Some, 50 = Lots)
 * @returns {Object} - { applied: number, total: number }
 */
async function applyStickersToThread(threadNode, percentage) {
  console.log(`[STICKER] Applying stickers at ${percentage}%`);

  // Get the VISIBLE bounds of the Chat thread (accounting for clipping parents)
  const visibleBounds = getVisibleBounds(threadNode);
  if (!visibleBounds || visibleBounds.width <= 0 || visibleBounds.height <= 0) {
    console.log('[STICKER] No visible bounds for thread node');
    return { applied: 0, total: 0 };
  }
  console.log(`[STICKER] Visible bounds: x=${visibleBounds.x.toFixed(0)}, y=${visibleBounds.y.toFixed(0)}, w=${visibleBounds.width.toFixed(0)}, h=${visibleBounds.height.toFixed(0)}`);

  // Also get full thread bounds for reference
  const threadBounds = threadNode.absoluteBoundingBox;
  if (threadBounds) {
    console.log(`[STICKER] Full thread bounds: ${threadBounds.width.toFixed(0)} x ${threadBounds.height.toFixed(0)} (visible: ${visibleBounds.height.toFixed(0)}px of ${threadBounds.height.toFixed(0)}px)`);
  }

  // Find all reactable chat components (same as reactions)
  const allChatComponentsUnfiltered = findAllReactableChatComponents(threadNode);

  if (allChatComponentsUnfiltered.length === 0) {
    console.log('[STICKER] No chat components found');
    return { applied: 0, total: 0 };
  }

  // Filter to only include components within the visible bounds
  const allChatComponents = allChatComponentsUnfiltered.filter(comp => isNodeInVisibleBounds(comp, visibleBounds));

  console.log(`[STICKER] Found ${allChatComponentsUnfiltered.length} total chat components, ${allChatComponents.length} in visible area`);

  if (allChatComponents.length === 0) {
    console.log('[STICKER] No chat components in visible area');
    return { applied: 0, total: 0 };
  }

  // Sort by vertical position
  allChatComponents.sort((a, b) => {
    const aY = a.absoluteTransform ? a.absoluteTransform[1][2] : 0;
    const bY = b.absoluteTransform ? b.absoluteTransform[1][2] : 0;
    return aY - bY;
  });

  // Determine spacing based on percentage
  let baseInterval, variation;
  if (percentage === 25) {
    // "Some" - every 4-5 messages
    baseInterval = 4;
    variation = 2;
  } else if (percentage === 50) {
    // "Lots" - every 2-3 messages
    baseInterval = 2;
    variation = 2;
  } else {
    baseInterval = 3;
    variation = 2;
  }

  // Select which messages get stickers
  const selectedIndices = [];
  let nextStickerIndex = Math.floor(Math.random() * 2);

  while (nextStickerIndex < allChatComponents.length) {
    selectedIndices.push(nextStickerIndex);
    const interval = baseInterval + Math.floor(Math.random() * variation);
    nextStickerIndex += interval;
  }

  console.log(`[STICKER] Selected ${selectedIndices.length} messages at indices: ${selectedIndices.join(', ')}`);

  // Find the parent frame to add stickers to
  // Prefer the clipping parent (viewport frame) for absolute positioning within visible area
  let stickerParent = null;

  // First, try to use the clipping parent from visible bounds
  if (visibleBounds.clippingParent && visibleBounds.clippingParent.type === 'FRAME') {
    stickerParent = visibleBounds.clippingParent;
    console.log(`[STICKER] Using clipping parent "${stickerParent.name}" for absolute positioning`);
  } else if (threadNode.type !== 'INSTANCE' && 'appendChild' in threadNode) {
    stickerParent = threadNode;
  } else {
    // Fallback: find nearest non-instance parent or use page
    stickerParent = threadNode.parent || figma.currentPage;
  }

  // Track which stickers have been used (no duplicates in same chat)
  const usedStickers = new Set();

  let appliedCount = 0;

  for (const index of selectedIndices) {
    const chatComponent = allChatComponents[index];

    // Determine if this is a sender or recipient message
    const isSender = isSenderNode(chatComponent) ||
                     (chatComponent.parent && isSenderNode(chatComponent.parent));

    // Pick a random sticker (excluding already used ones)
    const sticker = pickRandomSticker(usedStickers);

    // If no stickers left (all used), skip this message
    if (!sticker) {
      console.log(`[STICKER] No more unique stickers available, skipping message ${index}`);
      continue;
    }

    // Mark this sticker as used
    usedStickers.add(sticker.name);

    console.log(`[STICKER] Placing "${sticker.name}" near message ${index} (${isSender ? 'sender' : 'recipient'})`);

    try {
      // Import the sticker component from the library
      const stickerComponent = await figma.importComponentByKeyAsync(sticker.key);

      if (!stickerComponent) {
        console.log(`[STICKER] Failed to import component for "${sticker.name}"`);
        continue;
      }

      // Create an instance of the sticker
      const stickerInstance = stickerComponent.createInstance();

      // Pick a random size between 70-100px
      const stickerSize = pickRandomStickerSize();

      // Scale to random size (height scales proportionally)
      const originalWidth = stickerInstance.width;
      const originalHeight = stickerInstance.height;
      const scale = stickerSize / originalWidth;
      const stickerHeight = originalHeight * scale;
      stickerInstance.resize(stickerSize, stickerHeight);

      console.log(`[STICKER] Size: ${stickerSize.toFixed(0)}px`);

      // Get the chat component's position
      const chatBounds = chatComponent.absoluteBoundingBox;
      if (!chatBounds) {
        console.log(`[STICKER] No bounds for chat component`);
        stickerInstance.remove();
        continue;
      }

      // Calculate sticker position
      let stickerX, stickerY;

      // Randomize vertical position: anywhere along the height of the chat bubble
      const verticalOffset = Math.random() * (chatBounds.height - stickerSize * 0.5);
      stickerY = chatBounds.y + verticalOffset;

      // Randomize overlap: 50% chance to overlap the edge, 50% to be in margin
      const shouldOverlap = Math.random() > 0.5;
      const overlapAmount = shouldOverlap ? (stickerSize * 0.3) : 0; // 30% overlap
      const marginOffset = 10 + Math.random() * 20; // 10-30px from edge

      if (isSender) {
        // Sender messages: sticker on LEFT margin
        // Chat bubble is on the right side, so left margin is to the left of the bubble
        stickerX = chatBounds.x - stickerSize - marginOffset + overlapAmount;
      } else {
        // Recipient messages: sticker on RIGHT margin
        // Chat bubble is on the left side, so right margin is to the right of the bubble
        stickerX = chatBounds.x + chatBounds.width + marginOffset - overlapAmount;
      }

      // ================================================================
      // BOUNDS CHECKING: Ensure sticker stays within VISIBLE bounds
      // ================================================================
      const minX = visibleBounds.x;
      const maxX = visibleBounds.x + visibleBounds.width - stickerSize;
      const minY = visibleBounds.y;
      const maxY = visibleBounds.y + visibleBounds.height - stickerHeight;

      // Clamp X position
      if (stickerX < minX) {
        console.log(`[STICKER] X position ${stickerX.toFixed(0)} below min ${minX.toFixed(0)}, clamping`);
        stickerX = minX;
      } else if (stickerX > maxX) {
        console.log(`[STICKER] X position ${stickerX.toFixed(0)} above max ${maxX.toFixed(0)}, clamping`);
        stickerX = maxX;
      }

      // Clamp Y position
      if (stickerY < minY) {
        console.log(`[STICKER] Y position ${stickerY.toFixed(0)} below min ${minY.toFixed(0)}, clamping`);
        stickerY = minY;
      } else if (stickerY > maxY) {
        console.log(`[STICKER] Y position ${stickerY.toFixed(0)} above max ${maxY.toFixed(0)}, clamping`);
        stickerY = maxY;
      }

      // Set position (using absolute coordinates, then we'll add to correct parent)
      // We need to convert to parent-relative coordinates
      const parentBounds = stickerParent.absoluteBoundingBox;
      if (parentBounds) {
        stickerInstance.x = stickerX - parentBounds.x;
        stickerInstance.y = stickerY - parentBounds.y;
      } else {
        stickerInstance.x = stickerX;
        stickerInstance.y = stickerY;
      }

      // Apply random rotation
      const rotation = pickRandomRotation();
      stickerInstance.rotation = rotation;

      // Name the sticker for easy identification (must be set before appending
      // so that removal can always find it even if a later step throws)
      stickerInstance.name = `Sticker - ${sticker.name}`;

      // Add to parent (or page if we can't add to instance)
      if (stickerParent.type !== 'INSTANCE' && 'appendChild' in stickerParent) {
        stickerParent.appendChild(stickerInstance);
      } else {
        // Add to the page at the calculated position
        figma.currentPage.appendChild(stickerInstance);
        // Re-set position since we added to page
        stickerInstance.x = stickerX;
        stickerInstance.y = stickerY;
      }

      // Set to absolute positioning when parent uses auto layout,
      // so stickers float on top without affecting the chat thread layout
      if (stickerParent.layoutMode && stickerParent.layoutMode !== 'NONE') {
        stickerInstance.layoutPositioning = "ABSOLUTE";
      }

      console.log(`[STICKER] ✓ Placed "${sticker.name}" at (${stickerInstance.x.toFixed(0)}, ${stickerInstance.y.toFixed(0)}) rotation: ${rotation}°`);
      appliedCount++;

    } catch (error) {
      console.log(`[STICKER] Error placing sticker:`, error.message);
    }
  }

  return { applied: appliedCount, total: allChatComponents.length };
}

/**
 * Remove all stickers from around a chat thread
 * Looks for nodes named "Sticker - *"
 */
function removeStickersFromThread(threadNode) {
  const stickersToRemove = [];

  // Search in the thread node and its parent (in case stickers are siblings)
  const searchRoots = [threadNode];
  if (threadNode.parent && threadNode.parent.type !== 'PAGE') {
    searchRoots.push(threadNode.parent);
  }
  // Also search the page for stickers that might have been added there
  searchRoots.push(figma.currentPage);

  for (const root of searchRoots) {
    function search(node) {
      if (node.name.startsWith('Sticker - ')) {
        stickersToRemove.push(node);
        return; // Don't search inside stickers
      }

      if ('children' in node) {
        for (const child of node.children) {
          search(child);
        }
      }
    }

    search(root);
  }

  // Remove duplicates (in case same sticker was found in multiple searches)
  const uniqueStickers = [...new Map(stickersToRemove.map(s => [s.id, s])).values()];

  console.log(`[STICKER] Removing ${uniqueStickers.length} stickers`);

  for (const sticker of uniqueStickers) {
    try {
      sticker.remove();
    } catch (e) {
      console.log(`[STICKER] Could not remove sticker:`, e.message);
    }
  }

  return { removed: uniqueStickers.length };
}

// ============================================================================
// MEDIA CHAT: Replace Text chat with Media chat or IG content share
// ============================================================================

/**
 * Track original Text chat nodes for restoration
 */
let originalTextChatNodes = new Map(); // Map of node ID → original node info

/**
 * Find the parent that can swap child instances (Chat block, Content, etc.)
 * @param {SceneNode} textChatNode - The Text chat instance to find parent for
 * @returns {SceneNode|null} - The parent node that can accept instance swaps
 */
function findSwappableParent(textChatNode) {
  let parent = textChatNode.parent;
  let depth = 0;

  while (parent && depth < 5) {
    // Look for common container names that can have children swapped
    const name = parent.name.toLowerCase();
    if (name.includes('content') || name.includes('chat block') || name.includes('block')) {
      return parent;
    }
    parent = parent.parent;
    depth++;
    return textChatNode.parent;
  }

  return textChatNode.parent;
}

/**
 * Shuffle media content in existing Media chat and IG content share instances
 * Does NOT change placement - only shuffles background images and text
 * @param {SceneNode} threadNode - The chat thread node
 * @param {string[]} mediaTypes - Array of media types to shuffle ['media-chat', 'reels']
 * @returns {Object} - { shuffled: number }
 */
async function shuffleMediaContent(threadNode, mediaTypes) {
  console.log(`[SHUFFLE] Shuffling content for types:`, mediaTypes);
  console.log(`[SHUFFLE] Thread node: "${threadNode.name}" (type: ${threadNode.type})`);

  // Debug: List immediate children and their instance names to help diagnose
  function debugListChildren(node, prefix = '', maxDepth = 5, currentDepth = 0) {
    if (currentDepth > maxDepth) return;
    if ('children' in node) {
      for (const child of node.children) {
        const typeLabel = child.type === 'INSTANCE' ? `INSTANCE` : child.type;
        if (child.type === 'INSTANCE' || child.type === 'FRAME' || child.type === 'GROUP') {
          console.log(`[SHUFFLE] ${prefix}├─ "${child.name}" (${typeLabel})`);
          debugListChildren(child, prefix + '│  ', maxDepth, currentDepth + 1);
        }
      }
    }
  }

  console.log(`[SHUFFLE] --- Thread structure (first 5 levels) ---`);
  debugListChildren(threadNode, '', 5, 0);
  console.log(`[SHUFFLE] --- End structure ---`);

  let shuffledCount = 0;

  // Helper to get a random image from all categories
  function getRandomImage(imageSet) {
    const allImages = [];
    for (const category in imageSet) {
      if (imageSet[category] && imageSet[category].length > 0) {
        allImages.push(...imageSet[category]);
      }
    }
    if (allImages.length === 0) return null;
    return allImages[Math.floor(Math.random() * allImages.length)];
  }

  // Helper to find Media chat instances recursively
  function findMediaChatInstances(node, results = [], depth = 0) {
    if (depth > 20) return results; // Increased depth
    if (node.type === 'INSTANCE') {
      const nodeName = node.name.toLowerCase();
      // More flexible matching
      if (nodeName === 'media chat' ||
          nodeName.includes('media chat') ||
          nodeName === 'mediachat' ||
          nodeName.includes('media-chat')) {
        console.log(`[SHUFFLE] Found Media chat: "${node.name}" at depth ${depth}`);
        results.push(node);
      }
    }
    if ('children' in node) {
      for (const child of node.children) {
        findMediaChatInstances(child, results, depth + 1);
      }
    }
    return results;
  }

  // Helper to find IG content share instances recursively
  function findIGContentShareInstances(node, results = [], depth = 0) {
    if (depth > 20) return results; // Increased depth
    if (node.type === 'INSTANCE') {
      const nodeName = node.name.toLowerCase();
      // More flexible matching for IG content share / Reels
      if (nodeName === 'ig content share' ||
          nodeName.includes('ig content share') ||
          nodeName === 'igcontentshare' ||
          nodeName.includes('reels') ||
          nodeName === '.xma' ||
          nodeName.includes('content share')) {
        console.log(`[SHUFFLE] Found IG content share/Reels: "${node.name}" at depth ${depth}`);
        results.push(node);
      }
    }
    if ('children' in node) {
      for (const child of node.children) {
        findIGContentShareInstances(child, results, depth + 1);
      }
    }
    return results;
  }

  // Helper to find .Aspect ratio node inside a component (same logic as applyImageToMediaChat/Reels)
  function findAspectRatioNode(parentNode) {
    let aspectRatioNode = null;
    function search(node, depth) {
      if (depth > 15 || aspectRatioNode) return;
      const name = node.name;
      if (name === '.Aspect ratio' || name.startsWith('.Aspect ratio')) {
        aspectRatioNode = node;
        return;
      }
      if ('children' in node) {
        for (const child of node.children) {
          search(child, depth + 1);
        }
      }
    }
    search(parentNode, 0);
    return aspectRatioNode;
  }

  // Helper to find the aspect ratio frame that has the image fill
  function findAspectRatioFrame(aspectRatioNode) {
    const aspectRatioPatterns = ['4:3', '16:9', '1:1', '9:16', '3:4', '2:3', '3:2'];
    let aspectRatioFrame = null;

    if ('children' in aspectRatioNode) {
      // First, look for named aspect ratio frames
      for (const child of aspectRatioNode.children) {
        const childName = child.name;
        if (aspectRatioPatterns.includes(childName) || childName.match(/^\d+:\d+$/)) {
          if (child.visible !== false) {
            aspectRatioFrame = child;
            break;
          }
        }
      }

      // Fallback: find first suitable frame/rectangle child
      if (!aspectRatioFrame) {
        for (const child of aspectRatioNode.children) {
          if ((child.type === 'FRAME' || child.type === 'RECTANGLE') &&
              child.visible !== false &&
              !child.name.toLowerCase().includes('button') &&
              !child.name.toLowerCase().includes('play')) {
            aspectRatioFrame = child;
            break;
          }
        }
      }
    }

    // Fallback: use the aspect ratio node itself if it has fills
    if (!aspectRatioFrame && 'fills' in aspectRatioNode) {
      aspectRatioFrame = aspectRatioNode;
    }

    return aspectRatioFrame;
  }

  // Helper to apply image to a media component using the same logic as applyImageToMediaChat/Reels
  async function applyImageToComponent(componentNode, imageUrl) {
    if (!componentNode || !imageUrl) return false;

    try {
      // Find .Aspect ratio node
      const aspectRatioNode = findAspectRatioNode(componentNode);
      if (!aspectRatioNode) {
        console.log('[SHUFFLE] .Aspect ratio not found in component');
        return false;
      }

      // Find the frame to apply the image to
      const aspectRatioFrame = findAspectRatioFrame(aspectRatioNode);
      if (!aspectRatioFrame) {
        console.log('[SHUFFLE] Could not find aspect ratio frame to fill');
        return false;
      }

      // Fetch and apply the image using figma.createImageAsync
      const image = await figma.createImageAsync(imageUrl);
      console.log('[SHUFFLE] Image fetched, hash: ' + image.hash);

      if ('fills' in aspectRatioFrame) {
        aspectRatioFrame.fills = [{
          type: 'IMAGE',
          scaleMode: 'FILL',
          imageHash: image.hash
        }];
        return true;
      }
    } catch (error) {
      console.log('[SHUFFLE] Error applying image:', error.message);
    }
    return false;
  }

  // Helper to find and update profile/username in Reels
  async function shuffleReelsProfile(igContentShareNode) {
    const randomProfile = PROFILE_VARIANTS[Math.floor(Math.random() * PROFILE_VARIANTS.length)];
    let profilesUpdated = 0;
    let usernameUpdated = false;

    console.log(`[SHUFFLE] Shuffling Reels profile to "${randomProfile}"`);

    // Helper function to find and update Person instance inside a Profile photo
    function updatePersonInProfilePhoto(profilePhotoNode) {
      let updated = false;

      function findPerson(node, depth) {
        if (depth > 5 || updated) return;

        if (node.type === 'INSTANCE' && node.name === 'Person') {
          try {
            const props = node.componentProperties;
            const propKeys = Object.keys(props);
            console.log(`[SHUFFLE] Found Person instance with props: ${propKeys.join(', ')}`);

            for (const key of propKeys) {
              const keyLower = key.toLowerCase();
              if (keyLower.includes('handle') || keyLower.includes('variant') || keyLower.includes('user')) {
                console.log(`[SHUFFLE] Setting Person "${key}" to "${randomProfile}"`);
                node.setProperties({ [key]: randomProfile });
                console.log(`[SHUFFLE] ✓ Updated Person handle to "${randomProfile}"`);
                updated = true;
                return;
              }
            }
          } catch (e) {
            console.log(`[SHUFFLE] Error updating Person: ${e.message}`);
          }
        }

        if ('children' in node) {
          for (const child of node.children) {
            findPerson(child, depth + 1);
          }
        }
      }

      findPerson(profilePhotoNode, 0);
      return updated;
    }

    async function processNode(node, depth) {
      if (depth > 15) return;

      const nodeName = node.name;
      const nodeNameLower = nodeName.toLowerCase();

      // Look for Profile photo components and update the nested Person inside them
      if (node.type === 'INSTANCE') {
        const isProfilePhoto = nodeName === 'Profile photo' ||
                               nodeName === '.Profile photo' ||
                               nodeNameLower === 'profile photo';

        if (isProfilePhoto) {
          console.log(`[SHUFFLE] Found Profile photo component at depth ${depth}`);

          // First try to find Handle directly on this component
          try {
            const props = node.componentProperties;
            const propKeys = Object.keys(props);
            let hasHandle = false;

            for (const key of propKeys) {
              const keyLower = key.toLowerCase();
              if (keyLower.includes('handle')) {
                console.log(`[SHUFFLE] Setting "${key}" to "${randomProfile}" on Profile photo`);
                node.setProperties({ [key]: randomProfile });
                profilesUpdated++;
                hasHandle = true;
                console.log(`[SHUFFLE] ✓ Updated Profile photo handle`);
                break;
              }
            }

            // If no Handle on Profile photo, look for nested Person instance
            if (!hasHandle) {
              console.log(`[SHUFFLE] No Handle on Profile photo, searching for nested Person...`);
              if (updatePersonInProfilePhoto(node)) {
                profilesUpdated++;
              }
            }
          } catch (e) {
            console.log(`[SHUFFLE] Error with Profile photo: ${e.message}`);
          }
        }

        // Also look for .People profile pictures (different component type)
        const isPeopleProfile = nodeName === '.People profile pictures' ||
                                nodeNameLower.includes('people profile pictures');
        if (isPeopleProfile) {
          try {
            const props = node.componentProperties;
            const propKeys = Object.keys(props);
            for (const key of propKeys) {
              if (key.toLowerCase().includes('handle')) {
                node.setProperties({ [key]: randomProfile });
                profilesUpdated++;
                console.log(`[SHUFFLE] ✓ Updated .People profile pictures handle`);
                break;
              }
            }
          } catch (e) {
            console.log(`[SHUFFLE] Error with .People profile pictures: ${e.message}`);
          }
        }
      }

      // Look for username/title text nodes
      if (node.type === 'TEXT' && 'characters' in node && !usernameUpdated) {
        const isUsernameNode = nodeNameLower === 'title' ||
                               nodeName === 'Title' ||
                               nodeNameLower.includes('username');
        if (isUsernameNode) {
          try {
            await figma.loadFontAsync(node.fontName);
            node.characters = randomProfile;
            console.log(`[SHUFFLE] ✓ Set username text to "${randomProfile}"`);
            usernameUpdated = true;
          } catch (fontError) {
            console.log('[SHUFFLE] Could not change username text:', fontError.message);
          }
        }
      }

      if ('children' in node) {
        for (const child of node.children) {
          await processNode(child, depth + 1);
        }
      }
    }

    await processNode(igContentShareNode, 0);

    // Log result
    if (profilesUpdated > 0 && usernameUpdated) {
      console.log(`[SHUFFLE] ✓ Updated ${profilesUpdated} profile photo(s) AND username to "${randomProfile}"`);
    } else if (usernameUpdated) {
      console.log(`[SHUFFLE] ⚠ Username updated but no profile photos found`);
    } else if (profilesUpdated > 0) {
      console.log(`[SHUFFLE] ⚠ ${profilesUpdated} profile photo(s) updated but username text not found`);
    } else {
      console.log(`[SHUFFLE] ✗ Neither profile photo nor username could be updated`);
    }

    return profilesUpdated > 0 || usernameUpdated;
  }

  // Process Media chat components
  if (mediaTypes.includes('media-chat')) {
    const mediaChats = findMediaChatInstances(threadNode);
    console.log(`[SHUFFLE] Found ${mediaChats.length} Media chat instances`);

    for (const mediaChat of mediaChats) {
      const newImageUrl = getRandomImage(MEDIA_IMAGES);
      if (newImageUrl) {
        const success = await applyImageToComponent(mediaChat, newImageUrl);
        if (success) {
          shuffledCount++;
          console.log(`[SHUFFLE] Shuffled Media chat image in "${mediaChat.name}"`);
        }
      }
    }
  }

  // Process IG content share (Reels) components
  if (mediaTypes.includes('reels')) {
    const igContentShares = findIGContentShareInstances(threadNode);
    console.log(`[SHUFFLE] Found ${igContentShares.length} IG content share instances`);

    for (const igShare of igContentShares) {
      // Shuffle the background image
      const newImageUrl = getRandomImage(REELS_IMAGES);
      if (newImageUrl) {
        const success = await applyImageToComponent(igShare, newImageUrl);
        if (success) {
          shuffledCount++;
          console.log(`[SHUFFLE] Shuffled Reels image in "${igShare.name}"`);
        }
      }

      // Shuffle the profile photo and username
      const profileSuccess = await shuffleReelsProfile(igShare);
      if (profileSuccess) {
        shuffledCount++;
      }
    }
  }

  console.log(`[SHUFFLE] Completed - shuffled ${shuffledCount} items`);
  return { shuffled: shuffledCount };
}

/**
 * Apply media chat components to the thread
 * Uses instance swapping on Chat block's Sender/Recipient properties to replace Text chat with Media chat/IG content share
 * @param {SceneNode} threadNode - The chat thread node
 * @param {number} percentage - Percentage level (25 = Some, 50 = Lots)
 * @param {string[]} mediaTypes - Array of media types to use ['media-chat', 'ig-content-share']
 * @returns {Object} - { applied: number, total: number }
 */
async function applyMediaChatToThread(threadNode, percentage, mediaTypes) {
  console.log(`[MEDIA CHAT] Applying media at ${percentage}% with types:`, mediaTypes);

  // Load all pages first to enable searching across the document
  // This is required because manifest has documentAccess: dynamic-page
  try {
    await figma.loadAllPagesAsync();
    console.log('[MEDIA CHAT] Loaded all pages for document search');
  } catch (loadError) {
    console.log('[MEDIA CHAT] Warning: Could not load all pages:', loadError.message);
  }

  // Detect if this is a group chat (3+ people) by checking "Group chat?" property
  var isGroupChat = false;
  try {
    if (threadNode.type === 'INSTANCE') {
      var threadProps = threadNode.componentProperties;
      var threadPropKeys = Object.keys(threadProps);
      for (var tp = 0; tp < threadPropKeys.length; tp++) {
        var tpKey = threadPropKeys[tp];
        if (tpKey.toLowerCase().includes('group chat')) {
          var tpValue = threadProps[tpKey].value;
          isGroupChat = tpValue === true || tpValue === 'true' || tpValue === 'Yes' || tpValue === 'yes';
          console.log('[MEDIA CHAT] Detected Group chat property: ' + tpKey + ' = ' + tpValue + ' → isGroupChat = ' + isGroupChat);
          break;
        }
      }
    }
  } catch (gcError) {
    console.log('[MEDIA CHAT] Could not detect group chat status:', gcError.message);
  }

  // Get assigned profiles for eyebrow text (A, B, C)
  var assignedProfiles = null;
  if (isGroupChat) {
    try {
      assignedProfiles = discoverAssignedProfiles(threadNode);
      console.log('[MEDIA CHAT] Discovered profiles for eyebrow - A: ' + assignedProfiles.A + ', B: ' + assignedProfiles.B + ', C: ' + assignedProfiles.C);
    } catch (profError) {
      console.log('[MEDIA CHAT] Could not discover profiles:', profError.message);
    }
  }

  // Capture gradient state before making changes
  var gradientInstances = findGradientStepInstances(threadNode);
  var gradientStates = [];
  for (var i = 0; i < gradientInstances.length; i++) {
    var instance = gradientInstances[i];
    try {
      var props = instance.componentProperties;
      var keys = Object.keys(props);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var keyLower = key.toLowerCase();
        if (keyLower === 'strength' || keyLower.startsWith('strength#')) {
          gradientStates.push({
            instance: instance,
            key: key,
            value: props[key].value
          });
          break;
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  console.log('[MEDIA CHAT] Captured ' + gradientStates.length + ' gradient states');

  // Get the VISIBLE bounds of the Chat thread (accounting for clipping parents)
  const visibleBounds = getVisibleBounds(threadNode);
  if (visibleBounds) {
    console.log(`[MEDIA CHAT] Visible bounds: ${visibleBounds.width.toFixed(0)} x ${visibleBounds.height.toFixed(0)}`);
  }

  // Find all Chat block components
  const chatBlocksUnfiltered = findChatBlockComponents(threadNode);

  if (chatBlocksUnfiltered.length === 0) {
    console.log('[MEDIA CHAT] No Chat block components found');
    return { applied: 0, total: 0 };
  }

  // Filter to only include blocks within the visible bounds
  const chatBlocks = visibleBounds
    ? chatBlocksUnfiltered.filter(block => isNodeInVisibleBounds(block, visibleBounds))
    : chatBlocksUnfiltered;

  console.log(`[MEDIA CHAT] Found ${chatBlocksUnfiltered.length} total Chat blocks, ${chatBlocks.length} in visible area`);

  if (chatBlocks.length === 0) {
    console.log('[MEDIA CHAT] No Chat blocks in visible area');
    return { applied: 0, total: 0 };
  }

  // Log thread length category for debugging
  const lengthCategory = chatBlocks.length <= 5 ? 'SHORT' :
                         chatBlocks.length <= 12 ? 'MEDIUM' : 'LONG';
  console.log(`[MEDIA CHAT] Thread length: ${chatBlocks.length} blocks → Category: ${lengthCategory}`);

  // Sort by vertical position
  chatBlocks.sort((a, b) => {
    const aY = a.absoluteTransform ? a.absoluteTransform[1][2] : 0;
    const bY = b.absoluteTransform ? b.absoluteTransform[1][2] : 0;
    return aY - bY;
  });

  // Determine if "both" mode is selected (need at least 2 slots for one of each type)
  const isBothModeEarly = mediaTypes.length === 2 && mediaTypes.includes('media-chat') && mediaTypes.includes('reels');

  // Select which Chat blocks get modified
  let selectedIndices = [];

  // For short threads (5 or fewer blocks), use a simpler selection approach
  if (chatBlocks.length <= 5) {
    // Short thread: select specific indices based on length
    if (chatBlocks.length === 1) {
      selectedIndices = [0];
    } else if (chatBlocks.length === 2) {
      // For "both" mode, use both; otherwise pick one randomly
      selectedIndices = isBothModeEarly ? [0, 1] : [Math.floor(Math.random() * 2)];
    } else if (chatBlocks.length === 3) {
      // Pick 2 indices for "both", or 1 for single type
      if (isBothModeEarly) {
        // Pick first and last, or first and middle, etc.
        const options = [[0, 2], [0, 1], [1, 2]];
        selectedIndices = options[Math.floor(Math.random() * options.length)];
      } else {
        selectedIndices = [Math.floor(Math.random() * 3)];
      }
    } else if (chatBlocks.length === 4) {
      if (isBothModeEarly) {
        // Pick 2 spaced apart
        const options = [[0, 2], [0, 3], [1, 3]];
        selectedIndices = options[Math.floor(Math.random() * options.length)];
      } else {
        // Pick 1
        selectedIndices = [Math.floor(Math.random() * 4)];
      }
    } else { // chatBlocks.length === 5
      if (isBothModeEarly) {
        // Pick 2 spaced apart
        const options = [[0, 3], [1, 4], [0, 4], [1, 3]];
        selectedIndices = options[Math.floor(Math.random() * options.length)];
      } else {
        // Pick 1-2
        const idx1 = Math.floor(Math.random() * 5);
        selectedIndices = [idx1];
      }
    }
    console.log(`[MEDIA CHAT] Short thread (${chatBlocks.length} blocks) - selected indices: ${selectedIndices.join(', ')}`);
  } else {
    // Medium to long threads: use interval-based selection
    let baseInterval, variation;
    if (percentage === 25) {
      baseInterval = 4;
      variation = 2;
    } else if (percentage === 50) {
      baseInterval = 2;
      variation = 2;
    } else {
      baseInterval = 3;
      variation = 2;
    }

    let nextIndex = Math.floor(Math.random() * 2);

    while (nextIndex < chatBlocks.length) {
      selectedIndices.push(nextIndex);
      const interval = baseInterval + Math.floor(Math.random() * variation);
      nextIndex += interval;
    }

    // Ensure minimum selections for "both" mode even in medium threads
    if (isBothModeEarly && selectedIndices.length < 2 && chatBlocks.length >= 2) {
      // Add another index if we only got one
      if (selectedIndices.length === 1) {
        // Pick a different index
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * chatBlocks.length);
        } while (newIndex === selectedIndices[0]);
        selectedIndices.push(newIndex);
        selectedIndices.sort((a, b) => a - b);
      } else if (selectedIndices.length === 0) {
        // Shouldn't happen, but handle it
        selectedIndices = [0, Math.min(1, chatBlocks.length - 1)];
      }
    }

    console.log(`[MEDIA CHAT] Medium/long thread (${chatBlocks.length} blocks) - selected ${selectedIndices.length} indices: ${selectedIndices.join(', ')}`);
  }

  // Clear any previous tracking
  originalTextChatNodes.clear();

  let appliedCount = 0;

  // Track used images to prevent duplicates in the same thread
  const usedImagesInThread = new Set();

  // When "both" is selected (media-chat AND reels), ensure at least one of each type
  // Create an array of media types to use for each selected index
  let mediaTypeAssignments = [];
  const isBothMode = mediaTypes.length === 2 && mediaTypes.includes('media-chat') && mediaTypes.includes('reels');

  if (isBothMode && selectedIndices.length >= 2) {
    // Guarantee at least one of each type
    // Randomly assign which index gets which guaranteed type
    const guaranteedIndices = [0, 1];
    // Shuffle the first two to randomize which gets media-chat vs reels
    if (Math.random() > 0.5) {
      guaranteedIndices.reverse();
    }
    mediaTypeAssignments[guaranteedIndices[0]] = 'media-chat';
    mediaTypeAssignments[guaranteedIndices[1]] = 'reels';

    // Fill remaining indices with random selection
    for (let i = 2; i < selectedIndices.length; i++) {
      mediaTypeAssignments[i] = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
    }
    console.log(`[MEDIA CHAT] "Both" mode - guaranteed at least one media-chat and one reels`);
  } else if (isBothMode && selectedIndices.length === 1) {
    // Only one slot available - randomly pick one type
    mediaTypeAssignments[0] = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
    console.log(`[MEDIA CHAT] "Both" mode but only 1 slot - randomly picked: ${mediaTypeAssignments[0]}`);
  } else {
    // Single media type selected or other cases - random assignment
    for (let i = 0; i < selectedIndices.length; i++) {
      mediaTypeAssignments[i] = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
    }
  }

  for (let assignmentIndex = 0; assignmentIndex < selectedIndices.length; assignmentIndex++) {
    const index = selectedIndices[assignmentIndex];
    const chatBlock = chatBlocks[index];

    // Use the pre-assigned media type
    const mediaType = mediaTypeAssignments[assignmentIndex];

    console.log(`[MEDIA CHAT] Swapping Chat block ${index} to ${mediaType}`);

    try {
      // Get component properties
      const props = chatBlock.componentProperties;
      const propKeys = Object.keys(props);

      // Determine if this is Sender or Recipient based on To-From variant
      let sideType = 'sender';
      for (const key of propKeys) {
        if (key === 'To - From' && props[key].type === 'VARIANT') {
          sideType = props[key].value.toLowerCase() === 'recipient' ? 'recipient' : 'sender';
          break;
        }
      }

      // Determine position type based on Chat bubbles variant
      let chatBubbles = '1';
      for (const key of propKeys) {
        if (key === 'Chat bubbles' && props[key].type === 'VARIANT') {
          chatBubbles = props[key].value;
          break;
        }
      }

      console.log(`[MEDIA CHAT] Chat block is ${sideType} with ${chatBubbles} bubble(s)`);

      // Find the appropriate property key and determine position
      let propKeyToSwap = null;
      let position = 'single';

      if (chatBubbles === '1') {
        // Single bubble - use single position
        position = 'single';
        for (const key of propKeys) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes(sideType) && keyLower.includes('single') && props[key].type === 'INSTANCE_SWAP') {
            propKeyToSwap = key;
            break;
          }
        }
      } else {
        // Multiple bubbles - find all available positions for this Chat block
        const availableSlots = [];
        for (const key of propKeys) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes(sideType) && props[key].type === 'INSTANCE_SWAP') {
            if (keyLower.includes('top')) {
              availableSlots.push({ key: key, position: 'top' });
            } else if (keyLower.includes('mid')) {
              availableSlots.push({ key: key, position: 'mid' });
            } else if (keyLower.includes('bottom')) {
              availableSlots.push({ key: key, position: 'bottom' });
            }
          }
        }

        console.log(`[MEDIA CHAT] Available slots: ${availableSlots.map(s => s.position).join(', ')}`);

        if (availableSlots.length > 0) {
          // Pick a random slot from available ones
          const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
          propKeyToSwap = randomSlot.key;
          position = randomSlot.position;
          console.log(`[MEDIA CHAT] Selected position: ${position} (slot: ${propKeyToSwap})`);
        }
      }

      if (!propKeyToSwap) {
        console.log(`[MEDIA CHAT] Could not find ${sideType} (${position}) property to swap`);
        continue;
      }

      // Store original value for restoration
      originalTextChatNodes.set(chatBlock.id, {
        index: index,
        propKey: propKeyToSwap,
        originalValue: props[propKeyToSwap].value
      });

      // Get the target component SET name for the media type
      const targetComponentSetName = MEDIA_CHAT_COMPONENT_SET_NAMES[mediaType];
      if (!targetComponentSetName) {
        console.log(`[MEDIA CHAT] Unknown media type: ${mediaType}`);
        continue;
      }

      // Determine the variant we need based on sideType and position
      // Media chat variants are named like: "To - From=Sender, Chat bubble=Single"
      const targetSide = sideType === 'sender' ? 'Sender' : 'Recipient';
      const targetBubble = position === 'single' ? 'Single' :
                          position === 'top' ? 'Top' :
                          position === 'mid' ? 'Middle' : 'Bottom';

      console.log(`[MEDIA CHAT] Looking for "${targetComponentSetName}" with To - From=${targetSide}, Chat bubble=${targetBubble}`);

      const propDef = props[propKeyToSwap];
      let nodeId = null;

      // Helper function to find the matching variant in a component set
      function findMatchingVariant(componentSet) {
        if (!componentSet || componentSet.type !== 'COMPONENT_SET') {
          console.log('[MEDIA CHAT] Not a component set: ' + (componentSet ? componentSet.name : 'null'));
          return null;
        }

        console.log(`[MEDIA CHAT] Searching component set "${componentSet.name}" with ${componentSet.children.length} variants...`);

        // Check if we have nested instance config for this media type (e.g., reels needs .XMA type → Type=Reels)
        const nestedConfig = MEDIA_TYPE_NESTED_INSTANCE_CONFIG[mediaType];
        if (nestedConfig) {
          console.log(`[MEDIA CHAT] Will configure nested instance "${nestedConfig.nestedInstanceName}" with ${nestedConfig.propertyName}="${nestedConfig.propertyValue}" after swap`);
        }

        for (const child of componentSet.children) {
          if (child.type !== 'COMPONENT') continue;

          const childName = child.name;
          const childNameLower = childName.toLowerCase();

          // Skip ephemeral variants
          if (childNameLower.includes('ephemeral')) {
            console.log(`[MEDIA CHAT]   - Skipping ephemeral: "${childName}"`);
            continue;
          }

          // Parse the variant name to extract To - From, Chat bubble, and other values
          // Format: "To - From=Sender, Chat bubble=Single, Share=Share reels"
          const nameParts = childName.split(',').map(p => p.trim());
          let variantSide = null;
          let variantBubble = null;
          const variantProps = {};

          for (const part of nameParts) {
            if (part.startsWith('To - From=')) {
              variantSide = part.split('=')[1].trim();
            } else if (part.startsWith('Chat bubble=')) {
              variantBubble = part.split('=')[1].trim();
            } else if (part.includes('=')) {
              // Capture other variant properties like Share=Share reels
              const [propName, propValue] = part.split('=').map(s => s.trim());
              variantProps[propName] = propValue;
            }
          }

          console.log(`[MEDIA CHAT]   - Variant: "${childName}" → Side="${variantSide}", Bubble="${variantBubble}"`);
          console.log(`[MEDIA CHAT]     Comparing: Side "${variantSide}" === "${targetSide}" ? ${variantSide === targetSide}`);
          console.log(`[MEDIA CHAT]     Comparing: Bubble "${variantBubble}" === "${targetBubble}" ? ${variantBubble === targetBubble}`);

          // Check if this variant matches what we need
          // For ALL media types (including reels), match by To-From and Chat bubble
          // Post-swap properties (like State=Share reels) are applied after the instance swap
          let sideMatches = variantSide === targetSide;
          let bubbleMatches = variantBubble === targetBubble;

          if (sideMatches && bubbleMatches) {
            console.log(`[MEDIA CHAT]     ✓ MATCH FOUND!`);
            return child;
          }
        }

        console.log(`[MEDIA CHAT] No matching variant found. Was looking for Side="${targetSide}", Bubble="${targetBubble}"`);
        return null;
      }

      // Helper function for case-insensitive name matching
      function nameMatches(actualName, targetName) {
        if (!actualName || !targetName) return false;
        return actualName.toLowerCase().trim() === targetName.toLowerCase().trim();
      }

      // Strategy 1: Search preferredValues for the target component set
      if (propDef.preferredValues && Array.isArray(propDef.preferredValues)) {
        console.log(`[MEDIA CHAT] Checking ${propDef.preferredValues.length} preferredValues...`);

        // Log all available component sets in preferredValues for debugging
        const availableNames = [];
        for (const preferred of propDef.preferredValues) {
          if (preferred.type === 'COMPONENT_SET' && preferred.key) {
            try {
              const importedComponentSet = await figma.importComponentSetByKeyAsync(preferred.key);
              if (importedComponentSet) {
                availableNames.push(importedComponentSet.name);
                console.log(`[MEDIA CHAT] Imported component set: "${importedComponentSet.name}" (looking for: "${targetComponentSetName}")`);

                // Use case-insensitive comparison
                if (nameMatches(importedComponentSet.name, targetComponentSetName)) {
                  console.log(`[MEDIA CHAT] ✓ Name match found!`);
                  const matchingVariant = findMatchingVariant(importedComponentSet);
                  if (matchingVariant) {
                    nodeId = matchingVariant.id;
                    console.log(`[MEDIA CHAT] Found matching variant "${matchingVariant.name}" with ID: ${nodeId}`);
                    break;
                  }
                }
              }
            } catch (importError) {
              console.log(`[MEDIA CHAT] Could not import component set:`, importError.message);
            }
          }
        }
        if (!nodeId) {
          console.log(`[MEDIA CHAT] Available component sets in preferredValues: [${availableNames.join(', ')}]`);
        }
      }

      // Strategy 2: Search the document for the component set by name (case-insensitive)
      if (!nodeId) {
        console.log(`[MEDIA CHAT] Searching document for component set "${targetComponentSetName}"...`);

        const targetNameLower = targetComponentSetName.toLowerCase().trim();
        const componentSets = figma.root.findAll(n =>
          n.type === 'COMPONENT_SET' &&
          n.name.toLowerCase().trim() === targetNameLower
        );

        console.log(`[MEDIA CHAT] Found ${componentSets.length} component sets matching "${targetComponentSetName}"`);

        for (const componentSet of componentSets) {
          const matchingVariant = findMatchingVariant(componentSet);
          if (matchingVariant) {
            nodeId = matchingVariant.id;
            console.log(`[MEDIA CHAT] Found matching variant "${matchingVariant.name}" with ID: ${nodeId}`);
            break;
          }
        }
      }

      // Strategy 3: Search for individual components matching the pattern (case-insensitive)
      if (!nodeId) {
        console.log(`[MEDIA CHAT] Searching document for individual components...`);

        // Look for components that match our criteria
        const variantOverrides = MEDIA_TYPE_VARIANT_OVERRIDES[mediaType] || {};
        const hasOverrides = Object.keys(variantOverrides).length > 0;
        const targetNameLower = targetComponentSetName.toLowerCase().trim();

        const allComponents = figma.root.findAll(n => {
          if (n.type !== 'COMPONENT') return false;
          if (n.name.toLowerCase().includes('ephemeral')) return false;

          // Check if parent is the component set we want (case-insensitive)
          const parent = n.parent;
          if (parent && parent.type === 'COMPONENT_SET' && parent.name.toLowerCase().trim() === targetNameLower) {
            // Must match To - From
            if (!n.name.includes(`To - From=${targetSide}`)) return false;

            // Must match Chat bubble (post-swap properties like State are applied after)
            if (!n.name.includes(`Chat bubble=${targetBubble}`)) return false;

            return true;
          }
          return false;
        });

        if (allComponents.length > 0) {
          nodeId = allComponents[0].id;
          console.log(`[MEDIA CHAT] Found component "${allComponents[0].name}" with ID: ${nodeId}`);
        } else {
          // Log what component sets ARE available to help debug
          console.log(`[MEDIA CHAT] No matching components found. Checking what component sets exist...`);
          const allSets = figma.root.findAll(n => n.type === 'COMPONENT_SET');
          const setNames = allSets.map(s => s.name).slice(0, 20);
          console.log(`[MEDIA CHAT] Available component sets (first 20): [${setNames.join(', ')}]`);
        }
      }

      if (!nodeId) {
        console.log(`[MEDIA CHAT] Could not find node ID for ${mediaType} (${position})`);
        continue;
      }

      console.log(`[MEDIA CHAT] Swapping "${propKeyToSwap}" to node ID: ${nodeId}`);

      // Verify the node exists before attempting swap
      try {
        const targetNode = await figma.getNodeByIdAsync(nodeId);
        if (!targetNode) {
          console.log(`[MEDIA CHAT] ✗ Node ID ${nodeId} does not exist or is not accessible`);
          continue;
        }
        console.log(`[MEDIA CHAT] Verified target node exists: "${targetNode.name}"`);
      } catch (verifyError) {
        console.log(`[MEDIA CHAT] ✗ Could not verify node: ${verifyError.message}`);
        continue;
      }

      // Set the instance swap property
      try {
        chatBlock.setProperties({ [propKeyToSwap]: nodeId });
        console.log(`[MEDIA CHAT] ✓ setProperties called successfully`);
      } catch (setPropsError) {
        console.log(`[MEDIA CHAT] ✗ setProperties failed: ${setPropsError.message}`);
        continue;
      }

      // Verify the swap actually happened
      try {
        const updatedProps = chatBlock.componentProperties;
        const newValue = updatedProps[propKeyToSwap] ? updatedProps[propKeyToSwap].value : null;
        if (newValue === nodeId) {
          console.log(`[MEDIA CHAT] ✓ Verified swap succeeded`);
        } else {
          console.log(`[MEDIA CHAT] ✗ Swap verification failed: expected ${nodeId}, got ${newValue}`);
          continue;
        }
      } catch (verifySwapError) {
        console.log(`[MEDIA CHAT] Warning: Could not verify swap: ${verifySwapError.message}`);
      }

      console.log(`[MEDIA CHAT] ✓ Swapped Chat block ${index} to ${mediaType}`);
      appliedCount++;

      // IMPORTANT: Add a small delay to allow Figma to update the node tree after the swap
      // Without this, the swapped-in component might not be discoverable yet
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now find the Media chat instance we just swapped in and apply image
      if (mediaType === 'media-chat') {
        try {
          // Find the Media chat instance within the Chat block
          // Look for "Media chat" instance - could be direct child or nested
          // Also check by the property value we just set (nodeId)
          var mediaChatInstance = null;

          // First try to get the instance directly via the node ID we just set
          try {
            const directInstance = await figma.getNodeByIdAsync(nodeId);
            if (directInstance && directInstance.type === 'COMPONENT') {
              // The nodeId points to the component, need to find the instance in the tree
              console.log('[MEDIA CHAT] Direct node is component, searching tree...');
            }
          } catch (e) {
            // Ignore - fallback to tree search
          }

          function findMediaChat(node, depth) {
            if (depth > 10) return null;
            // Check if this node is a Media chat instance
            if (node.type === 'INSTANCE') {
              var nodeName = node.name.toLowerCase();
              if (nodeName === 'media chat' || nodeName.includes('media chat')) {
                console.log('[MEDIA CHAT] Found instance: "' + node.name + '" at depth ' + depth);
                return node;
              }
              // IMPORTANT: After INSTANCE_SWAP, node.name does NOT update!
              // We must check mainComponent.parent.name (the component SET name) instead
              try {
                if (node.mainComponent && node.mainComponent.parent) {
                  var componentSetName = node.mainComponent.parent.name.toLowerCase();
                  if (componentSetName === 'media chat' || componentSetName.includes('media chat')) {
                    console.log('[MEDIA CHAT] Found instance by component set name: "' + node.mainComponent.parent.name + '" (node.name="' + node.name + '") at depth ' + depth);
                    return node;
                  }
                }
              } catch (e) {
                console.log('[MEDIA CHAT] Error checking mainComponent.parent: ' + e.message);
              }
            }
            if ('children' in node) {
              for (var c = 0; c < node.children.length; c++) {
                var found = findMediaChat(node.children[c], depth + 1);
                if (found) return found;
              }
            }
            return null;
          }

          console.log('[MEDIA CHAT] Searching for Media chat instance in Chat block "' + chatBlock.name + '"...');

          // Retry mechanism - Figma sometimes needs more time to update the tree after swap
          // Mid positions in multi-bubble blocks need longer delays
          var maxRetries = 5;
          var retryDelays = [0, 100, 200, 400, 800];

          for (var retry = 0; retry < maxRetries && !mediaChatInstance; retry++) {
            if (retry > 0) {
              console.log('[MEDIA CHAT] Retry ' + retry + '/' + (maxRetries - 1) + ' after ' + retryDelays[retry] + 'ms delay...');
              await new Promise(function(resolve) { setTimeout(resolve, retryDelays[retry]); });
            }
            mediaChatInstance = await findMediaChat(chatBlock, 0);
          }

          if (mediaChatInstance) {
            console.log('[MEDIA CHAT] Found Media chat instance: "' + mediaChatInstance.name + '"');

            // Randomize aspect ratio, landscape, and video
            console.log('[MEDIA CHAT] Randomizing aspect ratio properties...');
            await randomizeAspectRatio(mediaChatInstance);

            // Apply contextual image (pass used images to avoid duplicates)
            console.log('[MEDIA CHAT] Applying contextual image...');
            var imageUrl = pickContextualMediaImage('', usedImagesInThread);

            if (imageUrl) {
              usedImagesInThread.add(imageUrl); // Track this image as used
              console.log('[MEDIA CHAT] Selected image URL: ' + imageUrl.substring(0, 50) + '... (used: ' + usedImagesInThread.size + ')');
              await applyImageToMediaChat(mediaChatInstance, imageUrl);
              console.log('[MEDIA CHAT] ✓ Image applied to Media chat');
            } else {
              console.log('[MEDIA CHAT] No image URL returned, skipping image application');
            }
          } else {
            console.log('[MEDIA CHAT] Could not find Media chat instance within Chat block');
            // Log all children for debugging
            if ('children' in chatBlock) {
              console.log('[MEDIA CHAT] Chat block children:');
              for (var d = 0; d < chatBlock.children.length; d++) {
                var child = chatBlock.children[d];
                console.log('[MEDIA CHAT]   - "' + child.name + '" (' + child.type + ')');
              }
            }
          }
        } catch (imageError) {
          console.log('[MEDIA CHAT] Error applying image: ' + (imageError.message || imageError));
        }
      }

      // Handle Reels: Randomize profile photo and username inside IG content share
      if (mediaType === 'reels') {
        try {
          // Find the IG content share instance within the Chat block
          // Use retry mechanism since Figma may need time to update the tree after swap
          var igContentShareInstance = null;

          function findIGContentShare(node, depth) {
            if (depth > 15) return null;
            if (node.type === 'INSTANCE') {
              var nodeName = node.name.toLowerCase();
              if (nodeName === 'ig content share' || nodeName.includes('ig content share') || nodeName.includes('content share')) {
                console.log('[REELS] Found instance: "' + node.name + '" at depth ' + depth);
                return node;
              }
              // Also check if this instance's mainComponent matches our target
              try {
                if (node.mainComponent && node.mainComponent.id === nodeId) {
                  console.log('[REELS] Found instance by mainComponent ID: "' + node.name + '" at depth ' + depth);
                  return node;
                }
                // Check if mainComponent's parent (component set) is "IG content share"
                if (node.mainComponent && node.mainComponent.parent &&
                    node.mainComponent.parent.name &&
                    node.mainComponent.parent.name.toLowerCase().includes('ig content share')) {
                  console.log('[REELS] Found instance by parent component set: "' + node.name + '" at depth ' + depth);
                  return node;
                }
              } catch (e) {}
            }
            if ('children' in node) {
              for (var c = 0; c < node.children.length; c++) {
                var found = findIGContentShare(node.children[c], depth + 1);
                if (found) return found;
              }
            }
            return null;
          }

          console.log('[REELS] Searching for IG content share instance in Chat block "' + chatBlock.name + '"...');

          // Retry mechanism - Figma sometimes needs more time to update the tree after swap
          // Mid positions in multi-bubble blocks need longer delays
          const maxRetries = 5;
          const retryDelays = [0, 100, 200, 400, 800]; // Try immediately, then with increasing delays

          for (let retry = 0; retry < maxRetries && !igContentShareInstance; retry++) {
            if (retry > 0) {
              console.log(`[REELS] Retry ${retry}/${maxRetries - 1} after ${retryDelays[retry]}ms delay...`);
              await new Promise(resolve => setTimeout(resolve, retryDelays[retry]));
            }
            igContentShareInstance = findIGContentShare(chatBlock, 0);
          }

          if (igContentShareInstance) {
            console.log('[REELS] Found IG content share instance: "' + igContentShareInstance.name + '"');

            // Apply nested instance configuration (like .XMA type → Type=Reels)
            const nestedConfig = MEDIA_TYPE_NESTED_INSTANCE_CONFIG[mediaType];
            if (nestedConfig) {
              console.log('[REELS] Configuring nested instance "' + nestedConfig.nestedInstanceName + '" with ' + nestedConfig.propertyName + '="' + nestedConfig.propertyValue + '"');
              try {
                // Find the nested instance by name
                function findNestedInstance(node, targetName, depth) {
                  if (depth > 10) return null;

                  if (node.name === targetName || node.name.toLowerCase() === targetName.toLowerCase()) {
                    if (node.type === 'INSTANCE') {
                      return node;
                    }
                  }

                  if ('children' in node) {
                    for (const child of node.children) {
                      const found = findNestedInstance(child, targetName, depth + 1);
                      if (found) return found;
                    }
                  }
                  return null;
                }

                const nestedInstance = findNestedInstance(igContentShareInstance, nestedConfig.nestedInstanceName, 0);

                if (nestedInstance) {
                  console.log('[REELS] Found nested instance: "' + nestedInstance.name + '"');

                  // Get the component properties and find the matching property key
                  const nestedProps = nestedInstance.componentProperties;
                  const nestedPropKeys = Object.keys(nestedProps);
                  console.log('[REELS] Nested instance properties: ' + nestedPropKeys.join(', '));

                  // Find the property key that matches our target property name
                  let matchingKey = null;
                  for (const key of nestedPropKeys) {
                    const keyBase = key.split('#')[0].trim();
                    if (keyBase.toLowerCase() === nestedConfig.propertyName.toLowerCase()) {
                      matchingKey = key;
                      break;
                    }
                  }

                  if (matchingKey) {
                    console.log('[REELS] Setting "' + matchingKey + '" to "' + nestedConfig.propertyValue + '"');
                    nestedInstance.setProperties({ [matchingKey]: nestedConfig.propertyValue });
                    console.log('[REELS] ✓ Nested instance property set successfully!');
                  } else {
                    console.log('[REELS] Could not find property "' + nestedConfig.propertyName + '" on nested instance. Available: ' + nestedPropKeys.join(', '));
                  }
                } else {
                  console.log('[REELS] Could not find nested instance "' + nestedConfig.nestedInstanceName + '" inside IG content share');

                  // Log available children for debugging
                  function logChildren(node, prefix) {
                    if ('children' in node) {
                      for (const child of node.children) {
                        console.log('[REELS]   ' + prefix + child.name + ' (' + child.type + ')');
                      }
                    }
                  }
                  console.log('[REELS] Available children in IG content share:');
                  logChildren(igContentShareInstance, '');
                }
              } catch (nestedError) {
                console.log('[REELS] Error configuring nested instance:', nestedError.message);
              }
            }

            // Pick a random profile from PROFILE_VARIANTS (same logic as Person A selection)
            var randomProfile = PROFILE_VARIANTS[Math.floor(Math.random() * PROFILE_VARIANTS.length)];
            console.log('[REELS] Selected random profile: "' + randomProfile + '"');

            // Find and set profile photo AND username text inside the IG content share component
            // 1. Handle property on .People profile pictures controls the photo
            // 2. Title text node needs to be updated separately for the username
            var profileSet = false;
            var usernameSet = false;

            async function setReelsProfile(node, depth) {
              if (depth > 15) return;

              var nodeName = node.name;
              var nodeNameLower = nodeName.toLowerCase();

              // Look for .People profile pictures component to set the profile photo
              if (node.type === 'INSTANCE') {
                var isPeopleProfile = nodeName === '.People profile pictures' ||
                                      nodeNameLower === '.people profile pictures' ||
                                      nodeNameLower.includes('people profile pictures');

                if (isPeopleProfile) {
                  try {
                    var props = node.componentProperties;
                    var propKeys = Object.keys(props);
                    console.log('[REELS] Found profile component "' + nodeName + '" with ' + propKeys.length + ' properties');

                    for (var k = 0; k < propKeys.length; k++) {
                      var key = propKeys[k];
                      if (key.toLowerCase().includes('handle')) {
                        console.log('[REELS] Setting Handle property "' + key + '" to "' + randomProfile + '"');
                        node.setProperties({ [key]: randomProfile });
                        console.log('[REELS] ✓ Set profile photo Handle to "' + randomProfile + '"');
                        profileSet = true;
                        break;
                      }
                    }
                  } catch (e) {
                    console.log('[REELS] Could not set profile Handle:', e.message);
                  }
                }
              }

              // Look for Title text node to set the username text
              if (node.type === 'TEXT') {
                var textNameLower = nodeName.toLowerCase();
                if (textNameLower.includes('title') || textNameLower === 'username') {
                  try {
                    console.log('[REELS] Found text node "' + nodeName + '" - setting to "' + randomProfile + '"');
                    await figma.loadFontAsync(node.fontName);
                    node.characters = randomProfile;
                    console.log('[REELS] ✓ Set username text to "' + randomProfile + '"');
                    usernameSet = true;
                  } catch (e) {
                    console.log('[REELS] Could not set username text:', e.message);
                  }
                }
              }

              if ('children' in node) {
                for (var c = 0; c < node.children.length; c++) {
                  await setReelsProfile(node.children[c], depth + 1);
                }
              }
            }

            await setReelsProfile(igContentShareInstance, 0);

            if (profileSet && usernameSet) {
              console.log('[REELS] ✓ Complete! Profile photo and username both set to "' + randomProfile + '"');
            } else if (profileSet) {
              console.log('[REELS] ⚠ Profile photo set, but username text not found');
            } else if (usernameSet) {
              console.log('[REELS] ⚠ Username text set, but profile photo not found');
            } else {
              console.log('[REELS] ✗ Could not find profile or username components');
              // Debug: log all children to help identify the structure
              function logChildren(node, indent) {
                if (indent.length > 20) return;
                console.log('[REELS] ' + indent + '"' + node.name + '" (' + node.type + ')');
                  if ('children' in node) {
                    for (var c = 0; c < node.children.length; c++) {
                      logChildren(node.children[c], indent + '  ');
                    }
                  }
                }
                logChildren(igContentShareInstance, '');
            }

            // Apply random Reels image to the IG content share .Aspect ratio
            try {
              console.log('[REELS] Applying background image to IG content share...');
              var reelsImageUrl = pickReelsImage(usedImagesInThread);
              if (reelsImageUrl) {
                usedImagesInThread.add(reelsImageUrl); // Track this image as used
                console.log('[REELS] Selected image URL: ' + reelsImageUrl.substring(0, 60) + '...');
                await applyImageToReels(igContentShareInstance, reelsImageUrl);
                console.log('[REELS] ✓ Background image applied');
              } else {
                console.log('[REELS] No image URL returned, skipping image application');
              }
            } catch (reelsImageError) {
              console.log('[REELS] Error applying image: ' + (reelsImageError.message || reelsImageError));
            }
          } else {
            console.log('[REELS] Could not find IG content share instance within Chat block');
          }
        } catch (reelsError) {
          console.log('[REELS] Error setting profile: ' + (reelsError.message || reelsError));
        }

          // Handle Eyebrow text for Reels - only show in group chats (3+ people)
          try {
            console.log('[REELS EYEBROW] isGroupChat = ' + isGroupChat);

            // Find the eyebrow container/text in this Chat block
          var eyebrowNode = null;
          function findEyebrowNode(node, depth) {
            if (depth > 15 || eyebrowNode) return;
            var nodeName = node.name.toLowerCase();

            // Look for eyebrow container
            if (nodeName.includes('eyebrow')) {
              console.log('[REELS EYEBROW] Found eyebrow container: "' + node.name + '"');
              eyebrowNode = node;
              return;
            }

            if ('children' in node) {
              for (var c = 0; c < node.children.length; c++) {
                findEyebrowNode(node.children[c], depth + 1);
                if (eyebrowNode) return;
              }
            }
          }
          findEyebrowNode(chatBlock, 0);

          if (eyebrowNode) {
            if (isGroupChat && assignedProfiles) {
              // Show eyebrow in group chat - set username based on sender
              console.log('[REELS EYEBROW] Group chat - showing eyebrow with sender username');

              // Make eyebrow visible
              eyebrowNode.visible = true;

              // Determine username based on sender type (from sideType variable)
              var eyebrowUsername = '';
              if (sideType === 'sender') {
                // Person A (sender) - use random profile from list
                eyebrowUsername = assignedProfiles.A || PROFILE_VARIANTS[Math.floor(Math.random() * PROFILE_VARIANTS.length)];
                console.log('[REELS EYEBROW] Sender (Person A) - using: ' + eyebrowUsername);
              } else {
                // Person B or C (recipient) - need to match the profile photo of this Chat block
                var blockProfileNode = findProfileInBlock(chatBlock);
                if (blockProfileNode && blockProfileNode.type === 'INSTANCE') {
                  try {
                    var blockProps = blockProfileNode.componentProperties;
                    for (var bpKey of Object.keys(blockProps)) {
                      if (bpKey.toLowerCase().includes('handle')) {
                        eyebrowUsername = blockProps[bpKey].value;
                        console.log('[REELS EYEBROW] Recipient - matched profile Handle: ' + eyebrowUsername);
                        break;
                      }
                    }
                  } catch (bpError) {
                    console.log('[REELS EYEBROW] Could not get block profile:', bpError.message);
                  }
                }

                // Fallback to B or C profiles
                if (!eyebrowUsername) {
                  eyebrowUsername = assignedProfiles.B || assignedProfiles.C || 'username';
                  console.log('[REELS EYEBROW] Using fallback profile: ' + eyebrowUsername);
                }
              }

              // Find and set the text node inside eyebrow
              var eyebrowTextNode = findAdminText(eyebrowNode);
              if (!eyebrowTextNode) {
                // Try to find any text node inside eyebrow
                function findTextInEyebrow(node) {
                  if (node.type === 'TEXT') return node;
                  if ('children' in node) {
                    for (var c = 0; c < node.children.length; c++) {
                      var found = findTextInEyebrow(node.children[c]);
                      if (found) return found;
                    }
                  }
                  return null;
                }
                eyebrowTextNode = findTextInEyebrow(eyebrowNode);
              }

              if (eyebrowTextNode && eyebrowTextNode.type === 'TEXT') {
                try {
                  await figma.loadFontAsync(eyebrowTextNode.fontName);
                  eyebrowTextNode.characters = eyebrowUsername;
                  console.log('[REELS EYEBROW] ✓ Set eyebrow text to: ' + eyebrowUsername);
                } catch (fontErr) {
                  console.log('[REELS EYEBROW] Font error:', fontErr.message);
                }
              } else {
                console.log('[REELS EYEBROW] Could not find text node in eyebrow');
              }
            } else {
              // Not a group chat - hide eyebrow
              console.log('[REELS EYEBROW] Not a group chat - hiding eyebrow');
              eyebrowNode.visible = false;
            }
          } else {
            console.log('[REELS EYEBROW] No eyebrow container found in Chat block');
          }
        } catch (eyebrowError) {
          console.log('[REELS EYEBROW] Error handling eyebrow:', eyebrowError.message);
        }
      }

    } catch (error) {
      console.log(`[MEDIA CHAT] Error swapping Chat block:`, error.message);
    }
  }

  // Restore gradient states after all Media chat operations
  // Determine if gradient was originally on (any non-zero strength) or off (all zero)
  var gradientWasOn = false;
  for (var g = 0; g < gradientStates.length; g++) {
    var strengthValue = gradientStates[g].value;
    // Check if strength is non-zero (could be string "100", "90", etc. or number)
    var numValue = parseInt(strengthValue, 10);
    if (!isNaN(numValue) && numValue > 0) {
      gradientWasOn = true;
      break;
    }
  }
  console.log('[MEDIA CHAT] Gradient was originally ' + (gradientWasOn ? 'ON' : 'OFF'));

  // Re-apply gradient state using the same functions as the gradient dropdown
  if (gradientWasOn) {
    // Apply gradient (same as when user selects "Gradient" from dropdown)
    console.log('[MEDIA CHAT] Re-applying gradient pattern...');
    applyGradientToThread(threadNode);
  } else {
    // Remove gradient (same as when user selects "No gradient" from dropdown)
    console.log('[MEDIA CHAT] Ensuring gradient is OFF...');
    removeGradientFromThread(threadNode);
  }
  console.log('[MEDIA CHAT] Gradient state restored: ' + (gradientWasOn ? 'ON' : 'OFF'));

  return { applied: appliedCount, total: chatBlocks.length };
}

/**
 * Find Chat block components within the thread
 * @param {SceneNode} node - The node to search within
 * @returns {SceneNode[]} - Array of Chat block components
 */
function findChatBlockComponents(node) {
  const chatBlocks = [];

  function search(n, depth = 0) {
    if (depth > 10) return;

    const name = n.name.toLowerCase();

    // Look for "Chat block" components
    if (name === 'chat block' && n.type === 'INSTANCE') {
      chatBlocks.push(n);
      return; // Don't recurse into Chat block components
    }

    if ('children' in n) {
      for (const child of n.children) {
        search(child, depth + 1);
      }
    }
  }

  search(node);
  return chatBlocks;
}

/**
 * Remove all media chat replacements and restore original Text chats
 * Scans Chat blocks for Media chat instances and swaps them back to Text chat
 * @param {SceneNode} threadNode - The chat thread node
 * @returns {Object} - { removed: number }
 */
async function removeMediaChatFromThread(threadNode) {
  console.log('[MEDIA CHAT] Removing media chat replacements...');

  let restoredCount = 0;

  // First, restore from tracked original values (for current session changes)
  for (const [chatBlockId, data] of originalTextChatNodes) {
    try {
      const chatBlock = await figma.getNodeByIdAsync(chatBlockId);
      if (!chatBlock) {
        console.log('[MEDIA CHAT] Could not find Chat block with ID: ' + chatBlockId);
        continue;
      }

      if (data.propKey && data.originalValue) {
        console.log('[MEDIA CHAT] Restoring "' + data.propKey + '" to original value: ' + data.originalValue);
        chatBlock.setProperties({ [data.propKey]: data.originalValue });
        restoredCount++;
      }
    } catch (e) {
      console.log('[MEDIA CHAT] Error restoring Chat block:', e.message);
    }
  }

  // Clear the tracking map
  originalTextChatNodes.clear();

  // Now scan for any remaining Media chat instances in the thread
  // This handles cases where the plugin was reloaded or Media chat was applied in a previous session
  const chatBlocks = findChatBlockComponents(threadNode);
  console.log('[MEDIA CHAT] Scanning ' + chatBlocks.length + ' Chat blocks for Media chat instances...');

  for (const chatBlock of chatBlocks) {
    try {
      const props = chatBlock.componentProperties;
      const propKeys = Object.keys(props);

      // Check each INSTANCE_SWAP property to see if it's currently a Media chat
      for (const key of propKeys) {
        if (props[key].type !== 'INSTANCE_SWAP') continue;

        const currentValue = props[key].value;
        if (!currentValue) continue;

        // Get the current component to check if it's Media chat or Reels
        const currentComponent = await figma.getNodeByIdAsync(currentValue);
        if (!currentComponent) continue;

        // Check if the component or its parent is a media type we should remove
        let isMediaComponent = false;
        const compName = currentComponent.name || '';
        const parentName = currentComponent.parent ? (currentComponent.parent.name || '') : '';
        const parentType = currentComponent.parent ? currentComponent.parent.type : '';

        // Log what we're checking for debugging
        console.log('[MEDIA CHAT] Checking property "' + key + '": compName="' + compName + '", parentName="' + parentName + '", parentType="' + parentType + '"');

        // Check for Media chat or Reels (IG content share)
        // The parent of a variant is the COMPONENT_SET
        if (parentName === 'Media chat' || parentName === 'Reels' || parentName === 'IG content share' ||
            compName.toLowerCase().includes('media chat') || compName.toLowerCase().includes('reels') ||
            compName.toLowerCase().includes('ig content share')) {
          isMediaComponent = true;
          console.log('[MEDIA CHAT]   → IS media component!');
        }

        // Also check if it's NOT a Text chat (which is what we want to keep)
        if (!isMediaComponent && parentName !== 'Text chat' && !compName.toLowerCase().includes('text chat')) {
          // Could be a media component with unexpected naming - log for debugging
          console.log('[MEDIA CHAT]   → NOT Text chat, NOT known media type - could be unrecognized media');
        }

        if (!isMediaComponent) continue;

        console.log('[MEDIA CHAT] Found Media chat in "' + key + '" - looking for Text chat replacement...');

        // Determine what Text chat variant we need
        // Parse the key to get position info (e.g., "Sender (top)" -> sender, top)
        const keyLower = key.toLowerCase();
        let sideType = keyLower.includes('sender') ? 'Sender' : 'Recipient';
        let bubbleType = 'Single';
        if (keyLower.includes('top')) bubbleType = 'Top';
        else if (keyLower.includes('mid')) bubbleType = 'Middle';
        else if (keyLower.includes('bottom')) bubbleType = 'Bottom';
        else if (keyLower.includes('single')) bubbleType = 'Single';

        console.log('[MEDIA CHAT] Need Text chat with To - From=' + sideType + ', Chat bubble=' + bubbleType);

        // Find the Text chat component set and get the matching variant
        let textChatNodeId = null;

        // Strategy 1: Look in preferredValues for Text chat component set
        if (props[key].preferredValues && Array.isArray(props[key].preferredValues)) {
          for (const preferred of props[key].preferredValues) {
            if (preferred.type === 'COMPONENT_SET' && preferred.key) {
              try {
                const importedComponentSet = await figma.importComponentSetByKeyAsync(preferred.key);
                if (importedComponentSet && importedComponentSet.name === 'Text chat') {
                  console.log('[MEDIA CHAT] Found Text chat component set');

                  // Find the matching variant
                  for (const child of importedComponentSet.children) {
                    if (child.type !== 'COMPONENT') continue;

                    const nameParts = child.name.split(',').map(function(p) { return p.trim(); });
                    let variantSide = null;
                    let variantBubble = null;

                    for (const part of nameParts) {
                      if (part.startsWith('To - From=')) {
                        variantSide = part.split('=')[1].trim();
                      } else if (part.startsWith('Chat bubble=')) {
                        variantBubble = part.split('=')[1].trim();
                      }
                    }

                    if (variantSide === sideType && variantBubble === bubbleType) {
                      textChatNodeId = child.id;
                      console.log('[MEDIA CHAT] Found matching Text chat variant: "' + child.name + '"');
                      break;
                    }
                  }
                  if (textChatNodeId) break;
                }
              } catch (importError) {
                console.log('[MEDIA CHAT] Could not import component set:', importError.message);
              }
            }
          }
        }

        // Strategy 2: Search document for Text chat component set
        if (!textChatNodeId) {
          const textChatSets = figma.root.findAll(function(n) {
            return n.type === 'COMPONENT_SET' && n.name === 'Text chat';
          });

          for (const componentSet of textChatSets) {
            for (const child of componentSet.children) {
              if (child.type !== 'COMPONENT') continue;

              const nameParts = child.name.split(',').map(function(p) { return p.trim(); });
              let variantSide = null;
              let variantBubble = null;

              for (const part of nameParts) {
                if (part.startsWith('To - From=')) {
                  variantSide = part.split('=')[1].trim();
                } else if (part.startsWith('Chat bubble=')) {
                  variantBubble = part.split('=')[1].trim();
                }
              }

              if (variantSide === sideType && variantBubble === bubbleType) {
                textChatNodeId = child.id;
                console.log('[MEDIA CHAT] Found matching Text chat variant in document: "' + child.name + '"');
                break;
              }
            }
            if (textChatNodeId) break;
          }
        }

        if (textChatNodeId) {
          console.log('[MEDIA CHAT] Restoring "' + key + '" to Text chat (ID: ' + textChatNodeId + ')');
          chatBlock.setProperties({ [key]: textChatNodeId });
          restoredCount++;
        } else {
          console.log('[MEDIA CHAT] Could not find Text chat variant for ' + sideType + '/' + bubbleType);
        }
      }
    } catch (e) {
      console.log('[MEDIA CHAT] Error scanning Chat block:', e.message);
    }
  }

  console.log('[MEDIA CHAT] Restored ' + restoredCount + ' properties to Text chat');

  return { removed: restoredCount };
}

// ============================================================================
// GRADIENT: Apply gradient strength to .Gradient step instances
// ============================================================================

/**
 * Check if a node is a .Gradient step instance
 */
function isGradientStepInstance(node) {
  if (node.type !== "INSTANCE") {
    return false;
  }

  // Check instance name (case-insensitive, flexible matching)
  var nodeName = node.name.toLowerCase();
  if (nodeName.includes("gradient step") || nodeName.includes(".gradient step")) {
    return true;
  }

  // Also check the main component name if available
  try {
    var mainComponent = node.mainComponent;
    if (mainComponent) {
      var componentName = mainComponent.name.toLowerCase();
      if (componentName.includes("gradient step") || componentName.includes(".gradient step")) {
        return true;
      }
    }
  } catch (e) {
    // mainComponent may not be accessible
  }

  return false;
}

/**
 * Find all .Gradient step instances within a node
 */
function findGradientStepInstances(node) {
  var instances = [];

  // Use Figma's built-in findAll method which properly traverses all descendants
  if (typeof node.findAll === "function") {
    try {
      instances = node.findAll(function(n) {
        return isGradientStepInstance(n);
      });
      if (instances.length > 0) {
        return instances;
      }
    } catch (e) {
      // Fall back to manual traversal if findAll fails
    }
  }

  // Manual deep traversal to ensure we find instances nested in components
  function traverse(current, depth) {
    if (!current || depth <= 0) {
      return;
    }

    if (isGradientStepInstance(current)) {
      instances.push(current);
    }

    // Try to access children
    try {
      if (current.children && current.children.length > 0) {
        for (var i = 0; i < current.children.length; i++) {
          traverse(current.children[i], depth - 1);
        }
      }
    } catch (e) {
      // Children might not be accessible
    }
  }

  traverse(node, 15); // Search up to 15 levels deep
  return instances;
}

/**
 * Get absolute Y position of a node
 */
function getAbsoluteY(node) {
  var y = 0;
  var current = node;
  while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
    if ("y" in current) {
      y += current.y;
    }
    current = current.parent;
  }
  return y;
}

/**
 * Get frame bounds for clipping calculations
 */
function getFrameBounds(frame) {
  var absY = getAbsoluteY(frame);
  return {
    top: absY,
    bottom: absY + frame.height,
    height: frame.height
  };
}

/**
 * Check if an instance is partially visible within frame bounds
 */
function isPartiallyVisible(instance, frameBounds) {
  var instanceY = getAbsoluteY(instance);
  var instanceTop = instanceY;
  var instanceBottom = instanceY + instance.height;

  return instanceBottom > frameBounds.top && instanceTop < frameBounds.bottom;
}

/**
 * Check if an instance is clipped at top
 */
function isClippedAtTop(instance, frameBounds) {
  var instanceY = getAbsoluteY(instance);
  return instanceY < frameBounds.top;
}

/**
 * Check if an instance is clipped at bottom
 */
function isClippedAtBottom(instance, frameBounds) {
  var instanceY = getAbsoluteY(instance);
  var instanceBottom = instanceY + instance.height;
  return instanceBottom > frameBounds.bottom;
}

/**
 * Get the visible bounds of a node, accounting for clipping parents.
 * This calculates the intersection of the node's bounds with any ancestor
 * frames that have clipsContent: true, giving us only the visible portion.
 * @param {SceneNode} node - The node to get visible bounds for
 * @returns {Object} - { x, y, width, height, clippingParent } of the visible area, plus the clipping parent frame
 */
function getVisibleBounds(node) {
  const nodeBounds = node.absoluteBoundingBox;
  if (!nodeBounds) {
    console.log('[VISIBLE BOUNDS] No bounds for node');
    return null;
  }

  let visibleBounds = {
    x: nodeBounds.x,
    y: nodeBounds.y,
    width: nodeBounds.width,
    height: nodeBounds.height,
    clippingParent: null
  };

  let parent = node.parent;
  let clippingParentFound = false;

  while (parent && parent.type !== 'PAGE' && parent.type !== 'DOCUMENT') {
    if (parent.clipsContent && parent.absoluteBoundingBox) {
      // Keep track of the innermost (first) clipping parent for sticker placement
      if (!clippingParentFound) {
        visibleBounds.clippingParent = parent;
      }
      clippingParentFound = true;
      const clipBounds = parent.absoluteBoundingBox;

      const newX = Math.max(visibleBounds.x, clipBounds.x);
      const newY = Math.max(visibleBounds.y, clipBounds.y);
      const newRight = Math.min(visibleBounds.x + visibleBounds.width, clipBounds.x + clipBounds.width);
      const newBottom = Math.min(visibleBounds.y + visibleBounds.height, clipBounds.y + clipBounds.height);

      visibleBounds.x = newX;
      visibleBounds.y = newY;
      visibleBounds.width = Math.max(0, newRight - newX);
      visibleBounds.height = Math.max(0, newBottom - newY);

      console.log(`[VISIBLE BOUNDS] Clipped by "${parent.name}" → visible area: ${visibleBounds.width.toFixed(0)} x ${visibleBounds.height.toFixed(0)}`);
    }
    parent = parent.parent;
  }

  if (!clippingParentFound) {
    console.log('[VISIBLE BOUNDS] No clipping parent found, using full bounds');
  }

  return visibleBounds;
}

/**
 * Check if a node is within the visible bounds (at least partially)
 * @param {SceneNode} node - The node to check
 * @param {Object} visibleBounds - The visible bounds to check against
 * @returns {boolean} - True if the node is at least partially visible
 */
function isNodeInVisibleBounds(node, visibleBounds) {
  const nodeBounds = node.absoluteBoundingBox;
  if (!nodeBounds || !visibleBounds) return false;

  const nodeLeft = nodeBounds.x;
  const nodeRight = nodeBounds.x + nodeBounds.width;
  const nodeTop = nodeBounds.y;
  const nodeBottom = nodeBounds.y + nodeBounds.height;

  const visLeft = visibleBounds.x;
  const visRight = visibleBounds.x + visibleBounds.width;
  const visTop = visibleBounds.y;
  const visBottom = visibleBounds.y + visibleBounds.height;

  return nodeRight > visLeft && nodeLeft < visRight &&
         nodeBottom > visTop && nodeTop < visBottom;
}

/**
 * Set the Strength property on a gradient step instance
 */
function setStrengthProperty(instance, strength) {
  try {
    var componentProperties = instance.componentProperties;

    // Find the Strength property key (case-insensitive, may have a suffix like "Strength#1234")
    var strengthKey = null;
    for (var key in componentProperties) {
      var keyLower = key.toLowerCase();
      if (keyLower === "strength" || keyLower.startsWith("strength#")) {
        strengthKey = key;
        break;
      }
    }

    if (strengthKey) {
      var propDef = componentProperties[strengthKey];
      var propsToSet = {};

      // Handle different property types
      if (propDef.type === "VARIANT") {
        propsToSet[strengthKey] = strength.toString();
      } else if (propDef.type === "TEXT") {
        propsToSet[strengthKey] = strength.toString();
      } else if (propDef.type === "BOOLEAN") {
        propsToSet[strengthKey] = strength >= 50;
      } else {
        propsToSet[strengthKey] = strength.toString();
      }

      instance.setProperties(propsToSet);
      return true;
    }
  } catch (e) {
    console.log('[GRADIENT] Error setting strength property:', e.message);
  }
  return false;
}

/**
 * Process a container and apply gradient strengths to all gradient step instances
 */
function processGradientContainer(container) {
  var allInstances = findGradientStepInstances(container);

  // For groups, don't filter by visibility since groups don't clip content
  // For frames with clipsContent, filter to only visible instances
  var instances = [];
  var shouldFilterByVisibility = container.type === "FRAME" && container.clipsContent === true;
  var frameBounds = getFrameBounds(container);

  if (shouldFilterByVisibility) {
    for (var i = 0; i < allInstances.length; i++) {
      if (isPartiallyVisible(allInstances[i], frameBounds)) {
        instances.push(allInstances[i]);
      }
    }
  } else {
    instances = allInstances;
  }

  if (instances.length === 0) {
    return { updatedCount: 0, totalCount: 0 };
  }

  // Sort instances by Y position (bottom to top)
  instances.sort(function(a, b) {
    var aY = getAbsoluteY(a) + (a.height / 2);
    var bY = getAbsoluteY(b) + (b.height / 2);
    return bY - aY; // Descending order (bottom first)
  });

  var updatedCount = 0;

  // Check for clipping at edges
  var topInstance = instances[instances.length - 1];
  var bottomInstance = instances[0];
  var topIsClipped = shouldFilterByVisibility && isClippedAtTop(topInstance, frameBounds);
  var bottomIsClipped = shouldFilterByVisibility && isClippedAtBottom(bottomInstance, frameBounds);

  // Assign strength values
  for (var i = 0; i < instances.length; i++) {
    var instance = instances[i];
    var strength;

    if (i === 0 && bottomIsClipped) {
      strength = 0;
    } else if (i === instances.length - 1 && topIsClipped) {
      strength = 100;
    } else {
      strength = i * 10;
    }

    if (setStrengthProperty(instance, strength)) {
      updatedCount++;
    }
  }

  return { updatedCount: updatedCount, totalCount: instances.length };
}

/**
 * Apply gradient to a thread node
 */
function applyGradientToThread(threadNode) {
  console.log('[GRADIENT] Applying gradient to thread...');

  var result = processGradientContainer(threadNode);

  if (result.totalCount === 0) {
    console.log('[GRADIENT] No .Gradient step instances found');
    return { applied: 0, total: 0 };
  }

  console.log(`[GRADIENT] Updated ${result.updatedCount} of ${result.totalCount} gradient steps`);
  return { applied: result.updatedCount, total: result.totalCount };
}

/**
 * Remove gradient (reset all strengths to 0)
 */
function removeGradientFromThread(threadNode) {
  console.log('[GRADIENT] Removing gradient from thread...');

  var instances = findGradientStepInstances(threadNode);

  if (instances.length === 0) {
    console.log('[GRADIENT] No .Gradient step instances found');
    return { removed: 0, total: 0 };
  }

  var removedCount = 0;
  for (var i = 0; i < instances.length; i++) {
    if (setStrengthProperty(instances[i], 0)) {
      removedCount++;
    }
  }

  console.log(`[GRADIENT] Reset ${removedCount} of ${instances.length} gradient steps to 0`);
  return { removed: removedCount, total: instances.length };
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

  if (msg.type === 'shuffle-reactions') {
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

    console.log(`[REACTION] Shuffling reactions at ${percentage}% (isGroupChat: ${isGroupChat})`);
    const result = applyReactionsToThread(threadNode, percentage, isGroupChat);

    if (result.total === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'No Text chat components found in selection'
      });
    } else {
      figma.ui.postMessage({
        type: 'success',
        message: `Shuffled reactions on ${result.applied} of ${result.total} messages`
      });
    }
    return;
  }

  if (msg.type === 'apply-stickers') {
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

    console.log(`[STICKER] Applying stickers at ${percentage}%`);

    try {
      // First remove any existing stickers
      removeStickersFromThread(threadNode);

      // Then apply new stickers
      const result = await applyStickersToThread(threadNode, percentage);

      if (result.total === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'No chat components found in selection'
        });
      } else {
        figma.ui.postMessage({
          type: 'success',
          message: `Applied ${result.applied} stickers around messages`
        });
      }
    } catch (error) {
      console.log(`[STICKER] Error:`, error.message);
      figma.ui.postMessage({
        type: 'error',
        message: `Error applying stickers: ${error.message}`
      });
    }
    return;
  }

  if (msg.type === 'remove-stickers') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first'
      });
      return;
    }

    const threadNode = selection[0];
    console.log('[STICKER] Removing all stickers');
    const result = removeStickersFromThread(threadNode);

    figma.ui.postMessage({
      type: 'success',
      message: `Removed ${result.removed} stickers`
    });
    return;
  }

  if (msg.type === 'apply-gradient') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first'
      });
      return;
    }

    const threadNode = selection[0];
    console.log('[GRADIENT] Applying gradient');
    const result = applyGradientToThread(threadNode);

    if (result.total === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'No .Gradient step instances found in selection'
      });
    } else {
      figma.ui.postMessage({
        type: 'success',
        message: `Applied gradient to ${result.applied} of ${result.total} gradient steps`
      });
    }
    return;
  }

  if (msg.type === 'remove-gradient') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first'
      });
      return;
    }

    const threadNode = selection[0];
    console.log('[GRADIENT] Removing gradient');
    const result = removeGradientFromThread(threadNode);

    if (result.total === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'No .Gradient step instances found in selection'
      });
    } else {
      figma.ui.postMessage({
        type: 'success',
        message: `Removed gradient from ${result.removed} gradient steps`
      });
    }
    return;
  }

  if (msg.type === 'apply-media-chat') {
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
    const mediaTypes = msg.mediaTypes;

    console.log(`[MEDIA CHAT] Applying media chat at ${percentage}% with types:`, mediaTypes);

    try {
      // First remove any existing media replacements (MUST await this!)
      await removeMediaChatFromThread(threadNode);

      // Then apply new media chat
      const result = await applyMediaChatToThread(threadNode, percentage, mediaTypes);

      if (result.total === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'No Text chat components found in selection'
        });
      } else {
        figma.ui.postMessage({
          type: 'success',
          message: `Replaced ${result.applied} messages with media content`
        });
      }
    } catch (error) {
      console.log(`[MEDIA CHAT] Error:`, error.message);
      figma.ui.postMessage({
        type: 'error',
        message: `Error applying media chat: ${error.message}`
      });
    }
    return;
  }

  if (msg.type === 'shuffle-media-content') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first'
      });
      return;
    }

    const threadNode = selection[0];
    const mediaTypes = msg.mediaTypes || [];

    console.log(`[SHUFFLE] Shuffling media content for types:`, mediaTypes);

    try {
      const result = await shuffleMediaContent(threadNode, mediaTypes);

      figma.ui.postMessage({
        type: 'success',
        message: `Shuffled ${result.shuffled} media items`
      });
    } catch (error) {
      console.log(`[SHUFFLE] Error:`, error.message);
      figma.ui.postMessage({
        type: 'error',
        message: `Error shuffling media: ${error.message}`
      });
    }
    return;
  }

  if (msg.type === 'remove-media-chat') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first'
      });
      return;
    }

    const threadNode = selection[0];
    console.log('[MEDIA CHAT] Removing all media chat');

    // removeMediaChatFromThread is now async
    removeMediaChatFromThread(threadNode).then(function(result) {
      figma.ui.postMessage({
        type: 'success',
        message: 'Removed ' + result.removed + ' media replacements and restored Text chats'
      });
    }).catch(function(error) {
      console.log('[MEDIA CHAT] Error removing media chat:', error.message);
      figma.ui.postMessage({
        type: 'error',
        message: 'Error removing media chat: ' + error.message
      });
    });
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
                // Use Person B and Person C's usernames for the title
                const groupTitle = `${profilesAssigned.B}, ${profilesAssigned.C}`;
                console.log(`[HEADER TEXT] Setting Title to: "${groupTitle}"`);
                await setTextNodeContent(titleNode, groupTitle);
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

  // ============================================================================
  // ADJUST-LENGTH HANDLER
  // Adjusts conversation length by showing/hiding Chat Blocks based on target height
  // Works independently of topic selection - operates on existing conversation
  // ============================================================================
  if (msg.type === 'adjust-length') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a Chat Thread component first'
      });
      return;
    }

    const threadNode = selection[0];
    const targetHeight = msg.targetHeight || 2200;

    console.log(`[ADJUST-LENGTH] Target height: ${targetHeight}px`);

    // Find the Chat thread window that contains the chat blocks
    const chatWindow = findChatThreadWindow(threadNode);
    if (!chatWindow) {
      console.log('[ADJUST-LENGTH] Could not find Chat thread window');
      figma.ui.postMessage({
        type: 'error',
        message: 'Could not find Chat thread window in selection'
      });
      return;
    }

    // Find all Chat block components
    const chatBlocks = findChatBlockComponents(threadNode);
    if (chatBlocks.length === 0) {
      console.log('[ADJUST-LENGTH] No Chat blocks found');
      figma.ui.postMessage({
        type: 'error',
        message: 'No Chat blocks found in selection'
      });
      return;
    }

    // Sort chat blocks by vertical position (top to bottom)
    chatBlocks.sort((a, b) => {
      const aY = a.absoluteTransform[1][2];
      const bY = b.absoluteTransform[1][2];
      return aY - bY;
    });

    console.log(`[ADJUST-LENGTH] Found ${chatBlocks.length} Chat blocks`);

    // Get the starting Y position (top of first block)
    const startY = chatBlocks[0].absoluteTransform[1][2];
    let visibleCount = 0;
    let hiddenCount = 0;

    // Show/hide blocks based on cumulative height
    for (const block of chatBlocks) {
      const blockY = block.absoluteTransform[1][2];
      const blockBottom = blockY + block.height;
      const relativeBottom = blockBottom - startY;

      // Check if this block fits within the target height
      if (relativeBottom <= targetHeight) {
        // Show this block
        block.visible = true;
        visibleCount++;
      } else {
        // Hide this block
        block.visible = false;
        hiddenCount++;
      }
    }

    console.log(`[ADJUST-LENGTH] Visible: ${visibleCount}, Hidden: ${hiddenCount}`);

    figma.ui.postMessage({
      type: 'success',
      message: `Adjusted length: ${visibleCount} message${visibleCount !== 1 ? 's' : ''} visible`
    });

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
