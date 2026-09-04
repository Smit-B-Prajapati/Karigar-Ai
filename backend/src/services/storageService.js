import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'karigar_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create data directory:', e.message);
  }
}

// Initial seed data if no store file exists yet
const getDefaultStore = () => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('password123', salt);

  const rameshId = '65d000000000000000000001';
  const tishaId = '65d000000000000000000002';

  return {
    users: [
      {
        _id: rameshId,
        name: 'Rameshbhai Prajapati',
        email: 'ramesh@karigar.in',
        phone: '9876543210',
        password: hashedPassword,
        preferredLanguage: 'EN',
        location: 'Kutch, Gujarat',
        storeName: 'Mitti Karigar Handicrafts',
        craftType: 'Terracotta & Blue Pottery',
        experienceYears: 18,
        upiId: 'ramesh.prajapati@upi',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        _id: tishaId,
        name: 'mevawalatisha',
        email: 'mevawalatisha@gmail.com',
        phone: '9876543211',
        password: hashedPassword,
        preferredLanguage: 'HI',
        location: 'Gujarat, India',
        storeName: "mevawalatisha's Craft Studio",
        craftType: 'Indian Handicrafts & Textiles',
        experienceYears: 5,
        upiId: 'mevawalatisha@upi',
        avatar: '',
        createdAt: new Date().toISOString(),
      },
    ],
    products: [
      {
        _id: '65d000000000000000000011',
        artisan: rameshId,
        name: 'Kutch Silk Bandhani Dupatta',
        description: 'Authentic Gujarati Bandhani dupatta hand-tied with thousands of intricate micro-knots and dyed in vibrant organic madder red and turmeric yellow.',
        category: 'Textiles & Apparel',
        material: 'Pure Mulberry Silk',
        craftType: 'Tie-Dye Bandhani',
        price: 2450,
        materialCost: 750,
        labourCost: 350,
        packagingCost: 50,
        otherCost: 50,
        originalImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
        enhancedImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
        status: 'Market-Ready',
        tags: ['Bandhani', 'SilkDupatta', 'Handloom', 'EthicalFashion', 'KutchCraft'],
        language: 'EN',
        createdAt: new Date().toISOString(),
      },
      {
        _id: '65d000000000000000000012',
        artisan: rameshId,
        name: 'Handcrafted Jute Embroidered Tote Bag',
        description: 'Sustainable heavy-duty natural jute tote bag decorated with traditional Rabari thread work embroidery, wooden beads, and brass zip closures.',
        category: 'Bags & Accessories',
        material: 'Eco-Friendly Jute & Cotton Canvas',
        craftType: 'Mirror Work Embroidery',
        price: 890,
        materialCost: 220,
        labourCost: 140,
        packagingCost: 20,
        otherCost: 0,
        originalImage: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80',
        enhancedImage: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80',
        status: 'Market-Ready',
        tags: ['JuteBag', 'HandmadeTote', 'EcoFriendly', 'MirrorWork'],
        language: 'EN',
        createdAt: new Date().toISOString(),
      },
      {
        _id: '65d000000000000000000013',
        artisan: tishaId,
        name: 'Handcrafted Festive Silk Rakhi & Scarf',
        description: 'Handmade festive artisanal creation with fine golden zardozi threadwork, natural wooden embellishments, and eco-friendly cotton tassel.',
        category: 'Textiles & Apparel',
        material: 'Pure Silk & Zari Thread',
        craftType: 'Hand Embroidery',
        price: 750,
        materialCost: 250,
        labourCost: 200,
        packagingCost: 50,
        otherCost: 0,
        originalImage: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=600&q=80',
        enhancedImage: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=600&q=80',
        status: 'Market-Ready',
        tags: ['Handmade', 'Festive', 'Silk', 'Zardozi'],
        language: 'HI',
        createdAt: new Date().toISOString(),
      },
    ],
  };
};

/**
 * Load store from disk
 */
export const loadStore = () => {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.products)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading karigar_store.json, creating fallback:', err.message);
  }

  const defaultStore = getDefaultStore();
  saveStore(defaultStore);
  return defaultStore;
};

/**
 * Save store to disk
 */
export const saveStore = (data) => {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to karigar_store.json:', err.message);
  }
};

/**
 * Persist or update user in store
 */
export const persistUser = (userDoc) => {
  try {
    const store = loadStore();
    const plainUser = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
    const strId = String(plainUser._id || plainUser.id);
    plainUser._id = strId;

    const existingIdx = store.users.findIndex(
      (u) => String(u._id) === strId || (u.email && plainUser.email && u.email.toLowerCase() === plainUser.email.toLowerCase())
    );

    if (existingIdx >= 0) {
      store.users[existingIdx] = { ...store.users[existingIdx], ...plainUser };
    } else {
      store.users.push(plainUser);
    }

    saveStore(store);
  } catch (err) {
    console.error('persistUser error:', err.message);
  }
};

