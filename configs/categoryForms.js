// Category form configurations for backend validation and pricing
const CATEGORY_FORMS = {
  ANIMAL: { name: 'Animals', price: 49, freePosts: 1 },
  BIRD: { name: 'Birds', price: 49, freePosts: 1 },
  TREE: { name: 'Trees', price: 49, freePosts: 1 },
  PADDY_RICE: { name: 'Paddy/Rice', price: 49, freePosts: 1 },
  VEGETABLE: { name: 'Vegetables', price: 29, freePosts: 1 },
  SEED: { name: 'Seeds', price: 29, freePosts: 1 },
  FRUIT: { name: 'Fruits', price: 49, freePosts: 1 },
  CAR: { name: 'Cars', price: 199, freePosts: 0 },
  BIKE: { name: 'Bikes', price: 99, freePosts: 0 },
  MACHINERY: { name: 'Machinery', price: 49, freePosts: 1 },
  PROPERTY: { name: 'Properties', price: 199, freePosts: 0 },
  ELECTRONICS: { name: 'Electronics', price: 49, freePosts: 1 },
  MOBILE: { name: 'Mobiles', price: 49, freePosts: 1 },
  FURNITURE: { name: 'Furniture', price: 49, freePosts: 1 },
  FASHION: { name: 'Fashion', price: 29, freePosts: 1 },
  JOB: { name: 'Jobs', price: 49, freePosts: 1 },
  PET: { name: 'Pets', price: 29, freePosts: 1 },
  MUSIC_INSTRUMENT: { name: 'Musical instruments', price: 29, freePosts: 1 },
  GYM_EQUIPMENT: { name: 'Gym & Fitness', price: 29, freePosts: 1 },
  FISH: { name: 'Fishes', price: 29, freePosts: 1 },
  VEHICLE: { name: 'Vehicle', price: 149, freePosts: 0 },
  SERVICE: { name: 'Other Services', price: 49, freePosts: 1 },
  SCRAP: { name: 'Scrap', price: 0, freePosts: 999 },
  SPORTS_ITEM: { name: 'Sports Items', price: 29, freePosts: 1 },
  BOOK: { name: 'Books', price: 0, freePosts: 999 }
}

const getCategoryForm = (categoryName) => {
  if (!categoryName) return null
  
  const categoryKey = Object.keys(CATEGORY_FORMS).find(key => 
    CATEGORY_FORMS[key].name.toLowerCase() === categoryName.toLowerCase()
  )
  return CATEGORY_FORMS[categoryKey] || null
}

const getPostCost = async (userId, categoryName) => {
  const UserPost = require('../model/userPost');
  const userPost = await UserPost.findOrCreate(userId);
  return userPost.getPostCost(categoryName);
}

const canPostForFree = async (userId, categoryName) => {
  const UserPost = require('../model/userPost');
  const userPost = await UserPost.findOrCreate(userId);
  return userPost.canPostForFree(categoryName);
}

module.exports = {
  CATEGORY_FORMS,
  getCategoryForm,
  getPostCost,
  canPostForFree
}