/**
 * Persist or update product in store
 */
export const persistProduct = (productDoc) => {
  try {
    const store = loadStore();
    const plainProd = typeof productDoc.toObject === 'function' ? productDoc.toObject() : { ...productDoc };
    const strId = String(plainProd._id || plainProd.id);
    plainProd._id = strId;
    if (plainProd.artisan && typeof plainProd.artisan === 'object' && plainProd.artisan._id) {
      plainProd.artisan = String(plainProd.artisan._id);
    } else if (plainProd.artisan) {
      plainProd.artisan = String(plainProd.artisan);
    }

    const existingIdx = store.products.findIndex((p) => String(p._id) === strId);
    if (existingIdx >= 0) {
      store.products[existingIdx] = { ...store.products[existingIdx], ...plainProd };
    } else {
      store.products.push(plainProd);
    }

    saveStore(store);
  } catch (err) {
    console.error('persistProduct error:', err.message);
  }
};

/**
 * Remove product from store
 */
export const removeStoredProduct = (productId) => {
  try {
    const store = loadStore();
    const strId = String(productId);
    store.products = store.products.filter((p) => String(p._id) !== strId);
    saveStore(store);
  } catch (err) {
    console.error('removeStoredProduct error:', err.message);
  }
};

/**
 * Synchronize all stored users and products into active MongoDB connection
 */
export const syncFromStoreToMongo = async (mongooseInstance) => {
  try {
    const store = loadStore();
    const db = mongooseInstance.connection.db;
    if (!db) {
      console.warn('MongoDB connection db not ready for sync');
      return;
    }

    const usersCol = db.collection('users');
    const productsCol = db.collection('products');

    const { ObjectId } = mongooseInstance.Types;

    // 1. Sync users
    for (const u of store.users) {
      try {
        const query = {
          $or: [
            { email: u.email ? u.email.toLowerCase() : '____no_match____' },
          ],
        };
        if (u._id && ObjectId.isValid(u._id)) {
          query.$or.push({ _id: new ObjectId(u._id) });
        }

        const existing = await usersCol.findOne(query);
        const userObjId = u._id && ObjectId.isValid(u._id) ? new ObjectId(u._id) : (existing ? existing._id : new ObjectId());

        const docToUpsert = {
          ...u,
          _id: userObjId,
          email: u.email ? u.email.toLowerCase() : undefined,
          updatedAt: new Date(),
        };

        if (existing) {
          await usersCol.updateOne({ _id: existing._id }, { $set: docToUpsert });
        } else {
          docToUpsert.createdAt = u.createdAt ? new Date(u.createdAt) : new Date();
          await usersCol.insertOne(docToUpsert);
        }
      } catch (uErr) {
        console.warn(`Sync user ${u.email} error:`, uErr.message);
      }
    }

    // 2. Sync products
    for (const p of store.products) {
      try {
        let prodObjId;
        if (p._id && ObjectId.isValid(p._id)) {
          prodObjId = new ObjectId(p._id);
        } else {
          prodObjId = new ObjectId();
        }

        let artisanObjId;
        if (p.artisan && ObjectId.isValid(p.artisan)) {
          artisanObjId = new ObjectId(p.artisan);
        } else {
          // If artisan string is an email or non-objectId, look up user
          const matchedUser = await usersCol.findOne({
            $or: [
              { email: p.artisan ? String(p.artisan).toLowerCase() : '____' },
              { name: p.artisan ? String(p.artisan) : '____' }
            ]
          });
          artisanObjId = matchedUser ? matchedUser._id : new ObjectId('65d000000000000000000001');
        }

        const prodToUpsert = {
          ...p,
          _id: prodObjId,
          artisan: artisanObjId,
          price: Number(p.price) || 0,
          materialCost: Number(p.materialCost) || 0,
          labourCost: Number(p.labourCost) || 0,
          updatedAt: new Date(),
        };

        const existing = await productsCol.findOne({ _id: prodObjId });
        if (existing) {
          await productsCol.updateOne({ _id: prodObjId }, { $set: prodToUpsert });
        } else {
          prodToUpsert.createdAt = p.createdAt ? new Date(p.createdAt) : new Date();
          await productsCol.insertOne(prodToUpsert);
        }
      } catch (pErr) {
        console.warn(`Sync product ${p.name} error:`, pErr.message);
      }
    }

    console.log(`💾 Synced persistent store to MongoDB: ${store.users.length} users, ${store.products.length} products`);
  } catch (err) {
    console.error('syncFromStoreToMongo general error:', err.message);
  }
};
